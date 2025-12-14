use tauri::{AppHandle, State, Runtime as TauriRuntime, Emitter};
use crate::models::*;
use crate::runtime_holder::RadkitRuntimeState;
use crate::frontend_tool::FrontendTool;
use crate::chat_skill::ChatSkill;

use radkit::agent::Agent;
use radkit::runtime::{Runtime, RuntimeBuilder};
use radkit::models::providers::{
    OpenAILlm, AnthropicLlm, GeminiLlm, OpenRouterLlm, GrokLlm, DeepSeekLlm
};
use radkit::tools::{BaseTool, SimpleToolset, ToolResult};
use radkit::runtime::memory::{MemoryContent, SearchOptions};
use radkit::runtime::context::AuthContext;

use a2a_types::{
    MessageSendParams, Message, MessageRole, Part, TaskQueryParams
};
use a2a_client::A2AClient;

use std::sync::Arc;
use std::time::Duration;
use futures::StreamExt;
use serde_json::Value;

struct DynamicLlm(Arc<dyn radkit::models::BaseLlm>);

#[async_trait::async_trait]
impl radkit::models::BaseLlm for DynamicLlm {
    fn model_name(&self) -> &str {
        self.0.model_name()
    }
    async fn generate_content(
        &self,
        thread: radkit::models::Thread,
        toolset: Option<Arc<dyn radkit::tools::BaseToolset>>,
    ) -> radkit::errors::AgentResult<radkit::models::LlmResponse> {
        self.0.generate_content(thread, toolset).await
    }
}

fn get_client(state: &State<'_, RadkitRuntimeState>) -> Result<A2AClient, String> {
    let guard = state.client.lock().unwrap();
    guard.clone().ok_or_else(|| "Client not initialized".to_string())
}

fn get_runtime(state: &State<'_, RadkitRuntimeState>) -> Result<Arc<Runtime>, String> {
    let guard = state.runtime.lock().unwrap();
    guard.clone().ok_or_else(|| "Runtime not initialized".to_string())
}

