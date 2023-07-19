import test from 'ava'
import stripPseudos from './'

test('strip-pseudos does what the name implies', t => {
  t.plan(4)

  t.is(stripPseudos('.cf:after'), '.cf')
  t.is(stripPseudos('li:first-child'), 'li')
  t.is(stripPseudos('li:first-child > .foo:after'), 'li > .foo')
  t.is(stripPseudos('li:first-child, .foo:after'), 'li, .foo')
})
