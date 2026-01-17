export function rupeesToPaise(value: number | string): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Math.round(num * 100);
}

export function paiseToRupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function calculateCommission({
  amountPaise,
  commissionRate,
}: {
  amountPaise: number;
  commissionRate: {
    id: string;
    platformPercent: number;
    gatewayPercent: number;
  } | null;
}) {
  const platformPercent = Number(commissionRate?.platformPercent || 0);
  const gatewayPercent = Number(commissionRate?.gatewayPercent || 0);

  const platformFeePaise = Math.round(
    (amountPaise * platformPercent) / 100
  );

  const gatewayFeePaise = Math.round(
    (amountPaise * gatewayPercent) / 100
  );

  const payoutAmountPaise =
    amountPaise - platformFeePaise - gatewayFeePaise;

  return {
    commissionRateId: commissionRate?.id ?? null,
    platformPercent,
    gatewayPercent,
    platformFeePaise,
    gatewayFeePaise,
    payoutAmountPaise,
    feeBreakdown: {
      platformFeePaise,
      gatewayFeePaise,
      payoutAmountPaise,
    },
  };
}
