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

    // ── COREOGRAFÍA ZOOM CALUVA CON MASCARA DINÁMICA JS ──
    const zoomSpacer = document.getElementById('zoom-spacer');
    const heroSectionEl = document.getElementById('inicio');
    const heroCaluvaText = document.getElementById('hero-caluva-text');
    const heroPText = document.getElementById('hero-p-text');
    const vista2 = document.getElementById('vista-2');
    
    // Variables para el Autoscroll
    let isAutoScrolling = false;
    let autoScrollStarted = false;

    // Función de easing cúbico para un scroll muy cinematográfico
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function smoothScrollTo(targetY, duration) {
        isAutoScrolling = true;
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startTime = performance.now();

        function step(currentTime) {
            const timeElapsed = currentTime - startTime;
            let progress = timeElapsed / duration;
            if (progress > 1) progress = 1;

            const easeProgress = easeInOutCubic(progress);
            window.scrollTo(0, startY + (distance * easeProgress));

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                isAutoScrolling = false; // Liberamos el control al usuario
            }
        }
        requestAnimationFrame(step);
    }
    
    if (zoomSpacer && heroSectionEl && heroCaluvaText && vista2) {
        let maskCreated = false;
        let yellowOverlay = null;

        // Preparar "El Gancho" (Staggered Text Reveal)
        const v2Part1 = document.getElementById('v2-part1');
        if (v2Part1) {
            const words = v2Part1.innerText.split(' ');
            v2Part1.innerHTML = '';
            words.forEach((word, index) => {
                const wrap = document.createElement('span');
                wrap.className = 'word-wrap';
                
                const inner = document.createElement('span');
                inner.className = 'word-inner';
                // Agregamos un delay progresivo para cada palabra
                inner.style.transitionDelay = `${index * 0.05}s`;
                inner.innerText = word + '\u00A0';
                
                wrap.appendChild(inner);
                v2Part1.appendChild(wrap);
            });
        }

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            // Distancia de scroll exacta basándose en el alto del spacer (450vh ahora)
            const totalMaxScroll = zoomSpacer.offsetHeight - window.innerHeight;
            // El zoom termina a los 2.5vh (lo que antes era el 100%)
            const zoomMaxScroll = (2.5 / 3.5) * totalMaxScroll;
            
            if (scrollY > 5) {
                
                // FASE 1: (0 a 30% del zoomMaxScroll) -> Desaparece lo extra y se crea la máscara
                const zoomProgress = Math.min(scrollY / zoomMaxScroll, 1);
                const phase1 = Math.min(zoomProgress / 0.3, 1);
                
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
                    heroSectionEl.dataset.targetCenterY = window.innerHeight / 2;
                    heroSectionEl.dataset.centerX = window.innerWidth / 2;
                    
                    // Crear el contenedor SVG en el DOM
                    const svgContainer = document.createElement('div');
                    svgContainer.id = 'zoom-svg-container';
                    svgContainer.style.position = 'fixed';
                    svgContainer.style.top = '0';
                    svgContainer.style.left = '0';
                    svgContainer.style.width = '1px';
                    svgContainer.style.height = '1px';
                    svgContainer.style.opacity = '0.01';
                    svgContainer.style.zIndex = '-1';
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
                                    <text x="0" y="0" dy="0.35em" text-anchor="middle"
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
                    const targetCenterY = parseFloat(heroSectionEl.dataset.targetCenterY);
                    const centerX = parseFloat(heroSectionEl.dataset.centerX);
                    
                    // Fase 1: Mover al centro
                    const currentCenterY = originalCenterY - (phase1 * (originalCenterY - targetCenterY));
                    
                    // Resetear autoScrollStarted si el usuario sube
                    if (zoomProgress < 0.25) {
                        autoScrollStarted = false;
                    }
                    
                    // Fase 2: Escala
                    let phase2 = 0;
                    if (zoomProgress > 0.3) {
                        phase2 = (zoomProgress - 0.3) / 0.7;
                    }
                    
                    if (yellowOverlay) {
                        yellowOverlay.style.opacity = 1 - Math.min(phase2 / 0.2, 1);
                    }
                    
                    // Escala progresiva y calculada para abarcar la pantalla justo al final
                    const scaleFactor = 1 + Math.pow(phase2, 4) * 60; 
                    
                    // --- AUTO SCROLL TRIGGER ---
                    if (zoomProgress > 0.32 && !autoScrollStarted) {
                        autoScrollStarted = true;
                        // Hacemos scroll suave hasta zoomMaxScroll en 1.2 segundos
                        smoothScrollTo(zoomMaxScroll, 1200);
                    }

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
                    
                    // Costura perfecta de scroll y Parallax 3D
                    const isPastZoom = scrollY >= zoomMaxScroll;
                    const isPastReveal = scrollY >= totalMaxScroll;
                    
                    // --- EL GANCHO ---
                    // Se activa cuando la máscara está desapareciendo (ej. 80% del zoom)
                    if (v2Part1) {
                        v2Part1.classList.toggle('hook-active', zoomProgress >= 0.8 || isPastZoom);
                    }

                    if (isPastReveal) {
                        // --- STACKING PAGES ---
                        // Calculamos cuánto hemos scrolleado DENTRO de Vista 3
                        const overlapScroll = scrollY - totalMaxScroll;
                        const vh = window.innerHeight;
                        
                        if (overlapScroll <= vh) {
                            // Fase de Overlap: Vista 3 está subiendo y cubriendo a Vista 2
                            vista2.style.position = "fixed";
                            vista2.style.zIndex = "1";
                            vista2.style.marginTop = "0";
                            vista2.style.visibility = "visible";
                            
                            // Fade out en los últimos 150px para evitar que se asome por debajo de la sombra
                            const fadeStart = vh - 150;
                            if (overlapScroll > fadeStart) {
                                vista2.style.opacity = Math.max(1 - ((overlapScroll - fadeStart) / 150), 0);
                            } else {
                                vista2.style.opacity = 1;
                            }
                        } else {
                            // Vista 3 ya cubrió completamente a Vista 2. 
                            vista2.style.position = "fixed";
                            vista2.style.zIndex = "1";
                            vista2.style.marginTop = "0";
                            vista2.style.visibility = "hidden"; 
                            vista2.style.opacity = 0;
                        }
                    } else {
                        // Comportamiento normal en Vista 2
                        vista2.style.position = "fixed";
                        vista2.style.zIndex = "1";
                        vista2.style.marginTop = "0";
                        vista2.style.visibility = "visible";
                        vista2.style.opacity = 1;
                    }

                    // --- ANIMACIÓN "PA PA PA" EN VISTA 2 (Scroll Triggers + Adrenalina) ---
                    const v2Part2 = document.getElementById('v2-part2');
                    const v2Link = document.getElementById('v2-link-container');
                    const v2YellowBg = document.getElementById('v2-yellow-bg');
                    const v2Bottom = document.getElementById('v2-bottom-bg');
                    const v2Logo = document.getElementById('v2-logo');

                    if (isPastZoom) {
                        // El usuario scrollea dentro del 100vh extra
                        const revealProgress = Math.min(Math.max((scrollY - zoomMaxScroll) / (totalMaxScroll - zoomMaxScroll), 0), 1);
                        
                        // 1. Textos entran con adrenalina (spring) por clase CSS
                        if (v2Part2) {
                            const showPart2 = revealProgress >= 0.10;
                            v2Part2.classList.toggle('reveal-active', showPart2);
                        }
                        
                        if (v2Link) v2Link.classList.toggle('reveal-active', revealProgress >= 0.30);
                        
                        // 2. Fondo amarillo Sube físicamente a medida que deslizamos (Scrubbing)
                        // Inicia fuera de pantalla (100%) y sube hasta 0% entre el 30% y el 80% del scroll
                        if (v2YellowBg) {
                            const bgProgress = Math.min(Math.max((revealProgress - 0.3) / 0.5, 0), 1);
                            v2YellowBg.style.transform = `translateY(${(1 - bgProgress) * 100}%)`;
                        }
                        
                        // 3. Botón y logo explotan (Adrenalina) cuando el fondo ya subió casi del todo
                        if (v2Bottom) v2Bottom.classList.toggle('reveal-active', revealProgress >= 0.70);
                        if (v2Logo) v2Logo.classList.toggle('reveal-active', revealProgress >= 0.70);
                        
                    } else {
                        // Antes del zoom, todo apagado y fondo abajo
                        if (v2Part2) v2Part2.classList.remove('reveal-active');
                        if (v2Link) v2Link.classList.remove('reveal-active');
                        if (v2YellowBg) v2YellowBg.style.transform = `translateY(100%)`;
                        if (v2Bottom) v2Bottom.classList.remove('reveal-active');
                        if (v2Logo) v2Logo.classList.remove('reveal-active');
                    }
                }

            } else if (scrollY <= 5 && maskCreated) {
                // REVERTIR SI VOLVEMOS ARRIBA
                maskCreated = false;
                autoScrollStarted = false;
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

    // --- SCROLL REVEAL (INTERSECTION OBSERVER) ---
    const srOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const srObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('sr-active');
                observer.unobserve(entry.target);
            }
        });
    }, srOptions);

    document.querySelectorAll('.sr-item').forEach(el => {
        srObserver.observe(el);
    });

});