#[tauri::command]
pub async fn init_agent<R: TauriRuntime>(
    app: AppHandle<R>,
    state: State<'_, RadkitRuntimeState>,
    config: InitAgentRequest,
) -> Result<InitResponse, String> {
    let llm_arc: Arc<dyn radkit::models::BaseLlm> = match config.llm {
        LlmConfig::OpenAI { model, api_key, common } => {
            let mut llm = if let Some(key) = api_key {
                OpenAILlm::new(model, key)
            } else {
                OpenAILlm::from_env(model).map_err(|e| e.to_string())?
            };
            if let Some(c) = common {
                if let Some(mt) = c.max_tokens { llm = llm.with_max_tokens(mt); }
                if let Some(temp) = c.temperature { llm = llm.with_temperature(temp); }
                if let Some(p) = c.top_p { llm = llm.with_top_p(p); }
            }
            Arc::new(llm)
        },
        LlmConfig::Anthropic { model, api_key, common } => {
             let mut llm = if let Some(key) = api_key {
                AnthropicLlm::new(model, key)
            } else {
                AnthropicLlm::from_env(model).map_err(|e| e.to_string())?
            };
            if let Some(c) = common {
                if let Some(mt) = c.max_tokens { llm = llm.with_max_tokens(mt); }
                if let Some(temp) = c.temperature { llm = llm.with_temperature(temp); }
                 if let Some(p) = c.top_p { llm = llm.with_top_p(p); }
            }
            Arc::new(llm)
        },
        LlmConfig::Gemini { model, api_key, common } => {
             let mut llm = if let Some(key) = api_key {
                GeminiLlm::new(model, key)
            } else {
                GeminiLlm::from_env(model).map_err(|e| e.to_string())?
            };
             if let Some(c) = common {
                if let Some(mt) = c.max_tokens { llm = llm.with_max_tokens(mt); }
                if let Some(temp) = c.temperature { llm = llm.with_temperature(temp); }
                if let Some(p) = c.top_p { llm = llm.with_top_p(p); }
            }
            Arc::new(llm)
        },
        LlmConfig::OpenRouter { model, api_key, site_url, app_name, common } => {
             let mut llm = if let Some(key) = api_key {
                OpenRouterLlm::new(model, key)
            } else {
                OpenRouterLlm::from_env(model).map_err(|e| e.to_string())?
            };
            if let Some(url) = site_url { llm = llm.with_site_url(url); }
            if let Some(name) = app_name { llm = llm.with_app_name(name); }

             if let Some(c) = common {
                if let Some(mt) = c.max_tokens { llm = llm.with_max_tokens(mt); }
                if let Some(temp) = c.temperature { llm = llm.with_temperature(temp); }
            }
            Arc::new(llm)
        },
        LlmConfig::Grok { model, api_key, common } => {
             let mut llm = if let Some(key) = api_key {
                GrokLlm::new(model, key)
            } else {
                GrokLlm::from_env(model).map_err(|e| e.to_string())?
            };
             if let Some(c) = common {
                if let Some(mt) = c.max_tokens { llm = llm.with_max_tokens(mt); }
                if let Some(temp) = c.temperature { llm = llm.with_temperature(temp); }
                 if let Some(p) = c.top_p { llm = llm.with_top_p(p); }
            }
            Arc::new(llm)
        },
         LlmConfig::DeepSeek { model, api_key, common } => {
             let mut llm = if let Some(key) = api_key {
                DeepSeekLlm::new(model, key)
            } else {
                DeepSeekLlm::from_env(model).map_err(|e| e.to_string())?
            };
             if let Some(c) = common {
                if let Some(mt) = c.max_tokens { llm = llm.with_max_tokens(mt); }
                if let Some(temp) = c.temperature { llm = llm.with_temperature(temp); }
                 if let Some(p) = c.top_p { llm = llm.with_top_p(p); }
            }
            Arc::new(llm)
        },
    };

    let llm = DynamicLlm(llm_arc);

    let mut tools: Vec<Box<dyn BaseTool>> = Vec::new();
    for tool_def in config.tools {
        let tool = FrontendTool::new(
            tool_def.name,
            tool_def.description,
            tool_def.parameters,
            app.clone(),
            state.tool_requests.clone(),
        );
        tools.push(Box::new(tool));
    }

    let toolset = Arc::new(SimpleToolset::new(tools));
    let chat_skill = ChatSkill::new(toolset);

    let agent = Agent::builder()
        .with_name(config.name)
        .with_description(config.description)
        .with_skill(chat_skill)
        .build();

    let runtime = RuntimeBuilder::new(agent, llm).build();

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    drop(listener);

    let addr = format!("127.0.0.1:{}", port);
    let base_url = format!("http://{}", addr);

    let runtime_clone = runtime.clone();

    *state.runtime.lock().unwrap() = Some(Arc::new(runtime));

    tauri::async_runtime::spawn(async move {
        if let Err(e) = runtime_clone.serve(&addr).await {
            eprintln!("Radkit server error: {}", e);
        }
    });

    let client = reqwest::Client::new();
    let card_url = format!("{}/.well-known/agent-card.json", base_url);
    let mut retries = 0;
    loop {
        if client.get(&card_url).send().await.is_ok() {
             break;
        }
        if retries > 50 {
            return Err("Failed to start agent server".into());
        }
        tokio::time::sleep(Duration::from_millis(200)).await;
        retries += 1;
    }

    let a2a_client = A2AClient::from_card_url(&base_url).await.map_err(|e| e.to_string())?;
    *state.client.lock().unwrap() = Some(a2a_client);

    Ok(InitResponse { success: true })
}

