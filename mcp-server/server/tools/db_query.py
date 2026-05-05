"""
Database Query Tool — Execute read-only SQL queries against PostgreSQL.
"""

import asyncpg
from typing import Any

from server.config import settings


def register_db_query_tool(mcp):
    """Register the database query tool on the MCP server."""

    @mcp.tool()
    async def query_database(sql_query: str) -> dict[str, Any]:
        """Execute a READ-ONLY SQL query against the PostgreSQL database.

        Only SELECT statements are allowed for safety. The database contains
        tables: products (id, name, category, price, stock_quantity, rating),
        sales (id, product_id, quantity, total_amount, customer_region, sale_date),
        conversations, and messages.

        Args:
            sql_query: A valid SQL SELECT statement to execute.

        Returns:
            A dict with 'columns' (list of column names), 'rows' (list of row data),
            'row_count' (number of rows returned), and 'query' (the executed query).
        """
        # Safety check: only allow SELECT statements
        cleaned = sql_query.strip().upper()
        if not cleaned.startswith("SELECT"):
            return {
                "error": "Only SELECT queries are allowed. INSERT, UPDATE, DELETE, DROP, and other modifying statements are blocked for safety.",
                "query": sql_query,
                "rows": [],
            }

        # Block dangerous keywords even in SELECT
        dangerous_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"]
        # Check for these at word boundaries (not inside column names)
        tokens = cleaned.replace("(", " ").replace(")", " ").replace(",", " ").split()
        for keyword in dangerous_keywords:
            if keyword in tokens and tokens[0] != "SELECT":
                return {
                    "error": f"Query contains disallowed keyword: {keyword}",
                    "query": sql_query,
                    "rows": [],
                }

        try:
            conn = await asyncpg.connect(settings.asyncpg_url)
            try:
                # Execute query with a timeout
                rows = await asyncpg.wait_for(
                    conn.fetch(sql_query),
                    timeout=10.0,
                )

                if not rows:
                    return {
                        "query": sql_query,
                        "columns": [],
                        "rows": [],
                        "row_count": 0,
                    }

                # Extract column names from the first row
                columns = list(rows[0].keys())

                # Convert rows to serializable format
                result_rows = []
                for row in rows[:100]:  # Limit to 100 rows
                    result_rows.append(
                        {col: _serialize_value(row[col]) for col in columns}
                    )

                return {
                    "query": sql_query,
                    "columns": columns,
                    "rows": result_rows,
                    "row_count": len(result_rows),
                    "truncated": len(rows) > 100,
                }

            finally:
                await conn.close()

        except asyncpg.PostgresError as e:
            return {
                "error": f"Database error: {str(e)}",
                "query": sql_query,
                "rows": [],
            }
        except Exception as e:
            return {
                "error": f"Query failed: {str(e)}",
                "query": sql_query,
                "rows": [],
            }


def _serialize_value(value: Any) -> Any:
    """Convert database values to JSON-serializable types."""
    if value is None:
        return None
    if isinstance(value, (int, float, str, bool)):
        return value
    # Handle Decimal, datetime, UUID, etc.
    return str(value)
