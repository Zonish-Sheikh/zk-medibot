function dismissNotif(btn) {
  const li = btn.parentElement;
  li.style.textDecoration = "line-through";
  li.style.opacity = "0.6";
  btn.disabled = true;
}
