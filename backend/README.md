# backend

ケアマックス グループウェアのバックエンドAPI(Node.js + TypeScript + Express)。

DBは社内SQL Server(`10.194.5.57`)に、`mssql`(tedious)ドライバで直接接続する(ORM不使用)。プロジェクト全体の説明は [ルートのREADME](../README.md) を参照。

## セットアップ

```bash
cp .env.example .env
# .env に接続用のDB_USER / DB_PASSWORD を設定する
npm install
```

## 開発

```bash
npm run dev
```

`GET /api/health` でアプリの起動確認、`GET /api/health/db` でSQL Serverへの接続確認ができる。

## ビルド・型チェック

```bash
npm run build
npm run typecheck
```
