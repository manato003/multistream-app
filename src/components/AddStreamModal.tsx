import React, { useState, useRef } from 'react';
import { X, Link as LinkIcon, Youtube, Plus, Trash2, CheckCircle } from 'lucide-react';
import type { Stream } from '../types';
import { t } from '../i18n';
import type { Locale } from '../i18n';
import { parseTwitchInput, parseYouTubeInput } from '../utils/parseInput';

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
    return null;
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

const TwitchIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0h1.714v5.143h-1.714zM5.143 0L1.714 3.429v17.143h5.143V24l3.428-3.429h2.572L22.286 11.143V0zm15.428 10.286l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
);

const AddStreamModal: React.FC<AddStreamModalProps> = ({ onClose, onAdd, locale, addedStreams, onRemove }) => {
    const [singleInput, setSingleInput] = useState('');
    const [singlePlatform, setSinglePlatform] = useState<'twitch' | 'youtube'>('twitch');
    const [bulkInput, setBulkInput] = useState('');
    const [bulkResults, setBulkResults] = useState<{ ok: number; fail: number } | null>(null);
    const singleInputRef = useRef<HTMLInputElement>(null);

    // ── Single add ────────────────────────────────────────────────────────
    const addSingle = () => {
        const val = singleInput.trim();
        if (!val) return;

        const detected = detectPlatformFromUrl(val);
        if (detected) {
            onAdd(buildStream(detected.type, detected.parsed));
        } else {
            // No URL detected → use selected platform
            const parsed = singlePlatform === 'twitch' ? parseTwitchInput(val) : parseYouTubeInput(val);
            onAdd(buildStream(singlePlatform, parsed));
        }
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
                        <div className="platform-selector">
                            <button
                                className={`platform-btn ${singlePlatform === 'twitch' ? 'active twitch' : ''}`}
                                onClick={() => setSinglePlatform('twitch')} title="Twitch"
                            >
                                <TwitchIcon size={13} />
                            </button>
                            <button
                                className={`platform-btn ${singlePlatform === 'youtube' ? 'active youtube' : ''}`}
                                onClick={() => setSinglePlatform('youtube')} title="YouTube"
                            >
                                <Youtube size={13} />
                            </button>
                        </div>
                        <input
                            ref={singleInputRef}
                            type="text"
                            className="form-input"
                            placeholder={locale === 'ja' ? 'URL貼付け or 名前入力、Enterで追加' : 'Paste URL or enter name, Enter to add'}
                            value={singleInput}
                            onChange={e => setSingleInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSingle()}
                            autoFocus
                        />
                        <button className="add-btn" onClick={addSingle}>
                            <Plus size={14} />
                        </button>
                    </div>
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
