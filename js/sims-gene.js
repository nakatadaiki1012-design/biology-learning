/* 見る：DNA・細胞分裂・遺伝・集団の遺伝 */
(function () {
  /* ---------- コドン表 ---------- */
  var B4 = 'UCAG', AAS = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
  var AAN = { F: 'フェニルアラニン', L: 'ロイシン', S: 'セリン', Y: 'チロシン', C: 'システイン', W: 'トリプトファン', P: 'プロリン', H: 'ヒスチジン', Q: 'グルタミン', R: 'アルギニン', I: 'イソロイシン', M: 'メチオニン', T: 'トレオニン', N: 'アスパラギン', K: 'リシン', V: 'バリン', A: 'アラニン', D: 'アスパラギン酸', E: 'グルタミン酸', G: 'グリシン', '*': '終止' };
  var CODON = {};
  for (var i = 0; i < 64; i++) CODON[B4[i >> 4] + B4[(i >> 2) & 3] + B4[i & 3]] = AAS[i];
  BL.CODON = CODON; BL.AAN = AAN;
  BL.comp = function (b, rna) { return { A: rna ? 'U' : 'T', T: 'A', U: 'A', G: 'C', C: 'G' }[b]; };
  BL.codonTable = function () {
    var s = '<table class="tbl" style="font-size:11.5px;text-align:center"><tr><th>1＼2</th>' + B4.split('').map(function (b) { return '<th>' + b + '</th>'; }).join('') + '</tr>';
    B4.split('').forEach(function (a) {
      s += '<tr><th>' + a + '</th>' + B4.split('').map(function (b) {
        return '<td>' + B4.split('').map(function (c) { var x = CODON[a + b + c]; return a + b + c + ' ' + (x === '*' ? '<b>終止</b>' : AAN[x].slice(0, 5)); }).join('<br>') + '</td>';
      }).join('') + '</tr>';
    });
    return s + '</table>';
  };
  var BC = { A: '#e07a5f', T: '#e9c46a', U: '#b388d9', G: '#6fa35a', C: '#5e8fc4' };

  function randGene() {
    var s = 'ATG';
    while (s.length < 18) { var c = ''; for (var j = 0; j < 3; j++) c += 'ATGC'[Math.floor(Math.random() * 4)]; if (CODON[c.replace(/T/g, 'U')] !== '*') s += c; }
    return s + BL.pick(['TAA', 'TAG', 'TGA']);
  }
  function translate(sense) {
    var m = sense.replace(/T/g, 'U'), out = [];
    for (var k = 0; k + 3 <= m.length; k += 3) { var a = CODON[m.substr(k, 3)]; out.push(a); if (a === '*') break; }
    return out;
  }
  BL.addSim({
    id: 'dna', name: 'DNA からタンパク質へ', cat: '遺伝子', subj: 'kiso', ic: '伝', lead: '相補的な塩基・転写・翻訳を1つずつ。突然変異もためす',
    how: '<p>DNA は A・T・G・C の4種類の<b class="key">塩基</b>の並びで情報をもつ。2本の鎖は <b class="key">A と T</b>、<b class="key">G と C</b> が向かい合って結合する（<b class="key">相補性</b>）。</p><p><b class="key">転写</b>：DNA の片方の鎖（<b class="key">鋳型鎖</b>）をもとに、相補的な mRNA がつくられる。RNA では T のかわりに <b class="key">U（ウラシル）</b>。</p><p><b class="key">翻訳</b>：mRNA の塩基3つ（<b class="key">コドン</b>）が1つのアミノ酸を指定する。AUG は<b class="key">開始コドン</b>（メチオニン）、UAA・UAG・UGA は<b class="key">終止コドン</b>。tRNA がアミノ酸を運び、リボソームでつながる。</p><div class="box">DNA → RNA → タンパク質 の流れを<b class="key">セントラルドグマ</b>という。</div><p><b class="key">突然変異</b>：1塩基の<b class="key">置換</b>はアミノ酸1個が変わる（変わらないこともある）。<b class="key">挿入・欠失</b>は読みわくがずれる（<b class="key">フレームシフト</b>）ので、その後が大きく変わる。</p>',
    pts: [[1, 'mRNA の塩基配列は、鋳型鎖と相補的（＝もう一方の鎖の T を U にしたもの）'], [1, '4種類の塩基が3つで 4³＝64 通りのコドン'], [0, '置換が起こると、必ずアミノ酸が変わる → ×（同じアミノ酸を指定するコドンもある）'], [1, '1塩基の欠失は、その後のアミノ酸配列が大きく変わりやすい']],
    tasks: ['翻訳まで進める', '置換を起こして、アミノ酸がどう変わるか見る', '欠失か挿入でフレームシフトを見る'],
    mount: function (stage, ctl, api) {
      var orig = randGene(), seq = orig, step = 3, mut = null, mpos = -1;
      var sg = BL.ui.seg(ctl, '段階', [[1, '① DNA'], [2, '② 転写'], [3, '③ 翻訳']], step, function (v) { step = v; draw(); });
      var r1 = BL.el('div', { class: 'row' }); ctl.appendChild(r1);
      BL.ui.btn(r1, '新しい遺伝子', function () { orig = seq = randGene(); mut = null; draw(); });
      BL.ui.btn(r1, 'もとにもどす', function () { seq = orig; mut = null; draw(); });
      var r2 = BL.el('div', { class: 'row' }); r2.appendChild(BL.el('span', { style: 'font-size:13.5px' }, '突然変異：')); ctl.appendChild(r2);
      BL.ui.btn(r2, '置換', function () { doMut('sub'); });
      BL.ui.btn(r2, '挿入', function () { doMut('ins'); });
      BL.ui.btn(r2, '欠失', function () { doMut('del'); });
      var info = BL.ui.box(ctl, 'info', '');
      var det = BL.el('details', {}, '<summary style="cursor:pointer;font-weight:700;font-size:13.5px">コドン表（遺伝暗号表）</summary>' + BL.codonTable()); ctl.appendChild(det);
      function doMut(kind) {
        seq = orig; var p = BL.rnd(3, 14);
        if (kind === 'sub') { var b; do { b = 'ATGC'[BL.rnd(0, 3)]; } while (b === seq[p]); seq = seq.slice(0, p) + b + seq.slice(p + 1); }
        else if (kind === 'ins') seq = seq.slice(0, p) + 'ATGC'[BL.rnd(0, 3)] + seq.slice(p);
        else seq = seq.slice(0, p) + seq.slice(p + 1);
        mut = kind; mpos = p; if (step < 3) { step = 3; sg.set(3); }
        api.task(kind === 'sub' ? 1 : 2); draw();
      }
      function draw() {
        if (step === 3) api.task(0);
        var n = seq.length, W = 40 + n * 28 + 30, s = '<svg class="svgfig" viewBox="0 0 ' + Math.max(W, 560) + ' 330" style="max-width:' + Math.max(W, 560) * 1.3 + 'px">';
        function base(x, y, b, hl) { return '<rect x="' + (x - 12) + '" y="' + (y - 13) + '" width="24" height="26" rx="4" fill="' + BC[b] + '"' + (hl ? ' stroke="var(--ink)" stroke-width="3"' : '') + '/><text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#1b1b1b">' + b + '</text>'; }
        s += '<text x="6" y="34" font-size="11" fill="var(--muted)">5′</text><text x="6" y="88" font-size="11" fill="var(--muted)">3′</text>';
        s += '<text x="' + (W - 22) + '" y="34" font-size="11" fill="var(--muted)">3′</text><text x="' + (W - 22) + '" y="88" font-size="11" fill="var(--muted)">5′</text>';
        s += '<text x="40" y="12" font-size="11.5" fill="var(--muted)">DNA（上：センス鎖　下：鋳型鎖）</text>';
        for (var k = 0; k < n; k++) {
          var x = 40 + k * 28, hl = mut && k === mpos && mut !== 'del';
          s += '<line x1="' + x + '" y1="44" x2="' + x + '" y2="70" stroke="var(--muted)" stroke-dasharray="2 2"/>';
          s += base(x, 30, seq[k], hl) + base(x, 84, BL.comp(seq[k]), hl);
          if (step >= 2) s += base(x, 150, seq[k] === 'T' ? 'U' : seq[k], hl);
        }
        if (mut === 'del') { var dx = 40 + mpos * 28 - 14; s += '<path d="M' + dx + ' 14 v86" stroke="var(--ng)" stroke-width="2.5"/><text x="' + dx + '" y="112" text-anchor="middle" font-size="11" fill="var(--ng)">欠失</text>'; }
        if (step >= 2) s += '<text x="40" y="126" font-size="11.5" fill="var(--muted)">mRNA（鋳型鎖と相補的。T のかわりに U）</text><path d="M' + 40 + ' 104 l0 0" />';
        if (step >= 3) {
          var aa = translate(seq), oa = translate(orig);
          aa.forEach(function (a, j) {
            var x0 = 40 + j * 84 - 12, cx = x0 + 40, diff = mut && oa[j] !== a;
            s += '<path d="M' + x0 + ' 168 v6 h80 v-6" fill="none" stroke="var(--ink)" stroke-width="1.5"/>';
            if (j) s += '<line x1="' + (cx - 84 + 30) + '" y1="215" x2="' + (cx - 30) + '" y2="215" stroke="var(--ink)" stroke-width="2"/>';
            s += '<rect x="' + (cx - 34) + '" y="196" width="68" height="38" rx="19" fill="' + (a === '*' ? 'var(--chip)' : diff ? 'var(--warm)' : 'var(--accent)') + '" stroke="var(--ink)"/><text x="' + cx + '" y="' + 220 + '" text-anchor="middle" font-size="' + (AAN[a].length > 5 ? 10.5 : 12.5) + '" font-weight="700" fill="' + (a === '*' ? 'var(--ink)' : 'var(--accent-ink)') + '">' + AAN[a] + '</text>';
          });
          s += '<text x="40" y="262" font-size="11.5" fill="var(--muted)">アミノ酸（コドン3つで1つ。オレンジ＝変わったところ）</text>';
          s += '<text x="40" y="300" font-size="14" font-weight="700" fill="var(--ink)">アミノ酸 ' + aa.filter(function (a) { return a !== '*'; }).length + ' 個' + (aa[aa.length - 1] === '*' ? '（終止コドンで止まる）' : '（終止コドンがない！）') + '</text>';
          var msg = '';
          if (!mut) msg = '<h4>遺伝子</h4>開始コドン AUG（メチオニン）から3つずつ読み、終止コドンで止まります。突然変異のボタンでためしてみよう。';
          else if (mut === 'sub') {
            var same = aa.join('') === oa.join(''), stop = aa.indexOf('*') < oa.length - 1;
            msg = '<h4>置換（1塩基が別の塩基に）</h4>' + (same ? 'アミノ酸は<b>変わらなかった</b>（同義置換）。同じアミノ酸を指定するコドンが複数あるため。' : stop ? '途中で<b>終止コドン</b>になり、タンパク質が短くなった（ナンセンス変異）。' : 'アミノ酸が<b>1つだけ</b>変わった（ミスセンス変異）。鎌状赤血球症はこのタイプ。');
          } else msg = '<h4>' + (mut === 'ins' ? '挿入' : '欠失') + '</h4>3つずつの読みわくがずれる<b>フレームシフト</b>。それより後のアミノ酸が大きく変わり、終止コドンの位置も変わる。';
          info.innerHTML = msg;
        } else info.innerHTML = step === 1 ? '<h4>① DNA の二重らせん</h4>向かい合う塩基は A–T、G–C の組。片方がわかれば、もう片方も決まる（相補性）。' : '<h4>② 転写</h4>鋳型鎖に相補的な mRNA ができる。結果として mRNA はセンス鎖の T を U にかえた並び。';
        stage.innerHTML = s + '</svg>';
      }
      draw();
    }
  });

  /* ---------- 細胞分裂 ---------- */
  var CH = [{ l: 64, c: 'var(--c1)' }, { l: 64, c: 'var(--c2)' }, { l: 36, c: 'var(--c3)' }, { l: 36, c: 'var(--c4)' }];
  function chrom(x, y, k, dbl, ang, swap) {
    var c = CH[k], l = c.l, s = '<g transform="translate(' + x + ' ' + y + ') rotate(' + (ang || 0) + ')">';
    if (dbl) {
      s += '<rect x="-11" y="' + (-l / 2) + '" width="10" height="' + l + '" rx="5" fill="' + c.c + '" stroke="var(--ink)" stroke-width="1"/>';
      s += '<rect x="1" y="' + (-l / 2) + '" width="10" height="' + l + '" rx="5" fill="' + c.c + '" stroke="var(--ink)" stroke-width="1"/>';
      if (swap) s += '<rect x="1" y="' + (l / 2 - 16) + '" width="10" height="16" rx="5" fill="' + swap + '" stroke="var(--ink)" stroke-width="1"/>';
      s += '<circle r="4" fill="var(--ink)"/>';
    } else s += '<rect x="-5" y="' + (-l / 2) + '" width="10" height="' + l + '" rx="5" fill="' + c.c + '" stroke="var(--ink)" stroke-width="1"/>' + (swap ? '<rect x="-5" y="' + (l / 2 - 16) + '" width="10" height="16" rx="5" fill="' + swap + '" stroke="var(--ink)" stroke-width="1"/>' : '') + '<circle r="3" fill="var(--ink)"/>';
    return s + '</g>';
  }
  function cellC(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--cyto)" stroke="#c9a227" stroke-width="3"/>'; }
  function nuc(cx, cy, r, dash) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--nuc)" stroke="#6b4a8a" stroke-width="2"' + (dash ? ' stroke-dasharray="6 6" fill-opacity=".4"' : '') + '/>'; }
  function threads(cx, cy, n, dbl) {
    var s = '';
    for (var k = 0; k < n; k++) {
      var a = k * 1.7, x = cx + Math.cos(a) * 22, y = cy + Math.sin(a) * 22, d = 'M' + (x - 26) + ' ' + y + ' q13 -16 26 0 t26 0';
      s += '<path d="' + d + '" fill="none" stroke="' + CH[k % 4].c + '" stroke-width="2.5"/>';
      if (dbl) s += '<path d="' + d + '" transform="translate(0 5)" fill="none" stroke="' + CH[k % 4].c + '" stroke-width="2.5"/>';
    }
    return s;
  }
  function spindle(px1, px2, cy, ys) { var s = ''; ys.forEach(function (y) { s += '<line x1="' + px1 + '" y1="' + cy + '" x2="' + ((px1 + px2) / 2) + '" y2="' + y + '" stroke="var(--muted)" stroke-width="1"/><line x1="' + px2 + '" y1="' + cy + '" x2="' + ((px1 + px2) / 2) + '" y2="' + y + '" stroke="var(--muted)" stroke-width="1"/>'; }); return s + '<circle cx="' + px1 + '" cy="' + cy + '" r="6" fill="var(--c3)"/><circle cx="' + px2 + '" cy="' + cy + '" r="6" fill="var(--c3)"/>'; }
  var MIT = [
    { n: '間期（G₁期）', d: 'DNA 合成の準備をする時期。染色体は細い糸状で、核の中に広がっている。', dna: 2, f: function () { return cellC(300, 180, 150) + nuc(300, 180, 80) + threads(300, 180, 4, false); } },
    { n: '間期（S期）', d: 'DNA が複製される（合成期）。DNA 量が 2 倍になる。', dna: 3, f: function () { return cellC(300, 180, 150) + nuc(300, 180, 80) + threads(300, 180, 4, true) + '<text x="300" y="300" text-anchor="middle" font-size="14" fill="var(--warm)" font-weight="700">DNA を複製中</text>'; } },
    { n: '間期（G₂期）', d: '分裂の準備をする時期。DNA 量は G₁期の 2 倍。', dna: 4, f: function () { return cellC(300, 180, 150) + nuc(300, 180, 80) + threads(300, 180, 4, true); } },
    { n: '前期', d: '染色体が太く短く凝縮し、見えるようになる。核膜が消え、紡錘体ができ始める。', dna: 4, f: function () { return cellC(300, 180, 150) + nuc(300, 180, 80, 1) + chrom(270, 150, 0, 1, 30) + chrom(330, 210, 1, 1, -20) + chrom(320, 140, 2, 1, 70) + chrom(270, 215, 3, 1, 10) + '<circle cx="240" cy="70" r="6" fill="var(--c3)"/><circle cx="360" cy="290" r="6" fill="var(--c3)"/>'; } },
    { n: '中期', d: '染色体が細胞の中央（赤道面）に並ぶ。染色体を観察しやすい時期。', dna: 4, f: function () { return cellC(300, 180, 150) + spindle(170, 430, 180, [100, 150, 210, 260]) + chrom(300, 100, 2, 1) + chrom(300, 150, 0, 1) + chrom(300, 214, 1, 1) + chrom(300, 266, 3, 1) + '<line x1="300" y1="40" x2="300" y2="320" stroke="var(--warm)" stroke-dasharray="4 5"/>'; } },
    { n: '後期', d: '染色体が縦に裂けて 2 つに分かれ、紡錘糸に引かれて両極へ移動する。', dna: 4, f: function () { var s = cellC(300, 180, 150) + spindle(170, 430, 180, [180]); [[2, 100], [0, 150], [1, 214], [3, 266]].forEach(function (p) { s += chrom(225, 180 + (p[1] - 180) * .55, p[0], 0, (p[1] - 180) / 4) + chrom(375, 180 + (p[1] - 180) * .55, p[0], 0, -(p[1] - 180) / 4); }); return s; } },
    { n: '終期', d: '両極で核膜ができ、2 つの核になる。細胞質が分かれ始める（動物：くびれる、植物：細胞板）。', dna: 4, f: function () { return '<path d="M300 60 C160 20 40 100 40 180 C40 260 160 340 300 300 C440 340 560 260 560 180 C560 100 440 20 300 60Z" fill="var(--cyto)" stroke="#c9a227" stroke-width="3"/>' + nuc(170, 180, 62, 1) + nuc(430, 180, 62, 1) + [0, 1, 2, 3].map(function (k) { return chrom(140 + k * 20, 180, k, 0) + chrom(400 + k * 20, 180, k, 0); }).join(''); } },
    { n: '分裂完了（娘細胞）', d: '同じ遺伝情報をもつ 2 つの細胞（娘細胞）ができた。染色体数は母細胞と同じ 2n。', dna: 2, f: function () { return cellC(160, 180, 120) + cellC(440, 180, 120) + nuc(160, 180, 64) + nuc(440, 180, 64) + threads(160, 180, 4) + threads(440, 180, 4); } }
  ];
  var MEI = [MIT[0], MIT[1], MIT[2],
    { n: '第一分裂 前期', d: '相同染色体どうしが対合して<b>二価染色体</b>をつくる。このとき<b>乗換え</b>が起こることがある（染色体の一部が入れかわる）。', dna: 4, f: function () { return cellC(300, 180, 150) + nuc(300, 180, 80, 1) + chrom(276, 160, 0, 1, 20, 'var(--c2)') + chrom(300, 168, 1, 1, 20, 'var(--c1)') + chrom(300, 230, 2, 1, -60) + chrom(312, 210, 3, 1, -60); } },
    { n: '第一分裂 中期', d: '二価染色体が赤道面に並ぶ。', dna: 4, f: function () { return cellC(300, 180, 150) + spindle(170, 430, 180, [120, 236]) + chrom(287, 120, 0, 1, 0, 'var(--c2)') + chrom(313, 120, 1, 1, 0, 'var(--c1)') + chrom(287, 236, 3, 1) + chrom(313, 236, 2, 1) + '<line x1="300" y1="40" x2="300" y2="320" stroke="var(--warm)" stroke-dasharray="4 5"/>'; } },
    { n: '第一分裂 後期', d: '<b>相同染色体</b>が分かれて両極へ（染色分体はまだくっついたまま）。', dna: 4, f: function () { return cellC(300, 180, 150) + spindle(170, 430, 180, [180]) + chrom(215, 150, 0, 1, 10, 'var(--c2)') + chrom(385, 150, 1, 1, -10, 'var(--c1)') + chrom(215, 220, 3, 1, -10) + chrom(385, 220, 2, 1, 10); } },
    { n: '第一分裂 終期', d: '細胞が 2 つに分かれる。それぞれの細胞の染色体数は半分（n）になる。', dna: 4, f: function () { return '<path d="M300 60 C160 20 40 100 40 180 C40 260 160 340 300 300 C440 340 560 260 560 180 C560 100 440 20 300 60Z" fill="var(--cyto)" stroke="#c9a227" stroke-width="3"/>' + chrom(150, 180, 0, 1, 0, 'var(--c2)') + chrom(190, 180, 3, 1) + chrom(410, 180, 1, 1, 0, 'var(--c1)') + chrom(450, 180, 2, 1); } },
    { n: '第二分裂 中期', d: '間期をはさまず（DNA を複製せず）に第二分裂へ。2 つの細胞で染色体が赤道面に並ぶ。', dna: 2, f: function () { return cellC(150, 180, 115) + cellC(450, 180, 115) + spindle(60, 240, 180, [140, 225]) + spindle(360, 540, 180, [140, 225]) + chrom(150, 140, 0, 1, 0, 'var(--c2)') + chrom(150, 225, 3, 1) + chrom(450, 140, 1, 1, 0, 'var(--c1)') + chrom(450, 225, 2, 1); } },
    { n: '第二分裂 後期', d: '染色分体が分かれて両極へ（体細胞分裂の後期と同じ）。', dna: 2, f: function () { return cellC(150, 180, 115) + cellC(450, 180, 115) + chrom(100, 150, 0, 0) + chrom(200, 150, 0, 0, 0, 'var(--c2)') + chrom(100, 220, 3, 0) + chrom(200, 220, 3, 0) + chrom(400, 150, 1, 0) + chrom(500, 150, 1, 0, 0, 'var(--c1)') + chrom(400, 220, 2, 0) + chrom(500, 220, 2, 0); } },
    { n: '完了（4 つの娘細胞）', d: '1 つの母細胞から、染色体数が半分（n）の細胞が 4 つできる。乗換えのため、4 つとも遺伝子の組み合わせがちがう。', dna: 1, f: function () { var s = ''; [[150, 95, 0, 3, ''], [150, 265, 0, 3, 'var(--c2)'], [450, 95, 1, 2, ''], [450, 265, 1, 2, 'var(--c1)']].forEach(function (p) { s += cellC(p[0], p[1], 78) + chrom(p[0] - 18, p[1], p[2], 0, 0, p[4]) + chrom(p[0] + 18, p[1], p[3], 0); }); return s; } }
  ];
  BL.addSim({
    id: 'mitosis', name: '細胞周期と細胞分裂', cat: '遺伝子', subj: 'kiso', ic: '分', lead: '体細胞分裂と減数分裂を1段階ずつ。DNA 量のグラフつき',
    how: '<p><b class="key">細胞周期</b>：間期（G₁期 → S期 → G₂期）→ 分裂期（M期：前期・中期・後期・終期）。S期に DNA が<b class="key">複製</b>され、分裂期に2つの細胞へ等しく<b class="key">分配</b>される。</p><p><b class="key">体細胞分裂</b>：染色体数は変わらない（2n → 2n）。同じ遺伝情報の細胞が2つできる。</p><p><b class="key">減数分裂</b>：2回続けて分裂し、染色体数が半分（2n → n）の細胞が4つできる。第一分裂で<b class="key">相同染色体</b>が分かれ、乗換えで新しい組み合わせが生まれる。</p><div class="box">各時期の長さ ＝ 細胞周期の長さ × その時期の細胞の数 ÷ 全体の細胞数</div>',
    pts: [[1, 'DNA 量は S 期で 2 倍になり、分裂で半分にもどる'], [1, '中期は染色体が赤道面に並び、観察に向く'], [0, '減数分裂の第二分裂の前にも DNA を複製する → ×'], [1, '減数分裂では、相同染色体の対合（二価染色体）と乗換えが起こる']],
    tasks: ['体細胞分裂を最後まで見る', '減数分裂を最後まで見る', '二価染色体を見る（減数分裂 第一分裂 前期）'],
    mount: function (stage, ctl, api) {
      var mode = 'mit', k = 0, timer = null;
      BL.ui.seg(ctl, '分裂', [['mit', '体細胞分裂'], ['mei', '減数分裂']], mode, function (v) { mode = v; k = 0; draw(); });
      var r = BL.el('div', { class: 'row' }); ctl.appendChild(r);
      BL.ui.btn(r, '◀ 前', function () { stopPlay(); k = Math.max(0, k - 1); draw(); });
      BL.ui.btn(r, '次 ▶', function () { stopPlay(); k = Math.min(list().length - 1, k + 1); draw(); }, 'main');
      var pb = BL.ui.btn(r, '▶ 自動', function () { if (timer) stopPlay(); else { pb.textContent = '■ 止める'; timer = setInterval(function () { k = (k + 1) % list().length; draw(); }, 1700); } });
      function stopPlay() { if (timer) clearInterval(timer); timer = null; pb.textContent = '▶ 自動'; }
      var info = BL.ui.box(ctl, 'info', '');
      var gr = BL.el('div', {}); ctl.appendChild(gr);
      function list() { return mode === 'mit' ? MIT : MEI; }
      function draw() {
        var L = list(), p = L[k];
        if (k === L.length - 1) api.task(mode === 'mit' ? 0 : 1);
        if (mode === 'mei' && k === 3) api.task(2);
        stage.innerHTML = '<svg class="svgfig" viewBox="0 0 600 360" style="max-width:760px"><text x="10" y="24" font-size="18" font-weight="800" fill="var(--ink)" font-family="var(--font-display)">' + p.n + '</text>' + p.f() + '<text x="590" y="350" text-anchor="end" font-size="11" fill="var(--muted)">2n＝4 の細胞（赤・ピンク、青・水色がそれぞれ相同染色体）</text></svg>';
        info.innerHTML = '<h4>' + (k + 1) + '/' + L.length + '　' + p.n + '</h4>' + p.d;
        var pts = [], mk;
        L.forEach(function (q, j) { pts.push([j, q.dna]); pts.push([j + 1, q.dna]); if (j === k) mk = { x: j + .5, y: q.dna }; });
        gr.innerHTML = BL.plot({ w: 340, h: 160, x: [0, L.length], y: [0, 4.5], yt: [1, 2, 4], xt: [], xl: '時間 →（左から各段階）', yl: '細胞1個あたりの DNA 量（相対値）', series: [{ pts: pts, c: 'var(--accent)' }], marks: [mk] });
      }
      draw();
      return stopPlay;
    }
  });

  /* ---------- 遺伝の交配 ---------- */
  function gametes(h1, h2, r) {
    var g = {};
    function add(x, f) { if (f > 0) g[x] = (g[x] || 0) + f; }
    if (h1.length === 1) { add(h1, .5); add(h2, .5); return g; }
    add(h1, (1 - r) / 2); add(h2, (1 - r) / 2); add(h1[0] + h2[1], r / 2); add(h2[0] + h1[1], r / 2);
    return g;
  }
  function geno(a, b) { var s = ''; for (var i = 0; i < a.length; i++) { var x = [a[i], b[i]].sort(); s += x.join(''); } return s; }
  function pheno(g) { var s = ''; for (var i = 0; i < g.length; i += 2) s += g[i] === g[i].toUpperCase() || g[i + 1] === g[i + 1].toUpperCase() ? g[i].toUpperCase() : g[i].toLowerCase(); return s; }
  function pea(x, y, ph, r) {
    var round = ph.indexOf('A') >= 0, yellow = ph.length < 2 || ph.indexOf('B') >= 0, fill = yellow ? '#e9c46a' : '#8cbf5a';
    if (round) return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="var(--ink)" stroke-width="1.2"/>';
    var d = ''; for (var k = 0; k <= 16; k++) { var a = k / 16 * Math.PI * 2, rr = r * (k % 2 ? .78 : 1); d += (k ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); }
    return '<path d="' + d + 'Z" fill="' + fill + '" stroke="var(--ink)" stroke-width="1.2"/>';
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function phName(ph) { var n = []; if (ph.indexOf('A') >= 0) n.push('丸'); else if (ph.indexOf('a') >= 0) n.push('しわ'); if (ph.length > 1) n.push(ph.indexOf('B') >= 0 ? '黄' : '緑'); return '[' + ph + '] ' + n.join('・'); }
  BL.addSim({
    id: 'mendel', name: '遺伝の交配', cat: '遺伝子', subj: 'bio', ic: '交', lead: 'エンドウの交配で、分離比をためす（独立・連鎖・組換え）',
    how: '<p>遺伝子は対（2つ）で存在し、配偶子をつくるとき1つずつに分かれる（<b class="key">分離の法則</b>）。顕性（優性）の形質だけが表れることを<b class="key">顕性の法則</b>という。</p><p>エンドウの種子の形：<b>A 丸（顕性）／a しわ</b>、子葉の色：<b>B 黄（顕性）／b 緑</b>。</p><div class="box">一遺伝子雑種 Aa × Aa → 表現型 [A]:[a] ＝ 3:1<br>二遺伝子雑種 AaBb × AaBb（独立）→ 9:3:3:1</div><p>2つの遺伝子が同じ染色体にあると<b class="key">連鎖</b>していて、いっしょに伝わりやすい。乗換えでできる組換えた配偶子の割合が<b class="key">組換え価</b>。</p><div class="box">組換え価(%) ＝ 組換えで生じた配偶子の数 ÷ 全配偶子の数 × 100<br>（検定交雑 × aabb の子の表現型の比から求める）</div>',
    pts: [[1, '検定交雑（潜性ホモ aabb とかける）で、相手の配偶子の比がそのまま表現型の比になる'], [1, '独立なら AaBb の配偶子は AB:Ab:aB:ab ＝ 1:1:1:1'], [0, '組換え価は 50% をこえることがある → ×（最大 50%）'], [1, '組換え価は遺伝子間の距離が長いほど大きい（染色体地図）']],
    tasks: ['Aa × Aa で 3:1 を出す', 'AaBb × AaBb（独立）で 9:3:3:1 を出す', '連鎖で検定交雑をする'],
    mount: function (stage, ctl, api) {
      var mode = 'one', p1 = 'Aa', p2 = 'Aa', q1 = 'Bb', q2 = 'Bb', phase = 'cis', rr = 20, cross = 'test', sample = null;
      var box = BL.el('div', { class: 'ctl' });
      BL.ui.seg(ctl, '種類', [['one', '一遺伝子'], ['two', '二遺伝子（独立）'], ['link', '二遺伝子（連鎖）']], mode, function (v) { mode = v; sample = null; build(); });
      ctl.appendChild(box);
      var out = BL.ui.box(ctl, 'info', '');
      function build() {
        box.innerHTML = '';
        if (mode === 'link') {
          BL.ui.seg(box, '親1', [['cis', 'AB/ab（相引）'], ['trans', 'Ab/aB（相反）']], phase, function (v) { phase = v; sample = null; draw(); });
          BL.ui.seg(box, 'かける相手', [['test', 'ab/ab（検定交雑）'], ['self', '親1と同じ']], cross, function (v) { cross = v; sample = null; draw(); });
          BL.ui.slider(box, { label: '組換え価', min: 0, max: 50, value: rr, unit: '%', on: function (v) { rr = v; sample = null; draw(); } });
        } else {
          var G = [['AA', 'AA'], ['Aa', 'Aa'], ['aa', 'aa']], H = [['BB', 'BB'], ['Bb', 'Bb'], ['bb', 'bb']];
          BL.ui.seg(box, '親1', G, p1, function (v) { p1 = v; sample = null; draw(); }); if (mode === 'two') BL.ui.seg(box, '', H, q1, function (v) { q1 = v; sample = null; draw(); });
          BL.ui.seg(box, '親2', G, p2, function (v) { p2 = v; sample = null; draw(); }); if (mode === 'two') BL.ui.seg(box, '', H, q2, function (v) { q2 = v; sample = null; draw(); });
        }
        var rw = BL.el('div', { class: 'row' }); box.appendChild(rw);
        BL.ui.btn(rw, '🌱 実際に 160 粒 育ててみる', function () { sample = 1; draw(); });
        draw();
      }
      function draw() {
        var h, k, r;
        if (mode === 'one') { h = [p1[0], p1[1]]; k = [p2[0], p2[1]]; r = .5; }
        else if (mode === 'two') { h = [p1[0] + q1[0], p1[1] + q1[1]]; k = [p2[0] + q2[0], p2[1] + q2[1]]; r = .5; }
        else { h = phase === 'cis' ? ['AB', 'ab'] : ['Ab', 'aB']; k = cross === 'test' ? ['ab', 'ab'] : h.slice(); r = rr / 100; }
        var g1 = gametes(h[0], h[1], r), g2 = gametes(k[0], k[1], r), k1 = Object.keys(g1).sort(), k2 = Object.keys(g2).sort();
        var ph = {}, cw = Math.min(110, 440 / Math.max(k2.length, 1)), chh = Math.min(64, 260 / Math.max(k1.length, 1)), X0 = 110, Y0 = 70;
        var s = '<svg class="svgfig" viewBox="0 0 ' + (X0 + cw * k2.length + 20) + ' ' + (Y0 + chh * k1.length + 20) + '" style="max-height:440px">';
        s += '<text x="' + (X0 + cw * k2.length / 2) + '" y="22" text-anchor="middle" font-size="13" fill="var(--muted)">親2 の配偶子</text><text x="10" y="' + (Y0 - 10) + '" font-size="13" fill="var(--muted)">親1 の配偶子</text>';
        k2.forEach(function (b, j) { s += '<text x="' + (X0 + cw * j + cw / 2) + '" y="' + (Y0 - 24) + '" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">' + b + '</text><text x="' + (X0 + cw * j + cw / 2) + '" y="' + (Y0 - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + Math.round(g2[b] * 1000) / 10 + '%</text>'; });
        k1.forEach(function (a, i) {
          s += '<text x="' + (X0 - 12) + '" y="' + (Y0 + chh * i + chh / 2) + '" text-anchor="end" font-size="15" font-weight="700" fill="var(--ink)">' + a + '</text><text x="' + (X0 - 12) + '" y="' + (Y0 + chh * i + chh / 2 + 14) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + Math.round(g1[a] * 1000) / 10 + '%</text>';
          k2.forEach(function (b, j) {
            var g = geno(a, b), p = pheno(g), f = g1[a] * g2[b]; ph[p] = (ph[p] || 0) + f;
            var x = X0 + cw * j, y = Y0 + chh * i;
            s += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + chh + '" fill="var(--panel)" stroke="var(--line)"/>' + pea(x + 18, y + chh / 2, p, Math.min(13, chh / 3)) + '<text x="' + (x + 36) + '" y="' + (y + chh / 2 + 5) + '" font-size="' + (cw < 80 ? 12 : 14) + '" font-weight="700" fill="var(--ink)">' + g + '</text>';
          });
        });
        stage.innerHTML = s + '</svg>';
        var keys = Object.keys(ph).sort(function (a, b) { return a < b ? -1 : 1; }).sort(function (a, b) { var ua = a.replace(/[a-z]/g, '').length, ub = b.replace(/[a-z]/g, '').length; return ub - ua || (a < b ? -1 : 1); });
        var ints = keys.map(function (x) { return Math.round(ph[x] * 40000); }), gg = ints.reduce(gcd);
        var ratio = ints.map(function (v) { return v / gg; }).join(' : ');
        var html = '<h4>表現型の分離比</h4>' + keys.map(phName).join('　') + '<br><b style="font-size:20px;font-family:var(--font-data)">' + ratio + '</b>';
        if (sample) {
          var cnt = {}; keys.forEach(function (x) { cnt[x] = 0; });
          for (var t = 0; t < 160; t++) { var u = Math.random(), acc = 0; for (var q = 0; q < keys.length; q++) { acc += ph[keys[q]]; if (u < acc || q === keys.length - 1) { cnt[keys[q]]++; break; } } }
          html += '<div class="note" style="color:var(--ink)">育てた 160 粒：' + keys.map(function (x) { return phName(x) + ' ' + cnt[x] + ' 粒'; }).join('、') + '<br>理論の比にぴったりではないが、近くなる（数が多いほど近づく）。</div>';
        }
        if (mode === 'link' && cross === 'test') html += '<div class="note">検定交雑なので、子の比 ＝ 親1 の配偶子の比。組換え型（' + (phase === 'cis' ? 'Ab・aB' : 'AB・ab') + '）の割合 ＝ 組換え価 ' + rr + '%</div>';
        out.innerHTML = html;
        if (mode === 'one' && ratio === '3 : 1') api.task(0);
        if (mode === 'two' && ratio === '9 : 3 : 3 : 1') api.task(1);
        if (mode === 'link' && cross === 'test') api.task(2);
      }
      build();
    }
  });

  /* ---------- 集団の遺伝 ---------- */
  function binom(n, p) { var c = 0; if (n > 400) { var m = n * p, sd = Math.sqrt(n * p * (1 - p)); var z = Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(2 * Math.PI * Math.random()); return Math.max(0, Math.min(n, Math.round(m + sd * z))); } for (var i = 0; i < n; i++) if (Math.random() < p) c++; return c; }
  BL.addSim({
    id: 'popgen', name: '集団の遺伝と進化', cat: '遺伝子', subj: 'bio', ic: '進', lead: '遺伝子頻度は世代でどう変わる？ 自然選択と遺伝的浮動',
    how: '<p>集団の中で、ある遺伝子（対立遺伝子）がしめる割合を<b class="key">遺伝子頻度</b>という。</p><div class="box"><b>ハーディ・ワインベルグの法則</b>：A の頻度 p、a の頻度 q（p＋q＝1）のとき、次の世代の遺伝子型の割合は<br>AA : Aa : aa ＝ p² : 2pq : q²<br>（集団が大きい・突然変異なし・移入移出なし・自由に交配・自然選択なし のとき、遺伝子頻度は変わらない）</div><p>この条件がくずれると遺伝子頻度が変わる＝<b class="key">進化</b>。</p><ul><li><b class="key">自然選択</b>：生き残りやすい形質の遺伝子がふえていく</li><li><b class="key">遺伝的浮動</b>：偶然によって遺伝子頻度がゆれる。集団が小さいほど大きく、ある遺伝子が 100%（固定）か 0%（消失）になりやすい</li></ul>',
    pts: [[1, '潜性ホモの割合 q² がわかれば q ＝ √(q²) で遺伝子頻度を求められる'], [1, '小さい集団ほど遺伝的浮動の影響が大きい'], [0, '遺伝的浮動は有利な遺伝子だけをふやす → ×（偶然なので有利・不利に関係ない）'], [1, '中立な突然変異が浮動で広まることを中立進化という']],
    tasks: ['小さい集団（N＝10）で、遺伝子が固定・消失するのを見る', '大きい集団で、選択なしのとき頻度があまり変わらないのを見る', '自然選択で a の頻度が下がるのを見る'],
    mount: function (stage, ctl, api) {
      var N = 50, p0 = .5, sel = 'none';
      BL.ui.seg(ctl, '集団の大きさ', [[10, '10'], [50, '50'], [200, '200'], [2000, '2000']], N, function (v) { N = v; run(); });
      BL.ui.slider(ctl, { label: 'はじめの A', min: .1, max: .9, step: .05, value: p0, fmt: function (v) { return v.toFixed(2); }, on: function (v) { p0 = v; run(); } });
      BL.ui.seg(ctl, '自然選択', [['none', 'なし'], ['aa', 'aa が不利'], ['AA', 'A をもつと不利']], sel, function (v) { sel = v; run(); });
      BL.ui.btn(ctl, '🔁 もう一度（6 つの集団）', run, 'main');
      var hw = BL.ui.box(ctl, 'info', '');
      function run() {
        var ser = [], fixed = 0, lost = 0, cols = ['var(--c1)', 'var(--c3)', 'var(--c5)', 'var(--accent)', 'var(--c6)', 'var(--c2)'];
        for (var L = 0; L < 6; L++) {
          var p = p0, pts = [[0, p]];
          for (var g = 1; g <= 100; g++) {
            var q = 1 - p, wAA = 1, wAa = 1, waa = 1;
            if (sel === 'aa') waa = .7; if (sel === 'AA') { wAA = .8; wAa = .85; }
            var wb = p * p * wAA + 2 * p * q * wAa + q * q * waa, pe = (p * p * wAA + p * q * wAa) / wb;
            p = binom(2 * N, pe) / (2 * N); pts.push([g, p]);
          }
          if (p >= 1) fixed++; if (p <= 0) lost++;
          ser.push({ pts: pts, c: cols[L], w: 2 });
        }
        if (N === 10 && fixed + lost > 0) api.task(0);
        if (N === 2000 && sel === 'none') api.task(1);
        if (sel === 'aa') api.task(2);
        stage.innerHTML = '<div style="width:100%;max-width:720px">' + BL.plot({ w: 620, h: 330, x: [0, 100], y: [0, 1], xt: [0, 20, 40, 60, 80, 100], yt: [0, .25, .5, .75, 1], xl: '世代', yl: 'A の遺伝子頻度 p', series: ser, hl: [{ y: p0, t: 'はじめ' }] }) + '<p class="note" style="text-align:center">6 本の線 ＝ 同じ条件の 6 つの集団。固定（p＝1）' + fixed + '、消失（p＝0）' + lost + '</p></div>';
        var q0 = 1 - p0;
        hw.innerHTML = '<h4>はじめの集団（ハーディ・ワインベルグ）</h4>p＝' + p0.toFixed(2) + '、q＝' + q0.toFixed(2) + '<br>AA ＝ p² ＝ ' + (p0 * p0).toFixed(3) + '　Aa ＝ 2pq ＝ ' + (2 * p0 * q0).toFixed(3) + '　aa ＝ q² ＝ ' + (q0 * q0).toFixed(3);
      }
      run();
    }
  });
})();
