
(function () {
  'use strict';

  var body = document.body;
  var header = document.querySelector('[data-header]');
  var preloader = document.querySelector('[data-preloader]');
  var progress = document.querySelector('[data-scroll-progress]');
  var drawer = document.querySelector('[data-mobile-drawer]');
  var overlay = document.querySelector('[data-menu-overlay]');
  var openMenuButton = document.querySelector('[data-menu-toggle]');
  var closeMenuButton = document.querySelector('[data-menu-close]');
  var searchPanel = document.querySelector('[data-search-panel]');
  var desktopSearch = document.querySelector('[data-desktop-search]');
  var desktopResults = document.querySelector('[data-desktop-search-results]');
  var mobileSearch = document.querySelector('[data-search-input]');
  var mobileResults = document.querySelector('[data-search-results]');

  function getBase() {
    return document.body.getAttribute('data-page') === 'root' ? '' : '../';
  }

  /* -------------------------------------------------------
     Local static preview routing
     GitHub Pages serves folder/index.html as /folder/.
     Some local file viewers instead open a directory listing.
     Keep the public URL clean online, but use the real index.html
     file automatically when the site is being previewed locally.
  ------------------------------------------------------- */
  function isLocalPreview() {
    return window.location.protocol === 'file:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '::1';
  }

  function localSafeHref(rawHref) {
    if (!isLocalPreview() || !rawHref) return rawHref;

    try {
      var target = new URL(rawHref, window.location.href);
      var path = target.pathname;
      if (path.endsWith('/')) {
        path += 'index.html';
        target.pathname = path;
      }
      return target.href;
    } catch (error) {
      return rawHref;
    }
  }

  /* Catch normal and dynamically-generated internal links. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link || !isLocalPreview()) return;

    var rawHref = link.getAttribute('href');
    if (!rawHref || /^(https?:|mailto:|tel:|javascript:|#)/i.test(rawHref)) return;

    var safeHref = localSafeHref(rawHref);
    if (safeHref !== rawHref) {
      event.preventDefault();
      window.location.assign(safeHref);
    }
  }, true);

  /* -------------------------------------------------------
     Page preload
  ------------------------------------------------------- */
  window.addEventListener('load', function () {
    window.setTimeout(function () {
      if (preloader) preloader.classList.add('is-hidden');
    }, 650);
  });

  /* -------------------------------------------------------
     Header + progress
  ------------------------------------------------------- */
  function updateScrollUI() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var percent = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = percent + '%';
    }
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  /* -------------------------------------------------------
     Mobile drawer — deliberately simple and robust for small screens.
  ------------------------------------------------------- */
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    if (overlay) overlay.classList.toggle('open', open);
    body.classList.toggle('menu-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (openMenuButton) openMenuButton.setAttribute('aria-expanded', String(open));
  }
  if (openMenuButton) openMenuButton.addEventListener('click', function () { setDrawer(true); });
  if (closeMenuButton) closeMenuButton.addEventListener('click', function () { setDrawer(false); });
  if (overlay) overlay.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      setDrawer(false);
      closeSearch();
      safeCloseGallery();
    }
  });
  document.querySelectorAll('.mobile-drawer a').forEach(function (link) {
    link.addEventListener('click', function () { setDrawer(false); });
  });

  /* -------------------------------------------------------
     Search index + command-style results
  ------------------------------------------------------- */
  var searchIndex = [
    { title: 'About ASKWNE', note: 'Company story, credibility and principles', href: 'about/', keywords: 'about company incorporated Ghanaian owned credibility credentials values quality reliability efficiency' },
    { title: 'Bitumen Supply', note: 'Contractor supply in Ghana + selected West African routes', href: 'bitumen/', keywords: 'bitumen supply road material contractor drums delivery quote pricing West Africa Ghana payment logistics' },
    { title: 'Building Construction', note: 'Government, private clients and Ghanaians abroad', href: 'building/', keywords: 'building construction land land registration Ghana abroad government private home real estate 50 percent mobilisation' },
    { title: 'Road Construction', note: 'Road work, maintenance and subcontracting support', href: 'construction/', keywords: 'road roads construction maintenance subcontractor government Bolgatanga Tamale Techiman bitumen asphalt contractor' },
    { title: 'Book an Appointment', note: 'Send a focused project enquiry', href: 'appointment/', keywords: 'appointment contact booking WhatsApp email phone enquiry project quote' },
    { title: 'Bitumen Gallery', note: 'Supply environment and road logistics visuals', href: 'bitumen/#gallery', keywords: 'gallery photos images drums tank yard tanker road supply' },
    { title: 'Building Gallery', note: 'Building and site visuals', href: 'building/#gallery', keywords: 'building photos gallery project site development' },
    { title: 'Road Work Gallery', note: 'Road equipment and surfaces', href: 'construction/#gallery', keywords: 'road gallery equipment roller asphalt roadwork photos' }
  ];

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  }

  function resolveResult(item) {
    var base = getBase();
    return localSafeHref(base + item.href);
  }

  function score(item, query) {
    var q = normalize(query);
    if (!q) return 0;
    var terms = q.split(' ');
    var hay = normalize(item.title + ' ' + item.note + ' ' + item.keywords);
    var title = normalize(item.title);
    var points = 0;
    terms.forEach(function (term) {
      if (hay.indexOf(term) !== -1) points += 1;
      if (title.indexOf(term) !== -1) points += 3;
      if (title === term) points += 3;
    });
    return points;
  }

  function getMatches(query) {
    return searchIndex.map(function (item) { return { item: item, score: score(item, query) }; })
      .filter(function (entry) { return entry.score > 0; })
      .sort(function (a,b) { return b.score - a.score; })
      .slice(0, 7);
  }

  function renderResults(box, query, dark) {
    if (!box) return [];
    box.innerHTML = '';
    var matches = getMatches(query);
    if (!normalize(query)) return matches;
    if (!matches.length) {
      var empty = document.createElement('div');
      empty.className = 'search-result-copy';
      empty.style.padding = '12px';
      empty.textContent = 'No matching page or service found.';
      box.appendChild(empty);
      return matches;
    }
    matches.forEach(function (entry, index) {
      var link = document.createElement('a');
      link.className = dark ? 'mobile-search-result' : 'desktop-search-result';
      link.href = resolveResult(entry.item);
      link.innerHTML = '<span class="search-result-no">' + String(index + 1).padStart(2,'0') + '</span>' +
        '<span class="search-result-copy"><strong></strong><small></small></span><span aria-hidden="true">↗</span>';
      link.querySelector('strong').textContent = entry.item.title;
      link.querySelector('small').textContent = entry.item.note;
      box.appendChild(link);
    });
    return matches;
  }

  function openSearch() {
    if (!searchPanel) return;
    searchPanel.classList.add('open');
    body.classList.add('search-open');
    searchPanel.setAttribute('aria-hidden','false');
    window.setTimeout(function () { if (desktopSearch) desktopSearch.focus(); }, 50);
  }
  function closeSearch() {
    if (!searchPanel) return;
    searchPanel.classList.remove('open');
    body.classList.remove('search-open');
    searchPanel.setAttribute('aria-hidden','true');
  }
  document.querySelectorAll('[data-search-open]').forEach(function(btn){ btn.addEventListener('click', openSearch); });
  document.querySelectorAll('[data-search-close]').forEach(function(btn){ btn.addEventListener('click', closeSearch); });
  if (searchPanel) searchPanel.addEventListener('click', function(e){ if(e.target === searchPanel) closeSearch(); });

  function hookSearchInput(input, box, dark) {
    if (!input) return;
    input.addEventListener('input', function(){ renderResults(box, input.value, dark); });
    input.addEventListener('keydown', function(event){
      if(event.key === 'Enter'){
        var matches = renderResults(box, input.value, dark);
        if(matches.length) window.location.assign(resolveResult(matches[0].item));
      }
    });
  }
  hookSearchInput(desktopSearch, desktopResults, false);
  hookSearchInput(mobileSearch, mobileResults, true);

  document.querySelectorAll('[data-search-submit]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var matches = renderResults(mobileResults, mobileSearch ? mobileSearch.value : '', true);
      if(matches.length) window.location.assign(resolveResult(matches[0].item));
    });
  });

  /* -------------------------------------------------------
     Reveal-on-scroll
  ------------------------------------------------------- */
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: .12 });
    revealItems.forEach(function(item){ observer.observe(item); });
  } else {
    revealItems.forEach(function(item){ item.classList.add('is-visible'); });
  }

  /* -------------------------------------------------------
     Gallery lightbox
  ------------------------------------------------------- */
  var galleryButtons = document.querySelectorAll('[data-gallery]');
  var galleryModal = null;
  if (galleryButtons.length) {
    galleryModal = document.createElement('div');
    galleryModal.className = 'gallery-modal';
    galleryModal.setAttribute('aria-hidden','true');
    galleryModal.innerHTML = '<div class="gallery-modal-inner"><button class="gallery-modal-close" type="button" aria-label="Close image">×</button><img alt=""><div class="gallery-modal-caption"></div></div>';
    document.body.appendChild(galleryModal);
    var gImg = galleryModal.querySelector('img');
    var gCaption = galleryModal.querySelector('.gallery-modal-caption');
    var gClose = galleryModal.querySelector('.gallery-modal-close');
    function closeGallery(){ if(!galleryModal) return; galleryModal.classList.remove('open'); galleryModal.setAttribute('aria-hidden','true'); body.classList.remove('modal-open-custom'); }
    function openGallery(btn){ gImg.src = btn.getAttribute('data-gallery'); gImg.alt = btn.querySelector('img') ? btn.querySelector('img').alt : ''; gCaption.textContent = btn.getAttribute('data-caption') || ''; galleryModal.classList.add('open'); galleryModal.setAttribute('aria-hidden','false'); body.classList.add('modal-open-custom'); gClose.focus(); }
    galleryButtons.forEach(function(btn){ btn.addEventListener('click', function(){ openGallery(btn); }); });
    gClose.addEventListener('click', closeGallery);
    galleryModal.addEventListener('click', function(e){ if(e.target === galleryModal) closeGallery(); });
  }
  /* closeGallery may be undefined when there is no gallery */
  function safeCloseGallery(){ if(galleryModal) galleryModal.classList.remove('open'); body.classList.remove('modal-open-custom'); }
  window.addEventListener('keydown', function(e){ if(e.key === 'Escape') safeCloseGallery(); });

  /* -------------------------------------------------------
     Appointment form: static-site friendly WhatsApp + email actions
  ------------------------------------------------------- */
  var form = document.querySelector('#appointmentForm');
  if (form) {
    var query = new URLSearchParams(window.location.search);
    var serviceParam = query.get('service');
    if(serviceParam){
      var serviceSelect = form.querySelector('#service');
      if(serviceSelect){
        Array.prototype.forEach.call(serviceSelect.options, function(option){
          if(normalize(option.value).indexOf(normalize(serviceParam)) !== -1 || normalize(serviceParam).indexOf(normalize(option.value)) !== -1){ serviceSelect.value = option.value; }
        });
      }
    }
    function collectForm(){
      var name = form.querySelector('#fullName').value.trim();
      var company = form.querySelector('#company').value.trim();
      var email = form.querySelector('#email').value.trim();
      var phone = form.querySelector('#phone').value.trim();
      var service = form.querySelector('#service').value.trim();
      var location = form.querySelector('#location').value.trim();
      var timeline = form.querySelector('#timeline').value.trim();
      var message = form.querySelector('#message').value.trim();
      var consent = form.querySelector('#consent').checked;
      var status = form.querySelector('[data-form-status]');
      if(!name || !email || !phone || !service || !consent){ status.textContent = 'Please complete the required fields before preparing the enquiry.'; return null; }
      var subject = 'ASKWNE Project Appointment — ' + service;
      var bodyText = [
        'Hello ASKWNE Ghana Ltd,', '',
        'I would like to make a project enquiry / appointment.', '',
        'Name: ' + name,
        'Company / organisation: ' + (company || 'Not provided'),
        'Email: ' + email,
        'Phone / WhatsApp: ' + phone,
        'Service: ' + service,
        'Project location: ' + (location || 'Not provided'),
        'Target timeline: ' + (timeline || 'Not provided'),
        'Project details: ' + (message || 'Not provided'), '',
        'Thank you.'
      ].join('\n');
      status.textContent = 'Your enquiry is ready. Choose WhatsApp or Email to send it.';
      return { subject: subject, body: bodyText };
    }
    var waBtn = form.querySelector('[data-send-whatsapp]');
    var emailBtn = form.querySelector('[data-send-email]');
    if(waBtn) waBtn.addEventListener('click', function(){ var data = collectForm(); if(!data) return; window.open('https://wa.me/233242051066?text=' + encodeURIComponent(data.body), '_blank', 'noopener'); });
    if(emailBtn) emailBtn.addEventListener('click', function(){ var data = collectForm(); if(!data) return; window.location.href = 'mailto:askwneghanalimited23@gmail.com?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(data.body); });
  }

  /* -------------------------------------------------------
     Tiny parallax touch-free effect for pointer devices only.
  ------------------------------------------------------- */
  if (window.matchMedia && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.pathway-card, .credibility-card, .reason-card').forEach(function(card){
      card.addEventListener('pointermove', function(event){
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - .5;
        var y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = 'perspective(800px) rotateX(' + (-y*2.2) + 'deg) rotateY(' + (x*2.2) + 'deg) translateY(-2px)';
      });
      card.addEventListener('pointerleave', function(){ card.style.transform = ''; });
    });
  }
})();


/* -------------------------------------------------------
   Bitumen FAQ — resilient static fallback
   Keeps the FAQ clickable even if Bootstrap's CDN script is
   unavailable while preserving the Bootstrap accordion look.
------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  var faqButtons = document.querySelectorAll('#bitumenFaq .accordion-button');
  faqButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var targetSelector = button.getAttribute('data-bs-target');
      var target = targetSelector ? document.querySelector(targetSelector) : null;
      if (!target) return;
      var isOpen = target.classList.contains('show');
      document.querySelectorAll('#bitumenFaq .accordion-collapse').forEach(function (panel) {
        panel.classList.remove('show');
      });
      document.querySelectorAll('#bitumenFaq .accordion-button').forEach(function (item) {
        item.classList.add('collapsed');
        item.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        target.classList.add('show');
        button.classList.remove('collapsed');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
