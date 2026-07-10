document.addEventListener('DOMContentLoaded', () => {
    const menuToggle   = document.getElementById('menuToggle');
    const fullscreenMenu = document.getElementById('fullscreenMenu');
    const menuLinks    = document.querySelectorAll('.menu-link');
    const header       = document.getElementById('mainHeader');
    const heroSection  = document.getElementById('inicio');
    let isMenuOpen = false;

    // ── MENU ──
    const toggleMenu = () => {
        isMenuOpen = !isMenuOpen;
        fullscreenMenu.classList.toggle('active');
        const toggleText = menuToggle.querySelector('.menu-text');
        const hamburger = menuToggle.querySelector('.hamburger');
        
        if (isMenuOpen) {
            hamburger.classList.add('open');
            toggleText.textContent = 'CERRAR';
            menuToggle.style.color = 'var(--color-brown)';
        } else {
            hamburger.classList.remove('open');
            toggleText.textContent = 'MENU';
            menuToggle.style.color = '';
            checkHeaderColor();
        }
    };
    menuToggle.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => link.addEventListener('click', () => { if (isMenuOpen) toggleMenu(); }));

    // ── HEADER: OCULTAR al instante cuando termina el hero ──
    const checkHeaderColor = () => {
        if (isMenuOpen) return;
        const heroHeight = heroSection.offsetHeight;
        const scrolled = window.scrollY;
        if (scrolled >= heroHeight - 10) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
    };
    window.addEventListener('scroll', checkHeaderColor, { passive: true });
    checkHeaderColor();

    // ── REVEAL ON SCROLL ──
    const revealElements = document.querySelectorAll('.reveal-section');
    const revealItems    = document.querySelectorAll('.ri');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Observe secciones completas
    revealElements.forEach(el => observer.observe(el));

    // Observe elementos individuales con un pequeño delay adicional
    const itemObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Delay escalonado según el orden dentro del viewport
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, 100);
                itemObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealItems.forEach(el => itemObserver.observe(el));
});
