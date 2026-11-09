/* EatMe для бизнеса — landing concept behaviour.
   Local only: no network requests, no cookies, no storage. Mock screens are
   cloned from <template> elements; every motion either answers the visitor
   (tabs, switches, brand picker, scroll) or is the single hero sequence,
   which can be paused and is replaced by a still frame under reduced motion. */
(() => {
  'use strict';

  const doc = document;
  doc.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, root = doc) => root.querySelector(selector);
  const $$ = (selector, root = doc) => Array.from(root.querySelectorAll(selector));
  const NBSP = ' ';

  function template(name) {
    const tpl = doc.getElementById(`tpl-${name}`);
    if (!tpl) throw new Error(`Unknown mock template: ${name}`);
    return tpl.content.cloneNode(true);
  }

  /* ---------------- Mock builders ---------------- */
  const STATUS_BAR =
    '<div class="ph-status"><span>9:41</span><span class="ph-sys">' +
    '<svg><use href="#i-signal"/></svg><svg><use href="#i-wifi"/></svg><svg><use href="#i-battery"/></svg>' +
    '</span></div><div class="ph-island"></div>';

  function buildPhone(host) {
    const names = host.dataset.phone.trim().split(/\s+/);
    host.setAttribute('aria-hidden', 'true');
    const bezel = doc.createElement('div');
    bezel.className = 'ph-bezel';
    const screen = doc.createElement('div');
    screen.className = 'ph-screen';
    screen.innerHTML = STATUS_BAR;
    names.forEach((name, index) => {
      const layer = doc.createElement('div');
      layer.className = index === 0 ? 'ph-layer on' : 'ph-layer';
      layer.dataset.layer = name;
      layer.append(template(`ph-${name}`));
      screen.append(layer);
    });
    const home = doc.createElement('div');
    home.className = 'ph-home';
    screen.append(home);
    bezel.append(screen);
    host.append(bezel);
  }

  function buildAdmin(host) {
    host.setAttribute('aria-hidden', 'true');
    const pages = host.dataset.admin.trim().split(/\s+/);
    const frame = doc.createElement('div');
    frame.className = 'ad-frame';
    frame.innerHTML =
      '<div class="ad-bar"><i></i><i></i><i></i><span class="ad-url">admin.yourbrand.kz</span></div>' +
      '<div class="ad-body"><div class="ad-side"></div><div class="ad-main"><div class="ad-head"></div><div class="ad-pages"></div></div></div>';
    $('.ad-side', frame).append(template('ad-side'));
    $('.ad-head', frame).append(template('ad-head'));
    pages.forEach((name, i) => {
      const page = doc.createElement('div');
      page.className = i === 0 ? 'ad-page on' : 'ad-page';
      page.dataset.page = name;
      page.dataset.pos = i === 0 ? 'on' : 'after';
      page.append(template(`ad-${name}`));
      $('.ad-pages', frame).append(page);
    });
    if ('compact' in host.dataset) frame.classList.add('is-compact');
    if (pages.length > 1) {
      // Several pages in one window: the menu highlight slides from item to item.
      frame.classList.add('has-pill');
      const pill = doc.createElement('i');
      pill.className = 'ad-nav-pill';
      $('.ad-nav', frame).prepend(pill);
    }
    const active = $(`.ad-nav [data-key="${host.dataset.nav || pages[0]}"]`, frame);
    if (active) active.classList.add('on');
    host.append(frame);
  }

  function placePill(frame) {
    const pill = $('.ad-nav-pill', frame);
    const on = $('.ad-nav span.on', frame);
    if (!pill || !on) return;
    pill.style.setProperty('--y', `${on.offsetTop}px`);
    pill.style.setProperty('--h', `${on.offsetHeight}px`);
  }

  function showAdminPage(frame, name) {
    const pages = $$('.ad-page', frame);
    const index = pages.findIndex((page) => page.dataset.page === name);
    pages.forEach((page, i) => {
      page.classList.toggle('on', i === index);
      page.dataset.pos = i < index ? 'before' : i > index ? 'after' : 'on';
    });
    $$('.ad-nav [data-key]', frame).forEach((item) => item.classList.toggle('on', item.dataset.key === name));
    placePill(frame);
    return pages[index];
  }

  /* Phone navigation shared by the app tabs and the journey: an iOS push. Only the outgoing and the
     incoming screens move; screens in between jump without crossing the view. */
  function preparePush(layers) {
    layers.forEach((layer, i) => {
      layer.style.zIndex = String(i + 1);
      layer.dataset.pos = layer.classList.contains('on') ? 'on' : 'after';
    });
  }
  function pushLayers(layers, index, from) {
    layers.forEach((layer, i) => {
      const still = i !== index && i !== from;
      if (still) layer.style.transition = 'none';
      layer.classList.toggle('on', i === index);
      layer.dataset.pos = i < index ? 'before' : i > index ? 'after' : 'on';
      if (still) {
        void layer.offsetWidth;
        layer.style.transition = '';
      }
    });
  }

  function buildCalendar(host) {
    const [year, month] = host.dataset.calendar.split('-').map(Number);
    const from = Number(host.dataset.from);
    const to = Number(host.dataset.to);
    const days = new Date(year, month, 0).getDate();
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const cells = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => `<span class="wd">${day}</span>`);
    for (let i = 0; i < offset; i += 1) cells.push('<span></span>');
    for (let day = 1; day <= days; day += 1) {
      let state = '';
      if (day === from) state = 'from';
      else if (day === to) state = 'to';
      else if (day > from && day < to) state = 'in';
      else if (day < 10) state = 'past';
      cells.push(`<span class="${state}">${day}</span>`);
    }
    host.innerHTML = cells.join('');
  }

  function buildAdminCalendar(host) {
    const [year, month] = host.dataset.adCalendar.split('-').map(Number);
    const days = new Date(year, month, 0).getDate();
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const cells = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => `<span class="wd">${day}</span>`);
    for (let i = 0; i < offset; i += 1) cells.push('<span></span>');
    for (let day = 1; day <= days; day += 1) cells.push(`<span class="${day === 1 ? 'from' : day === days ? 'to' : 'in'}">${day}</span>`);
    host.innerHTML = cells.join('');
  }

  function mountMocks() {
    $$('[data-phone]').forEach(buildPhone);
    $$('[data-admin]').forEach(buildAdmin);
    $$('[data-calendar]').forEach(buildCalendar);
    $$('[data-ad-calendar]').forEach(buildAdminCalendar);
  }

  /* ---------------- Header ---------------- */
  function initHeader() {
    const header = $('[data-header]');
    const toggle = $('[data-nav-toggle]');
    const nav = $('#site-nav');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });
  }

  /* ---------------- Hero: one order's trip ---------------- */
  const ORDERS = [
    { number: '121023', name: 'Тимур Ахметов', program: 'Стандарт', kcal: 1800, days: 14, total: `86${NBSP}940${NBSP}₸`,
      allergy: 'Орехи', tag: ['red', 'Аллергия:', 'орехи'], window: ['07:00–10:00', 'в день питания'],
      courier: 'Адиль Жалелов, зона «Бостандык», 07:00–10:00' },
    { number: '121024', name: 'Дана Сейткали', program: 'Лайт', kcal: 1200, days: 7, total: `37${NBSP}170${NBSP}₸`,
      allergy: 'Лактоза', tag: ['yellow', 'Здоровье:', 'без лактозы'], window: ['18:00–21:00', 'накануне'],
      courier: 'Ержан Садыков, зона «Медеу», 18:00–21:00 накануне' },
    { number: '121025', name: 'Рустам Абдиев', program: 'Спорт', kcal: 2600, days: 28, total: `211${NBSP}680${NBSP}₸`,
      allergy: 'Мёд', tag: ['red', 'Аллергия:', 'мёд'], window: ['07:00–10:00', 'в день питания'],
      courier: 'Нурлан Абенов, зона «Алмалы», 07:00–10:00' },
  ];
  const LOOPS = 3;

  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }
  const kits = (n) => `${n} ${plural(n, 'комплект', 'комплекта', 'комплектов')}`;
  const kcal = (n) => `${n.toLocaleString('ru-RU')}${NBSP}кКал`;

  // The flying order follows a cubic Bézier, sampled into keyframes with easing applied along the path.
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function bezier([p0, p1, p2, p3], t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  }
  const centerOf = (el, box) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
  };

  function initHero() {
    const figure = $('[data-hero]');
    const stage = $('[data-hero-stage]');
    if (!figure || !stage) return;
    const steps = $$('[data-hero-step]', figure);
    const toggle = $('[data-hero-toggle]', figure);
    const flyer = $('.flyer', stage);
    const flyerText = $('[data-flyer-text]', stage);
    const phone = $('.phone', stage);
    const screen = $('.ph-screen', phone);
    const checkoutLayer = $('.ph-layer[data-layer="checkout"]', phone);
    const successLayer = $('.ph-layer[data-layer="success"]', phone);
    const cta = $('[data-k="cta"]', checkoutLayer);
    const replay = $('[data-hero-replay]', figure);
    const admin = $('.admin', stage);
    const rows = $('[data-rows]', admin);
    const count = $('.ad-count', admin);
    const toastText = $('[data-toast-text]', admin);
    const tap = doc.createElement('div');
    tap.className = 'ph-tap';
    screen.append(tap);


    let total = 30;
    let orderIndex = 0;
    let userPaused = false;
    let inView = false;
    let pageVisible = !doc.hidden;
    let waiters = [];
    let frozen = [];
    const running = () => !userPaused && inView && pageVisible;

    // Pausing freezes every running animation of the scene and stops the clock.
    function syncPaused() {
      const on = running();
      figure.classList.toggle('is-paused', !on);
      if (!on && frozen.length === 0) {
        frozen = figure.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running');
        frozen.forEach((animation) => animation.pause());
      } else if (on) {
        frozen.forEach((animation) => animation.play());
        frozen = [];
        waiters.forEach((resolve) => resolve());
        waiters = [];
      }
    }
    const untilRunning = () => (running() ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve)));
    async function wait(ms) {
      let left = ms;
      while (left > 0) {
        await untilRunning();
        const started = performance.now();
        await new Promise((resolve) => window.setTimeout(resolve, Math.min(left, 120)));
        if (running()) left -= performance.now() - started;
      }
    }

    const setStep = (active) => steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === active);
      step.classList.toggle('is-done', i < active);
    });

    function fillOrder(order) {
      $('[data-k="co-sub"]', checkoutLayer).textContent = `${order.program}, ${order.days} дней`;
      $('[data-k="co-tags"]', checkoutLayer).innerHTML = `<i>${order.allergy}</i>`;
      $('[data-k="co-total"]', checkoutLayer).textContent = order.total;
      $('[data-k="order"]', successLayer).textContent = `№${order.number}`;
      flyerText.textContent = `Заказ №${order.number}: ${order.program}, ${order.kcal.toLocaleString('ru-RU')}${NBSP}ккал`;
      toastText.textContent = order.courier;
    }

    /* The finger: a soft touch marker that moves, presses and leaves */
    let tapAt = null;
    function placeTap(point) {
      tapAt = point;
      tap.animate([{ translate: `${point.x}px ${point.y}px` }, { translate: `${point.x}px ${point.y}px` }], { duration: 1, fill: 'forwards' });
    }
    function showTap(visible) {
      return tap.animate(
        [{ opacity: visible ? 0 : 1, scale: visible ? 0.6 : 1 }, { opacity: visible ? 1 : 0, scale: visible ? 1 : 0.6 }],
        { duration: 220, easing: 'ease-out', fill: 'forwards' },
      ).finished;
    }
    async function moveTap(target, duration) {
      const to = centerOf(target, screen.getBoundingClientRect());
      const from = tapAt;
      tapAt = to;
      await tap.animate([{ translate: `${from.x}px ${from.y}px` }, { translate: `${to.x}px ${to.y}px` }], {
        duration, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards',
      }).finished;
    }
    async function press(target) {
      tap.classList.remove('is-tapping');
      void tap.offsetWidth;
      tap.classList.add('is-tapping');
      target.classList.add('is-pressed');
      await tap.animate([{ scale: 1 }, { scale: 0.8, offset: 0.4 }, { scale: 1 }], { duration: 280, easing: 'ease-out' }).finished;
      target.classList.remove('is-pressed');
    }

    function insertRow(order) {
      const wrap = doc.createElement('div');
      wrap.className = 'ad-row-wrap';
      wrap.innerHTML =
        `<div class="ad-tr"><span><b>№${order.number}</b><small>${order.name}</small></span>` +
        `<span><b>${order.program}</b><small>${kcal(order.kcal)}</small></span>` +
        '<span><b>1 день</b><small>24 сентября</small></span>' +
        `<span><b>${order.window[0]}</b><small>${order.window[1]}</small></span>` +
        `<span><i class="ad-tag ad-tag-${order.tag[0]}"><b>${order.tag[1]}</b> ${order.tag[2]}</i></span></div>`;
      rows.prepend(wrap);
      while (rows.children.length > 9) rows.lastElementChild.remove();
      if (reduceMotion) {
        wrap.classList.add('in', 'tag-in');
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in', 'flash', 'tag-in')));
      }
      return wrap;
    }

    function rollCount(next) {
      const old = count.lastElementChild;
      const fresh = doc.createElement('span');
      fresh.textContent = kits(next);
      count.append(fresh);
      if (reduceMotion) {
        old.remove();
        return;
      }
      const options = { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' };
      old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], options)
        .finished.then(() => old.remove());
      fresh.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], options);
    }

    /* The order flies from the success screen into the kitchen table */
    function flightPath() {
      const box = stage.getBoundingClientRect();
      const p0 = centerOf($('[data-k="order"]', successLayer), box);
      const target = rows.getBoundingClientRect();
      const rowHeight = rows.firstElementChild ? rows.firstElementChild.getBoundingClientRect().height : 32;
      const p3 = { x: target.left + Math.min(target.width * 0.24, 150) - box.left, y: target.top + rowHeight / 2 - box.top };
      const top = Math.min(p0.y, p3.y);
      const p1 = { x: p0.x + (p3.x - p0.x) * 0.3, y: top - box.height * 0.13 };
      const p2 = { x: p3.x - (p3.x - p0.x) * 0.25, y: top - box.height * 0.1 };
      // Keep the whole label inside the scene, never over the copy column.
      const half = flyer.offsetWidth / 2 + 6;
      const fit = (pt) => ({ x: Math.min(box.width - half, Math.max(half, pt.x)), y: Math.max(flyer.offsetHeight, pt.y) });
      return [p0, p1, p2, p3].map(fit);
    }
    function flight(path, from, to, duration) {
      const frames = [];
      const n = 16;
      for (let i = 0; i <= n; i += 1) {
        const g = from + ((to - from) * i) / n;
        const point = bezier(path, easeInOut(g));
        const scale = g < 0.12 ? 0.7 + (g / 0.12) * 0.3 : g > 0.84 ? 1 - ((g - 0.84) / 0.16) * 0.3 : 1;
        const opacity = g < 0.1 ? g / 0.1 : g > 0.9 ? 1 - (g - 0.9) / 0.1 : 1;
        frames.push({ transform: `translate(${point.x}px, ${point.y}px) translate(-50%, -50%) scale(${scale})`, opacity, offset: i / n });
      }
      return flyer.animate(frames, { duration, easing: 'linear', fill: 'forwards' }).finished;
    }

    // One loop ≈ 7 s: pay → sheet → the order lands in the kitchen with its allergy → courier.
    async function play() {
      for (let loop = 1; loop <= LOOPS; loop += 1) {
        const order = ORDERS[orderIndex % ORDERS.length];
        orderIndex += 1;
        fillOrder(order);
        cta.classList.remove('is-loading');
        successLayer.classList.remove('on');
        setStep(0);
        await wait(500);
        const box = screen.getBoundingClientRect();
        placeTap({ x: box.width * 0.62, y: box.height * 0.97 });
        await showTap(true);
        await moveTap(cta, 520);
        await press(cta);
        cta.classList.add('is-loading');
        await wait(600);
        showTap(false);
        successLayer.classList.add('on');
        await wait(700);
        const path = flightPath();
        await flight(path, 0, 0.6, 480);
        const row = insertRow(order);
        await flight(path, 0.6, 1, 320);
        total += 1;
        rollCount(total);
        setStep(1);
        await wait(800);
        row.classList.remove('flash');
        await wait(100);
        stage.classList.add('s-courier');
        setStep(2);
        await wait(2000);
        if (loop === LOOPS) break;
        stage.classList.remove('s-courier');
        await wait(320);
      }
      steps.forEach((step) => step.classList.add('is-done'));
      const hadFocus = doc.activeElement === toggle;
      toggle.hidden = true;
      replay.hidden = false;
      if (hadFocus) replay.focus();
    }

    replay.addEventListener('click', () => {
      replay.hidden = true;
      toggle.hidden = false;
      stage.classList.remove('s-courier');
      toggle.focus();
      play();
    });

    function showStill() {
      const order = ORDERS[0];
      fillOrder(order);
      successLayer.classList.add('on');
      total += 1;
      insertRow(order);
      rollCount(total);
      stage.classList.add('s-courier');
      steps.forEach((step) => step.classList.add('is-done'));
      toggle.hidden = true;
    }

    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      toggle.setAttribute('aria-pressed', String(userPaused));
      syncPaused();
    });
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPaused();
    }, { threshold: 0.2 }).observe(stage);
    doc.addEventListener('visibilitychange', () => {
      pageVisible = !doc.hidden;
      syncPaused();
    });

    if (reduceMotion) showStill();
    else play();
  }

  /* ---------------- Before / after ---------------- */
  function initCompare() {
    const root = $('[data-compare]');
    if (!root) return;
    const board = $('.compare-board', root);
    const buttons = $$('[data-compare-set]', root);
    let touched = false;

    function set(state, focus) {
      board.dataset.state = state;
      root.dataset.state = state;
      buttons.forEach((button) => {
        const on = button.dataset.compareSet === state;
        button.setAttribute('aria-checked', String(on));
        button.tabIndex = on ? 0 : -1;
        if (on && focus) button.focus();
      });
    }

    buttons.forEach((button) => button.addEventListener('click', () => {
      touched = true;
      set(button.dataset.compareSet);
    }));
    $('[role="radiogroup"]', root).addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      touched = true;
      set(board.dataset.state === 'before' ? 'after' : 'before', true);
    });
    root.dataset.state = board.dataset.state;

    if (reduceMotion) return;
    // The flip plays once: when the middle of the board reaches 55% of the window height, or when the
    // whole board has been on screen for 1.5 s without scrolling (tall windows never reach the 55% line).
    let dwell = 0;
    const done = () => touched || board.dataset.state === 'after';
    const check = () => {
      window.clearTimeout(dwell);
      if (done()) {
        window.removeEventListener('scroll', check);
        return;
      }
      const rect = board.getBoundingClientRect();
      if (rect.top + rect.height / 2 <= window.innerHeight * 0.55) {
        set('after');
      } else if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        dwell = window.setTimeout(() => { if (!done()) set('after'); }, 1500);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ---------------- Journey (sticky stage, step snap, route rail) ---------------- */
  function countUp(elements) {
    elements.forEach((el) => {
      const final = el.dataset.final || (el.dataset.final = el.textContent);
      const value = Number(final.replace(/\D/g, ''));
      const suffix = final.replace(/^[\d\s  ]+/, '');
      const started = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - started) / 900);
        const current = Math.round(value * (1 - Math.pow(1 - t, 3)));
        el.textContent = t < 1 ? `${current.toLocaleString('ru-RU')}${suffix ? NBSP + suffix : ''}` : final;
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  // Each step points at the part of the screen it talks about.
  function focusScreen(screen) {
    if (reduceMotion || !screen) return;
    screen.classList.remove('is-focus');
    void screen.offsetWidth;
    screen.classList.add('is-focus');
    const chips = $$('.ph-prog:first-of-type .ph-chips span', screen);
    if (chips.length > 1) {
      chips.forEach((chip, i) => chip.classList.toggle('on', i === 0));
      window.setTimeout(() => chips.forEach((chip, i) => chip.classList.toggle('on', i === 1)), 550);
    }
    const stats = $$('.ad-stat b', screen);
    if (stats.length) countUp(stats);
  }

  /* Journey. Desktop: a pinned scene; every ~0.6 screen of scroll is one step, and when a scroll
     ends the page glides to the next step in the direction of travel (never blocks native scrolling,
     releases past the first and last step). Phones: swipe cards with dots and «Дальше». */
  function initJourney() {
    const scroller = $('[data-journey-scroller]');
    const list = $('[data-journey]');
    const stage = $('[data-journey-stage]');
    if (!scroller || !list || !stage) return;
    const steps = $$('.j-step', list);
    const n = steps.length;
    const desktop = () => window.getComputedStyle(stage).display !== 'none';

    /* The scene never swaps devices: the phone and the panel stay on stage. Steps 1–2 navigate inside
       the phone, step 3 opens «Заказ оплачен» while the phone steps back and the panel comes forward,
       steps 3–5 navigate inside the panel. */
    const stages = steps.map((step) => step.dataset.stage.split(':'));
    const phoneNames = [...new Set(stages.filter(([kind]) => kind === 'phone').map(([, name]) => name))];
    const pageNames = [...new Set(stages.filter(([kind]) => kind === 'admin').map(([, name]) => name))];
    stage.innerHTML =
      `<div class="admin js-admin" data-admin="${pageNames.join(' ')}"></div>` +
      `<div class="phone js-phone is-push" data-phone="${phoneNames.join(' ')} success"></div>`;
    buildAdmin($('.js-admin', stage));
    buildPhone($('.js-phone', stage));
    $$('[data-calendar]', stage).forEach(buildCalendar);
    $$('[data-ad-calendar]', stage).forEach(buildAdminCalendar);
    const adminFrame = $('.js-admin .ad-frame', stage);
    const phoneLayers = $$('.js-phone .ph-layer', stage);
    const sheet = phoneLayers.find((layer) => layer.dataset.layer === 'success');
    const flow = phoneLayers.filter((layer) => layer !== sheet);
    preparePush(flow);
    sheet.dataset.pos = 'after';
    sheet.style.zIndex = String(flow.length + 1);
    let flowIndex = 0;
    // The order from step 2 is the first line of the kitchen plan in step 3.
    const cookRows = $('.ad-page[data-page="cooking"] [data-rows]', adminFrame);
    if (cookRows) {
      cookRows.insertAdjacentHTML('afterbegin',
        '<div class="ad-tr is-new"><span><b>№121023</b><small>Тимур Ахметов</small></span><span><b>Стандарт</b><small>1\u00a0800\u00a0кКал</small></span>' +
        '<span><b>1 день</b><small>24 сентября</small></span><span><b>07:00–10:00</b><small>в день питания</small></span>' +
        '<span><i class="ad-tag ad-tag-red"><b>Аллергия:</b> орехи</i></span></div>');
      const count = $('.ad-page[data-page="cooking"] .ad-count span', adminFrame);
      if (count) count.textContent = '31 комплект';
    }

    function showStage(index) {
      const [kind, name] = stages[index];
      stage.dataset.focus = kind;
      if (kind === 'phone') {
        sheet.classList.remove('on');
        sheet.dataset.pos = 'after';
        const target = flow.findIndex((layer) => layer.dataset.layer === name);
        if (target !== flowIndex) {
          pushLayers(flow, target, flowIndex);
          flowIndex = target;
        }
        return flow[target];
      }
      sheet.classList.add('on');
      sheet.dataset.pos = 'on';
      return showAdminPage(adminFrame, name);
    }
    stage.dataset.focus = stages[0][0];
    requestAnimationFrame(() => placePill(adminFrame));
    window.addEventListener('resize', () => placePill(adminFrame));
    const headerH = () => $('[data-header]').getBoundingClientRect().height;
    const unit = () => window.innerHeight * 0.62;
    const startY = () => window.scrollY + scroller.getBoundingClientRect().top - headerH();
    const clamp = (i) => Math.min(n - 1, Math.max(0, i));
    let current = -1;
    let focusTimer = 0;

    function measureRail() {
      const top = list.getBoundingClientRect().top;
      const centers = steps.map((step) => {
        const rect = $('.j-num', step).getBoundingClientRect();
        return rect.top + rect.height / 2 - top;
      });
      list.style.setProperty('--rail-start', `${centers[0]}px`);
      list.style.setProperty('--rail-end', `${centers[n - 1]}px`);
      list.style.setProperty('--rail-fill', `${Math.max(0, centers[Math.max(current, 0)] - centers[0])}px`);
    }
    function followRail(ms = 420) {
      const end = performance.now() + ms;
      const tick = () => {
        measureRail();
        if (performance.now() < end) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    function activate(index) {
      if (index === current || index < 0) return;
      current = index;
      steps.forEach((step, i) => {
        step.classList.toggle('is-active', i === index);
        step.classList.toggle('is-done', i < index);
        $('.j-head', step).setAttribute('aria-expanded', String(!desktop() || i === index));
      });
      const shown = showStage(index);
      followRail();
      updateDots(index);
      window.clearTimeout(focusTimer);
      // Scene: the hint starts with the screen's own entrance; cards: once the swipe has settled.
      focusTimer = window.setTimeout(() => focusScreen(desktop() ? shown : $('.j-screen', steps[index])), desktop() ? 0 : 300);
    }

    /* Desktop: scrolling stays 100% native — no wheel interception, no locks, no correction after
       the visitor stops, so trackpad momentum and mice behave exactly as everywhere else. The scene
       is pinned and shows exactly one step: the step changes when the scroll passes the middle
       between two steps. Keys and clicks on a step title move one step with a native smooth scroll. */
    const position = () => (window.scrollY - startY()) / unit();
    let queued = false;
    let keyTarget = -1;
    let keyTimer = 0;

    function fromScroll() {
      queued = false;
      if (!desktop()) return;
      const pos = position();
      // While a key/click scroll is on its way, keep the target on screen instead of flashing the steps in between.
      if (keyTarget >= 0) {
        if (Math.abs(pos - keyTarget) < 0.02) keyTarget = -1;
        else return;
      }
      activate(clamp(Math.round(pos)));
    }
    function goToStep(index) {
      const target = clamp(index);
      activate(target);
      keyTarget = target;
      window.clearTimeout(keyTimer);
      keyTimer = window.setTimeout(() => { keyTarget = -1; fromScroll(); }, 1200);
      window.scrollTo({ top: startY() + target * unit(), behavior: reduceMotion ? 'instant' : 'smooth' });
    }
    window.addEventListener('scroll', () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(fromScroll);
      }
    }, { passive: true });
    // Arrow keys / PageUp / PageDown / Space inside the scene: one step each; at the ends the page scrolls on natively.
    window.addEventListener('keydown', (event) => {
      if (!desktop() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target.closest('input, textarea, select, [contenteditable], [role="tablist"], [role="radiogroup"]')) return;
      if (event.key === ' ' && event.target.closest('button, a, summary')) return;
      const dir = event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey) ? 1
        : event.key === 'ArrowUp' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey) ? -1 : 0;
      if (!dir) return;
      const pos = position();
      if (pos < -0.5 || pos > n - 0.5) return;
      const k = Math.round(pos);
      const target = Math.abs(pos - k) < 0.05 ? k + dir : dir > 0 ? Math.ceil(pos) : Math.floor(pos);
      if (target < 0 || target > n - 1) return;
      event.preventDefault();
      goToStep(target);
    });
    steps.forEach((step, i) => $('.j-head', step).addEventListener('click', () => {
      if (desktop()) goToStep(i);
    }));

    /* Phones: swipe cards */
    const nav = $('[data-journey-nav]');
    const next = $('[data-journey-next]', nav);
    const dots = steps.map((_, i) => {
      const dot = doc.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Шаг ${i + 1}`);
      dot.addEventListener('click', () => goCard(i));
      $('.journey-dots', nav).append(dot);
      return dot;
    });
    function updateDots(index) {
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      next.textContent = index === n - 1 ? 'Сначала' : 'Дальше';
    }
    const cardUnit = () => steps[1].offsetLeft - steps[0].offsetLeft;
    function goCard(index) {
      list.scrollTo({ left: index * cardUnit(), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    next.addEventListener('click', () => goCard(current >= n - 1 ? 0 : current + 1));
    list.addEventListener('scroll', () => {
      if (!desktop()) activate(clamp(Math.round(list.scrollLeft / cardUnit())));
    }, { passive: true });

    // Step titles are buttons only where they do something (the pinned desktop scene).
    const syncHeads = () => steps.forEach((step) => { $('.j-head', step).tabIndex = desktop() ? 0 : -1; });
    activate(0);
    syncHeads();
    window.addEventListener('resize', () => {
      syncHeads();
      measureRail();
      fromScroll();
    });
  }

  /* ---------------- Tabs (ARIA, roving tabindex) ---------------- */
  function initTabs(root, onSelect) {
    const list = $('[role="tablist"]', root);
    const tabs = $$('[role="tab"]', list);
    const vertical = list.getAttribute('aria-orientation') === 'vertical';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';

    function select(index, focus) {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      if (focus) tabs[index].focus();
      onSelect(index, tabs[index]);
    }

    tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));
    list.addEventListener('keydown', (event) => {
      const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      let next = null;
      if (event.key === nextKey) next = current + 1;
      else if (event.key === prevKey) next = current - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });
  }

  function initApp() {
    const root = $('[data-tabs="app"]');
    if (!root) return;
    const panel = $('#app-panel');
    const layers = $$('.ph-layer', panel);
    const caption = $('[data-app-caption]', panel);
    preparePush(layers);
    let shown = 0;
    initTabs(root, (index, tab) => {
      pushLayers(layers, index, shown);
      shown = index;
      panel.setAttribute('aria-labelledby', tab.id);
      if (caption) caption.textContent = `На экране телефона: ${$('b', tab).textContent}.`;
      const desc = $('[data-app-desc]', root);
      if (desc) {
        desc.classList.add('is-swapping');
        window.setTimeout(() => {
          desc.textContent = $('.app-tab-text > span', tab).textContent;
          desc.classList.remove('is-swapping');
        }, 140);
      }
    });
  }

  function initTeam() {
    const root = $('[data-tabs="team"]');
    if (!root) return;
    const panels = $$('[role="tabpanel"]', root);
    const frame = $('.team-visual .ad-frame', root);
    const pages = $$('.ad-page', frame).map((page) => page.dataset.page);
    requestAnimationFrame(() => placePill(frame));
    window.addEventListener('resize', () => placePill(frame));
    // Same window, other page: the text crossfades in place and the panel navigates.
    initTabs(root, (index) => {
      panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
      const page = showAdminPage(frame, pages[index]);
      const map = $('.ad-map', page);
      if (map && !reduceMotion) {
        map.classList.remove('zones-draw');
        void map.offsetWidth;
        map.classList.add('zones-draw');
      }
    });
  }

  /* ---------------- White label ---------------- */
  function initBrand() {
    const pick = $('[data-brand-pick]');
    const stage = $('.brand-stage');
    if (!pick || !stage) return;
    pick.addEventListener('change', (event) => {
      if (event.target.name !== 'brand') return;
      stage.dataset.brand = event.target.value;
      const icon = $('.store-icon', stage);
      icon.classList.remove('is-pop');
      void icon.offsetWidth;
      icon.classList.add('is-pop');
    });
  }

  /* ---------------- Demo form (never sends anything) ---------------- */
  function initForm() {
    const form = $('[data-demo-form]');
    const done = $('[data-demo-done]');
    if (!form || !done) return;
    const digits = (value) => value.replace(/\D/g, '');
    const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    const isPhone = (value) => /^[\d\s()+-]+$/.test(value.trim()) && digits(value).length >= 10 && digits(value).length <= 12;
    const rules = {
      name: (value) => value.trim().length >= 2,
      contact: (value) => isEmail(value) || isPhone(value),
    };
    const fields = $$('input[required]', form);
    const errorOf = (input) => doc.getElementById(input.getAttribute('aria-describedby'));

    function check(input) {
      const ok = rules[input.name](input.value);
      input.setAttribute('aria-invalid', String(!ok));
      errorOf(input).hidden = ok;
      return ok;
    }

    fields.forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.value.trim()) check(input);
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });

    const contact = $('#f-contact', form);
    contact.addEventListener('blur', () => {
      if (!isPhone(contact.value)) return;
      const d = digits(contact.value);
      if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
        contact.value = `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalid = fields.filter((input) => !check(input));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });

    $('[data-demo-reset]', done).addEventListener('click', () => {
      form.reset();
      fields.forEach((input) => {
        input.removeAttribute('aria-invalid');
        errorOf(input).hidden = true;
      });
      done.hidden = true;
      form.hidden = false;
      fields[0].focus();
    });
  }

  mountMocks();
  initHeader();
  initHero();
  initCompare();
  initJourney();
  initApp();
  initTeam();
  initBrand();
  initForm();
})();
