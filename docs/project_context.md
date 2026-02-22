# Multistream Nexus - プロジェクト状態メモ

新しいチャットを始める際にClaudeに読み込ませるためのコンテキストファイルです。

## 技術スタック
- React 19 + TypeScript + Vite
- ローカル: `C:\Users\manat\OneDrive\Desktop\claude\multistream-app`
- 開発サーバー: `http://localhost:5173/`
- バージョン管理: Git（コミット済み）

## 現在の実装状況

### 完了済み
- YouTube / Twitch 埋め込みプレイヤー
- マウスベースのドラッグ＆ドロップ枠入れ替え（elementFromPoint方式）
- 16:9最適化グリッドレイアウト（自動計算）
- ダブルクリックで枠を拡大/復帰
- 個別配信リロード（StreamFrame内部でreloadKey管理、並び替え時に他の枠に影響しない）
- ホバー表示ヘッダー（上端2px細バーがヘッダーの一部としてはみ出す方式）
  - マウスY座標180px（ヘッダー高さ36px×5）超えで自動非表示
- 配信追加モーダル（単発追加＋複数URL一括追加、モーダルを閉じずに連続追加可能）
- レイアウト共有（Base64エンコード方式、インポート/エクスポート）
- 多言語対応（日本語/英語）
- localStorage永続化
- ダークモードのみ（ライトモード廃止）
- 設定モーダル（現在は空のプレースホルダー、今後機能追加予定）

### ヘッダー構成（左→右）
- 左: アプリタイトル（MonitorPlayアイコン）
- 中央: 配信を追加ボタン（大きめ、アクセントカラー）
- 右: Share / Help / 言語切替 / 設定（歯車）

### 削除済み機能
- アーカイブ同期モード（改善余地ありとして削除）
- リサイズ機能（UX問題で削除）
- ライトモード

## 重要な実装メモ

### ドラッグ＆ドロップ
- HTML5 DnD APIは使っていない（iframe干渉問題のため）
- mousedown/mousemoveベースのカスタム実装
- drag-global-overlayで全iframeをブロック中、elementFromPointで一時的にoverlay非表示にしてターゲット検出

### リロード
- 以前はStreamGridでreloadKeysをstateで管理していたが、並び替え時に全フレームがリマウントされるバグがあった
- 現在はStreamFrame内部でreloadKeyをstateで持ち、playerコンポーネントにだけkeyを渡す方式

### ヘッダー非表示
- onMouseLeaveは使っていない
- window.mousemoveでY座標を監視、180px超で非表示

## 運用ルール
- Claudeがコードを編集したら会話の最後にgit commitする
- コミットコマンド: `cd "C:\Users\manat\OneDrive\Desktop\claude\multistream-app"; git add .; git commit -m "メッセージ"`

## 今後の予定（未実装）
- 設定モーダルへの各種設定機能の追加
- コメント欄（チャット）表示機能
- レイアウトプリセット
