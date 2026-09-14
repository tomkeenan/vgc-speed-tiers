import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Gate: both data files must validate against their schemas before UI consumes them.
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Validates a data file against a JSON schema.
 * Takes data and schema relative paths, returns true if valid.
 */
async function check(dataPath, schemaPath) {
  const [data, schema] = await Promise.all([
    readFile(new URL(dataPath, import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL(schemaPath, import.meta.url), 'utf8').then(JSON.parse),
  ]);
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error(`INVALID ${dataPath}`);
    for (const e of validate.errors ?? []) console.error(`  - ${e.instancePath} ${e.message}`);
    return false;
  }
  console.log(`valid: ${dataPath} (${data.pokemon.length} entries)`);
  return true;
}

const results = [
  await check('../data/roster.json', '../schema/roster.schema.json'),
  await check('../data/pokemon.json', '../schema/pokemon.schema.json'),
];
process.exit(results.every(Boolean) ? 0 : 1);
