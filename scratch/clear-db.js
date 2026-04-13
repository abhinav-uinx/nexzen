const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('--- STARTING DATABASE CLEANUP ---');
  try {
    // 1. Delete Order Items (Child of Order)
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${orderItems.count} Order Items.`);

    // 2. Delete Orders
    const orders = await prisma.order.deleteMany({});
    console.log(`Deleted ${orders.count} Orders.`);

    // 3. Delete Cart Items (Child of Cart/User)
    // Note: Some schemas might have CartItem directly under User, 
    // but usually it's under Cart or related directly to products.
    const cartItems = await prisma.cartItem.deleteMany({});
    console.log(`Deleted ${cartItems.count} Cart Items.`);

    // 4. Delete Carts (if they exist as a separate table)
    // Checking schema... assuming CartItem is the main one based on previous context
    try {
        const carts = await prisma.cart?.deleteMany({});
        if (carts) console.log(`Deleted ${carts.count} Carts.`);
    } catch (e) {
        // Table might not exist in this specific schema version
    }

    console.log('--- CLEANUP COMPLETE ---');
  } catch (error) {
    console.error('ERROR during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
