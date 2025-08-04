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
};

function dismissNotif(btn) {
  const li = btn.parentElement;
  li.style.display = 'none';
  btn.disabled = true;

  // Saves dismissed notification text in localStorage
  const dismissed = JSON.parse(localStorage.getItem('dismissedNotifs') || '[]');
  dismissed.push(li.textContent.replace('Dismiss', '').trim());
  localStorage.setItem('dismissedNotifs', JSON.stringify(dismissed));
}

// Reset notifications: clears localStorage and shows all notifications
function resetNotifications() {
  localStorage.removeItem('dismissedNotifs');
  
  document.querySelectorAll('.notifications li').forEach(li => {
    li.style.display = 'list-item';
    const btn = li.querySelector('button');
    if (btn) btn.disabled = false;
  });
}

// Attach event listener to the reset button
document.getElementById('resetNotifBtn').addEventListener('click', resetNotifications);

