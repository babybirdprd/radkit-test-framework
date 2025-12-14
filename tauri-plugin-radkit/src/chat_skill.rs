use std::sync::Arc;
use radkit::agent::{SkillHandler, RegisteredSkill, SkillMetadata, OnRequestResult, OnInputResult};
use radkit::runtime::context::{State, ProgressSender};
use radkit::runtime::AgentRuntime;
use radkit::models::{Content, Thread};
use radkit::tools::BaseToolset;
use radkit::errors::{AgentError};
use async_trait::async_trait;

pub struct ChatSkill {
    tools: Arc<dyn BaseToolset>,
}

impl ChatSkill {
    pub fn new(tools: Arc<dyn BaseToolset>) -> Self {
        Self { tools }
    }
}

static CHAT_METADATA: SkillMetadata = SkillMetadata::new(
    "chat",
    "Chat",
    "A generic chat skill with tool support",
    &[],
    &[],
    &[],
    &[],
);

#[async_trait]
impl SkillHandler for ChatSkill {
    async fn on_request(
        &self,
        _state: &mut State,
        _progress: &ProgressSender,
        runtime: &dyn AgentRuntime,
        content: Content,
    ) -> Result<OnRequestResult, AgentError> {
        let llm = runtime.default_llm();

        // We use the text content for now.
        let text = content.joined_texts().unwrap_or_default();
        let thread = Thread::from_user(text);

        let response = llm.generate_content(thread, Some(self.tools.clone())).await?;

        Ok(OnRequestResult::Completed {
            message: Some(response.content().clone()),
            artifacts: Vec::new(),
        })
    }

    async fn on_input_received(
        &self,
        _state: &mut State,
        _progress: &ProgressSender,
        _runtime: &dyn AgentRuntime,
        _input: Content,
    ) -> Result<OnInputResult, AgentError> {
        Err(AgentError::Internal {
            component: "ChatSkill".into(),
            reason: "Unexpected input received".into(),
        })
    }
}

impl RegisteredSkill for ChatSkill {
    fn metadata() -> &'static SkillMetadata {
        &CHAT_METADATA
    }
}
