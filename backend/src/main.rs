// Tauri entrypoint + SurrealDB initialization
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    dashboard_app_lib::run()
}
