import React, { useMemo } from 'react';
import { EyeOff, Eye, Plus, X, Clock, GripVertical } from 'lucide-react';
import type { Stream } from '../types';
import type { Locale } from '../i18n';
import type { HistoryEntry } from '../hooks/useStreamHistory';
import { useDragReorder } from '../hooks/useDragReorder';
import { useHoverPanel } from '../hooks/useHoverPanel';

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
    hideDelay?: number;
}

const StreamSidePanel: React.FC<StreamSidePanelProps> = ({
    streams, onToggleHidden, onRemove, onReorder, history, onAddFromHistory, onRemoveFromHistory, onReorderHistory, locale, swapped = false, hideDelay = 500,
}) => {
    const { visible, show, scheduleHide } = useHoverPanel({ hideDelay, idleTimeout: 5000 });

    const { draggingId, dragOverId, handleMouseDown: handleStreamMouseDown } =
        useDragReorder('streamId', onReorder);
    const { draggingId: draggingHistoryId, dragOverId: dragOverHistoryId, handleMouseDown: handleHistoryMouseDown } =
        useDragReorder('historyId', onReorderHistory);

    const activeSourceIds = useMemo(() => {
        const ids = new Set<string>();
        streams.forEach(s => {
            ids.add(`${s.type}:${s.sourceId}`);
            if (s.channelHandle) ids.add(`${s.type}:${s.channelHandle}`);
        });
        return ids;
    }, [streams]);
    const availableHistory = useMemo(
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
                    aria-label={label('ドラッグして並べ替え', 'Drag to reorder')}
                >
                    <GripVertical size={12} />
                </button>
                <span className={`platform-dot ${stream.type}`} style={{ flexShrink: 0 }} />
                <span className="side-panel-item-title" title={stream.title}>{stream.title}</span>
                <button
                    className="side-panel-toggle-btn"
                    onClick={() => onToggleHidden(stream.id)}
                    title={isHidden ? label('再表示', 'Show') : label('非表示', 'Hide')}
                    aria-label={isHidden ? label('再表示', 'Show') : label('非表示', 'Hide')}
                >
                    {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                {!isHidden && (
                    <button
                        className="side-panel-toggle-btn danger"
                        onClick={() => onRemove(stream.id)}
                        title={label('閉じる', 'Close')}
                        aria-label={label('閉じる', 'Close')}
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
                        {(() => {
                            const hiddenCount = streams.filter(s => s.hidden).length;
                            return label(
                                `${streams.length}件${hiddenCount > 0 ? `（うち${hiddenCount}非表示）` : ''}`,
                                `${streams.length} stream${streams.length !== 1 ? 's' : ''}${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}`,
                            );
                        })()}
                    </span>
                </div>

                <div className="side-panel-list">
                    {/* ── 追加済セクション ── */}
                    {streams.length > 0 && (
                        <div className="side-panel-section-label">{label('追加済', 'Active')}</div>
                    )}
                    {streams.map(stream => renderStreamItem(stream, !!stream.hidden))}

                    {streams.length === 0 && (
                        <div className="side-panel-empty">{label('配信なし', 'No streams')}</div>
                    )}

                    {/* ── 履歴セクション ── */}
                    {availableHistory.length > 0 && (
                        <div className="side-panel-section-label">
                            <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {label('履歴', 'History')}
                        </div>
                    )}
                    {availableHistory.map(entry => {
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
                                    aria-label={label('ドラッグして並べ替え', 'Drag to reorder')}
                                >
                                    <GripVertical size={12} />
                                </button>
                                <span className={`platform-dot ${entry.type}`} style={{ flexShrink: 0 }} />
                                <span className="side-panel-item-title" title={entry.title}>{entry.title}</span>
                                <button
                                    className="side-panel-toggle-btn"
                                    onClick={() => onAddFromHistory(entry)}
                                    title={label('追加', 'Add')}
                                    aria-label={label('追加', 'Add')}
                                >
                                    <Plus size={13} />
                                </button>
                                <button
                                    className="side-panel-toggle-btn danger"
                                    onClick={() => onRemoveFromHistory(entry.historyId)}
                                    title={label('履歴から削除', 'Remove from history')}
                                    aria-label={label('履歴から削除', 'Remove from history')}
                                >
                                    <X size={11} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default StreamSidePanel;
