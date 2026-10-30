use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

#[tauri::command]
fn platform() -> &'static str {
    std::env::consts::OS
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    // Tauri 2.11.3 webview/mod.rs routes unhandled plugin commands to the
    // registered mobile plugin after ACL validation, including Channel arguments.
    // Kotlin @Command methods therefore need no duplicate Rust forwarding layer.
    Builder::new("play-billing")
        .invoke_handler(tauri::generate_handler![platform])
        .setup(|_app, _api| {
            #[cfg(target_os = "android")]
            _api.register_android_plugin("mba.robin.squash.billing", "PlayBillingPlugin")?;
            Ok(())
        })
        .build()
}
