export function detectColorScheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(dark: boolean, doc: Document = document): void {
  doc.body.classList.toggle('dark', dark);

  const darkIcon = doc.getElementById('theme-icon-dark');
  const lightIcon = doc.getElementById('theme-icon-light');
  if (darkIcon) darkIcon.style.display = dark ? 'block' : 'none';
  if (lightIcon) lightIcon.style.display = dark ? 'none' : 'block';
}

export function getCurrentTheme(doc: Document = document): 'dark' | 'light' {
  return doc.body.classList.contains('dark') ? 'dark' : 'light';
}

export function toggleTheme(isDark: boolean): boolean {
  return !isDark;
}
