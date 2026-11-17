(function(root){
  function value(v){return typeof v==="string"?v.trim():(typeof v==="number"||typeof v==="boolean"?String(v):"");}
  function fromObject(d){if(!d||typeof d!=="object")return "";for(const k of ["instructionValue","result","value","output_text"]){const x=value(d[k]);if(x)return x;}const n=value(d.data?.result)||value(d.data?.instructionValue);if(n)return n;const c=d.choices?.[0]?.message?.content;return typeof c==="string"?c.trim():"";}
  function parseDetailed(payload){
    const raw=typeof payload==="string"?payload:String(payload??"");const trimmed=raw.trim();if(!trimmed)throw Object.assign(new Error("External API returned an empty result"),{code:"empty-result",rawResponse:raw});
    let parsed,format="text";
    if(typeof payload==="string"&&(trimmed.startsWith("{")||trimmed.startsWith("["))){try{parsed=JSON.parse(trimmed);format="json";}catch(e){throw Object.assign(new Error("External API returned invalid JSON"),{code:"invalid-json",rawResponse:raw});}}
    else if(typeof payload!=="string"){parsed=payload;format="json";}
    else if(trimmed.startsWith('"')){try{parsed=JSON.parse(trimmed);format="json";}catch{parsed=trimmed;}}
    const result=format==="json"?(typeof parsed==="string"?parsed.trim():fromObject(parsed)):trimmed;
    if(!result)throw Object.assign(new Error("External API response did not contain a supported result field"),{code:"missing-result",rawResponse:raw,parsedResponse:parsed});
    return {instructionValue:result,rawResponse:raw,parsedResponse:parsed,format};
  }
  const api={parse(payload){return parseDetailed(payload).instructionValue;},parseDetailed};
  root.AnkiResponseParser=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(globalThis);