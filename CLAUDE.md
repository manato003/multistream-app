# CLAUDE.md - Multistream Nexus

このファイルは新しいチャットセッション開始時に必ず読み込むこと。
共通ワークフロー・原則は `C:/Dev/claude/CLAUDE.md` に定義されており、自動適用される。

---

## プロジェクト固有のルール

- コードを編集したら**論理的なまとまりごとにgit commit**する（細かいコミットが安全）
- コミット: `cd "C:\Dev\projects\multistream-app"; git add <files>; git commit -m "メッセージ"`
- `git add .` は `nul` ファイルを巻き込む危険があるため、ファイルを個別に指定する
- iframeを扱う変更は特にテストを慎重に（HTML5 DnD非対応、elementFromPoint方式を使用中）
- `StreamFrame` の `key` に `reloadKey` を含めない（全フレームリマウントのバグが再発する）
- テーマはダークモードのみ（ライトモード復活させない）
- UIの実装・修正時は `C:/Dev/claude/skills/frontend-design/SKILL.md` に従い、AI slopなデザイン（Inter フォント多用、紫グラデーション等）を避けること
- コンポーネント作成・デザイン修正時は `C:/Dev/claude/skills/ui-ux-pro-max-skill-main/CLAUDE.md` を参照すること（本PJはカスタムCSS構成のため、Tailwind固有の指示は読み替えて適用）
- CSS変数・カラーパレット・タイポグラフィはダークモード専用デザインシステムとして一貫性を維持すること

---

## セッション開始時のチェックリスト

- [ ] `docs/project_context.md` を読む
- [ ] `tasks/lessons.md`（PJ固有）を読む
- [ ] `C:/Dev/claude/docs/lessons-global.md`（汎用）を読む
- [ ] 開発サーバーの起動確認（必要なら `npm run dev`）
- [ ] デプロイ先: https://multistream-app-eta.vercel.app
