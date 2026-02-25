import React, { useState } from 'react';
import { X, ExternalLink, RefreshCw, GripVertical } from 'lucide-react';
import type { Stream } from '../types';
import TwitchPlayer from './TwitchPlayer';
import YouTubePlayer from './YouTubePlayer';
import { t } from '../i18n';
import type { Locale } from '../i18n';

interface StreamFrameProps {
    stream: Stream;
    onRemove: (id: string) => void;
    isArchiveMode: boolean;
    globalTime: number;
    locale: Locale;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    onDragHandleMouseDown: (e: React.MouseEvent, id: string) => void;
    isDragging: boolean;
    isDragTarget: boolean;
}

const StreamFrame: React.FC<StreamFrameProps> = React.memo(({
    stream, onRemove, isArchiveMode, globalTime, locale,
    isExpanded, onToggleExpand, onDragHandleMouseDown,
    isDragging, isDragTarget,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    // Reload key is managed internally — incrementing it remounts the player
    // without affecting siblings
    const [reloadKey, setReloadKey] = useState(0);

    const handlePopout = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        let url = '';
        if (stream.type === 'twitch') {
            url = stream.inputType === 'video'
                ? `https://www.twitch.tv/videos/${stream.sourceId}`
                : `https://www.twitch.tv/${stream.sourceId}`;
        } else {
            url = stream.inputType === 'channel'
                ? `https://www.youtube.com/@${stream.sourceId}`
                : `https://www.youtube.com/watch?v=${stream.sourceId}`;
        }
        window.open(url, '_blank', 'width=960,height=540');
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        onRemove(stream.id);
    };

    const handleReload = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        setReloadKey(k => k + 1);
    };

    const frameClass = [
        'stream-frame',
        isDragging ? 'is-dragging-frame' : '',
        isDragTarget ? 'is-drag-target' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={frameClass}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={() => onToggleExpand(stream.id)}
        >
            <div className={`stream-frame-header ${isHovered || isDragging ? 'visible' : ''}`}>
                <div className="stream-frame-title">
                    <div
                        className="drag-handle"
                        title="ドラッグして並べ替え"
                        onMouseDown={(e) => onDragHandleMouseDown(e, stream.id)}
                    >
                        <GripVertical size={14} />
                    </div>
                    <span className={`platform-dot ${stream.type}`}></span>
                    <span className="stream-title-text" title={stream.title}>{stream.title}</span>
                </div>
                <div className="stream-frame-actions">
                    <button className="stream-frame-action" onClick={handleReload} title={t(locale, 'reload')}>
                        <RefreshCw size={12} />
                    </button>
                    <button className="stream-frame-action" onClick={handlePopout} title={t(locale, 'popout')}>
                        <ExternalLink size={12} />
                    </button>
                    <button className="stream-frame-action close-btn" onClick={handleClose} title={t(locale, 'closeStream')}>
                        <X size={12} />
                    </button>
                </div>
            </div>

            <div className="stream-content">
                {stream.type === 'twitch' ? (
                    <TwitchPlayer
                        key={reloadKey}
                        channel={stream.inputType === 'channel' ? stream.sourceId : undefined}
                        video={stream.inputType === 'video' ? stream.sourceId : undefined}
                        time={isArchiveMode && stream.startTime !== undefined ? globalTime - stream.startTime : undefined}
                    />
                ) : (
                    <YouTubePlayer
                        key={reloadKey}
                        videoId={stream.sourceId}
                        isChannel={stream.inputType === 'channel'}
                        time={isArchiveMode && stream.startTime !== undefined ? globalTime - stream.startTime : undefined}
                    />
                )}
            </div>

            {isDragTarget && <div className="drag-target-overlay" />}
        </div>
    );
};

});

export default StreamFrame;
