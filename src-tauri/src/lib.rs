use globset::{Glob, GlobSet, GlobSetBuilder};
use regex::Regex;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Component, Path, PathBuf};
use tauri::Manager;
use walkdir::WalkDir;

const CONFIG_FILE_NAME: &str = "config.json";
const SESSION_DB_NAME: &str = "session.db";
const DEFAULT_MAX_TOOL_ITERATIONS: usize = 6;
const DEFAULT_MAX_TOOL_CALLS: usize = 12;
const DEFAULT_LIST_LIMIT: usize = 200;
const DEFAULT_GREP_LIMIT: usize = 100;
const DEFAULT_READ_LIMIT: usize = 200;
const MAX_READ_BYTES: u64 = 512 * 1024;
const MAX_GREP_FILE_BYTES: u64 = 512 * 1024;
const MAX_GREP_TOTAL_BYTES: u64 = 4 * 1024 * 1024;
const MAX_GREP_FILES_SCANNED: usize = 5000;

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

fn workspace_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let root = app
        .path()
        .resolve(".", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("failed to resolve resource dir: {e}"))?;

    if root.exists() {
        return root
            .canonicalize()
            .map_err(|e| format!("failed to canonicalize workspace root: {e}"));
    }

    std::env::current_dir().map_err(|e| format!("failed to resolve current dir: {e}"))
}

fn normalize_relative_path(path: &str) -> Result<PathBuf, String> {
    let candidate = Path::new(path);
    if candidate.is_absolute() {
        return Err("absolute paths are not allowed".to_string());
    }

    let mut normalized = PathBuf::new();
    for component in candidate.components() {
        match component {
            Component::Normal(part) => normalized.push(part),
            Component::CurDir => {}
            Component::ParentDir => return Err("path traversal is not allowed".to_string()),
            Component::Prefix(_) | Component::RootDir => {
                return Err("invalid path".to_string())
            }
        }
    }

    if normalized.as_os_str().is_empty() {
        return Ok(PathBuf::from("."));
    }

    Ok(normalized)
}

