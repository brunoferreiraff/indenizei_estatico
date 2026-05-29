/**
 * indenizei.js
 * Módulos: Nav | FAQ Accordeão | FAQ Page (busca/filtro) | Carousel | HeroRotating | LeadModal
 *
 * IMPORTANTE: um único DOMContentLoaded inicializa tudo.
 * O accordeão usa delegação no document — funciona no index.html E na faq.html
 * sem depender de um container com ID fixo.
 */

// ── Utilitário ───────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Nav / Hamburger ──────────────────────────────────────────────────────────
function initNav() {
  const btn  = $('#hamburgerBtn');
  const menu = $('#mobileMenu');
  if (!btn || !menu) return;

  function openMenu() {
    btn.classList.add('is-open');
    menu.classList.add('is-open');
    menu.removeAttribute('aria-hidden');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () =>
    btn.classList.contains('is-open') ? closeMenu() : openMenu()
  );

  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  });
}

// ── FAQ Accordeão ────────────────────────────────────────────────────────────
// Delegação no document: funciona em qualquer página sem depender de #faqList
function initFaqAccordion() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.faq-item__q');
    if (!btn) return;

    const item   = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-item__answer');
    if (!answer) return;

    const isOpen = item.classList.contains('is-open');

    // Fecha outros itens dentro do mesmo .faq-list
    const list = item.closest('.faq-list');
    if (list) {
      list.querySelectorAll('.faq-item.is-open').forEach(open => {
        if (open === item) return;
        open.classList.remove('is-open');
        const a = open.querySelector('.faq-item__answer');
        if (a) a.style.maxHeight = '0';
        const q = open.querySelector('.faq-item__q');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
    }

    // Abre ou fecha o item clicado
    if (isOpen) {
      item.classList.remove('is-open');
      answer.style.maxHeight = '0';
      btn.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('is-open');
      answer.removeAttribute('hidden'); // garante que hidden do HTML não bloqueie
      // Força reflow para que scrollHeight seja correto após removeAttribute
      answer.style.maxHeight = '0';
      requestAnimationFrame(() => {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      });
      btn.setAttribute('aria-expanded', 'true');
    }
  });
}

// ── FAQ Page: Pesquisa + Filtro por categoria ────────────────────────────────
function initFaqPage() {
  const searchInput  = $('#faqSearch');
  const categoryBtns = $$('[data-cat]');
  const groups       = $$('.faq-group');
  const noResults    = $('#faqNoResults');

  // Só roda na faq.html
  if (!groups.length) return;

  let activeCategory = 'all';

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function filterAll() {
    const query = normalize(searchInput ? searchInput.value.trim() : '');
    let totalVisible = 0;

    groups.forEach(group => {
      const groupCat = group.dataset.group;
      const catMatch = activeCategory === 'all' || activeCategory === groupCat;
      let groupVisible = 0;

      group.querySelectorAll('.faq-item').forEach(item => {
        const itemCat  = item.dataset.cat || '';
        const qText    = item.querySelector('.faq-item__q')?.textContent || '';
        const aText    = item.querySelector('.faq-item__answer p')?.textContent || '';
        const text     = normalize(qText + ' ' + aText);
        const catPass  = activeCategory === 'all' || activeCategory === itemCat;
        const qPass    = !query || text.includes(query);
        const show     = catPass && qPass;

        item.style.display = show ? '' : 'none';
        if (show) groupVisible++;
      });

      group.style.display = (catMatch && groupVisible > 0) ? '' : 'none';
      totalVisible += groupVisible;
    });

    if (noResults) {
      noResults.style.display = totalVisible === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterAll);
  }

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeCategory = btn.dataset.cat;
      filterAll();
    });
  });
}

// ── Carousel ─────────────────────────────────────────────────────────────────
function initCarousel() {
  const track    = $('#carouselTrack');
  const dotsWrap = $('#carouselDots');
  const prevBtn  = $('#prevBtn');
  const nextBtn  = $('#nextBtn');
  if (!track) return;

  const cards = $$('.t-card', track);
  const GAP   = 20;
  let current = 0;

  function visibleCount() {
    const w = track.parentElement.parentElement.offsetWidth;
    if (w <= 600) return 1;
    if (w <= 900) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, cards.length - visibleCount());
  }

  function setCardWidths() {
    const vis   = visibleCount();
    const wrap  = track.parentElement.parentElement;
    const cardW = Math.floor((wrap.offsetWidth - GAP * (vis - 1)) / vis);
    cards.forEach(c => {
      c.style.width    = cardW + 'px';
      c.style.minWidth = cardW + 'px';
    });
    track.style.gap = GAP + 'px';
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    const pages = maxIndex() + 1;
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot' + (i === current ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.setAttribute('aria-selected', String(i === current));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex()));
    const offset = current * (cards[0].offsetWidth + GAP);
    track.style.transform = `translateX(-${offset}px)`;
    buildDots();
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= maxIndex();
  }

  let autoTimer = setInterval(() => goTo(current >= maxIndex() ? 0 : current + 1), 4500);
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => {
    autoTimer = setInterval(() => goTo(current >= maxIndex() ? 0 : current + 1), 4500);
  });

  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) goTo(dx > 0 ? current + 1 : current - 1);
  });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setCardWidths();
      goTo(Math.min(current, maxIndex()));
    }, 100);
  });

  setCardWidths();
  goTo(0);
}

