import fs from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsonFilePath = process.env.JSON_FILE_PATH || join(__dirname, '../tokens/tokens.json');
const outputFilePath = process.env.OUTPUT_FILE_PATH || join(__dirname, '../tokens/component-tokens.json');

function extractTokenValue(text, obj) {
  let primitiveToken;

  const match = text.match(/\{([^}]+)\}/);

  primitiveToken = match[1];
  let result = obj;
  primitiveToken.split('.').forEach(path => {
    result = result[path];
  })
  return result.value
}

function parseTokens(src, obj) {
  // Process each value in the object
  for (const key in obj) {
    const value = obj[key];
    
    // If the value is an object with a "value" property that's a string
    // and possibly starts with "{" (indicating a token reference)
    if (value && typeof value === 'object') {
      if (value.value && typeof value.value === 'string') {
        // This is a token value that needs extraction
        value.value = extractTokenValue(value.value, src);
      } else {
        // This is a nested object, recurse into it
        parseTokens(src, value);
      }
    }
  }
}

fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Failed to read JSON file:', err);
    process.exit(1); // Exit with an error code
  }

  try {
    const tokens = JSON.parse(data);

    const primitives = tokens["primitive/Default"];
    const semantics = tokens["semantic/Default"];
    const components = tokens["component/Default"];

    parseTokens(primitives, semantics);
    parseTokens(semantics, components);
    
    // Create new output object with only components and metadata
    const outputTokens = {
      "component/Default": components
    };
    
    // Preserve other important fields from the original tokens
    if (tokens.$themes) outputTokens.$themes = tokens.$themes;
    if (tokens.$metadata) outputTokens.$metadata = tokens.$metadata;
    
    // Write the resulting JSON to the output file
    fs.writeFile(
      outputFilePath, 
      JSON.stringify(outputTokens, null, 2), 
      'utf8', 
      (writeErr) => {
        if (writeErr) {
          console.error('Failed to write output file:', writeErr);
          process.exit(1);
        }
        console.log(`Component tokens successfully written to ${outputFilePath}`);
      }
    );
    
  } catch (parseError) {
    console.error('Failed to parse JSON:', parseError);
    process.exit(1); // Exit with an error code
  }
});
