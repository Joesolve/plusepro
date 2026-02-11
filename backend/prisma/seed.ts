import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'dev-company' },
    update: {},
    create: {
      name: 'Dev Company',
      slug: 'dev-company',
      primaryColor: '#1E3A5F',
      secondaryColor: '#00B4A6',
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // Create subscription for the tenant
  const subscription = await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: 'GROWTH',
      status: 'ACTIVE',
      maxEmployees: 100,
    },
  });

  console.log('✅ Created subscription:', subscription.plan);

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dev.com' },
    update: {},
    create: {
      email: 'admin@dev.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'COMPANY_ADMIN',
      tenantId: tenant.id,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created admin user:', adminUser.email);
  console.log('\n📧 Admin Login Credentials:');
  console.log('   Email: admin@dev.com');
  console.log('   Password: admin123');
  console.log('   Role:', adminUser.role);
  console.log('   Tenant:', tenant.name);

  // Create a super admin (no tenant)
  const superAdminHash = await bcrypt.hash('superadmin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@dev.com' },
    update: {},
    create: {
      email: 'superadmin@dev.com',
      passwordHash: superAdminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantId: null,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log('\n✅ Created super admin:', superAdmin.email);
  console.log('   Email: superadmin@dev.com');
  console.log('   Password: superadmin123');
  console.log('   Role:', superAdmin.role);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
