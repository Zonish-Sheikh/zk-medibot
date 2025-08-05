// On page load, check dismissed notifications and hide them 
window.onload = () => {
  const dismissed = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
  dismissed.forEach(text => {
    document.querySelectorAll('.notifications li').forEach(li => {
      if (li.textContent.includes(text)) {
        li.style.display = 'none';
      }
    });
  });

  updateNotificationCount();

  // Trigger fade-in animations for cards
  setupFadeInOnScroll();
};

// Dismiss notification
function dismissNotif(btn) {
  const li = btn.parentElement;
  li.style.display = 'none';
  btn.disabled = true;

  // Saves dismissed notification text in localStorage
  const dismissed = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
  dismissed.push(li.textContent.replace('Dismiss', '').trim());
  localStorage.setItem('dismissedNotifs', JSON.stringify(dismissed));

  updateNotificationCount();
}

// Reset notifications: clears localStorage and shows all notifications
function resetNotifications() {
  localStorage.removeItem('dismissedNotifs');
  
  document.querySelectorAll('.notifications li').forEach(li => {
    li.style.display = 'list-item';
    const btn = li.querySelector('button');
    if (btn) btn.disabled = false;
  });

  updateNotificationCount();
}

// Attach event listener to the reset button
document.getElementById('resetNotifBtn').addEventListener('click', resetNotifications);

// Update notification badge count
function updateNotificationCount() {
  const notificationsSection = document.querySelector('.notifications');
  const visibleNotifs = [...document.querySelectorAll('.notifications li')]
    .filter(li => li.style.display !== 'none');
  notificationsSection.setAttribute('data-count', visibleNotifs.length);
}

// Setup fade-in on scroll for cards using IntersectionObserver
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

  cards.forEach(card => {
    observer.observe(card);
  });
}
