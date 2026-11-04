/* 見る：遷移・バイオーム・個体群 */
(function () {
  /* ---------- 植生の遷移 ---------- */
  var ST = [
    { y: 0, n: '裸地', d: '溶岩が冷えたあとなど。土壌がなく、栄養分も水分も少ない。' },
    { y: 15, n: '荒原', d: '<b>先駆種（パイオニア種）</b>の地衣類・コケ植物が入りこむ。岩が風化し、枯れた体が積もって土壌ができ始める。' },
    { y: 40, n: '草原', d: 'ススキ・イタドリなど、風で種子が運ばれる草本がふえる。土壌が厚くなる。' },
    { y: 70, n: '低木林', d: 'ヤシャブシ・ヌルデなどの低木が育つ。' },
    { y: 110, n: '陽樹林', d: 'アカマツ・コナラなどの<b>陽樹</b>の林。成長が速いが、林床が暗くなると陽樹の芽ばえは育たない。' },
    { y: 180, n: '混交林', d: '暗い林床でも育つ<b>陰樹</b>（スダジイ・タブノキ・アラカシ）の幼木が成長し、陽樹と混ざる。' },
    { y: 260, n: '陰樹林（極相林）', d: '陰樹が優占する林。陰樹の芽ばえは暗い林床でも育つので、ほぼ安定する＝<b>極相</b>（クライマックス）。倒木でできた<b>ギャップ</b>では陽樹が育つことも。' }
  ];
  function stageAt(y) { var k = 0; ST.forEach(function (s, i) { if (y >= s.y) k = i; }); return k; }
  function rnd(i) { var x = Math.sin(i * 99.13) * 1e4; return x - Math.floor(x); }
  function c01(v) { return Math.max(0, Math.min(1, v)); }
  /* 遷移の図にでてくる植物の個体（生まれる年・枯れる年・位置を決めておく → 動かしてもちらつかない）
     z: 0＝奥の列、1＝手前の列 */
  var SPN = { pine: 'アカマツ（陽樹）', kon: 'コナラ（陽樹）', shii: 'スダジイ（陰樹）', tabu: 'タブノキ（陰樹）', ysh: 'ヤシャブシ（低木）', sus: 'ススキ', ita: 'イタドリ', fern: 'シダ植物', moss: 'コケ植物・地衣類' };
  var IND = (function () {
    var L = [];
    function add(sp, xs, b, d, hm, tau) { xs.forEach(function (x, i) { L.push({ sp: sp, x: x, b: b[i], d: d ? d[i] : 1e9, hm: hm * (.88 + rnd(L.length + 3) * .2), tau: tau, z: sp === 'grass' ? (i >> 1) % 2 : i % 2, seed: i + 1, flip: rnd(L.length + 40) < .5 }); }); }
    add('pine', [96, 214, 318, 452, 560, 664, 728], [72, 76, 81, 86, 90, 95, 100], [212, 246, 228, 262, 252, 286, 274], 290, 30);
    add('kon', [150, 384, 506, 618, 262], [80, 86, 92, 98, 104], [236, 270, 252, 294, 330], 250, 32);
    add('shii', [120, 270, 430, 590, 706, 180, 350, 640, 520, 470], [118, 126, 136, 146, 156, 168, 198, 220, 244, 266], null, 300, 52);
    add('tabu', [236, 400, 548, 680], [130, 150, 176, 232], null, 280, 52);
    add('ysh', [110, 200, 300, 390, 480, 570, 660, 730], [52, 56, 60, 64, 68, 72, 76, 80], [152, 166, 178, 190, 204, 216, 228, 240], 96, 12);
    add('grass', [90, 136, 178, 228, 270, 318, 360, 408, 446, 494, 536, 580, 622, 668, 708, 744], [22, 24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 48, 51, 53, 56, 58], [126, 150, 118, 170, 136, 196, 144, 160, 210, 128, 180, 140, 232, 154, 190, 260], 76, 6);
    add('fern', [160, 330, 455, 610, 700, 250], [160, 172, 184, 196, 214, 236], null, 34, 14);
    return L;
  })();
  var ROCK = [[92, 110], [236, 84], [378, 120], [520, 90], [652, 112], [748, 70]];
  function hOf(p, e) { return e < p.b || e >= p.d ? 0 : p.hm * (1 - Math.exp(-(e - p.b) / p.tau)); }
  function drawPlant(p, h, y) {
    var I = BL.ill, o = { seed: p.seed, flip: p.flip };
    if (p.sp === 'pine') { o.young = h < 140; return I.akamatsu(p.x, y, h, o); }
    if (p.sp === 'kon') return I.konara(p.x, y, h, o);
    if (p.sp === 'shii') return I.sudajii(p.x, y, h, o);
    if (p.sp === 'tabu') return I.tabunoki(p.x, y, h, o);
    if (p.sp === 'ysh') return I.yashabushi(p.x, y, h, o);
    if (p.sp === 'fern') return I.fern(p.x, y, h, o);
    return p.seed % 2 ? I.susuki(p.x, y, h, o) : I.itadori(p.x, y, h * .95, o);
  }
  BL.addSim({
    id: 'succession', name: '植生の遷移', cat: '生態系', subj: 'kiso', ic: '遷', lead: '裸地から森林へ。何百年もの変化を早送りで見る',
    how: '<p>ある場所の植生が、長い時間をかけて移り変わることを<b class="key">遷移</b>という。</p><div class="box"><b>一次遷移</b>：土壌のない所（溶岩の跡など）から始まる。<br>裸地 → 荒原 → 草原 → 低木林 → <b class="key">陽樹林</b> → 混交林 → <b class="key">陰樹林</b>（<b class="key">極相</b>）</div><p>森林が育つと<b class="key">林床</b>が暗くなる。陽樹の芽ばえは暗い所で育たないが、<b class="key">陰樹</b>の芽ばえは育つ。だから陽樹林は陰樹林に移っていく。</p><p><b class="key">二次遷移</b>：山火事・伐採のあとなど、土壌や種子・根が残った所から始まる。一次遷移より速い。</p>',
    pts: [[1, '遷移が進むと、土壌が厚くなり、林床は暗くなる'], [1, '陽樹は光補償点が高く、暗い林床では芽ばえが育たない'], [0, '二次遷移は一次遷移より時間がかかる → ×（土壌があるので速い）'], [1, '極相林でもギャップができると、陽樹が育つことがある']],
    tasks: ['陽樹林まで進める', '極相（陰樹林）まで進める', '二次遷移を見る'],
    mount: function (stage, ctl, api) {
      var yr = 0, mode = 1, play = null;
      BL.ui.seg(ctl, '始まり', [[1, '一次遷移（溶岩）'], [2, '二次遷移（山火事のあと）']], mode, function (v) { mode = v; yr = 0; sl.set(0); draw(); if (v === 2) api.task(2); });
      var sl = BL.ui.slider(ctl, { label: '年数', min: 0, max: 300, value: 0, unit: ' 年', on: function (v) { yr = v; draw(); } });
      var pb = BL.ui.btn(ctl, '▶ 早送り', function () { if (play) { clearInterval(play); play = null; pb.textContent = '▶ 早送り'; return; } if (yr >= 300) yr = 0; pb.textContent = '■ 止める'; play = setInterval(function () { yr = Math.min(300, yr + 3); sl.set(yr); draw(); if (yr >= 300) { clearInterval(play); play = null; pb.textContent = '▶ 早送り'; } }, 60); }, 'main');
      var m = BL.ui.meter(ctl, ['段階', '林床の明るさ', '土壌の厚さ']);
      var info = BL.ui.box(ctl, 'info', '');
      var gr = BL.el('div'); ctl.appendChild(gr);
      function eff(y) { return mode === 2 ? Math.min(300, y * 2 + 40) : y; }
      function light(e) { return Math.max(3, 100 - 97 / (1 + Math.exp(-(e - 95) / 22))); }
      function soil(e) { return Math.min(100, e * .45); }
      function draw() {
        var e = eff(yr), k = stageAt(e), W = 800, H = 590, G = 430, K = BL.narrow() ? 1.75 : 1, lt = light(e), dk = 1 - lt / 100, so = soil(e);
        var s = '<svg class="svgfig" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:900px" role="img" aria-label="植生の遷移の図：' + ST[k].n + '">' + BL.ill.defs('sc');
        s += '<defs><linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky)"/><stop offset="1" stop-color="var(--panel)"/></linearGradient>' +
          '<linearGradient id="sc-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06140a" stop-opacity="0"/><stop offset=".55" stop-color="#06140a" stop-opacity=".55"/><stop offset="1" stop-color="#06140a" stop-opacity=".9"/></linearGradient>' +
          '<linearGradient id="sc-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient>' +
          '<linearGradient id="sc-hum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2016"/><stop offset="1" stop-color="#4e3624"/></linearGradient>' +
          '<linearGradient id="sc-min" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5a3c"/><stop offset="1" stop-color="#9a7a56"/></linearGradient>' +
          '<linearGradient id="sc-bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4440"/><stop offset="1" stop-color="#2a2624"/></linearGradient>' +
          '<radialGradient id="sc-sun"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="#ffd85a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd85a" stop-opacity="0"/></radialGradient>' +
          '<pattern id="sc-ves" width="26" height="18" patternUnits="userSpaceOnUse"><ellipse cx="6" cy="5" rx="2.2" ry="1.4" fill="#171412"/><ellipse cx="18" cy="12" rx="1.6" ry="1" fill="#171412"/><ellipse cx="22" cy="3" rx="1" ry=".7" fill="#171412"/><path d="M2 14l5 -2" stroke="#5e5650" stroke-width=".8"/></pattern></defs>';
        /* 空・遠くの山・太陽 */
        s += '<rect width="' + W + '" height="' + G + '" fill="url(#sc-sky)"/><circle cx="742" cy="62" r="58" fill="url(#sc-sun)"/><circle cx="742" cy="62" r="17" fill="#ffe27a"/>';
        s += '<path d="M0 ' + (G - 120) + ' Q120 ' + (G - 190) + ' 250 ' + (G - 140) + ' T520 ' + (G - 150) + ' T800 ' + (G - 130) + ' V' + G + ' H0Z" fill="#8fa89a" opacity=".35"/><path d="M0 ' + (G - 70) + ' Q180 ' + (G - 120) + ' 360 ' + (G - 80) + ' T800 ' + (G - 90) + ' V' + G + ' H0Z" fill="#7d9a86" opacity=".35"/>';
        /* 土壌の断面：岩石（溶岩）の上に、風化した層・土壌・腐植層が積もっていく */
        var hu = e < 12 ? 0 : Math.min(30, so * .3), ms = e < 12 ? 0 : so * .44, wz = 6 + Math.min(18, e * .12);
        function band(y0, th, fill, seed) { var d = 'M0 ' + y0.toFixed(1); for (var x = 0; x <= W; x += 40) d += ' L' + x + ' ' + (y0 + th + Math.sin(x / 47 + seed) * Math.min(4, th * .25)).toFixed(1); return '<path d="' + d + ' L' + W + ' ' + y0.toFixed(1) + 'Z" fill="' + fill + '"/>'; }
        s += '<rect y="' + G + '" width="' + W + '" height="' + (H - G) + '" fill="url(#sc-bed)"/><rect y="' + G + '" width="' + W + '" height="' + (H - G) + '" fill="url(#sc-ves)" opacity=".8"/>';
        s += band(G, hu + ms + wz, '#6a5e52', 1);
        var rub = ''; for (var i = 0; i < 46; i++) { var rx = rnd(i + 300) * W, ry = G + hu + ms + rnd(i + 340) * wz * .9; rub += '<ellipse cx="' + rx.toFixed(1) + '" cy="' + ry.toFixed(1) + '" rx="' + (2 + rnd(i + 380) * 5).toFixed(1) + '" ry="' + (1.5 + rnd(i + 420) * 3).toFixed(1) + '" fill="' + (i % 3 ? '#4e4740' : '#7a7068') + '"/>'; }
        s += rub;
        if (ms > 0) s += band(G, hu + ms, 'url(#sc-min)', 2);
        if (hu > 0) s += band(G, hu, 'url(#sc-hum)', 3);
        /* 根 */
        var roots = '';
        IND.forEach(function (p) { var h = hOf(p, e); if (!h || p.z === 0 || p.sp === 'fern') return; var dep = Math.min(hu + ms + wz * .5, h * .4); for (var j = 0; j < 4; j++) { var a = (j - 1.5) * .7 + (rnd(p.x + j) - .5) * .4; roots += 'M' + p.x + ' ' + G + 'q' + (Math.sin(a) * dep * .3).toFixed(1) + ' ' + (dep * .5).toFixed(1) + ' ' + (Math.sin(a) * dep * .9).toFixed(1) + ' ' + (dep * (.7 + rnd(p.x + j + 9) * .3)).toFixed(1); } });
        if (roots) s += '<path d="' + roots + '" stroke="#3a2616" stroke-width="1.2" fill="none" opacity=".75" stroke-linecap="round"/>';
        if (hu > 4) { var lit = ''; for (i = 0; i < 70; i++) lit += 'M' + (rnd(i + 500) * W).toFixed(1) + ' ' + (G + rnd(i + 560) * 3).toFixed(1) + 'l' + (2 + rnd(i) * 3).toFixed(1) + ' ' + ((rnd(i + 7) - .5) * 2).toFixed(1); s += '<path d="' + lit + '" stroke="' + (e > 150 ? '#8a6a3a' : '#a08850') + '" stroke-width="1.6" stroke-linecap="round"/>'; }
        var lab = function (x, y, t, anc) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anc || 'end') + '" font-size="' + (11 * K).toFixed(1) + '" font-weight="700" fill="#fff" stroke="#1a120c" stroke-width="' + (3 * K).toFixed(1) + '" stroke-opacity=".75" paint-order="stroke">' + t + '</text>'; };
        var ly = G + 13 * K;
        if (hu > 9 * K) { s += lab(W - 8, G + hu / 2 + 4 * K, '落葉・腐植層'); }
        if (ms > 10 * K) s += lab(W - 8, G + hu + ms / 2 + 4 * K, '土壌（腐植＋風化した岩石）');
        s += lab(W - 8, Math.max(G + hu + ms + wz + 14 * K, H - 22 * K), '岩石（溶岩）');
        if (e < 12) s += lab(W - 8, ly, '土壌はまだない');
        /* 岩と、その上の地衣類・コケ植物（土が積もるとうもれていく） */
        var rocks = '';
        ROCK.forEach(function (q, j) {
          var sink = Math.min(1, (hu + ms) / 42) * 22 + (e > 70 ? (e - 70) * .6 : 0); if (sink > 26) return;
          rocks += BL.ill.mossRock(q[0], G + sink * .9, q[1] * (1 - sink / 60), { seed: j + 1, lava: 1, lichen: c01((e - 6) / 18), moss: c01((e - 14) / 24) });
        });
        /* 植物を高さの順に（奥の列 → 手前の列、背の高いものから） */
        var vis = IND.map(function (p) { return { p: p, h: hOf(p, e) }; }).filter(function (v) { return v.h > 2; });
        function row(z) {
          var t = '';
          vis.filter(function (v) { return v.p.z === z; }).sort(function (a, b) { return b.h - a.h; }).forEach(function (v) { t += drawPlant(v.p, z ? v.h : v.h * .84, z ? G + 2 : G - 6); });
          return t;
        }
        /* 倒木（枯れたあと 40 年ほど） */
        var logs = '';
        IND.forEach(function (p) { if ((p.sp === 'pine' || p.sp === 'kon') && e >= p.d && e < p.d + 45) logs += BL.ill.log(p.x + (p.flip ? -30 : 30), G + 3, 70, { seed: p.seed, flip: p.flip }); });
        s += row(0) + '<rect width="' + W + '" height="' + G + '" fill="var(--sky)" opacity=".28"/>' + rocks + row(1) + logs;
        /* 林床の暗さ */
        if (dk > .05) s += '<rect y="' + (G - 170) + '" width="' + W + '" height="172" fill="url(#sc-dark)" opacity="' + (dk * .75).toFixed(2) + '" pointer-events="none"/>';
        /* 芽ばえ：陽樹（暗いと枯れる）と陰樹（暗くても育つ） */
        var tags = [];
        if (e >= 108) {
          [[232, 'shade', 1], [474, 'shade', 2], [652, 'shade', 3]].forEach(function (q, j) { s += BL.ill.seedling(q[0], G + 2, 36, { kind: 'shade', seed: q[2] }); if (!j) tags.push([q[0], G - 40, '陰樹の芽ばえ（育つ）', 0]); });
          [[296, 1], [586, 2]].forEach(function (q, j) { s += BL.ill.seedling(q[0], G + 2, 32, { kind: 'sun', weak: lt < 30, seed: q[1] }); if (!j) tags.push([q[0], G - 36, lt < 30 ? '陽樹の芽ばえ（暗くて育たない）' : '陽樹の芽ばえ', 0]); });
        }
        /* ギャップ（倒木のあとの明るい所）では陽樹の芽ばえが育つ */
        var gap = e >= 262 && e < 330;
        if (gap) { s += '<path d="M430 0 L500 0 L480 ' + G + ' L420 ' + G + 'Z" fill="url(#sc-beam)" opacity=".7"/>' + BL.ill.seedling(452, G + 2, 42, { kind: 'sun', seed: 4 }); tags.push([452, G - 48, 'ギャップ：陽樹も育つ', 0]); }
        /* 木もれ日（光の筋） */
        if (dk > .3) { [[560, 140], [340, 120], [150, 100]].forEach(function (q) { s += '<path d="M' + q[0] + ' ' + (G - 230) + ' L' + (q[0] + 26) + ' ' + (G - 230) + ' L' + (q[0] - 110) + ' ' + G + ' L' + (q[0] - 110 - q[1] * .2) + ' ' + G + 'Z" fill="url(#sc-beam)" opacity="' + (.14 + dk * .14).toFixed(2) + '" pointer-events="none"/>'; }); }
        /* 種名ラベル（その種でいちばん目立つ個体の上） */
        var best = {};
        vis.forEach(function (v) { var key = v.p.sp === 'grass' ? (v.p.seed % 2 ? 'sus' : 'ita') : v.p.sp; if (v.p.z !== 1 || v.h < (key === 'fern' ? 12 : 20)) return; if (!best[key] || v.h > best[key].h + 15) best[key] = v; });
        Object.keys(best).forEach(function (key) { var v = best[key], top = G - v.h * (key === 'shii' || key === 'tabu' ? .98 : 1); tags.push([v.p.x, top - 4, SPN[key], 1]); });
        if (e >= 6 && e < 95) tags.push([ROCK[2][0], G - 36, SPN.moss + '（先駆種）', 1]);
        tags.sort(function (a, b) { return b[1] - a[1]; });
        var boxes = [], tx = '';
        tags.forEach(function (t) {
          var w = t[2].length * 11.5 * K + 8, x = Math.max(w / 2 + 64 * (k >= 4 ? 1 : 0), Math.min(W - 40 - w / 2, t[0])), y = Math.max(70 * K, t[1]), hh = 15 * K;
          for (var n = 0; n < 20; n++) { var hit = boxes.some(function (b) { return Math.abs(b[0] - x) < (b[2] + w) / 2 && Math.abs(b[1] - y) < hh; }); if (!hit) break; y -= hh; }
          boxes.push([x, y, w]);
          tx += (Math.abs(y - t[1]) > 4 ? '<line x1="' + t[0] + '" y1="' + t[1] + '" x2="' + x + '" y2="' + (y + 2) + '" stroke="var(--ink)" stroke-width=".8" opacity=".6"/>' : '') + '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" font-size="' + (11.5 * K).toFixed(1) + '" font-weight="700" fill="var(--ink)" stroke="var(--panel)" stroke-width="' + (3.2 * K).toFixed(1) + '" paint-order="stroke" stroke-linejoin="round">' + t[2] + '</text>';
        });
        /* 階層構造（森林になったら） */
        if (k >= 4) {
          var lay = [['高木層', G - 310, G - 190], ['亜高木層', G - 190, G - 105], ['低木層', G - 105, G - 40], ['草本層', G - 40, G]];
          lay.forEach(function (l) { s += '<path d="M14 ' + (l[1] + 2) + ' h-6 V' + (l[2] - 2) + ' h6" stroke="var(--panel)" stroke-width="4" fill="none"/><path d="M14 ' + (l[1] + 2) + ' h-6 V' + (l[2] - 2) + ' h6" stroke="var(--ink)" stroke-width="1.4" fill="none"/><text x="15" y="' + ((l[1] + l[2]) / 2 + 4) + '" font-size="' + (11 * K).toFixed(1) + '" font-weight="700" fill="var(--ink)" stroke="var(--panel)" stroke-width="' + (3.4 * K).toFixed(1) + '" paint-order="stroke" stroke-linejoin="round">' + l[0] + '</text>'; });
        }
        /* 光の強さ（相対照度） */
        s += '<g transform="translate(' + (W - 20) + ' ' + (G - 300) + ')"><rect x="0" y="0" width="10" height="296" rx="3" fill="#ffe27a"/><rect x="0" y="0" width="10" height="296" rx="3" fill="url(#sc-dark)" opacity="' + Math.min(1, dk * 1.1).toFixed(2) + '"/><rect x="0" y="0" width="10" height="296" rx="3" fill="none" stroke="var(--ink)" stroke-width=".8"/>' +
          '<text x="5" y="-6" text-anchor="middle" font-size="' + (10 * K).toFixed(1) + '" fill="var(--ink)" stroke="var(--panel)" stroke-width="3" paint-order="stroke">光</text><text x="-4" y="' + (292 - 2 * K) + '" text-anchor="end" font-size="' + (11 * K).toFixed(1) + '" font-weight="700" fill="var(--ink)" stroke="var(--panel)" stroke-width="' + (3.2 * K).toFixed(1) + '" paint-order="stroke">林床の光 ' + Math.round(lt) + '%</text></g>';
        s += tx;
        s += '<text x="14" y="' + (30 * K) + '" font-size="' + (22 * K) + '" font-weight="800" fill="var(--ink)" font-family="var(--font-display)" stroke="var(--panel)" stroke-width="4" paint-order="stroke">' + ST[k].n + '</text><text x="14" y="' + (52 * K) + '" font-size="' + (13 * K) + '" fill="var(--muted)" stroke="var(--panel)" stroke-width="3" paint-order="stroke">' + (mode === 2 ? '二次遷移 ' : '') + yr + ' 年後（目安）</text>';
        stage.innerHTML = s + '</svg>';
        m([ST[k].n, Math.round(light(e)) + ' %', Math.round(soil(e)) + ' %']);
        info.innerHTML = '<h4>' + ST[k].n + '</h4>' + ST[k].d;
        if (k >= 4) api.task(0); if (k >= 6) api.task(1);
        var Lp = [], Sp = [];
        for (var y = 0; y <= 300; y += 5) { Lp.push([y, light(eff(y))]); Sp.push([y, soil(eff(y))]); }
        gr.innerHTML = BL.plot({ w: 340, h: 170, x: [0, 300], y: [0, 100], xt: [0, 100, 200, 300], yt: [0, 50, 100], xl: '年数', series: [{ pts: Lp, c: 'var(--c5)', label: '林床の明るさ' }, { pts: Sp, c: 'var(--soil)', label: '土壌' }], marks: [{ x: yr, y: light(e) }] });
      }
      draw();
      return function () { if (play) clearInterval(play); };
    }
  });

  /* ---------- バイオーム ---------- */
  var BIO = {
    tun: { n: 'ツンドラ', c: '#c9d3d8', p: 'コケ植物・地衣類・草本', w: 'シベリア北部・アラスカ北部' },
    tai: { n: '針葉樹林', c: '#5f8f7a', p: 'トウヒ・モミ・カラマツ', w: 'シベリア・カナダ・北海道東北部' },
    sum: { n: '夏緑樹林', c: '#9cc46a', p: 'ブナ・ミズナラ・カエデ（冬に落葉）', w: '東北地方・ヨーロッパ西部' },
    lau: { n: '照葉樹林', c: '#3f8a4a', p: 'スダジイ・タブノキ・カシ類（葉が厚く光沢）', w: '九州〜関東の低地・中国南部' },
    scl: { n: '硬葉樹林', c: '#b6b25a', p: 'オリーブ・コルクガシ（夏に乾燥）', w: '地中海沿岸' },
    sub: { n: '亜熱帯多雨林', c: '#2f7a5a', p: 'ヘゴ・ガジュマル・アコウ', w: '沖縄・小笠原' },
    tro: { n: '熱帯多雨林', c: '#1f5f3a', p: 'フタバガキ類など。種類がとても多く、高い', w: 'アマゾン・東南アジア' },
    rai: { n: '雨緑樹林', c: '#8fae4a', p: 'チーク（乾季に落葉）', w: 'インド・東南アジアの一部' },
    sav: { n: 'サバンナ', c: '#d9c06a', p: 'イネ科の草原＋低木（アカシア）', w: 'アフリカ中部' },
    ste: { n: 'ステップ', c: '#d8cf8f', p: 'イネ科の草原', w: '中央アジア・北アメリカ中部' },
    des: { n: '砂漠', c: '#ecd9a8', p: 'サボテン・多肉植物', w: 'サハラ・アラビア半島' }
  };
  function classify(T, P) {
    if (T < -5) return 'tun';
    if (P < 250 + Math.max(0, T) * 8) return T < 0 ? 'tun' : 'des';
    if (T < 3) return 'tai';
    if (T < 12) return P > 900 ? 'sum' : 'ste';
    if (T < 20) return P > 1300 ? 'lau' : P > 650 ? 'scl' : 'ste';
    if (T < 24) return P > 1800 ? 'sub' : P > 1200 ? 'rai' : P > 500 ? 'sav' : 'des';
    return P > 2500 ? 'tro' : P > 1300 ? 'rai' : 'sav';
  }

  /* バイオームの景色（その植生の木・草のかたち） */
  function landscape(k) {
    var W = 400, H = 150, G = 118, s = '', rnd2 = function (i) { var x = Math.sin(i * 91.7 + k.length * 13) * 1e4; return x - Math.floor(x); };
    var sky = { tro: ['#9fd3c7', '#e8f4ea'], sub: ['#a8d8ea', '#eef8f0'], lau: ['#b9d7ea', '#eef4ea'], sum: ['#bcdcf0', '#f2f6e8'], tai: ['#c3d3e0', '#eef2f2'], tun: ['#d4dde6', '#f4f6f8'], scl: ['#bfe0f2', '#fbf3df'], rai: ['#c8e0ea', '#f6f1dc'], sav: ['#f3d9a6', '#fbf0d8'], ste: ['#cfe3f0', '#f5f0dc'], des: ['#f6d9a0', '#fdf2dc'] }[k];
    var gr = { tro: '#3f6b34', sub: '#4d7a3a', lau: '#56743c', sum: '#6c8a46', tai: '#5b6b4a', tun: '#9aa58a', scl: '#b6a26a', rai: '#a59a5a', sav: '#c9b06a', ste: '#b8b878', des: '#e3c48a' }[k];
    s += '<defs><linearGradient id="bsky' + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#bsky' + k + ')"/>';
    if (k === 'des') s += '<circle cx="330" cy="30" r="16" fill="#f7c948"/>';
    if (k === 'tun') s += '<path d="M0 70 L60 40 L110 66 L170 30 L240 70 L300 44 L400 72 V' + G + ' H0Z" fill="#e9eef3"/>';
    s += '<path d="M0 ' + G + ' Q100 ' + (G - 6) + ' 200 ' + G + ' T400 ' + G + ' V' + H + ' H0Z" fill="' + gr + '"/>';
    function broad(x, h, c, dark) { return '<rect x="' + (x - 2.5) + '" y="' + (G - h * .45) + '" width="5" height="' + h * .45 + '" fill="#6b4a2a"/><ellipse cx="' + x + '" cy="' + (G - h * .62) + '" rx="' + h * .33 + '" ry="' + h * .3 + '" fill="' + c + '"/><ellipse cx="' + (x - h * .12) + '" cy="' + (G - h * .7) + '" rx="' + h * .16 + '" ry="' + h * .13 + '" fill="' + (dark || c) + '" opacity=".7"/>'; }
    function conifer(x, h, c) { return '<rect x="' + (x - 2) + '" y="' + (G - h * .2) + '" width="4" height="' + h * .2 + '" fill="#5a3a20"/><path d="M' + x + ' ' + (G - h) + ' L' + (x + h * .2) + ' ' + (G - h * .55) + ' L' + (x + h * .12) + ' ' + (G - h * .55) + ' L' + (x + h * .26) + ' ' + (G - h * .15) + ' L' + (x - h * .26) + ' ' + (G - h * .15) + ' L' + (x - h * .12) + ' ' + (G - h * .55) + ' L' + (x - h * .2) + ' ' + (G - h * .55) + 'Z" fill="' + c + '"/>'; }
    function grass(x, h, c) { var t = ''; for (var i = -2; i <= 2; i++) t += '<path d="M' + x + ' ' + G + ' q' + (i * 2) + ' -' + h * .6 + ' ' + (i * 4) + ' -' + h + '" stroke="' + c + '" stroke-width="1.6" fill="none"/>'; return t; }
    function acacia(x, h) { return '<path d="M' + x + ' ' + G + ' L' + x + ' ' + (G - h * .6) + ' M' + x + ' ' + (G - h * .5) + ' L' + (x - h * .25) + ' ' + (G - h * .8) + ' M' + x + ' ' + (G - h * .55) + ' L' + (x + h * .25) + ' ' + (G - h * .82) + '" stroke="#5a3a20" stroke-width="3" fill="none"/><ellipse cx="' + x + '" cy="' + (G - h * .85) + '" rx="' + h * .5 + '" ry="' + h * .12 + '" fill="#6f8a3a"/>'; }
    function cactus(x, h) { return '<path d="M' + x + ' ' + G + ' V' + (G - h) + ' M' + x + ' ' + (G - h * .5) + ' h-' + h * .25 + ' v-' + h * .25 + ' M' + x + ' ' + (G - h * .65) + ' h' + h * .22 + ' v-' + h * .2 + '" stroke="#4f8a3a" stroke-width="' + h * .16 + '" stroke-linecap="round" fill="none"/>'; }
    function fern(x, h) { var t = '<path d="M' + x + ' ' + G + ' V' + (G - h) + '" stroke="#6b4a2a" stroke-width="4"/>'; for (var i = 0; i < 7; i++) { var a = i / 7 * Math.PI - Math.PI; t += '<path d="M' + x + ' ' + (G - h) + ' q' + Math.cos(a) * h * .3 + ' ' + (Math.sin(a) * h * .1 - 4) + ' ' + Math.cos(a) * h * .45 + ' ' + (Math.sin(a) * h * .25 + 6) + '" stroke="#3f7a3a" stroke-width="3" fill="none"/>'; } return t; }
    var i, n;
    if (k === 'tro') { for (i = 0; i < 9; i++) s += broad(20 + i * 46 + rnd2(i) * 10, 80 + rnd2(i + 9) * 30, '#2f6b2f', '#1f4f22'); for (i = 0; i < 8; i++) s += broad(40 + i * 48, 50 + rnd2(i + 3) * 15, '#3f8a3a'); s += broad(200, 128, '#2f6b2f', '#1f4f22'); }
    if (k === 'sub') { for (i = 0; i < 7; i++) s += broad(30 + i * 58, 70 + rnd2(i) * 20, '#3f8a3a', '#2f6b2f'); s += fern(120, 70) + fern(290, 64); }
    /* 日本の森林は種のイラストで：照葉樹林＝スダジイ・タブノキ、夏緑樹林＝ブナ、針葉樹林＝トウヒ・モミ */
    var I = BL.ill;
    if (k === 'lau') { s += I.defs('bi'); for (i = 0; i < 7; i++) s += (i % 3 === 1 ? I.tabunoki : I.sudajii)(30 + i * 57 + rnd2(i) * 8, G + 4 - (i % 2) * 5, 74 + rnd2(i + 2) * 26, { seed: i % 4 + 1, flip: i % 2 }); }
    if (k === 'sum') { s += I.defs('bi'); for (i = 0; i < 7; i++) s += I.buna(30 + i * 57 + rnd2(i) * 8, G + 4 - (i % 2) * 5, 80 + rnd2(i + 2) * 26, { seed: i % 4 + 1, flip: i % 2 }); }
    if (k === 'tai') { s += I.defs('bi'); for (i = 0; i < 12; i++) s += I.conifer(16 + i * 34 + rnd2(i) * 8, G + 3 - (i % 2) * 4, 62 + rnd2(i + 4) * 40, { seed: i % 5 + 1 }); }
    if (k === 'tun') { for (i = 0; i < 26; i++) s += '<ellipse cx="' + (rnd2(i) * 400) + '" cy="' + (G + 4 + rnd2(i + 5) * 22) + '" rx="' + (6 + rnd2(i + 2) * 10) + '" ry="3" fill="' + (i % 3 ? '#7a8f5a' : '#c9b36a') + '"/>'; }
    if (k === 'scl') { for (i = 0; i < 5; i++) s += broad(40 + i * 80 + rnd2(i) * 20, 40 + rnd2(i + 1) * 12, '#7f9a5a', '#9fb07a'); for (i = 0; i < 14; i++) s += grass(rnd2(i + 30) * 400, 10, '#9a8a4a'); }
    if (k === 'rai') { for (i = 0; i < 7; i++) s += broad(30 + i * 58, 60 + rnd2(i) * 18, i % 3 ? '#8aa04a' : '#b0a050', '#c0b060'); }
    if (k === 'sav') { s += acacia(90, 70) + acacia(290, 58); for (i = 0; i < 40; i++) s += grass(rnd2(i) * 400, 14 + rnd2(i + 4) * 8, '#a8923a'); }
    if (k === 'ste') for (i = 0; i < 60; i++) s += grass(rnd2(i) * 400, 12 + rnd2(i + 4) * 10, '#8a9a4a');
    if (k === 'des') { s += '<path d="M0 ' + (G + 6) + ' Q80 ' + (G - 12) + ' 160 ' + (G + 4) + ' T320 ' + G + ' T400 ' + (G + 2) + ' V' + H + ' H0Z" fill="#edcf96"/>' + cactus(100, 46) + cactus(300, 34); }
    return '<svg class="svgfig" viewBox="0 0 ' + W + ' ' + H + '" style="border-radius:6px;margin:4px 0">' + s + '</svg>';
  }
  BL.biomeOf = classify; BL.BIOME = BIO;
  var CITY = [['那覇', 23.3, 2160], ['東京', 15.8, 1600], ['札幌', 9.2, 1150], ['モスクワ', 5.8, 710], ['カイロ', 22.4, 25], ['シンガポール', 27.6, 2500], ['ウランバートル', -0.4, 270]];
  BL.addSim({
    id: 'biome', name: 'バイオーム', cat: '生態系', subj: 'kiso', ic: '帯', lead: '年平均気温と年降水量で、どんな植生になるか調べる',
    how: '<p>その地域の植生と、そこにすむ動物などをまとめて<b class="key">バイオーム</b>（生物群系）という。おもに<b class="key">年平均気温</b>と<b class="key">年降水量</b>で決まる。</p><ul><li>降水量が多い → <b class="key">森林</b>、少ない → <b class="key">草原</b>、とても少ない → <b class="key">砂漠</b></li><li>森林は気温によって：熱帯多雨林・亜熱帯多雨林 → 照葉樹林 → 夏緑樹林 → 針葉樹林</li></ul><p><b>日本</b>は降水量が多いので、ほぼ全土が森林になる。</p><div class="box"><b>水平分布</b>（緯度）：亜熱帯多雨林（沖縄）→ 照葉樹林（九州〜関東）→ 夏緑樹林（東北・北海道南西部）→ 針葉樹林（北海道東北部）<br><b>垂直分布</b>（標高・本州中部）：丘陵帯（照葉樹林）→ 山地帯（夏緑樹林）約700m〜 → 亜高山帯（針葉樹林）約1700m〜 → 高山帯 約2500m〜。高山帯との境が<b class="key">森林限界</b>。</div>',
    pts: [[1, '年降水量が少ないと、気温が高くても森林にはならない'], [1, '日本のバイオームは気温で決まる（降水量は十分）'], [0, '照葉樹林の代表はブナ → ×（ブナは夏緑樹林）'], [1, '標高が 100 m 上がると気温は約 0.5〜0.6℃ 下がる']],
    tasks: ['照葉樹林になる条件を見つける', '砂漠になる条件を見つける', '都市をえらんで調べる'],
    mount: function (stage, ctl, api) {
      var T = 15, P = 1600;
      var sT = BL.ui.slider(ctl, { label: '年平均気温', min: -15, max: 30, step: .5, value: T, unit: '℃', on: function (v) { T = v; draw(); } });
      var sP = BL.ui.slider(ctl, { label: '年降水量', min: 0, max: 4500, step: 50, value: P, unit: 'mm', on: function (v) { P = v; draw(); } });
      var r = BL.el('div', { class: 'row' }); ctl.appendChild(r);
      CITY.forEach(function (c) { BL.ui.btn(r, c[0], function () { T = c[1]; P = c[2]; sT.set(T); sP.set(P); draw(); api.task(2); }); });
      var info = BL.ui.box(ctl, 'info', '');
      var W = 600, H = 380, L = 60, B = 40, x0 = -15, x1 = 30, y1 = 4500;
      function fx(t) { return L + (t - x0) / (x1 - x0) * (W - L - 12); }
      function fy(p) { return H - B - p / y1 * (H - B - 12); }
      var grid = '';
      for (var t = x0; t < x1; t += .5) for (var p = 0; p < y1; p += 50) {
        var k = classify(t + .25, p + 25);
        if (p > 300 + (t + 15) * 140 && t < 24) continue;
        if (p > 4000 && t < 24) continue;
        grid += '<rect x="' + fx(t).toFixed(1) + '" y="' + fy(p + 50).toFixed(1) + '" width="' + ((W - L - 12) / 90 + .4).toFixed(2) + '" height="' + ((H - B - 12) / 90 + .4).toFixed(2) + '" fill="' + BIO[k].c + '" data-k="' + k + '"/>';
      }
      var labels = [['tun', -11, 300], ['tai', -1, 700], ['sum', 7, 1400], ['lau', 15.5, 2000], ['scl', 15.5, 900], ['sub', 21.8, 2600], ['tro', 27, 3400], ['rai', 25.5, 1900], ['sav', 25, 800], ['ste', 9, 500], ['des', 22, 180]].map(function (a) { return '<text x="' + fx(a[1]) + '" y="' + fy(a[2]) + '" text-anchor="middle" font-size="' + (BL.narrow() ? 19 : 12) + '" font-weight="700" fill="#111" paint-order="stroke" stroke="rgba(255,255,255,.6)" stroke-width="3">' + BIO[a[0]].n + '</text>'; }).join('');
      var axes = '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - 12) + '" y2="' + (H - B) + '" stroke="var(--ink)"/><line x1="' + L + '" y1="12" x2="' + L + '" y2="' + (H - B) + '" stroke="var(--ink)"/>';
      [-10, 0, 10, 20, 30].forEach(function (t) { axes += '<text x="' + fx(t) + '" y="' + (H - B + 16) + '" font-size="' + (BL.narrow() ? 17 : 11) + '" text-anchor="middle" fill="var(--muted)">' + t + '</text>'; });
      [0, 1000, 2000, 3000, 4000].forEach(function (p) { axes += '<text x="' + (L - 6) + '" y="' + (fy(p) + 4) + '" font-size="' + (BL.narrow() ? 17 : 11) + '" text-anchor="end" fill="var(--muted)">' + p + '</text>'; });
      axes += '<text x="' + ((L + W) / 2) + '" y="' + (H - 4) + '" font-size="' + (BL.narrow() ? 19 : 12) + '" text-anchor="middle" fill="var(--ink)">年平均気温（℃）</text><text x="6" y="10" font-size="' + (BL.narrow() ? 19 : 12) + '" fill="var(--ink)">年降水量（mm）</text>';
      function draw() {
        var k = classify(T, P), b = BIO[k];
        if (k === 'lau') api.task(0); if (k === 'des') api.task(1);
        stage.innerHTML = '<svg class="svgfig" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:780px;cursor:crosshair">' + grid + labels + axes + '<circle cx="' + fx(T) + '" cy="' + fy(Math.min(P, y1)) + '" r="9" fill="none" stroke="var(--ink)" stroke-width="3"/><circle cx="' + fx(T) + '" cy="' + fy(Math.min(P, y1)) + '" r="3" fill="var(--ink)"/></svg>';
        var svg = stage.querySelector('svg');
        svg.addEventListener('click', function (ev) {
          var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; var q = pt.matrixTransform(svg.getScreenCTM().inverse());
          T = Math.round(Math.max(x0, Math.min(x1, x0 + (q.x - L) / (W - L - 12) * (x1 - x0))) * 2) / 2; P = Math.round(Math.max(0, Math.min(y1, (H - B - q.y) / (H - B - 12) * y1)) / 50) * 50;
          sT.set(T); sP.set(P); draw();
        });
        info.innerHTML = '<h4 style="color:' + b.c + ';filter:brightness(.8)">' + b.n + '</h4>' + landscape(k) + 'おもな植物：' + b.p + '<br>例：' + b.w + '<div class="note">図はグラフ上をクリックしても動かせます。境目は目安です。</div>';
      }
      draw();
    }
  });

  /* ---------- 個体群 ---------- */
  /* 動物のイラスト（<use> で何度も使う） */
  var ANIM_DEFS = '<defs>' +
    '<linearGradient id="pd-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b48c62"/><stop offset=".6" stop-color="#9a7550"/><stop offset="1" stop-color="#d8c4a4"/></linearGradient>' +
    '<linearGradient id="pd-lynxF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98e58"/><stop offset=".55" stop-color="#d2ae78"/><stop offset="1" stop-color="#efe0c4"/></linearGradient>' +
    '<radialGradient id="pd-para" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#fbf4dc" stop-opacity=".95"/><stop offset=".7" stop-color="#e2d3a4" stop-opacity=".9"/><stop offset="1" stop-color="#c2ae78" stop-opacity=".95"/></radialGradient>' +
    '<radialGradient id="pd-dish" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#eef7f4"/><stop offset=".8" stop-color="#cfe6e4"/><stop offset="1" stop-color="#a9cdd0"/></radialGradient>' +
    '<linearGradient id="pd-mead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cbf62"/><stop offset="1" stop-color="#5f8a38"/></linearGradient>' +
    '<linearGradient id="pd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky)"/><stop offset="1" stop-color="var(--panel)"/></linearGradient>' +
    /* ウサギ（右向き・高さ約 120） */
    '<g id="pd-rab"><ellipse cx="0" cy="1" rx="58" ry="7" fill="#000" opacity=".2"/><path d="M30 -60C18 -95 22 -112 30 -110C38 -108 40 -90 38 -60Z" fill="#8a6644"/>' +
    '<ellipse cx="-22" cy="-30" rx="33" ry="28" fill="url(#pd-fur)"/><path d="M-50 -30C-50 -62 0 -72 30 -54C46 -44 44 -14 26 -6L-30 -4C-46 -6 -50 -18 -50 -30Z" fill="url(#pd-fur)"/>' +
    '<path d="M-28 -46q8 -8 18 -6M-36 -36q6 -8 14 -8M-6 -54q8 -4 16 -2" stroke="#7a5a3a" stroke-width="1.6" fill="none" opacity=".6"/><ellipse cx="-14" cy="-4" rx="22" ry="5" fill="#7d5e40"/><path d="M24 -16L27 -2L36 -2L32 -18Z" fill="#8f6e4a"/>' +
    '<circle cx="-52" cy="-36" r="9.5" fill="#f7f2e8" stroke="#d0c4ae"/><ellipse cx="40" cy="-56" rx="20" ry="17" fill="url(#pd-fur)"/><ellipse cx="47" cy="-49" rx="10" ry="7" fill="#e2d0b2" opacity=".8"/>' +
    '<path d="M34 -66C22 -100 28 -120 36 -118C46 -116 46 -94 42 -66Z" fill="#a8825a" stroke="#6a4a2a" stroke-width="1"/><path d="M36 -72C30 -98 33 -110 37 -109C42 -106 42 -92 40 -72Z" fill="#e2a49a"/>' +
    '<circle cx="48" cy="-60" r="4.2" fill="#24160c"/><circle cx="49.4" cy="-61.4" r="1.4" fill="#fff"/><path d="M58 -55l2.5 2.5l-2.5 2.2z" fill="#c4706e"/><path d="M57 -51l15 -5M57 -50l15 1M57 -49l13 6" stroke="#4a3a2a" stroke-width=".7"/></g>' +
    /* ヤマネコ（左向き・高さ約 115） */
    '<g id="pd-lynx"><ellipse cx="0" cy="1" rx="70" ry="7" fill="#000" opacity=".22"/><path d="M-28 -50L-24 -3h9L-18 -50ZM32 -52L40 -3h9L44 -54Z" fill="#9a7444"/>' +
    '<path d="M56 -72C66 -74 74 -70 76 -62C74 -58 68 -60 60 -62Z" fill="#c49a62"/><path d="M70 -70C75 -68 77 -64 76 -61C72 -60 70 -62 68 -64Z" fill="#1f1610"/>' +
    '<path d="M-50 -72C-30 -90 40 -90 60 -72C68 -58 62 -44 46 -42L-38 -44C-54 -48 -58 -62 -50 -72Z" fill="url(#pd-lynxF)" stroke="#7a5a30" stroke-width=".8"/>' +
    '<g fill="#6a4a26" opacity=".55"><ellipse cx="-20" cy="-70" rx="3" ry="2"/><ellipse cx="-6" cy="-76" rx="2.6" ry="1.8"/><ellipse cx="10" cy="-72" rx="3" ry="2"/><ellipse cx="26" cy="-76" rx="2.6" ry="1.8"/><ellipse cx="38" cy="-68" rx="3" ry="2"/><ellipse cx="2" cy="-62" rx="2.4" ry="1.6"/><ellipse cx="22" cy="-60" rx="2.4" ry="1.6"/><ellipse cx="-30" cy="-60" rx="2.4" ry="1.6"/></g>' +
    '<path d="M-40 -50L-42 -4h11L-28 -50ZM40 -60C52 -56 54 -40 50 -4H40L36 -40Z" fill="#c49c66" stroke="#7a5a30" stroke-width=".8"/><ellipse cx="-38" cy="-3" rx="9" ry="4" fill="#b08a58"/><ellipse cx="46" cy="-3" rx="8" ry="4" fill="#b08a58"/>' +
    '<path d="M-72 -100L-68 -84L-60 -88ZM-54 -102L-56 -86L-48 -86Z" fill="#a07a48" stroke="#2a1e14" stroke-width="1"/><path d="M-72 -100l-2 -10M-54 -102l2 -10" stroke="#1a120c" stroke-width="1.6" stroke-linecap="round"/>' +
    '<ellipse cx="-60" cy="-78" rx="17" ry="15" fill="#c8a06a"/><path d="M-76 -76C-80 -64 -70 -58 -60 -60C-50 -58 -42 -64 -44 -74C-48 -66 -54 -64 -60 -66C-66 -64 -72 -66 -76 -76Z" fill="#efe2c8"/>' +
    '<path d="M-76 -70l-4 4M-74 -66l-4 5M-46 -70l4 4" stroke="#2a1e14" stroke-width="1"/><ellipse cx="-66" cy="-82" rx="3.4" ry="2.6" fill="#d8b030"/><ellipse cx="-66" cy="-82" rx="1" ry="2.4" fill="#111"/>' +
    '<path d="M-76 -76l3 -1l-1 3z" fill="#3a2418"/><path d="M-74 -72q3 2 6 0" stroke="#3a2418" stroke-width=".8" fill="none"/></g>' +
    /* ゾウリムシ（長さ 100・+x 向き） */
    '<g id="pd-pm"><path d="M-50 0C-50 -18 -10 -20 20 -16C44 -13 52 -6 50 4C48 14 30 16 10 12C-6 9 -14 18 -30 16C-46 14 -50 8 -50 0Z" fill="none" stroke="#9a8a5a" stroke-width="7" stroke-dasharray="1 2.6" opacity=".7"/>' +
    '<path d="M-50 0C-50 -18 -10 -20 20 -16C44 -13 52 -6 50 4C48 14 30 16 10 12C-6 9 -14 18 -30 16C-46 14 -50 8 -50 0Z" fill="url(#pd-para)" stroke="#7a6a3a" stroke-width="2"/>' +
    '<path d="M14 11C4 4 -8 2 -16 8" stroke="#8a7a4a" stroke-width="2.4" fill="none"/><ellipse cx="2" cy="-3" rx="13" ry="7" fill="#a78fc0" opacity=".75"/>' +
    '<circle cx="-30" cy="-4" r="4.5" fill="#e4f4ff" stroke="#6a9ab8" stroke-width="1.2"/><circle cx="32" cy="-4" r="4.5" fill="#e4f4ff" stroke="#6a9ab8" stroke-width="1.2"/><circle cx="-14" cy="4" r="3" fill="#c8a060" opacity=".8"/><circle cx="20" cy="4" r="2.6" fill="#b88a50" opacity=".8"/></g></defs>';
  function meadow() {
    var I = BL.ill, s = BL.ill.defs('pd') + '<rect width="640" height="250" fill="url(#pd-sky)"/><path d="M0 70Q160 40 320 64T640 58V120H0Z" fill="#8fa89a" opacity=".35"/>';
    for (var i = 0; i < 16; i++) { var x = 10 + i * 41 + rnd(i + 900) * 14, h = 42 + rnd(i + 920) * 26; s += i % 3 ? I.buna(x, 112, h, { seed: i % 4 + 1, flip: i % 2 }) : I.konara(x, 112, h, { seed: i % 3 + 1 }); }
    s += '<path d="M0 108Q200 100 400 108T640 106V250H0Z" fill="url(#pd-mead)"/>';
    var g = '', fl = '';
    for (i = 0; i < 150; i++) { var gx = rnd(i + 1000) * 640, gy = 112 + Math.pow(rnd(i + 1100), .7) * 138, gh = 3 + (gy - 110) / 14; for (var j = -1; j <= 1; j++) g += 'M' + gx.toFixed(1) + ' ' + gy.toFixed(1) + 'q' + (j * gh * .2).toFixed(1) + ' ' + (-gh * .6).toFixed(1) + ' ' + (j * gh * .5).toFixed(1) + ' ' + (-gh).toFixed(1); }
    for (i = 0; i < 40; i++) fl += '<circle cx="' + (rnd(i + 1300) * 640).toFixed(1) + '" cy="' + (118 + rnd(i + 1400) * 128).toFixed(1) + '" r="' + (1.2 + rnd(i) * 1.4).toFixed(1) + '" fill="' + ['#f4f0e0', '#f2d24a', '#d890c8'][i % 3] + '"/>';
    return s + '<path d="' + g + '" stroke="#4f7a2c" stroke-width="1" fill="none" opacity=".8"/>' + fl;
  }
  BL.addSim({
    id: 'predator', name: '個体群の成長と被食者・捕食者', cat: '生態系', subj: 'bio', ic: '群', lead: 'ロジスティック成長と、食う・食われるの関係による個体数の変動',
    how: '<p>同じ種の集まりを<b class="key">個体群</b>という。食物や空間にかぎりがあると、個体数はある数で頭打ちになる。この上限を<b class="key">環境収容力</b>（K）といい、S字形の曲線を<b class="key">ロジスティック曲線</b>という。</p><p>個体群密度が高くなると、食物不足などで成長がおさえられる＝<b class="key">密度効果</b>。</p><p><b>被食者と捕食者</b>：被食者（ウサギ）がふえる → 捕食者（ヤマネコ）がふえる → 被食者がへる → 捕食者がへる…と、<b class="key">周期的に変動</b>する。捕食者の山は被食者の山より<b class="key">少しおくれる</b>。</p>',
    pts: [[1, '理想的な条件（制限なし）では、個体数は J 字形にふえ続ける'], [1, 'ロジスティック曲線は、環境収容力に近づくと増え方がゆるやかになる'], [0, '捕食者の数の山は、被食者の山より先に来る → ×（おくれて来る）'], [1, '標識再捕法：全体の数 ＝ 1回目の標識数 × 2回目の捕獲数 ÷ 2回目の標識つき数']],
    tasks: ['ロジスティック成長で、環境収容力を変える', '被食者と捕食者の周期的な変動を見る', '捕食者がいないとき被食者がどうなるか見る'],
    mount: function (stage, ctl, api) {
      var mode = 'log', r = .5, K = 500, pred = true, box = BL.el('div', { class: 'ctl' }), t = 0, playing = true, ser = null, gT = -1, T = 0;
      BL.ui.seg(ctl, '見るもの', [['log', '個体群の成長'], ['lv', '被食者と捕食者']], mode, function (v) { mode = v; t = 0; build(); });
      ctl.appendChild(box);
      var trow = BL.el('div', { class: 'row' }); ctl.appendChild(trow);
      var pb = BL.ui.btn(trow, '❚❚ 止める', function () { playing = !playing; if (playing && t >= tMax()) t = 0; pbText(); }, 'main');
      BL.ui.btn(trow, '⟲ 最初から', function () { t = 0; playing = true; pbText(); });
      var ts = BL.ui.slider(ctl, { label: '時間', min: 0, max: 60, step: .1, value: 0, fmt: function (v) { return v.toFixed(1); }, on: function (v) { t = Math.min(v, tMax()); playing = false; pbText(); } });
      var info = BL.ui.box(ctl, 'info', '');
      function pbText() { pb.textContent = playing ? '❚❚ 止める' : '▶ 時間を進める'; }
      function tMax() { return mode === 'log' ? 40 : 60; }
      stage.innerHTML = '<div style="width:100%;max-width:760px;display:flex;flex-direction:column;gap:4px"><svg class="svgfig" viewBox="0 0 640 250" role="img" aria-label="個体群のようす">' + ANIM_DEFS + '<g class="bg"></g><g class="dyn"></g></svg><div class="gr"></div></div>';
      var bg = stage.querySelector('.bg'), dyn = stage.querySelector('.dyn'), gr = stage.querySelector('.gr');
      function build() {
        box.innerHTML = '';
        if (mode === 'log') {
          BL.ui.slider(box, { label: '増える速さ r', min: .1, max: 1, step: .05, value: r, fmt: function (v) { return v.toFixed(2); }, on: function (v) { r = v; calc(); } });
          BL.ui.slider(box, { label: '環境収容力 K', min: 100, max: 1000, step: 50, value: K, on: function (v) { K = v; api.task(0); calc(); } });
        } else {
          BL.ui.seg(box, '捕食者', [[true, 'いる'], [false, 'いない']], pred, function (v) { pred = v; if (!v) api.task(2); calc(); });
        }
        ts.el.max = tMax();
        bg.innerHTML = mode === 'log' ? dishBg() : meadow();
        calc();
      }
      /* 個体数の変化を先に計算しておく（0.1 きざみ） */
      function calc() {
        var a = [], b = [];
        if (mode === 'log') { var N = 5, Ne = 5; for (var u = 0; u <= 40.0001; u += .05) { if (Math.round(u * 20) % 2 === 0) { a.push([u, N]); b.push([u, Ne]); } N += r * N * (1 - N / K) * .05; Ne += r * Ne * .05; } }
        else { var h = 40, p = pred ? 9 : 0, dt = .02; for (var w = 0; w <= 60.0001; w += dt) { if (Math.round(w / dt) % 5 === 0) { a.push([w, h]); b.push([w, p]); } var dh = (.8 * h * (pred ? 1 : 1 - h / 300) - .04 * h * p) * dt, dp = (.01 * h * p - .5 * p) * dt; h += dh; p += dp; } }
        ser = [a, b]; if (mode === 'lv' && pred) api.task(1);
        gT = -1; frame(0);
      }
      function at(arr, x) { var i = Math.min(arr.length - 2, Math.floor(x * 10)), f = x * 10 - i; return arr[i][1] + (arr[i + 1][1] - arr[i][1]) * Math.max(0, Math.min(1, f)); }
      function dishBg() {
        var s = '<rect width="640" height="250" fill="var(--panel)"/><ellipse cx="250" cy="134" rx="236" ry="104" fill="#000" opacity=".12"/><ellipse cx="248" cy="128" rx="232" ry="104" fill="#e8f0ee" stroke="#8aa4a6" stroke-width="3"/><ellipse cx="248" cy="128" rx="220" ry="96" fill="url(#pd-dish)" stroke="#b8d0d2" stroke-width="2"/><path d="M80 70Q160 36 260 32" stroke="#fff" stroke-width="6" opacity=".7" fill="none" stroke-linecap="round"/>';
        s += '<text x="248" y="246" text-anchor="middle" font-size="' + (BL.narrow() ? 17 : 12) + '" fill="var(--muted)">ゾウリムシの培養液（上から見た図・絵 1 匹＝実際の 5 匹）</text>';
        return s;
      }
      function frame(dt) {
        T += dt;
        if (playing && dt) { t += dt * (mode === 'log' ? 2.2 : 3); if (t >= tMax()) { t = tMax(); playing = false; pbText(); } ts.set(Math.round(t * 10) / 10); }
        var s = '', i, n, nar = BL.narrow(), fs = nar ? 17 : 12.5;
        if (mode === 'log') {
          var N = at(ser[0], t); n = Math.round(N / 5);
          var food = Math.max(0, Math.round(110 * (1 - N / K))), fd = '';
          for (i = 0; i < food; i++) { var fa = rnd(i + 2000) * 6.283, fr = Math.sqrt(rnd(i + 2100)) * .9; fd += 'M' + (248 + Math.cos(fa) * fr * 216).toFixed(1) + ' ' + (128 + Math.sin(fa) * fr * 92).toFixed(1) + 'l2.4 .8'; }
          s += '<path d="' + fd + '" stroke="#8a6a3a" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>';
          for (i = 0; i < n; i++) {
            var w1 = .12 + rnd(i + 10) * .2, w2 = .1 + rnd(i + 20) * .22, p1 = rnd(i + 30) * 6.28, p2 = rnd(i + 40) * 6.28, R = .2 + .68 * Math.sqrt(rnd(i + 50));
            var x = 248 + 205 * R * Math.sin(T * w1 + p1), y = 128 + 86 * R * Math.sin(T * w2 + p2), vx = 205 * R * w1 * Math.cos(T * w1 + p1), vy = 86 * R * w2 * Math.cos(T * w2 + p2);
            s += '<use href="#pd-pm" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (Math.atan2(vy, vx) * 57.3).toFixed(0) + ') scale(.24)"/>';
          }
          var bw = 120, fill = Math.min(1, N / 1000);
          s += '<g transform="translate(' + (nar ? 492 : 500) + ' 30)"><text x="0" y="0" font-size="' + fs + '" font-weight="700" fill="var(--ink)">時間 ' + t.toFixed(1) + '</text><text x="0" y="' + (fs * 1.6) + '" font-size="' + (fs * 1.25) + '" font-weight="800" fill="var(--accent)" font-family="var(--font-data)">N＝' + Math.round(N) + '</text>' +
            '<rect x="0" y="' + (fs * 2.4) + '" width="' + bw + '" height="14" rx="3" fill="var(--chip)" stroke="var(--line)"/><rect x="0" y="' + (fs * 2.4) + '" width="' + (bw * fill).toFixed(1) + '" height="14" rx="3" fill="var(--accent)"/><line x1="' + (bw * K / 1000) + '" x2="' + (bw * K / 1000) + '" y1="' + (fs * 2.4 - 4) + '" y2="' + (fs * 2.4 + 18) + '" stroke="var(--warm)" stroke-width="2.5"/>' +
            '<text x="' + (bw * K / 1000) + '" y="' + (fs * 2.4 + 18 + fs) + '" text-anchor="middle" font-size="' + fs * .9 + '" font-weight="700" fill="var(--warm)">K＝' + K + '</text>' +
            '<text x="0" y="' + (fs * 6.2) + '" font-size="' + fs * .85 + '" fill="var(--muted)">エサ（細菌）</text><text x="0" y="' + (fs * 7.3) + '" font-size="' + fs * .85 + '" font-weight="700" fill="' + (N / K > .9 ? 'var(--warm)' : 'var(--ink)') + '">' + (N / K > .9 ? 'ほぼ食べつくした' : N / K > .5 ? 'へってきた' : 'たっぷり') + '</text></g>';
        } else {
          var H = at(ser[0], t), Pp = at(ser[1], t), nr = Math.min(60, Math.round(H / 5)), nl = Math.min(16, Math.round(Pp / 2.5)), items = [];
          for (i = 0; i < nr; i++) { var ry = 128 + rnd(i + 60) * 112, hop = Math.max(0, Math.sin(T * 2.4 + i * 1.7)); items.push([ry, '<use href="#pd-rab" transform="translate(' + (16 + rnd(i + 70) * 600 + Math.sin(T * .4 + i) * 10).toFixed(1) + ' ' + (ry - (hop > .7 ? (hop - .7) * 30 : 0)).toFixed(1) + ') scale(' + (.2 + (ry - 128) / 112 * .13).toFixed(3) + ')' + (rnd(i + 75) < .4 ? ' scale(-1 1)' : '') + '"/>']); }
          for (i = 0; i < nl; i++) { var ly = 134 + rnd(i + 160) * 100, lx = 680 - ((rnd(i + 170) * 720 + T * (14 + rnd(i + 180) * 10)) % 740), bob = Math.abs(Math.sin(T * 4 + i)) * 1.5; items.push([ly, '<use href="#pd-lynx" transform="translate(' + lx.toFixed(1) + ' ' + (ly - bob).toFixed(1) + ') scale(' + (.26 + (ly - 134) / 100 * .1).toFixed(3) + ')"/>']); }
          items.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (q) { s += q[1]; });
          s += '<g font-size="' + fs + '" font-weight="700" stroke="var(--panel)" stroke-width="3.5" paint-order="stroke"><text x="10" y="' + (fs + 4) + '" fill="var(--ink)">' + t.toFixed(1) + ' 年目</text><text x="10" y="' + (fs * 2.3 + 4) + '" fill="var(--c5)">ウサギ（被食者）' + Math.round(H) + ' 匹</text><text x="10" y="' + (fs * 3.6 + 4) + '" fill="var(--c1)">ヤマネコ（捕食者）' + Math.round(Pp) + ' 匹</text></g>' +
            '<text x="632" y="' + (fs + 4) + '" text-anchor="end" font-size="' + fs * .85 + '" fill="var(--muted)" stroke="var(--panel)" stroke-width="3" paint-order="stroke">絵 1 匹＝ウサギ 5 匹・ヤマネコ 2.5 匹</text>';
        }
        dyn.innerHTML = s;
        if (Math.abs(t - gT) >= .25 || gT < 0) { gT = t; graph(); }
      }
      function graph() {
        var k = Math.min(ser[0].length - 1, Math.round(t * 10));
        if (mode === 'log') {
          gr.innerHTML = BL.plot({ w: 640, h: 250, x: [0, 40], y: [0, 1100], xt: [0, 10, 20, 30, 40], yt: [0, 250, 500, 750, 1000], xl: '時間', yl: '個体数', series: [{ pts: ser[0], c: 'var(--accent)', w: 3.2, label: '実際（ロジスティック）' }, { pts: ser[1], c: 'var(--muted)', dash: '5 4', label: '制限なし（指数的）' }], hl: [{ y: K, c: 'var(--warm)', t: '環境収容力 K＝' + K }], vl: [{ x: t, c: 'var(--ink)' }], marks: [{ x: t, y: ser[0][k][1], c: 'var(--accent)' }] });
          info.innerHTML = '<h4>S字形の成長</h4>はじめは急にふえるが、個体数が K に近づくと、食物・すみかの不足（密度効果）で増え方がゆるやかになり、K で一定になる。';
        } else {
          var P4 = ser[1].map(function (q) { return [q[0], q[1] * 4]; });
          gr.innerHTML = BL.plot({ w: 640, h: 250, x: [0, 60], y: [0, 320], xt: [0, 10, 20, 30, 40, 50, 60], yt: [0, 100, 200, 300], xl: '時間（年）', yl: '個体数（捕食者は×4で表示）', series: [{ pts: ser[0], c: 'var(--c5)', w: 3, label: '被食者（ウサギ）' }, { pts: P4, c: 'var(--c1)', w: 3, label: '捕食者（ヤマネコ）' }], vl: [{ x: t, c: 'var(--ink)' }], marks: [{ x: t, y: ser[0][k][1], c: 'var(--c5)' }, { x: t, y: P4[k][1], c: 'var(--c1)' }] });
          info.innerHTML = pred ? '<h4>周期的な変動</h4>被食者がふえる → 少しおくれて捕食者がふえる → 被食者がへる → 捕食者もへる。これをくり返す。' : '<h4>捕食者がいないと</h4>被食者はふえ続け、やがて環境収容力（食物の量）で頭打ちになる。';
        }
      }
      build();
      return BL.loop(frame);
    }
  });
})();
