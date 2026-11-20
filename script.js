(function () {
  'use strict';

  // ---------- Прайс (все цены из данных 2ГИС салона, ₸) ----------
  var CUT_NAMES = {
    muzh: 'Мужская стрижка',
    det: 'Детская стрижка',
    nas: 'Стрижка под насадку',
    okant: 'Окантовка',
    ukl: 'Укладка'
  };
  var COLOR_NAMES = {
    bg: 'Камуфляж бороды и головы',
    b: 'Камуфляж бороды',
    k: 'Камуфляж'
  };

  var MASTERS = {
    farhat: { name: 'Фархат', cut: { muzh: [4000, 7000], det: [5000, 6000], nas: [3000, 4000], okant: [3000, 4000], ukl: [2000, 2000] },
      color: { bg: [9000, 9000], b: [5000, 5000], k: [6000, 6000] } },
    yusuf: { name: 'Юсуф', cut: { muzh: [4000, 4000], det: [3000, 3000], nas: [2500, 2500], okant: [3000, 3000], ukl: [1500, 1500] },
      color: { bg: [6000, 6000], b: [3000, 3000], k: [4000, 4000] } },
    ilnur: { name: 'Ильнур', cut: { muzh: [4000, 6000], det: [3000, 5000], nas: [2000, 3000], okant: [3000, 4000], ukl: [1500, 1500] } }
  };

  var SHAVE = [
    { id: 'sh-mod', name: 'Моделирование бороды', p: [4000, 4000] },
    { id: 'sh-ok', name: 'Окантовка бороды', p: [2000, 2000] },
    { id: 'sh-king', name: 'Королевское бритьё', p: [6000, 6000] }
  ];
  var FACE = [
    { id: 'fc-wax', name: 'Удаление волос с носа и ушей (воском)', p: [2000, 2000] },
    { id: 'fc-black', name: 'Маска чёрная + скраб', p: [3000, 3000] },
    { id: 'fc-clay', name: 'Маска глина + скраб', p: [3000, 3000] },
    { id: 'fc-scrub', name: 'Скраб', p: [1500, 1500] }
  ];

  // Каждая вкладка: группы строк + какое фото показывать
  function cutTab(m) {
    var items = Object.keys(CUT_NAMES).map(function (k) {
      return { id: m + '-' + k, kind: 'cut', key: k, master: m, name: CUT_NAMES[k], p: MASTERS[m].cut[k] };
    });
    return { img: 'cut', groups: [{ title: '', items: items }] };
  }
  function colorGroup(m) {
    return {
      title: MASTERS[m].name,
      items: Object.keys(COLOR_NAMES).map(function (k) {
        return { id: 'c-' + m + '-' + k, kind: 'color', key: k, master: m, name: COLOR_NAMES[k], p: MASTERS[m].color[k] };
      })
    };
  }
  var TABS = {
    farhat: cutTab('farhat'),
    yusuf: cutTab('yusuf'),
    ilnur: cutTab('ilnur'),
    color: { img: 'chair', groups: [colorGroup('farhat'), colorGroup('yusuf')] },
    shave: { img: 'shave', groups: [{ title: '', items: SHAVE }] },
    face: { img: 'chair', groups: [{ title: '', items: FACE }] }
  };

  // ---------- Вспомогательное ----------
  function fmt(n) { return n.toLocaleString('ru-RU').replace(/\s/g, ' '); }
  function price(p) { return p[0] === p[1] ? fmt(p[0]) + ' ₸' : fmt(p[0]) + '–' + fmt(p[1]) + ' ₸'; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- Демо-окошко ----------
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast() {
    clearTimeout(toastTimer);
    toast.hidden = false;
    void toast.offsetWidth; // перезапуск перехода
    toast.classList.add('is-on');
    toastTimer = setTimeout(hideToast, 3800);
  }
  function hideToast() {
    toast.classList.remove('is-on');
    setTimeout(function () { if (!toast.classList.contains('is-on')) toast.hidden = true; }, 400);
  }
  document.getElementById('toastClose').addEventListener('click', hideToast);
  document.querySelectorAll('.js-book').forEach(function (b) { b.addEventListener('click', showToast); });

  // ---------- Шапка при прокрутке ----------
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Услуги, вкладки, чек ----------
  var list = document.getElementById('list');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var imgs = document.querySelectorAll('.pm__img');
  var compare = document.getElementById('compare');
  var compareName = document.getElementById('compareName');
  var compareList = document.getElementById('compareList');
  var checkItems = document.getElementById('checkItems');
  var checkEmpty = document.getElementById('checkEmpty');
  var checkSum = document.getElementById('checkSum');
  var checkClear = document.getElementById('checkClear');

  var current = 'farhat';
  var selected = {};      // id -> услуга
  var order = [];         // порядок выбора
  var lastCompare = { cut: 'muzh', color: 'bg' };

  function renderList() {
    list.textContent = '';
    TABS[current].groups.forEach(function (g) {
      if (g.title) list.appendChild(el('p', 'group-title', g.title));
      g.items.forEach(function (it) {
        var row = el('button', 'row');
        row.type = 'button';
        row.setAttribute('aria-pressed', selected[it.id] ? 'true' : 'false');
        if (selected[it.id]) row.classList.add('is-on');
        row.appendChild(el('span', 'row__mark', '✓')).setAttribute('aria-hidden', 'true');
        row.appendChild(el('span', 'row__name', it.name));
        row.appendChild(el('span', 'row__dots')).setAttribute('aria-hidden', 'true');
        row.appendChild(el('span', 'row__price', price(it.p)));
        row.addEventListener('click', function () { toggle(it, row); });
        list.appendChild(row);
      });
    });
  }

  function renderCompare(kind, key, master) {
    if (kind !== 'cut' && kind !== 'color') { compare.classList.add('is-hidden'); return; }
    compare.classList.remove('is-hidden');
    var names = kind === 'cut' ? CUT_NAMES : COLOR_NAMES;
    compareName.textContent = names[key];
    compareList.textContent = '';
    Object.keys(MASTERS).forEach(function (m) {
      var src = MASTERS[m][kind];
      if (!src) return;
      var li = el('li');
      if (m === master) li.classList.add('is-cur');
      li.appendChild(el('span', '', MASTERS[m].name));
      li.appendChild(el('b', '', price(src[key])));
      compareList.appendChild(li);
    });
  }

  function compareForTab() {
    if (current === 'color') renderCompare('color', lastCompare.color, null);
    else if (MASTERS[current]) renderCompare('cut', lastCompare.cut, current);
    else renderCompare('none');
  }

  function toggle(it, row) {
    if (selected[it.id]) {
      delete selected[it.id];
      order = order.filter(function (id) { return id !== it.id; });
    } else {
      selected[it.id] = it;
      order.push(it.id);
    }
    var on = !!selected[it.id];
    row.classList.toggle('is-on', on);
    row.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (it.kind) {
      lastCompare[it.kind] = it.key;
      renderCompare(it.kind, it.key, it.master);
    }
    renderCheck();
  }

  function renderCheck() {
    checkItems.textContent = '';
    var min = 0, max = 0;
    order.forEach(function (id) {
      var it = selected[id];
      min += it.p[0];
      max += it.p[1];
      var li = el('li');
      var name = el('span', '', it.name);
      if (it.master) name.appendChild(el('small', '', 'мастер ' + MASTERS[it.master].name));
      li.appendChild(name);
      li.appendChild(el('b', '', price(it.p)));
      checkItems.appendChild(li);
    });
    checkEmpty.hidden = order.length > 0;
    checkClear.hidden = order.length === 0;
    checkSum.textContent = min === max ? fmt(min) + ' ₸' : 'от ' + fmt(min) + ' до ' + fmt(max) + ' ₸';
    checkSum.classList.remove('bump');
    void checkSum.offsetWidth;
    if (order.length) checkSum.classList.add('bump');
  }

  checkClear.addEventListener('click', function () {
    selected = {};
    order = [];
    renderList();
    renderCheck();
  });

  function setTab(name, focus) {
    if (name === current && list.childNodes.length) return;
    current = name;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    imgs.forEach(function (im) { im.classList.toggle('is-on', im.getAttribute('data-img') === TABS[name].img); });
    list.classList.add('is-switching');
    setTimeout(function () {
      renderList();
      compareForTab();
      list.classList.remove('is-switching');
    }, 220);
  }

  tabs.forEach(function (t, i) {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      setTab(n.getAttribute('data-tab'), true);
    });
  });

  renderList();
  compareForTab();
  renderCheck();

  // ---------- FAQ ----------
  document.querySelectorAll('.qa').forEach(function (qa) {
    var b = qa.querySelector('.qa__q');
    b.addEventListener('click', function () {
      var open = !qa.classList.contains('is-open');
      qa.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // ---------- Цифры: плавный счёт ----------
  function countUp(b) {
    var target = parseFloat(b.getAttribute('data-count'));
    var dec = b.getAttribute('data-count').indexOf('.') > -1 ? 1 : 0;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 1400);
      var v = target * (1 - Math.pow(1 - k, 3));
      b.textContent = v.toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- Появление при прокрутке + плавающая кнопка ----------
  var floatBook = document.getElementById('floatBook');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.classList.contains('nums')) en.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (s) { io.observe(s); });

    // Плавающая кнопка: после первого экрана, но прячется, пока виден чек или кнопки часов
    var heroOut = false, blockers = 0;
    var watch = document.querySelectorAll('.hero, .check, .hours__card, .footer');
    var vis = new Map();
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { vis.set(en.target, en.isIntersecting); });
      heroOut = !vis.get(document.querySelector('.hero'));
      blockers = 0;
      vis.forEach(function (v, k) { if (v && !k.classList.contains('hero')) blockers++; });
      floatBook.classList.toggle('is-on', heroOut && blockers === 0);
    });
    watch.forEach(function (w) { io2.observe(w); });
  } else {
    document.documentElement.classList.add('no-io');
  }

  // ---------- Часы: подсветка сегодняшнего дня и «открыто сейчас» (время Астаны) ----------
  var status = document.getElementById('hoursStatus');
  if (status) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Almaty', weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date());
      var wd = '', hr = 0;
      parts.forEach(function (p) { if (p.type === 'weekday') wd = p.value; if (p.type === 'hour') hr = parseInt(p.value, 10) % 24; });
      var open = hr >= 10 && hr < 21;
      status.classList.toggle('is-open', open);
      status.querySelector('span').textContent = open ? 'Сейчас открыто до 21:00' : (hr >= 21 ? 'Сейчас закрыто, откроемся завтра в 10:00' : 'Сейчас закрыто, откроемся в 10:00');
    } catch (e) { /* без подсветки */ }
  }
})();
