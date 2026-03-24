use tauri::{AppHandle, Emitter, Manager};

struct AppState {
    pending_file: std::sync::Mutex<Option<String>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(AppState {
            pending_file: std::sync::Mutex::new(None),
        })
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let app_handle = app.handle().clone();

                // Register deep-link handler
                app.deep_link().on_open_url(move |event| {
                    for url in event.urls() {
                        let url_str = url.to_string();
                        if let Some(path) = url_str.strip_prefix("file://") {
                            let path = path.replace("%20", " ");
                            // Try emit first (works if frontend is already listening)
                            let _ = app_handle.emit("open-file", &path);
                            // Also store in state as fallback (for cold start)
                            if let Some(state) = app_handle.try_state::<AppState>() {
                                let mut pending = state.pending_file.lock().unwrap();
                                *pending = Some(path);
                            }
                        }
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_pending_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_pending_file(app: AppHandle) -> Option<String> {
    if let Some(state) = app.try_state::<AppState>() {
        let mut pending = state.pending_file.lock().unwrap();
        pending.take()
    } else {
        None
    }
}
