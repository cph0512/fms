-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PENDING', 'CONFIRMED', 'BILLED', 'VOID');

-- CreateTable
CREATE TABLE "delivery_routes" (
    "route_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "origin" VARCHAR(50) NOT NULL,
    "route_name" VARCHAR(200) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "standard_price" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "company_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("route_id")
);

-- CreateTable
CREATE TABLE "delivery_trips" (
    "trip_id" UUID NOT NULL,
    "trip_date" DATE NOT NULL,
    "route_id" UUID NOT NULL,
    "trips_count" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "driver_name" VARCHAR(100),
    "vehicle_no" VARCHAR(20),
    "notes" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'PENDING',
    "invoice_id" UUID,
    "company_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_trips_pkey" PRIMARY KEY ("trip_id")
);

-- CreateIndex
CREATE INDEX "delivery_routes_company_id_customer_id_idx" ON "delivery_routes"("company_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_routes_company_id_customer_id_route_name_content_t_key" ON "delivery_routes"("company_id", "customer_id", "route_name", "content_type");

-- CreateIndex
CREATE INDEX "delivery_trips_company_id_trip_date_idx" ON "delivery_trips"("company_id", "trip_date");

-- CreateIndex
CREATE INDEX "delivery_trips_company_id_status_idx" ON "delivery_trips"("company_id", "status");

-- CreateIndex
CREATE INDEX "delivery_trips_route_id_idx" ON "delivery_trips"("route_id");

-- CreateIndex
CREATE INDEX "delivery_trips_invoice_id_idx" ON "delivery_trips"("invoice_id");

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_trips" ADD CONSTRAINT "delivery_trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "delivery_routes"("route_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_trips" ADD CONSTRAINT "delivery_trips_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "ar_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_trips" ADD CONSTRAINT "delivery_trips_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;
