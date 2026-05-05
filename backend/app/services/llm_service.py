"""
LLM Service — Orchestrates Mistral AI with MCP tool calling.
"""

import json
import logging
from typing import Any, AsyncGenerator

from mistralai.client.sdk import Mistral

from app.config import settings
from app.services.mcp_client import mcp_client

logger = logging.getLogger(__name__)


class LLMService:
    """Handles LLM interaction with Mistral AI and MCP tool orchestration."""

    SYSTEM_PROMPT = """You are an intelligent AI assistant with access to powerful tools. You can:

1. **Web Search** (web_search): Search the internet for current information, news, facts, and real-time data.
2. **Database Query** (query_database): Execute SQL SELECT queries on a PostgreSQL database containing products and sales data.
3. **Database Analysis** (analyze_database): Get statistical analysis, schema info, and distributions for database tables.
4. **Summarize** (summarize_text): Condense long text into concise, detailed, or bullet-point summaries.

Available database tables:
- **products**: id, name, category, price, stock_quantity, rating, created_at
- **sales**: id, product_id, quantity, total_amount, customer_region, sale_date

Guidelines:
- Use tools when appropriate to provide accurate, data-driven responses.
- For database questions, write proper SQL queries.
- For web searches, formulate clear search queries.
- Always cite sources when using web search results.
- Present data in a clear, readable format using markdown tables when appropriate.
- Be conversational and helpful."""

    def __init__(self):
        self.client = Mistral(api_key=settings.mistral_api_key)
        self.model = "mistral-large-latest"

    async def generate_response(
        self,
        user_message: str,
        conversation_history: list[dict],
    ) -> dict[str, Any]:
        """Generate a response using Mistral with MCP tool calling.

        Returns a dict with 'content', 'tool_calls', and 'sources'.
        """
        # Build messages array
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]

        # Add conversation history (last 20 messages for context window)
        for msg in conversation_history[-20:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Get available tools from MCP server
        try:
            tools = await mcp_client.list_tools()
            tool_definitions = mcp_client.get_tool_definitions_for_llm(tools)
        except Exception as e:
            logger.error(f"Failed to list MCP tools: {e}")
            tool_definitions = []

        all_tool_calls = []
        all_sources = []

        # Tool-calling loop (max 5 iterations to prevent infinite loops)
        for iteration in range(5):
            try:
                # Call Mistral API
                kwargs = {
                    "model": self.model,
                    "messages": messages,
                }
                if tool_definitions:
                    kwargs["tools"] = tool_definitions
                    kwargs["tool_choice"] = "auto"

                response = await self.client.chat.complete_async(**kwargs)
                choice = response.choices[0]
                assistant_message = choice.message

                # Check if the model wants to call tools
                if assistant_message.tool_calls:
                    # Add assistant message with tool calls to history
                    messages.append(
                        {
                            "role": "assistant",
                            "content": assistant_message.content or "",
                            "tool_calls": [
                                {
                                    "id": tc.id,
                                    "type": "function",
                                    "function": {
                                        "name": tc.function.name,
                                        "arguments": tc.function.arguments,
                                    },
                                }
                                for tc in assistant_message.tool_calls
                            ],
                        }
                    )

                    # Execute each tool call via MCP
                    for tool_call in assistant_message.tool_calls:
                        tool_name = tool_call.function.name
                        try:
                            arguments = json.loads(tool_call.function.arguments)
                        except json.JSONDecodeError:
                            arguments = {}

                        logger.info(f"Executing tool: {tool_name}({arguments})")

                        try:
                            result = await mcp_client.call_tool(tool_name, arguments)
                        except Exception as e:
                            result = {"error": str(e)}

                        # Track tool calls
                        result_str = json.dumps(result) if isinstance(result, dict) else str(result)
                        all_tool_calls.append(
                            {
                                "tool_name": tool_name,
                                "arguments": arguments,
                                "result_preview": result_str[:500],
                            }
                        )

                        # Extract sources from web search results
                        if tool_name == "web_search" and isinstance(result, dict):
                            for r in result.get("results", []):
                                all_sources.append(
                                    {
                                        "title": r.get("title", ""),
                                        "url": r.get("url", ""),
                                        "snippet": r.get("snippet", ""),
                                    }
                                )

                        # Add tool result to messages
                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "content": result_str,
                            }
                        )

                    # Continue loop to let LLM process tool results
                    continue

                else:
                    # No more tool calls — return final response
                    return {
                        "content": assistant_message.content or "",
                        "tool_calls": all_tool_calls,
                        "sources": all_sources,
                    }

            except Exception as e:
                logger.error(f"LLM generation error (iteration {iteration}): {e}")
                return {
                    "content": f"I encountered an error processing your request: {str(e)}",
                    "tool_calls": all_tool_calls,
                    "sources": all_sources,
                }

        # Fallback if max iterations reached
        return {
            "content": "I've completed multiple tool calls but need to stop here. Here's what I found based on the tools used.",
            "tool_calls": all_tool_calls,
            "sources": all_sources,
        }

    async def generate_response_stream(
        self,
        user_message: str,
        conversation_history: list[dict],
    ) -> AsyncGenerator[dict, None]:
        """Stream response generation with tool call events.

        Yields dicts with 'type' (tool_start, tool_result, content_chunk, sources, done)
        and associated data.
        """
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]

        for msg in conversation_history[-20:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_message})

        try:
            tools = await mcp_client.list_tools()
            tool_definitions = mcp_client.get_tool_definitions_for_llm(tools)
        except Exception as e:
            logger.error(f"Failed to list MCP tools: {e}")
            tool_definitions = []

        all_tool_calls = []
        all_sources = []

        for iteration in range(5):
            try:
                kwargs = {
                    "model": self.model,
                    "messages": messages,
                }
                if tool_definitions:
                    kwargs["tools"] = tool_definitions
                    kwargs["tool_choice"] = "auto"

                # First, make a non-streaming call to handle tool calls
                response = await self.client.chat.complete_async(**kwargs)
                choice = response.choices[0]
                assistant_message = choice.message

                if assistant_message.tool_calls:
                    messages.append(
                        {
                            "role": "assistant",
                            "content": assistant_message.content or "",
                            "tool_calls": [
                                {
                                    "id": tc.id,
                                    "type": "function",
                                    "function": {
                                        "name": tc.function.name,
                                        "arguments": tc.function.arguments,
                                    },
                                }
                                for tc in assistant_message.tool_calls
                            ],
                        }
                    )

                    for tool_call in assistant_message.tool_calls:
                        tool_name = tool_call.function.name
                        try:
                            arguments = json.loads(tool_call.function.arguments)
                        except json.JSONDecodeError:
                            arguments = {}

                        # Emit tool start event
                        yield {
                            "type": "tool_start",
                            "tool_name": tool_name,
                            "arguments": arguments,
                        }

                        try:
                            result = await mcp_client.call_tool(tool_name, arguments)
                        except Exception as e:
                            result = {"error": str(e)}

                        result_str = json.dumps(result) if isinstance(result, dict) else str(result)
                        all_tool_calls.append(
                            {
                                "tool_name": tool_name,
                                "arguments": arguments,
                                "result_preview": result_str[:500],
                            }
                        )

                        if tool_name == "web_search" and isinstance(result, dict):
                            for r in result.get("results", []):
                                all_sources.append(
                                    {
                                        "title": r.get("title", ""),
                                        "url": r.get("url", ""),
                                        "snippet": r.get("snippet", ""),
                                    }
                                )

                        # Emit tool result event
                        yield {
                            "type": "tool_result",
                            "tool_name": tool_name,
                            "success": "error" not in result if isinstance(result, dict) else True,
                        }

                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "content": result_str,
                            }
                        )

                    continue

                else:
                    # Stream the final text response
                    kwargs_stream = {
                        "model": self.model,
                        "messages": messages,
                    }
                    stream_response = await self.client.chat.stream_async(**kwargs_stream)
                    async for chunk in stream_response:
                        delta = chunk.data.choices[0].delta
                        if delta.content:
                            yield {
                                "type": "content_chunk",
                                "content": delta.content,
                            }

                    # Emit sources
                    if all_sources:
                        yield {
                            "type": "sources",
                            "sources": all_sources,
                        }

                    yield {
                        "type": "done",
                        "tool_calls": all_tool_calls,
                        "sources": all_sources,
                    }
                    return

            except Exception as e:
                logger.error(f"Stream error (iteration {iteration}): {e}")
                yield {
                    "type": "error",
                    "content": f"Error: {str(e)}",
                }
                return

        yield {"type": "done", "tool_calls": all_tool_calls, "sources": all_sources}


# Singleton instance
llm_service = LLMService()
