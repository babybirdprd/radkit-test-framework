# Tooling Guide

Radkit allows you to define "tools" — functions that the AI agent can call. In the context of the Tauri plugin, these tools are executed in your frontend (JavaScript/TypeScript) environment, giving the agent access to the DOM, browser APIs, or Tauri APIs (like file system or clipboard).

## 1. Defining Tools

You define tools during agent initialization. A tool needs a name, description, and a JSON Schema for its parameters.

```typescript
import { initAgent } from "tauri-plugin-radkit-api";

const tools = [
  {
    name: "calculator",
    description: "Perform basic arithmetic operations",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
        op: { type: "string", enum: ["+", "-", "*", "/"], description: "Operator" }
      },
      required: ["a", "b", "op"]
    }
  },
  {
    name: "read_clipboard",
    description: "Read text from the system clipboard",
    parameters: { type: "object", properties: {} }
  }
];

await initAgent({ ..., tools });
```

## 2. Handling Execution Requests

When the agent decides to use a tool, the plugin emits a `tool_execution_request` event. You must listen for this event and execute the corresponding logic.

```typescript
import { listen } from "@tauri-apps/api/event";
import { api } from "./api"; // Your API wrapper or direct import

// Listen for tool requests
await listen("tool_execution_request", async (event) => {
    const { requestId, name, args } = event.payload;

    console.log(`Agent wants to run tool ${name} with args`, args);

    let result;
    let isError = false;

    try {
        if (name === "calculator") {
            const { a, b, op } = args;
            if (op === "+") result = a + b;
            else if (op === "-") result = a - b;
            // ...
            result = { value: result };
        } else if (name === "read_clipboard") {
            // Use Tauri's clipboard API
            // result = { text: await readText() };
            result = { text: "mock clipboard content" };
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    } catch (e) {
        result = String(e);
        isError = true;
    }

    // IMPORTANT: You must send the result back!
    await submitOutput(requestId, result, isError);
});
```

## 3. Submitting Output

After executing the tool, use `submitToolOutput` to return the result to the agent so it can continue its thought process.

```typescript
import { submitToolOutput } from "tauri-plugin-radkit-api";

async function submitOutput(requestId, result, isError) {
    await submitToolOutput({
        requestId,
        result,
        isError
    });
}
```

The `result` can be any JSON-serializable object (string, number, object, array).
