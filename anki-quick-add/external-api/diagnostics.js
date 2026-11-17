(function(root){
 function safe(value,secrets=[]){let s=String(value??"");for(const x of secrets.filter(Boolean))s=s.split(x).join("[redacted]");return s.replace(/Bearer\s+[^\s"'<>]+/gi,"Bearer [redacted]").replace(/("(?:api[_-]?key|authorization|token|secret)"\s*:\s*")[^"]*/gi,'$1[redacted]');}
 async function testConnection(args){const steps=[];const result=await root.AnkiExternalApiClient.requestDetailed({...args,onStep:x=>steps.push(x)});return {steps,result};}
 async function testFullFlow({settings,apiKey,text="der Mann",ankiInvoke}){
  const steps=[];const onStep=x=>steps.push(x);const prompt=root.AnkiPrompt.render(settings.prompt,text);onStep({id:"prompt",label:"Prompt rendering",state:"ok",detail:"{{text}} substituted"});
  let api;try{api=await root.AnkiExternalApiClient.requestDetailed({endpoint:settings.apiEndpoint,apiKey,text,prompt,deck:settings.deck,noteType:settings.model,onStep});}catch(e){e.diagnostics=steps;throw e;}
  onStep({id:"anki",label:"AnkiConnect",state:"running",detail:"Checking connection"});
  let decks,models,fields;try{[decks,models]=await Promise.all([ankiInvoke("deckNames"),ankiInvoke("modelNames")]);}catch(e){throw Object.assign(new Error("Could not connect to AnkiConnect"),{stage:"anki_connect",cause:e,diagnostics:steps,apiResult:api});}
  onStep({id:"anki",label:"AnkiConnect",state:"ok",detail:"Connected"});
  if(!decks.includes(settings.deck))throw Object.assign(new Error("Deck not found: "+settings.deck),{stage:"anki_deck",diagnostics:steps,apiResult:api});
  if(!models.includes(settings.model))throw Object.assign(new Error("Note type not found: "+settings.model),{stage:"anki_note_type",diagnostics:steps,apiResult:api});
  try{fields=await ankiInvoke("modelFieldNames",{modelName:settings.model});const mapped=root.AnkiFieldMapping.create({modelFields:fields,selectedText:text,instructionValue:api.instructionValue,originalTextField:settings.originalTextField||settings.field,instructionField:settings.instructionField,externalEnabled:true});onStep({id:"fields",label:"Field mapping",state:"ok",detail:Object.keys(mapped).join(", ")});return {steps,result:api,fields:mapped,noteCreated:false};}
  catch(e){throw Object.assign(new Error(e.message||"Anki field mapping failed"),{stage:"anki_field",diagnostics:steps,apiResult:api});}
 }
 root.AnkiDiagnostics={safe,testConnection,testFullFlow};
})(globalThis);