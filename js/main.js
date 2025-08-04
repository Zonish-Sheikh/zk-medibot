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
