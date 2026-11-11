/* Interactive illustrations for the case-study pages. All data here is sample data. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function seen(node, fn) {
    if (!node) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.35 });
    io.observe(node);
  }

  /* ---------- temporal join: match activity to whoever was driving ---------- */
  var tj = $('#tj');
  if (tj) {
    var T0 = 6, T1 = 18, COL = { 'Driver 1': '#FFD84A', 'Driver 2': '#7C93FF', 'Driver 3': '#3DD68C' };
    var WHO = { 'Vehicle A': [['Driver 1', 6, 12], ['Driver 2', 12, 18]], 'Vehicle B': [['Driver 2', 6, 11], ['Driver 3', 11, 18]] };
    var SEG = [['Vehicle A', 6.5, 8.5, 'drive'], ['Vehicle A', 8.5, 9.2, 'idle'], ['Vehicle A', 9.2, 11.6, 'drive'], ['Vehicle A', 12.4, 14.8, 'drive'], ['Vehicle A', 14.8, 15.4, 'idle'], ['Vehicle A', 15.4, 17.5, 'drive'],
               ['Vehicle B', 6.2, 7.4, 'idle'], ['Vehicle B', 7.4, 10.6, 'drive'], ['Vehicle B', 11.3, 13.9, 'drive'], ['Vehicle B', 13.9, 14.6, 'idle'], ['Vehicle B', 14.6, 17.2, 'drive']];
    var pct = function (t) { return ((t - T0) / (T1 - T0) * 100) + '%'; };
    var axis = el('div', 'tj-axis'); axis.appendChild(el('span'));
    var ticks = el('div'); ['06:00', '09:00', '12:00', '15:00', '18:00'].forEach(function (t) { ticks.appendChild(el('span', '', t)); });
    axis.appendChild(ticks); tj.appendChild(axis);
    var segEls = [], whoEls = [];
    Object.keys(WHO).forEach(function (v) {
      var row = el('div', 'tj-row'); row.appendChild(el('b', '', v));
      var lane = el('div', 'tj-lane');
      WHO[v].forEach(function (w) {
        var d = el('div', 'tj-who', w[0]); d.style.left = pct(w[1]); d.style.width = 'calc(' + pct(w[2] - w[1] + T0) + ' - 3px)'; d.style.background = COL[w[0]];
        d.dataset.d = w[0]; lane.appendChild(d); whoEls.push(d);
      });
      SEG.filter(function (s) { return s[0] === v; }).forEach(function (s) {
        var d = el('div', 'tj-seg' + (s[3] === 'idle' ? ' idle' : ''), s[3] === 'idle' ? 'Idle' : 'Driving');
        d.style.left = pct(s[1]); d.style.width = 'calc(' + pct(s[2] - s[1] + T0) + ' - 3px)';
        var driver = WHO[v].filter(function (w) { return s[1] >= w[1] && s[1] < w[2]; })[0][0];
        d.dataset.d = driver; lane.appendChild(d); segEls.push({ node: d, driver: driver, hours: s[2] - s[1], type: s[3] });
      });
      row.appendChild(lane); tj.appendChild(row);
    });
    var out = el('div', 'tj-out'), cards = {};
    Object.keys(COL).forEach(function (name) {
      var b = el('button'); b.type = 'button';
      var dot = el('i'); dot.style.background = COL[name];
      var t = el('b', '', name), sm = el('small', '', 'Waiting for the join');
      b.appendChild(dot); b.appendChild(t); b.appendChild(sm); out.appendChild(b); cards[name] = { b: b, sm: sm };
      var hot = function (on) {
        tj.classList.toggle('dim', on);
        segEls.forEach(function (s) { s.node.classList.toggle('hot', on && s.driver === name); });
        whoEls.forEach(function (w) { w.classList.toggle('hot', on && w.dataset.d === name); });
      };
      b.addEventListener('mouseenter', function () { hot(true); }); b.addEventListener('mouseleave', function () { hot(false); });
      b.addEventListener('focus', function () { hot(true); }); b.addEventListener('blur', function () { hot(false); });
    });
    tj.appendChild(out);
    var fmt = function (h) { var m = Math.round(h * 60); return Math.floor(m / 60) + ' h ' + (m % 60 < 10 ? '0' : '') + (m % 60) + ' min'; };
    function reset() {
      segEls.forEach(function (s) { s.node.style.background = ''; s.node.style.color = ''; });
      Object.keys(cards).forEach(function (n) { cards[n].b.classList.remove('on'); cards[n].sm.textContent = 'Waiting for the join'; });
    }
    function run() {
      reset();
      segEls.forEach(function (s, k) {
        setTimeout(function () { s.node.style.backgroundColor = COL[s.driver]; s.node.style.color = '#0A1633'; }, calm ? 0 : 140 * k);
      });
      setTimeout(function () {
        Object.keys(cards).forEach(function (n) {
          var mine = segEls.filter(function (s) { return s.driver === n; });
          var sum = function (t) { return mine.filter(function (s) { return s.type === t; }).reduce(function (a, s) { return a + s.hours; }, 0); };
          cards[n].sm.textContent = 'Driving ' + fmt(sum('drive')) + ', idle ' + fmt(sum('idle'));
          cards[n].b.classList.add('on');
        });
      }, calm ? 0 : 140 * segEls.length + 200);
    }
    $('#tjRun').addEventListener('click', run);
    $('#tjReset').addEventListener('click', reset);
    seen(tj, run);
  }

  /* ---------- round trips: many small queries versus one batched query ---------- */
  var rt = $('#rt');
  if (rt) {
    var dots = $('#rtDots'), one = $('#rtOne'), n1 = $('#rtN1'), n2 = $('#rtN2'), N = 240, timers = [];
    for (var i = 0; i < N; i++) dots.appendChild(el('i'));
    var cells = $$('i', dots);
    function play() {
      timers.forEach(clearTimeout); timers = [];
      cells.forEach(function (c) { c.classList.remove('on'); }); one.classList.remove('on');
      n1.textContent = '0 round trips'; n2.textContent = '0 round trips';
      if (calm) { cells.forEach(function (c) { c.classList.add('on'); }); n1.textContent = 'Hundreds of round trips'; one.classList.add('on'); n2.textContent = '1 round trip'; return; }
      cells.forEach(function (c, k) {
        timers.push(setTimeout(function () { c.classList.add('on'); n1.textContent = (k + 1) + ' round trips'; if (k === N - 1) n1.textContent = 'Hundreds of round trips'; }, 12 * k));
      });
      timers.push(setTimeout(function () { one.classList.add('on'); n2.textContent = '1 round trip'; }, 250));
    }
    $('#rtRun').addEventListener('click', play);
    seen(rt, play);
  }

  /* ---------- fuel: a threshold decides what counts as an event ---------- */
  var fuel = $('#fuel');
  if (fuel) {
    var W = 720, H = 300, L = 44, R = 16, T = 18, B = 34, pts = [], lvl = 62, seed = 7;
    var rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    var EV = [{ at: 34, d: 34, kind: 'refuel', label: 'Refuel' }, { at: 56, d: -6, kind: 'noise', label: 'Slope' }, { at: 78, d: -15, kind: 'drain', label: 'Drain' }];
    for (var t = 0; t < 110; t++) {
      lvl -= 0.22; lvl += (rnd() - 0.5) * 1.6;
      EV.forEach(function (e) { if (t === e.at) lvl += e.d; if (e.kind === 'noise' && t === e.at + 3) lvl += 5.4; });
      pts.push(Math.max(4, Math.min(98, lvl)));
    }
    var X = function (i) { return L + i / (pts.length - 1) * (W - L - R); }, Y = function (v) { return T + (100 - v) / 100 * (H - T - B); };
    var NS = 'http://www.w3.org/2000/svg', svg = $('svg', fuel);
    var mk = function (tag, at) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); return n; };
    [0, 25, 50, 75, 100].forEach(function (v) {
      svg.appendChild(mk('line', { class: 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v) }));
      var tx = mk('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end' }); tx.textContent = v + '%'; svg.appendChild(tx);
    });
    var d = pts.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    svg.appendChild(mk('path', { class: 'area', d: d + ' L' + X(pts.length - 1) + ' ' + Y(0) + ' L' + X(0) + ' ' + Y(0) + ' Z' }));
    svg.appendChild(mk('path', { class: 'lvl', d: d }));
    var cap = mk('text', { x: W - R, y: H - 10, 'text-anchor': 'end' }); cap.textContent = 'Time'; svg.appendChild(cap);
    EV.forEach(function (e) {
      var g = mk('g', { class: 'mark' }), x = X(e.at), yTop = Y(Math.max(pts[e.at], pts[e.at - 1])) - 14;
      g.appendChild(mk('line', { x1: x, x2: x, y1: yTop, y2: Y(0), stroke: e.kind === 'noise' ? '#FF8A8A' : '#3DD68C', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
      g.appendChild(mk('circle', { cx: x, cy: yTop, r: 6, fill: e.kind === 'noise' ? '#FF8A8A' : '#3DD68C' }));
      var tx = mk('text', { x: x + 10, y: yTop + 4 }); tx.textContent = (e.d > 0 ? '+' : '−') + Math.abs(e.d) + '%'; g.appendChild(tx);
      svg.appendChild(g); e.g = g;
    });
    var range = $('#thr'), outv = $('#thrOut'), list = $('#found');
    function draw() {
      var thr = +range.value; outv.textContent = thr + '%'; list.textContent = '';
      EV.forEach(function (e) {
        var hit = Math.abs(e.d) >= thr; e.g.classList.toggle('on', hit);
        var li = el('li'), title, say;
        if (e.kind === 'noise') {
          title = hit ? 'False alarm' : 'Noise ignored';
          say = hit ? 'A 6% dip on a slope is reported as a drain.' : 'The 6% dip on a slope is correctly left alone.';
          li.className = hit ? 'bad' : 'hit';
        } else {
          title = e.label + (hit ? ' detected' : ' missed');
          say = (e.kind === 'refuel' ? 'Tank filled by 34%.' : 'Fuel dropped 15% while parked.') + (hit ? '' : ' The threshold is too high to see it.');
          li.className = hit ? 'hit' : 'bad';
        }
        li.appendChild(el('b', '', title)); li.appendChild(document.createTextNode(say)); list.appendChild(li);
      });
    }
    range.addEventListener('input', draw); draw();
  }

  /* ---------- idempotent upserts: the same message twice is still one row ---------- */
  var idem = $('#idem');
  if (idem) {
    var a = $('#idemA'), b = $('#idemB'), na = $('#idemNA'), nb = $('#idemNB'), sent = 0;
    var MSG = { key: 'Vehicle 12, 14:05', text: 'Refuel +34%' };
    function send() {
      sent++;
      var li = el('li', sent > 1 ? 'dup' : ''); li.appendChild(el('span', '', MSG.text)); li.appendChild(el('small', '', sent > 1 ? 'duplicate' : MSG.key));
      a.insertBefore(li, a.firstChild); while (a.children.length > 4) a.removeChild(a.lastChild);
      na.textContent = sent + (sent === 1 ? ' row. Correct.' : ' rows for one refuel. Wrong.');
      if (!b.firstChild) { var r = el('li'); r.appendChild(el('span', '', MSG.text)); r.appendChild(el('small', '', MSG.key)); b.appendChild(r); }
      else { b.firstChild.classList.remove('flash'); void b.firstChild.offsetWidth; b.firstChild.classList.add('flash'); }
      nb.textContent = '1 row, written ' + sent + (sent === 1 ? ' time.' : ' times. Still correct.');
      $('#idemSend').textContent = 'Deliver the same message again';
    }
    $('#idemSend').addEventListener('click', send);
    $('#idemReset').addEventListener('click', function () { sent = 0; a.textContent = ''; b.textContent = ''; na.textContent = 'No rows yet.'; nb.textContent = 'No rows yet.'; $('#idemSend').textContent = 'Deliver the message'; });
  }

  /* ---------- eShop order journey across three roles ---------- */
  var lanes = $('#lanes');
  if (lanes) {
    var steps = $$('button', lanes).sort(function (x, y) { return x.dataset.n - y.dataset.n; }), say = $('#laneSay'), at = -1, timer = null;
    function go(n) {
      at = n;
      steps.forEach(function (s, k) { s.classList.toggle('now', k === n); s.classList.toggle('done', k < n); });
      say.textContent = steps[n].dataset.say;
    }
    function auto() { timer = setInterval(function () { go((at + 1) % steps.length); }, 2200); }
    steps.forEach(function (s, k) { s.addEventListener('click', function () { clearInterval(timer); go(k); }); });
    go(0);
    if (!calm) seen(lanes, auto);
  }
})();
