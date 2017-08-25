import * as schema from './devtools-protocol-schema'
import { generateSubstituteArgs } from './generate-substitute-args'
import { substitute } from './substitute'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import * as trimRight from 'trim-right'

const protocol: schema.Schema = JSON.parse(readFileSync('./node_modules/devtools-protocol/json/js_protocol.json', 'utf8'));
const template = readFileSync('./template.d.ts', 'utf8')

const substituteArgs = generateSubstituteArgs(protocol)
const inspectorDts = substitute(template, substituteArgs)
  .split('\n')
  .map(line => trimRight(line))
  .join('\n')
if (!existsSync('inspector')) {
  mkdirSync('inspector')
}
writeFileSync('inspector/index.d.ts', inspectorDts, 'utf8')
