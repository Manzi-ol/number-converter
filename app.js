'use strict';

// ── DOM refs ───────────────────────────────────────────────────────────────
const inputDecimal = document.getElementById('input-decimal');
const inputBinary  = document.getElementById('input-binary');
const inputOctal   = document.getElementById('input-octal');
const inputHex     = document.getElementById('input-hex');
const explanBody   = document.getElementById('explanation-body');
const powersTable  = document.getElementById('powers-table');

// ── Validation patterns ────────────────────────────────────────────────────
const PATTERNS = {
  decimal: /^-?[0-9]*$/,
  binary:  /^[01]*$/,
  octal:   /^[0-7]*$/,
  hex:     /^[0-9a-fA-F]*$/,
};

// ── Conversion helpers ─────────────────────────────────────────────────────
function decToBin(n) {
  if (n === 0) return '0';
  const neg = n < 0;
  let val = Math.abs(n);
  let bits = [];
  while (val > 0) { bits.unshift(val & 1); val >>= 1; }
  return (neg ? '-' : '') + bits.join('');
}

function decToOct(n) { return n < 0 ? '-' + Math.abs(n).toString(8) : n.toString(8); }
function decToHex(n) { return n < 0 ? '-' + Math.abs(n).toString(16).toUpperCase() : n.toString(16).toUpperCase(); }

function binToDec(s) {
  const neg = s.startsWith('-');
  const clean = neg ? s.slice(1) : s;
  if (!clean) return NaN;
  const val = parseInt(clean, 2);
  return neg ? -val : val;
}

function octToDec(s) {
  const neg = s.startsWith('-');
  const clean = neg ? s.slice(1) : s;
  if (!clean) return NaN;
  const val = parseInt(clean, 8);
  return neg ? -val : val;
}

function hexToDec(s) {
  const neg = s.startsWith('-');
  const clean = neg ? s.slice(1) : s;
  if (!clean) return NaN;
  const val = parseInt(clean, 16);
  return neg ? -val : val;
}

// ── Explanation builder ────────────────────────────────────────────────────
function buildExplanation(decVal) {
  if (isNaN(decVal) || decVal === null) {
    explanBody.innerHTML = 'Enter a value in any field above to see the conversion breakdown.';
    return;
  }

  const absVal = Math.abs(decVal);
  const sign   = decVal < 0 ? '−' : '';
  const binStr = decToBin(absVal);
  const octStr = decToOct(absVal);
  const hexStr = decToHex(absVal).toUpperCase();

  let html = '';

  // Dec → Bin explanation
  html += `<div class="step">
    <span class="tag tag-binary">BIN</span>
    <strong>${sign}${absVal}<sub>10</sub> → ${sign}${binStr}<sub>2</sub></strong><br>
    Divide by 2 repeatedly and collect remainders (read bottom-up):<br>`;

  if (absVal === 0) {
    html += '0 ÷ 2 = 0 r <strong>0</strong>';
  } else {
    let temp = absVal;
    const steps = [];
    while (temp > 0) {
      steps.push(`${temp} ÷ 2 = ${Math.floor(temp / 2)} remainder <strong>${temp % 2}</strong>`);
      temp = Math.floor(temp / 2);
    }
    html += steps.join(' → ') + '<br>Result (reversed): <strong>' + binStr + '</strong>';
  }
  html += '</div>';

  // Dec → Oct explanation
  html += `<div class="step">
    <span class="tag tag-octal">OCT</span>
    <strong>${sign}${absVal}<sub>10</sub> → ${sign}${octStr}<sub>8</sub></strong><br>
    Divide by 8 repeatedly and collect remainders (read bottom-up):<br>`;

  if (absVal === 0) {
    html += '0 ÷ 8 = 0 r <strong>0</strong>';
  } else {
    let temp = absVal;
    const steps = [];
    while (temp > 0) {
      steps.push(`${temp} ÷ 8 = ${Math.floor(temp / 8)} r <strong>${temp % 8}</strong>`);
      temp = Math.floor(temp / 8);
    }
    html += steps.join(' → ') + ' → Result: <strong>' + octStr + '</strong>';
  }
  html += '</div>';

  // Dec → Hex explanation
  const HEX_DIGITS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
  html += `<div class="step">
    <span class="tag tag-hex">HEX</span>
    <strong>${sign}${absVal}<sub>10</sub> → ${sign}${hexStr}<sub>16</sub></strong><br>
    Divide by 16 repeatedly. Digits 10–15 map to A–F:<br>`;

  if (absVal === 0) {
    html += '0 ÷ 16 = 0 r <strong>0</strong>';
  } else {
    let temp = absVal;
    const steps = [];
    while (temp > 0) {
      const rem = temp % 16;
      steps.push(`${temp} ÷ 16 = ${Math.floor(temp / 16)} r <strong>${HEX_DIGITS[rem]}</strong>`);
      temp = Math.floor(temp / 16);
    }
    html += steps.join(' → ') + ' → Result: <strong>' + hexStr + '</strong>';
  }
  html += '</div>';

  // Positional notation check (Binary → Dec)
  if (binStr !== '0' && absVal > 0 && absVal <= 1024) {
    const bits = binStr.split('').reverse();
    const parts = bits.map((b, i) => `${b}×2<sup>${i}</sup>`).reverse().join(' + ');
    html += `<div class="step">
      <span class="tag tag-decimal">DEC</span>
      <strong>Positional: ${binStr}<sub>2</sub> = ${parts} = ${absVal}<sub>10</sub></strong>
    </div>`;
  }

  explanBody.innerHTML = html;
}

