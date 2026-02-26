/**
 * Resolve a YouTube channel handle (@xxx) to a video ID.
 *
 * Strategy:
 *   1. Fetch youtube.com/@handle/live via CORS proxy
 *   2. Extract video ID from <link rel="canonical">
 *   3. Accept ONLY if "isLiveNow":true is present (rejects scheduled streams)
 *   4. If not currently live, fall back to youtube.com/@handle/videos (latest upload)
 *
 * No API key or backend required.
 * Live video IDs are cached for 5 minutes; non-live IDs indefinitely.
 */

const CACHE_PREFIX = 'yt_resolved_';
const LIVE_TTL_MS = 5 * 60 * 1000; // 5 min

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
        // Live IDs expire after 5 min; non-live cached indefinitely
        if (entry.isLive && Date.now() - entry.ts > LIVE_TTL_MS) return null;
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

function extractLatestVideoId(html: string): string | null {
    // Method 1: Look for videoId in ytInitialData
    const ytDataMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (ytDataMatch) {
        console.log(`[extractLatestVideoId] Found via ytInitialData: ${ytDataMatch[1]}`);
        return ytDataMatch[1];
    }
    
    // Method 2: Look for /watch?v= links
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
        console.log(`[extractLatestVideoId] Found via watch link: ${watchMatch[1]}`);
        return watchMatch[1];
    }
    
    return null;
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
            console.log(`[resolveYouTubeChannel] ✓ Found active live via /live: ${videoId}`);
            return { videoId, isLive: true };
        }
        if (videoId && !isLive) {
            console.log(`[resolveYouTubeChannel] /live returned a video but isLiveNow=false (scheduled?), skipping`);
        }
        if (!videoId) {
            console.warn(`[resolveYouTubeChannel] /live page loaded but no canonical URL found`);
        }
    } catch (err) {
        console.warn(`[resolveYouTubeChannel] /live fetch failed:`, err);
    }

    // Step 2: fall back to channel /videos page (latest uploads, not recommended videos)
    try {
        const videosUrl = `https://www.youtube.com/@${cleanHandle}/videos`;
        const html = await fetchViaProxy(videosUrl);
        
        // Extract first video ID from the videos page
        const videoId = extractLatestVideoId(html);
        
        if (videoId) {
            const isLive = false; // Videos page shows uploads, not live streams
            setCache(cacheKey, videoId, isLive);
            console.log(`[resolveYouTubeChannel] ✓ Found via /videos page: ${videoId}`);
            return { videoId, isLive };
        }
        console.warn(`[resolveYouTubeChannel] Videos page loaded but no video ID found`);
    } catch (err) {
        console.warn(`[resolveYouTubeChannel] Videos page fetch failed:`, err);
    }

    throw new Error(`@${cleanHandle} が見つかりませんでした。チャンネル名が正しいか確認してください（大文字小文字も区別されます）。`);
}
