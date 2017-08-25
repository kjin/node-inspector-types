import * as schema from './devtools-protocol-schema'
import { flattenArgs } from './utils'
import { generateSubstituteArgs } from './generate-substitute-args'
import { substitute } from './substitute'
import * as trimRight from 'trim-right'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const defTypedRemotePrefix = 'https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master'
const dtsSuffix = 'types/node/index.d.ts'
const testSuffix = 'types/node/node-tests.ts'

const nodeDts = (process.env.DEFINITELY_TYPED ?
  execSync(`git show master:${dtsSuffix}`, { cwd: process.env.DEFINITELY_TYPED }) :
  execSync(`curl ${defTypedRemotePrefix}/${dtsSuffix}`)).toString('utf8')
  .split('\n')
  .map(line => {
    if (line.startsWith('// This needs to be global to avoid TS2403')) {
      return [
        '/** inspector module types */',
        '/// <reference path="./inspector.d.ts" />',
        '',
        line
      ]
    } else {
      return [line]
    }
  })
  .reduce(flattenArgs(), [])
  .join('\n')

const protocol: schema.Schema = JSON.parse(readFileSync('./node_modules/devtools-protocol/json/js_protocol.json', 'utf8'));
const template = readFileSync('./template.d.ts', 'utf8')

const substituteArgs = generateSubstituteArgs(protocol)
const inspectorDts = substitute(template, {
  ...substituteArgs,
  referenceMain: ['/// <reference path="./index.d.ts" />']
}).split('\n')
  .map(line => trimRight(line))
  .map(line => {
    const matches = line.match(/^(\s+)[^\s]/)
    if (!matches) {
      return line
    }
    const [_0, indent] = matches
    if (indent.length % 2 === 0) {
      return indent + line
    } else {
      return indent.slice(1) + line
    }
  })
  .join('\n')

if (!existsSync('node')) {
  mkdirSync('node')
}
writeFileSync('node/index.d.ts', nodeDts, 'utf8')
writeFileSync('node/inspector.d.ts', inspectorDts, 'utf8')
