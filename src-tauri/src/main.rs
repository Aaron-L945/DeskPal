#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg(target_os = "windows")]
use tauri::WebviewWindow;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 窗口透明和置顶配置
            let window = app.get_webview_window("main").unwrap();
            // 允许鼠标事件通过
            window.set_ignore_cursor_events(false).ok();

            // Windows上设置窗口背景透明
            #[cfg(target_os = "windows")]
            {
                use windows::Win32::UI::WindowsAndMessaging::{SetLayeredWindowAttributes, LWA_COLORKEY, LWA_ALPHA};
                use windows::Win32::Foundation::{HWND, COLORREF};
                
                if let Ok(hwnd) = window.hwnd() {
                    unsafe {
                        // 设置窗口为分层窗口，使用白色作为透明键
                        let white = COLORREF(0xFFFFFF);
                        let _ = SetLayeredWindowAttributes(HWND(hwnd.0 as _), white, 255, LWA_COLORKEY | LWA_ALPHA);
                    }
                }
            }

            // 获取窗口尺寸并设置到右下角
            if let Ok(size) = window.inner_size() {
                // 获取主屏幕尺寸
                if let Some(monitor) = window.current_monitor().ok().flatten() {
                    let screen_size = monitor.size();
                    let screen_width = screen_size.width as i32;
                    let screen_height = screen_size.height as i32;
                    let window_width = size.width as i32;
                    let window_height = size.height as i32;
                    
                    // 设置到右下角，保留20px边距
                    let x = screen_width - window_width - 20;
                    let y = screen_height - window_height - 60;
                    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y })).ok();
                }
            }

            // 创建系统托盘菜单
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // 创建托盘图标
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("DeskPal - Desktop Pet")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // 点击关闭按钮时隐藏窗口而不是退出
                window.hide().ok();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
