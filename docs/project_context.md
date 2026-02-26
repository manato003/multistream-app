# Multistream Nexus - プロジェクト状態メモ

新しいチャットを始める際にClaudeに読み込ませるためのコンテキストファイルです。

## 技術スタック
- React 19 + TypeScript + Vite
- ローカル: `C:\Users\manat\OneDrive\Desktop\claude\multistream-app`
- 開発サーバー: `http://localhost:5173/`
- バージョン管理: Git（コミット済み）
- 開発サーバー起動コマンド: `cd "C:\Users\manat\OneDrive\Desktop\claude\multistream-app"; npm run dev`

## アプリの目的
YouTube / Twitch のライブ配信を複数同時に視聴するWebアプリ。

## 現在の実装状況

### 配信管理
- YouTube / Twitch 埋め込みプレイヤー
- `@handle` 入力でYouTubeチャンネルの現在ライブを自動解決（CORSプロキシ経由）
  - `/live` ページで `"isLiveNow":true` を確認した場合のみ採用（予定配信を除外）
  - フォールバック: `/videos` ページから最新動画IDを取得
  - キャッシュ: ライブIDは5分TTL、非ライブは無期限（localStorage）
- **起動時**に全YouTubeチャンネル枠のvideo IDをバックグラウンドで一括再取得
- **リロードボタン押下時**にYouTubeチャンネル枠のvideo IDを再取得（スピナー表示）
- **履歴からの追加時**にvideo IDを再取得してから追加
- 再取得失敗時は古いvideo IDのまま静かに維持（エラー表示なし）
- 配信追加モーダル（単発追加・複数URL一括追加、モーダルを閉じずに連続追加可能）
- localStorage永続化（アクティブな配信・履歴）

### レイアウト
- 16:9最適化グリッドレイアウト（枠数に応じて自動計算）
- ダブルクリックで枠を拡大/復帰
- ドラッグ&ドロップで枠入れ替え（HTML5 DnD非対応、mousedown/mousemoveベースのカスタム実装）
  - drag-global-overlayで全iframeをブロック、elementFromPointでターゲット検出

### サイドパネル（左端ホバーで表示）
- 左端2pxトリガーにマウスを近づけるとスライドイン
- 「表示中」「非表示」「履歴」の3セクション
- 個別の非表示・再表示トグル（EyeOffアイコン）
- 履歴からワンクリックで再追加（+ボタン）・履歴から個別削除（×ボタン）
- 配信追加時に自動で履歴へ記録（最大50件、同じチャンネルは先頭に移動）
- 現在グリッドにある配信は履歴セクションに表示しない

### ヘッダー（上端ホバーで表示）
- 上端6pxトリガーにマウスを近づけるとスライドイン
- マウスY座標180px超で自動非表示（onMouseLeaveは不使用）
- 左: アプリタイトル（MonitorPlayアイコン）
- 中央: 配信を追加ボタン
- 右: Share / Help / 言語切替 / 設定（歯車）

### StreamFrameのヘッダーボタン（左→右）
- 非表示（EyeOff）/ リロード（RefreshCw）/ ポップアウト（ExternalLink）/ 閉じる（X）

### その他
- 多言語対応（日本語/英語）
- レイアウト共有（Base64エンコード方式、インポート/エクスポート）
- ダークモードのみ（ライトモード廃止）
- 設定モーダル（現在は空のプレースホルダー）

## 重要な実装メモ

### ドラッグ&ドロップ
- HTML5 DnD APIは使っていない（iframe干渉問題のため）
- mousedown/mousemoveベースのカスタム実装
- drag-global-overlayで全iframeをブロック中、elementFromPointで一時的にoverlay非表示にしてターゲット検出

### リロード・再マウント
- StreamFrame内部で `reloadKey` をstateで持ち、playerコンポーネントにだけkeyを渡す方式
- StreamFrameの `key={stream.id}` のみ（reloadKeyをkeyに含めない）

### ヘッダー非表示
- onMouseLeaveは使っていない
- window.mousemoveでY座標を監視、180px超で非表示

### YouTubeプレイヤー
- チャンネルURL（@xxx）をiframe埋め込みすると「エラーが発生しました」になる
- 追加時に `resolveYouTubeChannel` でvideo IDを解決し、`/embed/VIDEO_ID` として埋め込む
- `inputType` は解決後 `'video'` に変換して保存

### React.memo
- StreamFrame / TwitchPlayer / YouTubePlayer すべてに React.memo を適用済み
- StreamGridのコールバックはすべてuseCallbackで安定化済み

### 既知の課題
- ドラッグ&ドロップ時に移動した枠以外もリロードされる
  - 原因: swap後にDOMの物理位置が変わりブラウザがiframeをリロードする
  - 対策候補: CSS GridのorderプロパティでDOM位置を変えずに視覚的に入れ替える（未実装）

## ファイル構成
```
src/
  components/
    AddStreamModal.tsx   # 配信追加モーダル
    HelpModal.tsx
    SettingsModal.tsx
    ShareModal.tsx
    StreamFrame.tsx      # 個別配信枠（ヘッダーボタン・リロード・非表示）
    StreamGrid.tsx       # グリッドレイアウト・ドラッグ&ドロップ
    StreamSidePanel.tsx  # 左サイドパネル（表示中・非表示・履歴）
    TwitchPlayer.tsx
    YouTubePlayer.tsx
  hooks/
    useStreamHistory.ts  # 配信履歴のlocalStorage管理
  utils/
    parseInput.ts        # URL・ハンドル入力のパース
    resolveChannelId.ts  # YouTubeチャンネルハンドル→video ID解決
  App.tsx
  index.css
  side-panel.css
  types.ts
  i18n.ts
```

## 今後の予定（未実装）
1. 設定モーダルへの機能追加
2. レイアウトプリセット（2x2、3x3、1メイン+サブなど）
3. 枠のリサイズ機能（境界線ドラッグ方式）
4. コメント欄（チャット）表示機能
5. ドラッグ時のリロード問題修正（CSS order方式）

## 運用ルール
- Claudeがコードを編集したら**論理的なまとまりごとにgit commit**する（細かいコミットが安全）
- コミットコマンド: `cd "C:\Users\manat\OneDrive\Desktop\claude\multistream-app"; git add .; git commit -m "メッセージ"`
- 新しいチャット開始時: このファイル（`docs/project_context.md`）を最初に読ませる
