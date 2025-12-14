import { invoke } from '@tauri-apps/api/core'

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

export async function initAgent(config: InitAgentRequest): Promise<void> {
  await invoke('plugin:radkit|init_agent', { config });
}

export async function chat(message: string, contextId?: string, taskId?: string): Promise<any> {
  return await invoke('plugin:radkit|chat', { message, contextId, taskId });
}

export async function streamChat(message: string, contextId?: string, taskId?: string): Promise<void> {
  await invoke('plugin:radkit|stream_chat', { message, contextId, taskId });
}

export async function submitToolOutput(payload: any): Promise<void> {
  await invoke('plugin:radkit|submit_tool_output', { payload });
}

export async function searchMemory(request: SearchMemoryRequest): Promise<MemoryEntryResult[]> {
  return await invoke('plugin:radkit|search_memory', { request });
}

export async function saveMemory(request: SaveMemoryRequest): Promise<string> {
  return await invoke('plugin:radkit|save_memory', { request });
}

export async function deleteMemory(id: string): Promise<boolean> {
  return await invoke('plugin:radkit|delete_memory', { request: { id } });
}

export async function listTasks(contextId?: string): Promise<any[]> {
  return await invoke('plugin:radkit|list_tasks', { request: { contextId } });
}

export async function getTask(taskId: string): Promise<any> {
  return await invoke('plugin:radkit|get_task', { request: { taskId } });
}

export async function cancelTask(taskId: string): Promise<any> {
  return await invoke('plugin:radkit|cancel_task', { request: { taskId } });
}
