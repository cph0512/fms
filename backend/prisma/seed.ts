import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { code: 'user.manage', name: 'Manage Users', module: 'users' },
  { code: 'company.manage', name: 'Manage Companies', module: 'companies' },
  { code: 'customer.read', name: 'View Customers', module: 'customers' },
  { code: 'customer.write', name: 'Create/Edit Customers', module: 'customers' },
  { code: 'ar.read', name: 'View Accounts Receivable', module: 'ar' },
  { code: 'ar.write', name: 'Create/Edit AR Entries', module: 'ar' },
  { code: 'vendor.read', name: 'View Vendors', module: 'vendors' },
  { code: 'vendor.write', name: 'Create/Edit Vendors', module: 'vendors' },
  { code: 'ap.read', name: 'View Accounts Payable', module: 'ap' },
  { code: 'ap.write', name: 'Create/Edit AP Entries', module: 'ap' },
];

const ROLES = [
  {
    name: 'System Admin',
    description: 'Full system access across all companies',
    permissions: '*', // all permissions
  },
  {
    name: 'Company Admin',
    description: 'Full access within assigned company',
    permissions: [
      'user.manage', 'company.manage',
      'customer.read', 'customer.write',
      'ar.read', 'ar.write',
      'vendor.read', 'vendor.write',
      'ap.read', 'ap.write',
    ],
  },
  {
    name: 'Accountant',
    description: 'Financial data access',
    permissions: [
      'customer.read', 'customer.write',
      'ar.read', 'ar.write',
      'vendor.read', 'vendor.write',
      'ap.read', 'ap.write',
    ],
  },
  {
    name: 'AR Clerk',
    description: 'Accounts receivable specialist',
    permissions: ['customer.read', 'customer.write', 'ar.read', 'ar.write'],
  },
  {
    name: 'AP Clerk',
    description: 'Accounts payable specialist',
    permissions: ['vendor.read', 'vendor.write', 'ap.read', 'ap.write'],
  },
  {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['customer.read', 'ar.read', 'vendor.read', 'ap.read'],
  },
];

async function main() {
  console.log('Seeding database...');

  // 1. Upsert permissions
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { permission_code: p.code },
      update: { permission_name: p.name, module: p.module },
      create: { permission_code: p.code, permission_name: p.name, module: p.module },
    });
  }
  console.log(`✓ ${PERMISSIONS.length} permissions seeded`);

  // 2. Upsert roles and assign permissions
  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { role_name: r.name },
      update: { description: r.description },
      create: { role_name: r.name, description: r.description, is_system: true },
    });

    // Get permission IDs
    let permissionIds: number[];
    if (r.permissions === '*') {
      const allPerms = await prisma.permission.findMany();
      permissionIds = allPerms.map((p) => p.permission_id);
    } else {
      const perms = await prisma.permission.findMany({
        where: { permission_code: { in: r.permissions } },
      });
      permissionIds = perms.map((p) => p.permission_id);
    }

    // Clear and recreate role-permission mappings
    await prisma.rolePermission.deleteMany({ where: { role_id: role.role_id } });
    await prisma.rolePermission.createMany({
      data: permissionIds.map((pid) => ({ role_id: role.role_id, permission_id: pid })),
    });

    console.log(`✓ Role "${r.name}" with ${permissionIds.length} permissions`);
  }

  // 3. Create default company
  const company = await prisma.company.upsert({
    where: { company_id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      company_id: '00000000-0000-0000-0000-000000000001',
      company_name: 'Default Company',
      short_name: 'DEFAULT',
      default_currency: 'TWD',
      tax_rate: 5,
      fiscal_year_start: 1,
    },
  });
  console.log(`✓ Default company created: ${company.company_name}`);

  // 4. Create admin user
  const hashedPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@fms.local',
      password_hash: hashedPassword,
      display_name: 'System Administrator',
    },
  });
  console.log(`✓ Admin user created: ${admin.username}`);

  // 5. Link admin to default company
  await prisma.userCompany.upsert({
    where: { user_id_company_id: { user_id: admin.user_id, company_id: company.company_id } },
    update: {},
    create: {
      user_id: admin.user_id,
      company_id: company.company_id,
      is_default: true,
    },
  });

  // 6. Assign System Admin role
  const sysAdminRole = await prisma.role.findUnique({ where: { role_name: 'System Admin' } });
  if (sysAdminRole) {
    await prisma.userCompanyRole.upsert({
      where: {
        user_id_role_id_company_id: {
          user_id: admin.user_id,
          role_id: sysAdminRole.role_id,
          company_id: company.company_id,
        },
      },
      update: {},
      create: {
        user_id: admin.user_id,
        role_id: sysAdminRole.role_id,
        company_id: company.company_id,
      },
    });
  }
  console.log('✓ Admin assigned System Admin role for default company');

  console.log('\n✅ Seed completed successfully!');
  console.log('Login: admin / Admin@1234');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
