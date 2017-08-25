import { flattenArgs } from './utils'

export const substitute = (file: string, args: { [propName: string]: Array<string> }) => {
  return file.split('\n')
    .map(line => {
      const regex = /(\s*)\/\/ # (.*)/
      const matches = line.match(regex)
      if (matches) {
        const [_0, prefix, argName] = matches
        if (args[argName]) {
          return args[argName].map(l => prefix + l)
        } else {
          return []
        }
      }
      return [line]
    })
    .reduce(flattenArgs(), [])
    .join('\n')
}