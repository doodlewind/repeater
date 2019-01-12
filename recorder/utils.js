const groupItem = (items, eq) => {
  if (items.length === 0) return []
  const groups = [[items[0]]]

  for (let i = 1; i < items.length; i++) {
    const lastGroup = groups[groups.length - 1]
    const lastItem = lastGroup[lastGroup.length - 1]
    if (eq(lastItem, items[i])) lastGroup.push(items[i])
    else groups.push([items[i]])
  }
  return groups
}

module.exports = {
  groupItem
}
