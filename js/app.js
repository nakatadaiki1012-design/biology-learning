/* 生物ラボ：画面の切りかえ（見る／授業／演習／ゲーム） */
(function () {
  var view = document.getElementById('view'), cleanup = null;
  var S = BL.store;
  function clean() { if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; } document.onkeydown = null; }
  function toast(msg) { document.querySelectorAll('.toast').forEach(function (x) { x.remove(); }); var t = BL.el('div', { class: 'toast' }, msg); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  function lessonById(id) { return BL.lessons.filter(function (l) { return l.id === id; })[0]; }
  function simById(id) { return BL.sims.filter(function (s) { return s.id === id; })[0]; }
  function prog() { return S.get('lessons', {}); }
  function setProg(id, k, v) { var p = prog(); p[id] = p[id] || {}; p[id][k] = v; S.set('lessons', p); }
  var PARTORDER = {};
  BL.lessons.sort(function (a, b) { return (a.subj === b.subj ? 0 : a.subj === 'kiso' ? -1 : 1) || a.id.localeCompare(b.id, 'ja', { numeric: true }); });

  /* テーマ */
  var theme = S.get('theme', '');
  function applyTheme() { if (theme) document.documentElement.setAttribute('data-theme', theme); else document.documentElement.removeAttribute('data-theme'); }
  applyTheme();
  document.getElementById('themeBtn').addEventListener('click', function () {
    var dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    theme = dark ? 'light' : 'dark'; S.set('theme', theme); applyTheme(); route();
  });
  document.querySelector('.brand').addEventListener('click', function () { location.hash = '#see'; });
  document.querySelectorAll('.modes button').forEach(function (b) { b.addEventListener('click', function () { location.hash = '#' + b.dataset.mode; }); });

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
    var lib = BL.el('nav', { class: 'lib panel', 'aria-label': '実験の一覧' });
    var sf = BL.ui.seg(lib, '', [['', 'すべて'], ['kiso', '生物基礎'], ['bio', '生物']], subjF, function (v) { S.set('seeSubj', v); renderSee(sim.id); });
    var cat = null;
    BL.sims.forEach(function (s) {
      if (subjF && s.subj !== subjF) return;
      if (s.cat !== cat) { cat = s.cat; lib.appendChild(BL.el('div', { class: 'grp' }, cat)); }
      var b = BL.el('button', { class: 'item', 'aria-current': String(s.id === sim.id) }, '<span class="ic">' + s.ic + '</span><span>' + s.name + '<small>' + BL.SUBJ[s.subj] + '</small></span>' + (simDone(s.id) ? '<span class="done">✓</span>' : ''));
      b.addEventListener('click', function () { location.hash = '#see/' + s.id; });
      lib.appendChild(b);
    });
    var stage = BL.el('section', { class: 'stage panel' }), sin = BL.el('div', { class: 'stage-in' }); stage.appendChild(sin);
    var card = BL.el('aside', { class: 'card panel' });
    card.innerHTML = '<div class="card-head"><div class="eyebrow">' + BL.SUBJ[sim.subj] + '・' + sim.cat + '</div><h2 class="name">' + sim.name + '</h2><p class="lead">' + sim.lead + '</p></div>';
    var tabs = BL.el('div', { class: 'tabs', role: 'tablist' }); card.appendChild(tabs);
    var body = BL.el('div', { class: 'body' }); card.appendChild(body);
    var pTry = BL.el('div', { class: 'ctl' }), pHow = BL.el('div', {}, sim.how), pPts = BL.el('div');
    var ctl = BL.el('div', { class: 'ctl' }); pTry.appendChild(ctl);
    pTry.appendChild(BL.el('h3', { class: 'sub' }, 'やってみよう'));
    var tl = BL.el('ul', { class: 'tasks' }); pTry.appendChild(tl);
    function drawTasks() { var a = S.get('simtasks', {})[sim.id] || []; tl.innerHTML = sim.tasks.map(function (t, i) { return '<li class="' + (a[i] ? 'ok' : '') + '">' + t + '</li>'; }).join(''); }
    drawTasks();
    pPts.innerHTML = '<ul class="pts">' + sim.pts.map(function (p) { return '<li><b class="' + (p[0] ? '' : 'x') + '">' + (p[0] ? '○' : '×') + '</b><span>' + p[1] + '</span></li>'; }).join('') + '</ul>';
    var rel = BL.lessons.filter(function (l) { return l.sim === sim.id || l.slides.some(function (s) { return s.sim === sim.id; }); });
    if (rel.length) {
      pPts.appendChild(BL.el('h3', { class: 'sub' }, 'この内容の授業'));
      var rr = BL.el('div', { class: 'row' }); pPts.appendChild(rr);
      rel.forEach(function (l) { BL.ui.btn(rr, BL.SUBJ[l.subj] + ' ' + l.unit + ' ' + l.title, function () { location.hash = '#lesson/' + l.id; }); });
    }
    var panes = [['やってみる', pTry], ['しくみ', pHow], ['ポイント', pPts]];
    panes.forEach(function (p, i) {
      var b = BL.el('button', { role: 'tab', 'aria-selected': String(i === 0) }, p[0]); tabs.appendChild(b);
      p[1].hidden = i !== 0; body.appendChild(p[1]);
      b.addEventListener('click', function () { panes.forEach(function (q, j) { q[1].hidden = j !== i; tabs.children[j].setAttribute('aria-selected', String(j === i)); }); body.scrollTop = 0; });
    });
    wrap.appendChild(lib); wrap.appendChild(stage); wrap.appendChild(card); view.appendChild(wrap);
    cleanup = sim.mount(sin, ctl, simApi(sim, function () { drawTasks(); if (simDone(sim.id)) { var it = lib.querySelector('[aria-current="true"]'); if (it && !it.querySelector('.done')) it.appendChild(BL.el('span', { class: 'done' }, '✓')); } })) || null;
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
    h.appendChild(BL.el('h2', {}, '授業モード'));
    BL.ui.seg(h, '', [['kiso', '生物基礎'], ['bio', '生物']], subj, function (v) { S.set('lessonSubj', v); renderLessonMenu(); });
    var ls = BL.lessons.filter(function (l) { return l.subj === subj; });
    var nxt = ls.filter(function (l) { return !(p[l.id] && p[l.id].pass); })[0];
    var seen = ls.filter(function (l) { return p[l.id] && p[l.id].seen; }).length, pass = ls.filter(function (l) { return p[l.id] && p[l.id].pass; }).length;
    if (nxt) BL.ui.btn(h, '▶ 続きから：' + nxt.unit + ' ' + nxt.title, function () { location.hash = '#lesson/' + nxt.id; }, 'main');
    h.appendChild(BL.el('span', { class: 'note' }, '見た授業 ' + seen + '/' + ls.length + '　合格 ' + pass + '/' + ls.length));
    m.appendChild(h);
    m.appendChild(BL.el('p', { class: 'note' }, '大きな文字で 1 画面ずつ進む授業です。「次へ」または キーボードの ← → で進みます。最後に確認テスト（4問・3問正解で合格）。'));
    parts(subj).forEach(function (pt) {
      m.appendChild(BL.el('h3', { class: 'part' }, pt.n));
      var g = BL.el('div', { class: 'lgrid' }); m.appendChild(g);
      pt.ls.forEach(function (l) {
        var q = p[l.id] || {};
        var b = BL.el('button', { class: 'lcard' }, '<span class="no">' + l.unit + '</span><span><div class="t">' + l.title + '</div><div class="d">' + l.lead + '</div></span><span class="st">' + (q.pass ? '<span class="stamp sm">合格</span>' : q.seen ? '✓' : '') + '</span>');
        b.addEventListener('click', function () { location.hash = '#lesson/' + l.id; });
        g.appendChild(b);
      });
    });
    view.appendChild(m);
  }
  function mountFig(el, sl) {
    if (sl.sim && simById(sl.sim)) {
      var sim = simById(sl.sim), w = BL.el('div', { class: 'simwrap' });
      w.innerHTML = '<div class="eyebrow">見る：' + sim.name + '（動かしてみよう）</div>';
      var sin = BL.el('div', { class: 'stage-in' }), ctl = BL.el('div', { class: 'ctl' });
      w.appendChild(sin); w.appendChild(ctl); el.appendChild(w);
      return sim.mount(sin, ctl, simApi(sim)) || null;
    }
    el.innerHTML = '<div style="flex:1;display:flex;align-items:center;justify-content:center">' + sl.fig.replace('<svg', '<svg class="svgfig" style="max-height:62vh"') + '</div>';
    return null;
  }
  function askBox(a) {
    var d = BL.el('div', { class: 'ask' }, '<div class="q">' + a.q + '</div>');
    var g = BL.el('div', { class: 'qchoices' }); d.appendChild(g);
    var res = BL.el('div'); d.appendChild(res);
    var bs = BL.shuffle(a.c.map(function (c, i) { return { c: c, ok: i === 0 }; })).map(function (o) {
      var b = BL.el('button', { class: 'qc' }, o.c); g.appendChild(b);
      b.addEventListener('click', function () {
        bs.forEach(function (x) { x.b.disabled = true; if (x.ok) x.b.classList.add('right'); else if (x.b === b) x.b.classList.add('wrong'); else x.b.classList.add('dim'); });
        res.innerHTML = '<div class="verdict ' + (o.ok ? 'ok' : 'ng') + '">' + (o.ok ? '○ 正解！' : '× ざんねん') + '</div><p style="margin:4px 0 0">' + a.e + '</p>';
      });
      return { b: b, ok: o.ok };
    });
    return d;
  }
  function renderLesson(id, startAt) {
    var l = lessonById(id); if (!l) { renderLessonMenu(); return; }
    var N = l.slides.length, k = startAt || 0, figClean = null;
    view.innerHTML = '';
    var w = BL.el('div', { class: 'lesson' }); view.appendChild(w);
    var bar = BL.el('div', { class: 'lbar' }); w.appendChild(bar);
    BL.ui.btn(bar, '← 一覧', function () { location.hash = '#lesson'; });
    bar.appendChild(BL.el('h2', {}, '<span class="eyebrow" style="font-size:12px">' + BL.SUBJ[l.subj] + ' ' + l.unit + '</span> ' + l.title));
    var dots = BL.el('div', { class: 'dots' }); bar.appendChild(dots);
    var area = BL.el('div', { style: 'flex:1;display:flex;flex-direction:column' }); w.appendChild(area);
    var nav = BL.el('div', { class: 'lnav' }); w.appendChild(nav);
    var prev = BL.ui.btn(nav, '← 前へ', function () { go(k - 1); }, 'big');
    var pos = BL.el('span', { class: 'note' }); nav.appendChild(pos);
    var next = BL.ui.btn(nav, '次へ →', function () { go(k + 1); }, 'main big');
    function go(n) {
      if (n < 0 || n > N + 1) return;
      if (figClean) { try { figClean(); } catch (e) {} figClean = null; }
      k = n; draw(); window.scrollTo(0, 0);
    }
    cleanup = function () { if (figClean) figClean(); };
    function draw() {
      dots.innerHTML = ''; for (var i = 0; i <= N + 1; i++) dots.appendChild(BL.el('i', { class: i < k ? 'on' : i === k ? 'now' : '' }));
      area.innerHTML = ''; prev.disabled = k === 0; next.hidden = k === N + 1;
      pos.textContent = k < N ? (k + 1) + ' / ' + N : k === N ? 'テスト・入試に出るポイント' : '確認テスト';
      if (k < N) {
        var sl = l.slides[k], hasFig = sl.sim || sl.fig;
        var g = BL.el('div', { class: 'slide' + (hasFig ? '' : ' solo') }); area.appendChild(g);
        var t = BL.el('div', { class: 'stext panel' }, '<h3>' + sl.h + '</h3>' + sl.html); g.appendChild(t);
        if (sl.ask) t.appendChild(askBox(sl.ask));
        if (hasFig) { var f = BL.el('div', { class: 'sfig panel' }); g.appendChild(f); figClean = mountFig(f, sl); }
        next.textContent = k === N - 1 ? 'ポイントへ →' : '次へ →';
      } else if (k === N) {
        setProg(l.id, 'seen', 1);
        var e = BL.el('div', { class: 'slide solo' }); area.appendChild(e);
        e.innerHTML = '<div class="stext panel"><h3>テスト・入試に出るポイント</h3><ul class="pts">' + l.exam.map(function (x) { return '<li><b>!</b><span>' + x + '</span></li>'; }).join('') + '</ul><h3 style="margin-top:18px;font-size:19px">この授業の用語</h3><table class="tbl">' + l.terms.map(function (x) { return '<tr><th style="white-space:nowrap">' + x.w + '</th><td>' + x.d + '</td></tr>'; }).join('') + '</table></div>';
        next.textContent = '確認テストへ →';
      } else {
        var box = BL.el('div', { class: 'panel', style: 'max-width:860px;margin:0 auto;width:100%' }); area.appendChild(box);
        var items = BL.shuffle(l.qs.map(function (q, i) { return mcItem(l, q, i); })).slice(0, 4);
        runQuiz(box, items, { title: '確認テスト：' + l.title, onDone: function (score, n, el) {
          var ok = score >= 3;
          if (ok) setProg(l.id, 'pass', 1);
          var p = prog()[l.id] || {}; if (!p.best || score > p.best) setProg(l.id, 'best', score);
          var idx = BL.lessons.indexOf(l), nl = BL.lessons[idx + 1];
          el.innerHTML = '<div class="result"><div class="eyebrow">確認テスト</div><div class="big">' + score + ' / ' + n + '</div>' + (ok ? '<p><span class="stamp">合格</span></p><p>よくできました！</p>' : '<p>3 問以上で合格。もう一度ためしてみよう。</p>') + '</div>';
          var r = BL.el('div', { class: 'row', style: 'justify-content:center;padding-bottom:20px' }); el.appendChild(r);
          BL.ui.btn(r, 'もう一度テスト', function () { draw(); }, ok ? 'big' : 'main big');
          if (nl && nl.subj === l.subj) BL.ui.btn(r, '次の授業：' + nl.title + ' →', function () { location.hash = '#lesson/' + nl.id; }, ok ? 'main big' : 'big');
          BL.ui.btn(r, '授業の一覧', function () { location.hash = '#lesson'; }, 'big');
        } });
      }
    }
    document.onkeydown = function (e) { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (e.key === 'ArrowRight' && k < N + 1) go(k + 1); if (e.key === 'ArrowLeft') go(k - 1); };
    draw();
  }

  /* ========== 問題を解く（共通） ========== */
  function mcItem(l, q, i) { return { kind: 'mc', key: l.id + ':' + i, tag: BL.SUBJ[l.subj] + ' ' + l.unit + ' ' + l.title, q: q.q, c: q.c, e: q.e }; }
  function calcItem(c) { var g = c.gen(); return { kind: 'calc', key: 'calc:' + c.id, tag: BL.SUBJ[c.subj] + ' 計算：' + c.t, q: g.q, ans: g.ans, tol: g.tol, u: g.u, steps: g.steps }; }
  function markWrong(key, wrong) {
    var w = S.get('wrong', []); var i = w.indexOf(key);
    if (wrong && i < 0) w.push(key); if (!wrong && i >= 0) w.splice(i, 1);
    S.set('wrong', w);
  }
  function runQuiz(el, items, opt) {
    var n = 0, score = 0, wrongs = [];
    function q() {
      if (n >= items.length) { opt.onDone(score, items.length, el, wrongs); return; }
      var it = items[n];
      el.innerHTML = '';
      var b = BL.el('div', { class: 'qbox' }); el.appendChild(b);
      b.innerHTML = '<div class="row" style="justify-content:space-between"><span class="eyebrow">' + (opt.title ? opt.title + '　' : '') + it.tag + '</span><b style="font-family:var(--font-data)">' + (n + 1) + ' / ' + items.length + '</b></div><div class="qprog"><i style="width:' + (n / items.length * 100) + '%"></i></div><div class="qtext">' + it.q + '</div>';
      var res = BL.el('div'), nx = BL.el('div', { class: 'row', style: 'margin-top:10px' });
      function after(ok, html) {
        if (ok) score++; else wrongs.push(it);
        markWrong(it.key, !ok);
        res.innerHTML = '<div class="verdict ' + (ok ? 'ok' : 'ng') + '">' + (ok ? '○ 正解！' : '× ざんねん') + '</div>' + html;
        var nb = BL.ui.btn(nx, n + 1 < items.length ? '次の問題 →' : '結果を見る →', function () { n++; q(); }, 'main big'); nb.focus();
      }
      if (it.kind === 'mc') {
        var g = BL.el('div', { class: 'qchoices' }); b.appendChild(g);
        var os = BL.shuffle(it.c.map(function (c, i) { return { c: c, ok: i === 0 }; }));
        var bs = os.map(function (o) {
          var bt = BL.el('button', { class: 'qc' }, BL.esc(o.c)); g.appendChild(bt);
          bt.addEventListener('click', function () {
            bs.forEach(function (x, j) { x.disabled = true; if (os[j].ok) x.classList.add('right'); else if (x === bt) x.classList.add('wrong'); else x.classList.add('dim'); });
            after(o.ok, '<p style="margin:6px 0 0">' + BL.esc(it.e) + '</p>');
          });
          return bt;
        });
      } else {
        var a = BL.el('div', { class: 'ans' }, '<input type="text" inputmode="decimal" aria-label="答え" placeholder="数字"><span>' + (it.u || '') + '</span>');
        b.appendChild(a);
        var inp = a.querySelector('input'), hint = 0, hb = BL.el('ol', { class: 'sol' });
        var chk = BL.ui.btn(a, '答え合わせ', check, 'main');
        var hbtn = BL.ui.btn(a, 'ヒント', function () { if (hint < it.steps.length - 1) { hint++; hb.innerHTML = it.steps.slice(0, hint).map(function (s) { return '<li>' + s + '</li>'; }).join(''); } });
        b.appendChild(hb);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
        setTimeout(function () { inp.focus(); }, 30);
        function check() {
          var v = parseFloat(inp.value.replace(/[０-９．]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/[^0-9.\-]/g, ''));
          if (isNaN(v)) { inp.focus(); return; }
          chk.disabled = hbtn.disabled = inp.disabled = true; hb.innerHTML = '';
          var ok = Math.abs(v - it.ans) <= (it.tol || 0.001) + 1e-9;
          after(ok, '<p style="margin:6px 0 2px">答え：<b style="font-family:var(--font-data);font-size:18px">' + it.ans + ' ' + (it.u || '') + '</b></p><ol class="sol">' + it.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>');
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
    var side = BL.el('aside', { class: 'drill-side panel' }), main = BL.el('section', { class: 'panel' });
    w.appendChild(side); w.appendChild(main);
    side.appendChild(BL.el('h2', { style: 'margin:0 0 6px;font-size:20px' }, '演習'));
    BL.ui.seg(side, '', [['kiso', '生物基礎'], ['bio', '生物']], subj, function (v) { S.set('drillSubj', v); renderDrill(); });
    side.appendChild(BL.el('div', { style: 'height:6px' }));
    BL.ui.seg(side, '', [['mc', '4択'], ['calc', '計算'], ['review', '復習']], type, function (v) { S.set('drillType', v); renderDrill(); });
    side.appendChild(BL.el('div', { style: 'height:6px' }));
    BL.ui.seg(side, '問題数', [[10, '10'], [20, '20'], [40, '40']], cnt, function (v) { cnt = v; S.set('drillCnt', v); });
    var units = BL.el('div', { class: 'units', style: 'margin-top:8px' });
    var wrong = S.get('wrong', []);
    if (type === 'mc') {
      var all = BL.el('label', {}, '<input type="checkbox"> <b>ぜんぶ選ぶ / はずす</b>'); units.appendChild(all);
      parts(subj).forEach(function (pt) {
        units.appendChild(BL.el('div', { class: 'pl' }, pt.n));
        pt.ls.forEach(function (l) {
          var lb = BL.el('label', {}, '<input type="checkbox" value="' + l.id + '"' + (sel[l.id] ? ' checked' : '') + '> ' + l.unit + ' ' + l.title); units.appendChild(lb);
        });
      });
      units.addEventListener('change', function (e) {
        var boxes = units.querySelectorAll('input[value]');
        if (e.target === all.firstChild) boxes.forEach(function (b) { b.checked = all.firstChild.checked; });
        boxes.forEach(function (b) { sel[b.value] = b.checked; }); S.set('drillSel', sel);
      });
    } else if (type === 'calc') {
      BL.calcs.filter(function (c) { return c.subj === subj; }).forEach(function (c) { units.appendChild(BL.el('label', {}, '<input type="checkbox" value="' + c.id + '" checked> ' + c.t)); });
    } else {
      units.appendChild(BL.el('p', { class: 'note' }, 'まちがえた問題が ' + wrong.length + ' 問あります。正解すると復習リストから消えます。'));
    }
    side.appendChild(units);
    var go = BL.el('div', { class: 'row', style: 'margin-top:10px' }); side.appendChild(go);
    BL.ui.btn(go, 'スタート', start, 'main big');
    main.innerHTML = '<div class="qbox"><h3 style="margin-top:0">' + (type === 'mc' ? '4択問題' : type === 'calc' ? '計算問題（数字は毎回変わる）' : '復習') + '</h3><p>' + (type === 'mc' ? '左で単元をえらんで「スタート」。何もえらばないと、その科目ぜんぶから出ます。答えると解説が出ます。' : type === 'calc' ? '答えを数字で入力します。わからないときは「ヒント」で解き方を 1 行ずつ見られます。' : 'これまでにまちがえた問題（4択・計算）をもう一度ときます。') + '</p><p class="note">生物基礎 ' + BL.lessons.filter(function (l) { return l.subj === 'kiso'; }).length * 10 + ' 問、生物 ' + BL.lessons.filter(function (l) { return l.subj === 'bio'; }).length * 10 + ' 問、計算 ' + BL.calcs.length + ' 種類</p></div>';
    function start() {
      var items = [];
      if (type === 'mc') {
        var ls = BL.lessons.filter(function (l) { return l.subj === subj && sel[l.id]; });
        if (!ls.length) ls = BL.lessons.filter(function (l) { return l.subj === subj; });
        ls.forEach(function (l) { l.qs.forEach(function (q, i) { items.push(mcItem(l, q, i)); }); });
        items = BL.shuffle(items).slice(0, cnt);
      } else if (type === 'calc') {
        var ids = Array.prototype.map.call(units.querySelectorAll('input:checked'), function (b) { return b.value; });
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
        if (!items.length) { main.innerHTML = '<div class="qbox"><p>復習する問題はありません。まずは 4択 か 計算 をやってみよう。</p></div>'; return; }
      }
      runQuiz(main, items, { onDone: function (score, n, el, wr) {
        var h = S.get('drillHist', []); h.push([Date.now(), subj, type, score, n]); S.set('drillHist', h.slice(-50));
        el.innerHTML = '<div class="result"><div class="eyebrow">結果</div><div class="big">' + score + ' / ' + n + '</div>' + (score === n ? '<p><span class="stamp">満点</span></p>' : '') + '</div>';
        if (wr.length) el.appendChild(BL.el('div', { class: 'qbox' }, '<h3 style="margin-top:0">まちがえた問題（復習に入りました）</h3><ul>' + wr.map(function (it) { return '<li>' + it.q + '<br><small style="color:var(--ok)">答え：' + (it.kind === 'mc' ? BL.esc(it.c[0]) : it.ans + ' ' + (it.u || '')) + '</small></li>'; }).join('') + '</ul>'));
        var r = BL.el('div', { class: 'row', style: 'justify-content:center;padding:0 0 20px' }); el.appendChild(r);
        BL.ui.btn(r, 'もう一度', start, 'main big'); BL.ui.btn(r, '設定にもどる', renderDrill, 'big');
      } });
    }
  }

  /* ========== ゲーム ========== */
  function renderGames(id) {
    view.innerHTML = '';
    var w = BL.el('div', { class: 'game' }); view.appendChild(w);
    var g = BL.games.filter(function (x) { return x.id === id; })[0];
    if (g) { g.run(w, function () { location.hash = '#game'; }); return; }
    w.appendChild(BL.el('h2', { style: 'margin:4px 0 10px' }, 'ゲーム'));
    var cc = BL.el('div', { class: 'choicecards' }); w.appendChild(cc);
    BL.games.forEach(function (x) {
      var b = BL.bestOf(x.id === 'time' ? 'time' : x.id);
      var c = BL.el('button', { class: 'ccard' }, '<div class="em">' + x.em + '</div><div class="t">' + x.name + '</div><div class="d">' + x.desc + '</div>' + (b != null ? '<div class="best">自己ベスト：' + b + ' ' + x.unit + '</div>' : ''));
      c.addEventListener('click', function () { location.hash = '#game/' + x.id; });
      cc.appendChild(c);
    });
  }

  /* ========== 切りかえ ========== */
  function route() {
    clean();
    var h = (location.hash || '#see').slice(1).split('/'), mode = h[0] || 'see';
    if (['see', 'lesson', 'drill', 'game'].indexOf(mode) < 0) mode = 'see';
    document.querySelectorAll('.modes button').forEach(function (b) { b.setAttribute('aria-current', String(b.dataset.mode === mode)); });
    window.scrollTo(0, 0);
    if (mode === 'see') renderSee(h[1]);
    else if (mode === 'lesson') { if (h[1]) renderLesson(h[1]); else renderLessonMenu(); }
    else if (mode === 'drill') renderDrill();
    else renderGames(h[1]);
  }
  window.addEventListener('hashchange', route);
  route();
})();
