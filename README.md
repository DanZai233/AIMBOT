<div align="center">

# 🎯 Aim Trainer Pro

**一款高性能、高度可定制的网页端鼠标瞄准训练器**

提升你的鼠标控制、甩枪速度和追踪精度。

React + TypeScript + Vite + Tailwind CSS + Canvas

</div>

---

![主菜单](docs/screenshots/main-menu.webp)

## ✨ 功能特性

### 🎮 四种训练模式

| 模式 | 说明 |
|------|------|
| **Gridshot** | 命中网格上出现的 3 个目标，经典甩枪训练 |
| **Spidershot** | 从中心目标甩向随机外围目标再返回 |
| **Microflick** | 小目标出现在屏幕中心附近，训练微调精度 |
| **Tracking** | 追踪移动目标，按住鼠标左键持续得分 |

### ⚙️ 丰富的配置项

通过右侧滑出设置面板，自由调整游戏参数：

- **训练时间**：15 / 30 / 60 / 120 秒
- **目标大小**：小 / 中 / 大
- **目标速度**：慢速 / 正常 / 快速

![设置面板](docs/screenshots/settings-panel.webp)

### 🎨 个性化定制

- **目标形状**：圆形 / 菱形 / 星形 / 六边形 / 三角形
- **光标样式**：十字线 / 圆点 / 圆环 / 精确十字
- **主题配色**：青 / 红 / 绿 / 紫 / 橙（5 种配色方案）
- **背景主题**：暗黑 / 网格 / 渐变 / 星空

<div align="center">
<table>
<tr>
<td><img src="docs/screenshots/gameplay-gridshot.webp" alt="青色圆形目标" width="100%"/></td>
<td><img src="docs/screenshots/gameplay-purple-stars.webp" alt="紫色星形目标" width="100%"/></td>
</tr>
<tr>
<td align="center"><b>青色 · 圆形 · 暗黑背景</b></td>
<td align="center"><b>紫色 · 星形 · 星空背景</b></td>
</tr>
</table>
</div>

### ⚡ 性能优化

- **零延迟光标**：使用 CSS SVG 自定义光标，由操作系统原生渲染
- **DPI 感知**：适配 Retina 等高分屏，清晰锐利
- **轻量渲染**：替代 `shadowBlur` 的高效发光方案
- **60fps 流畅**：优化的 Canvas 渲染管线

### 📊 详细的成绩统计

每局结束后展示完整的训练报告：

- 等级评定（S / A / B / C / D）
- 最终得分、精准度百分比
- 命中 / 失误次数
- 训练时长
- 数字递增动画效果

![结果界面](docs/screenshots/results-screen.webp)

### 🎬 动效细节

- 主菜单粒子连线背景动画
- 目标出现时的弹性缩放动画
- 命中目标时的粒子爆炸效果
- 得分浮动弹出（+100 / -20）
- 失误时屏幕边缘红色闪光
- 设置面板平滑滑入/滑出
- 所有设置自动保存到 `localStorage`

## 🚀 快速开始

**前置要求**：Node.js 18+

```bash
# 克隆项目
git clone https://github.com/DanZai233/AIMBOT.git
cd AIMBOT

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 http://localhost:3000

## 📦 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 3000） |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | TypeScript 类型检查 |
| `npm run clean` | 清理构建产物 |

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **React 19** | UI 框架 |
| **TypeScript** | 类型安全 |
| **Vite 6** | 构建工具 + 开发服务器 |
| **Tailwind CSS v4** | 样式系统 |
| **HTML5 Canvas** | 游戏渲染引擎 |
| **Motion** | React 组件动画 |
| **Lucide React** | 图标库 |

## 📁 项目结构

```
src/
├── main.tsx                  # 应用入口
├── App.tsx                   # 根组件（状态机：菜单 → 游戏 → 结果）
├── types.ts                  # 类型定义 + 配置常量
├── index.css                 # Tailwind 导入 + 全局样式
├── lib/
│   └── GameEngine.ts         # Canvas 游戏引擎（渲染/物理/输入）
└── components/
    ├── MainMenu.tsx           # 模式选择 + 粒子背景
    ├── GameScreen.tsx         # 游戏画面 + HUD
    ├── ResultsScreen.tsx      # 成绩统计 + 等级评定
    └── SettingsPanel.tsx      # 设置面板（抽屉式）
```

## 📄 License

MIT
