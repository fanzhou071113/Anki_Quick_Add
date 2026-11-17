# Anki Quick Add

Anki Quick Add 是一个极简 Chrome Manifest V3 扩展：网页选中文字后右键“添加到 Anki”，通过 AnkiConnect 创建笔记。External API 可选，关闭时保留原有直接添加流程。

## 安装

下载仓库 ZIP 并解压，打开 `chrome://extensions`，启用开发者模式，选择“加载已解压的扩展程序”，再选中仓库中的 `anki-quick-add` 文件夹。

## Anki 设置

启动 Anki 和 AnkiConnect（插件代码 `2055492159`）。在设置页配置 AnkiConnect URL、Deck、Note Type 和 Original Text Field。需要时刷新卡组、笔记类型和字段列表。启用 External API 时，另选一个不同的 Instruction Field。

## External API

勾选“启用 External API”，填写 API Endpoint、API Key 和 Prompt。保存时 Chrome 只会申请此 API 来源的站点权限。HTTPS 适用于公网 API；HTTP 允许用于本机及局域网地址，例如 `http://192.168.1.20:8000/classify`、`http://my-api.local:8000`。公网 HTTP 地址会被拒绝。使用 HTTP 时，API Key 会以明文在局域网传输，请仅在可信网络使用。

API Key 通过 Bearer Authorization header 发送，并只保存在扩展的本机 local storage，不写入仓库。留空保存会保留现有密钥；使用“清除密钥”删除。

Prompt 支持用 `{{text}}` 引用选中文字。请求为 POST JSON：

```json
{
  "text": "der Mann",
  "prompt": "判断 der Mann 的词性，只返回分类。",
  "deck": "Deutsch",
  "noteType": "Basic"
}
```

API 可以返回纯文本（例如 `名词`）或 JSON（例如 `{"result":"名词"}`）。解析器识别 `result`、`instructionValue`、`value`、`output_text`、`data.result` 以及常见 OpenAI `choices[0].message.content`。API 只生成指示值；扩展将原文写入 Original Text Field、将结果写入 Instruction Field，再调用 AnkiConnect `addNote`。

## 错误和检查

成功或失败会以简短系统通知提示。API 请求最多等待 30 秒。运行核心测试：`node --test tests/core.test.cjs`。API Key 不应写入配置文件；本目录的 `.gitignore` 排除本地密钥配置。
