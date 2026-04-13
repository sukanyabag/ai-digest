export function getTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('blog-theme') || 'light';
}

export function setTheme(theme) {
  localStorage.setItem('blog-theme', theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initTheme() {
  const theme = getTheme();
  setTheme(theme);
}