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
    if (line === '// TypeScript Version: 2.2') {
      return '// TypeScript Version: 2.3'
    } else {
      return line
    }
  })
  .join('\n')

const inspectorDts = readFileSync('./inspector/index.d.ts', 'utf8')
  .split('\n')
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
  .join('\n');

if (!existsSync('node')) {
  mkdirSync('node')
}
writeFileSync('node/index.d.ts', [nodeDts, inspectorDts].join('\n'), 'utf8')
