"""
Summarize Tool — Summarize long text content using the Mistral LLM.
"""

import httpx
import json
from typing import Any

from server.config import settings


def register_summarize_tool(mcp):
    """Register the summarize tool on the MCP server."""

    @mcp.tool()
    async def summarize_text(
        text: str, style: str = "concise"
    ) -> dict[str, Any]:
        """Summarize long text content into a shorter, digestible format.

        Use this tool when you have a large block of text (e.g., from web search
        results or database output) that needs to be condensed.

        Args:
            text: The text content to summarize.
            style: Summary style - 'concise' (2-3 sentences), 'detailed' (paragraph),
                   or 'bullet_points' (key points as bullets).

        Returns:
            A dict with 'summary' (the summarized text) and 'style' (the style used).
        """
        valid_styles = ["concise", "detailed", "bullet_points"]
        if style not in valid_styles:
            style = "concise"

        if not text or len(text.strip()) < 50:
            return {
                "summary": text,
                "style": style,
                "note": "Text too short to summarize.",
            }

        if not settings.mistral_api_key:
            return {
                "error": "Mistral API key not configured. Please set MISTRAL_API_KEY.",
                "summary": "",
            }

        style_instructions = {
            "concise": "Provide a concise summary in 2-3 sentences. Be brief and capture only the key points.",
            "detailed": "Provide a detailed summary in one or two paragraphs. Cover all important points and nuances.",
            "bullet_points": "Provide a summary as bullet points. Each bullet should capture one key point. Use markdown bullet format (- ).",
        }

        prompt = f"""{style_instructions[style]}

Text to summarize:
---
{text[:8000]}
---

Summary:"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.mistral.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.mistral_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "mistral-small-latest",
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 1024,
                        "temperature": 0.3,
                    },
                )
                response.raise_for_status()
                data = response.json()
                summary = data["choices"][0]["message"]["content"].strip()

                return {
                    "summary": summary,
                    "style": style,
                    "original_length": len(text),
                    "summary_length": len(summary),
                }

        except Exception as e:
            return {
                "error": f"Summarization failed: {str(e)}",
                "summary": "",
                "style": style,
            }
