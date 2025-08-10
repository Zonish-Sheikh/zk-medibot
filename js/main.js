let MASTER_PASS = null; // session-only, does NOT store in localStorage
let vaultData = { medications: [], allergies: [], lifestyle: [] };

document.addEventListener('DOMContentLoaded', () => {
  // Buttons and input references
  const unlockBtn = document.getElementById('unlockBtn');
  const lockBtn = document.getElementById('lockBtn');
  const vaultPassInput = document.getElementById('vaultPass');

  // Health Ring Animation
  const circle = document.querySelector('.progress-ring-circle');
  const healthScoreText = document.getElementById('healthScoreText');
  if (circle && healthScoreText) {
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    function setProgress(percent) {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    let progress = 0;
    const target = 70;
    const interval = setInterval(() => {
      if (progress >= target) clearInterval(interval);
      else {
        progress++;
        setProgress(progress);
        healthScoreText.textContent = progress + "%";
      }
    }, 20);
  }

  // Notifications fade out after 5 seconds
  const notification = document.querySelector('.notification');
  if (notification) {
    setTimeout(() => {
      notification.style.opacity = 0;
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }

  // Sticky navbar toggle on scroll
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('sticky', window.scrollY > 0);
    });
  }

  // Fade-in cards sequentially
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add('fade-in'), i * 350);
  });

  // Auto-lock after 3 minute inactivity with 10 seconds countdown
  const inactivityTime = 180000;  // 3 minutes total
  let inactivityTimer;
  let countdownTimer;
  let countdownValue = 10;

  // Create countdown display element dynamically
  let countdownDisplay = document.getElementById('countdownDisplay');
  if (!countdownDisplay) {
    countdownDisplay = document.createElement('div');
    countdownDisplay.id = 'countdownDisplay';
    countdownDisplay.style.position = 'fixed';
    countdownDisplay.style.bottom = '20px';
    countdownDisplay.style.right = '20px';
    countdownDisplay.style.padding = '10px 15px';
    countdownDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    countdownDisplay.style.color = 'white';
    countdownDisplay.style.fontSize = '16px';
    countdownDisplay.style.borderRadius = '5px';
    countdownDisplay.style.zIndex = '1000';
    countdownDisplay.style.display = 'none';
    document.body.appendChild(countdownDisplay);
  }

  function startCountdown() {
    countdownValue = 10;
    countdownDisplay.textContent = `Auto-lock in ${countdownValue} seconds`;
    countdownDisplay.style.display = 'block';

    countdownTimer = setInterval(() => {
      countdownValue--;
      if (countdownValue <= 0) {
        clearInterval(countdownTimer);
        countdownDisplay.style.display = 'none';
        alert('Vault auto-locked due to inactivity.');
        lockBtn.click();
      } else {
        countdownDisplay.textContent = `Auto-lock in ${countdownValue} seconds`;
      }
    }, 1000);
  }

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    clearInterval(countdownTimer);
    countdownDisplay.style.display = 'none';
    if (isUnlocked()) {
      inactivityTimer = setTimeout(() => {
        startCountdown();
      }, inactivityTime);
    }
  }

  ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });

  // Unlock button click: unlock vault & reset timer
  unlockBtn.addEventListener('click', async () => {
    const pass = vaultPassInput.value.trim();
    if (!pass) {
      alert('Please enter a password to unlock the vault (session-only).');
      return;
    }
    MASTER_PASS = pass;
    try {
      await loadVault();
      refreshAllLists();
      renderLockedState(false);
      unlockBtn.style.display = 'none';
      lockBtn.style.display = '';
      vaultPassInput.value = '';
      resetInactivityTimer();
    } catch (err) {
      alert('Unable to decrypt vault data. Wrong password or corrupted data.');
      MASTER_PASS = null;
      renderLockedState(true);
      unlockBtn.style.display = '';
      lockBtn.style.display = 'none';
    }
  });

  // Lock button click: lock vault & clear data and timers
  lockBtn.addEventListener('click', () => {
    MASTER_PASS = null;
    vaultData = { medications: [], allergies: [], lifestyle: [] };
    renderLockedState(true);
    unlockBtn.style.display = '';
    lockBtn.style.display = 'none';
    clearTimeout(inactivityTimer);
    clearInterval(countdownTimer);
    countdownDisplay.style.display = 'none';
  });

  // Vault Forms setup function
  function setupForm(formId, inputSelector, listId, vaultKey) {
    const form = document.getElementById(formId);
    const list = document.getElementById(listId);
    if (!form || !list) return;

    const inputs = form.querySelectorAll(inputSelector);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isUnlocked()) {
        alert('Vault is locked. Enter your password to unlock before adding items.');
        return;
      }

      const value = Array.from(inputs).map(input => input.value.trim()).filter(v => v).join(" - ");
      if (value) {
        addItemToVault(vaultKey, value);
        form.reset();
        await saveVault();
        refreshAllLists();
      }
    });
  }

  function isUnlocked() {
    return MASTER_PASS !== null;
  }

  function refreshAllLists() {
    document.getElementById('medList').innerHTML = '';
    document.getElementById('allergyList').innerHTML = '';
    document.getElementById('lifestyleList').innerHTML = '';

    vaultData.medications.forEach(item => createListItem(item, document.getElementById('medList'), 'medications'));
    vaultData.allergies.forEach(item => createListItem(item, document.getElementById('allergyList'), 'allergies'));
    vaultData.lifestyle.forEach(item => createListItem(item, document.getElementById('lifestyleList'), 'lifestyle'));
  }

  function addItemToVault(key, value) {
    if (!vaultData[key]) vaultData[key] = [];
    vaultData[key].push(value);
  }

  function deleteItemFromVault(key, value) {
    if (!vaultData[key]) return;
    vaultData[key] = vaultData[key].filter(item => item !== value);
  }

  function updateItemInVault(key, oldValue, newValue) {
    if (!vaultData[key]) return;
    const idx = vaultData[key].indexOf(oldValue);
    if (idx !== -1) vaultData[key][idx] = newValue;
  }

  // Create list item with Edit/Delete buttons
  function createListItem(text, list, vaultKey) {
    const li = document.createElement("li");

    const spanText = document.createElement("span");
    spanText.textContent = text;
    li.appendChild(spanText);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.setAttribute('aria-label', 'Edit item');
    editBtn.style.marginLeft = "8px";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute('aria-label', 'Delete item');
    deleteBtn.style.marginLeft = "8px";

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);

    let isEditing = false;
    let inputField;

    editBtn.addEventListener("click", async () => {
      if (isEditing) return;

      isEditing = true;
      inputField = document.createElement("input");
      inputField.type = "text";
      inputField.value = spanText.textContent;
      inputField.style.flex = "1";

      li.insertBefore(inputField, spanText);
      li.removeChild(spanText);

      editBtn.textContent = "Save";
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.marginLeft = "8px";
      li.insertBefore(cancelBtn, deleteBtn);

      function cleanup() {
        isEditing = false;
        editBtn.textContent = "Edit";
        cancelBtn.remove();
        editBtn.removeEventListener("click", saveEdit);
        cancelBtn.removeEventListener("click", cancelEdit);
      }

      async function saveEdit() {
        const newValue = inputField.value.trim();
        if (newValue) {
          const oldValue = spanText.textContent;
          updateItemInVault(vaultKey, oldValue, newValue);
          spanText.textContent = newValue;
          li.insertBefore(spanText, inputField);
          li.removeChild(inputField);
          await saveVault();
          cleanup();
          refreshAllLists();
        } else {
          alert('Item cannot be empty.');
        }
      }

      function cancelEdit() {
        li.insertBefore(spanText, inputField);
        li.removeChild(inputField);
        cleanup();
      }

      editBtn.addEventListener("click", saveEdit);
      cancelBtn.addEventListener("click", cancelEdit);

      inputField.focus();

      inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit();
        else if (e.key === "Escape") cancelEdit();
      });
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm('Delete this item?')) return;
      const value = spanText.textContent;
      deleteItemFromVault(vaultKey, value);
      await saveVault();
      refreshAllLists();
    });
  }

  // Show locked or unlocked UI
  function renderLockedState(locked) {
    const wrappers = [
      { list: 'medList', note: 'medLocked' },
      { list: 'allergyList', note: 'allergyLocked' },
      { list: 'lifestyleList', note: 'lifestyleLocked' }
    ];
    wrappers.forEach(w => {
      const listEl = document.getElementById(w.list);
      const noteEl = document.getElementById(w.note);
      if (!listEl || !noteEl) return;
      if (locked) {
        listEl.innerHTML = '';
        listEl.style.display = 'none';
        noteEl.style.display = '';
      } else {
        noteEl.style.display = 'none';
        listEl.style.display = '';
      }
    });
  }

  // Vault load/save using async WebCrypto API
  async function loadVault() {
    const encryptedVault = localStorage.getItem('vault');
    if (!encryptedVault) {
      vaultData = { medications: [], allergies: [], lifestyle: [] };
      return;
    }
    const decryptedStr = await decryptData(encryptedVault, MASTER_PASS);
    vaultData = JSON.parse(decryptedStr);
  }

  async function saveVault() {
    const dataStr = JSON.stringify(vaultData);
    const encrypted = await encryptData(dataStr, MASTER_PASS);
    localStorage.setItem('vault', encrypted);
  }

  // Setup forms
  setupForm("medForm", "input", "medList", "medications");
  setupForm("allergyForm", "input", "allergyList", "allergies");
  setupForm("lifestyleForm", "input", "lifestyleList", "lifestyle");

  // Initial lock check on load
  (async function initialLockCheck() {
    const encryptedVault = localStorage.getItem('vault');
    if (encryptedVault) {
      renderLockedState(true);
      unlockBtn.style.display = '';
      lockBtn.style.display = 'none';
    } else {
      vaultData = { medications: [], allergies: [], lifestyle: [] };
      refreshAllLists();
      renderLockedState(false);
      unlockBtn.style.display = '';
      lockBtn.style.display = 'none';
    }
  })();

  // Reset notifications button (if used)
  const resetNotifBtn = document.getElementById('resetNotifBtn');
  if (resetNotifBtn) {
    resetNotifBtn.addEventListener('click', () => {
      const notifList = document.getElementById('notifList');
      if (notifList) {
        notifList.innerHTML = '';
        localStorage.removeItem('notifications');
      }
    });
  }
});

// WebCrypto helpers
async function getKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data, password) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(password, salt);
  const encodedData = enc.encode(data);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(data, password) {
  const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const key = await getKeyFromPassword(password, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
