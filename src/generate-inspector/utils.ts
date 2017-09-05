// Utility functions

import { ObjectReference, Documentable } from './devtools-protocol-schema'

/**
 * Returns a function suitable for Array#reduce that flattens an array of
 * arrays.
 * @param inBetween A value to insert between groups of flattened values
 */
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

/**
 * Returns whether an array exists and has elements.
 * @param a The array to check.
 */
export const hasElements = a => a && a.length > 0

/**
 * Returns the capitalized form of a given string.
 * @param s The string to capitalize
 */
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Returns whether a given object is an ObjectReference.
 * @param t An object whose type should be checked
 */
export function isObjectReference(t): t is ObjectReference {
  return '$ref' in t
}

/**
 * Given a Documentable object, return a comment block generated from its
 * contents, or an empty array if the object doesn't contain any information
 * to populate a comment block.
 * @param documentable A Documentable object.
 */
export const createDocs = (documentable: Documentable): Array<string> => {
  const hasDocs = !!documentable.description ||
    documentable.deprecated ||
    documentable.experimental
  return hasDocs ? [
    '/**',
    documentable.description && ` * ${documentable.description}`,
    documentable.deprecated && ' * @deprecated',
    documentable.experimental && ' * @experimental',
    ' */'
  ].filter(l => l != null) : []
}

/**
 * Given a string, prepend a given domain string to it if applicable.
 * @param ref The name of a class within a domain to reference.
 * @param domain The domain string to prepend.
 */
export const resolveReference = (ref: string, domain?: string): string => {
  if (!domain || ref.indexOf('.') !== -1) {
    return ref
  } else {
    return `${domain}.${ref}`
  }
}

/**
 * Given a string, replace lines that match a known pattern (...// # propName)
 * with args[propName] if it exists.
 * @param str The input string.
 * @param args An object mapping strings to arrays of strings.
 */
export const substitute = (
  str: string,
  args: { [propName: string]: Array<string> }
): string => {
  return str.split('\n')
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
