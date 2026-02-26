import React, { useState, useRef, useCallback } from 'react';
import { EyeOff, Eye, Plus, X, Clock, GripVertical } from 'lucide-react';
import type { Stream } from '../types';
import type { Locale } from '../i18n';
import type { HistoryEntry } from '../hooks/useStreamHistory';

interface StreamSidePanelProps {
    streams: Stream[];
    onToggleHidden: (id: string) => void;
    onReorder: (fromId: string, toId: string) => void;
    history: HistoryEntry[];
    onAddFromHistory: (entry: HistoryEntry) => void;
    onRemoveFromHistory: (historyId: string) => void;
    locale: Locale;
}

const StreamSidePanel: React.FC<StreamSidePanelProps> = ({
    streams, onToggleHidden, onReorder, history, onAddFromHistory, onRemoveFromHistory, locale,
}) => {
    const [visible, setVisible] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const draggingIdRef = useRef<string | null>(null);
    const dragOverIdRef = useRef<string | null>(null);

    const show = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setVisible(true);
    }, []);

    const scheduleHide = useCallback(() => {
        hideTimerRef.current = setTimeout(() => setVisible(false), 300);
    }, []);

    const handleDragHandleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        let isDragActive = false;

        const onMouseMove = (me: MouseEvent) => {
            if (!isDragActive) {
                const d = Math.hypot(me.clientX - startX, me.clientY - startY);
                if (d < 5) return;
                isDragActive = true;
                draggingIdRef.current = id;
                setDraggingId(id);
            }

            const el = document.elementFromPoint(me.clientX, me.clientY);
            let target: Element | null = el;
            let targetId: string | null = null;
            while (target) {
                const sid = (target as HTMLElement).dataset?.streamId;
                if (sid) { targetId = sid; break; }
                target = target.parentElement;
            }

            if (targetId !== dragOverIdRef.current) {
                dragOverIdRef.current = targetId;
                setDragOverId(targetId);
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            const fromId = draggingIdRef.current;
            const toId = dragOverIdRef.current;

            if (fromId && toId && fromId !== toId) {
                onReorder(fromId, toId);
            }

            draggingIdRef.current = null;
            dragOverIdRef.current = null;
            setDraggingId(null);
            setDragOverId(null);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [onReorder]);

    const visibleStreams = streams.filter(s => !s.hidden);
    const hiddenStreams = streams.filter(s => s.hidden);

    // 現在グリッドにある配信（表示中・非表示問わず）を履歴から除外
    const activeSourceIds = new Set(streams.map(s => `${s.type}:${s.sourceId}`));
    const filteredHistory = history.filter(
        e => !activeSourceIds.has(`${e.type}:${e.sourceId}`)
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
                    onMouseDown={(e) => handleDragHandleMouseDown(e, stream.id)}
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
            </div>
        );
    };

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