#[tauri::command]
pub async fn chat(
    state: State<'_, RadkitRuntimeState>,
    message: String,
    context_id: Option<String>,
    task_id: Option<String>,
) -> Result<serde_json::Value, String> {
    let client = get_client(&state)?;

    let params = MessageSendParams {
        message: Message {
            kind: "message".into(),
            message_id: uuid::Uuid::new_v4().to_string(),
            role: MessageRole::User,
            parts: vec![Part::Text { text: message, metadata: None }],
            context_id: context_id.clone(),
            task_id: task_id.clone(),
            reference_task_ids: vec![],
            extensions: vec![],
            metadata: None,
        },
        configuration: None,
        metadata: None,
    };

    let result = client.send_message(params).await.map_err(|e| e.to_string())?;

    Ok(serde_json::to_value(result).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn stream_chat<R: TauriRuntime>(
    app: AppHandle<R>,
    state: State<'_, RadkitRuntimeState>,
    message: String,
    context_id: Option<String>,
    task_id: Option<String>,
) -> Result<(), String> {
    let client = get_client(&state)?;

     let params = MessageSendParams {
        message: Message {
            kind: "message".into(),
            message_id: uuid::Uuid::new_v4().to_string(),
            role: MessageRole::User,
            parts: vec![Part::Text { text: message, metadata: None }],
            context_id: context_id.clone(),
            task_id: task_id.clone(),
            reference_task_ids: vec![],
            extensions: vec![],
            metadata: None,
        },
        configuration: None,
        metadata: None,
    };

     let mut stream = client.send_streaming_message(params).await.map_err(|e| e.to_string())?;

     let app_clone = app.clone();
     tauri::async_runtime::spawn(async move {
         while let Some(event_result) = stream.next().await {
             match event_result {
                Ok(event) => {
                     let _ = app_clone.emit("stream_event", event);
                },
                Err(e) => {
                     eprintln!("Stream error: {}", e);
                }
             }
         }
     });
     Ok(())
}

#[tauri::command]
pub async fn submit_tool_output(
    state: State<'_, RadkitRuntimeState>,
    payload: ToolOutputRequest,
) -> Result<(), String> {
    let mut requests = state.tool_requests.lock().unwrap();
    if let Some(tx) = requests.remove(&payload.request_id) {
        let result = if payload.is_error {
             let msg = payload.result.as_str().unwrap_or("Unknown error");
             ToolResult::error(msg)
        } else {
             ToolResult::success(payload.result)
        };
        let _ = tx.send(result);
        Ok(())
    } else {
        Err(format!("Request ID {} not found", payload.request_id))
    }
}

#[tauri::command]
pub async fn search_memory(
    state: State<'_, RadkitRuntimeState>,
    request: SearchMemoryRequest,
) -> Result<Vec<MemoryEntryResult>, String> {
    let runtime = get_runtime(&state)?;
    let memory = runtime.memory();
    let auth = AuthContext {
        app_name: "radkit-tauri".into(),
        user_name: "user".into(),
    };

    let options = SearchOptions {
        limit: request.limit.unwrap_or(10),
        min_score: request.min_score.unwrap_or(0.0),
        ..Default::default()
    };

    let results = memory.search(&auth, &request.query, options).await.map_err(|e| e.to_string())?;

    Ok(results.into_iter().map(|e| MemoryEntryResult {
        id: e.id,
        text: e.content,
        score: e.score,
        metadata: e.metadata,
    }).collect())
}

#[tauri::command]
pub async fn save_memory(
    state: State<'_, RadkitRuntimeState>,
    request: SaveMemoryRequest,
) -> Result<String, String> {
    let runtime = get_runtime(&state)?;
    let memory = runtime.memory();
    let auth = AuthContext {
        app_name: "radkit-tauri".into(),
        user_name: "user".into(),
    };

    let content = MemoryContent {
        content: request.text,
        source: request.source_id,
        metadata: request.metadata,
    };

    let id = memory.add(&auth, content).await.map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub async fn delete_memory(
    state: State<'_, RadkitRuntimeState>,
    request: DeleteMemoryRequest,
) -> Result<bool, String> {
    let runtime = get_runtime(&state)?;
    let memory = runtime.memory();
    let auth = AuthContext {
        app_name: "radkit-tauri".into(),
        user_name: "user".into(),
    };

    let success = memory.delete(&auth, &request.id).await.map_err(|e| e.to_string())?;
    Ok(success)
}

#[tauri::command]
pub async fn list_tasks(
    state: State<'_, RadkitRuntimeState>,
    request: ListTasksRequest,
) -> Result<Vec<serde_json::Value>, String> {
    let client = get_client(&state)?;
    let tasks = client.list_tasks(request.context_id).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(tasks).map_err(|e| e.to_string())?.as_array().unwrap_or(&vec![]).clone())
}

#[tauri::command]
pub async fn get_task(
    state: State<'_, RadkitRuntimeState>,
    request: GetTaskRequest,
) -> Result<serde_json::Value, String> {
    let client = get_client(&state)?;
    let params = TaskQueryParams {
         task_id: request.task_id,
    };
    let task = client.get_task(params).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(task).map_err(|e| e.to_string())?)
}
