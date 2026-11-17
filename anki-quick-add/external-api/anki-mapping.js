(function (root) {
  const api = {
    create({ modelFields, selectedText, instructionValue, originalTextField, instructionField, externalEnabled }) {
      if (!Array.isArray(modelFields) || modelFields.length === 0) throw new Error("Note type has no fields");
      const original = originalTextField || modelFields[0];
      if (!modelFields.includes(original)) throw new Error(`Original text field not found: ${original}`);
      const fields = { [original]: selectedText };
      if (!externalEnabled) return fields;
      if (!instructionField) throw new Error("Set an instruction field in extension settings");
      if (!modelFields.includes(instructionField)) throw new Error(`Instruction field not found: ${instructionField}`);
      if (instructionField === original) throw new Error("Original text field and instruction field must be different");
      if (!String(instructionValue || "").trim()) throw new Error("External API returned an empty result");
      fields[instructionField] = instructionValue;
      return fields;
    }
  };
  root.AnkiFieldMapping = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
