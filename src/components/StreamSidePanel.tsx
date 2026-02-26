import React, { useState, useRef, useCallback } from 'react';
import { EyeOff, Eye, Plus, X, Clock } from 'lucide-react';
import type { Stream } from '../types';
import type { Locale } from '../i18n';
import type { HistoryEntry } from '../hooks/useStreamHistory';

interface StreamSidePanelProps {
    streams: Stream[];
    onToggleHidden: (id: string) => void;
    history: HistoryEntry[];
    onAddFromHistory: (entry: HistoryEntry) => void;
    onRemoveFromHistory: (historyId: string) => void;
    locale: Locale;
}

const StreamSidePanel: React.FC<StreamSidePanelProps> = ({
    streams, onToggleHidden, history, onAddFromHistory, onRemoveFromHistory, locale,
}) => {
    const [visible, setVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setVisible(true);
    }, []);

    const scheduleHide = useCallback(() => {
        hideTimerRef.current = setTimeout(() => setVisible(false), 300);
    }, []);

    const visibleStreams = streams.filter(s => !s.hidden);
    const hiddenStreams = streams.filter(s => s.hidden);

    // 現在グリッドにある配信（表示中・非表示問わず）を履歴から除外
    const activeSourceIds = new Set(streams.map(s => `${s.type}:${s.sourceId}`));
    const filteredHistory = history.filter(
        e => !activeSourceIds.has(`${e.type}:${e.sourceId}`)
    );

    const label = (ja: string, en: string) => locale === 'ja' ? ja : en;

    return (
        <>
            <div
                className="side-panel-trigger"
                onMouseEnter={show}
                onMouseLeave={scheduleHide}
            />
            <div
                className={`side-panel ${visible ? 'visible' : ''}`}
                onMouseEnter={show}
                onMouseLeave={scheduleHide}
            >
                <div className="side-panel-header">
                    <span className="side-panel-title">{label('配信管理', 'Streams')}</span>
                    <span className="side-panel-count">
                        {label(`表示 ${visibleStreams.length} / 非表示 ${hiddenStreams.length}`,
                               `${visibleStreams.length} visible / ${hiddenStreams.length} hidden`)}
                    </span>
                </div>

                <div className="side-panel-list">
                    {/* ── 表示中 ── */}
                    {visibleStreams.length > 0 && (
                        <div className="side-panel-section-label">{label('表示中', 'Visible')}</div>
                    )}
                    {visibleStreams.map(stream => (
                        <div key={stream.id} className="side-panel-item">
                            <span className={`platform-dot ${stream.type}`} style={{ flexShrink: 0 }} />
                            <span className="side-panel-item-title" title={stream.title}>{stream.title}</span>
                            <button
                                className="side-panel-toggle-btn"
                                onClick={() => onToggleHidden(stream.id)}
                                title={label('非表示', 'Hide')}
                            >
                                <EyeOff size={13} />
                            </button>
                        </div>
                    ))}

                    {/* ── 非表示 ── */}
                    {hiddenStreams.length > 0 && (
                        <div className="side-panel-section-label">{label('非表示', 'Hidden')}</div>
                    )}
                    {hiddenStreams.map(stream => (
                        <div key={stream.id} className="side-panel-item is-hidden">
                            <span className={`platform-dot ${stream.type}`} style={{ flexShrink: 0 }} />
                            <span className="side-panel-item-title" title={stream.title}>{stream.title}</span>
                            <button
                                className="side-panel-toggle-btn"
                                onClick={() => onToggleHidden(stream.id)}
                                title={label('再表示', 'Show')}
                            >
                                <Eye size={13} />
                            </button>
                        </div>
                    ))}

                    {/* ── 履歴 ── */}
                    {filteredHistory.length > 0 && (
                        <div className="side-panel-section-label">
                            <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {label('履歴', 'History')}
                        </div>
                    )}
                    {filteredHistory.map(entry => (
                        <div key={entry.historyId} className="side-panel-item is-history">
                            <span className={`platform-dot ${entry.type}`} style={{ flexShrink: 0 }} />
                            <span className="side-panel-item-title" title={entry.title}>{entry.title}</span>
                            <button
                                className="side-panel-toggle-btn"
                                onClick={() => onAddFromHistory(entry)}
                                title={label('追加', 'Add')}
                            >
                                <Plus size={13} />
                            </button>
                            <button
                                className="side-panel-toggle-btn danger"
                                onClick={() => onRemoveFromHistory(entry.historyId)}
                                title={label('履歴から削除', 'Remove from history')}
                            >
                                <X size={11} />
                            </button>
                        </div>
                    ))}

                    {streams.length === 0 && filteredHistory.length === 0 && (
                        <div className="side-panel-empty">{label('配信なし', 'No streams')}</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default StreamSidePanel;
