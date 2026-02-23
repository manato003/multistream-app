/**
 * Resolve a YouTube channel handle (@xxx) to a video ID.
 *
 * Strategy:
 *   1. Fetch youtube.com/@handle/live via codetabs CORS proxy
 *   2. Extract video ID from <link rel="canonical"> (most reliable)
 *   3. Determine if it's a live stream via "isLiveNow":true
 *   4. If no live found, fall back to youtube.com/@handle (latest video)
 *
 * No API key or backend required.
 * Live video IDs are cached for 5 minutes; latest video IDs indefinitely.
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

async function fetchViaCodetabs(targetUrl: string): Promise<string> {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
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
 */
export async function resolveYouTubeChannel(handle: string): Promise<ResolveResult> {
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    const cacheKey = cleanHandle.toLowerCase();

    const cached = getCache(cacheKey);
    if (cached) return { videoId: cached.videoId, isLive: cached.isLive };

    // Step 1: try /live page first (redirects to current live stream if live)
    try {
        const liveUrl = `https://www.youtube.com/@${cleanHandle}/live`;
        const html = await fetchViaCodetabs(liveUrl);
        const videoId = extractVideoIdFromCanonical(html);
        if (videoId) {
            const isLive = checkIsLive(html);
            setCache(cacheKey, videoId, isLive);
            return { videoId, isLive };
        }
    } catch { /* fall through */ }

    // Step 2: fall back to channel top page
    try {
        const channelUrl = `https://www.youtube.com/@${cleanHandle}`;
        const html = await fetchViaCodetabs(channelUrl);
        const videoId = extractVideoIdFromCanonical(html);
        if (videoId) {
            const isLive = checkIsLive(html);
            setCache(cacheKey, videoId, isLive);
            return { videoId, isLive };
        }
    } catch { /* fall through */ }

    throw new Error(`@${cleanHandle} の動画を取得できませんでした。チャンネル名が正しいか確認してください。`);
}
