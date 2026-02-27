import React, { useMemo, useState } from 'react';
import { EyeOff, Eye, Plus, X, Clock, GripVertical, ChevronRight, Star, FolderPlus } from 'lucide-react';
import type { Stream, FavoriteNode } from '../types';
import type { Locale } from '../i18n';
import type { HistoryEntry } from '../hooks/useStreamHistory';
import type { FavoriteActions } from '../hooks/useFavorites';
import { useDragReorder } from '../hooks/useDragReorder';
import { useHoverPanel } from '../hooks/useHoverPanel';
import { PlatformIcon } from './PlatformIcon';
import FavoritesTree from './FavoritesTree';

// ── セクション折りたたみ永続化 ──

interface SectionState { favorites: boolean; history: boolean }

const SECTION_KEY = 'panelSections';

function loadSections(): SectionState {
    try {
        const raw = localStorage.getItem(SECTION_KEY);
        return raw ? JSON.parse(raw) : { favorites: false, history: false };
    } catch {
        return { favorites: false, history: false };
    }
}

function saveSections(state: SectionState) {
    try { localStorage.setItem(SECTION_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ── Props ──

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
    // NEW
    onOpenAddModal: () => void;
    favorites: FavoriteNode[];
    favoriteChannelIds: Set<string>;
    onFavoriteAction: FavoriteActions;
    onAddFromFavorite: (ch: { type: 'youtube' | 'twitch'; title: string; sourceId: string; inputType: 'channel' | 'video' | 'url' }) => void;
    onAddToFavorites: (entry: HistoryEntry) => void;
}

const StreamSidePanel: React.FC<StreamSidePanelProps> = ({
    streams, onToggleHidden, onRemove, onReorder,
    history, onAddFromHistory, onRemoveFromHistory, onReorderHistory,
    locale, swapped = false, hideDelay = 500,
    onOpenAddModal, favorites, favoriteChannelIds, onFavoriteAction, onAddFromFavorite, onAddToFavorites,
}) => {
    const { visible, show, scheduleHide } = useHoverPanel({ hideDelay, idleTimeout: 5000 });

    // ── セクション折りたたみ ──
    const [sections, setSections] = useState<SectionState>(loadSections);

    const toggleSection = (key: keyof SectionState) => {
        setSections(prev => {
            const next = { ...prev, [key]: !prev[key] };
            saveSections(next);
            return next;
        });
    };

    // ── ドラッグ ──
    const { draggingId, dragOverId, handleMouseDown: handleStreamMouseDown } =
        useDragReorder('streamId', onReorder);
    const { draggingId: draggingHistoryId, dragOverId: dragOverHistoryId, handleMouseDown: handleHistoryMouseDown } =
        useDragReorder('historyId', onReorderHistory);

    // ── フィルタ ──
    const activeSourceIds = useMemo(() => {
        const ids = new Set<string>();
        streams.forEach(s => {
            ids.add(`${s.type}:${s.sourceId}`);
            if (s.channelHandle) ids.add(`${s.type}:${s.channelHandle}`);
        });
        return ids;
    }, [streams]);

    // 履歴: 追加済・お気に入り両方を除外
    const availableHistory = useMemo(
        () => history.filter(e => {
            const key = `${e.type}:${e.sourceId}`;
            return !activeSourceIds.has(key) && !favoriteChannelIds.has(key);
        }),
        [history, activeSourceIds, favoriteChannelIds],
    );

    // ── お気に入りチャンネル数 ──
    const favChannelCount = favoriteChannelIds.size;

    const label = (ja: string, en: string) => locale === 'ja' ? ja : en;
    const getDisplayName = (title: string) => title.replace(/^(YouTube|Twitch):\s*/, '');

    // ── ルートフォルダ作成のトリガー ──
    const [creatingRootFolder, setCreatingRootFolder] = useState(false);
    const [rootFolderName, setRootFolderName] = useState('');

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
                <PlatformIcon type={stream.type} size={14} />
                <span className="side-panel-item-title" title={stream.title}>
                    {getDisplayName(stream.title)}
                </span>
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
                {/* ── ヘッダー ── */}
                <div className="side-panel-header">
                    <div className="side-panel-header-row">
                        <span className="side-panel-title">{label('配信管理', 'Streams')}</span>
                        <button
                            className="side-panel-add-btn"
                            onClick={onOpenAddModal}
                            title={label('配信を追加', 'Add stream')}
                            aria-label={label('配信を追加', 'Add stream')}
                        >
                            <Plus size={13} />
                            <span>{label('追加', 'Add')}</span>
                        </button>
                    </div>
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
                    {/* ── 追加済セクション（常時展開） ── */}
                    {streams.length > 0 && (
                        <div className="side-panel-section-label">{label('追加済', 'Active')}</div>
                    )}
                    {streams.map(stream => renderStreamItem(stream, !!stream.hidden))}

                    {streams.length === 0 && (
                        <div className="side-panel-empty">{label('配信なし', 'No streams')}</div>
                    )}

                    {/* ── お気に入りセクション（折りたたみ可） ── */}
                    <div
                        className={`section-header${sections.favorites ? ' collapsed' : ''}`}
                        onClick={() => toggleSection('favorites')}
                    >
                        <ChevronRight size={12} className="section-chevron" />
                        <Star size={11} className="section-icon" />
                        <span className="section-header-text">
                            {label('お気に入り', 'Favorites')}
                            {favChannelCount > 0 && ` (${favChannelCount})`}
                        </span>
                        <button
                            className="section-header-action"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCreatingRootFolder(true);
                                // セクションを展開
                                if (sections.favorites) toggleSection('favorites');
                            }}
                            title={label('フォルダを追加', 'Add folder')}
                            aria-label={label('フォルダを追加', 'Add folder')}
                        >
                            <FolderPlus size={12} />
                        </button>
                    </div>
                    {!sections.favorites && (
                        <div className="section-content">
                            {creatingRootFolder && (
                                <div className="fav-new-folder-row" style={{ paddingLeft: '8px' }}>
                                    <FolderPlus size={13} className="fav-folder-icon" />
                                    <input
                                        className="fav-folder-name-input"
                                        value={rootFolderName}
                                        onChange={e => setRootFolderName(e.target.value)}
                                        onBlur={() => {
                                            const name = rootFolderName.trim();
                                            if (name) onFavoriteAction.createFolder(name, null);
                                            setCreatingRootFolder(false);
                                            setRootFolderName('');
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const name = rootFolderName.trim();
                                                if (name) onFavoriteAction.createFolder(name, null);
                                                setCreatingRootFolder(false);
                                                setRootFolderName('');
                                            }
                                            if (e.key === 'Escape') {
                                                setCreatingRootFolder(false);
                                                setRootFolderName('');
                                            }
                                        }}
                                        placeholder={label('フォルダ名', 'Folder name')}
                                        autoFocus
                                    />
                                </div>
                            )}
                            <FavoritesTree
                                nodes={favorites}
                                activeSourceIds={activeSourceIds}
                                actions={onFavoriteAction}
                                onAddFromFavorite={onAddFromFavorite}
                                locale={locale}
                            />
                            {favorites.length === 0 && !creatingRootFolder && (
                                <div className="side-panel-empty" style={{ fontSize: '0.68rem' }}>
                                    {label(
                                        '履歴の★からチャンネルを追加',
                                        'Add channels from history ★',
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 履歴セクション（折りたたみ可） ── */}
                    {(availableHistory.length > 0 || history.length > 0) && (
                        <div
                            className={`section-header${sections.history ? ' collapsed' : ''}`}
                            onClick={() => toggleSection('history')}
                        >
                            <ChevronRight size={12} className="section-chevron" />
                            <Clock size={11} className="section-icon" />
                            <span className="section-header-text">
                                {label('履歴', 'History')}
                                {availableHistory.length > 0 && ` (${availableHistory.length})`}
                            </span>
                        </div>
                    )}
                    {!sections.history && availableHistory.map(entry => {
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
                                <PlatformIcon type={entry.type} size={14} />
                                <span className="side-panel-item-title" title={entry.title}>
                                    {getDisplayName(entry.title)}
                                </span>
                                <button
                                    className="side-panel-toggle-btn"
                                    onClick={() => onAddToFavorites(entry)}
                                    title={label('お気に入りに追加', 'Add to favorites')}
                                    aria-label={label('お気に入りに追加', 'Add to favorites')}
                                >
                                    <Star size={12} />
                                </button>
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
