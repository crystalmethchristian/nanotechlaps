/* NanoTech Laps configurator
   Live order summary + mailto: quote request. No backend, no frameworks.

   Hosted sizes: the <select> options in configurator.html carry inch values as
   their option value ("1", "2.5", ... "12") plus a final "custom" option.
   The inch/mm toggle rewrites the option LABELS (mm = inch * 25.4, rounded to
   1 decimal); the underlying values stay inches, so the summary and mailto body
   are unit-independent. Selecting "custom" reveals the custom-size notice and
   the quote goes out by email with every other spec plus the Notes field —
   custom sizes (1.5", 11", anything not hosted) are made to order, quoted by
   direct email only.

   URL presets (read once on load; unknown/missing values fall back silently to
   the form defaults):
     ?shape=round|square|rectangle
     ?size=6                round diameter (any hosted inch value, or "custom")
     ?length=8              rectangle length / square side
     ?width=6               rectangle width
     ?thickness=3/8         1/4 | 3/8 | 1/2 | 3/4 | 1
     ?glass=frosted|clear
     ?grit=600              320 | 400 | 600 | 800 | 1000
     ?paste=kit|tin|syringe|multipack|none   (kit = Finishing Ladder Kit,
                            1000 + 1500 + 2000 + 4000, 4 syringes; adds paste
                            and sets the product select via its data-key)
     ?paste_grit=1000       any grit in the paste-grit select
     Example: configurator.html?shape=round&size=6&thickness=3/8&glass=frosted&grit=600&paste=kit
*/
(function () {
  'use strict';

  var CONTACT_EMAIL = 'Zuppo1976@yahoo.com';
  var MM_PER_IN = 25.4;

  var form = document.getElementById('config-form');
  if (!form) return;

  var els = {
    unitIn: document.getElementById('unit-in'),
    unitMm: document.getElementById('unit-mm'),
    diameter: document.getElementById('diameter'),
    length: document.getElementById('length'),
    width: document.getElementById('width'),
    fieldDia: document.getElementById('field-dia'),
    fieldLen: document.getElementById('field-length'),
    fieldWid: document.getElementById('field-width'),
    customNotice: document.getElementById('custom-notice'),
    thickness: document.getElementById('thickness'),
    grit: document.getElementById('grit'),
    fieldGrit: document.getElementById('field-grit'),
    qty: document.getElementById('qty'),
    wantPaste: document.getElementById('want-paste'),
    pasteOptions: document.getElementById('paste-options'),
    pasteLines: document.getElementById('paste-lines'),
    addPasteLineBtn: document.getElementById('add-paste-line'),
    pasteTemplate: document.getElementById('paste-line-template'),
    name: document.getElementById('cust-name'),
    email: document.getElementById('cust-email'),
    notes: document.getElementById('cust-notes'),
    sShape: document.getElementById('s-shape'),
    sSize: document.getElementById('s-size'),
    sThickness: document.getElementById('s-thickness'),
    sGlass: document.getElementById('s-glass'),
    sGrit: document.getElementById('s-grit'),
    sQty: document.getElementById('s-qty'),
    sPaste: document.getElementById('s-paste'),
    preview: document.getElementById('text-preview'),
    copyBtn: document.getElementById('copy-btn'),
    status: document.getElementById('status-msg')
  };

  var unit = 'in'; // 'in' | 'mm' — display only; option values are always inches

  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  function inToMm(v) { return round1(v * MM_PER_IN); }

  function num(el, fallback) {
    var v = parseFloat(el.value);
    return (isFinite(v) && v > 0) ? v : fallback;
  }

  /* Dual display: the value in the selected unit first, the other in parentheses. */
  function dim(inches) {
    if (unit === 'in') return inches + '" (' + inToMm(inches) + ' mm)';
    return inToMm(inches) + ' mm (' + inches + '")';
  }

  /* Rewrites every hosted option's label for the current unit.
     "Custom (email us)" is unit-neutral and never rewritten. */
  function relabelSelects() {
    [els.diameter, els.length, els.width].forEach(function (sel) {
      Array.prototype.forEach.call(sel.options, function (opt) {
        if (opt.value === 'custom') { opt.textContent = 'Custom (email us)'; return; }
        var inches = parseFloat(opt.value);
        if (!isFinite(inches)) return;
        opt.textContent = (unit === 'in')
          ? inches + '" (' + inToMm(inches) + ' mm)'
          : inToMm(inches) + ' mm (' + inches + '")';
      });
    });
  }

  function isCustom(el) { return el.value === 'custom'; }

  function sizeText() {
    var s = shape();
    var diaCustom = isCustom(els.diameter);
    var lenCustom = isCustom(els.length);
    var widCustom = isCustom(els.width);
    if (s === 'Round') {
      return diaCustom ? 'Custom diameter (specify in Notes)' : dim(els.diameter.value) + ' dia.';
    }
    if (s === 'Square') {
      return lenCustom ? 'Custom side (specify in Notes)' : dim(els.length.value) + ' side';
    }
    var l = lenCustom ? 'Custom length (specify in Notes)' : dim(els.length.value);
    var w = widCustom ? 'Custom width (specify in Notes)' : dim(els.width.value);
    return l + ' x ' + w;
  }

  function anyCustomSize() {
    var s = shape();
    if (s === 'Round') return isCustom(els.diameter);
    if (isCustom(els.length)) return true;
    return (s === 'Rectangle') && isCustom(els.width);
  }

  function shape() { return radio('shape'); }
  function glass() { return radio('glass'); }

  /* ---- Paste lines (mix & match) ---- */

  function cloneLine() {
    var node = els.pasteTemplate.content.cloneNode(true);
    var line = node.firstElementChild; // the .paste-line div
    return document.adoptNode(line);
  }

  function lineText(line) {
    var product = line.querySelector('.pl-product');
    var keyOpt = product.options[product.selectedIndex];
    var key = keyOpt.getAttribute('data-key') || 'tin';
    var grit = line.querySelector('select.pl-grit').value;
    var size = line.querySelector('select.pl-size').value;
    var pack = line.querySelector('select.pl-pack').value;
    if (key === 'kit') return product.value;
    if (key === 'syringe') return product.value + ', ' + grit + ' grit, ' + size;
    if (key === 'multipack') return product.value + ', ' + pack + ' of ' + grit + ' grit, ' + size;
    return product.value + ', ' + grit + ' grit, ' + size;
  }

  function refreshLineUI() {
    var lines = els.pasteLines.querySelectorAll('.paste-line');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var keyOpt = line.querySelector('.pl-product').options[line.querySelector('.pl-product').selectedIndex];
      var key = keyOpt.getAttribute('data-key') || 'tin';
      line.querySelector('div.pl-grit').style.display = (key === 'kit') ? 'none' : '';
      line.querySelector('div.pl-size').style.display = (key === 'kit') ? 'none' : '';
      line.querySelector('div.pl-pack').style.display = (key === 'multipack') ? '' : 'none';
      line.querySelector('.btn-remove-line').hidden = (lines.length < 2);
    }
  }

  function addPasteLine() {
    var line = cloneLine();
    els.pasteLines.appendChild(line);
    refreshLineUI();
    update();
  }

  function removePasteLine(line) {
    els.pasteLines.removeChild(line);
    refreshLineUI();
    update();
  }

  function pasteText() {
    if (!els.wantPaste.checked) return 'None';
    var lines = els.pasteLines.querySelectorAll('.paste-line');
    if (!lines.length) return 'None';
    var parts = [];
    for (var i = 0; i < lines.length; i++) parts.push(lineText(lines[i]));
    return parts.join('  |  ');
  }

  function applyShapeVisibility() {
    var s = shape();
    els.fieldDia.hidden = (s !== 'Round');
    els.fieldLen.hidden = (s === 'Round');
    els.fieldWid.hidden = (s === 'Round');
    // square: length field acts as "side"
    var lbl = document.querySelector('label[for="length"]');
    if (lbl) lbl.textContent = (s === 'Square') ? 'Side' : 'Length';
    var wid = document.getElementById('field-width');
    if (wid) wid.style.display = (s === 'Square') ? 'none' : '';
  }

  function applyCustomVisibility() {
    els.customNotice.hidden = !anyCustomSize();
  }

  function applyGlassVisibility() {
    var g = glass();
    els.fieldGrit.hidden = (g !== 'Frosted');
    els.grit.disabled = (g !== 'Frosted');
  }

  function applyPasteVisibility() {
    els.pasteOptions.hidden = !els.wantPaste.checked;
    if (els.wantPaste.checked && !els.pasteLines.querySelector('.paste-line')) {
      var line = cloneLine();
      els.pasteLines.appendChild(line);
      refreshLineUI();
    }
  }

  function setUnit(u) {
    if (u === unit) return;
    unit = u;
    relabelSelects();
    els.unitIn.setAttribute('aria-pressed', u === 'in' ? 'true' : 'false');
    els.unitMm.setAttribute('aria-pressed', u === 'mm' ? 'true' : 'false');
    update();
  }

  function summaryText() {
    var g = glass();
    var lines = [
      'NANOTECH LAPS - QUOTE REQUEST',
      '------------------------------',
      'Shape:      ' + shape(),
      'Size:       ' + sizeText(),
      'Thickness:  ' + els.thickness.value,
      'Glass type: ' + g,
      'Grit:       ' + (g === 'Frosted' ? els.grit.value : 'polishing stage (clear lap)'),
      'Quantity:   ' + num(els.qty, 1) + ' ' + (num(els.qty, 1) === 1 ? 'lap' : 'laps'),
      'Paste:      ' + pasteText(),
      '',
      'Customer:   ' + (els.name.value.trim() || '(not provided)'),
      'Email:      ' + (els.email.value.trim() || '(not provided)')
    ];
    if (anyCustomSize()) {
      lines.push('', 'CUSTOM SIZE: made to order — may take longer to ship and', 'costs more. Quote is by direct email; exact dimensions in Notes below.');
    }
    var notes = els.notes.value.trim();
    if (notes) {
      lines.push('', 'Notes:', notes);
    }
    return lines.join('\n');
  }

  function subjectText() {
    return 'Lapping Glass Quote Request - ' + shape() + ' ' + sizeText() +
      ' ' + els.thickness.value + ' ' + glass();
  }

  function update() {
    applyShapeVisibility();
    applyCustomVisibility();
    applyGlassVisibility();
    applyPasteVisibility();
    var g = glass();
    els.sShape.textContent = shape();
    els.sSize.textContent = sizeText();
    els.sThickness.textContent = els.thickness.value;
    els.sGlass.textContent = g;
    els.sGrit.textContent = (g === 'Frosted') ? els.grit.value : 'n/a (polishing)';
    var q = num(els.qty, 1);
    els.sQty.textContent = q + ' ' + (q === 1 ? 'lap' : 'laps');
    els.sPaste.textContent = pasteText();
    els.preview.textContent = summaryText();
  }

  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function setStatus(msg, isError) {
    els.status.textContent = msg;
    els.status.classList.toggle('error', !!isError);
  }

  /* ---- URL presets (see header comment for the param scheme) ---- */

  function selectValue(sel, value) {
    if (!value) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === value) { sel.selectedIndex = i; return; }
    }
  }

  function selectThickness(value) {
    if (!value) return;
    var v = value.replace(/"/g, '');
    for (var i = 0; i < els.thickness.options.length; i++) {
      if (els.thickness.options[i].value.indexOf(v) === 0) { els.thickness.selectedIndex = i; return; }
    }
  }

  function setPasteLine(key, grit, size, pack) {
    var line = cloneLine();
    var product = line.querySelector('.pl-product');
    for (var i = 0; i < product.options.length; i++) {
      if (product.options[i].getAttribute('data-key') === key) { product.selectedIndex = i; break; }
    }
    var gSel = line.querySelector('select.pl-grit');
    for (var j = 0; j < gSel.options.length; j++) { if (gSel.options[j].value === grit) { gSel.selectedIndex = j; break; } }
    var sSel = line.querySelector('select.pl-size');
    for (var k = 0; k < sSel.options.length; k++) { if (sSel.options[k].value === size) { sSel.selectedIndex = k; break; } }
    var pSel = line.querySelector('select.pl-pack');
    for (var m = 0; m < pSel.options.length; m++) { if (pSel.options[m].value === pack) { pSel.selectedIndex = m; break; } }
    els.pasteLines.appendChild(line);
    refreshLineUI();
  }

  function applyPresets() {
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (!q || !q.toString()) return;

    var s = (q.get('shape') || '').toLowerCase();
    if (s === 'round' || s === 'square' || s === 'rectangle') {
      var r = form.querySelector('input[name="shape"][value="' + s.charAt(0).toUpperCase() + s.slice(1) + '"]');
      if (r) r.checked = true;
    }
    selectValue(els.diameter, q.get('size'));
    selectValue(els.length, q.get('length') || (s === 'square' ? q.get('size') : null));
    selectValue(els.width, q.get('width'));
    selectThickness(q.get('thickness'));

    var g = (q.get('glass') || '').toLowerCase();
    if (g === 'frosted' || g === 'clear') {
      var gr = form.querySelector('input[name="glass"][value="' + g.charAt(0).toUpperCase() + g.slice(1) + '"]');
      if (gr) gr.checked = true;
    }
    var grit = q.get('grit');
    if (grit) selectValue(els.grit, grit.indexOf('grit') >= 0 ? grit : grit + ' grit');

    var paste = (q.get('paste') || '').toLowerCase();
    if (paste && paste !== 'none') {
      els.wantPaste.checked = true;
      var pgrit = q.get('paste_grit') || '600';
      // Kit sells as-is: no grit/size/pack selection — just the kit.
      if (paste === 'kit') setPasteLine('kit', pgrit, 'Standard tin (250 g)', '10×');
      else if (paste === 'syringe') setPasteLine('syringe', pgrit, '10 g syringe', '10×');
      else if (paste === 'multipack') setPasteLine('multipack', pgrit, '10 g syringe', '10×');
      else setPasteLine('tin', pgrit, 'Standard tin (250 g)', '10×');
    }
  }

  applyPresets();
  relabelSelects();
  refreshLineUI();

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  els.unitIn.addEventListener('click', function () { setUnit('in'); });
  els.unitMm.addEventListener('click', function () { setUnit('mm'); });
  els.addPasteLineBtn.addEventListener('click', addPasteLine);
  els.pasteLines.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.btn-remove-line');
    if (btn) removePasteLine(btn.closest('.paste-line'));
  });

  els.copyBtn.addEventListener('click', function () {
    var text = summaryText();
    function done() { setStatus('Summary copied to clipboard.'); }
    function fail() { setStatus('Copy failed - select the text below and copy manually.', true); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done, fail); });
    } else {
      legacyCopy(text, done, fail);
    }
  });

  function legacyCopy(text, done, fail) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (ok) done(); else fail();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = els.name.value.trim();
    var email = els.email.value.trim();
    if (!name) { setStatus('Please enter your name before requesting a quote.', true); els.name.focus(); return; }
    if (!validEmail(email)) { setStatus('Please enter a valid email address.', true); els.email.focus(); return; }

    var body = summaryText() + '\n\n— Sent from nanotechlaps.com configurator';
    var href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subjectText()) +
      '&body=' + encodeURIComponent(body);

    setStatus('Opening your email app with the quote request...');
    window.location.href = href;
    setTimeout(function () {
      setStatus('Email app should be open. If nothing happened, copy the text summary below and email it to ' + CONTACT_EMAIL + '.', true);
    }, 600);
    update();
  });

  update();
})();
