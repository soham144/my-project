"""
AI Platform MCP Server
Exposes tools for web search, database queries, analysis, and summarization
via Model Context Protocol (Streamable HTTP transport).
"""

from fastmcp import FastMCP

from server.tools.web_search import register_web_search_tool
from server.tools.db_query import register_db_query_tool
from server.tools.db_analyze import register_db_analyze_tool
from server.tools.summarize import register_summarize_tool

# Initialize MCP server
mcp = FastMCP(
    "AI Platform Tools",
    instructions=(
        "You have access to tools for web search, database querying, "
        "database analysis, and text summarization. Use these tools to "
        "help users find information, analyze data, and get insights."
    ),
)

# Register all tools
register_web_search_tool(mcp)
register_db_query_tool(mcp)
register_db_analyze_tool(mcp)
register_summarize_tool(mcp)


if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="0.0.0.0", port=8001)
