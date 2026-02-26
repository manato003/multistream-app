import { useState, useCallback } from 'react';

export interface AppSettings {
    /** default: 配信管理=左, コメント=右 / swapped: 配信管理=右, コメント=左 */
    panelLayout: 'default' | 'swapped';
}

const DEFAULT_SETTINGS: AppSettings = { panelLayout: 'default' };
const STORAGE_KEY = 'appSettings';

type UpdateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

export function useSettings(): [AppSettings, UpdateSetting] {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const updateSetting: UpdateSetting = useCallback((key, value) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    return [settings, updateSetting];
}
