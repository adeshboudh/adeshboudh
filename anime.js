// Nav scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// Scroll reveal with IntersectionObserver
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const delay = parseFloat(entry.target.dataset.delay || 0);
      setTimeout(() => {
        entry.target.style.animationDelay = `${delay}s`;
        const dirs = ['from-left','from-right','from-below'];
        const hasDir = dirs.some(d => entry.target.classList.contains(d));
        if (!hasDir) entry.target.classList.add('from-below');
      }, delay * 1000);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revealObs.observe(el));

// One Piece torch reveal — CSS mask follows mouse via custom properties
const opOverlay = document.getElementById('op-overlay');
document.addEventListener('mousemove', (e) => {
  opOverlay.style.setProperty('--mx', e.pageX + 'px');
  opOverlay.style.setProperty('--my', e.pageY + 'px');
});

// Stagger children of grid sections
document.querySelectorAll('.fruits-grid .fruit-card, .islands .island-card').forEach((el, i) => {
  el.dataset.delay = (i % 4) * 0.08;
});