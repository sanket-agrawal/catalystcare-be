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


export function calculateProgramComissions({
  amountPaise,
  commissionRate,
}: {
  amountPaise: number;
  commissionRate: {
    id: string;
    platformPercent: number;
    gatewayPercent: number;
  } | null;
}){
  let platformPercent = 0;
  if(amountPaise <= 200000){
    //less than 2000 rupees
    platformPercent = 15;
  }else if(amountPaise > 200000 && amountPaise <= 500000){
    // between 2000 to 5000 rupees
    platformPercent = 10;
  }else if(amountPaise > 500000 && amountPaise <= 1000000){
    // between 5000 to 10000 rupees
    platformPercent = 7.5;
  }else if(amountPaise > 1000000){
    // greater than 10000 rupees 
    platformPercent = 5;
  }
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
