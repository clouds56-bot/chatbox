use rusqlite::{params, Connection};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

const CONFIG_FILE_NAME: &str = "config.json";
const SESSION_DB_NAME: &str = "session.db";

fn ensure_parent_dir(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("failed to create parent dir: {e}"))?;
    }
    Ok(())
}

fn config_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("failed to resolve app config dir: {e}"))?;
    Ok(dir.join(CONFIG_FILE_NAME))
}

fn session_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?;
    Ok(dir.join(SESSION_DB_NAME))
}

#[tauri::command]
fn load_config(app: tauri::AppHandle) -> Result<String, String> {
    let path = config_file_path(&app)?;
    if !path.exists() {
        return Ok("{}".to_string());
    }

    fs::read_to_string(path).map_err(|e| format!("failed to read config file: {e}"))
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, config_json: String) -> Result<(), String> {
    let path = config_file_path(&app)?;
    ensure_parent_dir(&path)?;
    fs::write(path, config_json).map_err(|e| format!("failed to write config file: {e}"))
}

#[tauri::command]
fn load_session(app: tauri::AppHandle) -> Result<String, String> {
    let db_path = session_db_path(&app)?;
    ensure_parent_dir(&db_path)?;

    let conn = Connection::open(db_path).map_err(|e| format!("failed to open session db: {e}"))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )",
        [],
    )
    .map_err(|e| format!("failed to initialize session table: {e}"))?;

    let mut stmt = conn
        .prepare("SELECT data FROM app_session WHERE id = 1")
        .map_err(|e| format!("failed to prepare session query: {e}"))?;

    match stmt.query_row([], |row| row.get::<_, String>(0)) {
        Ok(data) => Ok(data),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok("{}".to_string()),
        Err(e) => Err(format!("failed to load session: {e}")),
    }
}

#[tauri::command]
fn save_session(app: tauri::AppHandle, session_json: String) -> Result<(), String> {
    let db_path = session_db_path(&app)?;
    ensure_parent_dir(&db_path)?;

    let conn = Connection::open(db_path).map_err(|e| format!("failed to open session db: {e}"))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )",
        [],
    )
    .map_err(|e| format!("failed to initialize session table: {e}"))?;

    conn.execute(
        "INSERT INTO app_session (id, data, updated_at)
       VALUES (1, ?1, CAST(strftime('%s', 'now') AS INTEGER))
       ON CONFLICT(id) DO UPDATE SET
         data = excluded.data,
         updated_at = excluded.updated_at",
        params![session_json],
    )
    .map_err(|e| format!("failed to save session: {e}"))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            load_session,
            save_session
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
