import React, { useState, useRef, useCallback } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import type { Stream } from '../types';
import type { Locale } from '../i18n';

interface StreamSidePanelProps {
    streams: Stream[];
    onToggleHidden: (id: string) => void;
    locale: Locale;
}

const StreamSidePanel: React.FC<StreamSidePanelProps> = ({ streams, onToggleHidden, locale }) => {
    const [visible, setVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setVisible(true);
    }, []);

    const scheduleHide = useCallback(() => {
        hideTimerRef.current = setTimeout(() => setVisible(false), 300);
    }, []);

    const visibleCount = streams.filter(s => !s.hidden).length;
    const hiddenCount = streams.filter(s => s.hidden).length;

    return (
        <>
            {/* 左端トリガー（細バー） */}
            <div
                className="side-panel-trigger"
                onMouseEnter={show}
                onMouseLeave={scheduleHide}
            />

            {/* サイドパネル本体 */}
            <div
                className={`side-panel ${visible ? 'visible' : ''}`}
                onMouseEnter={show}
                onMouseLeave={scheduleHide}
            >
                <div className="side-panel-header">
                    <span className="side-panel-title">
                        {locale === 'ja' ? '配信管理' : 'Streams'}
                    </span>
                    <span className="side-panel-count">
                        {locale === 'ja'
                            ? `表示 ${visibleCount} / 非表示 ${hiddenCount}`
                            : `${visibleCount} visible / ${hiddenCount} hidden`}
                    </span>
                </div>

                <div className="side-panel-list">
                    {streams.length === 0 && (
                        <div className="side-panel-empty">
                            {locale === 'ja' ? '配信なし' : 'No streams'}
                        </div>
                    )}
                    {streams.map(stream => (
                        <div
                            key={stream.id}
                            className={`side-panel-item ${stream.hidden ? 'is-hidden' : ''}`}
                        >
                            <span className={`platform-dot ${stream.type}`} style={{ flexShrink: 0 }} />
                            <span className="side-panel-item-title" title={stream.title}>
                                {stream.title}
                            </span>
                            <button
                                className="side-panel-toggle-btn"
                                onClick={() => onToggleHidden(stream.id)}
                                title={stream.hidden
                                    ? (locale === 'ja' ? '再表示' : 'Show')
                                    : (locale === 'ja' ? '非表示' : 'Hide')}
                            >
                                {stream.hidden
                                    ? <Eye size={13} />
                                    : <EyeOff size={13} />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default StreamSidePanel;
