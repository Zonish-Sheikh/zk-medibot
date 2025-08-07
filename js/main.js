document.addEventListener('DOMContentLoaded', () => {
  // Health Ring Animation (run only if elements exist)
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

  // Vault Forms setup function
  function setupForm(formId, inputSelector, listId, storageKey) {
    const form = document.getElementById(formId);
    const list = document.getElementById(listId);
    if (!form || !list) return; // Skip if not on vault page

    const inputs = form.querySelectorAll(inputSelector);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = Array.from(inputs).map(input => input.value.trim()).filter(v => v).join(" - ");
      if (value) {
        createListItem(value, list, storageKey);
        saveListToStorage(list, storageKey);
        form.reset();
      }
    });

    loadListFromStorage(list, storageKey);
  }

  function createListItem(text, list, storageKey) {
    const li = document.createElement("li");
    const spanText = document.createElement("span");
    spanText.textContent = text;
    li.appendChild(spanText);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      list.removeChild(li);
      saveListToStorage(list, storageKey);
    });

    li.appendChild(deleteBtn);
    list.appendChild(li);
  }

  function saveListToStorage(listElement, key) {
    const items = Array.from(listElement.children).map(li =>
      li.querySelector("span").textContent
    );
    localStorage.setItem(key, JSON.stringify(items));
  }

  function loadListFromStorage(listElement, key) {
    const data = JSON.parse(localStorage.getItem(key)) || [];
    data.forEach(item => createListItem(item, listElement, key));
  }

  // Initialize the vault forms only if they exist
  setupForm("medForm", "input", "medList", "medications");
  setupForm("allergyForm", "input", "allergyList", "allergies");
  setupForm("lifestyleForm", "input", "lifestyleList", "lifestyle");
});
