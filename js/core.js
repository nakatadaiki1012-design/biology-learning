/* 生物ラボ：共通の入れ物（データ・保存・小さな道具） */
var BL = window.BL = window.BL || {};
BL.lessons = BL.lessons || [];
BL.sims = BL.sims || [];
BL.addLessons = function (arr) { arr.forEach(function (l) { BL.lessons.push(l); }); };
BL.addSim = function (s) { BL.sims.push(s); };
BL.SUBJ = { kiso: '生物基礎', bio: '生物' };

/* ブラウザ保存（使えないときも動くように） */
BL.store = {
  get: function (k, d) { try { var v = localStorage.getItem('biolab:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem('biolab:' + k, JSON.stringify(v)); } catch (e) {} }
};

BL.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
BL.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
BL.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
BL.rnd = function (lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); };
BL.el = function (tag, attrs, html) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
  if (html != null) e.innerHTML = html;
  return e;
};

/* SVG を文字でつくる */
BL.svgNS = 'http://www.w3.org/2000/svg';
BL.fmt = function (v, d) { d = d == null ? 1 : d; var s = (+v).toFixed(d); return s === '-0' || s === '-0.0' ? s.slice(1) : s; };

/* グラフ（折れ線）を SVG の文字で返す
   o: {w,h,x:[min,max],y:[min,max],xl,yl,xt:[...],yt:[...],series:[{pts,c,dash,w,label}],marks:[{x,y,c,t}],vl:[{x,c,t}],hl:[{y,c,t}],ylog} */
BL.plot = function (o) {
  var keys = (o.series || []).filter(function (se) { return se.label; });
  var w = o.w || 360, h = o.h || 200;
  /* スマホでは横長のグラフを、縦にゆとりのある小さい図にかきなおす（文字が大きく見える） */
  if (!o.k && BL.narrow() && w > 400) { h = Math.round(Math.max(h * .8, 240)); w = 400; }
  /* スマホでは図が縮むので、文字と線を太くする（k 倍） */
  var k = o.k || (BL.narrow() ? Math.min(2.2, Math.max(1, w / (Math.min(innerWidth, 760) - 48) * .95)) : 1);
  var L = 44 * k, R = 10, T = (keys.length ? 40 : (o.yl ? 22 : 12)) * k, B = 34 * k;
  var X0 = o.x[0], X1 = o.x[1], Y0 = o.y[0], Y1 = o.y[1];
  function fy(y) { if (o.ylog) { y = Math.log10(Math.max(y, Y0)); return T + (h - T - B) * (1 - (y - Math.log10(Y0)) / (Math.log10(Y1) - Math.log10(Y0))); } return T + (h - T - B) * (1 - (y - Y0) / (Y1 - Y0)); }
  function fx(x) { return L + (w - L - R) * (x - X0) / (X1 - X0); }
  var s = '<svg class="svgfig" viewBox="0 0 ' + w + ' ' + h + '" role="img">';
  s += '<rect x="' + L + '" y="' + T + '" width="' + (w - L - R) + '" height="' + (h - T - B) + '" fill="none" stroke="var(--line)"/>';
  (o.yt || []).forEach(function (t) { var yy = fy(t); s += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--line)" stroke-dasharray="2 3"/><text x="' + (L - 4) + '" y="' + (yy + 4) + '" font-size="11" text-anchor="end" fill="var(--muted)">' + t + '</text>'; });
  (o.xt || []).forEach(function (t) { var xx = fx(t); s += '<line x1="' + xx + '" x2="' + xx + '" y1="' + (h - B) + '" y2="' + (h - B + 4) + '" stroke="var(--muted)"/><text x="' + xx + '" y="' + (h - B + 15 * k) + '" font-size="11" text-anchor="middle" fill="var(--muted)">' + t + '</text>'; });
  if (o.xl) s += '<text x="' + ((L + w - R) / 2) + '" y="' + (h - 3) + '" font-size="11.5" text-anchor="middle" fill="var(--ink)">' + o.xl + '</text>';
  if (o.yl) s += '<text x="4" y="' + (keys.length ? 13 * k : T - 6 * k) + '" font-size="11.5" fill="var(--ink)">' + o.yl + '</text>';
  (o.hl || []).forEach(function (l) { var yy = fy(l.y); s += '<line x1="' + L + '" x2="' + (w - R) + '" y1="' + yy + '" y2="' + yy + '" stroke="' + (l.c || 'var(--muted)') + '" stroke-dasharray="5 4"/>' + (l.t ? '<text x="' + (w - R - 3) + '" y="' + (yy - 3) + '" font-size="11" text-anchor="end" fill="' + (l.c || 'var(--muted)') + '">' + l.t + '</text>' : ''); });
  (o.vl || []).forEach(function (l) { var xx = fx(l.x); s += '<line x1="' + xx + '" x2="' + xx + '" y1="' + T + '" y2="' + (h - B) + '" stroke="' + (l.c || 'var(--muted)') + '" stroke-dasharray="5 4"/>' + (l.t ? '<text x="' + (xx + 3) + '" y="' + (T + 11) + '" font-size="11" fill="' + (l.c || 'var(--muted)') + '">' + l.t + '</text>' : ''); });
  s += '<g clip-path="none">';
  (o.series || []).forEach(function (se) {
    if (!se.pts.length) return;
    var d = se.pts.map(function (p, i) { var yy = Math.min(h - B, Math.max(T, fy(p[1]))); return (i ? 'L' : 'M') + fx(p[0]).toFixed(1) + ' ' + yy.toFixed(1); }).join('');
    s += '<path d="' + d + '" fill="none" stroke="' + se.c + '" stroke-width="' + (se.w || 2.4) + '"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : '') + ' stroke-linejoin="round" stroke-linecap="round"/>';
  });
  s += '</g>';
  (o.marks || []).forEach(function (m) { var xx = fx(m.x), yy = Math.min(h - B, Math.max(T, fy(m.y))); s += '<circle cx="' + xx + '" cy="' + yy + '" r="5" fill="' + (m.c || 'var(--warm)') + '" stroke="var(--panel)" stroke-width="1.5"/>' + (m.t ? '<text x="' + (xx + 7) + '" y="' + (yy - 6) + '" font-size="11.5" font-weight="700" fill="' + (m.c || 'var(--warm)') + '">' + m.t + '</text>' : ''); });
  if (keys.length) { var kx = L; s += keys.map(function (se) { var t = '<line x1="' + kx + '" x2="' + (kx + 16 * k) + '" y1="' + (T - 11 * k) + '" y2="' + (T - 11 * k) + '" stroke="' + se.c + '" stroke-width="3"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : '') + '/><text x="' + (kx + 20) + '" y="' + (T - 7) + '" font-size="11.5" fill="var(--ink)">' + se.label + '</text>'; kx += (30 + se.label.length * 12) * k; return t; }).join(''); }
  if (k !== 1) s = s.replace(/font-size="([\d.]+)"/g, function (m, v) { return 'font-size="' + (v * k).toFixed(1) + '"'; }).replace(/stroke-width="([\d.]+)"/g, function (m, v) { return 'stroke-width="' + (v * Math.sqrt(k)).toFixed(1) + '"'; }).replace(/ r="5"/g, ' r="' + (5 * k).toFixed(1) + '"');
  return s + '</svg>';
};
BL.narrow = function () { return window.innerWidth < 760; };

/* 操作パネルの部品 */
BL.ui = {
  slider: function (parent, o) {
    var row = BL.el('div', { class: 'sl' });
    var id = 'sl' + Math.random().toString(36).slice(2, 8);
    row.innerHTML = '<label for="' + id + '">' + o.label + '</label><input id="' + id + '" type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 1) + '" value="' + o.value + '"><output></output>';
    var inp = row.querySelector('input'), out = row.querySelector('output');
    function show() { out.textContent = (o.fmt ? o.fmt(+inp.value) : inp.value) + (o.unit || ''); }
    inp.addEventListener('input', function () { show(); o.on && o.on(+inp.value); });
    show(); parent.appendChild(row);
    return { get: function () { return +inp.value; }, set: function (v) { inp.value = v; show(); }, el: inp };
  },
  seg: function (parent, label, opts, value, on) {
    var wrap = BL.el('div', { class: 'row' });
    if (label) wrap.appendChild(BL.el('span', { style: 'font-size:13.5px;min-width:5em' }, label));
    var seg = BL.el('div', { class: 'seg' });
    var btns = opts.map(function (op) {
      var b = BL.el('button', { 'aria-pressed': String(op[0] === value) }, op[1]);
      b.addEventListener('click', function () { set(op[0]); on && on(op[0]); });
      seg.appendChild(b); return b;
    });
    function set(v) { value = v; btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(opts[i][0] === v)); }); }
    wrap.appendChild(seg); parent.appendChild(wrap);
    return { set: set, get: function () { return value; } };
  },
  btn: function (parent, text, on, cls) { var b = BL.el('button', { class: 'btn' + (cls ? ' ' + cls : '') }, text); b.addEventListener('click', on); parent.appendChild(b); return b; },
  meter: function (parent, items) {
    var m = BL.el('div', { class: 'meter' });
    m.innerHTML = items.map(function (t) { return '<div><small>' + t + '</small><b>–</b></div>'; }).join('');
    parent.appendChild(m);
    var bs = m.querySelectorAll('b');
    return function (vals, hl) { vals.forEach(function (v, i) { bs[i].innerHTML = v; bs[i].classList.toggle('hl', !!(hl && hl[i])); }); };
  },
  box: function (parent, cls, html) { var d = BL.el('div', { class: cls || '' }, html || ''); parent.appendChild(d); return d; }
};

/* アニメーション（画面から外れたら止まる） */
BL.loop = function (fn) {
  var on = true, last = 0;
  function f(t) { if (!on) return; var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; fn(dt); requestAnimationFrame(f); }
  requestAnimationFrame(f);
  return function () { on = false; };
};
