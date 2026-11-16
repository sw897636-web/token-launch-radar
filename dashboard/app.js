// Token Launch Radar's dashboard. It reads window.RADAR (written beside dashboard/ by
// main.ts) and renders the ranked board, a filterable table, a per-protocol detail view
// with the model's own factors and the protocol's farm plan, and the Already trading
// view. No network: every byte it shows is in data.js.

// The farm plan, as top-level functions so the build test can call them directly.
// They are the page's copy of the derivation in lib/model.ts, kept identical by test.
// Row tuple: [rank, slug, name, category, chains, tvl, chg7d, age, implied, growthMul, maturityMul, chainMul, watchlist]
function chainOf(p) { return p.chains && p.chains.length > 0 ? p.chains[0] : 'its main chain'; }
function capitalFor(p) {
  if (p.tvl_usd >= 5e9) return 250;
  if (p.tvl_usd >= 1e9) return 150;
  if (p.tvl_usd >= 1e8) return 100;
  return 50;
}
function holdDaysFor(age) {
  if (age === null || age === undefined) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}
function actionFor(p, capital, chain) {
  var c = (p.category || '').toLowerCase();
  var name = p.name;
  if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'Lend $' + capital + ' of USDC on ' + name + ' (' + chain + ') through its supply market and leave the deposit earning.';
  if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('liquidity') >= 0) return 'Add $' + capital + ' of liquidity to ' + name + "'s deepest pool on " + chain + ' and keep the LP position in range.';
  if (c.indexOf('bridge') >= 0) return 'Bridge $' + capital + ' of USDC into ' + chain + ' with ' + name + ', then put the bridged funds to work inside its app.';
  if (c.indexOf('stak') >= 0 || c.indexOf('restak') >= 0) return 'Stake $' + capital + ' of the native staking asset through ' + name + ' and hold the receipt token.';
  if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'Post $' + capital + ' of USDC as collateral on ' + name + ' and open one small hedged position.';
  if (c.indexOf('prediction') >= 0) return 'Fund your ' + name + ' account with $' + capital + ' and take one position in an open market.';
  if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('vault') >= 0 || c.indexOf('manager') >= 0) return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and hold the vault shares.';
  if (c.indexOf('stable') >= 0) return 'Mint or hold $' + capital + ' of the stable asset through ' + name + ' on ' + chain + '.';
  if (c.indexOf('rwa') >= 0) return 'Buy $' + capital + ' of ' + name + "'s yield-bearing asset on " + chain + ' and hold it to maturity.';
  if (c.indexOf('insurance') >= 0) return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy active.';
  if (c.indexOf('basis') >= 0) return 'Deposit $' + capital + ' of USDC into ' + name + "'s basis vault on " + chain + ' and let the hedge run.';
  return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position active.';
}
function weeklyFor(p) {
  var c = (p.category || '').toLowerCase();
  if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'top up the supply a little or repay a small borrow';
  if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0 || c.indexOf('leveraged farm') >= 0 || c.indexOf('liquidity') >= 0) return 'swap a small amount through the pool or adjust the range';
  if (c.indexOf('bridge') >= 0) return 'bridge a small amount and use it in the app';
  if (c.indexOf('stak') >= 0 || c.indexOf('restak') >= 0) return 'restake the rewards or add a little more stake';
  if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('options') >= 0) return 'close and reopen the hedge with a small size';
  if (c.indexOf('prediction') >= 0) return 'settle one market and open another small one';
  if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('vault') >= 0 || c.indexOf('manager') >= 0) return 'check the vault and add a small deposit';
  if (c.indexOf('stable') >= 0) return 'mint a little more or move some between pools';
  if (c.indexOf('rwa') >= 0) return 'check the yield accrual and reinvest a small amount';
  if (c.indexOf('insurance') >= 0) return 'check the policy and renew the cover if it lapses';
  return 'make one small deposit, swap or vote';
}
function stepText(step) {
  var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
  if (s.length > 600) s = s.slice(0, 596) + '...';
  if (s.length < 20) s = s + ' Hold the position and check the protocol\'s own page.';
  return s;
}
function farmSteps(p) {
  var chain = chainOf(p);
  var capital = capitalFor(p);
  var hold = holdDaysFor(p.age_days);
  var action = actionFor(p, capital, chain);
  var weekly = weeklyFor(p);
  var gas = capital >= 150 ? 8 : 4;
  return [
    { text: 'Read ' + p.name + '\'s own docs and points page first, so you know exactly which actions it tracks before you spend anything.', cost: 'nothing to read', time: '20 minutes' },
    { text: action, cost: '$' + capital + ' of capital and about $' + gas + ' of gas on ' + chain, time: '15 minutes to set up' },
    { text: 'Do one qualifying action each week: ' + weekly + '.', cost: 'about $2 of gas a week', time: '10 minutes a week' },
    { text: 'Hold the position for at least ' + hold + ' days, so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
    { text: 'Check ' + p.name + '\'s points or rewards page every week, and claim only from the link it publishes.', cost: 'nothing to check, and never pay to claim', time: '5 minutes a week' },
    { text: 'Write the wallet, the dates and every transaction in a farm log, then unwind the position in stages when you exit.', cost: 'about $' + gas + ' of gas to exit', time: '15 minutes to unwind' }
  ].map(stepText);
}

(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var MODEL = DATA.model;
  var ROWS = DATA.rows;
  var LIVE = DATA.live;

  var usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd0.format(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(days)) + 'd';
  }
  function fmtMult(n) { return '\u00d7' + n.toFixed(3); }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  function rowObj(r) {
    return { name: r[2], category: r[3], chains: r[4], tvl_usd: r[5], age_days: r[7] };
  }
  function clampGrowth(chg) {
    var g = chg === null || chg === undefined ? 0 : chg;
    return Math.min(MODEL.growth_cap, Math.max(MODEL.growth_floor, g));
  }

  var state = { q: '', category: 'all', chain: 'all', tvl: 'all', sort: 'implied', wl: false, tab: 'board', selected: null };
  var boardEl = document.getElementById('board');
  var detailEl = document.getElementById('detail');
  var liveEl = document.getElementById('live');
  var countEl = document.getElementById('count');
  var qEl = document.getElementById('q');
  var catEl = document.getElementById('cat');
  var chainEl = document.getElementById('chain');
  var tvlEl = document.getElementById('tvl');
  var sortEl = document.getElementById('sort');
  var wlEl = document.getElementById('wl');

  function readHash() {
    var h = (window.location.hash || '').replace(/^#/, '');
    if (!h) return;
    h.split('&').forEach(function (part) {
      var kv = part.split('=');
      var k = decodeURIComponent(kv[0] || '');
      var v = decodeURIComponent(kv[1] || '');
      if (k === 'q') state.q = v;
      else if (k === 'cat') state.category = v;
      else if (k === 'chain') state.chain = v;
      else if (k === 'tvl') state.tvl = v;
      else if (k === 'sort') state.sort = v;
      else if (k === 'wl') state.wl = v === '1';
      else if (k === 'tab') state.tab = v === 'live' ? 'live' : 'board';
      else if (k === 'detail') {
        var found = null;
        ROWS.forEach(function (r) { if (r[1] === v) found = r; });
        state.selected = found;
      }
    });
  }
  function writeHash() {
    var parts = [];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.category !== 'all') parts.push('cat=' + encodeURIComponent(state.category));
    if (state.chain !== 'all') parts.push('chain=' + encodeURIComponent(state.chain));
    if (state.tvl !== 'all') parts.push('tvl=' + state.tvl);
    if (state.sort !== 'implied') parts.push('sort=' + state.sort);
    if (state.wl) parts.push('wl=1');
    if (state.tab === 'live') parts.push('tab=live');
    if (state.selected) parts.push('detail=' + encodeURIComponent(state.selected[1]));
    var h = parts.length ? '#' + parts.join('&') : '';
    if (window.location.hash !== h) window.history.replaceState(null, '', h || window.location.pathname + window.location.search);
  }

  function filtered() {
    var q = state.q.trim().toLowerCase();
    var rows = ROWS.filter(function (r) {
      if (state.wl && r[12] !== 1) return false;
      if (state.category !== 'all' && (r[3] || 'Uncategorized') !== state.category) return false;
      if (state.chain !== 'all' && r[4].indexOf(state.chain) < 0) return false;
      if (state.tvl === 'b1' && r[5] < 1e9) return false;
      if (state.tvl === 'm100' && (r[5] < 1e8 || r[5] >= 1e9)) return false;
      if (state.tvl === 'm10' && (r[5] < 1e7 || r[5] >= 1e8)) return false;
      if (state.tvl === 'u10' && r[5] >= 1e7) return false;
      if (q && r[2].toLowerCase().indexOf(q) < 0 && r[1].toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) {
      var av, bv;
      if (state.sort === 'tvl') { av = a[5]; bv = b[5]; }
      else if (state.sort === 'chg') { av = a[6] === null ? -Infinity : a[6]; bv = b[6] === null ? -Infinity : b[6]; }
      else if (state.sort === 'age') { av = a[7] === null ? -Infinity : a[7]; bv = b[7] === null ? -Infinity : b[7]; }
      else { av = a[8]; bv = b[8]; }
      if (bv !== av) return bv - av;
      return a[0] - b[0];
    });
    return rows;
  }

  function renderStats() {
    var stats = document.getElementById('stats');
    var items = [
      ['Board', DATA.board_size + ' protocols'],
      ['Watchlist', DATA.watchlist_size + ' covered'],
      ['Early finds', DATA.early_size + ' below the floor'],
      ['Already trading', DATA.live_size + ' set aside'],
      ['Snapshot', DATA.as_of]
    ];
    items.forEach(function (it) {
      stats.appendChild(el('div', {}, el('dt', { text: it[0] }), el('dd', { text: it[1] })));
    });
    document.getElementById('src').textContent = 'Snapshot: DefiLlama protocols, fetched ' + DATA.as_of + '. Model ' + DATA.model_version + ': TVL \u00d7 ' + MODEL.base_multiple + ', growth weight ' + MODEL.growth_weight + ', maturity ' + MODEL.maturity_floor + '–' + (MODEL.maturity_floor + MODEL.maturity_range) + ' over ' + MODEL.maturity_days + ' days, chain step ' + MODEL.chain_step + ' (max ' + MODEL.chain_cap + ').';
  }

  function renderFilters() {
    var cats = {};
    var chains = {};
    ROWS.forEach(function (r) {
      cats[r[3] || 'Uncategorized'] = true;
      r[4].forEach(function (c) { chains[c] = true; });
    });
    Object.keys(cats).sort().forEach(function (c) { catEl.appendChild(el('option', { value: c, text: c })); });
    Object.keys(chains).sort().forEach(function (c) { chainEl.appendChild(el('option', { value: c, text: c })); });
    qEl.value = state.q;
    catEl.value = state.category;
    chainEl.value = state.chain;
    tvlEl.value = state.tvl;
    sortEl.value = state.sort;
    wlEl.checked = state.wl;
  }

  function renderBoard() {
    var rows = filtered();
    countEl.textContent = 'Showing ' + rows.length + ' of ' + ROWS.length + ' protocols';
    boardEl.innerHTML = '';
    if (rows.length === 0) {
      boardEl.appendChild(el('p', { class: 'empty', text: 'No protocol matches these filters.' }));
      return;
    }
    var head = el('thead', {}, el('tr', {},
      el('th', { text: 'Rank' }),
      el('th', { text: 'Protocol' }),
      el('th', { text: 'Category' }),
      el('th', { text: 'Chains' }),
      el('th', { class: 'num sortable', text: 'TVL', 'data-sort': 'tvl' }),
      el('th', { class: 'num sortable', text: '7d', 'data-sort': 'chg' }),
      el('th', { class: 'num sortable', text: 'Age', 'data-sort': 'age' }),
      el('th', { class: 'num sortable', text: 'Implied value', 'data-sort': 'implied' })));
    var body = el('tbody', {});
    rows.forEach(function (r) {
      var chg = el('td', { class: 'num ' + (r[6] === null ? 'muted' : r[6] >= 0 ? 'up' : 'down'), text: fmtPct(r[6]) });
      var tr = el('tr', { 'data-slug': r[1], class: state.selected && state.selected[1] === r[1] ? 'sel' : null, onclick: function () { select(r); } },
        el('td', { class: 'rank', text: '#' + r[0] }),
        el('td', {}, el('div', { class: 'name', text: r[2] }), el('div', { class: 'slug', text: r[1] + (r[12] === 1 ? ' · watchlist' : '') })),
        el('td', { class: 'cat', text: r[3] || 'Uncategorized' }),
        el('td', { class: 'chain', text: r[4].slice(0, 3).join(', ') + (r[4].length > 3 ? ' +' + (r[4].length - 3) : '') }),
        el('td', { class: 'num', text: fmtUsd(r[5]) }),
        chg,
        el('td', { class: 'num muted', text: fmtAge(r[7]) }),
        el('td', { class: 'num iv', text: fmtUsd(r[8]) }));
      body.appendChild(tr);
    });
    var table = el('table', {}, head, body);
    table.querySelectorAll('th.sortable').forEach(function (th) {
      th.addEventListener('click', function () {
        state.sort = th.getAttribute('data-sort');
        sortEl.value = state.sort;
        render();
      });
    });
    boardEl.appendChild(table);
  }

  function renderDetail() {
    var r = state.selected;
    detailEl.innerHTML = '';
    if (!r) { detailEl.hidden = true; return; }
    detailEl.hidden = false;
    var base = r[5] * MODEL.base_multiple;
    var growthPct = clampGrowth(r[6]);
    var factors = el('ul', { class: 'factors' },
      el('li', {}, el('span', { class: 'k', text: 'Base · TVL × ' + MODEL.base_multiple }), el('span', { class: 'v', text: fmtUsd(base) })),
      el('li', {}, el('span', { class: 'k', text: 'Growth · 7d ' + fmtPct(growthPct) }), el('span', { class: 'v', text: fmtMult(r[9]) })),
      el('li', {}, el('span', { class: 'k', text: 'Maturity · ' + fmtAge(r[7]) + ' old' }), el('span', { class: 'v', text: fmtMult(r[10]) })),
      el('li', {}, el('span', { class: 'k', text: 'Chains · ' + r[4].length + ' chain' + (r[4].length === 1 ? '' : 's') }), el('span', { class: 'v', text: fmtMult(r[11]) })),
      el('li', {}, el('span', { class: 'k', text: 'Implied value' }), el('span', { class: 'v big', text: fmtUsd(r[8]) })));
    var steps = el('ol', { class: 'steps' });
    farmSteps(rowObj(r)).forEach(function (s) { steps.appendChild(el('li', { text: s })); });
    var head = el('div', {},
      el('h2', { text: '#' + r[0] + ' ' + r[2] }),
      el('p', { class: 'sub', text: (r[3] || 'Uncategorized') + ' · ' + r[4].join(', ') + ' · TVL ' + fmtUsd(r[5]) + ' · 7d ' + fmtPct(r[6]) + ' · running ' + fmtAge(r[7]) + ' with no token recorded' }));
    var close = el('button', { type: 'button', text: 'Close detail', onclick: function () { state.selected = null; render(); } });
    close.style.cssText = 'float:right;background:var(--surface-2);border:1px solid var(--border);color:var(--muted);border-radius:7px;padding:6px 12px;';
    var box = el('div', { class: 'detail' }, close, head, factors, el('h3', { text: 'Farm plan' }), steps,
      el('p', { class: 'note', text: 'This protocol records no token in the snapshot. That is the record, not proof it has none. The plan is a starting point: check the protocol\'s own pages before you move funds.' }));
    detailEl.appendChild(box);
  }

  function renderLive() {
    liveEl.innerHTML = '';
    if (state.tab !== 'live') { liveEl.hidden = true; return; }
    liveEl.hidden = false;
    var head = el('thead', {}, el('tr', {},
      el('th', { text: 'Protocol' }),
      el('th', { text: 'Category' }),
      el('th', { text: 'Chains' }),
      el('th', { class: 'num', text: 'TVL' }),
      el('th', { class: 'num', text: 'Market cap' }),
      el('th', { class: 'num', text: '7d' })));
    var body = el('tbody', {});
    LIVE.forEach(function (l) {
      body.appendChild(el('tr', {},
        el('td', {}, el('div', { class: 'name', text: l[1] }), el('div', { class: 'slug', text: l[0] })),
        el('td', { class: 'cat', text: l[2] || 'Uncategorized' }),
        el('td', { class: 'chain', text: l[3].slice(0, 3).join(', ') + (l[3].length > 3 ? ' +' + (l[3].length - 3) : '') }),
        el('td', { class: 'num', text: fmtUsd(l[4]) }),
        el('td', { class: 'num iv', text: fmtUsd(l[5]) }),
        el('td', { class: 'num ' + (l[6] === null ? 'muted' : l[6] >= 0 ? 'up' : 'down'), text: fmtPct(l[6]) })));
    });
    liveEl.appendChild(el('p', { class: 'note', text: 'These tokens already trade. Their market caps are the market\'s own values, not the model\'s: they are set aside here so the ranked board holds only launches still to come.' }));
    liveEl.appendChild(el('table', {}, head, body));
  }

  function select(r) {
    state.selected = r;
    render();
    if (detailEl && !detailEl.hidden) detailEl.scrollIntoView({ block: 'nearest' });
  }

  function render() {
    var tabs = document.getElementById('tabs');
    tabs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === state.tab); });
    document.getElementById('filters').style.display = state.tab === 'live' ? 'none' : 'flex';
    boardEl.style.display = state.tab === 'live' ? 'none' : 'block';
    if (state.tab === 'board') { renderBoard(); renderDetail(); renderLive(); }
    else { renderLive(); renderDetail(); }
    writeHash();
  }

  function bind() {
    document.getElementById('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tab]');
      if (!b) return;
      state.tab = b.getAttribute('data-tab');
      render();
    });
    qEl.addEventListener('input', function () { state.q = qEl.value; renderBoard(); writeHash(); });
    catEl.addEventListener('change', function () { state.category = catEl.value; render(); });
    chainEl.addEventListener('change', function () { state.chain = chainEl.value; render(); });
    tvlEl.addEventListener('change', function () { state.tvl = tvlEl.value; render(); });
    sortEl.addEventListener('change', function () { state.sort = sortEl.value; render(); });
    wlEl.addEventListener('change', function () { state.wl = wlEl.checked; render(); });
  }

  readHash();
  renderStats();
  renderFilters();
  bind();
  render();
  if (state.selected && detailEl && !detailEl.hidden) detailEl.scrollIntoView({ block: 'start' });
})();
