FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Enable bytecode compilation for faster startup
ENV UV_COMPILE_BYTECODE=1
# Disable installer metadata for smaller image
ENV UV_NO_INSTALLER_METADATA=1
# Install into system python (no virtualenv in container)
ENV UV_PROJECT_ENVIRONMENT=/usr/local/

# Copy dependency files first for layer caching
COPY pyproject.toml ./
RUN uv sync --no-dev --no-install-project

# Copy source code
COPY server/ ./server/

EXPOSE 8001

CMD ["python", "-m", "server.main"]
