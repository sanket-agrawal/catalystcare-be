export function rupeesToPaise(value: number | string): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Math.round(num * 100);
}

export function paiseToRupees(paise: number): string {
  return (paise / 100).toFixed(2);
}
