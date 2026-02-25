import React from 'react';

interface TwitchPlayerProps {
    channel?: string;
    video?: string;
    time?: number;
}

const TwitchPlayer: React.FC<TwitchPlayerProps> = React.memo(({ channel, video, time }) => {
    const parentParam = window.location.hostname;

    let src = '';
    if (video) {
        src = `https://player.twitch.tv/?video=v${video}&parent=${parentParam}&autoplay=true`;
        if (time !== undefined && time > 0) {
            src += `&time=${Math.floor(time)}s`;
        }
    } else if (channel) {
        src = `https://player.twitch.tv/?channel=${channel}&parent=${parentParam}&autoplay=true&muted=true`;
    }

    if (!src) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>No Twitch source</div>;
    }

    return (
        <iframe
            src={src}
            frameBorder="0"
            allowFullScreen
            scrolling="no"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
        ></iframe>
    );
});

export default TwitchPlayer;
