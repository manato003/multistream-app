import { useState, useCallback, useRef } from 'react';

interface UseResizableOptions {
    storageKey: string;
    defaultWidth: number;
    min: number;
    max: number;
    /** 'right': パネル左端固定、右端ドラッグ（通常の左パネル）
     *  'left':  パネル右端固定、左端ドラッグ（スワップ時の右パネル）
     */
    direction: 'right' | 'left';
}

function loadWidth(key: string, defaultWidth: number): number {
    try {
        const raw = localStorage.getItem(key);
        const n = raw ? parseInt(raw, 10) : NaN;
        return isNaN(n) ? defaultWidth : n;
    } catch {
        return defaultWidth;
    }
}

/**
 * サイドパネルのドラッグリサイズフック。
 * mousedown → mousemove で幅をリアルタイム更新し、mouseup で localStorage に保存。
 */
export function useResizable({ storageKey, defaultWidth, min, max, direction }: UseResizableOptions) {
    const [width, setWidth] = useState(() => loadWidth(storageKey, defaultWidth));
    const isResizingRef = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingRef.current = true;
        const startX = e.clientX;
        const startWidth = width;

        const onMouseMove = (me: MouseEvent) => {
            const delta = direction === 'right'
                ? me.clientX - startX   // 右にドラッグ → 幅を増やす
                : startX - me.clientX;  // 左にドラッグ → 幅を増やす
            const next = Math.min(max, Math.max(min, startWidth + delta));
            setWidth(next);
            // CSS 変数をリアルタイム更新（ピン留め padding と連動）
            document.documentElement.style.setProperty('--stream-panel-width', `${next}px`);
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            isResizingRef.current = false;
            // 最終幅を保存
            setWidth(prev => {
                try { localStorage.setItem(storageKey, String(prev)); } catch { /* ignore */ }
                return prev;
            });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [width, direction, min, max, storageKey]);

    return { width, handleMouseDown, isResizing: isResizingRef };
}
