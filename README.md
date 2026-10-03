# ドラゴンズ・オース 公開手順(無料でできます)

## 1. GitHubに上げる
1. https://github.com で「New repository」→ 名前 `dragons-oath`(Publicでよい)。
2. このフォルダの中身をそのままアップロード(または下記コマンド)。
```
cd dragons-oath
git init && git add . && git commit -m "first"
git branch -M main
git remote add origin https://github.com/あなたのID/dragons-oath.git
git push -u origin main
```

## 2. 成長データを消えないようにする(Upstash Redis・無料)
Renderの無料枠はディスクがなく、再起動でファイルが消えます。そのため外部の無料DBを使います。
1. https://upstash.com に登録 → Redis → Create Database(Regionは近い所、Freeプラン)。
2. 作成後の画面「REST API」にある **UPSTASH_REDIS_REST_URL** と **UPSTASH_REDIS_REST_TOKEN** をコピー。

(設定しなくても、ブラウザ側にもバックアップがあり、同じ端末・同じ名前なら復元されます。ただし端末を変えると引き継げません。)

## 3. Renderに公開
1. https://render.com → New → **Web Service** → GitHubのリポジトリを選択。
2. Runtime: Node / Build Command: `npm install` / Start Command: `npm start` / Plan: Free。
3. Environment に手順2の2つの値(UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)を追加。
4. Deploy。出来たURLが遊ぶ場所です。ログに `storage: upstash` と出れば保存は成功です。
(`render.yaml` を置いてあるので、New → Blueprint からでも作れます。)

## 4. 注意
- 無料枠は15分アクセスがないと眠り、起きるのに数十秒かかります。眠るとその間のルームは消えます(成長データは残ります)。
  防ぐには https://uptimerobot.com で `https://あなたのURL/healthz` を5分ごとに監視してください。
- 更新するときは `git push` するだけで自動で再デプロイされます。
- 友達には「招待リンク」(URLの末尾に `?room=XXXX`)を送るだけで参加できます。

## 5. 中身(参考)
- `game.js` ゲームロジック / `server.js` 配信+通信+保存 / `miniws.js` npmのwsが無い時の予備 / `public/index.html` 画面 / `public/audio/*.mp3` BGM3曲
- 遊び方のコツ: 竜戦では「🤝連携」を全員が押すと大ダメージ。第3相の「終焉の詠唱」は、連携が揃う(最大3人)と打ち破れます。
- 職業別の秘伝ツリーは、その職業で遊ぶ時だけ有効です(スキルポイントは共通)。

## 6. すでに前のバージョンを公開している場合(更新)
1. GitHubのリポジトリを開き、「Add file → Upload files」を選ぶ。
2. 解凍したフォルダの中身(`game.js` `server.js` `miniws.js` `package.json` `render.yaml` `README.md` と `public` フォルダ)を全部ドラッグ&ドロップして上書き。
3. 「Commit changes」を押す。Renderが自動で作り直します(2〜3分)。Renderの設定変更は不要です。
4. うまくいかない時は Render の Logs を確認。

## 7. 1回の冒険の流れ
旅立ち → 全24マス(5章: 森→山脈→砂漠→沼地→竜の谷・毎マス3つの道から選択)→ 各章の守護者4体 → 竜 → 冒険完了 → 「同じ職業で新しい冒険へ」または「職業を変えて集いの間へ」。スキルポイントは次の冒険へ引き継がれます。

## 8. 追加した音楽
`public/audio/` に 探索5曲(field, ice, desert, swamp, valley)と戦闘・竜戦の計7曲。章に合わせて自動で切り替わります。同じ名前のmp3で差し替え可能です。
