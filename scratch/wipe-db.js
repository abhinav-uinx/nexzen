const { Client } = require('pg');
require('dotenv').config();

async function performCleanup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to Supabase. Executing Wipe...');

    // CASCADE handles the foreign key order automatically
    await client.query('TRUNCATE TABLE "OrderItem", "Order", "CartItem", "Cart" RESTART IDENTITY CASCADE;');
    
    console.log('--- REPOSITORY WIPED SUCCESSFULLY ---');
    console.log('Cleared: OrderItems, Orders, CartItems, Carts');
  } catch (err) {
    console.error('FAILURE:', err.message);
  } finally {
    await client.end();
  }
}

performCleanup();
