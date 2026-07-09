export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("sr-RS");
};

export const getNextPeriodLabel = (endDateStr: string) => {
  const end = new Date(endDateStr);
  const nextStart = new Date(end);
  nextStart.setDate(nextStart.getDate() + 1);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 29);
  return `${formatDate(nextStart.toISOString())} — ${formatDate(nextEnd.toISOString())}`;
};