import { invoke } from "@tauri-apps/api/core";

export interface CommonLlmConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export type LlmConfig =
  | ({ provider: "OpenAI"; model: string; apiKey?: string } & CommonLlmConfig)
  | ({ provider: "Anthropic"; model: string; apiKey?: string } & CommonLlmConfig)
  | ({ provider: "Gemini"; model: string; apiKey?: string } & CommonLlmConfig)
  | ({ provider: "OpenRouter"; model: string; apiKey?: string; siteUrl?: string; appName?: string } & CommonLlmConfig)
  | ({ provider: "Grok"; model: string; apiKey?: string } & CommonLlmConfig)
  | ({ provider: "DeepSeek"; model: string; apiKey?: string } & CommonLlmConfig);

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

export interface InitAgentRequest {
  name: string;
  description: string;
  llm: LlmConfig;
  tools: ToolDefinition[];
}

export interface MemoryEntryResult {
    id: string;
    text: string;
    score: number;
    metadata: any;
}

export interface SearchMemoryRequest {
    query: string;
    limit?: number;
    minScore?: number;
}

export interface SaveMemoryRequest {
    text: string;
    sourceId?: string;
    metadata?: any;
}

export interface ListTasksRequest {
    contextId?: string;
}

export interface GetTaskRequest {
    taskId: string;
}

export interface CancelTaskRequest {
    taskId: string;
}

export const api = {
  initAgent: (config: InitAgentRequest) => invoke("plugin:radkit|init_agent", { config }),
  chat: (message: string, contextId?: string, taskId?: string) => invoke("plugin:radkit|chat", { message, contextId, taskId }),
  streamChat: (message: string, contextId?: string, taskId?: string) => invoke("plugin:radkit|stream_chat", { message, contextId, taskId }),
  submitToolOutput: (payload: any) => invoke("plugin:radkit|submit_tool_output", { payload }),
  searchMemory: (request: SearchMemoryRequest) => invoke<MemoryEntryResult[]>("plugin:radkit|search_memory", { request }),
  saveMemory: (request: SaveMemoryRequest) => invoke<string>("plugin:radkit|save_memory", { request }),
  deleteMemory: (id: string) => invoke<boolean>("plugin:radkit|delete_memory", { request: { id } }),
  listTasks: (contextId?: string) => invoke<any[]>("plugin:radkit|list_tasks", { request: { contextId } }),
  getTask: (taskId: string) => invoke<any>("plugin:radkit|get_task", { request: { taskId } }),
  cancelTask: (taskId: string) => invoke<any>("plugin:radkit|cancel_task", { request: { taskId } }),
};
