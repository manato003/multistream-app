export type Locale = 'en' | 'ja';

export interface Translations {
    appTitle: string;
    addStream: string;
    toggleArchive: string;
    toggleTheme: string;
    saveLayout: string;
    layoutSaved: string;
    noStreams: string;
    syncTime: string;
    modalTitle: string;
    platform: string;
    searchLabel: string;
    searchPlaceholder: string;
    archiveOffsetLabel: string;
    archiveOffsetPlaceholder: string;
    archiveOffsetHint: string;
    cancel: string;
    settings: string;
    popout: string;
    closeStream: string;
    language: string;
    reload: string;
    urlInputLabel: string;
    urlInputPlaceholder: string;
    nameIdLabel: string;
    nameIdPlaceholder: string;
    add: string;
    doubleClickExpand: string;
    dragToReorder: string;
    shareLayout: string;
    exportCode: string;
    importCode: string;
    importPlaceholder: string;
    help: string;
    helpTitle: string;
    guideText: string;
}

const en: Translations = {
    appTitle: 'Multistream Nexus',
    addStream: 'Add Stream',
    toggleArchive: 'Toggle Archive Sync Mode',
    toggleTheme: 'Toggle Theme',
    saveLayout: 'Save Layout',
    layoutSaved: 'Layout auto-saves to LocalStorage!',
    noStreams: 'No streams added. Move mouse to top to open menu.',
    syncTime: 'Sync Time (VODs)',
    modalTitle: 'Add Stream',
    platform: 'Platform',
    searchLabel: 'Search / Streamer ID / URL',
    searchPlaceholder: 'e.g. tarik, or YouTube Live URL',
    archiveOffsetLabel: 'Archive Start Time Offset (seconds)',
    archiveOffsetPlaceholder: 'e.g. 0 (Leave blank for Live)',
    archiveOffsetHint: 'Optional. For VOD sync with global timer.',
    cancel: 'Cancel',
    settings: 'Settings',
    popout: 'Popout',
    closeStream: 'Close',
    language: 'Language',
    reload: 'Reload',
    urlInputLabel: 'URL (auto-detect platform)',
    urlInputPlaceholder: 'https://www.twitch.tv/xxx or https://www.youtube.com/watch?v=xxx',
    nameIdLabel: 'Name / ID Search',
    nameIdPlaceholder: 'e.g. shroud, tarik',
    add: 'Add',
    doubleClickExpand: 'Double-click to expand',
    dragToReorder: 'Drag handle (⋮⋮) to reorder',
    shareLayout: 'Share/Import Layout',
    exportCode: 'Export (Copy Code)',
    importCode: 'Import (Apply Code)',
    importPlaceholder: 'Paste layout code here...',
    help: 'Help Guide',
    helpTitle: 'How to use Multistream Nexus',
    guideText: '• Move mouse to Top to open Menu\n• Drag handle (⋮⋮) to reorder streams\n• Double-click stream to expand/restore\n• Settings are saved to LocalStorage\n• Use "Share Layout" to copy/paste your setup',
};

const ja: Translations = {
    appTitle: 'マルチストリーム Nexus',
    addStream: '配信を追加',
    toggleArchive: 'アーカイブ同期',
    toggleTheme: 'テーマ切替',
    saveLayout: 'レイアウト保存',
    layoutSaved: 'レイアウトはLocalStorageに自動保存されています！',
    noStreams: '配信が追加されていません。画面上端にマウスを移動してメニューを開いてください。',
    syncTime: '同期時間',
    modalTitle: '配信を追加',
    platform: 'プラットフォーム',
    searchLabel: '検索 / 配信者ID / URL',
    searchPlaceholder: '例: 釈迦, tarik, YouTube Live URL',
    archiveOffsetLabel: 'アーカイブ開始オフセット（秒）',
    archiveOffsetPlaceholder: '例: 0（ライブの場合は空欄）',
    archiveOffsetHint: '任意。VODの同期に使用',
    cancel: 'キャンセル',
    settings: '設定',
    popout: 'ポップアウト',
    closeStream: '閉じる',
    language: '言語',
    reload: 'リロード',
    urlInputLabel: 'URL（プラットフォーム自動判別）',
    urlInputPlaceholder: 'https://www.twitch.tv/xxx や https://www.youtube.com/watch?v=xxx',
    nameIdLabel: '名前 / ID 検索',
    nameIdPlaceholder: '例: shroud, tarik',
    add: '追加',
    doubleClickExpand: 'ダブルクリックで全画面拡大',
    dragToReorder: 'ハンドル(⋮⋮)をドラッグして並び替え',
    shareLayout: 'レイアウト共有・読込',
    exportCode: 'コードを書き出し(コピー)',
    importCode: 'コードから読み込み',
    importPlaceholder: 'ここにレイアウトコードを貼り付けてください...',
    help: '操作ガイド',
    helpTitle: 'Multistream Nexus の使い方',
    guideText: '・画面上端にマウス移動でメニュー表示\n・ハンドル(⋮⋮)をドラッグして配信を並べ替え\n・配信枠をダブルクリックで全画面拡大/復帰\n・設定はブラウザ(LocalStorage)に自動保存されます\n・「共有・読込」から現在の構成をコードで保存・共有できます',
};

export const translations: Record<Locale, Translations> = { en, ja };

export function t(locale: Locale, key: keyof Translations): string {
    return translations[locale][key];
}
