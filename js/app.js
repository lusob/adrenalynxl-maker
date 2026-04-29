(function () {
  'use strict';

  /* ===== CONSTANTS ===== */
  const VERSION = '1.1.0';
  const CARD_RATIO = 2 / 3;
  const EXPORT_SCALE = 3;
  const EXPORT_W = 600;
  const EXPORT_H = 900;

/* Adrenalyn XL stats: DEF + CON + ATA = Global (max 303) */
    const STAT_KEYS = ['def', 'con', 'ata'];
    const STAT_LBL = { def:'DEF', con:'CON', ata:'ATA' };
    const STAT_CLR = { def:'#e74c3c', con:'#3498db', ata:'#2ecc71' };
    const STAT_MAX = 101;
    function calcOverallFor(d) {
      return (d.stats.def || 0) + (d.stats.con || 0) + (d.stats.ata || 0);
    }
    function calcOverall() {
      return calcOverallFor(S);
    }

  const TYPE_THEMES = {
    gold:        { accent:'#e8b931', bg:['#1a1500','#0d0d1a','#000000'] },
    silver:      { accent:'#e0e0e0', bg:['#1a1a2e','#0d0d1a','#0a0a15'] },
    bronze:      { accent:'#cd7f32', bg:['#1a0f00','#0d0a05','#050505'] },
    special:     { accent:'#da77f2', bg:['#1a0020','#0d0015','#050008'] },
    legend:      { accent:'#ff4444', bg:['#200000','#150000','#080000'] },
    holographic: { accent:'#00e5ff', bg:['#001a20','#001015','#000808'] },
  };

  /* ===== STATE ===== */
  const S = {
    photoDataUrl: null,
    name: '', number: '', position: 'MED',
    team: '', league: 'LaLiga', country: '',
    stats: { def: 50, con: 60, ata: 55 },
    skills: { speed:3, control:4, strength:2 },
    cardType: 'gold',
    specialBg: 'default',
    pattern: 'none',
    bgColor: '#1a1a2e',
    accentColor: '#e8b931',
    /* Back card */
    backStyle: 'classic',
    backColor: '#0d1b3e',
    backLogo: 'ADRENALYN XL',
    backText: '',
    backLogoImg: '',
  };

  /* ===== HELPERS ===== */
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2500);
  }

  function stars(n) { return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n); }

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function seededRng(seed) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* ===== NAVIGATION ===== */
  $$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.nav-tab').forEach(t => t.classList.remove('active'));
      $$('.view').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      $(`#view-${tab.dataset.view}`).classList.add('active');
      if (tab.dataset.view === 'album') renderAlbum();
    });
  });

  $('#btn-home').addEventListener('click', () => {
    $$('.nav-tab').forEach(t => t.classList.remove('active'));
    $$('.view').forEach(v => v.classList.remove('active'));
    $('.nav-tab[data-view="editor"]').classList.add('active');
    $('#view-editor').classList.add('active');
  });

  /* ===== EDITOR PANELS ===== */
  $$('.editor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.editor-tab').forEach(t => t.classList.remove('active'));
      $$('.panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#panel-${tab.dataset.panel}`).classList.add('active');
    });
  });

  /* ===== CARD RENDERING ===== */
  function buildCardFront(container, data) {
    const d = data || S;
    const theme = TYPE_THEMES[d.cardType] || TYPE_THEMES.gold;
    const accent = d.accentColor || theme.accent;
    const bg = d.bgColor || theme.bg[1];
    const ovr = d.overall || calcOverallFor(d);

    const bgStyle = `background: linear-gradient(160deg, ${theme.bg[0]}, ${bg}, ${theme.bg[2]});`;

    const photoHTML = d.photoDataUrl
      ? `<img src="${d.photoDataUrl}" class="card-photo" alt="">`
      : `<div class="card-photo-ph"><span class="ico">&#9917;</span><span>Sin foto</span></div>`;

    const statsHTML = STAT_KEYS.map(k => {
      const val = d.stats[k] || 0;
      const pct = Math.min(val / STAT_MAX * 100, 100);
      return `
        <div class="card-stat-cat">
          <span class="card-stat-cat-lbl" style="color:${STAT_CLR[k]}">${STAT_LBL[k]}</span>
          <div class="card-stat-bar"><div class="card-stat-fill" style="width:${pct}%;background:${STAT_CLR[k]}"></div></div>
          <span class="card-stat-cat-val" style="color:${STAT_CLR[k]}">${val}</span>
        </div>`;
    }).join('');

    const skillsHTML = Object.keys(d.skills).map(k => `
      <div class="card-skill">
        <span class="card-skill-lbl">${k === 'speed' ? 'Vel' : k === 'control' ? 'Ctrl' : 'Fur'}</span>
        <span class="card-skill-stars">${stars(d.skills[k])}</span>
      </div>`).join('');

    const shineClass = d.specialBg !== 'default' ? ` card-shine ${d.specialBg}` : '';

    const badgeHTML = d.specialBg === 'ballondor'
      ? '<div class="card-vertical-badge ballondor">Ballon d\'Or</div>'
      : d.specialBg === 'kryptonite'
        ? '<div class="card-vertical-badge kryptonite">Kryptonite</div>'
        : d.specialBg === 'diamond'
          ? '<div class="card-vertical-badge diamond">Diamond</div>'
          : d.specialBg === 'molten'
            ? '<div class="card-vertical-badge molten">Molten</div>'
            : d.specialBg === 'galaxy'
              ? '<div class="card-vertical-badge galaxy">Galaxy</div>'
              : d.cardType === 'legend'
                ? '<div class="card-vertical-badge legend">Legend</div>'
                : d.cardType === 'special'
                  ? '<div class="card-vertical-badge special">Special</div>'
                  : '';

    const typeClass = d.cardType ? ` card-type-${d.cardType}` : '';

    container.innerHTML = `
      <div class="card${typeClass}" style="--card-accent:${accent}">
        <div class="card-bg-layer" style="${bgStyle}"></div>
        ${d.pattern !== 'none' ? buildPattern(d.pattern) : ''}
        <div class="card-shine${shineClass}"></div>
        ${badgeHTML}
        <div class="card-border-layer" style="border-color:${accent}"></div>
        <div class="card-header">
          <div class="card-rating">
            <span class="card-rating-num" style="color:${accent}">${ovr}</span>
            <span class="card-rating-label">OVR</span>
          </div>
          <div style="text-align:right">
            <span class="card-pos" style="color:${accent}">${d.position}</span>
            ${d.number ? `<div class="card-num">${d.number}</div>` : ''}
          </div>
        </div>
        <div class="card-photo-area">${photoHTML}</div>
        <div class="card-name-area">
          <div class="card-name">${d.name || 'NOMBRE'}</div>
          <div class="card-team">${d.team || 'EQUIPO'}</div>
        </div>
        <div class="card-stats">${statsHTML}</div>
        <div class="card-skills">${skillsHTML}</div>
        <div class="card-footer">
          <span class="card-league">${d.league}</span>
          <span class="card-country">${d.country || ''}</span>
        </div>
      </div>`;
  }

  function buildPattern(type) {
    const patterns = {
      hexagon: `<div class="card-bg-layer" style="background-image:radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 1px, transparent 1px);background-size:18px 18px;z-index:1"></div>`,
      lines: `<div class="card-bg-layer" style="background-image:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,0.02) 8px,rgba(255,255,255,0.02) 9px);z-index:1"></div>`,
      dots: `<div class="card-bg-layer" style="background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:10px 10px;z-index:1"></div>`,
      cross: `<div class="card-bg-layer" style="background-image:repeating-linear-gradient(0deg,transparent,transparent 6px,rgba(255,255,255,0.02) 6px,rgba(255,255,255,0.02) 7px),repeating-linear-gradient(90deg,transparent,transparent 6px,rgba(255,255,255,0.02) 6px,rgba(255,255,255,0.02) 7px);z-index:1"></div>`,
    };
    return patterns[type] || '';
  }

  function buildCardBack(container, data) {
    const d = data || S;
    const accent = d.accentColor || (TYPE_THEMES[d.cardType] || TYPE_THEMES.gold).accent;
    const clr = d.backColor || '#0d1b3e';

    const logoImgHTML = d.backLogoImg
      ? `<img src="${d.backLogoImg}" class="card-back-logo-img" onerror="this.style.display='none'">`
      : '';

    const textHTML = d.backText ? `<div class="card-back-text">${d.backText}</div>` : '';

    container.innerHTML = `
      <div class="card-back-inner ${d.backStyle}" style="background-color:${clr};--card-accent:${accent}">
        <div class="card-back-border" style="border-color:${accent}"></div>
        ${logoImgHTML}
        <div class="card-back-logo" style="color:${accent}">${d.backLogo || 'ADRENALYN XL'}</div>
        <div class="card-back-pattern"><div class="card-back-diamond"></div></div>
        ${textHTML}
        <div class="card-back-bottom">PANINI &#169; ${new Date().getFullYear()}</div>
      </div>`;
  }

  function renderCard() {
    buildCardFront($('#card-front'), S);
    buildCardBack($('#card-back'), S);
  }

  /* ===== CARD 3D FLIP ===== */
  const card3d = $('#card-3d');
  let isFlipped = false;

  function toggleFlip() {
    isFlipped = !isFlipped;
    card3d.classList.toggle('flipped', isFlipped);
  }

  card3d.addEventListener('click', toggleFlip);
  $('#btn-flip').addEventListener('click', toggleFlip);

  /* ===== FORM BINDINGS ===== */
  function bind(id, key, fn) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      S[key] = fn ? fn(el.value) : el.value;
      renderCard();
    });
  }

  bind('#input-name', 'name');
  bind('#input-position', 'position');
  bind('#input-team', 'team');
  bind('#input-league', 'league');
  bind('#input-country', 'country');

  $('#input-number').addEventListener('input', function () { S.number = this.value; renderCard(); });

  /* Build simple stat inputs: DEF, CON, ATA */
  function buildStatsUI() {
    STAT_KEYS.forEach(k => {
      const input = $(`#input-stat-${k}`);
      const val = $(`#val-stat-${k}`);
      input.value = S.stats[k] || 0;
      val.textContent = S.stats[k] || 0;
      input.addEventListener('input', function () {
        S.stats[k] = +this.value;
        val.textContent = this.value;
        $('#overall-val').textContent = calcOverall();
        renderCard();
      });
    });
    $('#overall-val').textContent = calcOverall();
  }
  buildStatsUI();

  /* Skills */
  ['speed','control','strength'].forEach(k => {
    $(`#input-skill-${k}`).addEventListener('input', function () {
      const n = +this.value;
      S.skills[k] = n;
      $(`#skill-${k}`).textContent = stars(n);
      renderCard();
    });
  });

  /* Photo */
  $('#input-photo').addEventListener('change', function (e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      S.photoDataUrl = ev.target.result;
      $('#photo-label').textContent = f.name.slice(0, 18);
      $('#btn-remove-photo').style.display = '';
      renderCard();
    };
    r.readAsDataURL(f);
  });

  $('#btn-remove-photo').addEventListener('click', () => {
    S.photoDataUrl = null;
    $('#photo-label').textContent = 'Sin foto';
    $('#btn-remove-photo').style.display = 'none';
    $('#input-photo').value = '';
    $('#input-photo-url').value = '';
    renderCard();
  });

  /* Load photo from URL */
  $('#btn-load-photo-url').addEventListener('click', loadPhotoFromUrl);
  $('#input-photo-url').addEventListener('keydown', e => {
    if (e.key === 'Enter') loadPhotoFromUrl();
  });

  function loadPhotoFromUrl() {
    const url = $('#input-photo-url').value.trim();
    if (!url) return;

    const btn = $('#btn-load-photo-url');
    btn.textContent = '⏳';
    btn.disabled = true;

    const img = new Image();
    img.onload = function () {
      S.photoDataUrl = url;
      const name = url.split('/').pop().split('?')[0].slice(0, 20);
      $('#photo-label').textContent = name || 'URL cargada';
      $('#btn-remove-photo').style.display = '';
      renderCard();
      btn.textContent = 'Cargar';
      btn.disabled = false;
      toast('Foto cargada ✓');
    };
    img.onerror = function () {
      toast('Error: no se pudo cargar la imagen');
      btn.textContent = 'Cargar';
      btn.disabled = false;
    };
    img.src = url;
  }

 /* ===== IMAGE SEARCH ===== */
   const CORS_PROXIES = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

   let searchTarget = 'photo'; /* 'photo' or 'logo' */

  function openSearch(target) {
    searchTarget = target || 'photo';
    $('#search-modal').classList.remove('hidden');
    $('#search-query').value = S.name || '';
    $('#search-results').innerHTML = '';
    $('#search-empty').classList.add('hidden');
    $('#search-loading').classList.add('hidden');
    setTimeout(() => $('#search-query').focus(), 100);
  }

  function closeSearch() {
    $('#search-modal').classList.add('hidden');
  }

  $('#btn-search-images').addEventListener('click', () => openSearch('photo'));
  $('#btn-search-logo').addEventListener('click', () => openSearch('logo'));
  $('#search-close').addEventListener('click', closeSearch);
  $('#search-overlay').addEventListener('click', closeSearch);

  $('#search-go').addEventListener('click', doSearch);
  $('#search-query').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  function doSearch() {
    const q = $('#search-query').value.trim();
    if (!q) return;

    $('#search-results').innerHTML = '';
    $('#search-empty').classList.add('hidden');
    $('#search-loading').classList.remove('hidden');

    const targetUrl = `https://www.pngarts.com/es/?s=${encodeURIComponent(q)}`;
    tryFetchProxies(targetUrl)
      .then(html => {
        parseSearchResults(html);
      })
      .catch(err => {
        console.error('Search error:', err);
        toast('Error al buscar. Intenta de nuevo.');
        $('#search-loading').classList.add('hidden');
      });
  }

  async function tryFetchProxies(url) {
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyUrl = CORS_PROXIES[i](url);
      try {
        const r = await fetch(proxyUrl);
        if (r.ok) return await r.text();
      } catch (e) {
        console.warn(`Proxy ${i} failed:`, e.message);
      }
    }
    throw new Error('All proxies failed');
  }

  function parseSearchResults(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results = [];
    const seen = new Set();

    doc.querySelectorAll('img').forEach(img => {
      let src = img.src || img.dataset.src || img.dataset.lazySrc;
      if (!src) return;

      /* Resolve relative URLs */
      try {
        src = new URL(src, 'https://www.pngarts.com').href;
      } catch { return; }

      /* Skip thumbnails, icons, ads */
      if (src.includes('icon') || src.includes('logo') || src.includes('avatar') || src.includes('wp-emoji') || src.includes('tracking')) return;
      if (seen.has(src)) return;

      const alt = img.alt || '';
      /* Skip if alt is clearly not a player */
      if (alt.length < 2) return;

      seen.add(src);
      results.push({ src, alt });
    });

    $('#search-loading').classList.add('hidden');

    if (results.length === 0) {
      $('#search-empty').classList.remove('hidden');
      return;
    }

    const grid = $('#search-results');
    grid.innerHTML = results.map((r, i) => {
      const name = r.alt.replace(/descargar|imagen|png|download|image|transparent|fondo|fondo transparente|transparent background|png imagen|imagen png|gif|clipart|arte|vector|ilustración|dibujos animados|fotografía|foto|pintura|gráfico|fondo de pantalla|wallpaper|isolado|aislado|fondo blanco|white background|fondo negro|black background|png jpg|jpg png|gratis|free|alta calidad|high quality|resolución|resolution|hd|4k|5k|6k|7k|8k|9k|10k|11k|12k|13k|14k|15k|16k|17k|18k|19k|20k|21k|22k|23k|24k|25k|26k|27k|28k|29k|30k|31k|32k|33k|34k|35k|36k|37k|38k|39k|40k|41k|42k|43k|44k|45k|46k|47k|48k|49k|50k|51k|52k|53k|54k|55k|56k|57k|58k|59k|60k|61k|62k|63k|64k|65k|66k|67k|68k|69k|70k|71k|72k|73k|74k|75k|76k|77k|78k|79k|80k|81k|82k|83k|84k|85k|86k|87k|88k|89k|90k|91k|92k|93k|94k|95k|96k|97k|98k|99k|100k|101k|102k|103k|104k|105k|106k|107k|108k|109k|110k|111k|112k|113k|114k|115k|116k|117k|118k|119k|120k|121k|122k|123k|124k|125k|126k|127k|128k|129k|130k|131k|132k|133k|134k|135k|136k|137k|138k|139k|140k|141k|142k|143k|144k|145k|146k|147k|148k|149k|150k|151k|152k|153k|154k|155k|156k|157k|158k|159k|160k|161k|162k|163k|164k|165k|166k|167k|168k|169k|170k|171k|172k|173k|174k|175k|176k|177k|178k|179k|180k|181k|182k|183k|184k|185k|186k|187k|188k|189k|190k|191k|192k|193k|194k|195k|196k|197k|198k|199k|200k/gi, '').replace(/\s+/g, ' ').trim().slice(0, 30);
      return `
        <div class="search-result-item" data-url="${r.src}" onclick="window.selectSearchImage(this)">
          <img src="${r.src}" alt="${name}" loading="lazy" onerror="this.parentElement.style.display='none'">
          <div class="search-result-name">${name}</div>
        </div>`;
    }).join('');
  }

  window.selectSearchImage = function (el) {
    const url = el.dataset.url;
    if (!url) return;
    const name = el.querySelector('.search-result-name').textContent;

    if (searchTarget === 'logo') {
      S.backLogoImg = url;
      $('#input-back-logoimg').value = url;
      toast('Logo seleccionado ✓');
    } else {
      S.photoDataUrl = url;
      $('#photo-label').textContent = name;
      $('#btn-remove-photo').style.display = '';
      $('#input-photo-url').value = url;
      toast('Foto seleccionada ✓');
    }
    renderCard();
    closeSearch();
  };

  /* Card type */
  $$('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.cardType = btn.dataset.type;
      const theme = TYPE_THEMES[S.cardType];
      if (theme) {
        S.accentColor = theme.accent;
        $('#input-accent').value = theme.accent;
      }
      renderCard();
    });
  });

  /* Special bg */
  $$('.bg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.specialBg = btn.dataset.bg;
      renderCard();
    });
  });

  /* Back style */
  $$('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.back-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.backStyle = btn.dataset.back;
      renderCard();
    });
  });

  /* Style inputs */
  bind('#input-pattern', 'pattern');
  bind('#input-bgcolor', 'bgColor');
  bind('#input-accent', 'accentColor');
  bind('#input-back-color', 'backColor');
  bind('#input-back-logo', 'backLogo');
  bind('#input-back-text', 'backText');
  bind('#input-back-logoimg', 'backLogoImg');

  /* ===== ALBUM ===== */
  function getAlbum() {
    try { return JSON.parse(localStorage.getItem('axl_album') || '[]'); }
    catch { return []; }
  }

  function saveToAlbum() {
    const album = getAlbum();
    const cardData = JSON.parse(JSON.stringify(S));
    cardData.overall = calcOverall();
    album.push({
      id: Date.now(),
      ...cardData,
      savedAt: new Date().toISOString()
    });
    localStorage.setItem('axl_album', JSON.stringify(album));
    updateAlbumCount();
    toast('Cróm guardado en el álbum ✓');
  }

  function updateAlbumCount() {
    $('#album-count').textContent = getAlbum().length;
  }

  function renderAlbum() {
    const album = getAlbum();
    const search = ($('#album-search').value || '').toLowerCase();
    const filter = $('#album-filter').value;
    const sort = $('#album-sort').value;

    let cards = album;

    /* Filter */
    if (filter !== 'all') cards = cards.filter(c => c.cardType === filter);
    if (search) cards = cards.filter(c =>
      (c.name || '').toLowerCase().includes(search) ||
      (c.team || '').toLowerCase().includes(search)
    );

    /* Sort */
    switch (sort) {
      case 'newest': cards.sort((a, b) => b.id - a.id); break;
      case 'oldest': cards.sort((a, b) => a.id - b.id); break;
      case 'name': cards.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'overall': cards.sort((a, b) => (calcOverallFor(b) || 0) - (calcOverallFor(a) || 0)); break;
    }

    const grid = $('#album-grid');
    const empty = $('#album-empty');

    if (cards.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');

    /* Render mini cards using canvas thumbnails */
    grid.innerHTML = cards.map(c => {
      const theme = TYPE_THEMES[c.cardType] || TYPE_THEMES.gold;
      const accent = c.accentColor || theme.accent;
      const ovr = c.overall || calcOverallFor(c);
      return `
        <div class="album-card" data-id="${c.id}" onclick="window.openDetail(${c.id})">
          <canvas class="album-thumb" width="300" height="450" data-id="${c.id}"></canvas>
          <div class="album-card-overlay">
            <span class="album-card-name">${c.name || 'Sin nombre'}</span>
          </div>
        </div>`;
    }).join('');

    /* Draw thumbnails */
    requestAnimationFrame(() => {
      const promises = [];
      $$('.album-thumb').forEach(canvas => {
        const id = +canvas.dataset.id;
        const card = album.find(c => c.id === id);
        if (!card) return;
        drawCardToCanvas(canvas, card, true);
        promises.push(drawPhotoOnCanvas(canvas, card));
      });
      Promise.all(promises).then(() => {
        /* All photos drawn */
      });
    });
  }

  $('#album-search').addEventListener('input', renderAlbum);
  $('#album-filter').addEventListener('change', renderAlbum);
  $('#album-sort').addEventListener('change', renderAlbum);

/* ===== CANVAS EXPORT (proper 2:3 aspect ratio) ===== */
   function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,215,0,0.3)';
      ctx.fill();
    }

    function drawVerticalBadge(ctx, W, H, text, color, bgColor, borderColor) {
      const badgeW = 28;
      const badgeH = 200;
      const x = W - badgeW - 12;
      const y = (H - badgeH) / 2;

      ctx.save();
      ctx.fillStyle = bgColor;
      roundRect(ctx, x, y, badgeW, badgeH, 4);
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      roundRect(ctx, x, y, badgeW, badgeH, 4);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + badgeW / 2, y + badgeH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(text, 0, 4);
      ctx.restore();
      ctx.restore();
    }

   function drawCardToCanvas(canvas, data, mini) {
    const ctx = canvas.getContext('2d');
    const W = EXPORT_W;
    const H = EXPORT_H;

    canvas.width = W;
    canvas.height = H;

    const d = data;
    const theme = TYPE_THEMES[d.cardType] || TYPE_THEMES.gold;
    const accent = d.accentColor || theme.accent;
    const bg = d.bgColor || theme.bg[1];
    const r = 24; /* corner radius */

    /* Background gradient */
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, theme.bg[0]);
    grad.addColorStop(0.5, bg);
    grad.addColorStop(1, theme.bg[2]);
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, r);
    ctx.fill();

    /* Pattern overlay */
    if (d.pattern && d.pattern !== 'none') drawPattern(ctx, d.pattern, W, H);

    /* Special bg effects */
    if (d.specialBg === 'glow') {
      const rg = ctx.createRadialGradient(W/2, H*0.3, 0, W/2, H*0.3, W*0.6);
      rg.addColorStop(0, 'rgba(255,255,255,0.1)');
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    } else if (d.specialBg === 'fire') {
      const fg = ctx.createLinearGradient(0, H*0.3, 0, H);
      fg.addColorStop(0, 'transparent');
      fg.addColorStop(0.5, 'rgba(255,69,0,0.15)');
      fg.addColorStop(1, 'rgba(255,165,0,0.25)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    } else if (d.specialBg === 'ice') {
      const ig = ctx.createLinearGradient(0, 0, 0, H);
      ig.addColorStop(0, 'rgba(173,216,230,0.2)');
      ig.addColorStop(0.5, 'transparent');
      ig.addColorStop(1, 'rgba(135,206,250,0.1)');
      ctx.fillStyle = ig;
      ctx.fillRect(0, 0, W, H);
    } else if (d.specialBg === 'galaxy') {
      for (let i = 0; i < 40; i++) {
        const sx = Math.random() * W, sy = Math.random() * H;
        const sr = Math.random() * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.5+0.2})`;
        ctx.fill();
      }
      const gg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.5);
      gg.addColorStop(0, 'rgba(100,50,200,0.15)');
      gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, W, H);
    } else if (d.specialBg === 'neon') {
      const ng = ctx.createLinearGradient(0, 0, W, 0);
      ng.addColorStop(0, 'transparent');
      ng.addColorStop(0.25, 'rgba(0,255,255,0.1)');
      ng.addColorStop(0.5, 'transparent');
      ng.addColorStop(0.75, 'rgba(255,0,255,0.1)');
      ng.addColorStop(1, 'transparent');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, W, H);
    } else if (d.specialBg === 'carbon') {
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let i = -H; i < W + H; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    } else if (d.specialBg === 'kryptonite') {
      /* Green crystalline effect - fixed pattern */
      ctx.save();
      const seed = hashStr(d.name || 'krypto');
      const rng = seededRng(seed);
      /* Crystal shapes */
      const crystals = [
        {x: W*0.15, y: H*0.2, s: 80}, {x: W*0.85, y: H*0.3, s: 70},
        {x: W*0.5, y: H*0.5, s: 90}, {x: W*0.2, y: H*0.7, s: 60},
        {x: W*0.75, y: H*0.75, s: 75}, {x: W*0.4, y: H*0.15, s: 50},
        {x: W*0.6, y: H*0.85, s: 55},
      ];
      crystals.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - c.s);
        ctx.lineTo(c.x + c.s * 0.6, c.y);
        ctx.lineTo(c.x, c.y + c.s);
        ctx.lineTo(c.x - c.s * 0.6, c.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0,255,65,0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,255,65,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      /* Lightning bolts */
      const bolts = [
        [{x:0.3,y:0}, {x:0.35,y:0.15}, {x:0.28,y:0.3}, {x:0.33,y:0.45}, {x:0.3,y:0.6}],
        [{x:0.7,y:0.2}, {x:0.65,y:0.35}, {x:0.72,y:0.5}, {x:0.68,y:0.65}, {x:0.7,y:0.8}],
      ];
      bolts.forEach(bolt => {
        ctx.beginPath();
        ctx.moveTo(bolt[0].x * W, bolt[0].y * H);
        for (let i = 1; i < bolt.length; i++) {
          ctx.lineTo(bolt[i].x * W, bolt[i].y * H);
        }
        ctx.strokeStyle = 'rgba(0,255,65,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(0,255,65,0.15)';
        ctx.lineWidth = 8;
        ctx.stroke();
      });
      /* Glow spots */
      const glows = [
        {x: W*0.2, y: H*0.25, r: 60}, {x: W*0.8, y: H*0.75, r: 50},
        {x: W*0.5, y: H*0.5, r: 80},
      ];
      glows.forEach(g => {
        const rg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        rg.addColorStop(0, 'rgba(0,255,65,0.2)');
        rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg;
        ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
      });
      ctx.restore();
    } else if (d.specialBg === 'ballondor') {
      /* Golden ballon d'or effect - fixed pattern */
      ctx.save();
      /* Golden radial glow */
      const rg = ctx.createRadialGradient(W/2, H*0.3, 0, W/2, H*0.3, W*0.6);
      rg.addColorStop(0, 'rgba(255,215,0,0.3)');
      rg.addColorStop(0.5, 'rgba(255,193,37,0.1)');
      rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
      /* Concentric rings */
      [0.18, 0.28, 0.38].forEach(pct => {
        ctx.beginPath();
        ctx.arc(W/2, H*0.3, W * pct, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,215,0,0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      /* Gold leaf lines */
      const leafLines = [
        [{x:0,y:0.4}, {x:1,y:0.42}], [{x:0,y:0.55}, {x:1,y:0.53}],
      ];
      leafLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line[0].x * W, line[0].y * H);
        ctx.lineTo(line[1].x * W, line[1].y * H);
        ctx.strokeStyle = 'rgba(255,215,0,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      /* Sparkle dots */
      const sparkles = [
        {x: W*0.25, y: H*0.2}, {x: W*0.75, y: H*0.35},
        {x: W*0.6, y: H*0.6}, {x: W*0.35, y: H*0.7},
        {x: W*0.85, y: H*0.55},
      ];
      sparkles.forEach(s => {
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 6);
        sg.addColorStop(0, 'rgba(255,215,0,0.6)');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.fillRect(s.x - 6, s.y - 6, 12, 12);
      });
      /* Golden ball icon */
      ctx.beginPath();
      ctx.arc(W/2, H*0.3, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,215,0,0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,215,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    } else if (d.specialBg === 'diamond') {
      /* Diamond/brilliant effect - fixed facets */
      ctx.save();
      /* Diamond facet lines */
      const facetLines = [
        [{x:0.3,y:0.2}, {x:0.5,y:0.4}], [{x:0.7,y:0.2}, {x:0.5,y:0.4}],
        [{x:0.3,y:0.8}, {x:0.5,y:0.6}], [{x:0.7,y:0.8}, {x:0.5,y:0.6}],
        [{x:0.2,y:0.5}, {x:0.8,y:0.5}],
      ];
      facetLines.forEach(line => {
        ctx.beginPath();
        ctx.moveTo(line[0].x * W, line[0].y * H);
        ctx.lineTo(line[1].x * W, line[1].y * H);
        ctx.strokeStyle = 'rgba(200,230,255,0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      /* Center facet glow */
      const cg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.35);
      cg.addColorStop(0, 'rgba(255,255,255,0.2)');
      cg.addColorStop(0.5, 'rgba(200,230,255,0.1)');
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
      /* Sparkle points */
      const sparklePts = [
        {x: W*0.3, y: H*0.25}, {x: W*0.7, y: H*0.25},
        {x: W*0.5, y: H*0.15}, {x: W*0.3, y: H*0.75},
        {x: W*0.7, y: H*0.75},
      ];
      sparklePts.forEach(s => {
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
        sg.addColorStop(0, 'rgba(255,255,255,0.7)');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.fillRect(s.x - 4, s.y - 4, 8, 8);
      });
      /* Diamond shapes */
      const diamonds = [
        {x: W*0.5, y: H*0.5, s: 100}, {x: W*0.3, y: H*0.3, s: 50},
        {x: W*0.7, y: H*0.7, s: 50},
      ];
      diamonds.forEach(d => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.s);
        ctx.lineTo(d.x + d.s * 0.7, d.y);
        ctx.lineTo(d.x, d.y + d.s);
        ctx.lineTo(d.x - d.s * 0.7, d.y);
        ctx.closePath();
        const dg = ctx.createLinearGradient(d.x - d.s, d.y - d.s, d.x + d.s, d.y + d.s);
        dg.addColorStop(0, 'rgba(200,230,255,0.1)');
        dg.addColorStop(0.5, 'rgba(255,255,255,0.15)');
        dg.addColorStop(1, 'rgba(200,230,255,0.1)');
        ctx.fillStyle = dg;
        ctx.fill();
      });
      ctx.restore();
    } else if (d.specialBg === 'molten') {
      /* Molten lava effect - fixed pattern */
      ctx.save();
      /* Lava cracks */
      const cracks = [
        [{x:0.15,y:0}, {x:0.18,y:0.15}, {x:0.12,y:0.3}, {x:0.16,y:0.45}, {x:0.14,y:0.6}, {x:0.15,y:1}],
        [{x:0.85,y:0}, {x:0.82,y:0.2}, {x:0.88,y:0.35}, {x:0.84,y:0.5}, {x:0.86,y:0.65}, {x:0.85,y:1}],
        [{x:0.5,y:0}, {x:0.48,y:0.25}, {x:0.52,y:0.5}, {x:0.49,y:0.75}, {x:0.5,y:1}],
      ];
      cracks.forEach(crack => {
        ctx.beginPath();
        ctx.moveTo(crack[0].x * W, crack[0].y * H);
        for (let i = 1; i < crack.length; i++) {
          ctx.lineTo(crack[i].x * W, crack[i].y * H);
        }
        ctx.strokeStyle = 'rgba(255,69,0,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,140,0,0.15)';
        ctx.lineWidth = 8;
        ctx.stroke();
      });
      /* Ember glow spots */
      const embers = [
        {x: W*0.15, y: H*0.2, r: 40}, {x: W*0.85, y: H*0.3, r: 35},
        {x: W*0.5, y: H*0.5, r: 50}, {x: W*0.25, y: H*0.8, r: 35},
        {x: W*0.75, y: H*0.7, r: 40}, {x: W*0.4, y: H*0.35, r: 25},
        {x: W*0.65, y: H*0.85, r: 30},
      ];
      embers.forEach(e => {
        const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
        eg.addColorStop(0, 'rgba(255,69,0,0.3)');
        eg.addColorStop(0.5, 'rgba(255,140,0,0.15)');
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.fillRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
      });
      /* Base heat glow */
      const hg = ctx.createRadialGradient(W/2, H*0.6, 0, W/2, H*0.6, W*0.6);
      hg.addColorStop(0, 'rgba(255,69,0,0.1)');
      hg.addColorStop(1, 'transparent');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else if (d.specialBg === 'holographic') {
      const hg = ctx.createLinearGradient(0, 0, W, H);
      hg.addColorStop(0, 'rgba(255,0,255,0.1)');
      hg.addColorStop(0.33, 'rgba(0,255,255,0.1)');
      hg.addColorStop(0.66, 'rgba(255,255,0,0.1)');
      hg.addColorStop(1, 'rgba(0,255,0,0.1)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, W, H);
    }

    /* Border */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    roundRect(ctx, 3, 3, W - 6, H - 6, r - 3);
    ctx.stroke();

    /* Inner border */
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, 12, 12, W - 24, H - 24, r - 8);
    ctx.stroke();

    /* Vertical badge for special cards */
    if (d.specialBg === 'ballondor') {
      drawVerticalBadge(ctx, W, H, 'Ballon d\'Or', '#ffd700', 'rgba(0,0,0,0.6)', 'rgba(255,215,0,0.5)');
    } else if (d.specialBg === 'kryptonite') {
      drawVerticalBadge(ctx, W, H, 'Kryptonite', '#00ff41', 'rgba(0,20,0,0.6)', 'rgba(0,255,65,0.5)');
    } else if (d.specialBg === 'diamond') {
      drawVerticalBadge(ctx, W, H, 'Diamond', '#b9f2ff', 'rgba(0,15,20,0.6)', 'rgba(185,242,255,0.5)');
    } else if (d.specialBg === 'molten') {
      drawVerticalBadge(ctx, W, H, 'Molten', '#ff6600', 'rgba(30,5,0,0.6)', 'rgba(255,102,0,0.5)');
    } else if (d.specialBg === 'galaxy') {
      drawVerticalBadge(ctx, W, H, 'Galaxy', '#c77dff', 'rgba(10,0,20,0.6)', 'rgba(199,125,255,0.5)');
    } else if (d.cardType === 'legend') {
      drawVerticalBadge(ctx, W, H, 'Legend', '#ff4444', 'rgba(30,0,0,0.6)', 'rgba(255,68,68,0.5)');
    } else if (d.cardType === 'special') {
      drawVerticalBadge(ctx, W, H, 'Special', '#da77f2', 'rgba(20,0,30,0.6)', 'rgba(218,119,242,0.5)');
    }

    /* Rating */
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 80px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(calcOverallFor(d), 30, 90);

    ctx.fillStyle = '#8888aa';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.fillText('OVR', 30, 115);

    /* Position */
    ctx.fillStyle = accent;
    ctx.font = 'bold 30px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(d.position, W - 30, 70);

    /* Number */
    if (d.number) {
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 50px -apple-system, sans-serif';
      ctx.fillText(d.number, W - 30, 120);
    }

    /* Photo area - drawn async via returned promise */
    /* Handled by drawPhotoAsync below */

    /* Name */
    ctx.fillStyle = '#e8e8e8';
    ctx.font = 'bold 34px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((d.name || 'NOMBRE').toUpperCase(), W / 2, H * 0.56);

    /* Team */
    ctx.fillStyle = '#8888aa';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillText(d.team || 'EQUIPO', W / 2, H * 0.56 + 30);

    /* Stats - DEF, CON, ATA */
    const statStartY = H * 0.64;
    const statRowH = 40;
    STAT_KEYS.forEach((k, i) => {
      const val = d.stats[k] || 0;
      const y = statStartY + i * statRowH;
      const clr = STAT_CLR[k];

      ctx.fillStyle = clr;
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(STAT_LBL[k], 30, y + 18);

      /* Bar */
      const barX = 100, barW = 220, barH = 12;
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, barX, y + 6, barW, barH, 6);
      ctx.fill();

      ctx.fillStyle = clr;
      roundRect(ctx, barX, y + 6, barW * (val / STAT_MAX), barH, 6);
      ctx.fill();

      /* Value */
      ctx.fillStyle = '#e8e8e8';
      ctx.font = 'bold 18px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, barX + barW + 40, y + 19);
    });

    /* Skills */
    const skillY = statStartY + 3 * statRowH + 10;
    const skillKeys = ['speed','control','strength'];
    const skillLabels = ['Vel','Ctrl','Fur'];
    const skillW = W / 3;
    skillKeys.forEach((k, i) => {
      const cx = skillW * i + skillW / 2;
      ctx.fillStyle = '#8888aa';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(skillLabels[i], cx, skillY + 10);
      ctx.fillStyle = accent;
      ctx.font = '16px -apple-system, sans-serif';
      ctx.fillText(stars(d.skills[k]), cx, skillY + 32);
    });

    /* Footer */
    ctx.fillStyle = '#8888aa';
    ctx.font = 'bold 14px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(d.league, 30, H - 30);

    if (d.country) {
      ctx.textAlign = 'center';
      ctx.fillText(d.country, W / 2, H - 30);
    }
  }

  /* Async photo drawing for canvas (handles URL images) */
  function drawPhotoOnCanvas(canvas, data) {
    const d = data;
    if (!d.photoDataUrl) return Promise.resolve();

    return new Promise(resolve => {
      const img = new Image();
      img.onload = function () {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const py = 160, ph = H * 0.38;
        const ratio = img.naturalWidth / img.naturalHeight;
        let pw = ph * ratio;
        if (pw > W - 60) { pw = W - 60; ph = pw / ratio; }
        const px = (W - pw) / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        ctx.drawImage(img, px, py, pw, ph);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve(); /* Skip on error */
      img.src = d.photoDataUrl;
    });
  }

  function drawPattern(ctx, type, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.03;
    if (type === 'hexagon') {
      for (let x = 0; x < W; x += 18) {
        for (let y = 0; y < H; y += 18) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }
    } else if (type === 'lines') {
      for (let i = -H; i < W + H; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (type === 'dots') {
      for (let x = 5; x < W; x += 10) {
        for (let y = 5; y < H; y += 10) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
      }
    } else if (type === 'cross') {
      for (let x = 0; x < W; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
        ctx.moveTo(0, x); ctx.lineTo(W, x);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCardBackToCanvas(canvas, data) {
    const ctx = canvas.getContext('2d');
    const W = EXPORT_W;
    const H = EXPORT_H;
    canvas.width = W;
    canvas.height = H;

    const d = data;
    const accent = d.accentColor || (TYPE_THEMES[d.cardType] || TYPE_THEMES.gold).accent;
    const clr = d.backColor || '#0d1b3e';
    const r = 24;

    /* Background */
    ctx.fillStyle = clr;
    roundRect(ctx, 0, 0, W, H, r);
    ctx.fill();

    /* Border */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    roundRect(ctx, 3, 3, W - 6, H - 6, r - 3);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    roundRect(ctx, 14, 14, W - 28, H - 28, r - 8);
    ctx.stroke();

    /* Inner diamond pattern */
    const cx = W / 2, cy = H / 2 - 30;
    const dw = W * 0.45, dh = H * 0.35;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    roundRect(ctx, -dw/2, -dh/2, dw, dh, 12);
    ctx.stroke();
    ctx.restore();

    /* Logo text */
    ctx.fillStyle = accent;
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText((d.backLogo || 'ADRENALYN XL').toUpperCase(), cx, H * 0.28);

    /* Glow effect on logo */
    ctx.shadowColor = accent;
    ctx.shadowBlur = 30;
    ctx.fillText((d.backLogo || 'ADRENALYN XL').toUpperCase(), cx, H * 0.28);
    ctx.shadowBlur = 0;

    /* Custom text */
    if (d.backText) {
      ctx.fillStyle = '#8888aa';
      ctx.font = '16px -apple-system, sans-serif';
      const lines = d.backText.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, cx, H * 0.55 + i * 24);
      });
    }

    /* Bottom */
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(`PANINI © ${new Date().getFullYear()}`, cx, H - 30);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* Export buttons */
  function exportCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('Imagen exportada ✓');
  }

  const expCanvas = $('#export-canvas');

  $('#btn-export-front').addEventListener('click', () => {
    drawCardToCanvas(expCanvas, S);
    drawPhotoOnCanvas(expCanvas, S).then(() => {
      exportCanvas(expCanvas, `axl_${S.name || 'card'}_front.png`);
    });
  });

  $('#btn-export-back').addEventListener('click', () => {
    drawCardBackToCanvas(expCanvas, S);
    exportCanvas(expCanvas, `axl_${S.name || 'card'}_back.png`);
  });

  $('#btn-export-both').addEventListener('click', () => {
    const W = EXPORT_W * 2 + 40;
    const H = EXPORT_H;

    const fc = document.createElement('canvas');
    drawCardToCanvas(fc, S);
    drawPhotoOnCanvas(fc, S).then(() => {
      const bc = document.createElement('canvas');
      drawCardBackToCanvas(bc, S);

      const combined = document.createElement('canvas');
      combined.width = W;
      combined.height = H;
      const cctx = combined.getContext('2d');
      cctx.fillStyle = '#111';
      cctx.fillRect(0, 0, W, H);
      cctx.drawImage(fc, 20, 0);
      cctx.drawImage(bc, EXPORT_W + 40, 0);

      const link = document.createElement('a');
      link.download = `axl_${S.name || 'card'}_both.png`;
      link.href = combined.toDataURL('image/png');
      link.click();
      toast('Ambas caras exportadas ✓');
    });
  });

  /* ===== DETAIL MODAL ===== */
  let detailCardId = null;

  window.openDetail = function (id) {
    const album = getAlbum();
    const card = album.find(c => c.id === id);
    if (!card) return;
    detailCardId = id;

    buildCardFront($('#detail-card-front'), card);
    buildCardBack($('#detail-card-back'), card);

    const theme = TYPE_THEMES[card.cardType] || TYPE_THEMES.gold;
    const ovr = calcOverallFor(card);
    const catStatsHTML = STAT_KEYS.map(k => {
      const val = card.stats[k] || 0;
      return `
        <div class="detail-cat-block">
          <div class="detail-cat-header" style="color:${STAT_CLR[k]}">${STAT_LBL[k]}: ${val}</div>
        </div>`;
    }).join('');
    $('#detail-info').innerHTML = `
      <h2>${card.name || 'Sin nombre'} ${card.number ? '#' + card.number : ''}</h2>
      <div class="detail-team">${card.team || ''} · ${card.league} ${card.country ? '· ' + card.country : ''}</div>
      <div class="detail-overall" style="color:#f1c40f">OVR: ${ovr}</div>
      <div class="detail-stats-row">${catStatsHTML}</div>`;

    $('#detail-modal').classList.remove('hidden');
  };

  function closeDetail() {
    $('#detail-modal').classList.add('hidden');
    detailCardId = null;
  }

  $('#detail-close').addEventListener('click', closeDetail);
  $('#detail-overlay').addEventListener('click', closeDetail);

  /* Detail flip */
  const detail3d = $('#detail-card-3d');
  detail3d.addEventListener('click', () => detail3d.classList.toggle('flipped'));

  /* Detail actions */
  $('#detail-edit').addEventListener('click', e => {
    e.stopPropagation();
    const album = getAlbum();
    const card = album.find(c => c.id === detailCardId);
    if (!card) return;
    /* Load card data into editor */
    Object.assign(S, {
      name: card.name, number: card.number, position: card.position,
      team: card.team, league: card.league, country: card.country,
      stats: { ...card.stats },
      skills: { ...card.skills },
      cardType: card.cardType,
      specialBg: card.specialBg || 'default',
      pattern: card.pattern || 'none',
      bgColor: card.bgColor || '#1a1a2e',
      accentColor: card.accentColor || '#e8b931',
      photoDataUrl: card.photoDataUrl,
      backStyle: card.backStyle || 'classic',
      backColor: card.backColor || '#0d1b3e',
      backLogo: card.backLogo || 'ADRENALYN XL',
      backText: card.backText || '',
      backLogoImg: card.backLogoImg || '',
    });
    syncForm();
    renderCard();
    closeDetail();

    /* Switch to editor */
    $$('.nav-tab').forEach(t => t.classList.remove('active'));
    $$('.view').forEach(v => v.classList.remove('active'));
    $('.nav-tab[data-view="editor"]').classList.add('active');
    $('#view-editor').classList.add('active');

    /* Remove from album (will be re-saved) */
    const idx = album.findIndex(c => c.id === detailCardId);
    if (idx >= 0) album.splice(idx, 1);
    localStorage.setItem('axl_album', JSON.stringify(album));
    updateAlbumCount();
    toast('Cróm cargado en el editor');
  });

  $('#detail-export').addEventListener('click', e => {
    e.stopPropagation();
    const album = getAlbum();
    const card = album.find(c => c.id === detailCardId);
    if (!card) return;
    drawCardToCanvas(expCanvas, card);
    exportCanvas(expCanvas, `axl_${card.name || 'card'}_front.png`);
  });

  $('#detail-delete').addEventListener('click', e => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este cróm del álbum?')) return;
    let album = getAlbum();
    album = album.filter(c => c.id !== detailCardId);
    localStorage.setItem('axl_album', JSON.stringify(album));
    updateAlbumCount();
    closeDetail();
    renderAlbum();
    toast('Cróm eliminado');
  });

  /* ===== SYNC FORM ===== */
  function syncForm() {
    $('#input-name').value = S.name;
    $('#input-number').value = S.number;
    $('#input-position').value = S.position;
    $('#input-team').value = S.team;
    $('#input-league').value = S.league;
    $('#input-country').value = S.country;

    STAT_KEYS.forEach(k => {
      const inp = $(`#input-stat-${k}`);
      const val = $(`#val-stat-${k}`);
      if (inp) inp.value = S.stats[k] || 0;
      if (val) val.textContent = S.stats[k] || 0;
    });
    $('#overall-val').textContent = calcOverall();

    ['speed','control','strength'].forEach(k => {
      $(`#input-skill-${k}`).value = S.skills[k];
      $(`#skill-${k}`).textContent = stars(S.skills[k]);
    });

    $$('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === S.cardType));
    $$('.bg-btn').forEach(b => b.classList.toggle('active', b.dataset.bg === S.specialBg));
    $$('.back-btn').forEach(b => b.classList.toggle('active', b.dataset.back === S.backStyle));

    $('#input-pattern').value = S.pattern;
    $('#input-bgcolor').value = S.bgColor;
    $('#input-accent').value = S.accentColor;
    $('#input-back-color').value = S.backColor;
    $('#input-back-logo').value = S.backLogo;
    $('#input-back-text').value = S.backText;
    $('#input-back-logoimg').value = S.backLogoImg;

    if (S.photoDataUrl) {
      $('#photo-label').textContent = 'Foto cargada';
      $('#btn-remove-photo').style.display = '';
    } else {
      $('#photo-label').textContent = 'Sin foto';
      $('#btn-remove-photo').style.display = 'none';
    }
  }

  /* ===== SAVE / CLEAR ===== */
  $('#btn-save-album').addEventListener('click', saveToAlbum);

  $('#btn-clear').addEventListener('click', () => {
    if (!confirm('¿Limpiar todos los campos?')) return;
    S.photoDataUrl = null;
    S.name = ''; S.number = ''; S.position = 'MED';
    S.team = ''; S.league = 'LaLiga'; S.country = '';
    S.stats = {
      def: 50, con: 60, ata: 55,
    };
    S.skills = { speed:3, control:4, strength:2 };
    S.cardType = 'gold';
    S.specialBg = 'default';
    S.pattern = 'none';
    S.bgColor = '#1a1a2e';
    S.accentColor = '#e8b931';
    S.backStyle = 'classic';
    S.backColor = '#0d1b3e';
    S.backLogo = 'ADRENALYN XL';
    S.backText = '';
    S.backLogoImg = '';
    syncForm();
    renderCard();
    toast('Editor limpiado');
  });

  /* ===== SERVICE WORKER ===== */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./js/service-worker.js')
        .catch(err => console.log('SW error:', err));
    });
  }

  /* ===== KEYBOARD SHORTCUTS ===== */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveToAlbum();
    }
  });

  /* ===== VERSION / DEPLOY INFO ===== */
  $('#app-version').textContent = `v${VERSION}`;
  fetch('deploy-info.json')
    .then(r => r.json())
    .then(d => { $('#app-deploy').textContent = new Date(d.deployedAt).toLocaleString('es-ES'); })
    .catch(() => { $('#app-deploy').textContent = 'local'; });

  /* ===== INIT ===== */
  renderCard();
  updateAlbumCount();
})();
