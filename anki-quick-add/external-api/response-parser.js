(function (root) {
  function valueToString(value) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
  }
  function fromObject(data) {
    if (!data || typeof data !== "object") return "";
    const direct = ["instructionValue", "result", "value", "output_text"];
    for (const key of direct) {
      const value = valueToString(data[key]);
      if (value) return value;
    }
    const nested = valueToString(data.data?.result) || valueToString(data.data?.instructionValue);
    if (nested) return nested;
    const openAi = data.choices?.[0]?.message?.content;
    if (typeof openAi === "string" && openAi.trim()) return openAi.trim();
    return "";
  }
  const api = {
    parse(payload) {
      if (typeof payload !== "string") {
        const value = fromObject(payload);
        if (value) return value;
        throw new Error("External API returned an unsupported response format");
      }
      const raw = payload.trim();
      if (!raw) throw new Error("External API returned an empty result");
      try {
        const parsed = JSON.parse(raw);
        const value = typeof parsed === "string" ? parsed.trim() : fromObject(parsed);
        if (value) return value;
        throw new Error("External API returned an unsupported response format");
      } catch (error) {
        if (error instanceof SyntaxError) return raw;
        throw error;
      }
    }
  };
  root.AnkiResponseParser = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
