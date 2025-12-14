# Streaming Guide

For a more responsive UI, especially with long LLM generations, you should use the streaming API. This allows you to display the agent's response token-by-token as it is generated.

## 1. Initiate Stream

Instead of calling `chat`, call `streamChat`. Note that this function returns immediately (after sending the request) and does *not* return the response data directly.

```typescript
import { streamChat } from "tauri-plugin-radkit-api";

await streamChat("Tell me a long story about a space adventure.");
```

## 2. Listen for Events

The plugin emits `stream_event` for every chunk of data received from the LLM. You should set up a listener *before* calling `streamChat`.

```typescript
import { listen } from "@tauri-apps/api/event";

// Store the unlisten function to clean up later
const unlisten = await listen("stream_event", (event) => {
    // The event payload structure depends on the A2A protocol
    // Usually it contains a delta or part of the content
    const payload = event.payload;

    console.log("Stream chunk:", payload);

    // Update your UI here
    // For example, append payload.content to the chat window
});
```

## 3. Handling Completion

The stream will eventually finish. The exact completion event depends on the provider, but typically the stream stops emitting. You might interpret a specific "stop" event or handle it in your UI logic.

> **Note**: Streaming support varies by LLM provider. Ensure your provider config supports streaming.
