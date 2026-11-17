(function(root){
  const KNOWN=["/v1/chat/completions","/chat/completions","/v1/models","/models","/api/chat","/api/tags"];
  function parseUrl(value){let u;try{u=new URL(String(value||"").trim());}catch{throw Object.assign(new Error("API Server / Endpoint is invalid"),{stage:"api_config"});}if(!["http:","https:"].includes(u.protocol)||!u.hostname)throw Object.assign(new Error("Endpoint must use HTTP or HTTPS"),{stage:"api_config"});root.AnkiNetworkPolicy.validateEndpoint(u.toString());return u;}
  function stripRoute(path){let p=path.replace(/\/+$/,"");for(const suffix of KNOWN){if(p.endsWith(suffix)){p=p.slice(0,-suffix.length).replace(/\/+$/,"");break;}}if(p.endsWith("/v1"))p=p.slice(0,-3).replace(/\/+$/,"");return p;}
  function normalizeEndpoint(value){const u=parseUrl(value);u.pathname=stripRoute(u.pathname);return u;}
  function buildApiRoutes(value,provider="openai"){const rootUrl=normalizeEndpoint(value);const prefix=rootUrl.pathname.replace(/\/+$/,"");const join=path=>{const u=new URL(rootUrl.toString());u.pathname=prefix+path;return u.toString();};if(provider==="ollama")return {chat:join("/api/chat"),models:join("/api/tags"),server:rootUrl.toString(),provider};if(provider!=="openai")throw Object.assign(new Error("Unsupported API provider"),{stage:"api_config"});return {chat:join("/v1/chat/completions"),models:rootUrl.search||rootUrl.hash?"":join("/v1/models"),server:rootUrl.toString(),provider};}
  function permissionPattern(value,provider){return new URL(buildApiRoutes(value,provider).chat).origin+"/*";}
  root.AnkiProviderRouting={normalizeEndpoint,buildApiRoutes,permissionPattern};
  if(typeof module!=="undefined"&&module.exports)module.exports=root.AnkiProviderRouting;
})(globalThis);