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
      /* 粒子のようす（SVG のイラスト：酵素・基質・生成物・酵素-基質複合体・変性した酵素） */
      var cv = BL.el('div', { style: 'width:100%;max-width:640px;border-radius:4px;overflow:hidden;background:var(--water);' + (BL.narrow() ? 'max-height:34%' : '') });
      cv.width = 520; cv.height = 210;
      var I = BL.ill, EZ = '';
      for (var q = 0; q < 6; q++) EZ += '<g id="ez-f' + q + '">' + I.enzyme({ seed: q + 3 }) + '</g><g id="ez-b' + q + '">' + I.enzyme({ seed: q + 3, state: 'bound' }) + '</g><g id="ez-u' + q + '">' + I.enzyme({ seed: q + 3, state: 'unf', unf: .55 }) + '</g><g id="ez-d' + q + '">' + I.enzyme({ seed: q + 3, state: 'denat' }) + '</g>';
      EZ += '<g id="ez-s">' + I.substrate({ at: -7 }) + '</g><g id="ez-p">' + I.product() + '</g>';
      cv.innerHTML = '<svg viewBox="0 0 520 210" style="display:block;width:100%;height:auto">' + I.lifeDefs() + '<defs>' + EZ + '</defs><g class="ez-dyn"></g></svg>';
      var dyn = cv.querySelector('.ez-dyn');
      var gwrap = BL.el('div', { style: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;width:100%' });
      var col = BL.el('div', { style: 'display:flex;flex-direction:column;gap:8px;width:100%;align-items:center' }); col.appendChild(cv); col.appendChild(gwrap); stage.appendChild(col);
      var parts = [], enz = [], prods = [];
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
      var stop = BL.loop(function (dt) {
        var W = cv.width, H = cv.height, want = Math.round(S / 3), r = rate(), dead = T >= 60, spd = .4 + T / 40;
        while (parts.length < want) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 40, vy: (Math.random() - .5) * 40, a: Math.random() * 360, va: (Math.random() - .5) * 90 });
        while (parts.length > want) parts.pop();
        var out = '', unf = T >= 60 ? 'd' : T >= 47 ? 'u' : '';
        parts.forEach(function (p) { p.x += p.vx * dt * spd; p.y += p.vy * dt * spd; p.a += p.va * dt * spd; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; });
        enz.forEach(function (z, zi) {
          z.x += z.vx * 30 * dt * spd; z.y += z.vy * 30 * dt * spd; if (z.x < 34 || z.x > W - 34) z.vx *= -1; if (z.y < 34 || z.y > H - 50) z.vy *= -1;
          z.a += (z.va || (z.va = (Math.random() - .5) * .8)) * dt * spd;
          if (z.busy > 0) { z.busy -= dt; if (z.busy <= 0) { var ca = Math.cos(z.a), sa = Math.sin(z.a), bx = z.x + ca * 34, by = z.y + sa * 34; prods.push({ x: bx - ca * 6, y: by - sa * 6, t: 1.6, vx: 30 * ca - 20 * sa, vy: 30 * sa + 20 * ca, a: Math.random() * 360 }, { x: bx + ca * 6, y: by + sa * 6, t: 1.6, vx: 34 * ca + 18 * sa, vy: 34 * sa - 18 * ca, a: Math.random() * 360 }); } }
          else if (!dead) {
            for (var i = 0; i < parts.length; i++) { var p = parts[i]; if (Math.hypot(p.x - z.x, p.y - z.y) < 36 && Math.random() < r * 0.5) { z.busy = .45; parts.splice(i, 1); break; } }
          }
          var id = dead ? 'd' : z.busy > 0 ? 'b' : unf || 'f';
          out += '<use href="#ez-' + id + (zi % 6) + '" transform="translate(' + z.x.toFixed(1) + ' ' + z.y.toFixed(1) + ') rotate(' + (z.a * 57.3).toFixed(1) + ') scale(1.45)"/>';
        });
        parts.forEach(function (p) { out += '<use href="#ez-s" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + p.a.toFixed(0) + ') scale(1.1)"/>'; });
        prods = prods.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; out += '<use href="#ez-p" opacity="' + Math.max(0, Math.min(1, p.t / .8)).toFixed(2) + '" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + (p.a += dt * 40).toFixed(0) + ')"/>'; return p.t > 0; });
        var lg = '<rect x="4" y="' + (H - 26) + '" width="318" height="22" rx="4" fill="var(--panel)" opacity=".82"/><g font-size="12" fill="var(--ink)" paint-order="stroke" stroke="var(--water)" stroke-width="3"><use href="#ez-f0" transform="translate(16 ' + (H - 13) + ') scale(.42)"/><text x="28" y="' + (H - 9) + '">酵素</text><use href="#ez-s" transform="translate(78 ' + (H - 13) + ') scale(.7)"/><text x="94" y="' + (H - 9) + '">基質</text><use href="#ez-b0" transform="translate(140 ' + (H - 13) + ') scale(.42)"/><text x="158" y="' + (H - 9) + '">酵素-基質複合体</text><use href="#ez-p" transform="translate(268 ' + (H - 13) + ') scale(.8)"/><text x="278" y="' + (H - 9) + '">生成物</text>' + (dead ? '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-weight="700" fill="var(--warm)">高温で立体構造がこわれた（変性・失活）</text>' : unf ? '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-weight="700" fill="var(--warm)">立体構造がくずれ始めている</text>' : '') + '</g>';
        dyn.innerHTML = out + lg;
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
        for (var ri = 0; ri < Math.round(L / 14); ri++) { var ry = 70 + ri * 18; sun += '<line x1="80" y1="' + (60 + ri * 4) + '" x2="' + (190 + ri * 6) + '" y2="' + (ry + 40) + '" stroke="#f3c34a" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>'; }
        var leaf = '<defs><linearGradient id="lfg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="var(--leaf2)"/><stop offset="1" stop-color="var(--leaf)"/></linearGradient></defs><path d="M120 250 L150 230" stroke="var(--leaf2)" stroke-width="5" stroke-linecap="round"/><path d="M150 230 Q240 70 430 110 Q400 270 150 230Z" fill="url(#lfg)" stroke="var(--leaf2)" stroke-width="3"/><path d="M150 230 Q300 165 430 110" stroke="#dfeec8" stroke-width="3" fill="none"/>' + [[200, 205, 215, 140], [250, 186, 280, 118], [300, 165, 340, 112], [350, 142, 390, 112], [230, 196, 270, 240], [290, 172, 340, 232], [350, 148, 395, 200]].map(function (v) { return '<path d="M' + v[0] + ' ' + v[1] + ' Q' + ((v[0] + v[2]) / 2 + 6) + ' ' + ((v[1] + v[3]) / 2 - 4) + ' ' + v[2] + ' ' + v[3] + '" stroke="#cfe3b4" stroke-width="1.6" fill="none"/>'; }).join('') +
          '<g transform="translate(470 30)"><circle cx="55" cy="55" r="52" fill="var(--panel)" stroke="var(--ink)"/><ellipse cx="38" cy="55" rx="12" ry="26" fill="#9fcf7a" stroke="#4f7a3a"/><ellipse cx="72" cy="55" rx="12" ry="26" fill="#9fcf7a" stroke="#4f7a3a"/><ellipse cx="55" cy="55" rx="' + (2 + L / 30) + '" ry="20" fill="#2d3a26"/>' + [[32, 45], [40, 66], [70, 44], [76, 64]].map(function (q) { return '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="3.5" ry="2.2" fill="#2f7a2f"/>'; }).join('') + '<text x="55" y="122" text-anchor="middle" font-size="13" fill="var(--ink)">気孔（拡大）</text></g><line x1="380" y1="150" x2="476" y2="100" stroke="var(--muted)" stroke-dasharray="3 3"/>';
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
