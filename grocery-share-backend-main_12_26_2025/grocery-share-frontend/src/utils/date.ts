export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
