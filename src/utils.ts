import * as schema from './devtools-protocol-schema'

export const flattenArgs = (inBetween?) => {
  if (inBetween != null) {
    return (acc, next) => {
      if (acc.length > 0) {
        return acc.concat([inBetween], next)
      } else {
        return acc.concat(next)
      }
    }
  } else {
    return (acc, next) => acc.concat(next)
  }
}

export const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

export function isObjectReference(t): t is schema.ObjectReference {
  return '$ref' in t
}

export const createDocs = (documentable: schema.Documentable): Array<string> => {
  const hasDocs = !!documentable.description || documentable.deprecated || documentable.experimental
  return hasDocs ? [
    '/**',
    documentable.description && ` * ${documentable.description}`,
    documentable.deprecated && ' * @deprecated',
    documentable.experimental && ' * @experimental',
    ' */'
  ].filter(l => l != null) : []
}

export const resolveReference = (ref: string, domain?: string): string => {
  if (!domain || ref.indexOf('.') !== -1) {
    return ref
  } else {
    return `${domain}.${ref}`
  }
}
