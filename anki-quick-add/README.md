# Anki Quick Add

Anki Quick Add 是极简 Chrome Manifest V3 扩展：选中文字后右键添加到 Anki。External API 可选；关闭时继续直接把选中文字写入 Original Text Field。

## 安装与 AnkiConnect

下载仓库根目录的 `anki-quick-add-v1.4.0.zip` 并解压。在 `chrome://extensions` 开启开发者模式，选择“加载已解压的扩展程序”，指向 `anki-quick-add` 文件夹。启动 Anki 并安装/启用 AnkiConnect（插件代码 `2055492159`）。设置 AnkiConnect URL、目标 Deck、Note Type、Original Text Field；External API 启用时另需不同的 Instruction Field。

## External API 设置

选择 Provider：**OpenAI-compatible** 或 **Ollama Native**。填写 API Server / Endpoint（可填服务器根地址）、Model、可选 API Key 和 Prompt。Prompt 中的 `{{text}}` 会在每次选词时替换为原文。API Key 仅在 OpenAI-compatible 请求中以 Bearer header 发送，并保存在本机扩展存储。

例如可以填写 `http://100.75.97.86:8799`，无需手动猜 API 路径。程序会按 Provider 规范化根地址和常见后缀，避免重复拼接：
- OpenAI-compatible：`/v1/chat/completions`，模型列表 `/v1/models`
- Ollama Native：`/api/chat`，模型列表 `/api/tags`

也接受 `/v1`、`/v1/chat/completions`、`/chat/completions`、`/v1/models`、`/models`、`/api/chat`、`/api/tags` 作为输入并规范化。模型刷新失败不会阻止手动填写 Model。OpenAI-compatible 请求包含 model、messages、stream=false 和 AINotePro 使用的 temperature；Ollama 使用原生 options.temperature 和原生响应格式。

## LAN 与 Tailscale HTTP

HTTPS 用于公网服务；HTTP 允许本机、私网 IPv4 和 overlay 网络地址（100.64.0.0/10），包括 `http://100.75.97.86:8799`。扩展只申请当前服务器的精确 origin 权限。HTTP 会在网络中明文传输 API Key，请仅在可信网络使用。

## 测试与诊断

- **Test Connection** 检查当前 Provider、Server/Endpoint、Model 和权限，发送真实最小 Prompt `Reply with exactly: OK` 到实际 Chat route；展示 endpoint、HTTP、解析结果与耗时，不创建 Anki 笔记。
- **Test Full Flow** 使用 `der Mann`、当前 Prompt 和当前 API 设置，检查响应解析、Deck、Note Type、Original/Instruction 字段映射及 AnkiConnect；只验证字段，不调用 `addNote`。
- Debug Log 不记录 API Key、Authorization、Prompt、选中文本或原始响应。Raw API Response 可在折叠区查看；展示前会遮盖 API Key。

OpenAI-compatible 从 `choices[0].message.content` 解析；Ollama Native 从 `message.content` 解析。External API 只提供 Instruction Field 值；AnkiConnect 仍负责最终创建。原始选中文本始终映射到 Original Text Field。

## 常见问题

- **HTTP 404**：诊断页会显示实际请求 URL；根地址会自动映射到 Provider 的 Chat route。确认服务器支持对应协议和路径。
- **Endpoint permission**：在 Chrome 提示中允许当前 API server origin，或重新保存设置。
- **Response parsing failed**：检查所选 Provider 是否与服务器响应格式匹配。
- **Model error / HTTP 400**：通过 Refresh 获取服务器模型名称，或手动确认 Model。
- **AnkiConnect error**：确认 Anki 正在运行且 AnkiConnect 可用。

运行测试：`node --test tests/core.test.cjs tests/diagnostics.test.cjs tests/providers.test.cjs`。
