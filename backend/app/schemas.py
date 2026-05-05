"""
Pydantic schemas for API request/response validation.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- Chat Schemas ---

class ChatRequest(BaseModel):
    """Request body for sending a chat message."""
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[UUID] = None


class ToolCallInfo(BaseModel):
    """Info about a tool that was called during response generation."""
    tool_name: str
    arguments: dict = {}
    result_preview: str = ""


class SourceInfo(BaseModel):
    """Info about a web source cited in the response."""
    title: str
    url: str
    snippet: str = ""


class ChatResponse(BaseModel):
    """Response body for a chat message."""
    conversation_id: UUID
    message: str
    tool_calls: list[ToolCallInfo] = []
    sources: list[SourceInfo] = []


# --- Conversation Schemas ---

class MessageResponse(BaseModel):
    """A single message in a conversation."""
    id: UUID
    role: str
    content: str
    tool_calls: list = []
    sources: list = []
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """A conversation with its metadata."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    """A conversation with all its messages."""
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True


class ConversationCreateRequest(BaseModel):
    """Request body for creating a new conversation."""
    title: Optional[str] = "New Conversation"
