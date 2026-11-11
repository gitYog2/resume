/* Small-screen menu. Without JavaScript the links stay in a scrollable row. */
(function () {
  var top = document.querySelector('.top'), btn = document.getElementById('menuBtn'), nav = document.getElementById('nav');
  if (!top || !btn || !nav) return;
  top.classList.add('has-menu'); btn.hidden = false;
  function set(open) { top.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); }
  btn.addEventListener('click', function () { set(!top.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && top.classList.contains('open')) { set(false); btn.focus(); } });
  document.addEventListener('click', function (e) { if (!top.contains(e.target)) set(false); });
})();
