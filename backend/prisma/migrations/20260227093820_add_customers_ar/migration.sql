-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CHECK', 'CASH', 'CREDIT_CARD', 'OTHER');

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" UUID NOT NULL,
    "customer_code" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(50),
    "tax_id" VARCHAR(8),
    "contact_person" VARCHAR(100),
    "phone" VARCHAR(30),
    "fax" VARCHAR(30),
    "email" VARCHAR(255),
    "address" TEXT,
    "payment_terms" INTEGER NOT NULL DEFAULT 30,
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "ar_invoices" (
    "invoice_id" UUID NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TWD',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ar_invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "ar_payments" (
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference_no" VARCHAR(50),
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_company_id_customer_code_key" ON "customers"("company_id", "customer_code");

-- CreateIndex
CREATE INDEX "ar_invoices_company_id_status_idx" ON "ar_invoices"("company_id", "status");

-- CreateIndex
CREATE INDEX "ar_invoices_customer_id_idx" ON "ar_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "ar_invoices_due_date_idx" ON "ar_invoices"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "ar_invoices_company_id_invoice_number_key" ON "ar_invoices"("company_id", "invoice_number");

-- CreateIndex
CREATE INDEX "ar_payments_invoice_id_idx" ON "ar_payments"("invoice_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "ar_invoices"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;