// ── Powers of 2 table ──────────────────────────────────────────────────────
function buildPowersTable() {
  powersTable.innerHTML = '';
  for (let i = 0; i <= 15; i++) {
    const val = Math.pow(2, i);
    const cell = document.createElement('div');
    cell.className = 'power-cell';
    cell.innerHTML = `<div class="power-exp">2<sup>${i}</sup></div><div class="power-val">${val.toLocaleString()}</div>`;
    powersTable.appendChild(cell);
  }
}

// ── Core update function ───────────────────────────────────────────────────
let updating = false; // prevent infinite loops

function updateFromDecimal(rawVal) {
  if (updating) return;
  updating = true;

  const trimmed = rawVal.trim();
  if (trimmed === '' || trimmed === '-') {
    clearOthers('decimal');
    buildExplanation(null);
    updating = false;
    return;
  }
  if (!PATTERNS.decimal.test(trimmed)) {
    markError(inputDecimal);
    updating = false;
    return;
  }
  clearError(inputDecimal);
  const dec = parseInt(trimmed, 10);
  if (isNaN(dec)) { clearOthers('decimal'); updating = false; return; }
  inputBinary.value = decToBin(dec);
  inputOctal.value  = decToOct(dec);
  inputHex.value    = decToHex(dec);
  buildExplanation(dec);
  updating = false;
}

function updateFromBinary(rawVal) {
  if (updating) return;
  updating = true;
  const trimmed = rawVal.trim().toUpperCase();
  if (trimmed === '') { clearOthers('binary'); buildExplanation(null); updating = false; return; }
  if (!PATTERNS.binary.test(trimmed)) { markError(inputBinary); updating = false; return; }
  clearError(inputBinary);
  const dec = binToDec(trimmed);
  if (isNaN(dec)) { clearOthers('binary'); updating = false; return; }
  inputDecimal.value = dec.toString();
  inputOctal.value   = decToOct(dec);
  inputHex.value     = decToHex(dec);
  buildExplanation(dec);
  updating = false;
}

function updateFromOctal(rawVal) {
  if (updating) return;
  updating = true;
  const trimmed = rawVal.trim();
  if (trimmed === '') { clearOthers('octal'); buildExplanation(null); updating = false; return; }
  if (!PATTERNS.octal.test(trimmed)) { markError(inputOctal); updating = false; return; }
  clearError(inputOctal);
  const dec = octToDec(trimmed);
  if (isNaN(dec)) { clearOthers('octal'); updating = false; return; }
  inputDecimal.value = dec.toString();
  inputBinary.value  = decToBin(dec);
  inputHex.value     = decToHex(dec);
  buildExplanation(dec);
  updating = false;
}

function updateFromHex(rawVal) {
  if (updating) return;
  updating = true;
  const trimmed = rawVal.trim().toUpperCase();
  if (trimmed === '') { clearOthers('hex'); buildExplanation(null); updating = false; return; }
  if (!PATTERNS.hex.test(trimmed)) { markError(inputHex); updating = false; return; }
  clearError(inputHex);
  // Auto-uppercase the input
  inputHex.value = trimmed;
  const dec = hexToDec(trimmed);
  if (isNaN(dec)) { clearOthers('hex'); updating = false; return; }
  inputDecimal.value = dec.toString();
  inputBinary.value  = decToBin(dec);
  inputOctal.value   = decToOct(dec);
  buildExplanation(dec);
  updating = false;
}

function clearOthers(except) {
  if (except !== 'decimal') inputDecimal.value = '';
  if (except !== 'binary')  inputBinary.value  = '';
  if (except !== 'octal')   inputOctal.value   = '';
  if (except !== 'hex')     inputHex.value     = '';
}

function markError(el) { el.classList.add('error'); }
function clearError(el) { el.classList.remove('error'); }

// ── Event listeners ────────────────────────────────────────────────────────
inputDecimal.addEventListener('input', e => { clearError(inputDecimal); updateFromDecimal(e.target.value); });
inputBinary.addEventListener('input',  e => { clearError(inputBinary);  updateFromBinary(e.target.value); });
inputOctal.addEventListener('input',   e => { clearError(inputOctal);   updateFromOctal(e.target.value); });
inputHex.addEventListener('input',     e => { clearError(inputHex);     updateFromHex(e.target.value); });

// Force hex uppercase on keyup too
inputHex.addEventListener('keyup', e => {
  const pos = e.target.selectionStart;
  e.target.value = e.target.value.toUpperCase();
  e.target.setSelectionRange(pos, pos);
});

// ── Init ───────────────────────────────────────────────────────────────────
buildPowersTable();
