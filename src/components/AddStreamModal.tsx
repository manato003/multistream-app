import React, { useState, useRef } from 'react';
import { X, Link as LinkIcon, Plus, Trash2, CheckCircle, Loader } from 'lucide-react';
import type { Stream } from '../types';
import { t } from '../i18n';
import type { Locale } from '../i18n';
import { parseTwitchInput, parseYouTubeInput } from '../utils/parseInput';
import { resolveYouTubeChannel, resolveVideoToChannel } from '../utils/resolveChannelId';

interface AddStreamModalProps {
    onClose: () => void;
    onAdd: (stream: Stream) => void;
    locale: Locale;
    addedStreams: Stream[]; // already added streams to show in list
    onRemove: (id: string) => void;
}

function detectPlatformFromUrl(url: string) {
    const t = url.trim().toLowerCase();
    if (t.includes('twitch.tv')) return { type: 'twitch' as const, parsed: parseTwitchInput(url) };
    if (t.includes('youtube.com') || t.includes('youtu.be')) return { type: 'youtube' as const, parsed: parseYouTubeInput(url) };
    // @handle は YouTube チャンネルとして扱う（全角@も半角に変換）
    const trimmed = url.trim();
    if (trimmed.startsWith('@') || trimmed.startsWith('＠')) {
        const normalized = trimmed.replace(/^＠/, '@'); // 全角@を半角に変換
        return { type: 'youtube' as const, parsed: parseYouTubeInput(normalized) };
    }
    return null;
}

function normalizeHandle(h: string | undefined): string {
    if (!h) return '';
    return h.startsWith('@') ? h.slice(1) : h;
}

function buildStream(type: 'twitch' | 'youtube', parsed: ReturnType<typeof parseTwitchInput>): Stream {
    return {
        id: crypto.randomUUID(),
        type,
        title: `${type === 'youtube' ? 'YouTube' : 'Twitch'}: ${parsed.title}`,
        sourceId: parsed.sourceId,
        inputType: parsed.inputType,
    };
}

