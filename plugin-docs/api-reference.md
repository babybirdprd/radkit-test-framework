# API Reference

The `tauri-plugin-radkit-api` package exports the following functions and types.

## Functions

### `initAgent(config: InitAgentRequest): Promise<void>`
Initializes the Radkit runtime and agent. This spawns a local server and connects the A2A client.

### `chat(message: string, contextId?: string, taskId?: string): Promise<any>`
Sends a message to the agent and waits for the complete response. Returns the A2A message response object.

### `streamChat(message: string, contextId?: string, taskId?: string): Promise<void>`
Sends a message and initiates a streaming response.
**Note**: This function does not return the chunks. You must listen for the `stream_event` Tauri event to receive data.

### `submitToolOutput(payload: ToolOutputPayload): Promise<void>`
Submits the result of a tool execution back to the agent. Call this after processing a `tool_execution_request`.

### `saveMemory(request: SaveMemoryRequest): Promise<string>`
Saves a text entry to the vector memory. Returns the ID of the created memory entry.

### `searchMemory(request: SearchMemoryRequest): Promise<MemoryEntryResult[]>`
Searches the vector memory for semantically similar entries.

### `deleteMemory(id: string): Promise<boolean>`
Deletes a memory entry by ID.

### `listTasks(contextId?: string): Promise<any[]>`
Lists tasks, optionally filtered by context ID.

### `getTask(taskId: string): Promise<any>`
Retrieves details of a specific task.

### `cancelTask(taskId: string): Promise<any>`
Cancels a running task.

## Interfaces

### `InitAgentRequest`
```typescript
interface InitAgentRequest {
  name: string;
  description: string;
  llm: LlmConfig;
  tools: ToolDefinition[];
}
```

### `LlmConfig`
Configuration for different LLM providers.

```typescript
type LlmConfig =
  | { provider: "OpenAI"; model: string; apiKey?: string; ...CommonLlmConfig }
  | { provider: "Anthropic"; model: string; apiKey?: string; ...CommonLlmConfig }
  | { provider: "Gemini"; model: string; apiKey?: string; ...CommonLlmConfig }
  | { provider: "OpenRouter"; model: string; apiKey?: string; siteUrl?: string; appName?: string; ...CommonLlmConfig }
  | { provider: "Grok"; model: string; apiKey?: string; ...CommonLlmConfig }
  | { provider: "DeepSeek"; model: string; apiKey?: string; ...CommonLlmConfig };

interface CommonLlmConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}
```

### `ToolDefinition`
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: any; // JSON Schema object defining arguments
}
```

### `ToolOutputPayload`
```typescript
interface ToolOutputPayload {
    requestId: string;
    result: any;
    isError: boolean;
}
```

### `Memory Types`
```typescript
interface SaveMemoryRequest {
    text: string;
    sourceId?: string;
    metadata?: any;
}

interface SearchMemoryRequest {
    query: string;
    limit?: number;
    minScore?: number;
}

interface MemoryEntryResult {
    id: string;
    text: string;
    score: number;
    metadata: any;
}
```
