import React from 'react';
import { X, Settings } from 'lucide-react';
import type { Locale } from '../i18n';
import type { AppSettings } from '../hooks/useSettings';

interface SettingsModalProps {
    onClose: () => void;
    locale: Locale;
    settings: AppSettings;
    onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, locale, settings, onUpdateSetting }) => {
    const label = (ja: string, en: string) => locale === 'ja' ? ja : en;
    const isSwapped = settings.panelLayout === 'swapped';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} color="var(--accent)" />
                        <h2 className="modal-title">{label('設定', 'Settings')}</h2>
                    </div>
                    <button className="icon-button" onClick={onClose}><X size={18} /></button>
                </div>

                {/* ── パネルレイアウト ── */}
                <div className="settings-section">
                    <div className="settings-section-title">
                        {label('レイアウト', 'Layout')}
                    </div>
                    <div className="settings-row">
                        <div className="settings-row-label">
                            <span className="settings-label">
                                {label('パネルの左右を入れ替え', 'Swap panel sides')}
                            </span>
                            <span className="settings-description">
                                {label(
                                    '配信管理パネルを右側、コメントパネルを左側に移動',
                                    'Move stream panel to right, chat panel to left',
                                )}
                            </span>
                        </div>
                        <button
                            className={`settings-toggle${isSwapped ? ' on' : ''}`}
                            onClick={() => onUpdateSetting('panelLayout', isSwapped ? 'default' : 'swapped')}
                            role="switch"
                            aria-checked={isSwapped}
                            title={isSwapped ? label('入れ替え中', 'Swapped') : label('デフォルト', 'Default')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
