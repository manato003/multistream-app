import { useState, useCallback, useMemo } from 'react';
import type { FavoriteNode, FavoriteFolder, FavoriteChannel } from '../types';

const STORAGE_KEY = 'favorites';
const MAX_DEPTH = 2; // ルート(0) + 1階層(1) まで

// ── localStorage 永続化 ──

function load(): FavoriteNode[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function save(tree: FavoriteNode[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
    } catch { /* ignore */ }
}

// ── ツリー操作ヘルパー ──

/** ノードを ID で検索して削除。削除されたノードも返す */
function findAndRemove(tree: FavoriteNode[], id: string): [FavoriteNode[], FavoriteNode | null] {
    let removed: FavoriteNode | null = null;
    const result: FavoriteNode[] = [];
    for (const node of tree) {
        if (node.id === id) {
            removed = node;
            continue;
        }
        if (node.kind === 'folder') {
            const [children, found] = findAndRemove(node.children, id);
            if (found) removed = found;
            result.push({ ...node, children });
        } else {
            result.push(node);
        }
    }
    return [result, removed];
}

/** 指定フォルダの children に末尾追加。parentId が null ならルート末尾 */
function insertInto(tree: FavoriteNode[], parentId: string | null, node: FavoriteNode): FavoriteNode[] {
    if (parentId === null) return [...tree, node];
    return tree.map(n => {
        if (n.kind === 'folder' && n.id === parentId) {
            return { ...n, children: [...n.children, node] };
        }
        if (n.kind === 'folder') {
            return { ...n, children: insertInto(n.children, parentId, node) };
        }
        return n;
    });
}

/** 指定 ID のノードを更新 */
function updateNode(tree: FavoriteNode[], id: string, updater: (n: FavoriteNode) => FavoriteNode): FavoriteNode[] {
    return tree.map(n => {
        if (n.id === id) return updater(n);
        if (n.kind === 'folder') {
            return { ...n, children: updateNode(n.children, id, updater) };
        }
        return n;
    });
}

/** ノードの深度を取得（0 = ルート） */
function getDepth(tree: FavoriteNode[], id: string, depth = 0): number {
    for (const node of tree) {
        if (node.id === id) return depth;
        if (node.kind === 'folder') {
            const d = getDepth(node.children, id, depth + 1);
            if (d >= 0) return d;
        }
    }
    return -1;
}

/** フォルダ一覧を収集（編集モードの移動先ドロップダウン用） */
export interface FolderInfo { id: string; name: string; depth: number }

function collectFolders(tree: FavoriteNode[], out: FolderInfo[], depth = 0) {
    for (const node of tree) {
        if (node.kind === 'folder') {
            out.push({ id: node.id, name: node.name, depth });
            collectFolders(node.children, out, depth + 1);
        }
    }
}

/** ツリー内の全チャンネルを "type:sourceId" 形式で収集 */
function collectChannelIds(tree: FavoriteNode[], out: Set<string>) {
    for (const node of tree) {
        if (node.kind === 'channel') {
            out.add(`${node.type}:${node.sourceId}`);
        } else {
            collectChannelIds(node.children, out);
        }
    }
}

/** 同じ親配列内の2要素をスワップ */
function swapInArray(arr: FavoriteNode[], fromId: string, toId: string): FavoriteNode[] {
    const result = [...arr];
    const fi = result.findIndex(n => n.id === fromId);
    const ti = result.findIndex(n => n.id === toId);
    if (fi === -1 || ti === -1) return arr;
    [result[fi], result[ti]] = [result[ti], result[fi]];
    return result;
}

/** ツリー内で同一親の並べ替え */
function reorderInTree(tree: FavoriteNode[], fromId: string, toId: string): FavoriteNode[] {
    // まずルート直下を試す
    const fi = tree.findIndex(n => n.id === fromId);
    const ti = tree.findIndex(n => n.id === toId);
    if (fi !== -1 && ti !== -1) return swapInArray(tree, fromId, toId);

    // フォルダ内を再帰
    return tree.map(n => {
        if (n.kind === 'folder') {
            return { ...n, children: reorderInTree(n.children, fromId, toId) };
        }
        return n;
    });
}

// ── お気に入りコールバック型 ──

export interface FavoriteActions {
    addChannel: (ch: Omit<FavoriteChannel, 'id' | 'kind'>, parentFolderId?: string | null) => void;
    removeNode: (nodeId: string) => void;
    createFolder: (name: string, parentFolderId?: string | null) => void;
    renameFolder: (folderId: string, newName: string) => void;
    moveNode: (nodeId: string, targetFolderId: string | null) => void;
    toggleCollapse: (folderId: string) => void;
    reorderInParent: (fromId: string, toId: string) => void;
}

// ── フック本体 ──

export function useFavorites() {
    const [tree, setTree] = useState<FavoriteNode[]>(load);

    const persist = useCallback((updater: (prev: FavoriteNode[]) => FavoriteNode[]) => {
        setTree(prev => {
            const next = updater(prev);
            save(next);
            return next;
        });
    }, []);

    const addChannel = useCallback((
        ch: Omit<FavoriteChannel, 'id' | 'kind'>,
        parentFolderId?: string | null,
    ) => {
        const node: FavoriteChannel = {
            ...ch,
            id: crypto.randomUUID(),
            kind: 'channel',
        };
        persist(prev => insertInto(prev, parentFolderId ?? null, node));
    }, [persist]);

    const removeNode = useCallback((nodeId: string) => {
        persist(prev => findAndRemove(prev, nodeId)[0]);
    }, [persist]);

    const createFolder = useCallback((name: string, parentFolderId?: string | null) => {
        const parentId = parentFolderId ?? null;
        // 深度チェック: parentId のフォルダが既に depth >= MAX_DEPTH-1 なら拒否
        persist(prev => {
            if (parentId !== null) {
                const parentDepth = getDepth(prev, parentId);
                if (parentDepth >= MAX_DEPTH - 1) return prev; // これ以上ネスト不可
            }
            const folder: FavoriteFolder = {
                id: crypto.randomUUID(),
                kind: 'folder',
                name,
                collapsed: false,
                children: [],
            };
            return insertInto(prev, parentId, folder);
        });
    }, [persist]);

    const renameFolder = useCallback((folderId: string, newName: string) => {
        persist(prev => updateNode(prev, folderId, n =>
            n.kind === 'folder' ? { ...n, name: newName } : n,
        ));
    }, [persist]);

    const moveNode = useCallback((nodeId: string, targetFolderId: string | null) => {
        persist(prev => {
            const [cleaned, removed] = findAndRemove(prev, nodeId);
            if (!removed) return prev;
            return insertInto(cleaned, targetFolderId, removed);
        });
    }, [persist]);

    const toggleCollapse = useCallback((folderId: string) => {
        persist(prev => updateNode(prev, folderId, n =>
            n.kind === 'folder' ? { ...n, collapsed: !n.collapsed } : n,
        ));
    }, [persist]);

    const reorderInParent = useCallback((fromId: string, toId: string) => {
        persist(prev => reorderInTree(prev, fromId, toId));
    }, [persist]);

    const allChannelIds = useMemo(() => {
        const ids = new Set<string>();
        collectChannelIds(tree, ids);
        return ids;
    }, [tree]);

    const getAllFolders = useCallback((): FolderInfo[] => {
        const out: FolderInfo[] = [];
        collectFolders(tree, out);
        return out;
    }, [tree]);

    const actions: FavoriteActions = useMemo(() => ({
        addChannel, removeNode, createFolder, renameFolder,
        moveNode, toggleCollapse, reorderInParent,
    }), [addChannel, removeNode, createFolder, renameFolder, moveNode, toggleCollapse, reorderInParent]);

    return { tree, allChannelIds, getAllFolders, actions };
}
