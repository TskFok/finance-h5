# 记账助手 H5 应用

一个现代化的移动端记账应用，支持支出和收入记录管理。

## 功能特性

- ✅ 邮箱注册（带验证码验证）
- ✅ 用户登录
- ✅ 记录支出
- ✅ 记录收入
- ✅ 支出/收入列表展示
- ✅ 数据统计（总支出、总收入、净收入）
- ✅ 明亮清晰的 UI 设计

## 技术栈

- React 18
- TypeScript
- Vite
- React Router
- Axios

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
finance-h5/
├── src/
│   ├── pages/          # 页面组件
│   │   ├── Login.tsx   # 登录页面
│   │   ├── Register.tsx # 注册页面
│   │   ├── Home.tsx    # 主页面
│   │   ├── AddExpense.tsx # 添加支出页面
│   │   └── AddIncome.tsx  # 添加收入页面
│   ├── services/       # API 服务
│   │   └── api.ts      # API 封装
│   ├── types/          # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/          # 工具函数
│   │   ├── storage.ts  # 本地存储工具
│   │   └── format.ts   # 格式化工具
│   ├── styles/         # 样式文件
│   │   └── index.css   # 全局样式
│   ├── App.tsx         # 应用入口
│   └── main.tsx        # 入口文件
├── index.html
├── package.json
└── vite.config.ts
```

## API 配置

默认 API 地址为 `http://localhost:8080`，可在 `vite.config.ts` 中修改代理配置。

## 使用说明

1. **注册账号**：点击注册，输入邮箱获取验证码，验证后完善账号信息
2. **登录**：使用用户名和密码登录
3. **记录支出**：点击主页的"+"按钮或切换到支出标签，添加支出记录
4. **记录收入**：切换到收入标签，添加收入记录
5. **查看统计**：主页顶部显示总支出、总收入和净收入

## 设计特点

- 🎨 渐变背景，明亮清晰
- 📱 响应式设计，适配移动端
- 🎯 功能位置清晰，易于操作
- ✨ 流畅的动画和交互效果
- 🎨 支出/收入使用不同颜色区分
