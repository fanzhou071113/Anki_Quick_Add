# Anki Quick Add

Anki Quick Add 是极简 Chrome Manifest V3 扩展：选中文字后右键“添加到 Anki”，通过 AnkiConnect 创建笔记；External API 可选。

## 安装

下载仓库根目录的 `anki-quick-add-v1.3.0.zip` 并解压。在 `chrome://extensions` 开启开发者模式，选择“加载已解压的扩展程序”，指向其中的 `anki-quick-add` 文件夹。

## 配置和使用

启动 Anki，并安装/启用 AnkiConnect（代码 `2055492159`）。打开扩展选项，填写 AnkiConnect URL、目标 Deck、Note Type、Original Text Field。刷新按钮可读取卡组、note type 和字段，也支持手动输入。

启用 External API 后填写 Endpoint、API Key 和 Prompt。Prompt 支持 `{{text}}`。HTTPS 支持公网 API；HTTP 支持本机/局域网地址。API Key 保存在本机扩展存储中，以 Bearer header 发送。请求最多等待 30 秒。

## External API 调试

- **Test Connection** 使用固定测试文本 `der Mann`，按当前 Prompt 替换 `{{text}}`，验证 endpoint、网络、HTTP、响应读取、JSON 解析和结果提取。
- **Test Full Flow** 继续检查 AnkiConnect、目标 deck、note type 和字段映射，并展示待写入字段；它不会调用 `addNote`，不会创建笔记。
- 原始响应只在设置页的折叠区显示。调试界面会遮盖已保存的 API Key、Bearer 值和疑似密钥字段，不会写日志或控制台。
- 错误按 endpoint、网络、HTTP、JSON/结果、AnkiConnect、deck/note type、字段映射分别显示。

API 以 POST JSON 发送 `text`、`prompt`、`deck`、`noteType`。响应支持纯文本、`result`、`instructionValue`、`value`、`output_text`、`data.result` 和常见 OpenAI choices 结构。

## 验证

运行 `node --test tests/core.test.cjs tests/diagnostics.test.cjs`。覆盖直接添加所需的核心解析/映射逻辑、External API、HTTP 500、无效 JSON、未知响应结构、错误 endpoint、AnkiConnect 不可用，以及完整诊断不会写入笔记。
