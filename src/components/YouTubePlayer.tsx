import React from 'react';

interface YouTubePlayerProps {
    videoId: string;
    isChannel?: boolean;
    time?: number;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, isChannel, time }) => {
    let src: string;

    if (isChannel) {
        // For channel handles, use the /live embed which redirects to the current livestream
        src = `https://www.youtube.com/embed/live_stream?channel=${videoId}&autoplay=1&mute=1`;
    } else {
        src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        if (time !== undefined && time > 0) {
            src += `&start=${Math.floor(time)}`;
        }
    }

    return (
        <iframe
            src={src}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            width="100%"
            height="100%"
            style={{ border: 'none' }}
        ></iframe>
    );
};

export default YouTubePlayer;
