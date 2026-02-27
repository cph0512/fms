-- CreateTable
CREATE TABLE "vendors" (
    "vendor_id" UUID NOT NULL,
    "vendor_code" VARCHAR(20) NOT NULL,
    "vendor_name" VARCHAR(200) NOT NULL,
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

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "ap_bills" (
    "bill_id" UUID NOT NULL,
    "bill_number" VARCHAR(30) NOT NULL,
    "vendor_id" UUID NOT NULL,
    "bill_date" DATE NOT NULL,
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

    CONSTRAINT "ap_bills_pkey" PRIMARY KEY ("bill_id")
);

-- CreateTable
CREATE TABLE "ap_payments" (
    "payment_id" UUID NOT NULL,
    "bill_id" UUID NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference_no" VARCHAR(50),
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ap_payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE INDEX "vendors_company_id_idx" ON "vendors"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_company_id_vendor_code_key" ON "vendors"("company_id", "vendor_code");

-- CreateIndex
CREATE INDEX "ap_bills_company_id_status_idx" ON "ap_bills"("company_id", "status");

-- CreateIndex
CREATE INDEX "ap_bills_vendor_id_idx" ON "ap_bills"("vendor_id");

-- CreateIndex
CREATE INDEX "ap_bills_due_date_idx" ON "ap_bills"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "ap_bills_company_id_bill_number_key" ON "ap_bills"("company_id", "bill_number");

-- CreateIndex
CREATE INDEX "ap_payments_bill_id_idx" ON "ap_payments"("bill_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ap_bills" ADD CONSTRAINT "ap_bills_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ap_payments" ADD CONSTRAINT "ap_payments_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "ap_bills"("bill_id") ON DELETE CASCADE ON UPDATE CASCADE;
