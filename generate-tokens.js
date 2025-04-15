import fs from 'fs';
import path from 'path';

const jsonFilePath = process.env.JSON_FILE_PATH || 'tokens.json'; // Default path
const outputFilePath = process.env.OUTPUT_FILE_PATH || 'app-tokens.css'; // Default path

fs.readFile(jsonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Failed to read JSON file:', err);
    process.exit(1); // Exit with an error code
  }

  try {
    const tokens = JSON.parse(data);
    let cssOutput = ':root {\n';

    function flattenTokens(obj, prefix = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newPrefix = prefix ? `${prefix}-${key}` : key;
          if (obj[key].value && obj[key].type) {
            cssOutput += `  --ap-${newPrefix}: ${obj[key].value};\n`;
          } else if (typeof obj[key] === 'object') {
            flattenTokens(obj[key], newPrefix);
          }
        }
      }
    }

    flattenTokens(tokens['primitives/value']);
    flattenTokens(tokens['tokens/value']);

    cssOutput += '}\n';

    fs.writeFile(outputFilePath, cssOutput, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Failed to write CSS file:', writeErr);
        process.exit(1); // Exit with an error code
      }
      console.log(`Successfully generated tokens at: ${outputFilePath}`);
    });

  } catch (parseError) {
    console.error('Failed to parse JSON:', parseError);
    process.exit(1); // Exit with an error code
  }
});
