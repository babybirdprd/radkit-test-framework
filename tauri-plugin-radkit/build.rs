const COMMANDS: &[&str] = &[
    "init_agent",
    "chat",
    "stream_chat",
    "submit_tool_output",
    "search_memory",
    "save_memory",
    "delete_memory",
    "list_tasks",
    "get_task",
    "cancel_task",
];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
