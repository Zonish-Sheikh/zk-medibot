// main.js - with basic password-based AES encryption for vault lists
let MASTER_PASS = null; // session-only, do NOT store this in localStorage

document.addEventListener('DOMContentLoaded', () => {
  // Health Ring Animation (unchanged)
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
      if (progress >= target) {
        clearInterval(interval);
      } else {
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

  // Auth UI (unlock/lock)
  const unlockBtn = document.getElementById('unlockBtn');
  const lockBtn = document.getElementById('lockBtn');
  const vaultPassInput = document.getElementById('vaultPass');

  unlockBtn.addEventListener('click', () => {
    const pass = vaultPassInput.value.trim();
    if (!pass) {
      alert('Please enter a password to unlock the vault (session-only).');
      return;
    }
    MASTER_PASS = pass;
    // Attempt to load/decrypt lists
    refreshAllLists();
    unlockBtn.style.display = 'none';
    lockBtn.style.display = '';
    vaultPassInput.value = '';
  });

  lockBtn.addEventListener('click', () => {
    MASTER_PASS = null;
    // Clear visible lists (hide data) — show locked notes
    renderLockedState(true);
    unlockBtn.style.display = '';
    lockBtn.style.display = 'none';
  });

  // Vault Forms setup function
  function setupForm(formId, inputSelector, listId, storageKey) {
    const form = document.getElementById(formId);
    const list = document.getElementById(listId);
    if (!form || !list) return; // Skip if not on vault page

    const inputs = form.querySelectorAll(inputSelector);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // If locked, require unlock first
      if (!isUnlocked()) {
        alert('Vault is locked. Enter your password to unlock before adding items.');
        return;
      }

      const value = Array.from(inputs).map(input => input.value.trim()).filter(v => v).join(" - ");
      if (value) {
        createListItem(value, list, storageKey);
        saveListToStorage(list, storageKey);
        form.reset();
      }
    });

    // do not auto-load here; do full load via refreshAllLists()
  }

  function isUnlocked() {
    return MASTER_PASS !== null;
  }

  function refreshAllLists() {
    // Clear current DOM lists
    document.getElementById('medList').innerHTML = '';
    document.getElementById('allergyList').innerHTML = '';
    document.getElementById('lifestyleList').innerHTML = '';

    // Attempt to load data for each list (will decrypt if MASTER_PASS set)
    const medList = document.getElementById('medList');
    const allergyList = document.getElementById('allergyList');
    const lifestyleList = document.getElementById('lifestyleList');

    // Load lists; loadListFromStorage will decide whether to show locked notes
    loadListFromStorage(medList, 'medications', 'med');
    loadListFromStorage(allergyList, 'allergies', 'allergy');
    loadListFromStorage(lifestyleList, 'lifestyle', 'lifestyle');
  }

  // Encryption helpers using CryptoJS
  function encryptItems(items) {
    if (!MASTER_PASS) return null;
    const json = JSON.stringify(items);
    return CryptoJS.AES.encrypt(json, MASTER_PASS).toString();
  }

  function decryptItems(ciphertext) {
    if (!MASTER_PASS) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, MASTER_PASS);
      const txt = bytes.toString(CryptoJS.enc.Utf8);
      if (!txt) return null;
      return JSON.parse(txt);
    } catch (err) {
      return null;
    }
  }

  // Save list items to localStorage (encrypt if MASTER_PASS present)
  function saveListToStorage(listElement, key) {
    const items = Array.from(listElement.children).map(li =>
      li.querySelector("span").textContent
    );
    if (MASTER_PASS) {
      const cipher = encryptItems(items);
      localStorage.setItem(key, cipher);
    } else {
      // fallback: store plain JSON (legacy behavior)
      localStorage.setItem(key, JSON.stringify(items));
    }
  }

  // Load from localStorage (tries decrypt if MASTER_PASS present)
  // wrapperId: optional short id used to control locked note element suffix (e.g. 'med' -> medLocked)
  function loadListFromStorage(listElement, key, wrapperId = '') {
    const raw = localStorage.getItem(key);
    const lockedNote = wrapperId ? document.getElementById(`${wrapperId}Locked`) : null;

    // If no data, show empty (not locked)
    if (!raw) {
      if (lockedNote) lockedNote.style.display = 'none';
      listElement.style.display = '';
      return;
    }

    // If master pass is present, try decrypt
    if (MASTER_PASS) {
      const decrypted = decryptItems(raw);
      if (decrypted) {
        // Successfully decrypted
        if (lockedNote) lockedNote.style.display = 'none';
        listElement.style.display = '';
        decrypted.forEach(item => createListItem(item, listElement, key));
        return;
      } else {
        // Could not decrypt. Maybe raw is plain JSON (legacy). Try JSON.parse
        try {
          const plain = JSON.parse(raw);
          if (Array.isArray(plain)) {
            // We have plain data: re-encrypt immediately to secure it
            if (lockedNote) lockedNote.style.display = 'none';
            listElement.style.display = '';
            plain.forEach(item => createListItem(item, listElement, key));
            // re-save encrypted
            const cipher = encryptItems(plain);
            if (cipher) localStorage.setItem(key, cipher);
            return;
          }
        } catch (e) {
          // not JSON — show error
        }

        // If we reach here, raw couldn't be decrypted nor parsed. Show locked state and warn
        if (lockedNote) {
          lockedNote.style.display = '';
          listElement.style.display = 'none';
        }
        alert(`Unable to decrypt some vault data (key="${key}"). Wrong password or data corrupted.`);
        return;
      }
    } else {
      // No MASTER_PASS: try parse plain JSON (legacy)
      try {
        const plain = JSON.parse(raw);
        if (Array.isArray(plain)) {
          if (lockedNote) lockedNote.style.display = 'none';
          listElement.style.display = '';
          plain.forEach(item => createListItem(item, listElement, key));
          return;
        }
      } catch (e) {
        // raw is not plain JSON => data is encrypted but we have no password
        if (lockedNote) lockedNote.style.display = '';
        listElement.style.display = 'none';
        return;
      }
    }
  }

  // Render locked/cleared state: hide lists and show locked note
  function renderLockedState(locked) {
    const wrappers = [
      {list: 'medList', note: 'medLocked'},
      {list: 'allergyList', note: 'allergyLocked'},
      {list: 'lifestyleList', note: 'lifestyleLocked'}
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

  // Full createListItem function with Edit + Delete buttons & handlers
  function createListItem(text, list, storageKey) {
    const li = document.createElement("li");

    const spanText = document.createElement("span");
    spanText.textContent = text;
    li.appendChild(spanText);

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.setAttribute('aria-label', 'Edit item');
    editBtn.style.marginLeft = "8px";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute('aria-label', 'Delete item');
    deleteBtn.style.marginLeft = "8px";

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);

    let isEditing = false;
    let inputField;

    editBtn.addEventListener("click", () => {
      if (isEditing) return; // Prevent multiple edits at once

      isEditing = true;
      // Replace span with input
      inputField = document.createElement("input");
      inputField.type = "text";
      inputField.value = spanText.textContent;
      inputField.style.flex = "1";

      li.insertBefore(inputField, spanText);
      li.removeChild(spanText);

      // Change Edit button to Save and add Cancel button
      editBtn.textContent = "Save";
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.marginLeft = "8px";
      li.insertBefore(cancelBtn, deleteBtn);

      // Save handler
      function saveEdit() {
        const newValue = inputField.value.trim();
        if (newValue) {
          spanText.textContent = newValue;
          li.insertBefore(spanText, inputField);
          li.removeChild(inputField);
          cleanup();
          saveListToStorage(list, storageKey);
        } else {
          alert('Item cannot be empty.');
        }
      }

      // Cancel handler
      function cancelEdit() {
        li.insertBefore(spanText, inputField);
        li.removeChild(inputField);
        cleanup();
      }

      // Cleanup after save or cancel
      function cleanup() {
        isEditing = false;
        editBtn.textContent = "Edit";
        cancelBtn.remove();
        editBtn.removeEventListener("click", saveEdit);
        cancelBtn.removeEventListener("click", cancelEdit);
      }

      editBtn.addEventListener("click", saveEdit);
      cancelBtn.addEventListener("click", cancelEdit);

      inputField.focus();

      // Handle keyboard events
      inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          saveEdit();
        } else if (e.key === "Escape") {
          cancelEdit();
        }
      });
    });

    deleteBtn.addEventListener("click", () => {
      if (!confirm('Delete this item?')) return;
      list.removeChild(li);
      saveListToStorage(list, storageKey);
    });
  }

  // Initialize the vault forms only if they exist
  setupForm("medForm", "input", "medList", "medications");
  setupForm("allergyForm", "input", "allergyList", "allergies");
  setupForm("lifestyleForm", "input", "lifestyleList", "lifestyle");

  // On initial load: if there is encrypted data and MASTER_PASS is null, show locked view
  // We'll check each key to see if data looks encrypted
  (function initialLockCheck() {
    const keys = ['medications', 'allergies', 'lifestyle'];
    let anyEncrypted = false;
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      // quick heuristic: encrypted strings in our flow won't be valid JSON arrays, try parse
      try {
        JSON.parse(raw);
        // parsed OK -> plain JSON
      } catch (e) {
        // not JSON -> likely encrypted
        anyEncrypted = true;
      }
    }
    if (anyEncrypted) {
      renderLockedState(true);
      unlockBtn.style.display = '';
      lockBtn.style.display = 'none';
    } else {
      // load plain data (no master password)
      refreshAllLists();
      unlockBtn.style.display = '';
      lockBtn.style.display = 'none';
    }
  })();

  // Reset notifications button (if used elsewhere)
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
