import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/errors/AppError.js';
import { parsePagination, paginationMeta } from '../../shared/utils/pagination.js';

export async function submitForm(data: {
  company_id: string;
  submitter_name: string;
  customer_name: string;
  notes?: string;
  rows: Array<{
    row_date: string;
    route_content: string;
    description?: string;
    trips_count: number;
    amount: number;
  }>;
}) {
  // Validate company exists
  const company = await prisma.company.findUnique({
    where: { company_id: data.company_id },
    select: { company_id: true, company_name: true },
  });
  if (!company) {
    throw new AppError(404, 'NOT_FOUND', 'Company not found');
  }

  const submission = await prisma.formSubmission.create({
    data: {
      company_id: data.company_id,
      submitter_name: data.submitter_name,
      customer_name: data.customer_name,
      notes: data.notes,
      rows: {
        create: data.rows.map((row, index) => ({
          row_date: row.row_date,
          route_content: row.route_content,
          description: row.description,
          trips_count: row.trips_count,
          amount: row.amount,
          row_order: index,
        })),
      },
    },
    include: { rows: true },
  });

  return submission;
}

export async function listSubmissions(
  companyId: string,
  query: { page?: string; limit?: string; status?: string }
) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: any = { company_id: companyId };
  if (query.status) where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      include: {
        rows: { orderBy: { row_order: 'asc' } },
      },
      orderBy: { submitted_at: 'desc' },
      skip,
      take,
    }),
    prisma.formSubmission.count({ where }),
  ]);

  return { data, meta: paginationMeta(total, page, limit) };
}

export async function getSubmissionById(id: string, companyId: string) {
  const submission = await prisma.formSubmission.findFirst({
    where: { submission_id: id, company_id: companyId },
    include: {
      rows: { orderBy: { row_order: 'asc' } },
    },
  });
  if (!submission) {
    throw new AppError(404, 'NOT_FOUND', 'Submission not found');
  }
  return submission;
}

export async function reviewSubmission(
  id: string,
  companyId: string,
  userId: string,
  status: string
) {
  const submission = await prisma.formSubmission.findFirst({
    where: { submission_id: id, company_id: companyId },
  });
  if (!submission) {
    throw new AppError(404, 'NOT_FOUND', 'Submission not found');
  }

  return prisma.formSubmission.update({
    where: { submission_id: id },
    data: {
      status,
      reviewed_by: userId,
      reviewed_at: new Date(),
    },
    include: { rows: true },
  });
}
