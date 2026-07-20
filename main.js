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
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => { 
            if (isMenuOpen) toggleMenu(); 
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetEl = document.querySelector(targetId);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

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

    // 🎬 EFECTO ZOOM SIMPLE Y FUNDIDO DE MAR (Transición CALUVA al bajar) 🎬
    if (document.getElementById('hero-caluva-text')) {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#inicio",
                start: "top top",
                end: "+=200%", // Dura 2 pantallas para que sea suave
                pin: true,     // Fija la sección inicio
                scrub: 1       // Suavizado del scrub
            }
        });

        // 1. Desvanece el texto de arriba ("CREEMOS QUE...") y el header (opcional) rápidamente
        tl.to("#hero-p", { opacity: 0, duration: 0.1 }, 0);
        tl.to("#mainHeader", { opacity: 0, duration: 0.1 }, 0);

        // 2. Aumenta el texto CALUVA (mantiene su color crema y llena la pantalla)
        tl.to("#hero-caluva-text", {
            scale: 80, // Se vuelve gigante
            ease: "power2.inOut",
            duration: 1
        }, 0);

        // 3. El mar de fondo (video) se va difuminando
        // Como #inicio tiene background: var(--color-cream); el video se funde con el crema.
        tl.to(".hero-background", {
            opacity: 0,
            ease: "power2.inOut",
            duration: 1
        }, 0);
    }

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
