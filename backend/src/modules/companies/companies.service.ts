import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { signAccessToken } from '../auth/token.service.js';

export async function listCompanies(userId: string) {
  const userCompanies = await prisma.userCompany.findMany({
    where: { user_id: userId },
    include: { company: true },
    orderBy: { company: { company_name: 'asc' } },
  });

  return userCompanies.map((uc) => ({
    ...uc.company,
    is_default: uc.is_default,
  }));
}

export async function getCompanyById(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { company_id: companyId },
  });

  if (!company) {
    throw new AppError(404, 'NOT_FOUND', 'Company not found');
  }

  return company;
}

export async function createCompany(
  data: {
    company_name: string;
    short_name?: string;
    tax_id?: string;
    representative?: string;
    phone?: string;
    fax?: string;
    address?: string;
    email?: string;
    default_currency?: string;
    tax_rate?: number;
    fiscal_year_start?: number;
  },
  creatorUserId: string
) {
  const company = await prisma.company.create({
    data: {
      company_name: data.company_name,
      short_name: data.short_name,
      tax_id: data.tax_id,
      representative: data.representative,
      phone: data.phone,
      fax: data.fax,
      address: data.address,
      email: data.email,
      default_currency: data.default_currency || 'TWD',
      tax_rate: data.tax_rate ?? 5,
      fiscal_year_start: data.fiscal_year_start ?? 1,
    },
  });

  // Add creator to the company
  await prisma.userCompany.create({
    data: {
      user_id: creatorUserId,
      company_id: company.company_id,
      is_default: false,
    },
  });

  // Give creator Company Admin role
  const companyAdminRole = await prisma.role.findUnique({
    where: { role_name: 'Company Admin' },
  });
  if (companyAdminRole) {
    await prisma.userCompanyRole.create({
      data: {
        user_id: creatorUserId,
        role_id: companyAdminRole.role_id,
        company_id: company.company_id,
      },
    });
  }

  return company;
}

export async function updateCompany(
  companyId: string,
  data: Record<string, unknown>
) {
  const company = await prisma.company.update({
    where: { company_id: companyId },
    data,
  });

  return company;
}

export async function switchCompany(userId: string, targetCompanyId: string, username: string) {
  // Verify user has access to target company
  const membership = await prisma.userCompany.findUnique({
    where: { user_id_company_id: { user_id: userId, company_id: targetCompanyId } },
  });

  if (!membership) {
    throw new AppError(403, 'NO_ACCESS', 'You do not have access to this company');
  }

  // Update default company
  await prisma.userCompany.updateMany({
    where: { user_id: userId },
    data: { is_default: false },
  });

  await prisma.userCompany.update({
    where: { user_id_company_id: { user_id: userId, company_id: targetCompanyId } },
    data: { is_default: true },
  });

  // Get user permissions for target company
  const roles = await prisma.userCompanyRole.findMany({
    where: { user_id: userId, company_id: targetCompanyId },
    include: {
      role: {
        include: {
          role_permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ucr of roles) {
    for (const rp of ucr.role.role_permissions) {
      permissions.add(rp.permission.permission_code);
    }
  }

  const company = await prisma.company.findUnique({
    where: { company_id: targetCompanyId },
  });

  const accessToken = signAccessToken({
    userId,
    companyId: targetCompanyId,
    username,
  });

  return {
    accessToken,
    company,
    permissions: Array.from(permissions),
  };
}
