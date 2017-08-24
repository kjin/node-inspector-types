import * as schema from './devtools-protocol-schema'
import { flattenArgs, cap, isObjectReference, createDocs, resolveReference } from './utils'
import { substitute } from './substitute'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

const proto: schema.Schema = JSON.parse(readFileSync('./node_modules/devtools-protocol/json/js_protocol.json', 'utf8'));

const toTypeString = (type: schema.Field | schema.ObjectReference, domain?: string) => {
  return isObjectReference(type) ? resolveReference(type.$ref, domain) :
    type.type === 'any'          ? 'any' :
    type.type === 'integer'      ? 'number' :
    type.type === 'number'       ? 'number' :
    type.type === 'boolean'      ? 'boolean' :
    type.type === 'string'       ? 'string' :
    type.type === 'array'        ? `${toTypeString(type.items, domain)}[]` :
    type.type === 'object'       ? 'object'
                                 : 'never'
}

const propertyListToTypeString = (fields: Array<schema.Parameter> | null, domain: string): Array<string> => {
  return fields ? [
    ...fields
      .map(prop => [
        ...createDocs(prop),
        `${prop.name}${prop.optional ? '?' : ''}: ${toTypeString(prop, domain)};`
      ])
      .reduce(flattenArgs(), []),
  ] : []
}

const returnListToCallbackString = (commandName: string, returns: Array<schema.Parameter>, domain: string) => {
  return returns && returns.length > 0 ?
    `(err: Error | null, params?: ${domain}.${cap(commandName)}ReturnType) => void` :
    `(err?: Error) => void`
}

const commandToPostFunctionsStrings = (command: schema.Command, domain: string): Array<string> => {
  const fnName = 'post'
  return [
    ...createDocs(command),
    ...(command.parameters && command.parameters.length > 0 ? [
      `${fnName}(method: "${domain}.${command.name}", params?: ${domain}.${cap(command.name)}ParameterType, callback?: ${returnListToCallbackString(command.name, command.returns, domain)}): void;`,
    ] : []),
    `${fnName}(method: "${domain}.${command.name}", callback?: ${returnListToCallbackString(command.name, command.returns, domain)}): void;`,
  ]
}

const toEventEmitterFunctionStrings = (events: Array<{ event: string, args: Array<string> }>) => {
  const createEmitStatement = event => `emit(event: "${event.event}"${event.args.length>0?', ':''}${event.args.join(', ')}): boolean;`
  const createEmitBlock = events => `emit(event: string | symbol, ...args: any[]): boolean;\n${events.map(createEmitStatement).join('\n')}`
  const createListenerFn = fnName => event => `${fnName}(event: "${event.event}", listener: (${event.args.join(', ')}) => void): this;`
  const createListenerBlockFn = fnName => events => `${fnName}(event: string, listener: (...args: any[]) => void): this;\n${events.map(createListenerFn(fnName)).join('\n')}`
  const createListeners = events => `${createListenerBlockFn('addListener')(events)}\n\n${createEmitBlock(events)}\n\n${['on','once','prependListener','prependOnceListener'].map(s=>createListenerBlockFn(s)(events)).join('\n\n')}`
  return createListeners(events).split('\n')
}

const interfaceDefinitions: Array<string> = proto.domains
  .map(item => {
    const typePool = (item.types || []).concat([
      ...(item.commands || []).map(command => command.parameters && command.parameters.length > 0 ? [{
        id: `${cap(command.name)}ParameterType`,
        type: 'object',
        properties: command.parameters
      } as schema.Type] : []).reduce(flattenArgs(), []),
      ...(item.commands || []).map(command => command.returns && command.returns.length > 0 ? [{
        id: `${cap(command.name)}ReturnType`,
        type: 'object',
        properties: command.returns
      } as schema.Type] : []).reduce(flattenArgs(), []),
      ...(item.events || []).map(event => event.parameters && event.parameters.length > 0 ? [{
        id: `${cap(event.name)}EventDataType`,
        type: 'object',
        properties: event.parameters
      } as schema.Type] : []).reduce(flattenArgs(), [])
    ])
    return typePool.length > 0 ? [
      `export namespace ${item.domain} {`,
      ...typePool
        .map(type => [...createDocs(type),
          ...(type.type === 'object' ? [
            `export interface ${type.id} {`,
            ...propertyListToTypeString(type.properties, item.domain)
              .map(line => `  ${line}`),
            '}'
          ] : [`export type ${type.id} = ${toTypeString(type)};`])
        ])
        .reduce(flattenArgs(''))
        .map(line => `  ${line}`),
      '}'
    ] : []
  }).reduce(flattenArgs(), [])

const postOverloads: Array<string> = proto.domains
  .map(item => item.commands
    .map(command => commandToPostFunctionsStrings(command, item.domain))
    .reduce(flattenArgs(''), []))
  .reduce(flattenArgs(), [])

const eventOverloads: Array<string> = toEventEmitterFunctionStrings(proto.domains
  .map(item => {
    if (!item.events || item.events.length === 0) {
      return []
    }
    return item.events
      .map(event => ({
        event: `${item.domain}.${event.name}`,
        args: event.parameters && event.parameters.length > 0 ? [`message: { method: string, params: ${item.domain}.${cap(event.name)}EventDataType }`] : []
      }))
  })
  .reduce((acc, next) => acc.concat(next), [{
    event: 'inspectorNotification',
    args: ['message: InspectorNotificationMessage']
  }]))

const template = readFileSync('./template.d.ts', 'utf8')
const output = substitute(template, {
  interfaceDefinitions,
  postOverloads,
  eventOverloads
})

if (!existsSync('inspector')) {
  mkdirSync('inspector')
}
writeFileSync('inspector/index.d.ts', output, 'utf8')