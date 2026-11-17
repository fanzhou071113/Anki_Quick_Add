const MENU_ID = "anki-quick-add-selection";
const STATUS_ID = "anki-quick-add-status";
const DEFAULT_ANKI_URL = "http://127.0.0.1:8765";

importScripts(
  "external-api/network-policy.js",
  "external-api/prompt.js",
  "external-api/response-parser.js",
  "external-api/api-client.js",
  "external-api/anki-mapping.js"
);

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({
    id: MENU_ID,
    title: "添加到 Anki",
    contexts: ["selection"]
  }));
});

async function ankiInvoke(url, action, params = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, version: 6, params })
  });
  if (!response.ok) throw new Error(`AnkiConnect returned HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function notify(message) {
  chrome.notifications.create(STATUS_ID, {
    type: "basic",
    iconUrl: "icon.svg",
    title: "Anki Quick Add",
    message: String(message).slice(0, 240)
  });
}

function friendlyError(error) {
  if (error?.name === "AbortError") return "External API request timed out";
  if (error instanceof TypeError) return "Could not connect to AnkiConnect";
  return error?.message || "Could not add note";
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  const selectedText = info.selectionText || "";
  if (!selectedText.trim()) return notify("No selected text");
  notify("Generating…");

  try {
    const settings = await chrome.storage.sync.get({
      deck: "", model: "", field: "", ankiUrl: DEFAULT_ANKI_URL,
      originalTextField: "", instructionField: "", apiEnabled: false,
      apiEndpoint: "", prompt: ""
    });
    if (!settings.deck || !settings.model) throw new Error("Set a target deck and note type in extension settings");

    const ankiUrl = settings.ankiUrl.trim() || DEFAULT_ANKI_URL;
    const [decks, models] = await Promise.all([
      ankiInvoke(ankiUrl, "deckNames"),
      ankiInvoke(ankiUrl, "modelNames")
    ]);
    if (!decks.includes(settings.deck)) throw new Error(`Deck not found: ${settings.deck}`);
    if (!models.includes(settings.model)) throw new Error(`Note type not found: ${settings.model}`);

    const modelFields = await ankiInvoke(ankiUrl, "modelFieldNames", { modelName: settings.model });
    let instructionValue = "";
    if (settings.apiEnabled) {
      const { apiKey = "" } = await chrome.storage.local.get({ apiKey: "" });
      instructionValue = await AnkiExternalApiClient.request({
        endpoint: settings.apiEndpoint,
        apiKey,
        text: selectedText,
        prompt: AnkiPrompt.render(settings.prompt, selectedText),
        deck: settings.deck,
        noteType: settings.model
      });
    }

    const fields = AnkiFieldMapping.create({
      modelFields,
      selectedText,
      instructionValue,
      originalTextField: settings.originalTextField || settings.field,
      instructionField: settings.instructionField,
      externalEnabled: Boolean(settings.apiEnabled)
    });
    await ankiInvoke(ankiUrl, "addNote", {
      note: { deckName: settings.deck, modelName: settings.model, fields, tags: [] }
    });
    notify(`Added: ${selectedText}`);
  } catch (error) {
    notify(friendlyError(error));
  }
});
