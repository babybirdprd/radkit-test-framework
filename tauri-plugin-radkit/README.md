# Tauri Plugin Radkit

A Tauri plugin that integrates the `radkit` Rust library, providing a powerful AI agent runtime with LLM support, tool execution, and memory management directly in your Tauri application.

## Installation

### Rust

Add the plugin to your `Cargo.toml`. Since it's currently a local plugin, use the path:

```toml
[dependencies]
tauri-plugin-radkit = { path = "../tauri-plugin-radkit" }
```

And in your `src-tauri/lib.rs` (or `main.rs`):

```rust
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_radkit::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
```

### JavaScript / TypeScript

Install the JavaScript bindings:

```bash
npm install ../tauri-plugin-radkit
# or
pnpm add ../tauri-plugin-radkit
```

## Permissions

In Tauri v2, you must explicitly allow plugin commands. Add `radkit:default` to your capability file (e.g., `src-tauri/capabilities/default.json`):

```json
{
  "permissions": [
    "core:default",
    "radkit:default"
  ]
}
```

Or select individual permissions:

- `radkit:allow-init-agent`
- `radkit:allow-chat`
- `radkit:allow-stream-chat`
- `radkit:allow-submit-tool-output`
- `radkit:allow-search-memory`
- `radkit:allow-save-memory`
- `radkit:allow-delete-memory`
- `radkit:allow-list-tasks`
- `radkit:allow-get-task`
- `radkit:allow-cancel-task`

## Usage

### Initialization

Initialize the agent with an LLM configuration and tools definition. This spawns a local server and connects the A2A client.

```typescript
import { initAgent } from 'tauri-plugin-radkit-api';

await initAgent({
  name: "My Assistant",
  description: "A helpful assistant",
  llm: {
    provider: "OpenAI", // Or "Anthropic", "Gemini", "OpenRouter", "Grok", "DeepSeek"
    model: "gpt-4",
    apiKey: "sk-...", // Optional if set in environment variables
    temperature: 0.7
  },
  tools: [
    {
      name: "calculator",
      description: "Calculate expression",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string" }
        },
        required: ["expression"]
      }
    }
  ]
});
```

### Chat

Send a message and get a response.

```typescript
import { chat } from 'tauri-plugin-radkit-api';

const response = await chat("Hello, how are you?");
console.log(response);
```

### Streaming Chat

For streaming responses, listen to the `stream_event` event.

```typescript
import { streamChat } from 'tauri-plugin-radkit-api';
import { listen } from '@tauri-apps/api/event';

// Set up listener before calling streamChat
const unlisten = await listen('stream_event', (event) => {
  console.log("Stream update:", event.payload);
  // Payload structure depends on the A2A event type
});

await streamChat("Tell me a story");

// Cleanup when done
// unlisten();
```

### Tool Execution

When the agent decides to call a tool defined in `initAgent`, the plugin emits a `tool_execution_request` event. You must listen for this event, execute the tool logic in your frontend, and submit the result back using `submitToolOutput`.

```typescript
import { submitToolOutput } from 'tauri-plugin-radkit-api';
import { listen } from '@tauri-apps/api/event';

listen('tool_execution_request', async (event) => {
  const { requestId, name, args } = event.payload;
  console.log(`Tool request: ${name}`, args);

  let result;
  let isError = false;

  try {
    if (name === 'calculator') {
      // Execute your tool logic here
      // args is a JSON object with the parameters
      const value = eval(args.expression); // Warning: use safe evaluation in production!
      result = JSON.stringify({ value });
    } else {
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    result = e.message;
    isError = true;
  }

  // Submit the result back to the agent
  await submitToolOutput({
    requestId,
    result: result, // Must be convertible to JSON
    isError
  });
});
```

### Memory Management

Manage the agent's memory (vector store).

```typescript
import { saveMemory, searchMemory, deleteMemory } from 'tauri-plugin-radkit-api';

// Add to memory
const memoryId = await saveMemory({
    text: "The user prefers dark mode.",
    metadata: { source: "settings" }
});

// Search memory
const results = await searchMemory({
    query: "What are the user preferences?",
    limit: 5
});
console.log(results);

// Delete memory
await deleteMemory(memoryId);
```

### Task Management (A2A)

Interact with the Agent-to-Agent protocol tasks.

```typescript
import { listTasks, getTask, cancelTask } from 'tauri-plugin-radkit-api';

const tasks = await listTasks();

if (tasks.length > 0) {
    const task = await getTask(tasks[0].taskId);
    console.log(task);
}
```

## Architecture

- **Backend**: Rust (Tauri Plugin) wrapping the `radkit` library.
- **Frontend**: JavaScript/TypeScript (invoking Tauri commands).
- **Communication**:
    - Commands: `init_agent`, `chat`, etc.
    - Events: `stream_event` (streaming responses), `tool_execution_request` (tool calls).
