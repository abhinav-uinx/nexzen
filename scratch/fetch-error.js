async function fetchError() {
  try {
    const res = await fetch('http://localhost:3000/api/test-wishlist')
    const body = await res.json()
    console.log(JSON.stringify(body, null, 2))
  } catch (e) {
    console.error('Fetch failed:', e)
  }
}
fetchError()
