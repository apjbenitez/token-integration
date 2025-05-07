import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

import StyleDictionary from 'style-dictionary';
import { formats } from 'style-dictionary/enums';

import { register } from '@tokens-studio/sd-transforms';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register the tokens-studio transforms
register(StyleDictionary, { excludeParentKeys: true }); // default: retains parent keys

// Create custom name transform to add '--ap' prefix
StyleDictionary.registerTransform({
  name: 'name/ap-prefix',
  type: 'name',
  transform: (token) => {
    // Ensure the name is already in kebab-case before adding the prefix
    // This assumes 'name/kebab' is applied before this transform
    return `ap-${token.name}`;
  }
});

// Define the transforms to be applied in the platform
// We list them individually in the desired order
const customTransforms = [
  'name/kebab',
  'size/px',
  'name/ap-prefix'
];

const sd = new StyleDictionary({
  source: [join(__dirname, '../tokens/component-tokens.json')],
  // Preprocessors are applied before transforms
  preprocessors: ['tokens-studio'], // required since v0.16.0
  platforms: {
    css: {
      // List all desired transforms in order
      transformGroup: 'tokens-studio',
      transforms: customTransforms,
      buildPath: './build/css/',
      files: [
        {
          destination: 'variables.css',
          format: formats.cssVariables,
        }
      ]
    },
    scss: {
      transformGroup: 'tokens-studio',
      transforms: customTransforms,
      buildPath: './build/scss/',
      files: [
        {
          destination: '_variables.scss',
          format: formats.scssVariables,
        }
      ]
    }
  }
});

// Clean and build
async function buildTokens() {
  try {
    await sd.cleanAllPlatforms();
    console.log('Cleaned build directories.');
    await sd.buildAllPlatforms();
    console.log('Build complete.');
  } catch (error) {
    console.error('Error building tokens:', error);
  }
}

buildTokens();
