# 🐾 DeskPal - 桌面宠物应用

一个基于 Tauri + Canvas 的可爱桌面宠物应用！

![DeskPal](https://img.shields.io/badge/DeskPal-v1.0.0-pink?style=for-the-badge)

## ✨ 功能特点

- 🐰 **可爱宠物**：粉色的小动物，有耳朵、腮红和丰富的表情
- 🎮 **互动功能**：
  - 点击宠物会触发跳跃或旋转动作
  - 拖拽移动宠物位置
  - 随机漫步行为
  - 眨眼效果
- 💫 **视觉效果**：
  - Canvas 渲染
  - 弹跳动画
  - 点击反应文字飘出
- 🪟 **桌面特性**：
  - 窗口透明
  - 始终置顶
  - 系统托盘图标
  - 双击隐藏到托盘
  - 关闭按钮隐藏窗口

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.70
- Windows 10/11

### 安装步骤

1. 安装依赖：
```bash
npm install
```

2. 安装 Tauri CLI（如果没有）：
```bash
npm install -D @tauri-apps/cli
```

3. 运行开发模式：
```bash
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

构建完成后，可执行文件位于：
- Windows: `src-tauri/target/release/DeskPal.exe`

## 📁 项目结构

```
DeskPal/
├── src/                    # 前端源码
│   ├── Pet.js             # 宠物类（渲染、动画、交互）
│   └── main.js            # 应用入口
├── src-tauri/             # Tauri 后端
│   ├── src/
│   │   └── main.rs       # Rust 主程序
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── index.html             # HTML 入口
├── vite.config.js         # Vite 配置
└── package.json           # Node 依赖
```

## 🎮 使用说明

| 操作 | 功能 |
|------|------|
| 单击宠物 | 触发跳跃或旋转 |
| 拖拽宠物 | 移动位置 |
| 双击窗口 | 隐藏到托盘 |
| 点击托盘图标 | 显示窗口 |
| 托盘右键 | 显示菜单（显示/退出） |
| 点击关闭按钮 | 隐藏窗口 |

## 🔧 自定义宠物

可以修改 `src/Pet.js` 中的以下属性来自定义宠物外观：

```javascript
this.bodyColor = '#FFB6C1';   // 身体颜色
this.eyeColor = '#000';        // 眼睛颜色
this.cheekColor = '#FF69B4';  // 腮红颜色
this.size = 80;               // 宠物大小
```

## 📝 待实现功能

- [ ] 多种宠物皮肤/外观
- [ ] 宠物叫声/音效
- [ ] 宠物心情系统
- [ ] 天气/时间小部件
- [ ] 系统监控显示
- [ ] 设置面板
- [ ] 全局快捷键

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
