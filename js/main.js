window.onload = () => {
  // Hide dismissed notifications saved in localStorage
  const dismissed = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
  dismissed.forEach(text => {
    document.querySelectorAll('.notifications li').forEach(li => {
      if (li.textContent.includes(text)) {
        li.style.display = 'none';
      }
    });
  });

  updateNotificationCount();

  // Setup fade-in on scroll animations for cards
  setupFadeInOnScroll();

  // Attach event listener to reset button inside onload to ensure element exists
  const resetBtn = document.getElementById('resetNotifBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetNotifications);
  }

  // Setup sticky nav shadow toggling on scroll
  const nav = document.querySelector('.main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        nav.classList.add('sticky-active');
      } else {
        nav.classList.remove('sticky-active');
      }
    });
  }

  // *** NEW: Update Health Ring Progress ***
  const circle = document.querySelector('.progress-ring-circle');
  if (circle) {
    const radius = circle.r.baseVal.value; // usually 40
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`; // start at 0%

    function setProgress(percent) {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    const healthScoreText = document.querySelector('.health-score-text');
    let healthPercent = 84; // default fallback
    if (healthScoreText) {
      const text = healthScoreText.textContent.trim().replace('%', '');
      const parsed = parseInt(text, 10);
      if (!isNaN(parsed)) healthPercent = parsed;
    }

    setProgress(healthPercent);
  }
};

// Dismiss notification handler (called inline)
function dismissNotif(btn) {
  const li = btn.parentElement;

  // Add fade-out class for smooth transition
  li.classList.add('fade-out');

  // Disable button immediately to prevent multiple clicks
  btn.disabled = true;

  // After fade-out transition ends, hide completely and save dismissal
  li.addEventListener('transitionend', () => {
    li.style.display = 'none';

    // Save dismissed notification text
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
    dismissed.push(li.textContent.replace('Dismiss', '').trim());
    localStorage.setItem('dismissedNotifs', JSON.stringify(dismissed));

    updateNotificationCount();
  }, { once: true }); // only once per dismissal
}

// Reset notifications: clear localStorage and show all notifications again
function resetNotifications() {
  localStorage.removeItem('dismissedNotifs');

  document.querySelectorAll('.notifications li').forEach(li => {
    li.style.display = 'list-item';
    li.classList.remove('fade-out');
    const btn = li.querySelector('button');
    if (btn) btn.disabled = false;
  });

  updateNotificationCount();
}

// Update the notification count badge attribute
function updateNotificationCount() {
  const notificationsSection = document.querySelector('.notifications');
  const visibleNotifs = [...document.querySelectorAll('.notifications li')].filter(li => li.style.display !== 'none');
  notificationsSection.setAttribute('data-count', visibleNotifs.length);
}

// Setup fade-in animation on scroll using IntersectionObserver
function setupFadeInOnScroll() {
  const cards = document.querySelectorAll('.card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));
}