const AddStreamModal: React.FC<AddStreamModalProps> = ({ onClose, onAdd, locale, addedStreams, onRemove }) => {
    const [singleInput, setSingleInput] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [bulkResults, setBulkResults] = useState<{ ok: number; fail: number } | null>(null);
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);
    const singleInputRef = useRef<HTMLInputElement>(null);

    // ── Single add ────────────────────────────────────────────────────────
    const addSingle = async () => {
        const val = singleInput.trim();
        if (!val || resolving) return;
        setResolveError(null);

        const detected = detectPlatformFromUrl(val);
        const type = detected?.type ?? 'twitch';
        const parsed = detected?.parsed ?? parseTwitchInput(val);

        // ── YouTube channel handle (@xxx) ──────────────────────────────
        if (type === 'youtube' && parsed.inputType === 'channel') {
            const handle = parsed.sourceId; // without @
            if (addedStreams.some(s => s.type === 'youtube' && normalizeHandle(s.channelHandle) === handle)) {
                setResolveError(locale === 'ja' ? 'このチャンネルはすでに追加されています' : 'This channel is already added');
                return;
            }
            setResolving(true);
            try {
                const { videoId, isLive } = await resolveYouTubeChannel(handle);
                const stream = isLive
                    ? buildStream(type, { ...parsed, sourceId: videoId, inputType: 'video' })
                    : buildStream(type, { ...parsed, sourceId: handle, inputType: 'channel' });
                onAdd({ ...stream, isLive, channelHandle: handle });
                setSingleInput('');
                singleInputRef.current?.focus();
            } catch (err) {
                setResolveError(err instanceof Error ? err.message : 'チャンネルIDの取得に失敗しました');
            } finally {
                setResolving(false);
            }
            return;
        }

        // ── YouTube video URL ──────────────────────────────────────────
        if (type === 'youtube' && parsed.inputType === 'video') {
            if (addedStreams.some(s => s.type === 'youtube' && s.sourceId === parsed.sourceId)) {
                setResolveError(locale === 'ja' ? 'この動画はすでに追加されています' : 'This video is already added');
                return;
            }
            setResolving(true);
            try {
                const handle = await resolveVideoToChannel(parsed.sourceId);
                if (handle && addedStreams.some(s => s.type === 'youtube' && normalizeHandle(s.channelHandle) === handle)) {
                    setResolveError(locale === 'ja' ? 'このチャンネルはすでに追加されています' : 'This channel is already added');
                    return;
                }
                const title = handle ? `@${handle}` : parsed.sourceId;
                onAdd(buildStream(type, { ...parsed, title }));
                setSingleInput('');
                singleInputRef.current?.focus();
            } finally {
                setResolving(false);
            }
            return;
        }

        // ── Twitch / other ─────────────────────────────────────────────
        if (addedStreams.some(s => s.type === type && s.sourceId === parsed.sourceId)) {
            setResolveError(locale === 'ja' ? 'この配信はすでに追加されています' : 'This stream is already added');
            return;
        }
        onAdd(buildStream(type, parsed));
        setSingleInput('');
        singleInputRef.current?.focus();
    };

    // ── Bulk add ──────────────────────────────────────────────────────────
    const addBulk = () => {
        const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
        let ok = 0, fail = 0;
        lines.forEach(line => {
            const detected = detectPlatformFromUrl(line);
            if (detected) {
                onAdd(buildStream(detected.type, detected.parsed));
                ok++;
            } else {
                fail++;
            }
        });
        setBulkResults({ ok, fail });
        setBulkInput('');
        setTimeout(() => setBulkResults(null), 3000);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-stream-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{t(locale, 'modalTitle')}</h2>
                    <button className="icon-button" onClick={onClose}><X size={18} /></button>
                </div>

                {/* ── Single input ── */}
                <div className="form-group">
                    <label className="form-label">
                        <LinkIcon size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {locale === 'ja' ? 'URL または 配信者名 / ID' : 'URL or Streamer Name / ID'}
                    </label>
                    <div className="input-row">
                        <input
                            ref={singleInputRef}
                            type="text"
                            className="form-input"
                            placeholder={locale === 'ja' ? 'URL貼付け or 名前入力、Enterで追加' : 'Paste URL or enter name, Enter to add'}
                            value={singleInput}
                            onChange={e => { setSingleInput(e.target.value); setResolveError(null); }}
                            onKeyDown={e => e.key === 'Enter' && addSingle()}
                            autoFocus
                            disabled={resolving}
                        />
                        <button className="add-btn" onClick={addSingle} disabled={resolving}>
                            {resolving ? <Loader size={14} className="spin" /> : <Plus size={14} />}
                        </button>
                    </div>
                    {resolving && (
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                            {locale === 'ja' ? 'チャンネルIDを取得中...' : 'Resolving channel ID...'}
                        </p>
                    )}
                    {resolveError && (
                        <p style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '4px' }}>
                            {resolveError}
                        </p>
                    )}
                </div>

                <div className="form-divider"><span>{locale === 'ja' ? 'まとめて追加' : 'bulk add'}</span></div>

                {/* ── Bulk input ── */}
                <div className="form-group">
                    <label className="form-label">
                        {locale === 'ja' ? '複数URLを1行ずつ貼り付け' : 'Paste multiple URLs, one per line'}
                    </label>
                    <textarea
                        className="form-input"
                        style={{ minHeight: '72px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem' }}
                        placeholder={'https://www.twitch.tv/xxx\nhttps://www.youtube.com/watch?v=xxx\n...'}
                        value={bulkInput}
                        onChange={e => setBulkInput(e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <button
                            className="add-btn"
                            style={{ flex: 1, justifyContent: 'center', display: 'flex', gap: '5px' }}
                            onClick={addBulk}
                            disabled={!bulkInput.trim()}
                        >
                            <Plus size={13} />
                            {locale === 'ja' ? 'まとめて追加' : 'Add All'}
                        </button>
                        {bulkResults && (
                            <span style={{ fontSize: '0.72rem', color: bulkResults.fail > 0 ? '#f59e0b' : '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} />
                                {locale === 'ja'
                                    ? `${bulkResults.ok}件追加${bulkResults.fail > 0 ? `、${bulkResults.fail}件スキップ` : ''}`
                                    : `${bulkResults.ok} added${bulkResults.fail > 0 ? `, ${bulkResults.fail} skipped` : ''}`
                                }
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Added streams list ── */}
                {addedStreams.length > 0 && (
                    <>
                        <div className="form-divider">
                            <span>{locale === 'ja' ? `追加済み (${addedStreams.length})` : `Added (${addedStreams.length})`}</span>
                        </div>
                        <div className="added-streams-list">
                            {addedStreams.map(s => (
                                <div key={s.id} className="added-stream-item">
                                    <span className={`platform-dot ${s.type}`} style={{ flexShrink: 0 }} />
                                    <span className="added-stream-title">{s.title}</span>
                                    <button className="added-stream-remove" onClick={() => onRemove(s.id)} title={t(locale, 'closeStream')}>
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddStreamModal;
