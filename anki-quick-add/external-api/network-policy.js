(function (root) {
  function isPrivateIpv4(host) {
    const parts = host.split(".");
    if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) return false;
    const octets = parts.map(Number);
    if (octets.some((value) => value < 0 || value > 255)) return false;
    const [a, b] = octets;
    return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127);
  }
  function isLanHost(hostname) {
    const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
    if (["localhost", "::1"].includes(host) || host.endsWith(".localhost")) return true;
    if (isPrivateIpv4(host)) return true;
    if (host.startsWith("::ffff:") && isPrivateIpv4(host.slice(7))) return true;
    if (/^(fc|fd)[0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return true;
    if (["local", "lan", "home.arpa", "internal"].some((suffix) => host === suffix || host.endsWith("." + suffix))) return true;
    return !host.includes(".") && /^[a-z0-9-]+$/i.test(host);
  }
  function validateEndpoint(endpoint) {
    if (!endpoint) throw new Error("API endpoint is not set");
    let url;
    try { url = new URL(endpoint); } catch { throw new Error("API endpoint is invalid"); }
    if (url.protocol === "https:") return url;
    if (url.protocol === "http:" && isLanHost(url.hostname)) return url;
    throw new Error("Use HTTPS for public APIs or HTTP on a local/private network");
  }
  const api = {
    isLanHost,
    validateEndpoint,
    permissionPattern(endpoint) { return `${validateEndpoint(endpoint).origin}/*`; }
  };
  root.AnkiNetworkPolicy = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
