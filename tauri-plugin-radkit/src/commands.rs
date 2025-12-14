use tauri::{AppHandle, State, Runtime as TauriRuntime, Emitter};
use crate::models::*;
use crate::runtime_holder::RadkitRuntimeState;
use crate::frontend_tool::FrontendTool;
use crate::chat_skill::ChatSkill;

use radkit::agent::Agent;
use radkit::runtime::{Runtime, RuntimeBuilder};
use radkit::models::providers::{OpenAILlm, AnthropicLlm, GeminiLlm};
use radkit::tools::{BaseTool, SimpleToolset, ToolResult};
use a2a_types::{MessageSendParams, Message, MessageRole, Part};
use a2a_client::A2AClient;

use std::sync::Arc;
use std::time::Duration;
use futures::StreamExt;

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

#[tauri::command]
pub async fn init_agent<R: TauriRuntime>(
    app: AppHandle<R>,
    state: State<'_, RadkitRuntimeState>,
    config: InitAgentRequest,
) -> Result<InitResponse, String> {
    let llm_arc: Arc<dyn radkit::models::BaseLlm> = match config.llm {
        LlmConfig::OpenAI { model, api_key } => {
            if let Some(key) = api_key {
                Arc::new(OpenAILlm::new(model, key))
            } else {
                Arc::new(OpenAILlm::from_env(model).map_err(|e| e.to_string())?)
            }
        },
        LlmConfig::Anthropic { model, api_key } => {
             if let Some(key) = api_key {
                Arc::new(AnthropicLlm::new(model, key))
            } else {
                Arc::new(AnthropicLlm::from_env(model).map_err(|e| e.to_string())?)
            }
        },
        LlmConfig::Gemini { model, api_key } => {
             if let Some(key) = api_key {
                Arc::new(GeminiLlm::new(model, key))
            } else {
                Arc::new(GeminiLlm::from_env(model).map_err(|e| e.to_string())?)
            }
        }
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

    // Bind port
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    drop(listener);

    let addr = format!("127.0.0.1:{}", port);
    let base_url = format!("http://{}", addr);

    let runtime_clone = runtime.clone();

    // Store runtime in state (keeping a reference)
    *state.runtime.lock().unwrap() = Some(Arc::new(runtime));

    tauri::async_runtime::spawn(async move {
        // Runtime::serve consumes the instance
        if let Err(e) = runtime_clone.serve(&addr).await {
            eprintln!("Radkit server error: {}", e);
        }
    });

    // Poll for readiness
    let client = reqwest::Client::new();
    let card_url = format!("{}/.well-known/agent-card.json", base_url);
    let mut retries = 0;
    loop {
        if client.get(&card_url).send().await.is_ok() {
             break;
        }
        if retries > 50 { // 10s timeout
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
    let client = {
        let guard = state.client.lock().unwrap();
        guard.clone().ok_or("Client not initialized")?
    };

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
    let client = {
        let guard = state.client.lock().unwrap();
        guard.clone().ok_or("Client not initialized")?
    };

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
                     // event is SendStreamingMessageResult
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
