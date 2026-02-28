import { useState, useRef, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

/**
 * Cross-section drop target: allows dropping dragged items onto elements
 * identified by a different dataset key (e.g. dropping history items onto favorites folders).
 */
export interface CrossDropTarget {
    datasetKey: string;  // e.g. 'folderDrop' → data-folder-drop
    onDrop: (draggedItemId: string, targetId: string) => void;
}

interface DragReorderOptions {
    crossDropTargets?: CrossDropTarget[];
}

/**
 * Generic drag-to-reorder hook for side panel lists.
 * Uses mousedown/mousemove/elementFromPoint (no HTML5 DnD — iframe compatible).
 *
 * @param datasetKey - The dataset property to identify items (e.g. 'streamId' → data-stream-id)
 * @param onReorder  - Called with (fromId, toId) when a valid drop occurs within the same section
 * @param options    - Optional cross-section drop targets
 */
export function useDragReorder(
    datasetKey: string,
    onReorder: (fromId: string, toId: string) => void,
    options?: DragReorderOptions,
) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [crossDropTargetId, setCrossDropTargetId] = useState<string | null>(null);
    const draggingIdRef = useRef<string | null>(null);
    const dragOverIdRef = useRef<string | null>(null);
    const crossDropRef = useRef<{ key: string; id: string } | null>(null);

    const handleMouseDown = useCallback((e: ReactMouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        let isDragActive = false;
        const targets = options?.crossDropTargets;

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
            let crossTarget: { key: string; id: string } | null = null;

            // Walk up the DOM tree looking for both same-section and cross-section targets
            while (target) {
                const ds = (target as HTMLElement).dataset;
                if (ds) {
                    // Check same-section reorder target
                    if (!targetId) {
                        const tid = ds[datasetKey];
                        if (tid) targetId = tid;
                    }
                    // Check cross-section drop targets (higher priority)
                    if (!crossTarget && targets) {
                        for (const ct of targets) {
                            const ctid = ds[ct.datasetKey];
                            if (ctid) {
                                crossTarget = { key: ct.datasetKey, id: ctid };
                                break;
                            }
                        }
                    }
                }
                target = target.parentElement;
            }

            // Update same-section drag target
            if (targetId !== dragOverIdRef.current) {
                dragOverIdRef.current = targetId;
                setDragOverId(targetId);
            }

            // Update cross-section drag target
            const prevCross = crossDropRef.current;
            const crossChanged = crossTarget?.id !== prevCross?.id || crossTarget?.key !== prevCross?.key;
            if (crossChanged) {
                crossDropRef.current = crossTarget;
                setCrossDropTargetId(crossTarget?.id ?? null);
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            const fromId = draggingIdRef.current;
            const cross = crossDropRef.current;

            if (fromId && cross && targets) {
                // Cross-section drop takes priority
                const handler = targets.find(t => t.datasetKey === cross.key);
                handler?.onDrop(fromId, cross.id);
            } else {
                // Same-section reorder
                const toId = dragOverIdRef.current;
                if (fromId && toId && fromId !== toId) {
                    onReorder(fromId, toId);
                }
            }

            draggingIdRef.current = null;
            dragOverIdRef.current = null;
            crossDropRef.current = null;
            setDraggingId(null);
            setDragOverId(null);
            setCrossDropTargetId(null);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [datasetKey, onReorder, options?.crossDropTargets]);

    return { draggingId, dragOverId, crossDropTargetId, handleMouseDown };
}
