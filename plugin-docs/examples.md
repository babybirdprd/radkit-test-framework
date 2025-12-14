# Examples

## 1. Basic Chat Application

A simple "Hello World" of agent interaction.

```typescript
import { initAgent, chat } from "tauri-plugin-radkit-api";

// 1. Initialize
await initAgent({
  name: "ChatBot",
  description: "A simple chat bot",
  llm: { provider: "OpenAI", model: "gpt-3.5-turbo" },
  tools: []
});

// 2. Chat Loop
async function sendMessage(text) {
  const response = await chat(text);

  // The response is an A2A Message object.
  // Extract the text content from the first part.
  // Note: Production code should handle multiple parts and types.
  const content = response.parts[0].text;
  return content;
}
```

## 2. RAG (Retrieval-Augmented Generation)

Enhancing the agent with knowledge from your docs.

```typescript
import { initAgent, chat, searchMemory, saveMemory } from "tauri-plugin-radkit-api";

// 1. Ingest Data (do this once or when documents change)
async function ingestDocs() {
  await saveMemory({ text: "Radkit is a Rust SDK for agents." });
  await saveMemory({ text: "Tauri allows building cross-platform apps." });
}

// 2. RAG Chat Function
async function chatWithContext(userQuery) {
  // A. Search Memory for relevant context
  const relevantDocs = await searchMemory({ query: userQuery, limit: 2 });
  const context = relevantDocs.map(d => d.text).join("\n");

  // B. Construct Prompt
  const prompt = `
    Context:
    ${context}

    User Question: ${userQuery}
  `;

  // C. Send to Agent
  return await chat(prompt);
}
```

## 3. Desktop Automation Agent

Using tools to control the desktop environment via Tauri commands.

```typescript
// Define tool for opening apps
const tools = [{
  name: "open_app",
  description: "Opens an application by name",
  parameters: {
    type: "object",
    properties: { appName: { type: "string" } },
    required: ["appName"]
  }
}];

await initAgent({ ..., tools });

// Set up the listener for tool execution
import { listen } from "@tauri-apps/api/event";
import { submitToolOutput } from "tauri-plugin-radkit-api";
import { invoke } from "@tauri-apps/api/core";

listen("tool_execution_request", async (event) => {
    const { requestId, name, args } = event.payload;

    if (name === "open_app") {
        // Assume you have a Tauri command "open_application"
        try {
            await invoke("open_application", { name: args.appName });
            await submitToolOutput({ requestId, result: "Opened successfully", isError: false });
        } catch (e) {
            await submitToolOutput({ requestId, result: String(e), isError: true });
        }
    }
});

// Usage
await chat("Open the calculator for me.");
// Agent calls "open_app" with { appName: "calculator" }
```
