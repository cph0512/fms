-- CreateTable
CREATE TABLE "form_submissions" (
    "submission_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "submitter_name" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "form_submission_rows" (
    "row_id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "row_date" VARCHAR(10) NOT NULL,
    "route_content" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "trips_count" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(15,2) NOT NULL,
    "row_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "form_submission_rows_pkey" PRIMARY KEY ("row_id")
);

-- CreateIndex
CREATE INDEX "form_submissions_company_id_status_idx" ON "form_submissions"("company_id", "status");

-- CreateIndex
CREATE INDEX "form_submissions_submitted_at_idx" ON "form_submissions"("submitted_at");

-- CreateIndex
CREATE INDEX "form_submission_rows_submission_id_idx" ON "form_submission_rows"("submission_id");

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submission_rows" ADD CONSTRAINT "form_submission_rows_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "form_submissions"("submission_id") ON DELETE CASCADE ON UPDATE CASCADE;
