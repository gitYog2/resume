(function () {
  var S = window.SITE || {};
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var $ = function (id) { return document.getElementById(id); };

  if (S.sample && $('sample')) $('sample').hidden = false;

  /* Lightbox */
  var box, boxImg, boxCap, set = [], at = 0;
  function show(i) { at = (i + set.length) % set.length; boxImg.src = set[at].src; boxImg.alt = set[at].caption || ''; boxCap.textContent = (set[at].caption ? set[at].caption + ' ' : '') + '(' + (at + 1) + ' of ' + set.length + ')'; }
  function openBox(list, i) {
    if (!box) {
      box = el('dialog', 'box'); boxImg = el('img'); var bar = el('div', 'bar'); boxCap = el('span');
      var prev = el('button', '', 'Previous'), next = el('button', '', 'Next'), close = el('button', '', 'Close');
      prev.onclick = function () { show(at - 1); }; next.onclick = function () { show(at + 1); }; close.onclick = function () { box.close(); };
      var btns = el('div'); btns.style.cssText = 'display:flex;gap:.4rem'; btns.append(prev, next, close);
      bar.append(boxCap, btns); box.append(boxImg, bar); document.body.append(box);
      box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
      box.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
    }
    set = list; show(i); box.showModal();
  }
  function shot(list, i, ratio) {
    var p = list[i];
    if (!p.src) { var d = el('div', 'shot empty', 'Your photo'); if (ratio) d.style.setProperty('--r', ratio); return d; }
    var b = el('button', 'shot'); b.type = 'button'; b.setAttribute('aria-label', 'Open photo' + (p.caption ? ': ' + p.caption : ''));
    var img = el('img'); img.src = p.src; img.alt = p.caption || ''; img.loading = 'lazy'; b.append(img);
    b.onclick = function () { openBox(list.filter(function (x) { return x.src; }), list.filter(function (x) { return x.src; }).indexOf(p)); };
    return b;
  }

  /* Books */
  if ($('books')) (S.books || []).forEach(function (b, i) {
    var li = el('li'), c = el('div', 'cover c' + (i % 6));
    c.append(el('b', '', b.title), el('span', '', b.author)); li.append(c);
    if (b.note) li.append(el('p', '', b.note));
    if (b.fav) li.append(el('span', 'fav', 'Favourite'));
    $('books').append(li);
  });

  /* Events */
  if ($('events')) (S.events || []).forEach(function (ev) {
    var a = el('article', 'event'), l = el('div'), r = el('div');
    l.append(el('h2', '', ev.name), el('p', 'meta', [ev.date, ev.venue].filter(Boolean).join(', ')));
    if (ev.post) { var p = el('a', 'post', 'Read my post on LinkedIn'); p.href = ev.post; p.target = '_blank'; p.rel = 'noopener'; l.append(p); }
    if (ev.note) r.append(el('p', '', ev.note));
    var list = (ev.photos || []).map(function (s) { return { src: s, caption: ev.name }; });
    if (list.length) { var st = el('div', 'strip'); list.forEach(function (_, i) { st.append(shot(list, i)); }); r.append(st); }
    a.append(l, r); $('events').append(a);
  });

  /* Photos */
  if ($('gallery')) {
    var all = S.photos || [], ratios = ['4/5', '4/3', '1/1', '3/4', '16/10'];
    var tags = all.map(function (p) { return p.tag; }).filter(function (t, i, a) { return t && a.indexOf(t) === i; });
    function draw(tag) {
      $('gallery').textContent = '';
      var list = all.filter(function (p) { return !tag || p.tag === tag; });
      list.forEach(function (p, i) { var f = el('figure'); f.append(shot(list, i, ratios[all.indexOf(p) % ratios.length])); if (p.caption) f.append(el('figcaption', '', p.caption)); $('gallery').append(f); });
    }
    if (tags.length > 1) ['All'].concat(tags).forEach(function (t, i) {
      var b = el('button', '', t); b.type = 'button'; b.setAttribute('aria-pressed', i === 0);
      b.onclick = function () { $('filters').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(t === 'All' ? null : t); };
      $('filters').append(b);
    });
    draw(null);
  }

  /* Home: live event counter, about 25,000 a second */
  var num = $('liveCount');
  if (num) {
    var t0 = performance.now(), calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var paint = function () { num.textContent = Math.floor((performance.now() - t0) * 25).toLocaleString('en-IN'); };
    if (calm) setInterval(paint, 1000); else (function loop() { paint(); requestAnimationFrame(loop); })();
    paint();
  }

  /* Copy email */
  var copy = $('copyMail');
  if (copy) copy.addEventListener('click', function () {
    var say = function (t) { copy.textContent = t; setTimeout(function () { copy.textContent = 'Copy address'; }, 2000); };
    try { navigator.clipboard.writeText('yogis55585@gmail.com').then(function () { say('Copied'); }, function () { say('Select the address to copy'); }); }
    catch (e) { say('Select the address to copy'); }
  });
})();
