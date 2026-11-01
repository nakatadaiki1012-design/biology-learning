/* 見る：酵素・光合成（細胞の図は sims-cellview.js） */
(function () {
  /* ---------- 酵素 ---------- */
  var ENZ = { amy: { n: 'アミラーゼ（だ液）', ph: 7, s: 'デンプン → マルトース' }, pep: { n: 'ペプシン（胃）', ph: 2, s: 'タンパク質 → ペプチド' }, try: { n: 'トリプシン（すい液）', ph: 8, s: 'タンパク質 → ペプチド' }, cat: { n: 'カタラーゼ（肝臓）', ph: 7, s: '過酸化水素 → 水 ＋ 酸素' } };
  function fT(T) { return Math.exp((T - 37) / 14) / (1 + Math.exp((T - 47) / 3.2)); }
  var fTmax = 0; for (var t = 0; t <= 80; t += .5) fTmax = Math.max(fTmax, fT(t));
  function act(T, pH, opt) { return (fT(T) / fTmax) * Math.exp(-Math.pow((pH - opt) / 1.6, 2)); }
  BL.addSim({
    id: 'enzyme', name: '酵素のはたらき', cat: '細胞', subj: 'kiso', ic: '酵', lead: '温度・pH・基質の濃さで、反応の速さはどう変わる？',
    how: '<p><b class="key">酵素</b>は、からだの中の化学反応を速める<b class="key">触媒</b>。主成分はタンパク質。反応の前後で酵素そのものは変化しないので、くり返しはたらける。</p><p>酵素は決まった物質（<b class="key">基質</b>）にだけはたらく（<b class="key">基質特異性</b>）。基質が<b class="key">活性部位</b>にはまって<b class="key">酵素-基質複合体</b>ができ、生成物ができる。</p><div class="box">最適温度：多くは 35〜40℃。高温ではタンパク質の立体構造がこわれ（<b class="key">変性</b>）、はたらきを失う（<b class="key">失活</b>）。<br>最適pH：ペプシン 約2、だ液アミラーゼ 約7、トリプシン 約8。</div><p>基質が多くなると速さは上がるが、すべての酵素が基質と結合していると、それ以上は速くならない（頭打ち）。</p>',
    pts: [[1, '酵素は反応の前後で変化しない触媒'], [1, '高温で失活した酵素は、温度を下げてももとにもどらない'], [0, '無機触媒（酸化マンガン(IV)）も高温ではたらかなくなる → ×（温度が高いほど速い）'], [1, '基質濃度が高いとき反応速度が一定になるのは、酵素がすべて使われているから']],
    tasks: ['最適温度を見つける（反応速度 95% 以上）', '60℃以上にして失活させる', 'ペプシンで最適pHを見つける'],
    mount: function (stage, ctl, api) {
      var e = 'amy', T = 25, pH = 7, S = 60, cmp = false, gsel = 0;
      BL.ui.seg(ctl, '酵素', [['amy', 'アミラーゼ'], ['pep', 'ペプシン'], ['try', 'トリプシン'], ['cat', 'カタラーゼ']], e, function (v) { e = v; upd(); });
      var sT = BL.ui.slider(ctl, { label: '温度', min: 0, max: 80, value: T, unit: '℃', on: function (v) { T = v; gsel = 0; upd(); } });
      var sP = BL.ui.slider(ctl, { label: 'pH', min: 0, max: 14, step: .5, value: pH, on: function (v) { pH = v; gsel = 1; upd(); } });
      BL.ui.slider(ctl, { label: '基質の濃さ', min: 0, max: 100, value: S, unit: '%', on: function (v) { S = v; gsel = 2; upd(); } });
      BL.ui.seg(ctl, '比べる', [[false, 'なし'], [true, '無機触媒も']], cmp, function (v) { cmp = v; upd(); });
      var m = BL.ui.meter(ctl, ['反応の速さ', '基質 → 生成物', '酵素のようす']);
      var cv = BL.el('canvas', { width: 520, height: 210, style: 'width:100%;max-width:640px;border-radius:4px;background:var(--water);' + (BL.narrow() ? 'max-height:34%;object-fit:contain' : '') });
      var gwrap = BL.el('div', { style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;width:100%' });
      var col = BL.el('div', { style: 'display:flex;flex-direction:column;gap:8px;width:100%;align-items:center' }); col.appendChild(cv); col.appendChild(gwrap); stage.appendChild(col);
      var ctx = cv.getContext('2d'), parts = [], enz = [], prods = [];
      for (var i = 0; i < 6; i++) enz.push({ x: 60 + i * 80, y: 60 + (i % 2) * 90, vx: Math.random() - .5, vy: Math.random() - .5, a: Math.random() * 6, busy: 0 });
      function rate() { var Km = 25; return act(T, pH, ENZ[e].ph) * S / (Km + S) * (100 + 25) / 100; }
      function upd() {
        var r = rate(), opt = ENZ[e].ph, dead = T >= 60;
        m([Math.round(r * 100) + '%', ENZ[e].s, dead ? '変性（失活）' : (act(T, pH, opt) > .9 ? 'よくはたらく' : act(T, pH, opt) > .3 ? 'はたらく' : 'あまりはたらかない')], [0, 0, dead]);
        if (act(T, 7, 7) > .95 && S > 0) api.task(0);
        if (T >= 60) api.task(1);
        if (e === 'pep' && act(T, pH, opt) / act(T, opt, opt) > .97 && Math.abs(pH - 2) <= .5) api.task(2);
        var tp = [], tpi = [], pp = [], sp = [];
        for (var x = 0; x <= 80; x += 1) { tp.push([x, act(x, pH, opt) * 100]); tpi.push([x, Math.min(100, 8 * Math.exp((x - 0) / 22))]); }
        for (var y = 0; y <= 14; y += .25) pp.push([y, act(T, y, opt) * 100]);
        for (var z = 0; z <= 100; z += 2) sp.push([z, act(T, pH, opt) * z / (25 + z) * 125]);
        var ser = [{ pts: tp, c: 'var(--accent)', label: '酵素' }];
        if (cmp) ser.push({ pts: tpi, c: 'var(--muted)', dash: '5 4', label: '無機触媒' });
        var gs = [BL.plot({ w: 240, h: 170, x: [0, 80], y: [0, 100], xt: [0, 20, 40, 60, 80], yt: [0, 50, 100], xl: '温度（℃）', yl: '速さ', series: ser, marks: [{ x: T, y: act(T, pH, opt) * 100 }] }),
          BL.plot({ w: 240, h: 170, x: [0, 14], y: [0, 100], xt: [0, 2, 4, 6, 8, 10, 12, 14], yt: [0, 50, 100], xl: 'pH', yl: '速さ', series: [{ pts: pp, c: 'var(--c3)' }], marks: [{ x: pH, y: act(T, pH, opt) * 100 }] }),
          BL.plot({ w: 240, h: 170, x: [0, 100], y: [0, 100], xt: [0, 50, 100], yt: [0, 50, 100], xl: '基質の濃さ（%）', yl: '速さ', series: [{ pts: sp, c: 'var(--c5)' }], marks: [{ x: S, y: act(T, pH, opt) * S / (25 + S) * 125 }] })];

        if (BL.narrow()) { gwrap.style.gridTemplateColumns = '1fr'; gwrap.innerHTML = '<div style="max-width:290px;margin:0 auto;width:100%">' + gs[gsel].replace('viewBox="0 0 240 170"', 'viewBox="0 0 240 170"') + '</div>'; }
        else gwrap.innerHTML = gs.map(function (g) { return '<div>' + g + '</div>'; }).join('');
      }
      var css = getComputedStyle(document.documentElement);
      function C(n) { return css.getPropertyValue(n).trim() || '#888'; }
      var stop = BL.loop(function (dt) {
        var W = cv.width, H = cv.height, want = Math.round(S / 3), r = rate(), dead = T >= 60, spd = .4 + T / 40;
        while (parts.length < want) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40 });
        while (parts.length > want) parts.pop();
        ctx.clearRect(0, 0, W, H);
        parts.forEach(function (p) { p.x += p.vx * dt * spd; p.y += p.vy * dt * spd; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; });
        enz.forEach(function (z) {
          z.x += z.vx * 30 * dt * spd; z.y += z.vy * 30 * dt * spd; if (z.x < 30 || z.x > W - 30) z.vx *= -1; if (z.y < 30 || z.y > H - 30) z.vy *= -1;
          if (z.busy > 0) { z.busy -= dt; if (z.busy <= 0) { prods.push({ x: z.x, y: z.y, t: 1.6, vx: 30, vy: -20 }, { x: z.x, y: z.y, t: 1.6, vx: -30, vy: 20 }); } }
          else if (!dead) {
            for (var i = 0; i < parts.length; i++) { var p = parts[i]; if (Math.hypot(p.x - z.x, p.y - z.y) < 26 && Math.random() < r * 0.5) { z.busy = .35; parts.splice(i, 1); break; } }
          }
          ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a); ctx.fillStyle = C('--accent'); ctx.beginPath();
          if (dead) { for (var k = 0; k <= 12; k++) { var aa = k / 12 * Math.PI * 2, rr = 18 + Math.sin(k * 3) * 6; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.globalAlpha = .45; }
          else { ctx.arc(0, 0, 20, 0.45, Math.PI * 2 - 0.45); ctx.lineTo(4, 0); }
          ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
          if (z.busy > 0) { ctx.fillStyle = C('--warm'); ctx.beginPath(); ctx.arc(10, 0, 7, 0, 7); ctx.fill(); }
          ctx.restore();
        });
        ctx.fillStyle = C('--warm'); parts.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.fill(); });
        ctx.fillStyle = C('--c3');
        prods = prods.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = Math.max(0, p.t / 1.6); ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, 7); ctx.fill(); return p.t > 0; });
        ctx.globalAlpha = 1; ctx.fillStyle = C('--ink'); ctx.font = '12px sans-serif';
        ctx.fillText('緑＝酵素　オレンジ＝基質　青＝生成物', 8, H - 8);
      });
      upd();
      return stop;
    }
  });

  /* ---------- 光合成 ---------- */
  var PL = { sun: { n: '陽生植物', R: 4, P: 24, k: 18 }, shade: { n: '陰生植物', R: 1, P: 7, k: 7 } };
  function gross(p, L, co2) { var f = co2 === 'low' ? .55 : co2 === 'high' ? 1.35 : 1; return p.P * f * (1 - Math.exp(-L / (p.k * f))); }
  BL.addSim({
    id: 'photo', name: '光合成と呼吸', cat: '細胞', subj: 'kiso', ic: '光', lead: '光の強さを変えると、葉の CO₂ の出入りはどう変わる？',
    how: '<p>植物は<b class="key">光合成</b>（CO₂ を吸収）と<b class="key">呼吸</b>（CO₂ を放出）を同時に行っている。外から測れるのは差し引きの<b class="key">見かけの光合成速度</b>。</p><div class="box">光合成速度 ＝ 見かけの光合成速度 ＋ 呼吸速度</div><p>CO₂ の出入りがちょうど 0 になる光の強さが<b class="key">光補償点</b>。それ以上強くしても速さが増えなくなる点が<b class="key">光飽和点</b>。</p><p><b class="key">陽生植物</b>（ススキ・アカマツなど）は呼吸速度も光飽和点も大きく、強い光の下でよく育つ。<b class="key">陰生植物</b>（アオキ・ドクダミなど）は光補償点が低く、弱い光でも生きられる。</p><p>光が十分あるときは CO₂ 濃度が足りなくて頭打ちになる（<b class="key">限定要因</b>）。</p>',
    pts: [[1, '光補償点では、光合成速度＝呼吸速度'], [1, '陰生植物は光補償点・光飽和点が低い'], [0, '暗い所では植物は呼吸しない → ×（いつも呼吸している）'], [1, '光飽和点より強い光では、CO₂濃度や温度が限定要因']],
    tasks: ['光補償点を見つける（CO₂ の出入りがほぼ 0）', '光飽和を確かめる（光をいちばん強く）', '陰生植物の光補償点を見つける'],
    mount: function (stage, ctl, api) {
      var pl = 'sun', L = 30, co2 = 'mid';
      BL.ui.seg(ctl, '植物', [['sun', '陽生植物'], ['shade', '陰生植物']], pl, function (v) { pl = v; upd(); });
      BL.ui.slider(ctl, { label: '光の強さ', min: 0, max: 100, step: .5, value: L, unit: '', fmt: function (v) { return v + ' klx'; }, on: function (v) { L = v; upd(); } });
      BL.ui.seg(ctl, 'CO₂濃度', [['low', 'うすい'], ['mid', 'ふつう'], ['high', 'こい']], co2, function (v) { co2 = v; upd(); });
      var m = BL.ui.meter(ctl, ['光合成速度', '呼吸速度', '見かけの光合成', 'CO₂ の出入り']);
      function upd() {
        var p = PL[pl], g = gross(p, L, co2), a = g - p.R;
        m([BL.fmt(g), BL.fmt(p.R), BL.fmt(a), Math.abs(a) < .25 ? '出入りなし' : a > 0 ? '吸収' : '放出'], [0, 0, 1, 0]);
        if (Math.abs(a) < .25) { api.task(0); if (pl === 'shade') api.task(2); }
        if (L >= 100) api.task(1);
        var sun = '<circle cx="60" cy="50" r="' + (14 + L / 6) + '" fill="#f3c34a" opacity="' + (.25 + L / 140) + '"/><circle cx="60" cy="50" r="16" fill="#f3c34a"/>';
        var leaf = '<path d="M150 230 Q260 80 420 120 Q380 260 150 230Z" fill="var(--leaf)" stroke="var(--leaf2)" stroke-width="3"/><path d="M150 230 Q290 170 420 120" stroke="var(--leaf2)" stroke-width="2" fill="none"/>';
        var aw = Math.min(14, Math.abs(a) * 0.8 + 2), arrow;
        if (Math.abs(a) < .25) arrow = '<text x="300" y="300" text-anchor="middle" font-size="16" font-weight="700" fill="var(--ink)">CO₂ の出入りなし（光補償点）</text>';
        else if (a > 0) arrow = '<line x1="480" y1="300" x2="360" y2="200" stroke="var(--c3)" stroke-width="' + aw + '" marker-end="url(#ah)"/><text x="490" y="320" font-size="16" font-weight="700" fill="var(--c3)">CO₂ を吸収</text><line x1="230" y1="160" x2="170" y2="70" stroke="var(--accent)" stroke-width="' + Math.max(2, aw * .8) + '" marker-end="url(#ahg)"/><text x="120" y="60" font-size="15" font-weight="700" fill="var(--accent)">O₂</text>';
        else arrow = '<line x1="340" y1="200" x2="470" y2="300" stroke="var(--warm)" stroke-width="' + aw + '" marker-end="url(#aho)"/><text x="470" y="325" font-size="16" font-weight="700" fill="var(--warm)">CO₂ を放出</text>';
        var defs = '<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--c3)"/></marker><marker id="ahg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker><marker id="aho" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--warm)"/></marker></defs>';
        var pic = '<svg class="svgfig" viewBox="0 0 600 340" style="max-height:' + (BL.narrow() ? 120 : 260) + 'px">' + defs + '<rect width="600" height="340" fill="var(--sky)" opacity="' + (.3 + L / 150) + '"/>' + sun + leaf + arrow + '</svg>';
        var ser = [], marks = [], vls = [];
        ['sun', 'shade'].forEach(function (k) {
          var q = PL[k], pts = [];
          for (var x = 0; x <= 100; x += 1) pts.push([x, gross(q, x, co2) - q.R]);
          ser.push({ pts: pts, c: k === 'sun' ? 'var(--warm)' : 'var(--c3)', label: q.n, dash: k === pl ? '' : '4 4', w: k === pl ? 3 : 1.6 });
        });
        var comp = -p.k * Math.log(1 - p.R / gross(p, 1e6, co2)), sat = p.k * (co2 === 'low' ? .55 : co2 === 'high' ? 1.35 : 1) * Math.log(20);
        vls.push({ x: comp, c: 'var(--accent)', t: '補償点' }, { x: sat, c: 'var(--muted)', t: '飽和点' });
        marks.push({ x: L, y: a });
        var gr = BL.plot({ w: 560, h: 240, x: [0, 100], y: [-6, 32], xt: [0, 20, 40, 60, 80, 100], yt: [-5, 0, 10, 20, 30], xl: '光の強さ（klx）', yl: 'CO₂吸収速度（見かけの光合成速度）', series: ser, marks: marks, vl: vls, hl: [{ y: 0, c: 'var(--ink)' }] });
        stage.innerHTML = '<div style="width:100%;max-width:640px;display:flex;flex-direction:column;gap:6px">' + pic + gr + '</div>';
      }
      upd();
    }
  });
})();
