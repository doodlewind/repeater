/* global test expect */
const { groupItem } = require('./utils')

test('can group string', () => {
  const items = ['a', 'b', 'c', 'c', 'd', 'e', 'e', 'd']
  expect(groupItem(items, (a, b) => a === b))
    .toEqual([['a'], ['b'], ['c', 'c'], ['d'], ['e', 'e'], ['d']])
})

test('work on empty items', () => {
  expect(groupItem([], (a, b) => a === b)).toEqual([])
})

test('can group by object type', () => {
  const items = [
    { type: 'a', value: 1 },
    { type: 'a', value: 2 },
    { type: 'a', value: 3 },
    { type: 'b', value: 4 },
    { type: 'b', value: 5 },
    { type: 'c', value: 6 },
    { type: 'c', value: 7 },
    { type: 'b', value: 8 }
  ]
  expect(groupItem(items, (a, b) => a.type === b.type))
    .toEqual([
      [
        { type: 'a', value: 1 },
        { type: 'a', value: 2 },
        { type: 'a', value: 3 }
      ],
      [
        { type: 'b', value: 4 },
        { type: 'b', value: 5 }
      ],
      [
        { type: 'c', value: 6 },
        { type: 'c', value: 7 }
      ],
      [
        { type: 'b', value: 8 }
      ]
    ])
})
