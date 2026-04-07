import { getCache, setCache, getSetting, getCacheWithTTL, setCacheWithTTL } from './cache';
import { readFileByUrl, readFileContent, listTaskResults, checkWorkspaceExists } from './graph';
import { hostnameFromResultFile } from './utils';
import type { TaskFile, ResultFile } from './types';

// Re-export cache utilities so consumers can import from a single module
export { getCache, setCache, getSetting };

/**
 * Get task content with localStorage caching.
 * Checks cache first; on miss, fetches from Graph API and caches the result.
 * Task files are immutable, so cached content never expires.
 */
export async function getTaskContent(
  taskId: string,
  downloadUrl?: string,
  itemId?: string,
): Promise<TaskFile> {
  const cached = getCache<TaskFile>(`task_${taskId}`);
  if (cached) return cached;

  const task = downloadUrl
    ? await readFileByUrl<TaskFile>(downloadUrl)
    : await readFileContent<TaskFile>(itemId!);

  setCache(`task_${taskId}`, task);
  return task;
}

interface CachedResult {
  hostname: string;
  result: ResultFile;
}

interface TaskResultsResponse {
  results: CachedResult[];
  fromCache: boolean;
}

/**
 * Get task results with localStorage caching (stale-while-revalidate).
 * Returns cached results immediately if available, and fetches fresh
 * results in the background, merging any new entries into the cache.
 */
export async function getTaskResults(
  taskId: string,
): Promise<TaskResultsResponse> {
  const cached = getCache<CachedResult[]>(`results_${taskId}`);
  if (cached) {
    // Stale-while-revalidate: return cached data now, refresh in background
    refreshTaskResults(taskId, cached).catch(() => {
      /* background refresh failure is non-fatal */
    });
    return { results: cached, fromCache: true };
  }

  // No cache — fetch synchronously
  const results = await fetchTaskResults(taskId);
  setCache(`results_${taskId}`, results);
  return { results, fromCache: false };
}

async function fetchTaskResults(taskId: string): Promise<CachedResult[]> {
  const resultItems = await listTaskResults(taskId);
  const results: CachedResult[] = [];

  for (const item of resultItems) {
    const hostname = hostnameFromResultFile(item.name);
    if (hostname) {
      try {
        const downloadUrl = item['@microsoft.graph.downloadUrl'];
        const result = downloadUrl
          ? await readFileByUrl<ResultFile>(downloadUrl)
          : await readFileContent<ResultFile>(item.id);
        results.push({ hostname, result });
      } catch {
        // skip unreadable result files
      }
    }
  }

  return results;
}

async function refreshTaskResults(
  taskId: string,
  cached: CachedResult[],
): Promise<void> {
  const fresh = await fetchTaskResults(taskId);
  // Merge: keep all cached entries, add any new hostnames from fresh
  const cachedHostnames = new Set(cached.map((r) => r.hostname));
  const newEntries = fresh.filter((r) => !cachedHostnames.has(r.hostname));
  if (newEntries.length > 0) {
    const merged = [...cached, ...newEntries];
    setCache(`results_${taskId}`, merged);
  }
}

const WORKSPACE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check workspace existence with TTL caching.
 * Returns cached result if within TTL, otherwise fetches fresh.
 */
export async function getCachedWorkspaceExists(): Promise<boolean> {
  const cached = getCacheWithTTL<boolean>('workspace_exists');
  if (cached !== null) return cached;

  const exists = await checkWorkspaceExists();
  setCacheWithTTL('workspace_exists', exists, WORKSPACE_TTL);
  return exists;
}
