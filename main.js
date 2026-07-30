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
        
        // Sincronizar el menú sticky si existe
        const stickyMenuBtn = document.getElementById('sticky-menu-btn');
        if (stickyMenuBtn) {
            const stickyHamburger = stickyMenuBtn.querySelector('.hamburger');
            if (stickyHamburger) {
                if (isMenuOpen) stickyHamburger.classList.add('open');
                else stickyHamburger.classList.remove('open');
            }
            stickyMenuBtn.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
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
        let v2Revealed = false;
        let v2SwitchedToRelative = false; // controla si Vista 2 ya pasó a flujo normal

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
            
            // Distancia de scroll exacta basándose en el alto del spacer
            const totalMaxScroll = zoomSpacer.offsetHeight - window.innerHeight;
            // El zoom termina exactamente al final del spacer
            const zoomMaxScroll = totalMaxScroll;
            
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
                    // NOTA: v2Revealed solo se resetea en el bloque de revert (scrollY <= 5)
                    
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
                        v2Revealed = true; // Marcar como revelada desde el inicio del autoscroll
                        smoothScrollTo(zoomMaxScroll, 1200);
                    }

                    // Aplicar transform al grupo SVG
                    const maskGroup = document.getElementById('maskTextGroup');
                    if (maskGroup) {
                        maskGroup.setAttribute('transform', `translate(${centerX}, ${currentCenterY}) scale(${scaleFactor})`);
                    }
                    
                    // El hero section NUNCA baja su opacidad para que no se mezcle de forma
                    // traslúcida con la Vista 2 (que tiene que ser 100% sólida).
                    // Al expandirse la máscara infinitamente, el mar se oculta solo.
                    if (phase2 > 0.3) {
                        heroSectionEl.style.pointerEvents = "none";
                    } else {
                        heroSectionEl.style.pointerEvents = "auto";
                    }
                    
                    // Costura perfecta de scroll y Parallax 3D
                    const isPastZoom = scrollY >= zoomMaxScroll;
                    const isPastReveal = scrollY >= totalMaxScroll;
                    

                    // ── SWITCH FIXED → RELATIVE ──
                    // Durante el zoom: Vista 2 fija (necesario para el efecto).
                    // Una vez que el zoom termina: pasa a flujo normal con margin negativo
                    // para que quede en el mismo lugar visual y luego scrollee hacia arriba
                    // como cualquier sección de la página. SIN efecto de tapar.
                    if (isPastZoom) {
                        if (!v2SwitchedToRelative) {
                            v2SwitchedToRelative = true;
                            vista2.style.position = 'relative';
                            vista2.style.marginTop = (-window.innerHeight) + 'px';
                            vista2.style.top = '';
                            vista2.style.left = '';
                            vista2.style.width = '100%';
                        }
                    } else {
                        if (v2SwitchedToRelative) {
                            v2SwitchedToRelative = false;
                            vista2.style.position = 'fixed';
                            vista2.style.top = '0';
                            vista2.style.left = '0';
                            vista2.style.width = '100%';
                            vista2.style.marginTop = '';
                        }
                    }

                    // --- ANIMACIÓN EN VISTA 2: Reveal de logo, párrafo y enlace ---
                    const v2Part2 = document.getElementById('v2-part2');
                    const v2Link = document.getElementById('v2-link-container');
                    const v2Logo = document.getElementById('v2-logo');

                    if (isPastZoom || v2Revealed) {
                        v2Revealed = true;
                        if (v2Part1) v2Part1.classList.add('hook-active');
                        if (v2Part2) v2Part2.classList.add('reveal-active');
                        if (v2Link) v2Link.classList.add('reveal-active');
                        if (v2Logo) v2Logo.classList.add('reveal-active');
                    } else {
                        if (v2Part1) v2Part1.classList.remove('hook-active');
                        if (v2Part2) v2Part2.classList.remove('reveal-active');
                        if (v2Link) v2Link.classList.remove('reveal-active');
                        if (v2Logo) v2Logo.classList.remove('reveal-active');
                    }
                }

            } else if (scrollY <= 5 && maskCreated) {
                // REVERTIR SI VOLVEMOS ARRIBA
                maskCreated = false;
                autoScrollStarted = false;
                v2Revealed = false;
                // Resetear Vista 2 a fixed para que el zoom vuelva a funcionar
                if (v2SwitchedToRelative) {
                    v2SwitchedToRelative = false;
                    vista2.style.position = 'fixed';
                    vista2.style.top = '0';
                    vista2.style.left = '0';
                    vista2.style.width = '100%';
                    vista2.style.marginTop = '';
                }
                heroCaluvaText.style.opacity = "1";
                heroSectionEl.style.mask = "none";
                heroSectionEl.style.webkitMask = "none";
                heroSectionEl.style.opacity = 1;
                heroSectionEl.style.pointerEvents = "";
                
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

    // ── MODAL: AGENDEMOS UNA CALL ──
    const callModal    = document.getElementById('call-modal');
    const btnAgendemosList = document.querySelectorAll('.btn-agendemos-trigger');
    const btnModalClose = document.getElementById('call-modal-close');
    const btnServicios  = document.getElementById('btn-servicios');

    const openModal = () => {
        if (!callModal) return;
        callModal.classList.add('active');
        callModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
        if (!callModal) return;
        callModal.classList.remove('active');
        callModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    btnAgendemosList.forEach(btn => btn.addEventListener('click', openModal));
    if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
    if (callModal) callModal.addEventListener('click', e => { if (e.target === callModal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    // Formulario: feedback visual de envío (sin backend por ahora)
    const callForm = document.getElementById('call-form');
    if (callForm) {
        callForm.addEventListener('submit', e => {
            e.preventDefault();
            const btn = callForm.querySelector('.call-form-submit');
            btn.textContent = '¡ENVIADO!';
            btn.style.opacity = '0.6';
            setTimeout(closeModal, 1200);
            setTimeout(() => { btn.textContent = 'ENVIAR'; btn.style.opacity = ''; callForm.reset(); }, 1600);
        });
    }

    // CONOCE NUESTROS SERVICIOS → scroll suave a #vista-4
    if (btnServicios) {
        btnServicios.addEventListener('click', () => {
            const vista4 = document.getElementById('vista-4');
            if (vista4) vista4.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ── CUSTOM CURSOR ──
    const cursor = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursor-follower');
    if (cursor && cursorFollower) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        });
        
        const renderCursor = () => {
            followerX += (mouseX - followerX) * 0.2;
            followerY += (mouseY - followerY) * 0.2;
            cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
            requestAnimationFrame(renderCursor);
        };
        requestAnimationFrame(renderCursor);
        
        const interactables = document.querySelectorAll('a, button, .magnetic-btn, .logo, input, textarea');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => cursorFollower.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => cursorFollower.classList.remove('cursor-hover'));
        });
    }

    // ── MAGNETIC BUTTONS ──
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });

    // ── STICKY MENU BUTTON ──
    const stickyMenuBtn = document.getElementById('sticky-menu-btn');
    if (stickyMenuBtn) {
        stickyMenuBtn.addEventListener('click', toggleMenu);
        
        window.addEventListener('scroll', () => {
            const heroHeight = document.getElementById('inicio')?.offsetHeight || window.innerHeight;
            if (window.scrollY >= heroHeight - 10) {
                stickyMenuBtn.classList.add('active');
            } else {
                stickyMenuBtn.classList.remove('active');
            }
        });
    }

});
