export function slugifySearchTerm(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function deslugifySearchTerm(slug) {
  return `${slug || ''}`
    .trim()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildSearchPath(value) {
  const slug = slugifySearchTerm(value)
  return slug ? '/search' : '/p'
}
