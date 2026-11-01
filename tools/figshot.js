// 授業の図を画像にして確かめる：node tools/figshot.js <授業idの先頭（例 k1）> <出力フォルダ>
// 例：node tools/figshot.js k1-2 /tmp/figs  → 図ごとに PNG を保存（ライト・ダーク両方）
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const pre = process.argv[2] || '', out = process.argv[3] || 'figs';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/fonts.*/**', r => r.abort());
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '#home');
  const list = await p.evaluate(pre => { const r = []; BL.lessons.forEach(l => { if (l.id.indexOf(pre) === 0) l.slides.forEach((s, i) => { if (s.fig) r.push([l.id, i]); }); }); return r; }, pre);
  for (const theme of ['light', 'dark']) {
    for (const [id, i] of list) {
      await p.evaluate(([id, i, theme]) => {
        document.documentElement.setAttribute('data-theme', theme);
        const s = BL.lessons.find(l => l.id === id).slides[i];
        document.body.innerHTML = '<div id="f" style="width:640px;padding:10px;background:var(--panel);color:var(--ink)">' + s.fig.replace('<svg', '<svg class="svgfig"') + '<div style="font:12px sans-serif">' + id + ' #' + i + ' ' + s.h + '</div></div>';
      }, [id, i, theme]);
      const el = await p.$('#f');
      await el.screenshot({ path: path.join(out, id + '-' + i + '-' + theme + '.png') });
    }
  }
  const bad = await p.evaluate(pre => { const r = []; BL.lessons.forEach(l => { if (l.id.indexOf(pre) === 0) l.slides.forEach((s, i) => { if (s.fig) { const d = new DOMParser().parseFromString(s.fig, 'image/svg+xml'); if (d.querySelector('parsererror')) r.push(l.id + '#' + i); } }); }); return r; }, pre);
  console.log('図 ' + list.length + ' 枚を保存：' + out + (bad.length ? '\nSVG の書き方エラー：' + bad.join(', ') : '') + (errs.length ? '\n' + errs.join('\n') : ''));
  await b.close();
})();
