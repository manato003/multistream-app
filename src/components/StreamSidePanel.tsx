import React, { useState, useRef, useCallback, useMemo } from 'react';
import { EyeOff, Eye, Plus, X, Clock, GripVertical } from 'lucide-react';
import type { Stream } from '../types';
import type { Locale } from '../i18n';
import type { HistoryEntry } from '../hooks/useStreamHistory';
import { useDragReorder } from '../hooks/useDragReorder';

interface StreamSidePanelProps {
    streams: Stream[];
    onToggleHidden: (id: string) => void;
    onRemove: (id: string) => void;
    onReorder: (fromId: string, toId: string) => void;
    history: HistoryEntry[];
    onAddFromHistory: (entry: HistoryEntry) => void;
    onRemoveFromHistory: (historyId: string) => void;
    onReorderHistory: (fromId: string, toId: string) => void;
    locale: Locale;
    swapped?: boolean;
}

const StreamSidePanel: React.FC<StreamSidePanelProps> = ({
    streams, onToggleHidden, onRemove, onReorder, history, onAddFromHistory, onRemoveFromHistory, onReorderHistory, locale, swapped = false,
}) => {
    const [visible, setVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { draggingId, dragOverId, handleMouseDown: handleStreamMouseDown } =
        useDragReorder('streamId', onReorder);
    const { draggingId: draggingHistoryId, dragOverId: dragOverHistoryId, handleMouseDown: handleHistoryMouseDown } =
        useDragReorder('historyId', onReorderHistory);

    const show = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setVisible(true);
    }, []);

    const scheduleHide = useCallback(() => {
        hideTimerRef.current = setTimeout(() => setVisible(false), 300);
    }, []);

    const visibleStreams = useMemo(() => streams.filter(s => !s.hidden), [streams]);
    const hiddenStreams = useMemo(() => streams.filter(s => s.hidden), [streams]);
    const activeSourceIds = useMemo(() => new Set(streams.map(s => `${s.type}:${s.sourceId}`)), [streams]);
    const filteredHistory = useMemo(
        () => history.filter(e => !activeSourceIds.has(`${e.type}:${e.sourceId}`)),
        [history, activeSourceIds],
    );

    const label = (ja: string, en: string) => locale === 'ja' ? ja : en;

    const renderStreamItem = (stream: Stream, isHidden: boolean) => {
        const isDragging = draggingId === stream.id;
        const isDragTarget = dragOverId === stream.id && draggingId !== stream.id;
        const cls = [
            'side-panel-item',
            isHidden ? 'is-hidden' : '',
            isDragging ? 'is-dragging-item' : '',
            isDragTarget ? 'is-drag-target' : '',
        ].filter(Boolean).join(' ');

        return (
            <div key={stream.id} className={cls} data-stream-id={stream.id}>
                <button
                    className="side-panel-drag-handle"
                    onMouseDown={(e) => handleStreamMouseDown(e, stream.id)}
                    title={label('ドラッグして並べ替え', 'Drag to reorder')}
                >
                    <GripVertical size={12} />
                </button>
                <span className={`platform-dot ${stream.type}`} style={{ flexShrink: 0 }} />
                <span className="side-panel-item-title" title={stream.title}>{stream.title}</span>
                <button
                    className="side-panel-toggle-btn"
                    onClick={() => onToggleHidden(stream.id)}
                    title={isHidden ? label('再表示', 'Show') : label('非表示', 'Hide')}
                >
                    {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                {!isHidden && (
                    <button
                        className="side-panel-toggle-btn danger"
                        onClick={() => onRemove(stream.id)}
                        title={label('閉じる', 'Close')}
                    >
                        <X size={11} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <>
            <div
                className={`side-panel-trigger${swapped ? ' right' : ''}`}
                onMouseEnter={show}
                onMouseLeave={scheduleHide}
            />
            <div
                className={`side-panel${visible ? ' visible' : ''}${swapped ? ' right' : ''}`}
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
                    {visibleStreams.map(stream => renderStreamItem(stream, false))}

                    {/* ── 非表示 ── */}
                    {hiddenStreams.length > 0 && (
                        <div className="side-panel-section-label">{label('非表示', 'Hidden')}</div>
                    )}
                    {hiddenStreams.map(stream => renderStreamItem(stream, true))}

                    {/* ── 履歴 ── */}
                    {filteredHistory.length > 0 && (
                        <div className="side-panel-section-label">
                            <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {label('履歴', 'History')}
                        </div>
                    )}
                    {filteredHistory.map(entry => {
                        const isHistDragging = draggingHistoryId === entry.historyId;
                        const isHistTarget = dragOverHistoryId === entry.historyId && draggingHistoryId !== entry.historyId;
                        const histCls = [
                            'side-panel-item is-history',
                            isHistDragging ? 'is-dragging-item' : '',
                            isHistTarget ? 'is-drag-target' : '',
                        ].filter(Boolean).join(' ');
                        return (
                            <div key={entry.historyId} className={histCls} data-history-id={entry.historyId}>
                                <button
                                    className="side-panel-drag-handle"
                                    onMouseDown={(e) => handleHistoryMouseDown(e, entry.historyId)}
                                    title={label('ドラッグして並べ替え', 'Drag to reorder')}
                                >
                                    <GripVertical size={12} />
                                </button>
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
                        );
                    })}

                    {streams.length === 0 && filteredHistory.length === 0 && (
                        <div className="side-panel-empty">{label('配信なし', 'No streams')}</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default StreamSidePanel;
