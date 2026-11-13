type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function fetchAllRows<T>(page: (from: number, to: number) => Page<T>) {
  const result: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(error.message);
    result.push(...(data ?? []));
    if (!data || data.length < size) return result;
  }
}

export async function fetchRowsForIds<T>(ids: string[], page: (ids: string[], from: number, to: number) => Page<T>) {
  const result: T[] = [];
  const batchSize = 100;
  for (let start = 0; start < ids.length; start += batchSize) {
    const batch = ids.slice(start, start + batchSize);
    result.push(...await fetchAllRows((from, to) => page(batch, from, to)));
  }
  return result;
}
