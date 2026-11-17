(function (root) {
  const api = {
    render(prompt, text) {
      return String(prompt || "").split("{{text}}").join(String(text ?? ""));
    }
  };
  root.AnkiPrompt = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
