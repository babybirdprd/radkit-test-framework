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

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CommonLlmConfig {
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub top_p: Option<f32>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(tag = "provider", rename_all = "camelCase")]
pub enum LlmConfig {
    OpenAI {
        model: String,
        api_key: Option<String>,
        #[serde(flatten)]
        common: Option<CommonLlmConfig>,
    },
    Anthropic {
        model: String,
        api_key: Option<String>,
        #[serde(flatten)]
        common: Option<CommonLlmConfig>,
    },
    Gemini {
        model: String,
        api_key: Option<String>,
        #[serde(flatten)]
        common: Option<CommonLlmConfig>,
    },
    OpenRouter {
        model: String,
        api_key: Option<String>,
        site_url: Option<String>,
        app_name: Option<String>,
        #[serde(flatten)]
        common: Option<CommonLlmConfig>,
    },
    Grok {
        model: String,
        api_key: Option<String>,
        #[serde(flatten)]
        common: Option<CommonLlmConfig>,
    },
    DeepSeek {
        model: String,
        api_key: Option<String>,
        #[serde(flatten)]
        common: Option<CommonLlmConfig>,
    },
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
    pub result: Value,
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchMemoryRequest {
    pub query: String,
    pub limit: Option<usize>,
    pub min_score: Option<f32>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveMemoryRequest {
    pub text: String,
    pub source_id: Option<String>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMemoryRequest {
    pub id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryEntryResult {
    pub id: String,
    pub text: String,
    pub score: f32,
    pub metadata: Value,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListTasksRequest {
    pub context_id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTaskRequest {
    pub task_id: String,
}
