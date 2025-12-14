use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;
use runtime_holder::RadkitRuntimeState;

mod commands;
mod error;
mod models;
mod runtime_holder;
mod frontend_tool;
mod chat_skill;

pub use error::{Error, Result};

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("radkit")
    .invoke_handler(tauri::generate_handler![
        commands::init_agent,
        commands::chat,
        commands::stream_chat,
        commands::submit_tool_output,
        commands::search_memory,
        commands::save_memory,
        commands::delete_memory,
        commands::list_tasks,
        commands::get_task,
        commands::cancel_task
    ])
    .setup(|app, _api| {
      app.manage(RadkitRuntimeState::new());
      Ok(())
    })
    .build()
}
