document.addEventListener('DOMContentLoaded', () => {
  // Health ring animation
  const circle = document.querySelector('.progress-ring-circle');
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  const healthScoreText = document.getElementById('healthScoreText');

  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;

  // Animate health score ring
  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    healthScoreText.textContent = `${percent}%`;
  }

  // Animate from 0 to 75
  let currentPercent = 0;
  const targetPercent = 75;
  const animationDuration = 2000;
  const intervalDuration = 20;
  const step = (targetPercent / (animationDuration / intervalDuration));

  const progressInterval = setInterval(() => {
    currentPercent += step;
    if (currentPercent >= targetPercent) {
      currentPercent = targetPercent;
      clearInterval(progressInterval);
    }
    setProgress(Math.round(currentPercent));
  }, intervalDuration);

  // Notifications dismiss function
  window.dismissNotif = function (btn) {
    const li = btn.closest('li');
    if (!li) return;
    li.classList.add('fade-out');
    li.setAttribute('aria-hidden', 'true');
    // Update notifications count attribute after fade-out
    setTimeout(() => {
      li.style.display = 'none';
      updateNotificationCount();
    }, 400);
  };

  // Update notification count on the notifications section
  function updateNotificationCount() {
    const notifSection = document.querySelector('.notifications');
    const visibleNotifs = notifSection.querySelectorAll('li:not([aria-hidden="true"])');
    notifSection.setAttribute('data-count', visibleNotifs.length);
  }

  // Reset notifications button functionality
  const resetBtn = document.getElementById('resetNotifBtn');
  resetBtn.addEventListener('click', () => {
    const notifSection = document.querySelector('.notifications');
    const allNotifs = notifSection.querySelectorAll('li');
    allNotifs.forEach(li => {
      li.classList.remove('fade-out');
      li.style.display = '';
      li.removeAttribute('aria-hidden');
    });
    updateNotificationCount();
  });

  // Sticky nav bar on scroll
  const nav = document.querySelector('.main-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      nav.classList.add('sticky-active');
    } else {
      nav.classList.remove('sticky-active');
    }
  });

  // Fade in cards sequentially
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add('fade-in'), i * 350);
  });
});
