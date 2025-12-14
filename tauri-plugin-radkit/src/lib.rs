use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Radkit;
#[cfg(mobile)]
use mobile::Radkit;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the radkit APIs.
pub trait RadkitExt<R: Runtime> {
  fn radkit(&self) -> &Radkit<R>;
}

impl<R: Runtime, T: Manager<R>> crate::RadkitExt<R> for T {
  fn radkit(&self) -> &Radkit<R> {
    self.state::<Radkit<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("radkit")
    .invoke_handler(tauri::generate_handler![commands::ping])
    .setup(|app, api| {
      #[cfg(mobile)]
      let radkit = mobile::init(app, api)?;
      #[cfg(desktop)]
      let radkit = desktop::init(app, api)?;
      app.manage(radkit);
      Ok(())
    })
    .build()
}
