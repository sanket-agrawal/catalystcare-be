-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'EXHAUSTED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('ALL', 'SPECIFIC_CLIENT', 'SPECIFIC_THERAPIST', 'SPECIFIC_CLIENT_THERAPIST', 'FIRST_TIME_USER', 'CATEGORY');

-- CreateEnum
CREATE TYPE "CouponApplicableFor" AS ENUM ('SINGLE', 'PROGRAM', 'ALL');

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(65,30) NOT NULL,
    "max_discount_paise" INTEGER,
    "min_order_paise" INTEGER,
    "scope" "CouponScope" NOT NULL DEFAULT 'ALL',
    "applicable_for" "CouponApplicableFor" NOT NULL DEFAULT 'ALL',
    "allowed_client_ids" TEXT[],
    "allowed_therapist_ids" TEXT[],
    "allowed_category_ids" TEXT[],
    "max_usage_total" INTEGER,
    "max_usage_per_user" INTEGER NOT NULL DEFAULT 1,
    "current_usage_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_till" TIMESTAMP(3),
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_admin_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_profile_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "discount_paise" INTEGER NOT NULL,
    "original_paise" INTEGER NOT NULL,
    "final_paise" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_status_valid_from_valid_till_idx" ON "coupons"("status", "valid_from", "valid_till");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_payment_id_key" ON "coupon_usages"("payment_id");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_user_id_idx" ON "coupon_usages"("coupon_id", "user_id");

-- CreateIndex
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages"("user_id");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
