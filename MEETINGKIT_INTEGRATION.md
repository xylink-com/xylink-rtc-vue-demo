# MeetingKit（Web）集成指南（含 Vite 改造）

本仓库当前实现是 **Vue 2（Vue CLI / webpack）** 作为壳，内部用 **React 18** 渲染 MeetingKit UI（`@xylink/meetingkit`）。

---

## 前置条件与关键概念

- **浏览器要求**：需支持 WebRTC（推荐最新版 Chrome）。
- **账号体系**：
  - 小鱼账号登录：`client.loginXYlinkAccount(phone, password)`
  - 第三方账号登录：`client.loginExternalAccount({ extId, extUserId, displayName })`
- **两种入会方式（本 demo 同时支持）**：
  - **SDK 自绘 UI**：使用 `@xylink/xy-rtc-sdk` 自行渲染视频布局（本项目 `App.vue` 大量逻辑）。
  - **MeetingKit UI**：使用 `@xylink/meetingkit` 提供的 React UI（本项目 `MeetingKitHost.vue`）。

---

## 1. 在现有 Vue 2（Vue CLI / webpack）项目中接入 MeetingKit（对照本仓库）

### 1.1 安装依赖

```bash
yarn add @xylink/meetingkit @xylink/xy-rtc-sdk react react-dom
```

版本建议：
- `react`/`react-dom`：18.x（本仓库用 `18.3.1`）
- `@xylink/meetingkit`：4.x（本仓库用 `^4.0.7`）
- `@xylink/xy-rtc-sdk`：4.x（本仓库用 `4.0.8`）

### 1.2 引入 MeetingKit 样式（非常关键）

推荐在 **MeetingKit 的宿主组件**里按需引入样式（避免首屏加载 MeetingKit CSS）。例如在 `MeetingKitHost.vue` 的 `mounted()` 里动态加载：

```js
await import('@xylink/meetingkit/css/style.css');
```

如果你不关心首屏体积，也可以在入口文件（如 `src/main.js`）全局引入：

```js
import '@xylink/meetingkit/css/style.css';
```

### 1.3 确保依赖被正确转译（Vue CLI / webpack）

`@xylink/meetingkit` 及其 React/Ant 生态依赖在某些构建配置下需要被 babel/webpack 处理，否则可能出现语法/兼容性问题。  
Vue CLI 可通过 `transpileDependencies` 处理（本仓库已配置在 `vue.config.js`）：

- `@xylink/meetingkit`
- `/@xylink\//`
- `antd`
- `/@ant-design\//`
- `/rc-/`
- `@babel/runtime`

如果你是从零集成，建议先照抄这个名单。

### 1.4 在 Vue 组件里挂载 React MeetingKit UI（核心做法）

推荐做法：新建一个“宿主”Vue 组件，内部创建 React root，并负责：
- 创建/登录 client
- render `XYMeetingKitComp`
- 调 `uiMeetingKit.makeCall(...)`
- 监听断线事件并 teardown

本仓库对应文件：`src/view/components/MeetingKit/MeetingKitHost.vue`  
关键点：
- 用 `createRoot`（React 18）
- 监听 `XYMeetingEventKey.DISCONNECTED` 并在结束时 `$emit('ended')`
- 销毁时 `uiMeetingKit.destroy()` + `reactRoot.unmount()`

### 1.5 在业务入口（例如 App.vue）里以“覆盖层”方式打开 MeetingKit

推荐 UI/交互：
- 登录页加一个开关（本仓库在 `Login/index.vue` 有“使用 MeetingKit 入会界面（React）”checkbox）
- 点击加入会议时，如果选择 MeetingKit：展示 `MeetingKitHost` 覆盖全屏；结束后回到登录页

本仓库对应逻辑在 `src/view/App.vue`：
- `meetingKitActive` 控制显示
- `meetingKitJoinConfig` 传入 user/setting/server/account

---

## 2. 从 Vue CLI 改造到 Vite（Vue 2）并保持 MeetingKit 可用

