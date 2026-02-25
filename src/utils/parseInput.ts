/**
 * Parse user input and extract the correct source info for Twitch/YouTube
 */

export interface ParsedStreamInput {
    sourceId: string;
    title: string;
    inputType: 'channel' | 'video' | 'url';
}

/**
 * Parse Twitch input: URL, channel name, or video ID
 */
export function parseTwitchInput(input: string): ParsedStreamInput {
    const trimmed = input.trim();

    // Full Twitch URL: https://www.twitch.tv/channelname
    const channelUrlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/i);
    if (channelUrlMatch) {
        const channel = channelUrlMatch[1];
        return { sourceId: channel, title: channel, inputType: 'channel' };
    }

    // Twitch video URL: https://www.twitch.tv/videos/123456
    const videoUrlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/i);
    if (videoUrlMatch) {
        return { sourceId: videoUrlMatch[1], title: `VOD ${videoUrlMatch[1]}`, inputType: 'video' };
    }

    // Plain channel name (no slashes, no dots — just a username)
    if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        return { sourceId: trimmed, title: trimmed, inputType: 'channel' };
    }

    // Fallback: treat as channel name
    return { sourceId: trimmed, title: trimmed, inputType: 'channel' };
}

/**
 * Parse YouTube input: various URL formats, video ID, or channel name
 */
export function parseYouTubeInput(input: string): ParsedStreamInput {
    const trimmed = input.trim();

    // @handle format (without full URL)
    if (trimmed.startsWith('@')) {
        const handle = trimmed.slice(1); // Remove @ prefix
        return { sourceId: handle, title: trimmed, inputType: 'channel' };
    }

    // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) {
        return { sourceId: watchMatch[1], title: watchMatch[1], inputType: 'video' };
    }

    // YouTube short URL: https://youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) {
        return { sourceId: shortMatch[1], title: shortMatch[1], inputType: 'video' };
    }

    // YouTube live URL: https://www.youtube.com/live/VIDEO_ID
    const liveMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
    if (liveMatch) {
        return { sourceId: liveMatch[1], title: liveMatch[1], inputType: 'video' };
    }

    // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
    if (embedMatch) {
        return { sourceId: embedMatch[1], title: embedMatch[1], inputType: 'video' };
    }

    // YouTube channel URL: https://www.youtube.com/@channelname or /channel/ID
    const channelMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/i);
    if (channelMatch) {
        // For channel URLs, we use the channel handle as live embed
        // YouTube doesn't directly support channel embed, so use /live endpoint  
        return { sourceId: channelMatch[1], title: `@${channelMatch[1]}`, inputType: 'channel' };
    }

    // Plain 11-char video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return { sourceId: trimmed, title: trimmed, inputType: 'video' };
    }

    // Fallback: treat as video ID or search term
    return { sourceId: trimmed, title: trimmed, inputType: 'video' };
}
