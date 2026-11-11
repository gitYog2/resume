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

  /* ---- SATS illustration: pick a district (sample data) ---- */
  var sats = $('#sats');
  if (sats) {
    var D = [['Bengaluru Urban', 94, 96, 2], ['Mysuru', 91, 93, 4], ['Tumakuru', 89, 92, 5], ['Belagavi', 87, 90, 6],
             ['Dakshina Kannada', 96, 97, 1], ['Shivamogga', 90, 91, 4], ['Kalaburagi', 82, 86, 9], ['Ballari', 84, 88, 8]];
    var list = $('.dist', sats), cls = $('#cls');
    for (var c = 1; c <= 10; c++) { var bar = document.createElement('div'); bar.dataset.c = c; cls.appendChild(bar); }
    function district(n) {
      var d = D[n];
      $$('button', list).forEach(function (b, k) { b.setAttribute('aria-pressed', k === n); });
      $('#satsName').textContent = d[0];
      $('#k1').textContent = d[1] + '%'; $('#k2').textContent = d[2] + '%'; $('#k3').textContent = d[3] + '%';
      $$('div', cls).forEach(function (bar, k) {
        var h = d[1] - k * (2 + (n % 3)) + ((k * 7 + n * 5) % 6);
        bar.style.setProperty('--h', Math.max(30, Math.min(100, h)));
      });
    }
    D.forEach(function (d, n) {
      var b = document.createElement('button'); b.type = 'button';
      b.appendChild(document.createTextNode(d[0]));
      var i = document.createElement('i'); i.style.setProperty('--p', d[1]); b.appendChild(i);
      b.addEventListener('click', function () { district(n); });
      list.appendChild(b);
    });
    district(2);
  }

  /* ---- Coffee Board illustration: eShop and land survey ---- */
  var coffee = $('#coffee');
  if (coffee) {
    var wt = $$('.wtabs button', coffee), views = $$('.view', coffee), drawn = false;
    function view(n) {
      wt.forEach(function (t, k) { t.setAttribute('aria-selected', k === n); t.tabIndex = k === n ? 0 : -1; });
      views.forEach(function (v, k) { v.classList.toggle('on', k === n); });
      if (n === 1 && !drawn) { drawn = true; demoPlot(); }
    }
    wt.forEach(function (t, k) { t.addEventListener('click', function () { view(k); }); });

    /* eShop */
    var ITEMS = [['Filter coffee', '500 g', 320, '#7A4A2B', 1], ['Arabica beans', '250 g', 410, '#2B4BFF', 1], ['Robusta blend', '1 kg', 560, '#0A1633', 0]];
    var ul = $('#items'), total = $('#total'), order = $('#order'), steps = $$('#track li'), label = $('#label'), dl = $('#dl'), tm = [];
    function money(n) { return '₹' + n.toLocaleString('en-IN'); }
    function sum() { return ITEMS.reduce(function (s, it) { return s + it[2] * it[4]; }, 0); }
    function resetOrder() {
      tm.forEach(clearTimeout); tm = [];
      steps.forEach(function (s) { s.classList.remove('on'); });
      label.classList.remove('on'); dl.disabled = true; dl.textContent = 'Download label';
      order.textContent = 'Place order'; order.classList.remove('done'); order.disabled = sum() === 0;
      total.textContent = money(sum());
    }
    ITEMS.forEach(function (it) {
      var li = document.createElement('li'), ic = document.createElement('i'); ic.style.setProperty('--c', it[3]);
      var tx = document.createElement('div'), b = document.createElement('b'), sm = document.createElement('small');
      b.textContent = it[0]; sm.textContent = it[1] + ', ' + money(it[2]); tx.appendChild(b); tx.appendChild(sm);
      var q = document.createElement('div'); q.className = 'qty';
      var minus = document.createElement('button'), n = document.createElement('span'), plus = document.createElement('button');
      minus.type = plus.type = 'button'; minus.textContent = '−'; plus.textContent = '+'; n.textContent = it[4];
      minus.setAttribute('aria-label', 'One less ' + it[0]); plus.setAttribute('aria-label', 'One more ' + it[0]);
      minus.onclick = function () { it[4] = Math.max(0, it[4] - 1); n.textContent = it[4]; resetOrder(); };
      plus.onclick = function () { it[4] = Math.min(9, it[4] + 1); n.textContent = it[4]; resetOrder(); };
      q.appendChild(minus); q.appendChild(n); q.appendChild(plus);
      li.appendChild(ic); li.appendChild(tx); li.appendChild(q); ul.appendChild(li);
    });
    function place() {
      resetOrder(); order.disabled = true; order.textContent = 'Processing';
      var gap = calm ? 0 : 800;
      steps.forEach(function (s, k) {
        tm.push(setTimeout(function () {
          s.classList.add('on');
          if (k === 2) { label.classList.add('on'); dl.disabled = false; }
          if (k === steps.length - 1) { order.textContent = 'Dispatched. Order again'; order.classList.add('done'); order.disabled = false; }
        }, gap * (k + 1)));
      });
    }
    order.addEventListener('click', place);
    dl.addEventListener('click', function () { dl.textContent = 'Sample label, nothing to download'; });
    resetOrder();
    var ran = false;
    watch(coffee, function (v) { if (v && !ran) { ran = true; place(); } }, { threshold: 0.25 });

    /* land survey: tap to mark corners, area by the shoelace formula */
    var svgP = $('#plot'), poly = $('#poly'), ptsG = $('#pts'), P = [], demo = [];
    var reg = $('#register'), sub = $('#subsidy');
    function redraw() {
      poly.setAttribute('points', P.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
      ptsG.textContent = '';
      P.forEach(function (p) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 5); c.setAttribute('class', 'pt'); ptsG.appendChild(c);
      });
      var a = 0;
      for (var k = 0; k < P.length; k++) { var q = P[(k + 1) % P.length]; a += P[k][0] * q[1] - q[0] * P[k][1]; }
      $('#corners').textContent = P.length;
      $('#area').textContent = (Math.abs(a) / 2 / 2600).toFixed(2) + ' acres';
      reg.disabled = P.length < 3; reg.textContent = 'Register for subsidy'; reg.classList.remove('done');
      sub.className = 'chipline'; sub.textContent = P.length < 3 ? 'Mark at least 3 corners' : 'Plot ready to register';
    }
    function stopDemo() { demo.forEach(clearTimeout); demo = []; }
    function demoPlot() {
      var pts = [[70, 70], [190, 48], [232, 120], [170, 178], [84, 150]];
      if (calm) { P = pts; redraw(); return; }
      pts.forEach(function (p, k) { demo.push(setTimeout(function () { P.push(p); redraw(); }, 450 * (k + 1))); });
    }
    svgP.addEventListener('click', function (e) {
      stopDemo();
      if (P.length >= 12) return;
      var m = svgP.getScreenCTM(); if (!m) return;
      var at = svgP.createSVGPoint(); at.x = e.clientX; at.y = e.clientY; at = at.matrixTransform(m.inverse());
      P.push([Math.round(at.x), Math.round(at.y)]);
      redraw();
    });
    $('#clear').addEventListener('click', function () { stopDemo(); P = []; redraw(); });
    reg.addEventListener('click', function () {
      reg.textContent = 'Application submitted'; reg.classList.add('done'); reg.disabled = true;
      sub.className = 'chipline ok'; sub.textContent = 'Subsidy application received';
    });
    redraw();
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
