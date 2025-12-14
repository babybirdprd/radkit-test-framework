use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use radkit::runtime::Runtime;
use radkit::tools::ToolResult;
use a2a_client::A2AClient;
use tokio::sync::oneshot;

pub struct RadkitRuntimeState {
    pub runtime: Mutex<Option<Arc<Runtime>>>,
    pub client: Mutex<Option<A2AClient>>,
    pub tool_requests: Arc<Mutex<HashMap<String, oneshot::Sender<ToolResult>>>>,
}

impl RadkitRuntimeState {
    pub fn new() -> Self {
        Self {
            runtime: Mutex::new(None),
            client: Mutex::new(None),
            tool_requests: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
