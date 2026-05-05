"""
Database Analyze Tool — Perform statistical analysis on database tables.
"""

import asyncpg
from typing import Any

from server.config import settings


def register_db_analyze_tool(mcp):
    """Register the database analyze tool on the MCP server."""

    @mcp.tool()
    async def analyze_database(
        table_name: str, analysis_type: str = "overview"
    ) -> dict[str, Any]:
        """Analyze a database table to get insights and statistics.

        Available tables: products, sales, conversations, messages.

        Args:
            table_name: Name of the table to analyze (e.g., 'products', 'sales').
            analysis_type: Type of analysis to perform:
                - 'overview': Schema info, row count, and sample data.
                - 'statistics': Numeric column statistics (min, max, avg, etc.).
                - 'distribution': Value distributions for categorical columns.

        Returns:
            A dict with the analysis results based on the requested type.
        """
        # Whitelist allowed tables for safety
        allowed_tables = ["products", "sales", "conversations", "messages"]
        if table_name.lower() not in allowed_tables:
            return {
                "error": f"Table '{table_name}' not found. Available tables: {', '.join(allowed_tables)}",
                "table": table_name,
            }

        table_name = table_name.lower()

        try:
            conn = await asyncpg.connect(settings.asyncpg_url)
            try:
                if analysis_type == "overview":
                    return await _analyze_overview(conn, table_name)
                elif analysis_type == "statistics":
                    return await _analyze_statistics(conn, table_name)
                elif analysis_type == "distribution":
                    return await _analyze_distribution(conn, table_name)
                else:
                    return {
                        "error": f"Unknown analysis type: '{analysis_type}'. Use 'overview', 'statistics', or 'distribution'.",
                        "table": table_name,
                    }
            finally:
                await conn.close()

        except Exception as e:
            return {
                "error": f"Analysis failed: {str(e)}",
                "table": table_name,
            }


async def _analyze_overview(conn, table_name: str) -> dict:
    """Get table schema, row count, and sample data."""

    # Get column info
    columns = await conn.fetch(
        """
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
        """,
        table_name,
    )

    # Get row count
    count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')

    # Get sample rows
    sample = await conn.fetch(f'SELECT * FROM "{table_name}" LIMIT 5')

    schema = [
        {
            "column": col["column_name"],
            "type": col["data_type"],
            "nullable": col["is_nullable"] == "YES",
            "default": str(col["column_default"]) if col["column_default"] else None,
        }
        for col in columns
    ]

    sample_rows = []
    if sample:
        cols = list(sample[0].keys())
        for row in sample:
            sample_rows.append({c: _safe_serialize(row[c]) for c in cols})

    return {
        "table": table_name,
        "analysis_type": "overview",
        "schema": schema,
        "row_count": count,
        "sample_data": sample_rows,
    }


async def _analyze_statistics(conn, table_name: str) -> dict:
    """Get statistics for numeric columns."""

    # Get numeric columns
    numeric_cols = await conn.fetch(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
          AND data_type IN ('integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision')
        ORDER BY ordinal_position
        """,
        table_name,
    )

    stats = {}
    for col in numeric_cols:
        col_name = col["column_name"]
        result = await conn.fetchrow(
            f"""
            SELECT
                COUNT("{col_name}") as count,
                MIN("{col_name}")::text as min_val,
                MAX("{col_name}")::text as max_val,
                AVG("{col_name}")::numeric(15,2)::text as avg_val,
                SUM("{col_name}")::text as sum_val,
                COUNT(*) - COUNT("{col_name}") as null_count,
                COUNT(DISTINCT "{col_name}") as distinct_count
            FROM "{table_name}"
            """
        )
        stats[col_name] = {
            "count": result["count"],
            "min": result["min_val"],
            "max": result["max_val"],
            "avg": result["avg_val"],
            "sum": result["sum_val"],
            "null_count": result["null_count"],
            "distinct_values": result["distinct_count"],
        }

    row_count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')

    return {
        "table": table_name,
        "analysis_type": "statistics",
        "row_count": row_count,
        "numeric_columns": stats,
    }


async def _analyze_distribution(conn, table_name: str) -> dict:
    """Get value distributions for categorical columns."""

    # Get text/varchar columns
    text_cols = await conn.fetch(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
          AND data_type IN ('character varying', 'text', 'character')
        ORDER BY ordinal_position
        """,
        table_name,
    )

    distributions = {}
    for col in text_cols:
        col_name = col["column_name"]
        result = await conn.fetch(
            f"""
            SELECT "{col_name}" as value, COUNT(*) as count
            FROM "{table_name}"
            WHERE "{col_name}" IS NOT NULL
            GROUP BY "{col_name}"
            ORDER BY count DESC
            LIMIT 20
            """,
        )
        distributions[col_name] = [
            {"value": _safe_serialize(row["value"]), "count": row["count"]}
            for row in result
        ]

    row_count = await conn.fetchval(f'SELECT COUNT(*) FROM "{table_name}"')

    return {
        "table": table_name,
        "analysis_type": "distribution",
        "row_count": row_count,
        "categorical_columns": distributions,
    }


def _safe_serialize(value: Any) -> Any:
    """Convert database values to JSON-serializable types."""
    if value is None:
        return None
    if isinstance(value, (int, float, str, bool)):
        return value
    return str(value)