> 目标：把 Vue2 项目从 `vue-cli-service` 迁移到 `vite`，同时确保 `@xylink/meetingkit`（React UI）可正常构建与运行。

### 2.1 安装 Vite 与 Vue 2 插件

```bash
yarn add -D vite @vitejs/plugin-vue2
```

如项目使用 `sass/scss`：

```bash
yarn add -D sass
```

### 2.2 新增 `vite.config.js`

在项目根目录创建 `vite.config.js`（可直接复制后按需改）：

```js
import { defineConfig } from 'vite';
import vue2 from '@vitejs/plugin-vue2';
import path from 'path';

export default defineConfig({
  plugins: [vue2()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@xylink/meetingkit', '@xylink/xy-rtc-sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});
```

### 2.3 调整 `package.json` scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2.4 新增/改造 `index.html`

Vite 需要根目录 `index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>xylink rtc demo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### 2.5 SVG 雪碧图方案替换（替代 webpack 的 `svg-sprite-loader`）

Vue CLI + webpack 常见做法是 `svg-sprite-loader` + `require.context`。迁到 Vite 建议用 `vite-plugin-svg-icons`：

1) 安装：

```bash
yarn add -D vite-plugin-svg-icons fast-glob
```

2) `vite.config.js` 增加插件：

```js
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

export default defineConfig({
  plugins: [
    vue2(),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/img/svg')],
      symbolId: 'icon-[name]',
    }),
  ],
});
```

3) `src/main.js` 引入注册（一次即可）：

```js
import 'virtual:svg-icons-register';
```

### 2.6 处理静态资源路径与相对路径部署

如果需要生产环境相对路径（类似 Vue CLI 的 `publicPath: './'`）：

```js
export default defineConfig({
  base: './',
});
```

### 2.7 账号/服务器配置（建议用环境变量）

建议用 `.env.local`（不要提交 git）：

```bash
VITE_XY_SERVER=cloudapi.xylink.com
VITE_XY_EXT_ID=xxxxx
VITE_XY_CLIENT_ID=xxxxx
VITE_XY_CLIENT_SECRET=xxxxx
```

代码读取：

```js
export const SERVER = import.meta.env.VITE_XY_SERVER;
export const ACCOUNT = {
  extId: import.meta.env.VITE_XY_EXT_ID,
  clientId: import.meta.env.VITE_XY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_XY_CLIENT_SECRET,
};
```

---

## 3. 常见问题（排查顺序）

### 3.1 页面空白 / 控制台报错 “React is not defined”

- `MeetingKitHost.vue` 使用 `React.createElement(...)`，必须确保：
  - 安装 `react`
  - 引入 `import React from 'react'`

### 3.2 dev 能跑，build 报错（依赖解析 / CJS 混用）

优先尝试：
- `optimizeDeps.include`（见上）
- `build.commonjsOptions.include: [/node_modules/]`

必要时把 `antd`、`@ant-design/*`、`rc-*` 加入 `optimizeDeps.include`。

### 3.3 入会失败但无提示

- 临时提高 SDK 日志等级（按你们内部约定）
- 校验 `SERVER`、`clientId/clientSecret/extId`
- 第三方模式确认 `extUserId` 正确

### 3.4 断线后无法退出 / 资源未释放

确保 teardown 完整：
- `removeEventListener`
- `await uiMeetingKit.destroy()`
- `reactRoot.unmount()`
- Vue 侧把 `meetingKitActive` 置回 `false`

---

## 4. 最小可运行 Checklist（照着勾）

- [ ] `yarn add @xylink/meetingkit @xylink/xy-rtc-sdk react react-dom`
- [ ] 样式按需加载：`await import('@xylink/meetingkit/css/style.css')`
- [ ] 有宿主组件负责 `createClient/login/render/makeCall/destroy`
- [ ] 断线事件能触发 UI 退出（`XYMeetingEventKey.DISCONNECTED`）
- [ ] 迁移到 Vite：有 `index.html`、alias、SVG 替代方案、`optimizeDeps.include`

