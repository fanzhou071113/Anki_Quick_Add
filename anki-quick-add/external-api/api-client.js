(function(root){
  function fail(message,stage,extra={}){return Object.assign(new Error(message),{stage,...extra});}
  function safeEndpoint(endpoint){try{const u=new URL(endpoint);u.username="";u.password="";for(const k of [...u.searchParams.keys()])if(/key|token|secret|auth/i.test(k))u.searchParams.set(k,"[redacted]");return u.toString();}catch{return "[invalid endpoint]";}}
  async function requestDetailed({endpoint,apiKey,text,prompt,deck,noteType,onStep}){
    const step=(id,label,state,detail="")=>{try{onStep?.({id,label,state,detail});}catch{}};
    let url;try{url=root.AnkiNetworkPolicy.validateEndpoint(endpoint);}catch(e){throw fail(e.message,"api_endpoint",{endpoint:safeEndpoint(endpoint)});}
    if(!apiKey)throw fail("API key is not set","api_config",{endpoint:safeEndpoint(endpoint)});
    step("endpoint","Endpoint","ok",safeEndpoint(endpoint));step("network","Network","running","Sending request");
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
    let response,body;
    try{response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},body:JSON.stringify({text,prompt,deck,noteType}),signal:controller.signal});}
    catch(e){step("network","Network","error",e?.name==="AbortError"?"Request timed out":"Could not reach API endpoint");throw fail(e?.name==="AbortError"?"External API request timed out":"External API network error",e?.name==="AbortError"?"api_timeout":"api_network",{endpoint:safeEndpoint(endpoint)});}
    finally{clearTimeout(timeout);}
    step("network","Network","ok","Connected");
    try{body=await response.text();}catch(e){throw fail("Could not read API response","api_response",{endpoint:safeEndpoint(endpoint),httpStatus:response.status});}
    step("http","HTTP status",response.ok?"ok":"error",String(response.status));
    step("response","Response body","ok",`Received ${body.length} characters`);
    if(!response.ok)throw fail(`API returned HTTP ${response.status}`,"api_http",{httpStatus:response.status,rawResponse:body,endpoint:safeEndpoint(endpoint)});
    try{const parsed=root.AnkiResponseParser.parseDetailed(body);step("json","JSON parsing",parsed.format==="json"?"ok":"skipped",parsed.format==="json"?"Valid JSON":"Plain text response");step("result","Result extraction","ok","Result extracted");return {...parsed,httpStatus:response.status,endpoint:safeEndpoint(endpoint)};}
    catch(e){const stage=e.code==="invalid-json"?"api_json":"api_result";step(stage==="api_json"?"json":"result",stage==="api_json"?"JSON parsing":"Result extraction","error",e.message);throw fail(e.message,stage,{code:e.code,rawResponse:body,httpStatus:response.status,endpoint:safeEndpoint(endpoint)});}
  }
  const api={requestDetailed,async request(args){return (await requestDetailed(args)).instructionValue;}};
  root.AnkiExternalApiClient=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(globalThis);