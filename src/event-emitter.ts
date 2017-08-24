import { flattenArgs } from './utils'

export interface Event {
  comment?: Array<string>,
  name: string,
  args: Array<{
    name: string,
    type: string
  }>
}

const createEmitStatement = (event: Event): Array<string> => {
  const argsStr = event.args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
  return [
    `emit(event: "${event.name}"${event.args.length>0?', ':''}${argsStr}): boolean;`
  ]
}

const createEmitBlock = (events: Array<Event>): Array<string> => {
  return [
    `emit(event: string | symbol, ...args: any[]): boolean;`,
    ...events.map(createEmitStatement).reduce(flattenArgs(), [])
  ]
}

const createListenerFn = (fnName: string) => (event: Event): Array<string> => {
  const argsStr = event.args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
  return [
    ...event.comment && event.comment.length > 0 ? [''] : [],
    ...event.comment || [],
    `${fnName}(event: "${event.name}", listener: (${argsStr}) => void): this;`,
    ...event.comment && event.comment.length > 0 ? [''] : []
  ]
}

const createListenerBlockFn = (fnName: string) => (events: Array<Event>): Array<string> => {
  return [
    `${fnName}(event: string, listener: (...args: any[]) => void): this;`,
    ...events.map(createListenerFn(fnName)).reduce(flattenArgs(), [])
  ]
}

export const createListeners = (events: Array<Event>): Array<string> => {
  return [
    ...createListenerBlockFn('addListener')(events),
    '',
    ...createEmitBlock(events),
    '',
    ...createListenerBlockFn('on')(events),
    '',
    ...createListenerBlockFn('once')(events),
    '',
    ...createListenerBlockFn('prependListener')(events),
    '',
    ...createListenerBlockFn('prependOnceListener')(events)
  ].reduce((acc, next, index, arr) => { // removes consecutive empty lines
    if ((index === arr.length - 1 || (acc.length > 0 && acc[acc.length - 1] === '')) && next === '') {
      return acc
    } else {
      acc.push(next)
      return acc
    }
  }, [])
}