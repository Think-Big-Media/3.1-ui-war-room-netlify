"""
MCP Server Implementation for War Room Context Engineering
Provides standardized Model Context Protocol server for AI agent integration
"""

import json
import asyncio
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ..services.context_engineering import context_engineering
from ..core.config import get_settings
from ..core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class MCPMessageType(Enum):
    """MCP Message Types"""

    REQUEST = "request"
    RESPONSE = "response"
    NOTIFICATION = "notification"
    ERROR = "error"


class MCPToolType(Enum):
    """Available MCP Tools"""

    RAG_QUERY = "rag_query"
    CODE_EXAMPLES = "code_examples"
    AGENT_TASK = "agent_task"
    DOCUMENT_INGEST = "document_ingest"
    KNOWLEDGE_BASES = "knowledge_bases"


@dataclass
class MCPMessage:
    """Base MCP Message"""

    type: str
    id: Optional[str] = None
    method: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


@dataclass
class MCPTool:
    """MCP Tool Definition"""

    name: str
    description: str
    input_schema: Dict[str, Any]
    handler: Callable


class MCPServer:
    """Model Context Protocol Server for War Room"""

    def __init__(self):
        self.app = FastAPI(title="War Room MCP Server", version="1.0.0")
        self.connections: Dict[str, WebSocket] = {}
        self.tools: Dict[str, MCPTool] = {}
        self.setup_middleware()
        self.setup_routes()
        self.register_tools()

    def setup_middleware(self):
        """Setup CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        """Setup HTTP and WebSocket routes"""

        @self.app.get("/")
        async def root():
            return {
                "server": "War Room MCP Server",
                "version": "1.0.0",
                "protocol": "mcp",
                "capabilities": list(self.tools.keys()),
            }

        @self.app.get("/tools")
        async def list_tools():
            """List available MCP tools"""
            return {
                "tools": [
                    {
                        "name": tool.name,
                        "description": tool.description,
                        "input_schema": tool.input_schema,
                    }
                    for tool in self.tools.values()
                ]
            }

        @self.app.websocket("/mcp")
        async def websocket_endpoint(websocket: WebSocket):
            await self.handle_websocket(websocket)

    def register_tools(self):
        """Register all available MCP tools"""

        # RAG Query Tool
        self.tools["rag_query"] = MCPTool(
            name="rag_query",
            description="Query documents using hybrid RAG search",
            input_schema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "namespace": {"type": "string", "default": "default"},
                    "top_k": {
                        "type": "integer",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 50,
                    },
                    "semantic_weight": {
                        "type": "number",
                        "default": 0.7,
                        "minimum": 0.0,
                        "maximum": 1.0,
                    },
                    "keyword_weight": {
                        "type": "number",
                        "default": 0.3,
                        "minimum": 0.0,
                        "maximum": 1.0,
                    },
                },
                "required": ["query"],
            },
            handler=self.handle_rag_query,
        )

        # Code Examples Tool
        self.tools["code_examples"] = MCPTool(
            name="code_examples",
            description="Search for code examples and patterns",
            input_schema={
                "type": "object",
                "properties": {
                    "language": {
                        "type": "string",
                        "description": "Programming language",
                    },
                    "functionality": {
                        "type": "string",
                        "description": "Desired functionality",
                    },
                    "framework": {
                        "type": "string",
                        "description": "Framework or library",
                    },
                    "complexity": {
                        "type": "string",
                        "default": "intermediate",
                        "enum": ["beginner", "intermediate", "advanced"],
                    },
                    "top_k": {
                        "type": "integer",
                        "default": 5,
                        "minimum": 1,
                        "maximum": 20,
                    },
                },
                "required": ["language", "functionality"],
            },
            handler=self.handle_code_examples,
        )

        # Agent Task Tool
        self.tools["agent_task"] = MCPTool(
            name="agent_task",
            description="Create and manage agent tasks",
            input_schema={
                "type": "object",
                "properties": {
                    "task_type": {"type": "string", "description": "Type of task"},
                    "description": {
                        "type": "string",
                        "description": "Task description",
                    },
                    "priority": {
                        "type": "integer",
                        "default": 1,
                        "minimum": 1,
                        "maximum": 5,
                    },
                    "context": {"type": "object", "description": "Task context"},
                    "agent_id": {"type": "string", "description": "Specific agent ID"},
                },
                "required": ["task_type", "description"],
            },
            handler=self.handle_agent_task,
        )

        # Document Ingestion Tool
        self.tools["document_ingest"] = MCPTool(
            name="document_ingest",
            description="Ingest documents into the RAG system",
            input_schema={
                "type": "object",
                "properties": {
                    "content": {"type": "string", "description": "Document content"},
                    "source_document": {
                        "type": "string",
                        "description": "Source document identifier",
                    },
                    "metadata": {"type": "object", "description": "Document metadata"},
                    "namespace": {"type": "string", "default": "default"},
                    "chunk_strategy": {
                        "type": "string",
                        "default": "contextual",
                        "enum": ["contextual", "semantic", "fixed_size"],
                    },
                },
                "required": ["content", "source_document"],
            },
            handler=self.handle_document_ingest,
        )

        # Knowledge Bases Tool
        self.tools["knowledge_bases"] = MCPTool(
            name="knowledge_bases",
            description="List available knowledge bases",
            input_schema={"type": "object", "properties": {}, "required": []},
            handler=self.handle_knowledge_bases,
        )

    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connections for MCP protocol"""
        await websocket.accept()
        connection_id = f"conn_{datetime.now().timestamp()}"
        self.connections[connection_id] = websocket

        logger.info(f"MCP WebSocket connection established: {connection_id}")

        try:
            while True:
                # Receive message
                data = await websocket.receive_text()
                message = json.loads(data)

                # Process MCP message
                response = await self.process_mcp_message(message)

                # Send response
                await websocket.send_text(json.dumps(response))

        except WebSocketDisconnect:
            logger.info(f"MCP WebSocket connection closed: {connection_id}")
        except Exception as e:
            logger.error(f"Error in MCP WebSocket handler: {str(e)}")
            error_response = {
                "type": "error",
                "id": message.get("id"),
                "error": {"code": -32603, "message": "Internal error", "data": str(e)},
            }
            await websocket.send_text(json.dumps(error_response))
        finally:
            if connection_id in self.connections:
                del self.connections[connection_id]

    async def process_mcp_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming MCP message"""
        try:
            message_type = message.get("type")
            method = message.get("method")
            params = message.get("params", {})
            message_id = message.get("id")

            if message_type == "request":
                if method == "tools/list":
                    return {
                        "type": "response",
                        "id": message_id,
                        "result": {
                            "tools": [
                                {
                                    "name": tool.name,
                                    "description": tool.description,
                                    "inputSchema": tool.input_schema,
                                }
                                for tool in self.tools.values()
                            ]
                        },
                    }

                elif method == "tools/call":
                    tool_name = params.get("name")
                    tool_params = params.get("arguments", {})

                    if tool_name not in self.tools:
                        return {
                            "type": "error",
                            "id": message_id,
                            "error": {
                                "code": -32601,
                                "message": f"Tool not found: {tool_name}",
                            },
                        }

                    tool = self.tools[tool_name]
                    result = await tool.handler(tool_params)

                    return {"type": "response", "id": message_id, "result": result}

                else:
                    return {
                        "type": "error",
                        "id": message_id,
                        "error": {
                            "code": -32601,
                            "message": f"Method not found: {method}",
                        },
                    }

            else:
                return {
                    "type": "error",
                    "id": message_id,
                    "error": {"code": -32600, "message": "Invalid request"},
                }

        except Exception as e:
            logger.error(f"Error processing MCP message: {str(e)}")
            return {
                "type": "error",
                "id": message.get("id"),
                "error": {"code": -32603, "message": "Internal error", "data": str(e)},
            }

    async def handle_rag_query(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle RAG query tool"""
        try:
            query = params["query"]
            namespace = params.get("namespace", "default")
            top_k = params.get("top_k", 10)
            semantic_weight = params.get("semantic_weight", 0.7)
            keyword_weight = params.get("keyword_weight", 0.3)

            # Validate weights
            if abs(semantic_weight + keyword_weight - 1.0) > 0.01:
                semantic_weight = 0.7
                keyword_weight = 0.3

            # Get relevant context
            context = await context_engineering.get_relevant_context(
                query=query,
                namespace=namespace,
                max_context_length=settings.AGENT_MAX_CONTEXT,
            )

            return {
                "query": query,
                "namespace": namespace,
                "results": context["chunks"],
                "total_results": context["total_results"],
                "context_length": context["context_length"],
            }

        except Exception as e:
            logger.error(f"Error in RAG query handler: {str(e)}")
            raise

    async def handle_code_examples(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle code examples tool"""
        try:
            language = params["language"]
            functionality = params["functionality"]
            framework = params.get("framework")
            complexity = params.get("complexity", "intermediate")
            top_k = params.get("top_k", 5)

            # Construct search query
            search_query = f"{language} {functionality}"
            if framework:
                search_query += f" {framework}"
            search_query += f" {complexity} example"

            # Search in code examples namespace
            results = await context_engineering.hybrid_search(
                query=search_query,
                namespace="code_examples",
                top_k=top_k,
                semantic_weight=0.8,
                keyword_weight=0.2,
            )

            # Format results
            examples = []
            for result in results:
                example = {
                    "id": result.chunk.id,
                    "title": result.chunk.metadata.get("title", "Code Example"),
                    "description": result.chunk.metadata.get("description", ""),
                    "code": result.chunk.content,
                    "language": result.chunk.metadata.get("language", language),
                    "framework": result.chunk.metadata.get(
                        "framework", framework or ""
                    ),
                    "complexity": result.chunk.metadata.get("complexity", complexity),
                    "tags": result.chunk.metadata.get("tags", []),
                    "score": result.score,
                }
                examples.append(example)

            return {
                "language": language,
                "functionality": functionality,
                "framework": framework,
                "complexity": complexity,
                "examples": examples,
                "total_found": len(examples),
            }

        except Exception as e:
            logger.error(f"Error in code examples handler: {str(e)}")
            raise

    async def handle_agent_task(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle agent task tool"""
        try:
            task_type = params["task_type"]
            description = params["description"]
            priority = params.get("priority", 1)
            context = params.get("context", {})
            agent_id = params.get("agent_id")

            # Generate task ID
            task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(description) % 10000}"

            # Create task record
            task = {
                "task_id": task_id,
                "task_type": task_type,
                "description": description,
                "priority": priority,
                "context": context,
                "agent_id": agent_id,
                "status": "created",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            # Store task (implement based on your database)
            # For now, return the task

            return task

        except Exception as e:
            logger.error(f"Error in agent task handler: {str(e)}")
            raise

    async def handle_document_ingest(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle document ingestion tool"""
        try:
            content = params["content"]
            source_document = params["source_document"]
            metadata = params.get("metadata", {})
            namespace = params.get("namespace", "default")
            chunk_strategy = params.get("chunk_strategy", "contextual")

            # Add ingestion metadata
            enhanced_metadata = {
                **metadata,
                "ingestion_date": datetime.now().isoformat(),
                "chunk_strategy": chunk_strategy,
            }

            # Chunk the document
            chunks = await context_engineering.chunk_document(
                content=content,
                source_document=source_document,
                metadata=enhanced_metadata,
            )

            # Generate embeddings
            embedded_chunks = await context_engineering.embed_chunks(chunks)

            # Store in vector database
            success = await context_engineering.store_chunks(
                embedded_chunks, namespace=namespace
            )

            return {
                "document_id": source_document,
                "namespace": namespace,
                "chunks_created": len(chunks),
                "chunks_embedded": len(embedded_chunks),
                "chunks_stored": len(embedded_chunks) if success else 0,
                "success": success,
            }

        except Exception as e:
            logger.error(f"Error in document ingest handler: {str(e)}")
            raise

    async def handle_knowledge_bases(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle knowledge bases tool"""
        try:
            # Return available knowledge bases
            knowledge_bases = [
                {
                    "name": "default",
                    "description": "Default document knowledge base",
                    "document_count": 0,
                    "last_updated": datetime.now().isoformat(),
                },
                {
                    "name": "code_examples",
                    "description": "Code examples and patterns",
                    "document_count": 0,
                    "last_updated": datetime.now().isoformat(),
                },
                {
                    "name": "project_docs",
                    "description": "Project documentation",
                    "document_count": 0,
                    "last_updated": datetime.now().isoformat(),
                },
            ]

            return {
                "knowledge_bases": knowledge_bases,
                "total_count": len(knowledge_bases),
            }

        except Exception as e:
            logger.error(f"Error in knowledge bases handler: {str(e)}")
            raise

    async def broadcast_notification(self, notification: Dict[str, Any]):
        """Broadcast notification to all connected clients"""
        message = json.dumps(notification)

        for connection_id, websocket in self.connections.items():
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Error sending notification to {connection_id}: {str(e)}")

    def run(self, host: str = "0.0.0.0", port: int = None):
        """Run the MCP server"""
        if port is None:
            port = settings.MCP_SERVER_PORT

        logger.info(f"Starting War Room MCP Server on {host}:{port}")
        uvicorn.run(self.app, host=host, port=port)


# Initialize global MCP server instance
mcp_server = MCPServer()


# CLI entry point
def main():
    """Main entry point for MCP server"""
    import argparse

    parser = argparse.ArgumentParser(description="War Room MCP Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument(
        "--port", type=int, default=settings.MCP_SERVER_PORT, help="Port to bind to"
    )

    args = parser.parse_args()

    mcp_server.run(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
