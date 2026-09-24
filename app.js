(() => {
  'use strict';

  const display = document.getElementById('display');
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

  const DEFAULT_SETTINGS = {
    forceMethod: 'result',
    firstDigits: 6,
    secondDigits: 6,
    rolloverThreshold: '45'
  };

  let settings = loadSettings();
  let magicArmed = false;
  let magicStage = 0; // 0 waiting for first, 1 waiting for second, 2 waiting for third
  let firstMagicValue = '';
  let secondMagicValue = '';
  let complementTarget = '';
  let complementDigits = '';
  let complementIndex = 0;

  let currentInput = '0';
  let accumulator = null;
  let pendingOperator = null;
  let waitingForOperand = false;
  let suppressClearClick = false;
  let longPressTimer = null;

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('calculator-performance-settings') || '{}');
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch (_) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    localStorage.setItem('calculator-performance-settings', JSON.stringify(settings));
  }

  function syncSettingsUI() {
    forceMethod.value = settings.forceMethod;
    firstDigits.value = String(settings.firstDigits);
    secondDigits.value = String(settings.secondDigits);
    rolloverThreshold.value = String(settings.rolloverThreshold);
    updateMethodHelp();
    updateArmUI();
  }

  function updateMethodHelp() {
    if (forceMethod.value === 'result') {
      methodHelp.textContent = 'Result Force: participant 3 sees exactly the random digits they press. When = is pressed, the display becomes the live date/time. This is the safest mode when the screen stays visible.';
    } else {
      methodHelp.textContent = 'Complement Force: after the second +, participant 3 can tap any digit keys, but the calculator displays the digits of the exact mathematical remainder. Best used when they are casually tapping or the screen is not being watched closely.';
    }
  }

  function updateArmUI() {
    if (magicArmed) {
      armTitle.textContent = 'Armed for one performance';
      armDescription.textContent = 'After a successful reveal the calculator automatically returns to normal mode.';
      armButton.textContent = 'Disarm';
      armButton.classList.add('is-armed');
    } else {
      armTitle.textContent = 'Not armed';
      armDescription.textContent = 'Arm it before handing the phone to the first participant.';
      armButton.textContent = 'Arm Next Performance';
      armButton.classList.remove('is-armed');
    }
  }

  function openSettings() {
    syncSettingsUI();
    if (!settingsSheet.open) settingsSheet.showModal();
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) dialog.close();
  }

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')));
  });

  settingsCancel.addEventListener('click', () => closeDialog(settingsSheet));
  forceMethod.addEventListener('change', updateMethodHelp);

  armButton.addEventListener('click', () => {
    magicArmed = !magicArmed;
    resetMagicSequence();
    updateArmUI();
  });

  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    settings = {
      forceMethod: forceMethod.value,
      firstDigits: Number(firstDigits.value),
      secondDigits: Number(secondDigits.value),
      rolloverThreshold: rolloverThreshold.value
    };
    saveSettings();
    closeDialog(settingsSheet);
  });

  modeButton.addEventListener('click', () => modeSheet.showModal());
  historyButton.addEventListener('click', () => historySheet.showModal());

  function resetMagicSequence() {
    magicStage = 0;
    firstMagicValue = '';
    secondMagicValue = '';
    complementTarget = '';
    complementDigits = '';
    complementIndex = 0;
  }

  function disarmAfterReveal() {
    magicArmed = false;
    resetMagicSequence();
    updateArmUI();
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function targetString(date) {
    const YY = String(date.getFullYear()).slice(-2);
    const MM = pad2(date.getMonth() + 1);
    const DD = pad2(date.getDate());
    const HH = pad2(date.getHours());
    const mm = pad2(date.getMinutes());
    return `${DD}${MM}${YY}${HH}${mm}`;
  }

  function dateForComplementTarget() {
    const now = new Date();
    if (settings.rolloverThreshold !== 'never') {
      const threshold = Number(settings.rolloverThreshold);
      if (now.getSeconds() >= threshold) {
        now.setMinutes(now.getMinutes() + 1);
      }
    }
    now.setSeconds(0, 0);
    return now;
  }

  function prepareComplement() {
    const target = targetString(dateForComplementTarget());
    try {
      const required = BigInt(target) - BigInt(firstMagicValue || '0') - BigInt(secondMagicValue || '0');
      if (required <= 0n) return false;
      complementTarget = target;
      complementDigits = required.toString();
      complementIndex = 0;
      currentInput = '';
      waitingForOperand = false;
      render();
      return true;
    } catch (_) {
      return false;
    }
  }

  function formatNormalNumber(value) {
    if (value === '' || value === '-') return value || '0';
    if (value.includes('.')) {
      const [whole, decimal] = value.split('.');
      return `${whole || '0'}.${decimal ?? ''}`;
    }
    return value;
  }

  function render(value = currentInput) {
    const raw = String(value ?? '0');
    display.textContent = raw === '' ? '0' : raw;
    requestAnimationFrame(fitDisplay);
  }

  function fitDisplay() {
    display.style.transform = 'scaleX(1)';
    const available = display.parentElement.clientWidth - 2;
    const width = display.scrollWidth;
    if (width > available && width > 0) {
      const scale = Math.max(0.48, available / width);
      display.style.transform = `scaleX(${scale})`;
    }
  }

  window.addEventListener('resize', fitDisplay);

  function inputDigit(digit) {
    if (magicArmed && magicStage === 2 && settings.forceMethod === 'complement') {
      if (!complementDigits && !prepareComplement()) return;
      if (complementIndex < complementDigits.length) {
        currentInput += complementDigits[complementIndex];
        complementIndex += 1;
        render();
      }
      return;
    }

    if (waitingForOperand) {
      currentInput = digit;
      waitingForOperand = false;
    } else if (currentInput === '0') {
      currentInput = digit;
    } else if (currentInput.length < 15) {
      currentInput += digit;
    }
    render();
  }

  function inputDecimal() {
    if (magicArmed && magicStage === 2) return;
    if (waitingForOperand) {
      currentInput = '0.';
      waitingForOperand = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    render();
  }

  function clearAll() {
    currentInput = '0';
    accumulator = null;
    pendingOperator = null;
    waitingForOperand = false;
    resetMagicSequence();
    render();
  }

  function backspace() {
    if (waitingForOperand) return;
    if (magicArmed && magicStage === 2 && settings.forceMethod === 'complement') {
      if (complementIndex > 0) {
        complementIndex -= 1;
        currentInput = currentInput.slice(0, -1);
        render();
      }
      return;
    }
    if (currentInput.length <= 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
      currentInput = '0';
    } else {
      currentInput = currentInput.slice(0, -1);
    }
    render();
  }

  function toggleSign() {
    if (magicArmed && magicStage === 2) return;
    if (currentInput === '0') return;
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : `-${currentInput}`;
    render();
  }

  function percent() {
    if (magicArmed && magicStage === 2) return;
    const value = Number(currentInput);
    if (!Number.isFinite(value)) return;
    currentInput = String(value / 100);
    render();
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

  function normalOperator(operator) {
    const inputValue = Number(currentInput);
    if (!Number.isFinite(inputValue)) return;

    if (accumulator === null) {
      accumulator = inputValue;
    } else if (pendingOperator && !waitingForOperand) {
      const result = calculate(accumulator, inputValue, pendingOperator);
      if (!Number.isFinite(result)) {
        currentInput = 'Error';
        accumulator = null;
        pendingOperator = null;
        waitingForOperand = true;
        render();
        return;
      }
      accumulator = result;
      currentInput = String(result);
      render();
    }
    pendingOperator = operator;
    waitingForOperand = true;
  }

  function handleOperator(operator) {
    if (magicArmed && operator === '+') {
      const cleanInput = currentInput.replace(/[^0-9]/g, '');
      if (magicStage === 0 && !waitingForOperand && cleanInput.length === settings.firstDigits) {
        firstMagicValue = cleanInput;
        magicStage = 1;
        normalOperator('+');
        return;
      }
      if (magicStage === 1 && !waitingForOperand && cleanInput.length === settings.secondDigits) {
        secondMagicValue = cleanInput;
        magicStage = 2;
        normalOperator('+');
        if (settings.forceMethod === 'complement') {
          // Locking is deferred until participant 3 touches a digit so the time is as fresh as possible.
          complementTarget = '';
          complementDigits = '';
          complementIndex = 0;
        }
        return;
      }
    }

    if (magicArmed && magicStage > 0 && operator !== '+') {
      resetMagicSequence();
    }
    normalOperator(operator);
  }

  function equals() {
    if (magicArmed && magicStage === 2) {
      if (settings.forceMethod === 'result') {
        const result = targetString(new Date());
        currentInput = result;
        accumulator = Number(result);
        pendingOperator = null;
        waitingForOperand = true;
        render(result);
        disarmAfterReveal();
        return;
      }

      if (!complementDigits) prepareComplement();
      if (complementTarget) {
        currentInput = complementTarget;
        accumulator = Number(complementTarget);
        pendingOperator = null;
        waitingForOperand = true;
        render(complementTarget);
        disarmAfterReveal();
        return;
      }
    }

    if (!pendingOperator || accumulator === null || waitingForOperand) return;
    const inputValue = Number(currentInput);
    const result = calculate(accumulator, inputValue, pendingOperator);
    currentInput = Number.isFinite(result) ? String(result) : 'Error';
    accumulator = Number.isFinite(result) ? result : null;
    pendingOperator = null;
    waitingForOperand = true;
    render();
  }

  keypad.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button === clearButton && suppressClearClick) {
      suppressClearClick = false;
      return;
    }

    const digit = button.dataset.digit;
    const operator = button.dataset.operator;
    const action = button.dataset.action;

    if (digit !== undefined) inputDigit(digit);
    else if (operator) handleOperator(operator);
    else if (action === 'decimal') inputDecimal();
    else if (action === 'clear') clearAll();
    else if (action === 'backspace') backspace();
    else if (action === 'sign') toggleSign();
    else if (action === 'percent') percent();
    else if (action === 'equals') equals();
  });

  function cancelLongPressTimer() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  clearButton.addEventListener('pointerdown', () => {
    suppressClearClick = false;
    cancelLongPressTimer();
    longPressTimer = setTimeout(() => {
      suppressClearClick = true;
      openSettings();
    }, 1500);
  });
  clearButton.addEventListener('pointerup', cancelLongPressTimer);
  clearButton.addEventListener('pointercancel', cancelLongPressTimer);
  clearButton.addEventListener('pointerleave', cancelLongPressTimer);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cancelLongPressTimer();
  });

  // Disable context menus/selection during performance.
  document.addEventListener('contextmenu', (event) => event.preventDefault());

  render();
  syncSettingsUI();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
