export interface Stream {
    id: string;
    type: 'youtube' | 'twitch';
    title: string;
    sourceId: string;
    inputType: 'channel' | 'video' | 'url';
    startTime?: number;
    hidden?: boolean;
    isLive?: boolean;         // YouTubeチャンネル枠のみ使用。falseならオフライン表示
    channelHandle?: string;   // YouTubeチャンネルの元のハンドル名（再取得に使用）
}
