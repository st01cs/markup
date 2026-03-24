use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_cli::CliExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_cli::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                // Handle file path passed at startup (macOS file association)
                // When macOS opens a .md file with Markup Reader, the path comes as CLI arg
                if let Ok(matches) = app.cli().matches() {
                    if let Some(file_path) = matches.args.get("file") {
                        if let serde_json::Value::String(path) = &file_path.value {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("open-file", path.clone());
                            }
                        }
                    }
                }

                // Also handle deep-link for URL scheme invocations
                use tauri_plugin_deep_link::DeepLinkExt;
                let app_handle = app.handle().clone();
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        if let Some(path) = url.to_string().strip_prefix("file://") {
                            let path = path.replace("%20", " ");
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _: Result<(), _> = window.emit("open-file", path);
                            }
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
