const test = require("node:test");
const assert = require("node:assert/strict");
const prompt = require("../external-api/prompt.js");
const parser = require("../external-api/response-parser.js");
const mapping = require("../external-api/anki-mapping.js");
const networkPolicy = require("../external-api/network-policy.js");

test("renders all {{text}} tokens without interpreting replacement characters", () => {
  assert.equal(prompt.render("Classify {{text}} and {{text}}", "$& laufen"), "Classify $& laufen and $& laufen");
});

test("parses plain text and simple JSON API responses", () => {
  assert.equal(parser.parse("  名词\n"), "名词");
  assert.equal(parser.parse('{"result":"名词"}'), "名词");
  assert.equal(parser.parse('{"data":{"instructionValue":"动词"}}'), "动词");
  assert.equal(parser.parse('{"choices":[{"message":{"content":"形容词"}}]}'), "形容词");
});

test("rejects empty and unsupported API results", () => {
  assert.throws(() => parser.parse("  "), /empty result/i);
  assert.throws(() => parser.parse('{"other":"value"}'), /unsupported response/i);
});

for (const [text, value] of [["der Mann", "名词"], ["laufen", "动词"], ["schnell", "形容词"]]) {
  test(`maps ${text} and its instruction value to separate Anki fields`, () => {
    assert.deepEqual(mapping.create({
      modelFields: ["Front", "Category"],
      selectedText: text,
      instructionValue: value,
      originalTextField: "Front",
      instructionField: "Category",
      externalEnabled: true
    }), { Front: text, Category: value });
  });
}

test("keeps direct-to-Anki behavior when External API is disabled", () => {
  assert.deepEqual(mapping.create({
    modelFields: ["Front", "Back"],
    selectedText: "der Mann",
    originalTextField: "Front",
    instructionField: "",
    externalEnabled: false
  }), { Front: "der Mann" });
});

test("reports a missing instruction field", () => {
  assert.throws(() => mapping.create({
    modelFields: ["Front"], selectedText: "der Mann", instructionValue: "名词",
    originalTextField: "Front", instructionField: "Category", externalEnabled: true
  }), /Instruction field not found/);
});

test("allows HTTPS endpoints and HTTP endpoints on local/private networks", () => {
  for (const endpoint of [
    "https://api.example.com/classify",
    "http://localhost:8765",
    "http://192.168.1.20:8000/api",
    "http://10.2.3.4/api",
    "http://172.20.0.8/api",
    "http://my-api.local:8000",
    "http://[fd12::5]:8000"
  ]) assert.doesNotThrow(() => networkPolicy.validateEndpoint(endpoint), endpoint);
});

test("rejects public HTTP endpoints", () => {
  assert.throws(() => networkPolicy.validateEndpoint("http://api.example.com"), /HTTPS for public APIs/i);
  assert.throws(() => networkPolicy.validateEndpoint("http://8.8.8.8/api"), /HTTPS for public APIs/i);
});

test("requests permission only for the configured API origin", () => {
  assert.equal(networkPolicy.permissionPattern("http://192.168.1.20:8000/v1"), "http://192.168.1.20:8000/*");
});
