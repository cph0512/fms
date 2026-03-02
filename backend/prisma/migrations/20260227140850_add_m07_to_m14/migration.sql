-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'CLOSED');

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "bank_account_name" VARCHAR(100),
ADD COLUMN     "bank_account_number" VARCHAR(50),
ADD COLUMN     "bank_branch" VARCHAR(100),
ADD COLUMN     "bank_name" VARCHAR(100);

-- CreateTable
CREATE TABLE "accounts" (
    "account_id" UUID NOT NULL,
    "account_code" VARCHAR(20) NOT NULL,
    "account_name" VARCHAR(200) NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "parent_account_id" UUID,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "level" INTEGER NOT NULL DEFAULT 1,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "entry_id" UUID NOT NULL,
    "entry_number" VARCHAR(30) NOT NULL,
    "entry_date" DATE NOT NULL,
    "description" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("entry_id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "line_id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "debit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "line_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "bank_account_id" UUID NOT NULL,
    "account_name" VARCHAR(200) NOT NULL,
    "bank_name" VARCHAR(100) NOT NULL,
    "branch_name" VARCHAR(100),
    "account_number" VARCHAR(50) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TWD',
    "opening_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("bank_account_id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "budget_id" UUID NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("budget_id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "line_id" UUID NOT NULL,
    "budget_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "month_01" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_02" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_03" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_04" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_05" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_06" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_07" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_08" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_09" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_10" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_11" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "month_12" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("line_id")
);

-- CreateIndex
CREATE INDEX "accounts_company_id_idx" ON "accounts"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_company_id_account_code_key" ON "accounts"("company_id", "account_code");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_status_idx" ON "journal_entries"("company_id", "status");

-- CreateIndex
CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries"("entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_company_id_entry_number_key" ON "journal_entries"("company_id", "entry_number");

-- CreateIndex
CREATE INDEX "journal_entry_lines_entry_id_idx" ON "journal_entry_lines"("entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_account_id_idx" ON "journal_entry_lines"("account_id");

-- CreateIndex
CREATE INDEX "bank_accounts_company_id_idx" ON "bank_accounts"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_company_id_account_number_key" ON "bank_accounts"("company_id", "account_number");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_company_id_fiscal_year_name_key" ON "budgets"("company_id", "fiscal_year", "name");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lines_budget_id_account_id_key" ON "budget_lines"("budget_id", "account_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("entry_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("budget_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
