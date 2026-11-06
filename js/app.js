/* 生物ラボ：画面の切りかえ（ホーム／見る／授業／演習／ゲーム） */
(function () {
  var view = document.getElementById('view'), cleanup = null;
  var S = BL.store;
  function clean() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    document.onkeydown = null; document.body.classList.remove('has-max');
    document.querySelectorAll('.toast, .bigmark').forEach(function (x) { x.remove(); });
  }
  function toast(msg) { document.querySelectorAll('.toast').forEach(function (x) { x.remove(); }); var t = BL.el('div', { class: 'toast' }, msg); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function lessonById(id) { return BL.lessons.filter(function (l) { return l.id === id; })[0]; }
  function simById(id) { return BL.sims.filter(function (s) { return s.id === id; })[0]; }
  function prog() { return S.get('lessons', {}); }
  function setProg(id, k, v) { var p = prog(); p[id] = p[id] || {}; p[id][k] = v; S.set('lessons', p); }
  BL.lessons.sort(function (a, b) { return (a.subj === b.subj ? 0 : a.subj === 'kiso' ? -1 : 1) || a.id.localeCompare(b.id, 'ja', { numeric: true }); });
  var PART_EM = { kiso: ['🔬', '🧬', '🫀', '🌳'], bio: ['🦕', '⚗️', '🥚', '🧠', '🌍'] };

  /* ○×の大きなマーク（クイズ番組ふう） */
  BL.bigMark = function (ok) {
    document.querySelectorAll('.bigmark').forEach(function (x) { x.remove(); });
    var m = BL.el('div', { class: 'bigmark ' + (ok ? 'ok' : 'ng'), 'aria-hidden': 'true' }, ok ? '◯' : '✕');
    document.body.appendChild(m); setTimeout(function () { m.remove(); }, 750);
  };
  function stars(score, n) { var r = score / n, k = r >= 1 ? 3 : r >= .7 ? 2 : r >= .4 ? 1 : 0; return '<div class="stars" aria-label="星' + k + 'つ">' + [0, 1, 2].map(function (i) { return '<span class="' + (i < k ? 'on' : '') + '" style="animation-delay:' + (i * .18) + 's">★</span>'; }).join('') + '</div>'; }

  /* テーマ */
  var theme = S.get('theme', '');
  function applyTheme() { if (theme) document.documentElement.setAttribute('data-theme', theme); else document.documentElement.removeAttribute('data-theme'); }
  applyTheme();
  document.getElementById('themeBtn').addEventListener('click', function () {
    var dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    theme = dark ? 'light' : 'dark'; S.set('theme', theme); applyTheme(); route();
  });
  document.querySelector('.brand').addEventListener('click', function () { location.hash = '#home'; });
  document.querySelectorAll('.modes button').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#' + b.dataset.mode; }); });

  /* ========== ホーム ========== */
  function renderHome() {
    var p = prog(), pass = BL.lessons.filter(function (l) { return p[l.id] && p[l.id].pass; }).length;
    var simN = BL.sims.filter(function (s) { return simDone(s.id); }).length, wrong = S.get('wrong', []).length;
    var nxt = BL.lessons.filter(function (l) { return !(p[l.id] && p[l.id].pass); })[0];
    view.innerHTML = '';
    var w = BL.el('div', { class: 'home' }); view.appendChild(w);
    w.innerHTML = '<div class="hero"><svg viewBox="0 0 64 64" class="hero-ic" aria-hidden="true"><ellipse cx="32" cy="32" rx="28" ry="22" fill="var(--cyto)" stroke="var(--accent)" stroke-width="3"/><circle cx="27" cy="30" r="9" fill="var(--nuc)" stroke="#6b4a8a" stroke-width="2"/><ellipse cx="45" cy="38" rx="7" ry="4" fill="#f3b38a" stroke="#a0522d"/><ellipse cx="42" cy="22" rx="6" ry="3.5" fill="var(--leaf)"/></svg><div><h2>生物ラボ</h2><p>生物基礎・生物を、動かして・授業で・問題で・ゲームで。</p></div></div>';
    w.appendChild(searchBox());
    var tiles = BL.el('div', { class: 'tiles' }); w.appendChild(tiles);
    [['see', '🔬', '見る', simN + ' / ' + BL.sims.length + ' 実験クリア', simN / BL.sims.length],
     ['lesson', '📖', '授業', pass + ' / ' + BL.lessons.length + ' 合格', pass / BL.lessons.length],
     ['drill', '✏️', '演習', wrong ? '復習 ' + wrong + ' 問' : BL.lessons.length * 10 + ' 問＋計算', 0],
     ['game', '🎮', 'ゲーム', BL.games.length + ' 種類', 0]].forEach(function (t) {
      var b = BL.el('button', { class: 'tile tile-' + t[0] }, '<span class="em">' + t[1] + '</span><b>' + t[2] + '</b><small>' + t[3] + '</small>' + (t[4] ? '<i class="bar"><i style="width:' + Math.round(t[4] * 100) + '%"></i></i>' : ''));
      b.addEventListener('click', function () { location.hash = '#' + t[0]; });
      tiles.appendChild(b);
    });
    if (nxt) { var c = BL.el('button', { class: 'cont' }, '<span class="eyebrow">続きから</span><b>' + BL.SUBJ[nxt.subj] + ' ' + nxt.unit + '　' + nxt.title + '</b><span class="go">▶</span>'); c.addEventListener('click', function () { location.hash = '#lesson/' + nxt.id; }); w.appendChild(c); }
    /* 今日の1問 */
    var day = Math.floor(Date.now() / 864e5), all = []; BL.lessons.forEach(function (l) { l.qs.forEach(function (q, i) { all.push([l, q, i]); }); });
    var pick = all[(day * 7919) % all.length];
    var box = BL.el('section', { class: 'panel daily' }); w.appendChild(box);
    runQuiz(box, [mcItem(pick[0], pick[1], pick[2])], { title: '☀️ 今日の1問', compact: true, onDone: function (sc, n, el) {
      el.innerHTML = '<div class="qbox" style="text-align:center"><b>' + (sc ? '◯ 正解！ また明日の1問もどうぞ' : '✕ 解説を読んで、授業で確かめよう') + '</b><div class="row" style="justify-content:center;margin-top:8px"></div></div>';
      var r = el.querySelector('.row'); BL.ui.btn(r, '📖 この授業へ', function () { location.hash = '#lesson/' + pick[0].id; }, 'main'); BL.ui.btn(r, '✏️ 演習をする', function () { location.hash = '#drill'; });
    } });
  }

  /* 用語さがし（用語・授業の名前・実験から） */
  function searchBox() {
    var box = BL.el('div', { class: 'search' }), inp = BL.el('input', { type: 'search', placeholder: '🔎 用語・キーワードでさがす（例：ミトコンドリア、インスリン）', 'aria-label': '用語をさがす' }), out = BL.el('div', { class: 'sresults', hidden: '' });
    box.appendChild(inp); box.appendChild(out);
    var idx = [];
    BL.lessons.forEach(function (l) {
      idx.push({ t: l.title, d: l.lead, l: l, k: 'lesson' });
      l.terms.forEach(function (x) { idx.push({ t: x.w, d: x.d, l: l, k: 'term' }); });
    });
    BL.sims.forEach(function (sm) { idx.push({ t: sm.name, d: sm.lead, sim: sm, k: 'sim' }); });
    function slideOf(l, w) { for (var i = 0; i < l.slides.length; i++) if ((l.slides[i].h + l.slides[i].html).indexOf(w) >= 0) return i; return 0; }
    inp.addEventListener('input', function () {
      var q = inp.value.trim(); if (!q) { out.hidden = true; return; }
      var hits = idx.map(function (x) { var sc = x.t === q ? 100 : x.t.indexOf(q) === 0 ? 60 : x.t.indexOf(q) >= 0 ? 40 : x.d.indexOf(q) >= 0 ? 10 : 0; return [sc ? sc + (x.k === 'term' ? 2 : 0) : 0, x]; }).filter(function (a) { return a[0] > 0; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 10);
      out.hidden = false;
      out.innerHTML = hits.length ? '' : '<div class="note" style="padding:8px">見つかりませんでした</div>';
      hits.forEach(function (h) {
        var x = h[1], b = BL.el('button', { class: 'sres' }, '<span class="sk">' + (x.k === 'sim' ? '🔬' : x.k === 'lesson' ? '📖' : '🏷') + '</span><span><b>' + BL.esc(x.t) + '</b><small>' + BL.esc(x.d) + '</small></span><span class="sl2">' + (x.l ? BL.SUBJ[x.l.subj] + ' ' + x.l.unit : '見る') + '</span>');
        b.addEventListener('click', function () { if (x.sim) location.hash = '#see/' + x.sim.id; else { BL._jump = x.k === 'term' ? slideOf(x.l, x.t) : 0; location.hash = '#lesson/' + x.l.id; } });
        out.appendChild(b);
      });
    });
    return box;
  }

  /* ⛶ 大きく見る（図・実験・アニメを画面いっぱいに。スマホは横向きがおすすめ） */
  function maxBtn(box, target) {
    target = target || box;
    var b = BL.el('button', { class: 'maxbtn', title: '大きく見る', 'aria-label': '大きく見る' }, '⛶');
    b.addEventListener('click', function () {
      var on = !target.classList.contains('is-max'); target.classList.toggle('is-max', on); b.textContent = on ? '✕' : '⛶'; b.title = on ? 'もとにもどす' : '大きく見る';
      document.body.classList.toggle('has-max', on);
    });
    box.appendChild(b); return b;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var m = document.querySelector('.is-max .maxbtn'); if (m) m.click(); } });

  /* ========== 見る ========== */
  function simApi(sim, onTask) {
    return { task: function (i) {
      var t = S.get('simtasks', {}), a = t[sim.id] || [];
      if (a[i]) return; a[i] = 1; t[sim.id] = a; S.set('simtasks', t);
      toast('✓ やってみよう：' + sim.tasks[i]); onTask && onTask();
    } };
  }
  function simDone(id) { var s = simById(id), a = S.get('simtasks', {})[id] || []; return s && s.tasks.every(function (x, i) { return a[i]; }); }
  function renderSee(id) {
    var subjF = S.get('seeSubj', '');
    var sim = simById(id) || BL.sims[0];
    view.innerHTML = '';
    var wrap = BL.el('div', { class: 'see' });
    /* スマホ用：1行のえらぶ欄 */
    var bar = BL.el('div', { class: 'seebar' });
    var sel = BL.el('select', { class: 'simsel', 'aria-label': '実験をえらぶ' });
    var cats = []; BL.sims.forEach(function (s) { if (cats.indexOf(s.cat) < 0) cats.push(s.cat); });
    sel.innerHTML = cats.map(function (c) { return '<optgroup label="' + c + '">' + BL.sims.filter(function (s) { return s.cat === c; }).map(function (s) { return '<option value="' + s.id + '"' + (s.id === sim.id ? ' selected' : '') + '>' + (simDone(s.id) ? '✓ ' : '') + s.name + '（' + BL.SUBJ[s.subj] + '）</option>'; }).join('') + '</optgroup>'; }).join('');
    sel.addEventListener('change', function () { location.hash = '#see/' + sel.value; });
    bar.appendChild(BL.el('span', { class: 'ic' }, sim.ic)); bar.appendChild(sel);
    var lib = BL.el('nav', { class: 'lib panel', 'aria-label': '実験の一覧' });
    BL.ui.seg(lib, '', [['', 'すべて'], ['kiso', '生物基礎'], ['bio', '生物']], subjF, function (v) { S.set('seeSubj', v); renderSee(sim.id); });
    var cat = null;
    BL.sims.forEach(function (s) {
      if (subjF && s.subj !== subjF) return;
      if (s.cat !== cat) { cat = s.cat; lib.appendChild(BL.el('div', { class: 'grp' }, cat)); }
      var b = BL.el('button', { class: 'item', 'aria-current': String(s.id === sim.id) }, '<span class="ic">' + s.ic + '</span><span>' + s.name + '<small>' + BL.SUBJ[s.subj] + '</small></span>' + (simDone(s.id) ? '<span class="done">✓</span>' : ''));
      b.addEventListener('click', function () { location.hash = '#see/' + s.id; });
      lib.appendChild(b);
    });
    var stage = BL.el('section', { class: 'stage panel' }), sin = BL.el('div', { class: 'stage-in' }); stage.appendChild(sin); maxBtn(stage, wrap);
    var card = BL.el('aside', { class: 'card panel' });
    card.innerHTML = '<div class="card-head"><div class="eyebrow">' + BL.SUBJ[sim.subj] + '・' + sim.cat + '</div><h2 class="name">' + sim.name + '</h2><p class="lead">' + sim.lead + '</p></div>';
    var tabs = BL.el('div', { class: 'tabs', role: 'tablist' }); card.appendChild(tabs);
    var body = BL.el('div', { class: 'body' }); card.appendChild(body);
    var pTry = BL.el('div', { class: 'ctl' }), pHow = BL.el('div', { class: 'how' }, sim.how), pPts = BL.el('div');
    var sph = (BL.PHOTOS || []).filter(function (p) { return (p.sims || []).indexOf(sim.id) >= 0; });
    if (sph.length) { pHow.appendChild(BL.el('h3', { class: 'sub' }, '📷 写真で見る')); pHow.appendChild(BL.photoView(sph)); }
    var ctl = BL.el('div', { class: 'ctl' }); pTry.appendChild(ctl);
    var tl = BL.el('ul', { class: 'tasks' });
    var tbox = BL.el('div', { class: 'taskbox' }, '<h3 class="sub">🎯 やってみよう <span class="tcount"></span></h3>'); tbox.appendChild(tl); pTry.appendChild(tbox);
    function drawTasks() { var a = S.get('simtasks', {})[sim.id] || [], n = 0; tl.innerHTML = sim.tasks.map(function (t, i) { if (a[i]) n++; return '<li class="' + (a[i] ? 'ok' : '') + '">' + t + '</li>'; }).join(''); tbox.querySelector('.tcount').textContent = n + '/' + sim.tasks.length; }
    drawTasks();
    pPts.innerHTML = '<ul class="pts">' + sim.pts.map(function (p) { return '<li><b class="' + (p[0] ? '' : 'x') + '">' + (p[0] ? '○' : '×') + '</b><span>' + p[1] + '</span></li>'; }).join('') + '</ul>';
    var rel = BL.lessons.filter(function (l) { return l.sim === sim.id || l.slides.some(function (s) { return s.sim === sim.id; }); });
    if (rel.length) {
      pPts.appendChild(BL.el('h3', { class: 'sub' }, 'この内容の授業'));
      var rr = BL.el('div', { class: 'row' }); pPts.appendChild(rr);
      rel.forEach(function (l) { BL.ui.btn(rr, '📖 ' + l.unit + ' ' + l.title, function () { location.hash = '#lesson/' + l.id; }); });
    }
    var panes = [['🎛 やってみる', pTry], ['💡 しくみ', pHow], ['✅ ポイント', pPts]];
    panes.forEach(function (p, i) {
      var b = BL.el('button', { role: 'tab', 'aria-selected': String(i === 0) }, p[0]); tabs.appendChild(b);
      p[1].hidden = i !== 0; body.appendChild(p[1]);
      b.addEventListener('click', function () { panes.forEach(function (q, j) { q[1].hidden = j !== i; tabs.children[j].setAttribute('aria-selected', String(j === i)); }); body.scrollTop = 0; });
    });
    wrap.appendChild(bar); wrap.appendChild(lib); wrap.appendChild(stage); wrap.appendChild(card); view.appendChild(wrap);
    cleanup = sim.mount(sin, ctl, simApi(sim, function () { drawTasks(); if (simDone(sim.id)) { toast('🎉 「' + sim.name + '」の課題をぜんぶクリア！'); var it = lib.querySelector('[aria-current="true"]'); if (it && !it.querySelector('.done')) it.appendChild(BL.el('span', { class: 'done' }, '✓')); } })) || null;
  }

  /* ========== 授業 ========== */
  function parts(subj) {
    var out = [], cur = null;
    BL.lessons.forEach(function (l) { if (l.subj !== subj) return; if (!cur || cur.n !== l.part) { cur = { n: l.part, ls: [] }; out.push(cur); } cur.ls.push(l); });
    return out;
  }
  function renderLessonMenu() {
    var subj = S.get('lessonSubj', 'kiso'), p = prog();
    view.innerHTML = '';
    var m = BL.el('div', { class: 'lmenu' }), h = BL.el('div', { class: 'lmenu-head' });
    h.appendChild(BL.el('h2', {}, '📖 授業'));
    BL.ui.seg(h, '', [['kiso', '生物基礎'], ['bio', '生物']], subj, function (v) { S.set('lessonSubj', v); renderLessonMenu(); });
    m.appendChild(h);
    var ls = BL.lessons.filter(function (l) { return l.subj === subj; });
    var nxt = ls.filter(function (l) { return !(p[l.id] && p[l.id].pass); })[0];
    if (nxt) { var c = BL.el('button', { class: 'cont' }, '<span class="eyebrow">続きから</span><b>' + nxt.unit + '　' + nxt.title + '</b><span class="go">▶</span>'); c.addEventListener('click', function () { location.hash = '#lesson/' + nxt.id; }); m.appendChild(c); }
    var openPart = S.get('openPart', {})[subj];
    parts(subj).forEach(function (pt, pi) {
      var done = pt.ls.filter(function (l) { return p[l.id] && p[l.id].pass; }).length;
      var isOpen = openPart != null ? openPart === pi : (nxt ? pt.ls.indexOf(nxt) >= 0 : pi === 0);
      var d = BL.el('details', { class: 'partbox' }); if (isOpen) d.open = true;
      d.innerHTML = '<summary><span class="pem">' + (PART_EM[subj][pi] || '📘') + '</span><span class="pn">' + pt.n + '</span><span class="pp"><i class="bar"><i style="width:' + Math.round(done / pt.ls.length * 100) + '%"></i></i>' + done + '/' + pt.ls.length + '</span></summary>';
      d.addEventListener('toggle', function () { if (d.open) { var o = S.get('openPart', {}); o[subj] = pi; S.set('openPart', o); m.querySelectorAll('details.partbox').forEach(function (x) { if (x !== d) x.open = false; }); } });
      var g = BL.el('div', { class: 'lgrid' }); d.appendChild(g);
      pt.ls.forEach(function (l) {
        var q = p[l.id] || {};
        var b = BL.el('button', { class: 'lcard' }, '<span class="no">' + l.unit + '</span><span><div class="t">' + l.title + '</div><div class="d">' + l.lead + '</div></span><span class="st">' + (q.pass ? '<span class="stamp sm">合格</span>' : q.seen ? '✓' : '') + '</span>');
        b.addEventListener('click', function () { location.hash = '#lesson/' + l.id; });
        g.appendChild(b);
      });
      m.appendChild(d);
    });
    view.appendChild(m);
  }
  /* 授業の右側：図・実験・アニメ・写真 をタブで切りかえ */
  function mediaFor(l, k) {
    var sl = l.slides[k], out = [];
    if (sl.fig) out.push({ kind: 'fig', t: '🖼 図' });
    if (sl.sim && simById(sl.sim)) out.push({ kind: 'sim', id: sl.sim, t: '🔬 実験' });
    BL.sims.forEach(function (sm) { if (sm.anim && (sm.slides || []).some(function (x) { return x[0] === l.id && x[1] === k; })) out.push({ kind: 'sim', id: sm.id, t: '🎬 アニメ', anim: 1 }); });
    var ph = (BL.PHOTOS || []).filter(function (p) { return (p.slides || []).some(function (x) { return x[0] === l.id && x[1] === k; }); });
    if (ph.length) out.push({ kind: 'photo', list: ph, t: '📷 写真' + (ph.length > 1 ? ' ' + ph.length : '') });
    return out;
  }
  BL.photoView = function (list) {
    var w = BL.el('div', { class: 'photov' }), i = 0;
    function draw() {
      var p = list[i];
      w.innerHTML = '<figure><button class="phimg" title="大きく見る"><img src="' + p.file + '" alt="' + BL.esc(p.cap) + '" loading="lazy"' + (p.w ? ' width="' + p.w + '" height="' + p.h + '"' : '') + '></button><figcaption>' + BL.esc(p.cap) + '<small>写真：' + BL.esc(p.credit || '') + '（' + BL.esc(p.license || '') + '）' + (p.src ? ' <a href="' + p.src + '" target="_blank" rel="noopener">出典</a>' : '') + '</small></figcaption></figure>' + (list.length > 1 ? '<div class="phnav">' + list.map(function (q, j) { return '<button class="phth' + (j === i ? ' on' : '') + '" data-j="' + j + '"><img src="' + q.file + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '');
      w.querySelectorAll('.phth').forEach(function (b) { b.onclick = function () { i = +b.dataset.j; draw(); }; });
      w.querySelector('.phimg').onclick = function () { var o = BL.el('div', { class: 'phzoom' }, '<img src="' + p.file + '" alt=""><p>' + BL.esc(p.cap) + '</p>'); o.onclick = function () { o.remove(); }; document.body.appendChild(o); };
    }
    draw(); return w;
  };
  function mountMedia(el, l, sl, m) {
    if (m.kind === 'sim') {
      var sim = simById(m.id), w = BL.el('div', { class: 'simwrap' });
      w.innerHTML = '<div class="eyebrow">' + (m.anim ? '🎬 ' : '🔬 ') + sim.name + (m.anim ? '' : '（動かしてみよう）') + '</div>';
      var sin = BL.el('div', { class: 'stage-in' }), ctl = BL.el('div', { class: 'ctl' });
      w.appendChild(sin); w.appendChild(ctl); el.appendChild(w);
      return sim.mount(sin, ctl, simApi(sim)) || null;
    }
    if (m.kind === 'photo') { el.appendChild(BL.photoView(m.list)); return null; }
    el.appendChild(BL.el('div', { class: 'figbox' }, sl.fig.replace('<svg', '<svg class="svgfig"')));
    return null;
  }
  function askBox(a, l, k) {
    var d = BL.el('div', { class: 'ask' }, '<div class="q">🤔 ' + a.q + '</div>');
    var g = BL.el('div', { class: 'qchoices' }); d.appendChild(g);
    var res = BL.el('div'); d.appendChild(res);
    var bs = BL.shuffle(a.c.map(function (c, i) { return { c: c, ok: i === 0 }; })).map(function (o) {
      var b = BL.el('button', { class: 'qc' }, o.c); g.appendChild(b);
      b.addEventListener('click', function () {
        BL.bigMark(o.ok);
        bs.forEach(function (x) { x.b.disabled = true; if (x.ok) x.b.classList.add('right'); else if (x.b === b) x.b.classList.add('wrong'); else x.b.classList.add('dim'); });
        var fi = l ? BL.figFor(l, a.q + ' ' + a.c[0] + ' ' + a.e, k === 0 ? 0 : -1) : -1;
        res.innerHTML = '<div class="verdict ' + (o.ok ? 'ok' : 'ng') + '">' + (o.ok ? '◯ 正解！' : '✕ ざんねん') + '</div><p style="margin:4px 0 0">' + a.e + '</p>' + (fi >= 0 && (fi !== k || !l.slides[k].fig) ? figHTML(l.slides[fi].fig, l.slides[fi].h) : '');
        res.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      return { b: b, ok: o.ok };
    });
    return d;
  }
  function renderLesson(id) {
    var l = lessonById(id); if (!l) { renderLessonMenu(); return; }
    var N = l.slides.length, k = BL._jump != null && BL._jump < l.slides.length ? BL._jump : 0, figClean = null, showFig = false; BL._jump = null;
    view.innerHTML = '';
    var w = BL.el('div', { class: 'lesson' }); view.appendChild(w);
    var bar = BL.el('div', { class: 'lbar' }); w.appendChild(bar);
    var back = BL.ui.btn(bar, '←', function () { location.hash = '#lesson'; }); back.setAttribute('aria-label', '授業の一覧へ'); back.title = '授業の一覧';
    bar.appendChild(BL.el('h2', {}, '<span class="eyebrow">' + BL.SUBJ[l.subj] + ' ' + l.unit + '</span>' + l.title));
    var pr = BL.ui.btn(bar, '🖨', function () { location.hash = '#print/' + l.id; }); pr.title = '印刷用（プリント）'; pr.setAttribute('aria-label', '印刷用のページ'); pr.classList.add('prbtn');
    var dots = BL.el('div', { class: 'dots' }); w.appendChild(dots);
    var area = BL.el('div', { class: 'larea' }); w.appendChild(area);
    var nav = BL.el('div', { class: 'lnav' }); w.appendChild(nav);
    var prev = BL.ui.btn(nav, '← 前へ', function () { go(k - 1); }, 'big');
    var pos = BL.el('span', { class: 'note' }); nav.appendChild(pos);
    var next = BL.ui.btn(nav, '次へ →', function () { go(k + 1); }, 'main big');
    function go(n) {
      if (n < 0 || n > N + 1) return;
      if (figClean) { try { figClean(); } catch (e) {} figClean = null; }
      k = n; showFig = false; draw();
    }
    cleanup = function () { if (figClean) figClean(); };
    function draw() {
      dots.innerHTML = ''; for (var i = 0; i <= N + 1; i++) dots.appendChild(BL.el('i', { class: i < k ? 'on' : i === k ? 'now' : '' }));
      area.innerHTML = ''; prev.disabled = k === 0; nav.hidden = k === N + 1;
      pos.textContent = k < N ? (k + 1) + ' / ' + N : 'ポイント';
      if (k < N) {
        var sl = l.slides[k], media = mediaFor(l, k), hasFig = media.length > 0;
        var g = BL.el('div', { class: 'slide' + (hasFig ? '' : ' solo') }); area.appendChild(g);
        if (hasFig) {
          var tg = BL.el('div', { class: 'figtoggle' }); g.appendChild(tg);
          var sg = BL.ui.seg(tg, '', [[false, '📖 説明'], [true, media.length > 1 ? '🖼 図・' + media.slice(1).map(function (m) { return m.t.split(' ')[0]; }).join('') : media[0].t]], showFig, function (v) { showFig = v; g.classList.toggle('show-fig', v); });
        }
        var t = BL.el('div', { class: 'stext panel' }, '<h3>' + sl.h + '</h3>' + sl.html); g.appendChild(t);
        if (sl.ask) t.appendChild(askBox(sl.ask, l, k));
        if (hasFig) {
          var f = BL.el('div', { class: 'sfig panel' }); g.appendChild(f); maxBtn(f);
          var body = BL.el('div', { class: 'mbody' }), cur = 0;
          if (media.length > 1) {
            var mt = BL.el('div', { class: 'mtabs', role: 'tablist' }); f.appendChild(mt);
            media.forEach(function (m, i) { var b = BL.el('button', { role: 'tab', 'aria-selected': String(i === 0) }, m.t); b.onclick = function () { if (cur === i) return; cur = i; mt.querySelectorAll('button').forEach(function (x, j) { x.setAttribute('aria-selected', String(j === i)); }); show(); }; mt.appendChild(b); });
          }
          f.appendChild(body);
          var show = function () { if (figClean) { try { figClean(); } catch (e) {} figClean = null; } body.innerHTML = ''; figClean = mountMedia(body, l, sl, media[cur]); };
          show();
          var peek = BL.el('button', { class: 'btn peek' }, media.map(function (m) { return m.t.split(' ')[0]; }).join('') + ' ' + (media[0].kind === 'sim' ? '実験を動かす' : '図を見る') + ' →');
          peek.addEventListener('click', function () { showFig = true; sg.set(true); g.classList.add('show-fig'); }); t.appendChild(peek);
          var backT = BL.el('button', { class: 'btn backtext' }, '← 説明にもどる');
          backT.addEventListener('click', function () { showFig = false; sg.set(false); g.classList.remove('show-fig'); var mx = f.querySelector('.maxbtn'); if (f.classList.contains('is-max') && mx) mx.click(); t.scrollTop = 0; }); f.appendChild(backT);
        }
        next.textContent = k === N - 1 ? 'ポイントへ →' : '次へ →';
      } else if (k === N) {
        setProg(l.id, 'seen', 1);
        var e = BL.el('div', { class: 'slide solo' }); area.appendChild(e);
        e.innerHTML = '<div class="stext panel"><h3>🎯 テスト・入試に出るポイント</h3><ul class="pts">' + l.exam.map(function (x) { return '<li><b>!</b><span>' + x + '</span></li>'; }).join('') + '</ul><details class="terms"><summary>この授業の用語（' + l.terms.length + '）</summary><table class="tbl">' + l.terms.map(function (x) { return '<tr><th>' + x.w + '</th><td>' + x.d + '</td></tr>'; }).join('') + '</table></details></div>';
        next.textContent = '確認テストへ →';
      } else {
        var box = BL.el('div', { class: 'panel testbox' }); area.appendChild(box);
        var items = BL.shuffle(l.qs.map(function (q, i) { return mcItem(l, q, i); })).slice(0, 4);
        items.forEach(function (it) { it.inLesson = true; });
        runQuiz(box, items, { title: '確認テスト', onDone: function (score, n, el) {
          var ok = score >= 3;
          if (ok) setProg(l.id, 'pass', 1);
          var p = prog()[l.id] || {}; if (!p.best || score > p.best) setProg(l.id, 'best', score);
          var idx = BL.lessons.indexOf(l), nl = BL.lessons[idx + 1];
          el.innerHTML = '<div class="result">' + stars(score, n) + '<div class="big">' + score + ' / ' + n + '</div>' + (ok ? '<p><span class="stamp pop">合格</span></p>' : '<p>3 問以上で合格。もう一度ためしてみよう。</p>') + '</div>';
          var r = BL.el('div', { class: 'row', style: 'justify-content:center;padding-bottom:16px' }); el.appendChild(r);
          if (nl && nl.subj === l.subj && ok) BL.ui.btn(r, '次の授業 →', function () { location.hash = '#lesson/' + nl.id; }, 'main big');
          BL.ui.btn(r, ok ? 'もう一度' : '🔁 もう一度テスト', function () { draw(); }, ok ? 'big' : 'main big');
          BL.ui.btn(r, '← 授業をふり返る', function () { go(0); }, 'big');
          BL.ui.btn(r, '一覧', function () { location.hash = '#lesson'; }, 'big');
        } });
      }
      area.scrollTop = 0;
    }
    document.onkeydown = function (e) { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowRight' && k < N + 1) go(k + 1); if (e.key === 'ArrowLeft') go(k - 1); };
    /* スワイプで前後へ（スマホ） */
    var sx = null;
    area.addEventListener('touchstart', function (e) { if (e.target.closest('.sfig, input, .qchoices')) { sx = null; return; } sx = e.touches[0].clientX; }, { passive: true });
    area.addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 70 && k <= N) go(k + (dx < 0 ? 1 : -1)); sx = null; });
    draw();
  }

  /* ========== 解説の図：問題に合う授業の図をさがす ========== */
  function plain(h) { return String(h).replace(/<[^>]*>/g, ' ').replace(/[\s、。・（）()「」：:？?]+/g, ' '); }
  function grams(t) { var g = {}; t = plain(t); for (var i = 0; i < t.length - 1; i++) { var b = t.substr(i, 2); if (!/\s/.test(b)) g[b] = (g[b] || 0) + 1; } return g; }
  BL.figFor = function (l, text, skip) {
    if (!l._g) { l._g = l.slides.map(function (s) { return grams(s.h + ' ' + s.html + ' ' + (s.fig || '').replace(/<[^>]*>/g, ' ')); }); l._df = {}; l._g.forEach(function (g) { for (var b in g) l._df[b] = (l._df[b] || 0) + 1; }); }
    var qg = grams(text), best = -1, bs = 0;
    l.slides.forEach(function (s, i) {
      if (!s.fig || i === skip) return;
      var sc = 0; for (var b in qg) if (l._g[i][b]) sc += Math.log(1 + l.slides.length / l._df[b]) * Math.min(qg[b], 3);
      if (i === 0) sc *= .5;
      if (sc > bs) { bs = sc; best = i; }
    });
    return best;
  };
  function figHTML(svgStr, cap, lessonId, idx) {
    return '<details class="ansfig" open><summary>📊 図で確かめる' + (cap ? '<span>' + cap + '</span>' : '') + '</summary><div class="ansfig-in">' + svgStr.replace('<svg', '<svg class="svgfig"') + '</div>' + (lessonId ? '<button class="btn ansgo" data-l="' + lessonId + '" data-i="' + idx + '">📖 この授業の画面を開く</button>' : '') + '</details>';
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('.ansgo'); if (b) { BL._jump = +b.dataset.i; location.hash = '#lesson/' + b.dataset.l; } });
  function mcFig(it) {
    if (!it.l) return '';
    var i = BL.figFor(it.l, it.q + ' ' + it.c[0] + ' ' + it.e);
    return i < 0 ? '' : figHTML(it.l.slides[i].fig, it.l.slides[i].h, it.inLesson ? null : it.l.id, i);
  }

  /* ========== 問題を解く（共通） ========== */
  function mcItem(l, q, i) { return { kind: 'mc', key: l.id + ':' + i, tag: BL.SUBJ[l.subj] + ' ' + l.unit + ' ' + l.title, q: q.q, c: q.c, e: q.e, l: l }; }
  function calcItem(c) { var g = c.gen(); return { kind: 'calc', key: 'calc:' + c.id, tag: BL.SUBJ[c.subj] + ' 計算：' + c.t, q: g.q, ans: g.ans, tol: g.tol, u: g.u, steps: g.steps, fig: g.fig }; }
  function markWrong(key, wrong) {
    var w = S.get('wrong', []); var i = w.indexOf(key);
    if (wrong && i < 0) w.push(key); if (!wrong && i >= 0) w.splice(i, 1);
    S.set('wrong', w);
  }
  function runQuiz(el, items, opt) {
    var n = 0, score = 0, wrongs = [], streak = 0;
    function q() {
      if (n >= items.length) { opt.onDone(score, items.length, el, wrongs); return; }
      var it = items[n];
      el.innerHTML = '';
      var b = BL.el('div', { class: 'qbox' + (opt.compact ? ' compact' : '') }); el.appendChild(b);
      var head = '<div class="qhead"><span class="eyebrow">' + (opt.title ? '<b>' + opt.title + '</b>　' : '') + it.tag + '</span>' + (items.length > 1 ? '<span class="qn">' + (streak >= 2 ? '<span class="streak">🔥' + streak + '</span>' : '') + (n + 1) + '/' + items.length + '</span>' : '') + '</div>';
      b.innerHTML = head + (items.length > 1 ? '<div class="qprog"><i style="width:' + (n / items.length * 100) + '%"></i></div>' : '') + '<div class="qtext">' + it.q + '</div>';
      if (opt.onQuit) { var qb = BL.el('button', { class: 'btn quit', 'aria-label': 'やめる' }, '✕'); qb.addEventListener('click', opt.onQuit); b.querySelector('.qhead').appendChild(qb); }
      var res = BL.el('div', { class: 'qres' }), nx = BL.el('div', { class: 'row qnext' });
      function after(ok, html) {
        BL.bigMark(ok);
        if (ok) { score++; streak++; } else { streak = 0; wrongs.push(it); }
        markWrong(it.key, !ok);
        var lid = it.l ? it.l.id : it.key, qs2 = S.get('qstat', {}), st2 = qs2[lid] || [0, 0]; st2[0] += ok ? 1 : 0; st2[1]++; qs2[lid] = st2; S.set('qstat', qs2);
        res.innerHTML = '<div class="verdict ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '◯ 正解！' + (streak >= 3 ? '　🔥 ' + streak + ' 連続！' : '') : '✕ ざんねん') + '</div>' + html;
        var nb = BL.ui.btn(nx, n + 1 < items.length ? '次の問題 →' : '結果を見る →', function () { n++; q(); }, 'main big'); nb.focus({ preventScroll: true });
        setTimeout(function () { nx.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 50);
      }
      if (it.kind === 'mc') {
        var g = BL.el('div', { class: 'qchoices' }); b.appendChild(g);
        var os = BL.shuffle(it.c.map(function (c, i) { return { c: c, ok: i === 0 }; }));
        var bs = os.map(function (o, j) {
          var bt = BL.el('button', { class: 'qc' }, '<span class="qk">' + 'ABCD'[j] + '</span>' + BL.esc(o.c)); g.appendChild(bt);
          bt.addEventListener('click', function () {
            bs.forEach(function (x, jj) { x.disabled = true; if (os[jj].ok) x.classList.add('right'); else if (x === bt) x.classList.add('wrong'); else x.classList.add('dim'); });
            after(o.ok, '<p class="expl">' + BL.esc(it.e) + '</p>' + mcFig(it));
          });
          return bt;
        });
      } else {
        var a = BL.el('div', { class: 'ans' }, '<input type="text" inputmode="decimal" aria-label="答え" placeholder="数字"><span>' + (it.u || '') + '</span>');
        b.appendChild(a);
        var inp = a.querySelector('input'), hint = 0, hb = BL.el('ol', { class: 'sol' });
        var chk = BL.ui.btn(a, '答え合わせ', check, 'main');
        var hbtn = BL.ui.btn(a, '💡 ヒント', function () { if (hint < it.steps.length - 1) { hint++; hb.innerHTML = it.steps.slice(0, hint).map(function (s) { return '<li>' + s + '</li>'; }).join(''); } });
        b.appendChild(hb);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
        if (!BL.narrow()) setTimeout(function () { inp.focus(); }, 30);
        function check() {
          var v = parseFloat(inp.value.replace(/[０-９．]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/[^0-9.\-]/g, ''));
          if (isNaN(v)) { inp.focus(); return; }
          chk.disabled = hbtn.disabled = inp.disabled = true; hb.innerHTML = '';
          var ok = Math.abs(v - it.ans) <= (it.tol || 0.001) + 1e-9;
          after(ok, '<p style="margin:6px 0 2px">答え：<b style="font-family:var(--font-data);font-size:18px">' + it.ans + ' ' + (it.u || '') + '</b></p><ol class="sol">' + it.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' + (it.fig ? figHTML(it.fig, 'この問題の数字で') : ''));
        }
      }
      b.appendChild(res); b.appendChild(nx);
    }
    q();
  }
  BL.runQuiz = runQuiz;

  /* ========== 演習 ========== */
  function renderDrill() {
    var subj = S.get('drillSubj', 'kiso'), type = S.get('drillType', 'mc'), cnt = S.get('drillCnt', 10);
    var sel = S.get('drillSel', {});
    view.innerHTML = '';
    var w = BL.el('div', { class: 'drill' }); view.appendChild(w);
    var side = BL.el('aside', { class: 'drill-side panel' }), main = BL.el('section', { class: 'drill-main panel' });
    w.appendChild(side); w.appendChild(main);
    side.appendChild(BL.el('h2', {}, '✏️ 演習'));
    var f1 = BL.el('div', { class: 'frow' }); side.appendChild(f1);
    BL.ui.seg(f1, '', [['kiso', '生物基礎'], ['bio', '生物']], subj, function (v) { S.set('drillSubj', v); renderDrill(); });
    var f2 = BL.el('div', { class: 'frow' }); side.appendChild(f2);
    BL.ui.seg(f2, '', [['mc', '4択'], ['calc', '🧮 計算'], ['review', '🔁 復習']], type, function (v) { S.set('drillType', v); renderDrill(); });
    BL.ui.seg(f2, '', [[10, '10問'], [20, '20問'], [40, '40問']], cnt, function (v) { cnt = v; S.set('drillCnt', v); });
    var units = BL.el('div', { class: 'units' });
    var wrong = S.get('wrong', []);
    if (type === 'mc') {
      units.appendChild(BL.el('div', { class: 'eyebrow' }, '範囲（何もえらばないと ぜんぶ）'));
      var chips = BL.el('div', { class: 'chips' }); units.appendChild(chips);
      var det = BL.el('details', { class: 'lpick' }, '<summary>授業ごとにえらぶ</summary>'); units.appendChild(det);
      var chipBtns = [];
      parts(subj).forEach(function (pt, pi) {
        var c = BL.el('button', { class: 'chip' }, (PART_EM[subj][pi] || '') + ' ' + pt.n.replace(/^第(\d)編\s*/, '$1 ')); chips.appendChild(c);
        chipBtns.push([c, pt]);
        c.addEventListener('click', function () { var on = !pt.ls.every(function (l) { return sel[l.id]; }); pt.ls.forEach(function (l) { sel[l.id] = on; }); save(); });
        det.appendChild(BL.el('div', { class: 'pl' }, pt.n));
        pt.ls.forEach(function (l) { det.appendChild(BL.el('label', {}, '<input type="checkbox" value="' + l.id + '"> ' + l.unit + ' ' + l.title)); });
      });
      det.addEventListener('change', function (e) { if (e.target.value) { sel[e.target.value] = e.target.checked; save(); } });
      function save() { S.set('drillSel', sel); paint(); }
      function paint() {
        chipBtns.forEach(function (x) { var a = x[1].ls.filter(function (l) { return sel[l.id]; }).length; x[0].setAttribute('aria-pressed', String(a === x[1].ls.length)); x[0].classList.toggle('part', a > 0 && a < x[1].ls.length); });
        det.querySelectorAll('input').forEach(function (b) { b.checked = !!sel[b.value]; });
      }
      paint();
    } else if (type === 'calc') {
      units.appendChild(BL.el('div', { class: 'eyebrow' }, '計算の種類（数字は毎回変わる）'));
      var cc = BL.el('div', { class: 'chips' }); units.appendChild(cc);
      BL.calcs.filter(function (c) { return c.subj === subj; }).forEach(function (c) { var b = BL.el('button', { class: 'chip', 'aria-pressed': 'true', 'data-id': c.id }, c.t); b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }); cc.appendChild(b); });
    } else {
      units.appendChild(BL.el('p', { class: 'note' }, 'まちがえた問題が <b style="font-size:18px;color:var(--warm)">' + wrong.length + '</b> 問。正解すると復習リストから消えます。'));
    }
    side.appendChild(units);
    var go = BL.el('div', { class: 'row', style: 'margin-top:12px' }); side.appendChild(go);
    BL.ui.btn(go, '▶ スタート', start, 'main big wide');
    main.innerHTML = '<div class="qbox drill-intro"><div class="em">' + (type === 'mc' ? '📝' : type === 'calc' ? '🧮' : '🔁') + '</div><h3>' + (type === 'mc' ? '4択問題' : type === 'calc' ? '計算問題' : '復習') + '</h3><p>' + (type === 'mc' ? '範囲をえらんで「スタート」。答えると すぐに解説が出ます。' : type === 'calc' ? '答えを数字で入力。わからないときは「ヒント」で解き方を 1 行ずつ。' : 'これまでにまちがえた問題（4択・計算）をもう一度。') + '</p><p class="note">生物基礎 ' + BL.lessons.filter(function (l) { return l.subj === 'kiso'; }).length * 10 + ' 問・生物 ' + BL.lessons.filter(function (l) { return l.subj === 'bio'; }).length * 10 + ' 問・計算 ' + BL.calcs.length + ' 種類</p></div>';
    if (type === 'mc') {
      var qst = S.get('qstat', {}), weak = BL.lessons.filter(function (l) { return l.subj === subj && qst[l.id] && qst[l.id][1] >= 3; }).map(function (l) { return [l, qst[l.id][0] / qst[l.id][1]]; }).filter(function (x) { return x[1] < .8; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3);
      if (weak.length) {
        var wb = BL.el('div', { class: 'weak' }, '<h3>📉 苦手チェック（正答率が低い単元）</h3>'); side.appendChild(wb);
        weak.forEach(function (x) {
          var row = BL.el('div', { class: 'wrow' }, '<span>' + x[0].unit + ' ' + x[0].title + '</span><i class="bar"><i style="width:' + Math.round(x[1] * 100) + '%;background:' + (x[1] < .6 ? 'var(--warm)' : 'var(--accent)') + '"></i></i><b>' + Math.round(x[1] * 100) + '%</b>');
          var b = BL.el('button', { class: 'btn' }, '練習'); b.onclick = function () { sel = {}; sel[x[0].id] = true; S.set('drillSel', sel); start(); };
          row.appendChild(b); wb.appendChild(row);
        });
      }
    }
    function start() {
      var items = [];
      if (type === 'mc') {
        var ls = BL.lessons.filter(function (l) { return l.subj === subj && sel[l.id]; });
        if (!ls.length) ls = BL.lessons.filter(function (l) { return l.subj === subj; });
        ls.forEach(function (l) { l.qs.forEach(function (q, i) { items.push(mcItem(l, q, i)); }); });
        items = BL.shuffle(items).slice(0, cnt);
      } else if (type === 'calc') {
        var ids = Array.prototype.map.call(units.querySelectorAll('.chip[aria-pressed="true"]'), function (b) { return b.dataset.id; });
        var cs = BL.calcs.filter(function (c) { return ids.indexOf(c.id) >= 0; }); if (!cs.length) cs = BL.calcs.filter(function (c) { return c.subj === subj; });
        for (var i = 0; i < cnt; i++) items.push(calcItem(cs[i % cs.length]));
        items = BL.shuffle(items);
      } else {
        S.get('wrong', []).forEach(function (key) {
          var p = key.split(':');
          if (p[0] === 'calc') { var c = BL.calcs.filter(function (x) { return x.id === p[1]; })[0]; if (c) items.push(calcItem(c)); }
          else { var l = lessonById(p[0]); if (l && l.qs[+p[1]]) items.push(mcItem(l, l.qs[+p[1]], +p[1])); }
        });
        items = BL.shuffle(items).slice(0, cnt);
        if (!items.length) { w.classList.add('running'); main.innerHTML = '<div class="qbox drill-intro"><div class="em">🎉</div><p>復習する問題はありません。まずは 4択 か 計算 をやってみよう。</p><button class="btn" onclick="location.reload()">← 設定にもどる</button></div>'; return; }
      }
      w.classList.add('running');
      runQuiz(main, items, { onQuit: renderDrill, onDone: function (score, n, el, wr) {
        var h = S.get('drillHist', []); h.push([Date.now(), subj, type, score, n]); S.set('drillHist', h.slice(-50));
        el.innerHTML = '<div class="result">' + stars(score, n) + '<div class="big">' + score + ' / ' + n + '</div>' + (score === n ? '<p><span class="stamp pop">満点</span></p>' : '') + '</div>';
        var r = BL.el('div', { class: 'row', style: 'justify-content:center;padding:0 0 12px' }); el.appendChild(r);
        BL.ui.btn(r, '🔁 もう一度', start, 'main big'); BL.ui.btn(r, '設定にもどる', renderDrill, 'big');
        if (wr.length) el.appendChild(BL.el('details', { class: 'qbox wronglist' }, '<summary>まちがえた問題 ' + wr.length + ' 問（復習に入りました）</summary><ul>' + wr.map(function (it) { return '<li>' + it.q + '<br><small style="color:var(--ok)">答え：' + (it.kind === 'mc' ? BL.esc(it.c[0]) : it.ans + ' ' + (it.u || '')) + '</small></li>'; }).join('') + '</ul>'));
      } });
    }
  }

  /* ========== ゲーム ========== */
  function renderGames(id) {
    view.innerHTML = '';
    var w = BL.el('div', { class: 'game' }); view.appendChild(w);
    var g = BL.games.filter(function (x) { return x.id === id; })[0];
    if (g) { g.run(w, function () { location.hash = '#game'; }); return; }
    w.appendChild(BL.el('h2', { class: 'gtitle' }, '🎮 ゲーム'));
    var bc = BL.el('button', { class: 'ccard bt-entry' }, '<div class="em">🏆</div><div><div class="t">クラス対戦</div><div class="d">先生の大画面で、クラス全員がスマホでいっせいに。🎯 クイズ大会（解説の図つき）と 🚀 タイムアタック対戦</div></div><span class="go">▶</span>');
    bc.addEventListener('click', function () { location.hash = '#battle'; }); w.appendChild(bc);
    var cc = BL.el('div', { class: 'choicecards' }); w.appendChild(cc);
    BL.games.forEach(function (x) {
      var b = BL.bestOf(x.id === 'time' ? 'time' : x.id);
      var c = BL.el('button', { class: 'ccard ccard-' + x.id }, '<div class="em">' + x.em + '</div><div class="t">' + x.name + '</div><div class="d">' + x.desc + '</div>' + (b != null ? '<div class="best">🏆 ' + b + ' ' + x.unit + '</div>' : ''));
      c.addEventListener('click', function () { location.hash = '#game/' + x.id; });
      cc.appendChild(c);
    });
  }

  /* ========== 印刷用（プリント） ========== */
  function renderPrint(id) {
    var l = lessonById(id); if (!l) { renderLessonMenu(); return; }
    var abc = 'ABCD', key = [];
    var qs = l.qs.map(function (q, i) { var ord = BL.shuffle([0, 1, 2, 3]); key.push(abc[ord.indexOf(0)]); return '<li><div>' + BL.esc(q.q) + '</div><ol class="pch">' + ord.map(function (o, j) { return '<li><b>' + abc[j] + '</b> ' + BL.esc(q.c[o]) + '</li>'; }).join('') + '</ol></li>'; }).join('');
    view.innerHTML = '<div class="print"><div class="noprint row"><button class="btn" onclick="history.back()">← もどる</button><button class="btn main big" onclick="window.print()">🖨 印刷する</button><span class="note">A4・縦向きがおすすめ。図もそのまま印刷されます。</span></div>' +
      '<h1>' + BL.SUBJ[l.subj] + ' ' + l.unit + '　' + l.title + '</h1><p class="note">' + l.lead + '　　年　　組　　番　名前＿＿＿＿＿＿＿＿</p>' +
      l.slides.map(function (sl, i) { return '<section class="pslide"><h2>' + (i + 1) + '. ' + sl.h + '</h2><div class="pbody"><div class="ptext">' + sl.html + (sl.ask ? '<div class="pask">🤔 ' + sl.ask.q + '<br>' + BL.shuffle(sl.ask.c).map(function (c) { return '□ ' + c; }).join('　') + '</div>' : '') + '</div>' + (sl.fig ? '<div class="pfig">' + sl.fig.replace('<svg', '<svg class="svgfig"') + '</div>' : sl.sim ? '<div class="pfig note">（アプリの「見る」で実験：' + (simById(sl.sim) || {}).name + '）</div>' : '') + '</div></section>'; }).join('') +
      '<section class="pslide"><h2>テスト・入試に出るポイント</h2><ul>' + l.exam.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><h2>用語</h2><table class="tbl">' + l.terms.map(function (x) { return '<tr><th>' + x.w + '</th><td>' + x.d + '</td></tr>'; }).join('') + '</table></section>' +
      '<section class="pslide pbreak"><h2>確認問題（' + l.qs.length + ' 問）</h2><ol class="pqs">' + qs + '</ol></section>' +
      '<section class="pslide pbreak"><h2>解答と解説</h2><ol class="pkey">' + l.qs.map(function (q, i) { return '<li><b>' + key[i] + '</b>　' + BL.esc(q.c[0]) + '<br><small>' + BL.esc(q.e) + '</small></li>'; }).join('') + '</ol></section></div>';
  }

  /* ========== 切りかえ ========== */
  function route() {
    clean();
    var h = (location.hash || '#home').slice(1).split('/'), mode = h[0] || 'home';
    if (['home', 'see', 'lesson', 'drill', 'game', 'battle', 'print'].indexOf(mode) < 0) mode = 'home';
    document.querySelectorAll('.modes button').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.mode === (mode === 'battle' ? 'game' : mode === 'print' ? 'lesson' : mode))); });
    document.body.dataset.mode = mode;
    view.scrollTop = 0;
    if (mode === 'home') renderHome();
    else if (mode === 'see') renderSee(h[1]);
    else if (mode === 'lesson') { if (h[1]) renderLesson(h[1]); else renderLessonMenu(); }
    else if (mode === 'drill') renderDrill();
    else if (mode === 'print') renderPrint(h[1]);
    else if (mode === 'battle') { view.innerHTML = ''; var bw = BL.el('div'); view.appendChild(bw); cleanup = BL.renderBattle(bw, h) || null; }
    else renderGames(h[1]);
  }
  /* キーボードで答える：1〜4（A〜D）で選択、Enter で次へ */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
    var k = '1234'.indexOf(e.key); if (k < 0) k = 'abcd'.indexOf(String(e.key).toLowerCase());
    if (k >= 0) {
      var groups = view.querySelectorAll('.qchoices, .bt-choices');
      for (var i = 0; i < groups.length; i++) { var bs = groups[i].querySelectorAll('button'); if (bs.length && !bs[0].disabled && groups[i].offsetParent) { if (bs[k]) { e.preventDefault(); bs[k].click(); } return; } }
    } else if (e.key === 'Enter') {
      var nb = view.querySelector('.qnext button'); if (nb && document.activeElement !== nb) { e.preventDefault(); nb.click(); }
    }
  });
  window.addEventListener('hashchange', route);
  route();
})();
