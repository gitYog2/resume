(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* run fn(true/false) as an element enters or leaves the viewport */
  function watch(el, fn, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.isIntersecting); }); }, opts || { threshold: 0.15 }).observe(el);
  }

  /* reveal on scroll */
  $$('.rv').forEach(function (el) {
    var seen = false;
    watch(el, function (v) { if (v && !seen) { seen = true; el.classList.add('in'); } }, { threshold: 0.12 });
  });

  /* headline word swap */
  var swap = $('.swap');
  if (swap && !calm) {
    var words = $$('span', swap), i = 0;
    setInterval(function () {
      i = (i + 1) % words.length;
      words.forEach(function (w) { w.style.transform = 'translateY(-' + (i * 100) + '%)'; });
    }, 2400);
  }

  /* ---- VZone illustration: vehicles moving on a map ---- */
  var fleet = $('#fleet');
  if (fleet) {
    var NS = 'http://www.w3.org/2000/svg';
    var routes = $$('.route', fleet), layer = $('#vehs'), halo = $('#halo');
    var picked = $('#picked'), rate = $('#rate'), feed = $('#feed');
    var COL = { Moving: '#12A150', Idle: '#E0A100', Alert: '#E5484D' };
    var vs = [];
    [[0, .05, 46, 'Moving'], [0, .55, 38, 'Moving'], [1, .2, 52, 'Moving'], [1, .7, 0, 'Idle'], [2, .1, 61, 'Alert'],
     [2, .6, 44, 'Moving'], [3, .35, 33, 'Moving'], [3, .85, 49, 'Moving'], [4, .4, 0, 'Idle'], [4, .9, 57, 'Moving']
    ].forEach(function (d, n) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 6.5); c.setAttribute('class', 'veh'); c.setAttribute('fill', COL[d[3]]);
      c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 2.5);
      c.setAttribute('tabindex', 0); c.setAttribute('role', 'button');
      c.setAttribute('aria-label', 'Vehicle ' + (n + 1) + ', ' + d[3].toLowerCase());
      var v = { el: c, path: routes[d[0]], len: routes[d[0]].getTotalLength(), p: d[1], kmh: d[2], state: d[3], id: n + 1, x: 0, y: 0 };
      c.addEventListener('click', function () { pick(v); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(v); } });
      layer.appendChild(c); vs.push(v);
    });
    var sel = vs[0];
    function pick(v) { vs.forEach(function (o) { o.el.classList.toggle('sel', o === v); }); sel = v; card(); }
    function card() {
      picked.innerHTML = '';
      var b = document.createElement('span'); b.textContent = 'Vehicle ' + (sel.id < 10 ? '0' : '') + sel.id;
      var s = document.createElement('small'); s.textContent = sel.state + (sel.kmh ? ', ' + sel.kmh + ' km/h' : '');
      picked.appendChild(b); picked.appendChild(s);
    }
    function place() {
      vs.forEach(function (v) {
        var pt = v.path.getPointAtLength(v.p * v.len);
        v.x = pt.x; v.y = pt.y; v.el.setAttribute('cx', pt.x); v.el.setAttribute('cy', pt.y);
      });
      halo.setAttribute('cx', sel.x); halo.setAttribute('cy', sel.y);
    }
    var last = 0, on = false, raf = 0;
    function loop(t) {
      var dt = Math.min(60, t - (last || t)); last = t;
      vs.forEach(function (v) { if (v.kmh) v.p = (v.p + (v.kmh * dt) / (v.len * 520)) % 1; });
      place();
      if (on) raf = requestAnimationFrame(loop);
    }
    var MSG = [['Trip started', '#12A150'], ['Fuel refuel detected', '#2B4BFF'], ['Geofence exit', '#E0A100'], ['Overspeed alert', '#E5484D'],
               ['Trip ended', '#55607A'], ['Fuel drain detected', '#E5484D'], ['Geofence entry', '#12A150'], ['Idling over 10 min', '#E0A100']];
    var mi = 0;
    function push() {
      var m = MSG[mi++ % MSG.length], li = document.createElement('li');
      li.style.setProperty('--c', m[1]);
      li.textContent = m[0] + ', vehicle ' + (1 + Math.floor(Math.random() * vs.length));
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > 4) feed.removeChild(feed.lastChild);
    }
    function tickRate() { rate.firstChild.nodeValue = (20000 + Math.floor(Math.random() * 10000)).toLocaleString('en-IN'); }
    pick(sel); place(); push(); push(); push(); tickRate();
    var t1, t2;
    watch(fleet, function (v) {
      if (calm) return;
      if (v && !on) { on = true; last = 0; raf = requestAnimationFrame(loop); t1 = setInterval(push, 2300); t2 = setInterval(tickRate, 900); }
      else if (!v && on) { on = false; cancelAnimationFrame(raf); clearInterval(t1); clearInterval(t2); }
    });
  }

  /* ---- report illustration: bars grow when seen ---- */
  var bars = $('.bars');
  watch(bars, function (v) { if (v) bars.classList.add('in'); }, { threshold: 0.4 });

  /* ---- OTP and payment illustration ---- */
  var phone = $('#phone');
  if (phone) {
    var steps = $$('.step', phone), dots = $$('.dots i', phone), boxes = $$('.otp span', phone), CODE = '482913';
    var timers = [], running = false;
    function show(n) {
      steps.forEach(function (s, k) { s.classList.toggle('on', k === n); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k <= n); });
    }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function run() {
      boxes.forEach(function (b) { b.textContent = ''; b.classList.remove('f'); });
      show(0);
      boxes.forEach(function (b, k) { later(function () { b.textContent = CODE[k]; b.classList.add('f'); }, 700 + k * 260); });
      later(function () { show(1); }, 3100);
      later(function () { show(2); }, 5600);
      later(run, 9200);
    }
    if (calm) { boxes.forEach(function (b, k) { b.textContent = CODE[k]; b.classList.add('f'); }); show(0); }
    else watch(phone, function (v) {
      if (v && !running) { running = true; run(); }
      else if (!v && running) { running = false; timers.forEach(clearTimeout); timers = []; }
    });
  }

  /* ---- stack explorer: tabs and plates stay in sync ---- */
  var tabs = $$('.tabs button'), panes = $$('.pane'), plates = $$('.plate');
  function choose(n, focus) {
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === n); t.tabIndex = k === n ? 0 : -1; });
    panes.forEach(function (p, k) { p.classList.toggle('on', k === n); });
    plates.forEach(function (p) { p.setAttribute('aria-pressed', +p.dataset.k === n); });
    if (focus) tabs[n].focus();
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { choose(k); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') choose((k + 1) % tabs.length, true);
      if (e.key === 'ArrowLeft') choose((k + tabs.length - 1) % tabs.length, true);
    });
  });
  plates.forEach(function (p) { p.addEventListener('click', function () { choose(+p.dataset.k); }); });

  /* ---- numbers count up once ---- */
  $$('.nums b').forEach(function (b) {
    var to = parseFloat(b.dataset.to), dec = (b.dataset.to.split('.')[1] || '').length, suf = b.dataset.suf || '', done = false;
    var set = function (v) { b.textContent = v.toFixed(dec) + suf; };
    if (calm) { set(to); return; }
    set(0);
    watch(b, function (v) {
      if (!v || done) return; done = true;
      var t0 = performance.now();
      (function f(t) { var p = Math.min(1, (t - t0) / 1400); set(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
    }, { threshold: 0.6 });
  });

  /* ---- Bengaluru time in the contact block ---- */
  var clock = $('#clock');
  if (clock) {
    var tick = function () {
      try { clock.textContent = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) + ' in Bengaluru'; }
      catch (e) { clock.textContent = 'Bengaluru, India'; }
    };
    tick(); setInterval(tick, 20000);
  }
})();
