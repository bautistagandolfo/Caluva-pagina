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
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            // 1. ANIMACIÓN INICIAL (Blindaje de Reconstrucción)
            // Esperamos a que la entrada termine ANTES de crear el ScrollTrigger. 
            // Esto le asegura a GSAP que grabe el "100% reconstruido" real (opacidad 1, y 0).
            const initTl = gsap.timeline({
                onComplete: () => {
                    initHeroScroll();
                }
            });
            initTl.fromTo("#hero-p", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 0);
            initTl.fromTo("#hero-caluva-text", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 0.3);

            function initHeroScroll() {
                // Niveles de profundidad para que #vista-2 asome libremente por detrás
                gsap.set("#inicio", { zIndex: 10, position: "relative" });
                gsap.set("#vista-2", { zIndex: 5, position: "relative" });

                // 2. EL ANCLA VISUAL (#inicio)
                const scrubTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: "#inicio",
                        start: "top top",
                        end: "+=200%", // EXACTAMENTE 200vh de anclaje (depende dinámicamente de tu pantalla)
                        pin: true,
                        pinSpacing: false, // Permite que la vista-2 suba naturalmente por el fondo
                        scrub: 1
                    }
                });
                
                // La primera mitad del anclaje (los primeros 100vh de scroll) movemos CALUVA al centro
                scrubTl.to("#hero-p, #mainHeader", { opacity: 0, duration: 0.5 }, 0);
                scrubTl.to("#hero-caluva-text", {
                    y: () => {
                        const el = document.getElementById('hero-caluva-text');
                        return -(window.innerHeight / 2 - el.offsetHeight / 2); 
                    },
                    ease: "none", 
                    duration: 0.5
                }, 0);
                // Rellenamos el timeline vacío hasta 1.0 para que la animación ocupe EXACTAMENTE el 50% inicial
                scrubTl.set({}, {}, 1.0);

                // 3. LA TRAMPA DE INERCIA Y TRANSICIÓN (#vista-2)
                ScrollTrigger.create({
                    trigger: "#vista-2",
                    start: "top top", // Ocurre matemáticamente en el centro de la transición anterior (a los 100vh exactos)
                    end: "+=1200", // Pinea la vista 2 creando un "colchón" de scroll. Impide llegar a la vista 3.
                    pin: true, 
                    pinSpacing: true, // Empuja todo lo demás hacia abajo
                    onEnter: () => {
                        // Transición Automática: CALUVA toma la pantalla, el mar se desvanece
                        gsap.to("#hero-caluva-text", { scale: 150, duration: 1.2, ease: "power2.inOut" });
                        gsap.to("#inicio", { autoAlpha: 0, duration: 1.2, ease: "power2.inOut" });
                    },
                    onLeaveBack: () => {
                        // RECONSTRUCCIÓN 100% AL VOLVER ARRIBA
                        // IMPORTANTE: Solo matamos la escala y opacidad, SIN matar la posición Y que controla el scrub
                        gsap.killTweensOf("#hero-caluva-text", "scale");
                        gsap.killTweensOf("#inicio", "opacity,visibility,autoAlpha");
                        
                        gsap.to("#hero-caluva-text", { scale: 1, duration: 0.8, ease: "power2.out" });
                        gsap.to("#inicio", { autoAlpha: 1, duration: 0.8, ease: "power2.out" });
                    }
                });
            }
        }
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
