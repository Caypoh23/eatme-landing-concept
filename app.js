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
    const frame = doc.createElement('div');
    frame.className = 'ad-frame';
    frame.innerHTML =
      '<div class="ad-bar"><i></i><i></i><i></i><span class="ad-url">admin.yourbrand.kz</span></div>' +
      '<div class="ad-body"><div class="ad-side"></div><div class="ad-main"><div class="ad-head"></div><div class="ad-page"></div></div></div>';
    $('.ad-side', frame).append(template('ad-side'));
    $('.ad-head', frame).append(template('ad-head'));
    $('.ad-page', frame).append(template(`ad-${host.dataset.admin}`));
    const active = $(`.ad-nav [data-key="${host.dataset.nav || host.dataset.admin}"]`, frame);
    if (active) active.classList.add('on');
    host.append(frame);
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

  function mountMocks() {
    $$('[data-phone]').forEach(buildPhone);
    $$('[data-admin]').forEach(buildAdmin);
    $$('[data-calendar]').forEach(buildCalendar);
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
    { number: '121023', name: 'Тимур Ахметов', program: 'Стандарт', kcal: 1800, price: `6${NBSP}900${NBSP}₸`,
      tag: ['red', 'Аллергия:', 'орехи'], window: ['07:00–10:00', 'в день питания'],
      courier: 'Адиль Жалелов, зона «Бостандык», 07:00–10:00' },
    { number: '121024', name: 'Дана Сейткали', program: 'Лайт', kcal: 1200, price: `5${NBSP}900${NBSP}₸`,
      tag: ['yellow', 'Здоровье:', 'без лактозы'], window: ['18:00–21:00', 'накануне'],
      courier: 'Ержан Садыков, зона «Медеу», 18:00–21:00 накануне' },
    { number: '121025', name: 'Рустам Абдиев', program: 'Спорт', kcal: 2600, price: `8${NBSP}400${NBSP}₸`,
      tag: ['red', 'Аллергия:', 'мёд'], window: ['07:00–10:00', 'в день питания'],
      courier: 'Нурлан Абенов, зона «Алмалы», 07:00–10:00' },
  ];
  const TIMING = { step1: 3820, step2: 2300, step3: 3600 };

  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }
  const kits = (n) => `${n} ${plural(n, 'комплект', 'комплекта', 'комплектов')}`;
  const kcal = (n) => `${n.toLocaleString('ru-RU')}${NBSP}кКал`;

  function initHero() {
    const figure = $('[data-hero]');
    const stage = $('[data-hero-stage]');
    if (!figure || !stage) return;
    const steps = $$('[data-hero-step]', figure);
    const toggle = $('[data-hero-toggle]', figure);
    const flyer = $('.flyer', stage);
    const flyerText = $('[data-flyer-text]', stage);
    const phone = $('.phone', stage);
    const layers = $$('.ph-layer', phone);
    const programLayer = layers.find((layer) => layer.dataset.layer === 'program');
    const successLayer = layers.find((layer) => layer.dataset.layer === 'success');
    const admin = $('.admin', stage);
    const rows = $('[data-rows]', admin);
    const count = $('.ad-count', admin);
    const toastText = $('[data-toast-text]', admin);

    [TIMING.step1, TIMING.step2, TIMING.step3].forEach((ms, i) => steps[i].style.setProperty('--dur', `${ms}ms`));

    let total = 30;
    let orderIndex = 0;
    let userPaused = false;
    let inView = false;
    let pageVisible = !doc.hidden;
    const running = () => !userPaused && inView && pageVisible;
    const syncPaused = () => figure.classList.toggle('is-paused', !running());

    const setStep = (active) => steps.forEach((step, i) => {
      step.classList.toggle('is-active', i === active);
      step.classList.toggle('is-done', i < active);
    });
    const showLayer = (target) => layers.forEach((layer) => layer.classList.toggle('on', layer === target));

    function fillOrder(order) {
      $('[data-k="program"]', programLayer).textContent = order.program;
      $('[data-k="price"]', programLayer).textContent = order.price;
      $$('[data-kcal]', programLayer).forEach((chip) => chip.classList.toggle('on', Number(chip.dataset.kcal) === order.kcal));
      $('[data-k="order"]', successLayer).textContent = `№${order.number}`;
      flyerText.textContent = `Заказ №${order.number}: ${order.program}, ${kcal(order.kcal)}`;
      toastText.textContent = order.courier;
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
        requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in', 'flash')));
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

    function fly() {
      const box = stage.getBoundingClientRect();
      const from = ($('.ph-art', successLayer) || phone).getBoundingClientRect();
      const to = rows.getBoundingClientRect();
      const x0 = from.left + from.width / 2 - box.left;
      const y0 = from.top + from.height * 0.4 - box.top;
      const x1 = to.left + to.width * 0.3 - box.left;
      const y1 = to.top + 8 - box.top;
      const lift = Math.max(24, Math.min(y0, y1) - box.height * 0.14);
      const at = (x, y, s) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
      return flyer.animate([
        { transform: at(x0, y0, 0.7), opacity: 0 },
        { transform: at(x0, y0 - 24, 1), opacity: 1, offset: 0.15 },
        { transform: at((x0 + x1) / 2, lift, 1), opacity: 1, offset: 0.55 },
        { transform: at(x1, y1, 0.9), opacity: 1, offset: 0.9 },
        { transform: at(x1, y1, 0.85), opacity: 0 },
      ], { duration: 1300, easing: 'cubic-bezier(0.45, 0.05, 0.25, 1)', fill: 'forwards' }).finished;
    }

    // Time only advances while the sequence is visible and not paused.
    function wait(ms) {
      return new Promise((resolve) => {
        let elapsed = 0;
        let last = performance.now();
        const tick = (now) => {
          if (running()) elapsed += Math.min(now - last, 100);
          last = now;
          if (elapsed >= ms) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }

    async function play() {
      for (;;) {
        const order = ORDERS[orderIndex % ORDERS.length];
        orderIndex += 1;
        fillOrder(order);
        stage.classList.remove('s-tap', 's-courier');
        showLayer(programLayer);
        setStep(0);
        await wait(1100);
        stage.classList.add('s-tap');
        await wait(420);
        stage.classList.remove('s-tap');
        showLayer(successLayer);
        await wait(1000);
        await fly();
        total += 1;
        const row = insertRow(order);
        rollCount(total);
        setStep(1);
        await wait(700);
        row.classList.remove('flash');
        await wait(500);
        row.classList.add('tag-in');
        await wait(1100);
        stage.classList.add('s-courier');
        setStep(2);
        await wait(TIMING.step3);
      }
    }

    function showStill() {
      const order = ORDERS[0];
      fillOrder(order);
      showLayer(successLayer);
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
    // Play the "after" once, shortly after the messy board is in view.
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      window.setTimeout(() => {
        if (!touched) set('after');
      }, 1800);
    }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
    io.observe(board);
  }

  /* ---------------- Journey (sticky stage + route rail) ---------------- */
  function initJourney() {
    const list = $('[data-journey]');
    const stage = $('[data-journey-stage]');
    if (!list || !stage) return;
    const steps = $$('.j-step', list);
    const screens = steps.map((step, index) => {
      const clone = $('.j-screen', step).cloneNode(true);
      clone.classList.toggle('on', index === 0);
      stage.append(clone);
      return clone;
    });
    let current = -1;

    function activate(index) {
      if (index === current || index < 0) return;
      current = index;
      steps.forEach((step, i) => {
        step.classList.toggle('is-active', i === index);
        step.classList.toggle('is-done', i < index);
      });
      screens.forEach((screen, i) => screen.classList.toggle('on', i === index));
    }
    activate(0);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activate(steps.indexOf(entry.target));
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach((step) => io.observe(step));

    const nums = steps.map((step) => $('.j-num', step));
    let queued = false;
    function measureRail() {
      queued = false;
      const top = list.getBoundingClientRect().top;
      const centers = nums.map((num) => {
        const rect = num.getBoundingClientRect();
        return rect.top + rect.height / 2 - top;
      });
      const start = centers[0];
      const end = centers[centers.length - 1];
      const focus = window.innerHeight / 2 - top;
      list.style.setProperty('--rail-start', `${start}px`);
      list.style.setProperty('--rail-end', `${end}px`);
      list.style.setProperty('--rail-fill', `${Math.max(0, Math.min(end - start, focus - start))}px`);
    }
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measureRail);
    };
    measureRail();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
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
    initTabs(root, (index, tab) => {
      layers.forEach((layer, i) => layer.classList.toggle('on', i === index));
      panel.setAttribute('aria-labelledby', tab.id);
      if (caption) caption.textContent = `На экране телефона: ${$('b', tab).textContent}.`;
      const desc = $('[data-app-desc]', root);
      if (desc) desc.textContent = $('.app-tab-text > span', tab).textContent;
    });
  }

  function initTeam() {
    const root = $('[data-tabs="team"]');
    if (!root) return;
    const panels = $$('[role="tabpanel"]', root);
    initTabs(root, (index) => {
      panels.forEach((panel, i) => {
        if (i !== index) {
          panel.hidden = true;
          return;
        }
        if (!panel.hidden) return;
        panel.hidden = false;
        if (reduceMotion) return;
        panel.classList.remove('is-entering');
        void panel.offsetWidth;
        panel.classList.add('is-entering');
        const map = $('.ad-map', panel);
        if (map) {
          map.classList.remove('zones-draw');
          void map.offsetWidth;
          map.classList.add('zones-draw');
        }
      });
    });
  }

  /* ---------------- White label ---------------- */
  function initBrand() {
    const pick = $('[data-brand-pick]');
    const stage = $('.brand-stage');
    if (!pick || !stage) return;
    pick.addEventListener('change', (event) => {
      if (event.target.name === 'brand') stage.dataset.brand = event.target.value;
    });
  }

  /* ---------------- Demo form (never sends anything) ---------------- */
  function initForm() {
    const form = $('[data-demo-form]');
    const done = $('[data-demo-done]');
    if (!form || !done) return;
    const digits = (value) => value.replace(/\D/g, '');
    const rules = {
      name: (value) => value.trim().length >= 2,
      phone: (value) => digits(value).length >= 10 && digits(value).length <= 12,
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

    const phone = $('#f-phone', form);
    phone.addEventListener('blur', () => {
      const d = digits(phone.value);
      if (d.length === 11 && (d[0] === '7' || d[0] === '8')) {
        phone.value = `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
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
