import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/database/generated/client/index.js'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding dynamic site data...')

  // Highlights
  const highlights = [
    {
      label: 'Fast dispatch',
      value: '24 hrs',
      detail: 'Core catalog ships quickly from stocked inventory.',
      order: 0
    },
    {
      label: 'Inventory',
      value: '2.4k+',
      detail: 'Curated SKUs for hardware development and labs.',
      order: 1
    },
    {
      label: 'Support',
      value: 'Expert',
      detail: 'Technical guidance from hardware engineers.',
      order: 2
    }
  ]

  for (const h of highlights) {
    await prisma.siteHighlight.upsert({
      where: { id: `seed-${h.label.toLowerCase().replace(/\s/g, '-')}` },
      update: h,
      create: { 
        id: `seed-${h.label.toLowerCase().replace(/\s/g, '-')}`,
        ...h 
      }
    })
  }

  // Collections
  const collections = [
    {
      name: 'Creator Boards',
      slug: 'development-boards',
      description: 'Performance-first microcontrollers and SBCs.',
      order: 0,
      isActive: true
    },
    {
      name: 'Vision & AI',
      slug: 'vision-sensors',
      description: 'Advanced perception modules for autonomous systems.',
      order: 1,
      isActive: true
    },
    {
      name: 'Precision Motion',
      slug: 'motion-control',
      description: 'High-torque servos and precision motor drivers.',
      order: 2,
      isActive: true
    }
  ]

  for (const c of collections) {
    await prisma.collection.upsert({
      where: { id: `seed-${c.slug}` },
      update: c,
      create: { 
        id: `seed-${c.slug}`,
        ...c 
      }
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
