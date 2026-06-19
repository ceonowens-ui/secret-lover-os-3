# 《秘密關係》OST 播放器 — 部署說明

純前端靜態網站，可直接放上 GitHub Pages。

## 檔案結構
```
index.html          ← 播放器（已內含 CSS + JS）
images/cover.png    ← 封面
songs/              ← ★ 你要自己補上音檔（見下方）
.nojekyll           ← 讓 GitHub Pages 原樣輸出，勿刪
```

## ★ 關於音檔 songs/
- 免費試聽曲（01、02）會讀取 `songs/01_我們之間的祕密.mp3`、`songs/02_…mp3`，
  請把這兩個（或全部）mp3 放進 `songs/` 資料夾一起上傳，線上才聽得到。
- 鎖定曲（03 之後）是向你的 Cloudflare Worker 串流，不需放進 repo。
- 檔名需與 index.html 內 `TRACKS` 的 `file` 欄位完全一致。

## 部署到 GitHub Pages（網頁操作，免指令）
1. 到 https://github.com/new 建一個新 repo（例如 `secret-lover-ost`），設為 Public，建立。
2. 在 repo 頁面點 **Add file → Upload files**，把本資料夾內的
   `index.html`、`images/`、`.nojekyll`（以及你的 `songs/`）整包拖進去，Commit。
3. 進 repo 的 **Settings → Pages**。
4. **Source** 選 **Deploy from a branch**，Branch 選 **main / (root)**，Save。
5. 等 1–2 分鐘，頁面上方會出現網址：
   `https://<你的帳號>.github.io/secret-lover-ost/`

## 注意
- Stripe 連結與 Worker API 網址在前端可見（本來就是公開資訊，正常）。
- 解鎖狀態存在使用者瀏覽器 localStorage。
- 自訂網域可在 Settings → Pages → Custom domain 設定。
