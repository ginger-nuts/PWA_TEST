# やることメモ — iPhone対応 PWAサンプル

iPhoneのホーム画面に追加して、アプリのように使えるToDoアプリのサンプルです。
オフラインでも動作し、データは端末内に保存されます。

## 🌐 公開URL

**https://ginger-nuts.github.io/PWA_TEST/**

GitHub Pages で公開済みです。上記URLをiPhoneのSafariで開けばすぐ試せます。

## 📲 iPhoneにインストールする手順

1. iPhoneの **Safari** で公開URLを開く
   👉 https://ginger-nuts.github.io/PWA_TEST/
   （※ Chrome等ではなく **Safari** で開くこと）
2. 画面下部の **共有ボタン 􀈂** をタップ
3. メニューを下にスクロールして **「ホーム画面に追加」** を選ぶ
4. 右上の **「追加」** をタップ
5. ホーム画面に追加されたアイコンから起動すると、
   アドレスバーのない**全画面アプリ**として動作します（オフラインでもOK）

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | 画面。iOS用メタタグ（`apple-mobile-web-app-*`、`apple-touch-icon`）を含む |
| `styles.css` | 見た目。ノッチ/ホームバー対応（`safe-area-inset`）、ダークモード対応 |
| `app.js` | ToDoロジック、localStorage保存、SW登録、iOS用インストール案内 |
| `manifest.webmanifest` | アプリ名・アイコン・表示モード（`standalone`）などの定義 |
| `sw.js` | Service Worker。ファイルをキャッシュしオフライン動作を実現 |
| `icons/` | アイコン画像（180/192/512、maskable） |

## 重要：PWAは「https」または「localhost」でしか動きません

Service Worker（オフライン機能）や「ホーム画面に追加」は、
`file://` で直接開いても動作しません。**Webサーバー経由**で開く必要があります。

## iPhoneで試す手順

1. これらのファイルをWeb上に公開する（下の「公開方法」参照）
2. iPhoneの **Safari** で公開URLを開く（※Chrome等ではなくSafari必須）
3. 下部の共有ボタン **􀈂** をタップ
4. 「**ホーム画面に追加**」を選ぶ
5. ホーム画面のアイコンから起動すると、アドレスバーのない全画面アプリとして動く

## 公開方法（どれか一つ）

### 手軽：GitHub Pages
1. GitHubにリポジトリを作りこのフォルダの中身をアップロード
2. Settings → Pages → Branch を `main` / `root` にして保存
3. 発行された `https://<ユーザー名>.github.io/<リポジトリ名>/` をiPhoneで開く

### 手軽：Netlify Drop
`https://app.netlify.com/drop` にこのフォルダをドラッグ&ドロップするだけ。

### ローカルで動作確認（PC）
Node.jsがあれば:
```
npx serve .
```
Pythonがあれば:
```
python -m http.server 8000
```
ブラウザで `http://localhost:8000/` を開く。

## 更新方法（公開サイトへの反映）

このリポジトリは GitHub Pages に接続済みです。コードを変更したら、
以下を実行すれば1〜2分後に公開URLへ自動反映されます。

```
git add -A
git commit -m "変更内容"
git push
```

## カスタマイズのヒント

- アプリ名：`manifest.webmanifest` の `name` / `short_name`、`index.html` の `<title>` と `apple-mobile-web-app-title`
- テーマ色：`manifest` の `theme_color`、`index.html` の `theme-color`、`styles.css` の `--accent`
- アイコン差し替え：`icons/` の各PNGを同じサイズで置き換え
- キャッシュ更新：`sw.js` の `CACHE = "todo-cache-v1"` のバージョン番号を上げると再キャッシュされる
