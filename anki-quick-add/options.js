const DEFAULTS = {
  deck: "", model: "", field: "", ankiUrl: "http://127.0.0.1:8765",
  originalTextField: "", instructionField: "", apiEnabled: false, apiEndpoint: "", prompt: ""
};
const $ = (id) => document.getElementById(id);
const status = (message, bad = false) => {
  $("status").textContent = message;
  $("status").style.color = bad ? "#c0392b" : "#218838";
};

async function invoke(action, params = {}) {
  const response = await fetch($("anki-url").value.trim() || DEFAULTS.ankiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params })
  });
  if (!response.ok) throw new Error(`AnkiConnect returned HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}
function setList(id, values) {
  $(id).replaceChildren(...values.map((value) => {
    const option = document.createElement("option");
    option.value = value;
    return option;
  }));
}
async function guarded(work) {
  try { await work(); }
  catch (error) { status(error instanceof TypeError ? "Could not connect to AnkiConnect" : error.message, true); }
}
function endpointPermission(endpoint) {
  return AnkiNetworkPolicy.permissionPattern(endpoint);
}
function ankiPermission(endpoint) {
  let url;
  try { url = new URL(endpoint); } catch { throw new Error("AnkiConnect URL is invalid"); }
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  if (!local || url.protocol !== "http:") {
    throw new Error("AnkiConnect must use HTTP on this computer (localhost or 127.0.0.1)");
  }
  return `${url.origin}/*`;
}

chrome.storage.sync.get(DEFAULTS, (settings) => {
  $("anki-url").value = settings.ankiUrl || DEFAULTS.ankiUrl;
  $("deck").value = settings.deck;
  $("model").value = settings.model;
  $("original-field").value = settings.originalTextField || settings.field;
  $("instruction-field").value = settings.instructionField;
  $("api-enabled").checked = Boolean(settings.apiEnabled);
  $("api-endpoint").value = settings.apiEndpoint;
  $("prompt").value = settings.prompt;
  chrome.storage.local.get({ apiKey: "" }, ({ apiKey }) => {
    $("api-key").placeholder = apiKey ? "已保存（留空保持现有密钥）" : "粘贴 API Key";
  });
});
$("refresh-decks").addEventListener("click", () => guarded(async () => {
  setList("decks", await invoke("deckNames"));
  status("Deck list updated");
}));
$("refresh-models").addEventListener("click", () => guarded(async () => {
  setList("models", await invoke("modelNames"));
  status("Note type list updated");
}));
$("refresh-fields").addEventListener("click", () => guarded(async () => {
  const model = $("model").value.trim();
  if (!model) throw new Error("Enter or choose a note type first");
  setList("fields", await invoke("modelFieldNames", { modelName: model }));
  status("Field list updated");
}));
$("model").addEventListener("change", () => $("refresh-fields").click());
$("clear-key").addEventListener("click", () => {
  chrome.storage.local.remove("apiKey", () => {
    $("api-key").value = "";
    $("api-key").placeholder = "粘贴 API Key";
    status("Saved API Key cleared");
  });
});
$("save").addEventListener("click", async () => {
  const settings = {
    deck: $("deck").value.trim(),
    model: $("model").value.trim(),
    ankiUrl: $("anki-url").value.trim() || DEFAULTS.ankiUrl,
    originalTextField: $("original-field").value.trim(),
    instructionField: $("instruction-field").value.trim(),
    apiEnabled: $("api-enabled").checked,
    apiEndpoint: $("api-endpoint").value.trim(),
    prompt: $("prompt").value.trim()
  };
  if (!settings.deck || !settings.model) return status("Set a target deck and note type", true);

  const origins = [];
  try {
    const ankiOrigin = ankiPermission(settings.ankiUrl);
    if (!["http://127.0.0.1:8765/*", "http://localhost:8765/*"].includes(ankiOrigin)) origins.push(ankiOrigin);
    if (settings.apiEnabled) {
      if (!settings.apiEndpoint) return status("API endpoint is not set", true);
      if (!settings.prompt) return status("Prompt is not set", true);
      origins.push(endpointPermission(settings.apiEndpoint));
    }
  } catch (error) { return status(error.message, true); }

  if (origins.length) {
    const granted = await chrome.permissions.request({ origins: [...new Set(origins)] });
    if (!granted) return status("Permission for the configured endpoint was not granted", true);
  }
  chrome.storage.sync.set(settings, () => {
    const key = $("api-key").value.trim();
    const finish = () => {
      $("api-key").value = "";
      chrome.storage.local.get({ apiKey: "" }, ({ apiKey }) => {
        $("api-key").placeholder = apiKey ? "已保存（留空保持现有密钥）" : "粘贴 API Key";
      });
      status("Settings saved");
    };
    if (key) chrome.storage.local.set({ apiKey: key }, finish);
    else finish();
  });
});
