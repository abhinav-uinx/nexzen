import { prisma } from './lib/database/nexus-db.js'

async function check() {
  console.log('Checking siteHighlight model...')
  try {
    const count = await prisma.siteHighlight.count()
    console.log('Success! Count:', count)
  } catch (err) {
    console.error('Error:', err.message)
    if (prisma.siteHighlight === undefined) {
      console.log('prisma.siteHighlight is UNDEFINED')
    }
    const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'))
    console.log('Available models:', keys.join(', '))
  }
}

check()
