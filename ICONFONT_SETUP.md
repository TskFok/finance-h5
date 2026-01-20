# Iconfont 图标配置说明

## 配置步骤

1. **访问图标库**
   - 打开 https://www.iconfont.cn/collections/detail?cid=53168
   - 登录 iconfont 账号（如果没有账号需要先注册）

2. **创建项目并添加图标**
   - 点击"添加到项目"或创建新项目
   - 将需要的图标添加到项目中

3. **生成 Symbol 链接**
   - 在项目页面，选择"Symbol"方式
   - 点击"生成代码"
   - 复制生成的 JS 链接（格式类似：`//at.alicdn.com/t/c/font_xxxxx_xxxxx.js`）

4. **更新 index.html**
   - 打开 `index.html` 文件
   - 找到 `<script src="//at.alicdn.com/t/c/font_53168_xxxxx.js"></script>`
   - 将 `src` 属性替换为步骤3中复制的链接

5. **更新图标类名映射**
   - 打开 `src/utils/categoryIcons.ts`
   - 根据实际使用的图标，更新 `iconMap` 中的图标类名
   - 图标类名格式为：`icon-图标名称`（在 iconfont 项目页面可以看到）

## 常用类别图标映射

当前代码中已预设了常见类别的图标映射，如果实际图标名称不同，需要修改 `src/utils/categoryIcons.ts` 中的 `iconMap` 对象。

## 注意事项

- 确保使用 Symbol 方式引入，这样可以支持多色图标
- 图标类名需要与 iconfont 项目中的实际名称一致
- 如果某个类别没有对应的图标，会使用默认图标 `icon-morenyingyong`
