import React from 'react';
import { X, Settings } from 'lucide-react';
import type { Locale } from '../i18n';

interface SettingsModalProps {
    onClose: () => void;
    locale: Locale;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, locale }) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} color="var(--accent)" />
                        <h2 className="modal-title">{locale === 'ja' ? '設定' : 'Settings'}</h2>
                    </div>
                    <button className="icon-button" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '8px 0' }}>
                    {locale === 'ja' ? '設定項目は近日追加予定です。' : 'Settings coming soon.'}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
