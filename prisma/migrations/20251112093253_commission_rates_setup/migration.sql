-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "amount" DECIMAL(65,30),
ADD COLUMN     "amount_paise" INTEGER,
ADD COLUMN     "commission_percent" DECIMAL(65,30),
ADD COLUMN     "gateway_fee_paise" INTEGER,
ADD COLUMN     "gateway_percent" DECIMAL(65,30),
ADD COLUMN     "payout_amount_paise" INTEGER,
ADD COLUMN     "platform_fee_paise" INTEGER,
ADD COLUMN     "platform_percent" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "amount_paise" INTEGER,
ADD COLUMN     "commission_rate_id" TEXT,
ADD COLUMN     "fee_breakdown" JSONB,
ADD COLUMN     "gateway_fee_paise" INTEGER,
ADD COLUMN     "gateway_percent" DECIMAL(65,30),
ADD COLUMN     "payout_amount_paise" INTEGER,
ADD COLUMN     "platform_fee_paise" INTEGER,
ADD COLUMN     "platform_percent" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "commission_rates" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "platform_percent" DECIMAL(65,30) NOT NULL,
    "gateway_percent" DECIMAL(65,30) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" TEXT NOT NULL,

    CONSTRAINT "commission_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_rates_effective_from_idx" ON "commission_rates"("effective_from");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_commission_rate_id_fkey" FOREIGN KEY ("commission_rate_id") REFERENCES "commission_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rates" ADD CONSTRAINT "commission_rates_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
