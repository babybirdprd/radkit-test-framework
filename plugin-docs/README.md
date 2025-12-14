# Radkit Tauri Plugin Documentation

The **Radkit Tauri Plugin** enables you to build powerful, AI-driven desktop applications using [Tauri](https://tauri.app/) and [Radkit](https://github.com/agents-sh/radkit). It provides a seamless bridge between your frontend (TypeScript/JavaScript) and the Rust-based Radkit runtime, exposing LLMs, memory, tools, and the Agent-to-Agent (A2A) protocol.

## Features

*   **Unified LLM Support**: Connect to OpenAI, Anthropic, Gemini, OpenRouter, Grok, and DeepSeek with a single API.
*   **Tooling**: Define tools in your frontend and let the agent execute them safely.
*   **Memory**: Built-in vector memory for semantic search and retrieval.
*   **Streaming**: Real-time streaming of chat responses and events.
*   **Task Management**: Full control over agent tasks and context via the A2A protocol.
*   **Production Ready**: Type-safe APIs and robust error handling.

## Documentation Structure

*   [**Getting Started**](./getting-started.md): Installation and setup guide.
*   [**API Reference**](./api-reference.md): Detailed API documentation.
*   [**Guides**](./guides/): In-depth guides for specific features.
    *   [Tooling](./guides/tooling.md)
    *   [Memory](./guides/memory.md)
    *   [Streaming](./guides/streaming.md)
*   [**Examples**](./examples.md): Common use cases and patterns.

## Architecture

The plugin spawns a local Radkit runtime within your Tauri application. It exposes a set of commands to interact with this runtime, managing the complexity of the A2A protocol and agent lifecycle for you.

## License

MIT
