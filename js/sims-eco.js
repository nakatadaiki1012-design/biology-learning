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
  function tree(x, base, h, kind) {
    if (kind === 'pine') return '<line x1="' + x + '" y1="' + base + '" x2="' + x + '" y2="' + (base - h) + '" stroke="#7a5230" stroke-width="' + (h / 22) + '"/><path d="M' + (x - h * .28) + ' ' + (base - h * .45) + ' L' + x + ' ' + (base - h * 1.05) + ' L' + (x + h * .28) + ' ' + (base - h * .45) + 'Z" fill="#7fae5a" stroke="#4f7a3a"/>';
    if (kind === 'shade') return '<line x1="' + x + '" y1="' + base + '" x2="' + x + '" y2="' + (base - h * .6) + '" stroke="#5a3a20" stroke-width="' + (h / 18) + '"/><ellipse cx="' + x + '" cy="' + (base - h * .75) + '" rx="' + (h * .38) + '" ry="' + (h * .32) + '" fill="#2f6b3a" stroke="#1f4a28"/>';
    if (kind === 'shrub') return '<ellipse cx="' + x + '" cy="' + (base - h * .5) + '" rx="' + (h * .5) + '" ry="' + (h * .45) + '" fill="#8fbf5a" stroke="#5a8a3a"/>';
    if (kind === 'grass') return '<path d="M' + x + ' ' + base + ' q-4 -' + h * .6 + ' -10 -' + h + ' M' + x + ' ' + base + ' q2 -' + h * .7 + ' 3 -' + h + ' M' + x + ' ' + base + ' q6 -' + h * .5 + ' 12 -' + h * .9 + '" stroke="#9ab34a" stroke-width="2.5" fill="none"/>';
    if (kind === 'moss') return '<ellipse cx="' + x + '" cy="' + (base - 3) + '" rx="' + h + '" ry="5" fill="#a9b86a"/>';
    if (kind === 'seed') return '<path d="M' + x + ' ' + base + ' v-' + h + '" stroke="#2f6b3a" stroke-width="2"/><circle cx="' + x + '" cy="' + (base - h) + '" r="4" fill="#2f6b3a"/>';
    return '';
  }
  function rnd(i) { var x = Math.sin(i * 99.13) * 1e4; return x - Math.floor(x); }
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
        var e = eff(yr), k = stageAt(e), W = 640, base = 300, s = '<svg class="svgfig" viewBox="0 0 ' + W + ' 360" style="max-width:820px">';
        s += '<rect width="' + W + '" height="' + base + '" fill="var(--sky)"/>';
        var soilH = 4 + soil(e) * .4;
        s += '<rect y="' + base + '" width="' + W + '" height="60" fill="#7c7a78"/><rect y="' + base + '" width="' + W + '" height="' + soilH + '" fill="var(--soil)"/>';
        if (e < 15) for (var r = 0; r < 9; r++) s += '<ellipse cx="' + (40 + r * 70) + '" cy="' + (base - 4) + '" rx="22" ry="10" fill="#6d6b69"/>';
        var mossN = e >= 8 ? 18 : 0, grassN = e >= 25 ? Math.min(30, (e - 25) * 1.2) : 0, shrubN = e >= 55 ? Math.min(10, (e - 55) / 3) : 0;
        var pineN = e >= 80 ? Math.min(9, (e - 80) / 6) : 0, shadeN = e >= 140 ? Math.min(10, (e - 140) / 9) : 0;
        if (e > 200) pineN = Math.max(1, pineN - (e - 200) / 10);
        if (e > 120) grassN = Math.max(4, grassN - (e - 120) / 4);
        if (e > 150) shrubN = Math.max(2, shrubN - (e - 150) / 10);
        for (var i = 0; i < mossN; i++) s += tree(20 + rnd(i) * 600, base, 10 + rnd(i + 5) * 10, 'moss');
        for (i = 0; i < shadeN; i++) s += tree(30 + rnd(i + 50) * 580, base, Math.min(170, 60 + (e - 140 - i * 9) * 1.2), 'shade');
        for (i = 0; i < pineN; i++) s += tree(40 + rnd(i + 20) * 560, base, Math.min(200, 50 + (e - 80 - i * 6) * 1.6), 'pine');
        for (i = 0; i < shrubN; i++) s += tree(30 + rnd(i + 70) * 580, base, 30 + rnd(i) * 20, 'shrub');
        for (i = 0; i < grassN; i++) s += tree(10 + rnd(i + 90) * 620, base, 18 + rnd(i + 3) * 14, 'grass');
        if (e >= 120) for (i = 0; i < 6; i++) s += tree(60 + rnd(i + 200) * 520, base, 12, 'seed');
        var shade = (100 - light(e)) / 100 * .45;
        s += '<rect y="' + (base - 60) + '" width="' + W + '" height="60" fill="#000" opacity="' + shade + '" pointer-events="none"/>';
        s += '<text x="12" y="28" font-size="' + (BL.narrow() ? 30 : 20) + '" font-weight="800" fill="var(--ink)" font-family="var(--font-display)">' + ST[k].n + '</text><text x="12" y="50" font-size="' + (BL.narrow() ? 20 : 13) + '" fill="var(--muted)">' + (mode === 2 ? '二次遷移 ' : '') + yr + ' 年後（目安）</text>';
        if (e >= 120) s += '<text x="' + (W - 10) + '" y="' + (base - 66) + '" text-anchor="end" font-size="12" fill="var(--ink)">林床：陰樹の芽ばえが育つ</text>';
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
    if (k === 'lau') for (i = 0; i < 8; i++) s += broad(25 + i * 50 + rnd2(i) * 8, 64 + rnd2(i + 2) * 22, '#2f5f2f', '#4f8a4f');
    if (k === 'sum') for (i = 0; i < 8; i++) s += broad(25 + i * 50 + rnd2(i) * 8, 60 + rnd2(i + 2) * 22, '#7fb04a', '#a8cc6a');
    if (k === 'tai') for (i = 0; i < 11; i++) s += conifer(18 + i * 36 + rnd2(i) * 8, 60 + rnd2(i + 4) * 34, '#2f4f3a');
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
  BL.addSim({
    id: 'predator', name: '個体群の成長と被食者・捕食者', cat: '生態系', subj: 'bio', ic: '群', lead: 'ロジスティック成長と、食う・食われるの関係による個体数の変動',
    how: '<p>同じ種の集まりを<b class="key">個体群</b>という。食物や空間にかぎりがあると、個体数はある数で頭打ちになる。この上限を<b class="key">環境収容力</b>（K）といい、S字形の曲線を<b class="key">ロジスティック曲線</b>という。</p><p>個体群密度が高くなると、食物不足などで成長がおさえられる＝<b class="key">密度効果</b>。</p><p><b>被食者と捕食者</b>：被食者（ウサギ）がふえる → 捕食者（ヤマネコ）がふえる → 被食者がへる → 捕食者がへる…と、<b class="key">周期的に変動</b>する。捕食者の山は被食者の山より<b class="key">少しおくれる</b>。</p>',
    pts: [[1, '理想的な条件（制限なし）では、個体数は J 字形にふえ続ける'], [1, 'ロジスティック曲線は、環境収容力に近づくと増え方がゆるやかになる'], [0, '捕食者の数の山は、被食者の山より先に来る → ×（おくれて来る）'], [1, '標識再捕法：全体の数 ＝ 1回目の標識数 × 2回目の捕獲数 ÷ 2回目の標識つき数']],
    tasks: ['ロジスティック成長で、環境収容力を変える', '被食者と捕食者の周期的な変動を見る', '捕食者がいないとき被食者がどうなるか見る'],
    mount: function (stage, ctl, api) {
      var mode = 'log', r = .5, K = 500, a = .02, pred = true, box = BL.el('div', { class: 'ctl' });
      BL.ui.seg(ctl, '見るもの', [['log', '個体群の成長'], ['lv', '被食者と捕食者']], mode, function (v) { mode = v; build(); });
      ctl.appendChild(box);
      var info = BL.ui.box(ctl, 'info', '');
      function build() {
        box.innerHTML = '';
        if (mode === 'log') {
          BL.ui.slider(box, { label: '増える速さ r', min: .1, max: 1, step: .05, value: r, fmt: function (v) { return v.toFixed(2); }, on: function (v) { r = v; draw(); } });
          BL.ui.slider(box, { label: '環境収容力 K', min: 100, max: 1000, step: 50, value: K, on: function (v) { K = v; api.task(0); draw(); } });
        } else {
          BL.ui.seg(box, '捕食者', [[true, 'いる'], [false, 'いない']], pred, function (v) { pred = v; if (!v) api.task(2); draw(); });
        }
        draw();
      }
      function draw() {
        if (mode === 'log') {
          var L = [], E = [], N = 5, Ne = 5;
          for (var t = 0; t <= 40; t += .25) { L.push([t, N]); E.push([t, Ne]); N += r * N * (1 - N / K) * .25; Ne += r * Ne * .25; }
          stage.innerHTML = '<div style="width:100%;max-width:760px">' + BL.plot({ w: 640, h: 340, x: [0, 40], y: [0, 1100], xt: [0, 10, 20, 30, 40], yt: [0, 250, 500, 750, 1000], xl: '時間', yl: '個体数', series: [{ pts: L, c: 'var(--accent)', w: 3.2, label: '実際（ロジスティック）' }, { pts: E, c: 'var(--muted)', dash: '5 4', label: '制限なし（指数的）' }], hl: [{ y: K, c: 'var(--warm)', t: '環境収容力 K＝' + K }] }) + '</div>';
          info.innerHTML = '<h4>S字形の成長</h4>はじめは急にふえるが、個体数が K に近づくと、食物・すみかの不足（密度効果）で増え方がゆるやかになり、K で一定になる。';
        } else {
          var H = [], P = [], h = 40, p = pred ? 9 : 0, dt = .02;
          for (var u = 0; u <= 60; u += dt) {
            if (Math.abs(u / .5 - Math.round(u / .5)) < 1e-6) { H.push([u, h]); P.push([u, p * 4]); }
            var dh = (.8 * h * (pred ? 1 : 1 - h / 300) - .04 * h * p) * dt, dp = (.01 * h * p - .5 * p) * dt;
            h += dh; p += dp;
          }
          if (pred) api.task(1);
          stage.innerHTML = '<div style="width:100%;max-width:760px">' + BL.plot({ w: 640, h: 340, x: [0, 60], y: [0, 320], xt: [0, 10, 20, 30, 40, 50, 60], yt: [0, 100, 200, 300], xl: '時間（年）', yl: '個体数（捕食者は×4で表示）', series: [{ pts: H, c: 'var(--c5)', w: 3, label: '被食者（ウサギ）' }, { pts: P, c: 'var(--c1)', w: 3, label: '捕食者（ヤマネコ）' }] }) + '</div>';
          info.innerHTML = pred ? '<h4>周期的な変動</h4>被食者がふえる → 少しおくれて捕食者がふえる → 被食者がへる → 捕食者もへる。これをくり返す。' : '<h4>捕食者がいないと</h4>被食者はふえ続け、やがて環境収容力（食物の量）で頭打ちになる。';
        }
      }
      build();
    }
  });
})();
