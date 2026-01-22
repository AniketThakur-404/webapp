const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const passwordHash = await bcrypt.hash('YourPassword123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'vendor@example.com',
        password: passwordHash,
        role: 'vendor',
        status: 'active',
        Vendor: {
          create: {
            businessName: 'Test Vendor',
            contactPhone: '9999999999',
            address: '123 Demo Lane',
          },
        },
      },
    });
    console.log('Vendor created:', user.id);
  } finally {
    await prisma.$disconnect();
  }
})();
