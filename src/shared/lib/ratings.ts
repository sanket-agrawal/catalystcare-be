export const canRateSession = (endDateTime: Date): boolean =>  {
  const now = new Date();
  return now > endDateTime;
}
