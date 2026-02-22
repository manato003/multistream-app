import React, { useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { t } from '../i18n';
import type { Locale } from '../i18n';
import type { Stream } from '../types';

interface ShareModalProps {
    onClose: () => void;
    streams: Stream[];
    onApply: (streams: Stream[]) => void;
    locale: Locale;
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, streams, onApply, locale }) => {
    const [importCode, setImportCode] = useState('');
    const [copied, setCopied] = useState(false);

    const exportCode = btoa(encodeURIComponent(JSON.stringify(streams.map(s => ({
        type: s.type,
        title: s.title,
        sourceId: s.sourceId,
        inputType: s.inputType,
        startTime: s.startTime
    })))));

    const handleCopy = () => {
        navigator.clipboard.writeText(exportCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleImport = () => {
        if (!importCode.trim()) return;
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(importCode.trim())));
            if (Array.isArray(decoded)) {
                const newStreams = decoded.map((s: any) => ({
                    ...s,
                    id: crypto.randomUUID()
                }));
                onApply(newStreams);
            } else {
                throw new Error('Invalid format');
            }
        } catch (e) {
            console.error('Import error:', e);
            alert('Invalid layout code!');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{t(locale, 'shareLayout')}</h2>
                    <button className="icon-button" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="form-group">
                    <label className="form-label">{t(locale, 'exportCode')}</label>
                    <div className="input-row">
                        <input type="text" className="form-input" readOnly value={exportCode} />
                        <button className="add-btn" onClick={handleCopy}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>

                <div className="form-divider"><span>or</span></div>

                <div className="form-group">
                    <label className="form-label">{t(locale, 'importCode')}</label>
                    <div className="input-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                            className="form-input"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                            placeholder={t(locale, 'importPlaceholder')}
                            value={importCode}
                            onChange={e => setImportCode(e.target.value)}
                        />
                        <button className="primary-button" style={{ width: '100%', justifyContent: 'center' }} onClick={handleImport}>
                            <Download size={14} />
                            {t(locale, 'importCode')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
