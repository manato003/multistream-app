import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHoverPanelOptions {
    hideDelay?: number;   // mouseleave 後に隠すまでの遅延 (default: 500ms)
    idleTimeout?: number; // マウス静止で自動非表示になるまでの時間 (default: 5000ms)
}

/**
 * サイドパネルのホバー表示ロジックを共通化するフック。
 * - show / scheduleHide でパネルの表示・非表示を制御
 * - ブラウザウィンドウ外にマウスが出たとき自動的に scheduleHide を呼ぶ
 * - マウスが idleTimeout ミリ秒静止したとき自動的に非表示にする
 */
export function useHoverPanel({ hideDelay = 500, idleTimeout = 5000 }: UseHoverPanelOptions = {}) {
    const [visible, setVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearHideTimer = () => {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    };
    const clearIdleTimer = () => {
        if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    };

    const show = useCallback(() => {
        clearHideTimer();
        setVisible(true);
    }, []);

    const scheduleHide = useCallback(() => {
        clearHideTimer();
        hideTimerRef.current = setTimeout(() => setVisible(false), hideDelay);
    }, [hideDelay]);

    // ブラウザウィンドウ外にマウスが出たら scheduleHide
    useEffect(() => {
        const onMouseLeave = (e: MouseEvent) => {
            if (!e.relatedTarget) scheduleHide();
        };
        document.addEventListener('mouseleave', onMouseLeave);
        return () => document.removeEventListener('mouseleave', onMouseLeave);
    }, [scheduleHide]);

    // マウスが idleTimeout ms 静止したら自動非表示
    useEffect(() => {
        if (!visible) {
            clearIdleTimer();
            return;
        }
        const resetIdle = () => {
            clearIdleTimer();
            idleTimerRef.current = setTimeout(() => setVisible(false), idleTimeout);
        };
        resetIdle(); // パネルが表示された瞬間からカウント開始
        window.addEventListener('mousemove', resetIdle);
        return () => {
            window.removeEventListener('mousemove', resetIdle);
            clearIdleTimer();
        };
    }, [visible, idleTimeout]);

    return { visible, show, scheduleHide };
}
