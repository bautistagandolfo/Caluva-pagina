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

    // ── COREOGRAFÍA ZOOM CALUVA CON MASCARA DINÁMICA JS ──
    const zoomSpacer = document.getElementById('zoom-spacer');
    const heroSectionEl = document.getElementById('inicio');
    const heroCaluvaText = document.getElementById('hero-caluva-text');
    const heroPText = document.getElementById('hero-p-text');
    const vista2 = document.getElementById('vista-2');
    
    if (zoomSpacer && heroSectionEl && heroCaluvaText && vista2) {
        let maskCreated = false;
        let yellowOverlay = null;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            // Distancia de scroll exacta basándose en el alto del spacer
            const maxScroll = zoomSpacer.offsetHeight - window.innerHeight;
            
            if (scrollY > 5) {
                
                // FASE 1: (0 a 30%) -> Desaparece lo extra y se crea la máscara
                const progress = Math.min(scrollY / maxScroll, 1);
                const phase1 = Math.min(progress / 0.3, 1);
                
                const moveY = -(phase1 * 100); 
                if (heroPText) {
                    // IMPORTANTE: Quitar la animación 'forwards' para que JS pueda cambiar opacity y transform
                    heroPText.style.animation = "none";
                    heroPText.style.transform = `translateY(${moveY}px)`;
                    heroPText.style.opacity = 1 - phase1;
                }
                if (header && !isMenuOpen) {
                    header.style.transform = `translateY(${moveY}px)`;
                    header.style.opacity = 1 - phase1;
                }
                
                // Crear la máscara dinámicamente si no existe
                if (!maskCreated && phase1 > 0.02) {
                    const rect = heroCaluvaText.getBoundingClientRect();
                    const style = window.getComputedStyle(heroCaluvaText);
                    
                    // Agregamos un fondo amarillo a vista-2 para que el hueco arranque amarillo
                    yellowOverlay = document.createElement('div');
                    yellowOverlay.style.position = 'absolute';
                    yellowOverlay.style.top = '0';
                    yellowOverlay.style.left = '0';
                    yellowOverlay.style.width = '100%';
                    yellowOverlay.style.height = '100%';
                    yellowOverlay.style.backgroundColor = style.color; // amarillo
                    yellowOverlay.style.zIndex = '9999';
                    yellowOverlay.style.pointerEvents = 'none';
                    vista2.appendChild(yellowOverlay);

                    heroCaluvaText.style.animation = "none";
                    heroCaluvaText.style.opacity = "0"; 
                    
                    heroSectionEl.dataset.originalCenterY = rect.top + (rect.height / 2);
                    
                    // Crear el contenedor SVG en el DOM
                    const svgContainer = document.createElement('div');
                    svgContainer.id = 'zoom-svg-container';
                    svgContainer.style.position = 'absolute';
                    svgContainer.style.top = '0';
                    svgContainer.style.left = '0';
                    svgContainer.style.width = '0';
                    svgContainer.style.height = '0';
                    svgContainer.style.overflow = 'hidden';
                    svgContainer.style.pointerEvents = 'none';
                    
                    const centerX = window.innerWidth / 2;
                    const centerY = rect.top + (rect.height / 2);
                    
                    // Usamos un SVG en el DOM para poder escalar el vector internamente
                    svgContainer.innerHTML = `
                    <svg>
                        <defs>
                            <mask id="dynamicVectorMask">
                                <rect width="10000" height="10000" x="-5000" y="-5000" fill="white" />
                                <g id="maskTextGroup" transform="translate(${centerX}, ${centerY}) scale(1)">
                                    <text x="0" y="0" text-anchor="middle" dominant-baseline="central" 
                                          font-family="${style.fontFamily.replace(/"/g, "'")}" 
                                          font-weight="${style.fontWeight}" 
                                          font-size="${style.fontSize}" 
                                          letter-spacing="${style.letterSpacing}" 
                                          fill="black">
                                        CALUVA
                                    </text>
                                </g>
                            </mask>
                        </defs>
                    </svg>`;
                    document.body.appendChild(svgContainer);
                    
                    // Aplicamos la máscara apuntando al ID del DOM
                    heroSectionEl.style.mask = `url(#dynamicVectorMask)`;
                    heroSectionEl.style.webkitMask = `url(#dynamicVectorMask)`;
                    
                    maskCreated = true;
                }

                // Animaciones de MÁSCARA Vectorial
                if (maskCreated) {
                    const originalCenterY = parseFloat(heroSectionEl.dataset.originalCenterY);
                    const targetCenterY = window.innerHeight / 2;
                    const centerX = window.innerWidth / 2;
                    
                    // Fase 1: Mover al centro
                    const currentCenterY = originalCenterY - (phase1 * (originalCenterY - targetCenterY));
                    
                    // Fase 2: Escala
                    let phase2 = 0;
                    if (progress > 0.3) {
                        phase2 = (progress - 0.3) / 0.7;
                    }
                    
                    if (yellowOverlay) {
                        yellowOverlay.style.opacity = 1 - Math.min(phase2 / 0.2, 1);
                    }
                    
                    // Escala progresiva y calculada para abarcar la pantalla justo al final
                    const scaleFactor = 1 + Math.pow(phase2, 4) * 60; 
                    
                    // Aplicar transform al grupo SVG
                    const maskGroup = document.getElementById('maskTextGroup');
                    if (maskGroup) {
                        maskGroup.setAttribute('transform', `translate(${centerX}, ${currentCenterY}) scale(${scaleFactor})`);
                    }
                    
                    // Desvanecer suavemente el hero en el último 10% de la fase 2
                    if (phase2 > 0.9) {
                        heroSectionEl.style.opacity = 1 - ((phase2 - 0.9) / 0.1);
                    } else {
                        heroSectionEl.style.opacity = 1;
                    }
                    
                    // Costura perfecta de scroll
                    const isPastZoom = scrollY >= maxScroll;
                    if (isPastZoom) {
                        vista2.style.position = "relative";
                        vista2.style.zIndex = "100";
                        // Eliminamos el hueco en blanco creado por el spacer
                        vista2.style.marginTop = "-100vh";
                    } else {
                        vista2.style.position = "fixed";
                        vista2.style.zIndex = "1";
                        vista2.style.marginTop = "0";
                    }
                }

            } else if (scrollY <= 5 && maskCreated) {
                // REVERTIR SI VOLVEMOS ARRIBA
                maskCreated = false;
                heroCaluvaText.style.opacity = "1";
                heroSectionEl.style.mask = "none";
                heroSectionEl.style.webkitMask = "none";
                heroSectionEl.style.opacity = 1;
                
                if (yellowOverlay) {
                    yellowOverlay.remove();
                    yellowOverlay = null;
                }
                const svgCont = document.getElementById('zoom-svg-container');
                if (svgCont) svgCont.remove();
                
                if (heroPText) {
                    heroPText.style.transform = `translateY(0)`;
                    heroPText.style.opacity = 1;
                }
                const headerEl = document.getElementById('mainHeader');
                if (headerEl) {
                    headerEl.style.transform = `translateY(0)`;
                    headerEl.style.opacity = 1;
                }
            }
        }, { passive: true });
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