// ── Hero Rotating Text ───────────────────────────────────────────────────────
function initHeroRotating() {
  const el = $('#heroRotating');
  if (!el) return;

  const terms = [
    'VOO CANCELADO',
    'VOO ATRASADO',
    'OVERBOOKING',
    'MALA EXTRAVIADA',
    'FRAUDE FINANCEIRA',
    'GOLPE DO DELIVERY',
    'GOLPE DA MAQUININHA',
    'FALSA CENTRAL',
    'NEGATIVAÇÃO INDEVIDA',
    'IMÓVEL ATRASADO',
  ];

  let idx = 0;
  const INTERVAL     = 2000;
  const OUT_DURATION = 300;

  setInterval(() => {
    idx = (idx + 1) % terms.length;
    el.classList.remove('slide-in');
    el.classList.add('slide-out');
    setTimeout(() => {
      el.textContent = terms[idx];
      el.classList.remove('slide-out');
      el.classList.add('slide-in');
    }, OUT_DURATION);
  }, INTERVAL);
}

// ── Modal de Lead ────────────────────────────────────────────────────────────
function initLeadModal() {
  const modal        = $('#leadModal');
  const backdrop     = $('#modalBackdrop');
  const closeBtn     = $('#modalClose');
  const form         = $('#leadForm');
  const success      = $('#leadSuccess');
  const submitBtn    = $('#leadSubmit');
  const successClose = $('#successClose');
  if (!modal) return;

  let pendingWaUrl  = null;
  let pendingService = null;

  function openModal() {
    modal.classList.add('is-open');
    modal.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    form.hidden    = false;
    success.hidden = true;
    form.reset();
    clearErrors();
    setTimeout(() => $('#leadName')?.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    pendingWaUrl   = null;
    pendingService = null;
  }

  $$('[data-modal="lead"]').forEach(btn =>
    btn.addEventListener('click', e => { e.preventDefault(); openModal(); })
  );

  $$('.svc-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      pendingWaUrl   = card.dataset.waUrl;
      pendingService = card.dataset.service ?? null;
      openModal();
    });
  });

  backdrop?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);
  successClose?.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  function showError(inputEl, errorId, msg) {
    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = msg;
  }

  function showValid(inputEl) {
    inputEl.classList.remove('is-invalid');
    inputEl.classList.add('is-valid');
    const errId = inputEl.id.replace('lead', '').toLowerCase() + 'Error';
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = '';
  }

  function clearErrors() {
    $$('.lead-form__input', form).forEach(el =>
      el.classList.remove('is-invalid', 'is-valid')
    );
    $$('.lead-form__error', form).forEach(el => (el.textContent = ''));
  }

  const phoneInput = $('#leadPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      const d = phoneInput.value.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 2)  phoneInput.value = d;
      else if (d.length <= 6)  phoneInput.value = `(${d.slice(0,2)}) ${d.slice(2)}`;
      else if (d.length <= 10) phoneInput.value = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
      else phoneInput.value = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    });
  }

  function validateName() {
    const el = $('#leadName');
    const v  = el.value.trim();
    if (!v)        { showError(el, 'nameError', 'Informe seu nome');  return false; }
    if (v.length < 3) { showError(el, 'nameError', 'Nome muito curto'); return false; }
    showValid(el); return true;
  }

  function validatePhone() {
    const el = $('#leadPhone');
    const d  = el.value.replace(/\D/g, '');
    if (!d)         { showError(el, 'phoneError', 'Informe seu telefone'); return false; }
    if (d.length < 10) { showError(el, 'phoneError', 'Telefone inválido');    return false; }
    showValid(el); return true;
  }

  function validateEmail() {
    const el = $('#leadEmail');
    const v  = el.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!v)         { showError(el, 'emailError', 'Informe seu e-mail'); return false; }
    if (!re.test(v)){ showError(el, 'emailError', 'E-mail inválido');    return false; }
    showValid(el); return true;
  }

  $('#leadName')?.addEventListener('blur', validateName);
  phoneInput?.addEventListener('blur', validatePhone);
  $('#leadEmail')?.addEventListener('blur', validateEmail);

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Usa & (bitwise) para rodar todas as validações mesmo se uma falhar
    const ok = validateName() & validatePhone() & validateEmail();
    if (!ok) return;

    const submitText = $('.lead-form__submit-text', form);
    const spinner    = $('.lead-form__spinner', form);
    submitBtn.disabled     = true;
    submitText.textContent = 'Enviando...';
    spinner.hidden         = false;

    const payload = {
      name:    $('#leadName').value.trim(),
      phone:   $('#leadPhone').value.trim(),
      email:   $('#leadEmail').value.trim(),
      service: pendingService ?? '',
    };

    try {
      const res = await fetch('http://localhost:3001/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.hidden    = true;
      success.hidden = false;
      if (pendingWaUrl) {
        window.open(pendingWaUrl, '_blank', 'noopener');
        pendingWaUrl   = null;
        pendingService = null;
      }
    } catch (err) {
      console.error('Erro ao enviar lead:', err);
      showError($('#leadEmail'), 'emailError', 'Erro ao enviar. Tente novamente.');
    } finally {
      submitBtn.disabled     = false;
      submitText.textContent = 'Quero verificar meu direito →';
      spinner.hidden         = true;
    }
  });
}

// ── Boot — único DOMContentLoaded ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFaqAccordion(); // funciona em index.html E faq.html
  initFaqPage();      // só ativa se houver grupos .faq-group (faq.html)
  initCarousel();
  initHeroRotating();
  initLeadModal();
});
