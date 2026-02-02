/**
 * Default fetcher for SWR: GET request, parse JSON.
 * Use with useSWR(key, fetcher) for request deduplication and caching.
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    throw error;
  }
  return res.json() as Promise<T>;
}
