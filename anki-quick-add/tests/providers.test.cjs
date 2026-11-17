
const test=require("node:test");const assert=require("node:assert/strict");
const policy=require("../external-api/network-policy.js");global.AnkiNetworkPolicy=policy;
const routing=require("../external-api/provider-routing.js");global.AnkiProviderRouting=routing;
require("../external-api/debug-log.js");
const parser=require("../external-api/response-parser.js");global.AnkiResponseParser=parser;
const client=require("../external-api/api-client.js");global.AnkiExternalApiClient=client;
const expected="http://100.75.97.86:8799/v1/chat/completions";
for(const endpoint of ["http://100.75.97.86:8799","http://100.75.97.86:8799/v1","http://100.75.97.86:8799/v1/chat/completions","http://100.75.97.86:8799/chat/completions","http://100.75.97.86:8799/v1/models","http://100.75.97.86:8799/models","http://100.75.97.86:8799/api/chat","http://100.75.97.86:8799/api/tags"]){test("normalizes OpenAI route: "+endpoint,()=>assert.equal(routing.buildApiRoutes(endpoint,"openai").chat,expected));}
test("routes Ollama to native endpoints",()=>{const r=routing.buildApiRoutes("http://100.75.97.86:8799/api/tags","ollama");assert.equal(r.chat,"http://100.75.97.86:8799/api/chat");assert.equal(r.models,"http://100.75.97.86:8799/api/tags");});
test("builds OpenAI-compatible request with configured model",()=>assert.deepEqual(client.buildApiRequest({provider:"openai",model:"my-model",prompt:"p"}),{model:"my-model",temperature:0.7,messages:[{role:"user",content:"p"}],stream:false}));
test("builds Ollama native request body",()=>assert.deepEqual(client.buildApiRequest({provider:"ollama",model:"llama3",prompt:"p"}),{model:"llama3",messages:[{role:"user",content:"p"}],stream:false,options:{temperature:0.7}}));
test("parses provider-specific response structures",()=>{assert.equal(parser.parseApiResponse('{"choices":[{"message":{"content":"名词"}}]}',"openai").instructionValue,"名词");assert.equal(parser.parseApiResponse('{"message":{"content":"名词"}}',"ollama").instructionValue,"名词");});
test("does not accept OpenAI result shorthand in provider parser",()=>assert.throws(()=>parser.parseApiResponse('{"result":"not a chat response"}',"openai"),e=>e.stage==="api_parse"));
test("allows Tailscale HTTP endpoint",()=>assert.doesNotThrow(()=>policy.validateEndpoint("http://100.75.97.86:8799")));
test("API request sends configured OpenAI model and compatible body",async()=>{const old=global.fetch;let sent;global.fetch=async(url,init)=>{sent={url,init};return{ok:true,status:200,text:async()=>'{"choices":[{"message":{"content":"ok"}}]}'}};try{await client.requestDetailed({endpoint:"http://100.75.97.86:8799",provider:"openai",model:"local-model",apiKey:"secret",prompt:"p"});assert.equal(sent.url,expected);assert.deepEqual(JSON.parse(sent.init.body),{model:"local-model",temperature:0.7,messages:[{role:"user",content:"p"}],stream:false});assert.equal(sent.init.headers.Authorization,"Bearer secret");}finally{global.fetch=old;}});
test("Ollama response uses native message.content format",()=>assert.equal(parser.parseApiResponse('{"message":{"content":"native"}}',"ollama").instructionValue,"native"));
test("OpenAI Models route derives /v1/models",()=>assert.equal(routing.buildApiRoutes("http://100.75.97.86:8799/v1/chat/completions","openai").models,"http://100.75.97.86:8799/v1/models"));

test("discovers OpenAI model ids from /v1/models",async()=>{const old=global.fetch;let url,init;global.fetch=async(u,i)=>{url=u;init=i;return{ok:true,json:async()=>({data:[{id:"b"},{id:"a"}]})};};try{assert.deepEqual(await client.fetchModels({endpoint:"http://100.75.97.86:8799",provider:"openai",apiKey:"k"}),["a","b"]);assert.equal(url,"http://100.75.97.86:8799/v1/models");assert.equal(init.headers.Authorization,"Bearer k");}finally{global.fetch=old;}});
test("discovers Ollama model names from /api/tags",async()=>{const old=global.fetch;let url;global.fetch=async(u)=>{url=u;return{ok:true,json:async()=>({models:[{name:"llama3:latest"},{model:"qwen"}]})};};try{assert.deepEqual(await client.fetchModels({endpoint:"http://100.75.97.86:8799",provider:"ollama"}),["llama3:latest","qwen"]);assert.equal(url,"http://100.75.97.86:8799/api/tags");}finally{global.fetch=old;}});
test("reports server model errors distinctly",()=>assert.throws(()=>parser.parseApiResponse('{"error":{"message":"model not found"}}',"openai"),e=>e.stage==="api_model"&&e.message.includes("model not found")));
test("model URL derivation refuses a query-bearing endpoint",()=>assert.equal(routing.buildApiRoutes("https://api.example.test?tenant=a","openai").models,""));
