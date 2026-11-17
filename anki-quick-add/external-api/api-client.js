(function (root) {
  function validateEndpoint(endpoint) {
    if (!endpoint) throw new Error("API endpoint is not set");
    let url;
    try { url = new URL(endpoint); } catch { throw new Error("API endpoint is invalid"); }
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
      throw new Error("API endpoint must use HTTPS (HTTP is allowed for localhost)");
    }
    return url;
  }
  const api = {
    async request({ endpoint, apiKey, text, prompt, deck, noteType }) {
      root.AnkiNetworkPolicy.validateEndpoint(endpoint);
      if (!apiKey) throw new Error("API key is not set");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ text, prompt, deck, noteType }),
          signal: controller.signal
        });
        const body = await response.text();
        if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
        return root.AnkiResponseParser.parse(body);
      } catch (error) {
        if (error?.name === "AbortError") throw new Error("External API request timed out");
        if (error instanceof TypeError) throw new Error("External API network error");
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
  };
  root.AnkiExternalApiClient = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
