use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let app_handle = app.handle().clone();

                // Register deep-link handler
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        let url_str = url.to_string();
                        // Handle file:// URLs from macOS file association
                        if let Some(path) = url_str.strip_prefix("file://") {
                            let path = path.replace("%20", " ");
                            // Window might not be ready yet — emit to the app handle
                            // Frontend will listen on app handle for the event
                            let _ = app_handle.emit("open-file", path);
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
