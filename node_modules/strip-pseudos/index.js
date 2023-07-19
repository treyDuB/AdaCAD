'use strict'

var SelectorTokenizer = require('css-selector-tokenizer')

module.exports = function stripPseudos (selector) {
  if (typeof selector !== 'string') {
    throw new TypeError('strip-pseudos expected a string')
  }

  var parsed = SelectorTokenizer.parse(selector)

  parsed.nodes = parsed.nodes.map(function (selectorNode) {
    selectorNode.nodes = selectorNode.nodes.filter(function (token) {
      return !isPseudo(token)
    })

    return selectorNode
  })

  return SelectorTokenizer.stringify(parsed)
}

function isPseudo(token) {
  return token && (token.type === 'pseudo-element' || token.type === 'pseudo-class')
}
