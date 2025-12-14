use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitAgentRequest {
    pub name: String,
    pub description: String,
    pub llm: LlmConfig,
    pub tools: Vec<ToolDefinition>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "provider", rename_all = "camelCase")]
pub enum LlmConfig {
    OpenAI { model: String, api_key: Option<String> },
    Anthropic { model: String, api_key: Option<String> },
    Gemini { model: String, api_key: Option<String> },
    // Add others as needed
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: Value,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolOutputRequest {
    pub request_id: String,
    pub result: Value, // This should be compatible with ToolResult
    pub is_error: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitResponse {
    pub success: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatResponse {
    pub task_id: String,
}
