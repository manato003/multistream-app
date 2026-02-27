import { useEffect } from 'react';

interface ShortcutHandlers {
    onAddStream: () => void;
    onOpenSettings: () => void;
    onOpenHelp: () => void;
    onToggleChatPin: () => void;
    onCloseModal: () => void;
}

/**
 * グローバルキーボードショートカット
 *   A       → 配信追加モーダル
 *   ,       → 設定モーダル
 *   ?       → ヘルプモーダル
 *   P       → チャットピン留め切替
 *   Escape  → 開いているモーダルを閉じる
 *
 * input / textarea / contenteditable にフォーカス中はスキップ
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
    const {
        onAddStream,
        onOpenSettings,
        onOpenHelp,
        onToggleChatPin,
        onCloseModal,
    } = handlers;

    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;
            if (
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.isContentEditable
            ) return;

            switch (e.key) {
                case 'a':
                case 'A':
                    e.preventDefault();
                    onAddStream();
                    break;
                case ',':
                    e.preventDefault();
                    onOpenSettings();
                    break;
                case '?':
                    e.preventDefault();
                    onOpenHelp();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    onToggleChatPin();
                    break;
                case 'Escape':
                    onCloseModal();
                    break;
            }
        };

        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [onAddStream, onOpenSettings, onOpenHelp, onToggleChatPin, onCloseModal]);
}
