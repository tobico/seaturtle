// Compares two values, equivalent to comparison operator (<=>)
export const compare = (a, b) => {
  if (a instanceof Array && b instanceof Array) return compareArrays(a, b)

  if (a > b) {
    return 1
  } else if (a < b) {
    return -1
  } else {
    return 0
  }
}

const compareArrays = (a, b) => {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const elA = a[i]
    const elB = b[i]
    if (elA > elB) return 1
    if (elA < elB) return -1
  }
  return b.length - a.length
}
