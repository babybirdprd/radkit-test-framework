use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde_json::Value;
use radkit::tools::{BaseTool, FunctionDeclaration, ToolResult, ToolContext};
use tauri::{AppHandle, Emitter, Runtime};
use tokio::sync::oneshot;
use uuid::Uuid;

pub struct FrontendTool<R: Runtime> {
    name: String,
    description: String,
    parameters: Value,
    app_handle: AppHandle<R>,
    pending_requests: Arc<Mutex<HashMap<String, oneshot::Sender<ToolResult>>>>,
}

impl<R: Runtime> FrontendTool<R> {
    pub fn new(
        name: String,
        description: String,
        parameters: Value,
        app_handle: AppHandle<R>,
        pending_requests: Arc<Mutex<HashMap<String, oneshot::Sender<ToolResult>>>>,
    ) -> Self {
        Self {
            name,
            description,
            parameters,
            app_handle,
            pending_requests,
        }
    }
}

#[async_trait::async_trait]
impl<R: Runtime> BaseTool for FrontendTool<R> {
    fn name(&self) -> &str {
        &self.name
    }

    fn description(&self) -> &str {
        &self.description
    }

    fn declaration(&self) -> FunctionDeclaration {
         FunctionDeclaration::new(
            self.name.clone(),
            self.description.clone(),
            self.parameters.clone(),
        )
    }

    async fn run_async(
        &self,
        args: HashMap<String, Value>,
        _context: &ToolContext<'_>,
    ) -> ToolResult {
        let request_id = Uuid::new_v4().to_string();
        let (tx, rx) = oneshot::channel();

        {
            let mut pending = self.pending_requests.lock().unwrap();
            pending.insert(request_id.clone(), tx);
        }

        let event_payload = serde_json::json!({
            "requestId": request_id,
            "name": self.name,
            "args": args,
        });

        if let Err(e) = self.app_handle.emit("tool_execution_request", event_payload) {
            return ToolResult::error(format!("Failed to emit event: {}", e));
        }

        match rx.await {
            Ok(result) => result,
            Err(_) => ToolResult::error("Tool execution cancelled or channel closed"),
        }
    }
}
