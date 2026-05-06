"""
Chat router — Send messages and stream AI responses.
"""

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models import Conversation, Message
from app.schemas import ChatRequest, ChatResponse
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message and get an AI response (non-streaming)."""

    # Get or create conversation
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == request.conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Create new conversation with first message as title
        title = request.message[:80] + ("..." if len(request.message) > 80 else "")
        conversation = Conversation(title=title)
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    await db.flush()

    # Get conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in messages[:-1]]  # Exclude current

    # Generate AI response
    response = await llm_service.generate_response(
        user_message=request.message,
        conversation_history=history,
    )

    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=response["content"],
        tool_calls=response.get("tool_calls", []),
        sources=response.get("sources", []),
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        message=response["content"],
        tool_calls=response.get("tool_calls", []),
        sources=response.get("sources", []),
    )


@router.post("/stream")
async def send_message_stream(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send a message and stream the AI response via SSE."""

    # Get or create conversation
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(Conversation.id == request.conversation_id)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        title = request.message[:80] + ("..." if len(request.message) > 80 else "")
        conversation = Conversation(title=title)
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    await db.commit()

    # Get conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()
    history = [{"role": m.role, "content": m.content} for m in messages[:-1]]

    conv_id = str(conversation.id)

    async def event_generator():
        full_content = ""
        all_tool_calls = []
        all_sources = []

        # Send conversation ID first
        yield {
            "event": "conversation_id",
            "data": json.dumps({"conversation_id": conv_id}),
        }

        async for event in llm_service.generate_response_stream(
            user_message=request.message,
            conversation_history=history,
        ):
            event_type = event.get("type", "")

            if event_type == "tool_start":
                yield {
                    "event": "tool_start",
                    "data": json.dumps(
                        {
                            "tool_name": event["tool_name"],
                            "arguments": event.get("arguments", {}),
                        }
                    ),
                }

            elif event_type == "tool_result":
                yield {
                    "event": "tool_result",
                    "data": json.dumps(
                        {
                            "tool_name": event["tool_name"],
                            "success": event.get("success", True),
                        }
                    ),
                }

            elif event_type == "content_chunk":
                chunk = event.get("content", "")
                full_content += chunk
                yield {
                    "event": "content",
                    "data": json.dumps({"content": chunk}),
                }

            elif event_type == "sources":
                all_sources = event.get("sources", [])
                yield {
                    "event": "sources",
                    "data": json.dumps({"sources": all_sources}),
                }

            elif event_type == "done":
                all_tool_calls = event.get("tool_calls", [])
                all_sources = event.get("sources", all_sources)

            elif event_type == "error":
                full_content = event.get("content", "An error occurred.")
                yield {
                    "event": "error",
                    "data": json.dumps({"error": full_content}),
                }

        # Save the assistant message to DB
        from app.database import async_session_factory

        async with async_session_factory() as save_db:
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_content,
                tool_calls=all_tool_calls,
                sources=all_sources,
            )
            save_db.add(assistant_msg)
            await save_db.commit()

        yield {
            "event": "done",
            "data": json.dumps({"conversation_id": conv_id}),
        }

    return EventSourceResponse(event_generator())
