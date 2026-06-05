const MS_PER_DAY = 86_400_000

function toUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function toISO(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(iso, days) {
  return toISO(toUTC(iso) + days * MS_PER_DAY)
}

export function diffDays(isoA, isoB) {
  return Math.round((toUTC(isoB) - toUTC(isoA)) / MS_PER_DAY)
}

export function weeksBetween(isoA, isoB) {
  return (toUTC(isoB) - toUTC(isoA)) / (7 * MS_PER_DAY)
}
