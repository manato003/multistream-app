import { useState, useRef, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

/**
 * Generic drag-to-reorder hook for side panel lists.
 * Uses mousedown/mousemove/elementFromPoint (no HTML5 DnD — iframe compatible).
 *
 * @param datasetKey - The dataset property to identify items (e.g. 'streamId' → data-stream-id)
 * @param onReorder  - Called with (fromId, toId) when a valid drop occurs
 */
export function useDragReorder(
    datasetKey: string,
    onReorder: (fromId: string, toId: string) => void,
) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const draggingIdRef = useRef<string | null>(null);
    const dragOverIdRef = useRef<string | null>(null);

    const handleMouseDown = useCallback((e: ReactMouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        let isDragActive = false;

        const onMouseMove = (me: MouseEvent) => {
            if (!isDragActive) {
                const d = Math.hypot(me.clientX - startX, me.clientY - startY);
                if (d < 5) return;
                isDragActive = true;
                draggingIdRef.current = id;
                setDraggingId(id);
            }

            const el = document.elementFromPoint(me.clientX, me.clientY);
            let target: Element | null = el;
            let targetId: string | null = null;
            while (target) {
                const tid = (target as HTMLElement).dataset?.[datasetKey];
                if (tid) { targetId = tid; break; }
                target = target.parentElement;
            }

            if (targetId !== dragOverIdRef.current) {
                dragOverIdRef.current = targetId;
                setDragOverId(targetId);
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            const fromId = draggingIdRef.current;
            const toId = dragOverIdRef.current;

            if (fromId && toId && fromId !== toId) {
                onReorder(fromId, toId);
            }

            draggingIdRef.current = null;
            dragOverIdRef.current = null;
            setDraggingId(null);
            setDragOverId(null);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [datasetKey, onReorder]);

    return { draggingId, dragOverId, handleMouseDown };
}
