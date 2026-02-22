import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { t } from '../i18n';
import type { Locale } from '../i18n';

interface HelpModalProps {
    onClose: () => void;
    locale: Locale;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, locale }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HelpCircle size={18} color="var(--accent)" />
                        <h2 className="modal-title">{t(locale, 'helpTitle')}</h2>
                    </div>
                    <button className="icon-button" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ lineHeight: '1.6', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {t(locale, 'guideText')}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <button className="primary-button" onClick={onClose} style={{ padding: '8px 32px' }}>OK</button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
