export const sortUsing = <T>(
  fn: (item: T) => number,
  type: 'asc' | 'desc' = 'asc',
) => {
  const factor = type === 'asc' ? 1 : -1;
  return (a: T, b: T) => (fn(a) - fn(b)) * factor;
};
