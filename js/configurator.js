/* NanoTech Laps configurator
   Live order summary + mailto: quote request. No backend, no frameworks. */
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
    thickness: document.getElementById('thickness'),
    grit: document.getElementById('grit'),
    fieldGrit: document.getElementById('field-grit'),
    qty: document.getElementById('qty'),
    wantPaste: document.getElementById('want-paste'),
    pasteOptions: document.getElementById('paste-options'),
    pasteGrit: document.getElementById('paste-grit'),
    pasteSize: document.getElementById('paste-size'),
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

  var unit = 'in'; // 'in' | 'mm'

  function radio(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function num(el, fallback) {
    var v = parseFloat(el.value);
    return (isFinite(v) && v > 0) ? v : fallback;
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  function inToMm(v) { return round1(v * MM_PER_IN); }
  function mmToIn(v) { return round1(v / MM_PER_IN * 4) / 4; } // snap to 1/16"

  /* Dual display: show the value in the selected unit first, the other in parentheses. */
  function dim(v) {
    if (unit === 'in') return v + '" (' + inToMm(v) + ' mm)';
    return v + ' mm (' + mmToIn(v) + '")';
  }

  function shape() { return radio('shape'); }
  function glass() { return radio('glass'); }

  function sizeText() {
    var s = shape();
    if (s === 'Round') return dim(num(els.diameter, 6)) + ' dia.';
    if (s === 'Square') return dim(num(els.length, 6)) + ' side';
    return dim(num(els.length, 8)) + ' x ' + dim(num(els.width, 6));
  }

  function pasteText() {
    if (!els.wantPaste.checked) return 'None';
    var p = els.pasteProduct.value;
    if (p.indexOf('Finishing Ladder Kit') === 0) return p;
    if (p.indexOf('Bulk diamond paste syringe') === 0) return 'Bulk syringe, ' + els.pasteGrit.value + ' grit, ' + els.pasteSize.value;
    if (p.indexOf('Repeat-grit multipack') === 0) return 'Multipack, ' + els.pasteGrit.value + ' grit, ' + els.pasteSize.value;
    return els.pasteGrit.value + ' grit, ' + els.pasteSize.value;
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

  function applyGlassVisibility() {
    var g = glass();
    els.fieldGrit.hidden = (g !== 'Frosted');
    els.grit.disabled = (g !== 'Frosted');
  }

  function applyPasteVisibility() {
    els.pasteOptions.hidden = !els.wantPaste.checked;
  }

  function setUnit(u) {
    if (u === unit) return;
    // convert current numeric values so the physical size stays the same
    if (u === 'mm') {
      els.diameter.value = inToMm(num(els.diameter, 6));
      els.length.value = inToMm(num(els.length, 8));
      els.width.value = inToMm(num(els.width, 6));
      [els.diameter, els.length, els.width].forEach(function (el) {
        el.step = '1'; el.min = '25'; el.max = '1200';
      });
    } else {
      els.diameter.value = mmToIn(num(els.diameter, 152));
      els.length.value = mmToIn(num(els.length, 203));
      els.width.value = mmToIn(num(els.width, 152));
      [els.diameter, els.length, els.width].forEach(function (el) {
        el.step = '0.125'; el.min = '1'; el.max = '48';
      });
    }
    unit = u;
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

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  els.unitIn.addEventListener('click', function () { setUnit('in'); });
  els.unitMm.addEventListener('click', function () { setUnit('mm'); });

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
