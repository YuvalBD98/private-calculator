(() => {
  'use strict';

  const display = document.getElementById('display');
  const expressionLine = document.getElementById('expressionLine');
  const displayStack = document.getElementById('displayStack');
  const keypad = document.getElementById('keypad');
  const clearButton = document.getElementById('clearButton');
  const settingsSheet = document.getElementById('settingsSheet');
  const settingsForm = document.getElementById('settingsForm');
  const settingsCancel = document.getElementById('settingsCancel');
  const modeButton = document.getElementById('modeButton');
  const historyButton = document.getElementById('historyButton');
  const modeSheet = document.getElementById('modeSheet');
  const historySheet = document.getElementById('historySheet');

  const forceMethod = document.getElementById('forceMethod');
  const firstDigits = document.getElementById('firstDigits');
  const secondDigits = document.getElementById('secondDigits');
  const rolloverThreshold = document.getElementById('rolloverThreshold');
  const methodHelp = document.getElementById('methodHelp');
  const armButton = document.getElementById('armButton');
  const armTitle = document.getElementById('armTitle');
  const armDescription = document.getElementById('armDescription');

  const DEFAULT_SETTINGS = { forceMethod: 'result', firstDigits: 6, secondDigits: 6, rolloverThreshold: '45' };
  const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  let settings = loadSettings();
  let magicArmed = false;
  let magicStage = 0;
  let firstMagicValue = '';
  let secondMagicValue = '';
  let complementTarget = '';
  let complementDigits = '';
  let complementIndex = 0;

  let currentInput = '0';
  let accumulator = null;
  let pendingOperator = null;
  let waitingForOperand = false;
  let expressionTokens = [];
  let lastExpression = '';
  let justEvaluated = false;

  let suppressClearClick = false;
  let longPressTimer = null;

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('calculator-performance-settings') || '{}');
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch (_) { return { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings() { localStorage.setItem('calculator-performance-settings', JSON.stringify(settings)); }

  function syncSettingsUI() {
    forceMethod.value = settings.forceMethod;
    firstDigits.value = String(settings.firstDigits);
    secondDigits.value = String(settings.secondDigits);
    rolloverThreshold.value = String(settings.rolloverThreshold);
    updateMethodHelp(); updateArmUI();
  }
  function updateMethodHelp() {
    methodHelp.textContent = forceMethod.value === 'result'
      ? 'Result Force: participant 3 sees exactly the random digits they press. When = is pressed, the display becomes the live date/time.'
      : 'Complement Force: participant 3 can tap any digit keys, but the calculator enters the digits of the exact mathematical remainder.';
  }
  function updateArmUI() {
    if (magicArmed) {
      armTitle.textContent = 'Armed for one performance';
      armDescription.textContent = 'After a successful reveal the calculator automatically returns to normal mode.';
      armButton.textContent = 'Disarm'; armButton.classList.add('is-armed');
    } else {
      armTitle.textContent = 'Not armed';
      armDescription.textContent = 'Arm it before handing the phone to the first participant.';
      armButton.textContent = 'Arm Next Performance'; armButton.classList.remove('is-armed');
    }
  }
  function openSettings() { syncSettingsUI(); if (!settingsSheet.open) settingsSheet.showModal(); }
  function closeDialog(dialog) { if (dialog && dialog.open) dialog.close(); }
  document.querySelectorAll('[data-close-dialog]').forEach((b) => b.addEventListener('click', () => closeDialog(b.closest('dialog'))));
  settingsCancel.addEventListener('click', () => closeDialog(settingsSheet));
  forceMethod.addEventListener('change', updateMethodHelp);
  armButton.addEventListener('click', () => { magicArmed = !magicArmed; resetMagicSequence(); updateArmUI(); });
  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    settings = { forceMethod: forceMethod.value, firstDigits: Number(firstDigits.value), secondDigits: Number(secondDigits.value), rolloverThreshold: rolloverThreshold.value };
    saveSettings(); closeDialog(settingsSheet);
  });
  modeButton.addEventListener('click', () => modeSheet.showModal());
  historyButton.addEventListener('click', () => historySheet.showModal());

  function resetMagicSequence() {
    magicStage = 0; firstMagicValue = ''; secondMagicValue = '';
    complementTarget = ''; complementDigits = ''; complementIndex = 0;
  }
  function disarmAfterReveal() { magicArmed = false; resetMagicSequence(); updateArmUI(); }

  function pad2(v) { return String(v).padStart(2, '0'); }
  function targetString(date) {
    const YY = String(date.getFullYear()).slice(-2);
    return `${pad2(date.getDate())}${pad2(date.getMonth() + 1)}${YY}${pad2(date.getHours())}${pad2(date.getMinutes())}`;
  }
  function dateForComplementTarget() {
    const now = new Date();
    if (settings.rolloverThreshold !== 'never' && now.getSeconds() >= Number(settings.rolloverThreshold)) now.setMinutes(now.getMinutes() + 1);
    now.setSeconds(0, 0); return now;
  }
  function prepareComplement() {
    const target = targetString(dateForComplementTarget());
    try {
      const required = BigInt(target) - BigInt(firstMagicValue || '0') - BigInt(secondMagicValue || '0');
      if (required <= 0n) return false;
      complementTarget = target; complementDigits = required.toString(); complementIndex = 0;
      currentInput = ''; waitingForOperand = false; justEvaluated = false; render(); return true;
    } catch (_) { return false; }
  }

  function formatNumber(raw) {
    raw = String(raw ?? '0');
    if (raw === '' || raw === '-') return raw;
    if (raw === 'Error') return raw;
    const negative = raw.startsWith('-');
    if (negative) raw = raw.slice(1);
    let [whole, fraction] = raw.split('.');
    if (whole === '') whole = '0';
    // Leave scientific notation alone.
    if (/e/i.test(raw)) return `${negative ? '−' : ''}${raw}`;
    const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
    return `${negative ? '−' : ''}${grouped}${fraction !== undefined ? `.${fraction}` : ''}`;
  }

  function formatTokens(tokens) {
    return tokens.map((token) => token.type === 'number' ? formatNumber(token.value) : OP_SYMBOL[token.value]).join('');
  }

  function buildLiveExpression() {
    const tokens = expressionTokens.slice();
    if (!waitingForOperand && currentInput !== '') tokens.push({ type: 'number', value: currentInput });
    const text = formatTokens(tokens);
    return text || formatNumber(currentInput || '0');
  }

  function updateClearLabel() {
    const hasEditableEntry = !justEvaluated && !waitingForOperand && currentInput !== '' && (currentInput !== '0' || expressionTokens.length > 0);
    clearButton.textContent = hasEditableEntry ? 'C' : 'AC';
  }

  function render() {
    if (justEvaluated) {
      displayStack.classList.add('has-result');
      expressionLine.textContent = lastExpression;
      display.textContent = formatNumber(currentInput || '0');
    } else {
      displayStack.classList.remove('has-result');
      expressionLine.textContent = '';
      display.textContent = buildLiveExpression();
    }
    updateClearLabel();
    requestAnimationFrame(fitDisplays);
  }

  function fitOneLine(el, maxSize, minSize) {
    el.style.fontSize = `${maxSize}px`;
    const available = el.parentElement.clientWidth;
    const width = el.scrollWidth;
    if (width > available && width > 0) {
      const size = Math.max(minSize, Math.floor(maxSize * available / width));
      el.style.fontSize = `${size}px`;
    }
  }
  function fitDisplays() {
    fitOneLine(display, 80, 36);
    if (justEvaluated && lastExpression) fitOneLine(expressionLine, 28, 18);
  }
  window.addEventListener('resize', fitDisplays);

  function startFreshIfNeeded() {
    if (!justEvaluated) return;
    currentInput = '0'; accumulator = null; pendingOperator = null; waitingForOperand = false;
    expressionTokens = []; lastExpression = ''; justEvaluated = false;
  }

  function inputDigit(digit) {
    startFreshIfNeeded();

    if (magicArmed && magicStage === 2 && settings.forceMethod === 'complement') {
      if (!complementDigits && !prepareComplement()) return;
      if (complementIndex < complementDigits.length) {
        currentInput += complementDigits[complementIndex++];
        waitingForOperand = false; render();
      }
      return;
    }

    if (waitingForOperand || currentInput === '') {
      currentInput = digit; waitingForOperand = false;
    } else if (currentInput === '0') currentInput = digit;
    else if (currentInput.replace(/[^0-9]/g, '').length < 15) currentInput += digit;
    render();
  }

  function inputDecimal() {
    startFreshIfNeeded();
    if (magicArmed && magicStage === 2) return;
    if (waitingForOperand || currentInput === '') { currentInput = '0.'; waitingForOperand = false; }
    else if (!currentInput.includes('.')) currentInput += '.';
    render();
  }

  function clearAll() {
    currentInput = '0'; accumulator = null; pendingOperator = null; waitingForOperand = false;
    expressionTokens = []; lastExpression = ''; justEvaluated = false;
    resetMagicSequence(); render();
  }

  function clearEntryOrAll() {
    if (justEvaluated || waitingForOperand || currentInput === '' || (currentInput === '0' && expressionTokens.length === 0)) {
      clearAll(); return;
    }
    currentInput = expressionTokens.length ? '' : '0';
    waitingForOperand = expressionTokens.length > 0;
    if (magicStage === 2) { complementTarget = ''; complementDigits = ''; complementIndex = 0; }
    render();
  }

  function backspace() {
    if (justEvaluated) return;
    if (waitingForOperand || currentInput === '') return;
    if (magicArmed && magicStage === 2 && settings.forceMethod === 'complement') {
      if (complementIndex > 0) { complementIndex--; currentInput = currentInput.slice(0, -1); if (!currentInput) waitingForOperand = true; render(); }
      return;
    }
    const negativeOnly = currentInput.length === 2 && currentInput.startsWith('-');
    if (currentInput.length <= 1 || negativeOnly) {
      if (expressionTokens.length) { currentInput = ''; waitingForOperand = true; }
      else currentInput = '0';
    } else currentInput = currentInput.slice(0, -1);
    render();
  }

  function toggleSign() {
    startFreshIfNeeded();
    if (magicArmed && magicStage === 2) return;
    if (currentInput === '' || currentInput === '0') return;
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : `-${currentInput}`; render();
  }

  function percent() {
    startFreshIfNeeded();
    if (magicArmed && magicStage === 2) return;
    const value = Number(currentInput); if (!Number.isFinite(value)) return;
    currentInput = String(value / 100); render();
  }

  function calculate(a, b, operator) {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function normalOperator(operator, enteredRaw) {
    const inputValue = Number(enteredRaw);
    if (!Number.isFinite(inputValue)) return;
    if (accumulator === null) accumulator = inputValue;
    else if (pendingOperator && !waitingForOperand) {
      const result = calculate(accumulator, inputValue, pendingOperator);
      if (!Number.isFinite(result)) {
        currentInput = 'Error'; accumulator = null; pendingOperator = null; waitingForOperand = true;
        expressionTokens = []; justEvaluated = true; lastExpression = ''; render(); return;
      }
      accumulator = result; currentInput = String(result);
    }
    pendingOperator = operator; waitingForOperand = true;
  }

  function pushOperatorVisual(operator, enteredRaw) {
    if (justEvaluated) {
      expressionTokens = [{ type: 'number', value: enteredRaw }, { type: 'operator', value: operator }];
      justEvaluated = false; lastExpression = '';
      return;
    }
    if (waitingForOperand && expressionTokens.length && expressionTokens.at(-1).type === 'operator') {
      expressionTokens[expressionTokens.length - 1] = { type: 'operator', value: operator };
    } else {
      expressionTokens.push({ type: 'number', value: enteredRaw });
      expressionTokens.push({ type: 'operator', value: operator });
    }
  }

  function handleOperator(operator) {
    const enteredRaw = currentInput === '' ? '0' : currentInput;
    const cleanInput = enteredRaw.replace(/[^0-9]/g, '');
    const wasWaiting = waitingForOperand;

    if (justEvaluated) {
      pushOperatorVisual(operator, enteredRaw);
      accumulator = Number(enteredRaw); pendingOperator = operator; waitingForOperand = true; render(); return;
    }

    if (magicArmed && operator === '+' && !wasWaiting) {
      if (magicStage === 0 && cleanInput.length === settings.firstDigits) {
        firstMagicValue = cleanInput; magicStage = 1;
      } else if (magicStage === 1 && cleanInput.length === settings.secondDigits) {
        secondMagicValue = cleanInput; magicStage = 2;
        if (settings.forceMethod === 'complement') { complementTarget = ''; complementDigits = ''; complementIndex = 0; }
      }
    } else if (magicArmed && magicStage > 0 && operator !== '+') resetMagicSequence();

    if (wasWaiting) {
      if (expressionTokens.length && expressionTokens.at(-1).type === 'operator') expressionTokens[expressionTokens.length - 1] = { type: 'operator', value: operator };
      pendingOperator = operator; render(); return;
    }

    pushOperatorVisual(operator, enteredRaw);
    normalOperator(operator, enteredRaw);
    render();
  }

  function snapshotExpression() {
    const tokens = expressionTokens.slice();
    if (!waitingForOperand && currentInput !== '') tokens.push({ type: 'number', value: currentInput });
    return formatTokens(tokens);
  }

  function equals() {
    if (magicArmed && magicStage === 2) {
      lastExpression = snapshotExpression();
      let result = '';
      if (settings.forceMethod === 'result') result = targetString(new Date());
      else {
        if (!complementDigits) prepareComplement();
        if (complementTarget) result = complementTarget;
      }
      if (result) {
        currentInput = result; accumulator = Number(result); pendingOperator = null; waitingForOperand = true;
        expressionTokens = []; justEvaluated = true; render(); disarmAfterReveal(); return;
      }
    }

    if (!pendingOperator || accumulator === null || waitingForOperand) return;
    lastExpression = snapshotExpression();
    const inputValue = Number(currentInput);
    const result = calculate(accumulator, inputValue, pendingOperator);
    currentInput = Number.isFinite(result) ? String(result) : 'Error';
    accumulator = Number.isFinite(result) ? result : null;
    pendingOperator = null; waitingForOperand = true; expressionTokens = []; justEvaluated = true; render();
  }

  keypad.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button === clearButton && suppressClearClick) { suppressClearClick = false; return; }
    const digit = button.dataset.digit, operator = button.dataset.operator, action = button.dataset.action;
    if (digit !== undefined) inputDigit(digit);
    else if (operator) handleOperator(operator);
    else if (action === 'decimal') inputDecimal();
    else if (action === 'clear') clearEntryOrAll();
    else if (action === 'backspace') backspace();
    else if (action === 'sign') toggleSign();
    else if (action === 'percent') percent();
    else if (action === 'equals') equals();
  });

  function cancelLongPressTimer() { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } }
  clearButton.addEventListener('pointerdown', () => {
    suppressClearClick = false; cancelLongPressTimer();
    longPressTimer = setTimeout(() => { suppressClearClick = true; openSettings(); }, 1500);
  });
  clearButton.addEventListener('pointerup', cancelLongPressTimer);
  clearButton.addEventListener('pointercancel', cancelLongPressTimer);
  clearButton.addEventListener('pointerleave', cancelLongPressTimer);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') cancelLongPressTimer(); });
  document.addEventListener('contextmenu', (event) => event.preventDefault());

  render(); syncSettingsUI();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
})();
