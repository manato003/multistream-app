/**
 * Resolve a YouTube channel handle (@xxx) to a video ID.
 *
 * Strategy:
 *   1. Fetch youtube.com/@handle/live via CORS proxy
 *   2. Extract video ID from <link rel="canonical">
 *   3. Accept ONLY if "isLiveNow":true is present (rejects scheduled streams)
 *   4. Not live → return isLive: false (show offline screen, no fallback to videos)
 *
 * No API key or backend required.
 * Live video IDs are cached for 5 minutes.
 */

const CACHE_PREFIX = 'yt_resolved_';
const LIVE_TTL_MS = 5 * 60 * 1000;      // ライブID: 5分
const OFFLINE_TTL_MS = 2 * 60 * 1000;   // オフライン判定: 2分（頻繁に再チェックしない）

interface CacheEntry {
    videoId: string;
    isLive: boolean;
    ts: number;
}

function getCache(key: string): CacheEntry | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry: CacheEntry = JSON.parse(raw);
        const ttl = entry.isLive ? LIVE_TTL_MS : OFFLINE_TTL_MS;
        if (Date.now() - entry.ts > ttl) return null;
        return entry;
    } catch { return null; }
}

function setCache(key: string, videoId: string, isLive: boolean): void {
    try {
        const entry: CacheEntry = { videoId, isLive, ts: Date.now() };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch { /* ignore */ }
}

const PROXIES = [
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

async function fetchViaProxy(targetUrl: string): Promise<string> {
    let lastError: Error | null = null;
    
    for (const proxyFn of PROXIES) {
        try {
            const proxyUrl = proxyFn(targetUrl);
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            if (text.length < 100) throw new Error('Response too short (likely empty)');
            return text;
        } catch (err) {
            lastError = err as Error;
            console.warn(`[fetchViaProxy] Proxy failed for ${targetUrl}:`, err);
        }
    }
    
    throw lastError || new Error('All proxies failed');
}

function extractVideoIdFromCanonical(html: string): string | null {
    // <link rel="canonical" href="https://www.youtube.com/watch?v=VIDEO_ID">
    const m = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    return m ? m[1] : null;
}

function checkIsLive(html: string): boolean {
    return /"isLiveNow"\s*:\s*true/.test(html);
}

export interface ResolveResult {
    videoId: string;
    /** true = currently live, false = latest video */
    isLive: boolean;
}

/**
 * Resolve a YouTube channel handle to a video ID (live or latest).
 * @param handle - e.g. "@Popo_Ieiri" or "Popo_Ieiri"
 * @param forceRefresh - キャッシュを無視して再取得する
 */
export async function resolveYouTubeChannel(handle: string, forceRefresh = false): Promise<ResolveResult> {
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    const cacheKey = cleanHandle.toLowerCase();

    if (!forceRefresh) {
        const cached = getCache(cacheKey);
        if (cached) return { videoId: cached.videoId, isLive: cached.isLive };
    }

    // Step 1: try /live page — accept ONLY if isLiveNow:true (rejects scheduled streams)
    try {
        const liveUrl = `https://www.youtube.com/@${cleanHandle}/live`;
        const html = await fetchViaProxy(liveUrl);
        const videoId = extractVideoIdFromCanonical(html);
        const isLive = checkIsLive(html);
        if (videoId && isLive) {
            setCache(cacheKey, videoId, true);
            console.log(`[resolveYouTubeChannel] ✓ Live: ${videoId}`);
            return { videoId, isLive: true };
        }
        // ライブ中でない（予定配信 or オフライン）
        console.log(`[resolveYouTubeChannel] Not live (isLiveNow=false or no canonical)`);
        setCache(cacheKey, '', false);
        return { videoId: '', isLive: false };
    } catch (err) {
        console.warn(`[resolveYouTubeChannel] /live fetch failed:`, err);
    }

    // プロキシ失敗時もオフライン扱い
    setCache(cacheKey, '', false);
    return { videoId: '', isLive: false };
}
