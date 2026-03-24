use tauri::{AppHandle, Emitter, Manager};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;

struct AppState {
    pending_file: std::sync::Mutex<Option<String>>,
    current_file: std::sync::Mutex<Option<String>>,
}

fn log_debug(msg: &str) {
    // Also write to a temp file for easy debugging
    if let Ok(home) = std::env::var("HOME") {
        let log_path = PathBuf::from(home).join("markup-reader-debug.log");
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&log_path) {
            let _ = writeln!(file, "[{}] {}", chrono_lite(), msg);
        }
    }
    eprintln!("{}", msg);
}

fn chrono_lite() -> String {
    use std::time::SystemTime;
    let now = SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}.{:09}", now.as_secs(), now.subsec_nanos())
}

fn extract_file_path_from_args() -> Option<String> {
    let args: Vec<String> = std::env::args().collect();
    log_debug(&format!("[DEBUG] command line args: {:?}", args));

    // Look for a file path argument (typically ends with .md, .markdown, .txt, or is an absolute path)
    for arg in &args {
        // Skip the first arg (binary path)
        if arg == args.first()? {
            continue;
        }

        log_debug(&format!("[DEBUG] checking arg: {}", arg));

        // Check if it looks like a file path
        if arg.starts_with('/') {
            let is_markdown = arg.ends_with(".md") || arg.ends_with(".markdown") || arg.ends_with(".txt");
            log_debug(&format!("[DEBUG] arg starts with /, is_markdown: {}", is_markdown));
            if is_markdown {
                log_debug(&format!("[DEBUG] found file path in args: {}", arg));
                return Some(arg.clone());
            }
        }

        // Also handle file:// URLs in args (some systems pass it this way)
        if let Some(path) = arg.strip_prefix("file://") {
            let path = path.replace("%20", " ");
            log_debug(&format!("[DEBUG] found file:// in args: {}", path));
            return Some(path);
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    log_debug("[DEBUG] ====== APP STARTING ======");

    // Check for file path in command line args (macOS file association cold start)
    let cli_file_path = extract_file_path_from_args();
    log_debug(&format!("[DEBUG] cli_file_path: {:?}", cli_file_path));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .manage(AppState {
            pending_file: std::sync::Mutex::new(cli_file_path.clone()),
            current_file: std::sync::Mutex::new(None),
        })
        .setup(|app| {
            log_debug("[DEBUG] setup() called");

            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let app_handle = app.handle().clone();

                // Check if app was launched with URLs (deep link) - macOS file association
                let urls_result = app.deep_link().get_current();
                log_debug(&format!("[DEBUG] get_current() returned: {:?}", urls_result));
                if let Ok(Some(urls)) = urls_result {
                    for url in urls {
                        let url_str = url.to_string();
                        if let Some(path) = url_str.strip_prefix("file://") {
                            let path = path.replace("%20", " ");
                            log_debug(&format!("[DEBUG] storing pending file from get_current(): {}", path));
                            if let Some(state) = app_handle.try_state::<AppState>() {
                                let mut pending = state.pending_file.lock().unwrap();
                                *pending = Some(path.clone());
                            }
                        }
                    }
                }

                // Register deep-link handler
                app.deep_link().on_open_url(move |event| {
                    let urls = event.urls();
                    log_debug(&format!("[DEBUG] deep_link event received: {:?}", urls));
                    for url in urls {
                        let url_str = url.to_string();
                        log_debug(&format!("[DEBUG] processing url: {}", url_str));
                        if let Some(path) = url_str.strip_prefix("file://") {
                            let path = path.replace("%20", " ");
                            log_debug(&format!("[DEBUG] file path: {}", path));

                            // Check if this file is already open
                            let is_already_open = app_handle.try_state::<AppState>()
                                .map(|state| {
                                    let current = state.current_file.lock().unwrap();
                                    *current == Some(path.clone())
                                })
                                .unwrap_or(false);

                            if is_already_open {
                                // File is already open, emit focus event
                                log_debug(&format!("[DEBUG] file already open, focusing window: {}", path));
                                let _ = app_handle.emit("focus-window", &path);
                            } else {
                                // New file, emit open event
                                log_debug(&format!("[DEBUG] new file, opening: {}", path));
                                let _ = app_handle.emit("open-file", &path);
                            }

                            // Also store in state as fallback (for cold start)
                            if let Some(state) = app_handle.try_state::<AppState>() {
                                let mut pending = state.pending_file.lock().unwrap();
                                *pending = Some(path.clone());
                                log_debug(&format!("[DEBUG] stored pending file: {}", path));
                            }
                        }
                    }
                });

                log_debug("[DEBUG] deep_link handler registered");
            }
            #[cfg(not(desktop))]
            {
                log_debug("[DEBUG] not desktop, skipping deep_link setup");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_pending_file, set_current_file, clear_current_file])
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

#[tauri::command]
fn set_current_file(app: AppHandle, file_path: String) {
    if let Some(state) = app.try_state::<AppState>() {
        let mut current = state.current_file.lock().unwrap();
        *current = Some(file_path);
        log_debug(&format!("[DEBUG] set_current_file: {:?}", current));
    }
}

#[tauri::command]
fn clear_current_file(app: AppHandle) {
    if let Some(state) = app.try_state::<AppState>() {
        let mut current = state.current_file.lock().unwrap();
        *current = None;
        log_debug("[DEBUG] clear_current_file");
    }
}
