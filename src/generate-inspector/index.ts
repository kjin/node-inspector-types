import * as schema from './devtools-protocol-schema'
import { flattenArgs, substitute } from './utils'
import { generateSubstituteArgs } from './generate-substitute-args'
import * as trimRight from 'trim-right'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const devToolsPath = `${__dirname}/../../node_modules/devtools-protocol`

const json: string = readFileSync(`${devToolsPath}/json/js_protocol.json`, 'utf8')
const protocol: schema.Schema = JSON.parse(json)

const devtoolsPJson: string = readFileSync(`${devToolsPath}/package.json`, 'utf8')
const protocolVersion = [`// DevTools Protocol Revision: ${JSON.parse(devtoolsPJson).version.split('.')[2]}`]

const template = readFileSync(`${__dirname}/inspector.d.ts.template`, 'utf8')

const substituteArgs = {
  protocolVersion,
  ...generateSubstituteArgs(protocol)
}
const inspectorDts = substitute(template, substituteArgs).split('\n')
  .map(line => trimRight(line))
  .join('\n')

writeFileSync('./inspector.d.ts', inspectorDts, 'utf8')
