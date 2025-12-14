# Getting Started

This guide will walk you through setting up the Radkit Tauri Plugin in your Tauri v2 application.

## Prerequisites

*   Rust (latest stable)
*   Node.js (LTS)
*   Tauri CLI (`cargo install tauri-cli`)
*   A Tauri v2 project (`npm create tauri-app@latest`)

## Installation

### 1. Add Rust Dependency

Add the plugin to your `src-tauri/Cargo.toml`.

```toml
[dependencies]
# If using from crates.io (when published)
# tauri-plugin-radkit = "0.1"

# If using from git
tauri-plugin-radkit = { git = "https://github.com/your-org/radkit-tauri.git" }
```

### 2. Initialize Plugin in Rust

Register the plugin in your `src-tauri/src/lib.rs` (or `main.rs`):

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_radkit::init()) // <--- Add this line
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. Add Frontend Dependency

Install the JavaScript bindings in your frontend project:

```bash
npm install tauri-plugin-radkit-api
# or
pnpm add tauri-plugin-radkit-api
```

> **Note**: If you are working in a local monorepo, you may need to link the package or use a relative path.

### 4. Configure Permissions

Tauri v2 requires explicit permission configuration. Add `radkit:default` to your capability file (usually `src-tauri/capabilities/default.json`):

```json
{
  "permissions": [
    "core:default",
    "radkit:default"
  ]
}
```

This enables all default commands for the plugin:
*   `init_agent`
*   `chat`, `stream_chat`
*   `submit_tool_output`
*   `search_memory`, `save_memory`, `delete_memory`
*   `list_tasks`, `get_task`, `cancel_task`

## Basic Usage

Now you can initialize an agent in your frontend code.

```typescript
import { initAgent, chat } from "tauri-plugin-radkit-api";

async function startAgent() {
  // Initialize the agent
  await initAgent({
    name: "My Assistant",
    description: "A helpful AI assistant",
    llm: {
      provider: "OpenAI",
      model: "gpt-4-turbo",
      apiKey: "your-api-key-here" // Ideally, fetch this from a secure store or env
    },
    tools: []
  });

  // Send a message
  const response = await chat("Hello! Who are you?");
  console.log(response);
}
```

## Next Steps

*   Learn about [Tooling](./guides/tooling.md) to give your agent capabilities.
*   Explore [Memory](./guides/memory.md) to make your agent stateful.
*   Check the [API Reference](./api-reference.md) for full details.