fn resolve_workspace_path(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let normalized = normalize_relative_path(relative_path)?;
    let joined = root.join(normalized);

    if joined.exists() {
        let canonical = joined
            .canonicalize()
            .map_err(|e| format!("failed to canonicalize path: {e}"))?;
        if !canonical.starts_with(root) {
            return Err("resolved path escapes workspace root".to_string());
        }
        return Ok(canonical);
    }

    if !joined.starts_with(root) {
        return Err("resolved path escapes workspace root".to_string());
    }

    Ok(joined)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ModeTool {
    id: String,
    name: String,
    description: String,
    input_schema: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ToolCall {
    id: String,
    name: String,
    arguments: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ToolResult {
    tool_call_id: String,
    name: String,
    ok: bool,
    output: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ToolLoopStep {
    iteration: usize,
    tool_calls: Vec<ToolCall>,
    tool_results: Vec<ToolResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ToolLoopRequest {
    api_endpoint: String,
    model: String,
    headers: HashMap<String, String>,
    body: Value,
    tools: Vec<ModeTool>,
    max_iterations: Option<usize>,
    max_tool_calls: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ToolLoopResponse {
    content: String,
    reasoning: String,
    steps: Vec<ToolLoopStep>,
    finish_reason: Option<String>,
    total_tool_calls: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FsListInput {
    path: String,
    recursive: Option<bool>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FsListEntry {
    path: String,
    entry_type: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FsListOutput {
    root: String,
    entries: Vec<FsListEntry>,
    truncated: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FsReadInput {
    path: String,
    offset: Option<usize>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FsReadOutput {
    path: String,
    offset: usize,
    limit: usize,
    total_lines: usize,
    truncated: bool,
    lines: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FsGrepInput {
    pattern: String,
    path: String,
    include: Option<String>,
    limit: Option<usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FsGrepMatch {
    path: String,
    line: usize,
    preview: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FsGrepOutput {
    matches: Vec<FsGrepMatch>,
    truncated: bool,
}

#[derive(Debug, Deserialize, Serialize)]
struct OpenAiMessage {
    role: String,
    content: Option<String>,
    #[serde(default)]
    tool_calls: Vec<OpenAiToolCall>,
}

#[derive(Debug, Deserialize, Serialize)]
struct OpenAiToolCall {
    id: String,
    #[serde(rename = "type")]
    tool_type: String,
    function: OpenAiFunctionCall,
}

#[derive(Debug, Deserialize, Serialize)]
struct OpenAiFunctionCall {
    name: String,
    arguments: String,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessage,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

fn builtin_tools() -> Vec<ModeTool> {
    vec![
        ModeTool {
            id: "fs:list".to_string(),
            name: "fs:list".to_string(),
            description: "List files and directories inside the workspace".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "recursive": { "type": "boolean" },
                    "limit": { "type": "integer", "minimum": 1, "maximum": 1000 }
                },
                "required": ["path"],
                "additionalProperties": false
            }),
        },
        ModeTool {
            id: "fs:read".to_string(),
            name: "fs:read".to_string(),
            description: "Read lines from a workspace file".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string" },
                    "offset": { "type": "integer", "minimum": 1 },
                    "limit": { "type": "integer", "minimum": 1, "maximum": 2000 }
                },
                "required": ["path"],
                "additionalProperties": false
            }),
        },
        ModeTool {
            id: "fs:grep".to_string(),
            name: "fs:grep".to_string(),
            description: "Search workspace file contents with a regex pattern".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "pattern": { "type": "string" },
                    "path": { "type": "string" },
                    "include": { "type": "string" },
                    "limit": { "type": "integer", "minimum": 1, "maximum": 1000 }
                },
                "required": ["pattern", "path"],
                "additionalProperties": false
            }),
        },
    ]
}

fn merge_tools(request_tools: &[ModeTool]) -> Vec<ModeTool> {
    let mut seen = HashSet::new();
    let mut merged = Vec::new();

    for tool in builtin_tools().into_iter().chain(request_tools.iter().cloned()) {
        if seen.insert(tool.name.clone()) {
            merged.push(tool);
        }
    }

    merged
}

fn build_openai_tools(tools: &[ModeTool]) -> Vec<Value> {
    tools.iter()
        .map(|tool| {
            json!({
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.input_schema
                }
            })
        })
        .collect()
}

fn relative_display_path(root: &Path, path: &Path) -> String {
    let relative = path.strip_prefix(root).unwrap_or(path);
    if relative.as_os_str().is_empty() {
        ".".to_string()
    } else {
        relative.to_string_lossy().replace('\\', "/")
    }
}

fn build_globset(pattern: Option<&str>) -> Result<Option<GlobSet>, String> {
    let Some(pattern) = pattern else {
        return Ok(None);
    };

    let mut builder = GlobSetBuilder::new();
    builder.add(Glob::new(pattern).map_err(|e| format!("invalid include pattern: {e}"))?);
    builder
        .build()
        .map(Some)
        .map_err(|e| format!("failed to build include matcher: {e}"))
}

fn execute_fs_list(root: &Path, args: Value) -> Result<Value, String> {
    let input: FsListInput =
        serde_json::from_value(args).map_err(|e| format!("invalid fs:list arguments: {e}"))?;
    let path = resolve_workspace_path(root, &input.path)?;
    if !path.exists() {
        return Err("path does not exist".to_string());
    }
    if !path.is_dir() {
        return Err("path is not a directory".to_string());
    }

    let recursive = input.recursive.unwrap_or(false);
    let limit = input.limit.unwrap_or(DEFAULT_LIST_LIMIT).min(1000);
    let mut entries = Vec::new();
    let mut truncated = false;

    let walker = if recursive {
        WalkDir::new(&path).min_depth(1)
    } else {
        WalkDir::new(&path).min_depth(1).max_depth(1)
    };

    for entry in walker.into_iter().filter_map(Result::ok) {
        if entries.len() >= limit {
            truncated = true;
            break;
        }

        let entry_type = if entry.file_type().is_dir() { "dir" } else { "file" };
        entries.push(FsListEntry {
            path: relative_display_path(root, entry.path()),
            entry_type: entry_type.to_string(),
        });
    }

    serde_json::to_value(FsListOutput {
        root: relative_display_path(root, &path),
        entries,
        truncated,
    })
    .map_err(|e| format!("failed to serialize fs:list output: {e}"))
}

fn execute_fs_read(root: &Path, args: Value) -> Result<Value, String> {
    let input: FsReadInput =
        serde_json::from_value(args).map_err(|e| format!("invalid fs:read arguments: {e}"))?;
    let path = resolve_workspace_path(root, &input.path)?;
    if !path.exists() {
        return Err("path does not exist".to_string());
    }
    if !path.is_file() {
        return Err("path is not a file".to_string());
    }

    let metadata = fs::metadata(&path).map_err(|e| format!("failed to read metadata: {e}"))?;
    if metadata.len() > MAX_READ_BYTES {
        return Err(format!("file exceeds max read size of {MAX_READ_BYTES} bytes"));
    }

    let offset = input.offset.unwrap_or(1).max(1);
    let limit = input.limit.unwrap_or(DEFAULT_READ_LIMIT).min(2000);
    let content = fs::read_to_string(&path).map_err(|e| format!("failed to read file: {e}"))?;
    let lines: Vec<String> = content.lines().map(|line| line.to_string()).collect();
    let start_index = offset.saturating_sub(1);
    let selected: Vec<String> = lines
        .iter()
        .enumerate()
        .skip(start_index)
        .take(limit)
        .map(|(idx, line)| format!("{}: {}", idx + 1, line))
        .collect();
    let truncated = start_index + selected.len() < lines.len();

    serde_json::to_value(FsReadOutput {
        path: relative_display_path(root, &path),
        offset,
        limit,
        total_lines: lines.len(),
        truncated,
        lines: selected,
    })
    .map_err(|e| format!("failed to serialize fs:read output: {e}"))
}

fn execute_fs_grep(root: &Path, args: Value) -> Result<Value, String> {
    let input: FsGrepInput =
        serde_json::from_value(args).map_err(|e| format!("invalid fs:grep arguments: {e}"))?;
    let path = resolve_workspace_path(root, &input.path)?;
    if !path.exists() {
        return Err("path does not exist".to_string());
    }

    let regex = Regex::new(&input.pattern).map_err(|e| format!("invalid regex pattern: {e}"))?;
    let include = build_globset(input.include.as_deref())?;
    let limit = input.limit.unwrap_or(DEFAULT_GREP_LIMIT).min(1000);
    let mut matches = Vec::new();
    let mut truncated = false;
    let mut files_scanned = 0usize;
    let mut bytes_scanned = 0u64;

    for entry in WalkDir::new(&path).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }

        files_scanned += 1;
        if files_scanned > MAX_GREP_FILES_SCANNED {
            truncated = true;
            break;
        }

        let relative = relative_display_path(root, entry.path());
        if let Some(include) = &include {
            if !include.is_match(Path::new(&relative)) {
                continue;
            }
        }

        let metadata = match fs::metadata(entry.path()) {
            Ok(metadata) => metadata,
            Err(_) => continue,
        };
        let file_size = metadata.len();
        if file_size > MAX_GREP_FILE_BYTES {
            continue;
        }
        if bytes_scanned.saturating_add(file_size) > MAX_GREP_TOTAL_BYTES {
            truncated = true;
            break;
        }
        bytes_scanned = bytes_scanned.saturating_add(file_size);

        let content = match fs::read_to_string(entry.path()) {
            Ok(content) => content,
            Err(_) => continue,
        };

        for (idx, line) in content.lines().enumerate() {
            if !regex.is_match(line) {
                continue;
            }

            if matches.len() >= limit {
                truncated = true;
                break;
            }

            matches.push(FsGrepMatch {
                path: relative.clone(),
                line: idx + 1,
                preview: line.chars().take(240).collect(),
            });
        }

        if truncated {
            break;
        }
    }

    serde_json::to_value(FsGrepOutput { matches, truncated })
        .map_err(|e| format!("failed to serialize fs:grep output: {e}"))
}

fn execute_tool(root: &Path, call: &ToolCall) -> ToolResult {
    let result = match call.name.as_str() {
        "fs:list" => execute_fs_list(root, call.arguments.clone()),
        "fs:read" => execute_fs_read(root, call.arguments.clone()),
        "fs:grep" => execute_fs_grep(root, call.arguments.clone()),
        _ => Err(format!("unsupported tool: {}", call.name)),
    };

    match result {
        Ok(output) => ToolResult {
            tool_call_id: call.id.clone(),
            name: call.name.clone(),
            ok: true,
            output,
        },
        Err(message) => ToolResult {
            tool_call_id: call.id.clone(),
            name: call.name.clone(),
            ok: false,
            output: json!({
                "error": {
                    "code": "tool_execution_error",
                    "message": message,
                    "tool": call.name,
                    "input": call.arguments,
                }
            }),
        },
    }
}

fn parse_tool_calls(choice: &OpenAiChoice) -> Result<Vec<ToolCall>, String> {
    let mut calls = Vec::new();
    for tool_call in &choice.message.tool_calls {
        if tool_call.tool_type != "function" {
            continue;
        }

        let arguments = serde_json::from_str::<Value>(&tool_call.function.arguments)
            .map_err(|e| format!("invalid tool call arguments for {}: {e}", tool_call.function.name))?;

        calls.push(ToolCall {
            id: tool_call.id.clone(),
            name: tool_call.function.name.clone(),
            arguments,
        });
    }

    Ok(calls)
}

fn append_tool_result_messages(messages: &mut Vec<Value>, results: &[ToolResult]) {
    for result in results {
        messages.push(json!({
            "role": "tool",
            "tool_call_id": result.tool_call_id,
            "content": serde_json::to_string(&result.output).unwrap_or_else(|_| "{}".to_string())
        }));
    }
}

async fn request_model_response(
    client: &reqwest::Client,
    endpoint: &str,
    headers: &HashMap<String, String>,
    body: &Value,
) -> Result<OpenAiResponse, String> {
    let mut request = client.post(endpoint).header(CONTENT_TYPE, "application/json");

    for (key, value) in headers {
        if key.eq_ignore_ascii_case(AUTHORIZATION.as_str()) {
            request = request.header(AUTHORIZATION, value);
        } else {
            request = request.header(key, value);
        }
    }

    let response = request
        .json(body)
        .send()
        .await
        .map_err(|e| format!("model request failed: {e}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("model request failed: {status} {error_text}"));
    }

    response
        .json::<OpenAiResponse>()
        .await
        .map_err(|e| format!("failed to parse model response: {e}"))
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

#[tauri::command]
async fn execute_tool_loop(
    app: tauri::AppHandle,
    request: ToolLoopRequest,
) -> Result<ToolLoopResponse, String> {
    let root = workspace_root(&app)?;
    let client = reqwest::Client::new();
    let tools = merge_tools(&request.tools);
    let openai_tools = build_openai_tools(&tools);
    let max_iterations = request
        .max_iterations
        .unwrap_or(DEFAULT_MAX_TOOL_ITERATIONS)
        .min(20);
    let max_tool_calls = request
        .max_tool_calls
        .unwrap_or(DEFAULT_MAX_TOOL_CALLS)
        .min(100);
    let mut total_tool_calls = 0usize;
    let mut steps = Vec::new();
    let mut messages = request
        .body
        .get("messages")
        .and_then(Value::as_array)
        .cloned()
        .ok_or_else(|| "request body is missing messages array".to_string())?;
    let mut body = request.body.clone();
    body["stream"] = Value::Bool(false);
    body["tools"] = Value::Array(openai_tools);
    body["tool_choice"] = Value::String("auto".to_string());

    for iteration in 1..=max_iterations {
        body["messages"] = Value::Array(messages.clone());
        let response = request_model_response(&client, &request.api_endpoint, &request.headers, &body).await?;
        let choice = response
            .choices
            .into_iter()
            .next()
            .ok_or_else(|| "model response did not contain choices".to_string())?;

        let assistant_message = json!({
            "role": choice.message.role,
            "content": choice.message.content,
            "tool_calls": choice.message.tool_calls,
        });
        messages.push(assistant_message);

        let tool_calls = parse_tool_calls(&choice)?;
        if tool_calls.is_empty() {
            return Ok(ToolLoopResponse {
                content: choice.message.content.unwrap_or_default(),
                reasoning: String::new(),
                steps,
                finish_reason: choice.finish_reason,
                total_tool_calls,
            });
        }

        total_tool_calls += tool_calls.len();
        if total_tool_calls > max_tool_calls {
            return Err(format!("tool call budget exceeded ({max_tool_calls})"));
        }

        let results: Vec<ToolResult> = tool_calls.iter().map(|call| execute_tool(&root, call)).collect();
        append_tool_result_messages(&mut messages, &results);
        steps.push(ToolLoopStep {
            iteration,
            tool_calls,
            tool_results: results,
        });
    }

    Err(format!("tool loop reached max iterations ({max_iterations})"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            load_session,
            save_session,
            execute_tool_loop
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
