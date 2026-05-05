"""
MCP Client Service — Connects to the MCP Server and invokes tools.
"""

import json
import logging
from typing import Any

from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport

from app.config import settings

logger = logging.getLogger(__name__)


class MCPClientService:
    """Service for communicating with the MCP Server over Streamable HTTP."""

    def __init__(self):
        self.server_url = f"{settings.mcp_server_url}/mcp"

    async def list_tools(self) -> list[dict]:
        """List all tools available on the MCP server."""
        transport = StreamableHttpTransport(self.server_url)
        async with Client(transport) as client:
            tools = await client.list_tools()
            return [
                {
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": tool.inputSchema if hasattr(tool, "inputSchema") else {},
                }
                for tool in tools
            ]

    async def call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Call a specific tool on the MCP server with given arguments."""
        transport = StreamableHttpTransport(self.server_url)
        async with Client(transport) as client:
            logger.info(f"Calling MCP tool: {tool_name} with args: {arguments}")
            result = await client.call_tool(tool_name, arguments)

            # Extract text content from the result
            if hasattr(result, "content"):
                contents = []
                for item in result.content:
                    if hasattr(item, "text"):
                        try:
                            contents.append(json.loads(item.text))
                        except json.JSONDecodeError:
                            contents.append(item.text)
                    else:
                        contents.append(str(item))
                return contents[0] if len(contents) == 1 else contents

            return result

    def get_tool_definitions_for_llm(self, tools: list[dict]) -> list[dict]:
        """Convert MCP tool definitions to Mistral function-calling format."""
        functions = []
        for tool in tools:
            # Build parameters schema
            params = tool.get("parameters", {})
            functions.append(
                {
                    "type": "function",
                    "function": {
                        "name": tool["name"],
                        "description": tool["description"],
                        "parameters": params,
                    },
                }
            )
        return functions


# Singleton instance
mcp_client = MCPClientService()
