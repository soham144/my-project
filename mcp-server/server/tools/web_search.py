"""
Web Search Tool — Uses SerpAPI to search Google and return structured results.
"""

import json
from typing import Any

from serpapi import GoogleSearch

from server.config import settings


def register_web_search_tool(mcp):
    """Register the web search tool on the MCP server."""

    @mcp.tool()
    async def web_search(query: str, max_results: int = 5) -> dict[str, Any]:
        """Search the web for current information on any topic using Google Search.

        Use this tool when you need to find up-to-date information, news,
        facts, or any real-time data from the internet.

        Args:
            query: The search query string.
            max_results: Maximum number of results to return (1-10, default 5).

        Returns:
            A dict with 'results' (list of search results) and 'query' (the search query).
        """
        max_results = min(max(1, max_results), 10)

        if not settings.serpapi_api_key:
            return {
                "error": "SerpAPI key not configured. Please set SERPAPI_API_KEY.",
                "query": query,
                "results": [],
            }

        try:
            params = {
                "q": query,
                "api_key": settings.serpapi_api_key,
                "engine": "google",
                "num": max_results,
                "hl": "en",
                "gl": "us",
            }

            search = GoogleSearch(params)
            raw_results = search.get_dict()

            results = []

            # Parse organic results
            for item in raw_results.get("organic_results", [])[:max_results]:
                results.append(
                    {
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", ""),
                        "position": item.get("position", 0),
                    }
                )

            # Include answer box if available
            answer_box = raw_results.get("answer_box", {})
            answer = None
            if answer_box:
                answer = answer_box.get("answer") or answer_box.get("snippet") or answer_box.get("result")

            # Include knowledge graph if available
            knowledge_graph = raw_results.get("knowledge_graph", {})
            kg_info = None
            if knowledge_graph:
                kg_info = {
                    "title": knowledge_graph.get("title", ""),
                    "description": knowledge_graph.get("description", ""),
                    "type": knowledge_graph.get("type", ""),
                }

            return {
                "query": query,
                "results": results,
                "answer_box": answer,
                "knowledge_graph": kg_info,
                "total_results": len(results),
            }

        except Exception as e:
            return {
                "error": f"Search failed: {str(e)}",
                "query": query,
                "results": [],
            }
