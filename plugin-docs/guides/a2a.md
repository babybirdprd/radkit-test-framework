# A2A (Agent-to-Agent) Protocol Guide

Radkit is built on the [A2A Protocol](https://a2a-protocol.org), a standard for communication between AI agents. The Tauri plugin manages the complexity of this protocol for you, but understanding the core concepts will help you build better applications.

## Core Concepts

### 1. Agents
An **Agent** is a server that can perform tasks. In the Tauri plugin, your local application hosts an agent. This agent has a "Chat Skill" that knows how to talk to LLMs and execute the tools you define.

### 2. Tasks
Every interaction in A2A is a **Task**. When you send a message, you are initiating a task.
*   **Task ID**: A unique identifier for the conversation thread.
*   **State**: Tasks can be `Running`, `Completed`, `Failed`, or `InputRequired`.

When you call `chat()` or `streamChat()`, the plugin automatically creates a Task or appends to an existing one if you provide a `taskId`.

### 3. Context
**Context** groups related tasks together. For example, a "Project" or "Session" could be a context.
*   **Context ID**: You can pass a `contextId` to `chat()` to group conversations.
*   **Memory**: Memory is often scoped to a context (though the current plugin implementation uses a global memory store with metadata support).

### 4. Messages
Communication happens via **Messages**. A message contains:
*   **Role**: User, Assistant, or System.
*   **Parts**: Text, Images, or Artifacts.

## How the Plugin Wraps A2A

The plugin spawns a local A2A server and uses an A2A Client to talk to it.

| A2A Concept | Plugin API |
| :--- | :--- |
| **Start Task** | `chat(message)` (returns new `taskId`) |
| **Continue Task** | `chat(message, undefined, taskId)` |
| **Group Tasks** | `chat(message, contextId)` |
| **List Tasks** | `listTasks(contextId)` |
| **Cancel Task** | `cancelTask(taskId)` |

## Building "Skills" via Tools

In full Rust-based Radkit, you can define complex "Skills" (Rust structs). In the Tauri plugin, we simplify this by providing a universal **Chat Skill** that can use **Tools**.

*   **You define**: Tools (JavaScript functions).
*   **The Agent uses**: The Chat Skill to decide *when* to call your tools based on the conversation.

This allows you to extend the agent's capabilities (e.g., "Read File", "Search Web") without writing Rust code, while still benefiting from the A2A structure.
