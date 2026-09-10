// Fix Bug 2: Siempre empezar desde el top al cargar index.html
// Esto evita que el browser restaure una posición de scroll intermedia
// que rompería la secuencia de animación del hero.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle   = document.getElementById('menuToggle');
    const fullscreenMenu = document.getElementById('fullscreenMenu');
    const menuLinks    = document.querySelectorAll('.menu-link');
    const header       = document.getElementById('mainHeader');
    const heroSection  = document.getElementById('inicio');
    let isMenuOpen = false;

    // Respetar la preferencia de movimiento reducido del sistema operativo
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

    // ── MENU ──
    let menuTriggerEl = null; // botón que abrió el menú, para devolverle el foco al cerrar

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

        // Accesibilidad: estado, foco y bloqueo de scroll de fondo
        fullscreenMenu.setAttribute('aria-hidden', isMenuOpen ? 'false' : 'true');
        fullscreenMenu.inert = !isMenuOpen;
        menuToggle.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';

        if (isMenuOpen) {
            const firstLink = fullscreenMenu.querySelector('.menu-link');
            if (firstLink) { try { firstLink.focus(); } catch (_) {} }
        } else if (menuTriggerEl) {
            menuTriggerEl.focus();
            menuTriggerEl = null;
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

        // El CTA flotante no debe quedar por encima del menú abierto
        const fcta = document.querySelector('.floating-cta');
        if (fcta && isMenuOpen) fcta.classList.remove('active');
        else if (fcta) checkHeaderColor();
    };
    menuToggle.addEventListener('click', () => { menuTriggerEl = menuToggle; toggleMenu(); });

    // Cerrar el menú con Escape y atrapar el foco (Tab cíclico) mientras está abierto
    fullscreenMenu.addEventListener('keydown', (e) => {
        if (!isMenuOpen) return;
        if (e.key === 'Escape') { toggleMenu(); return; }
        if (e.key !== 'Tab') return;
        const focusables = fullscreenMenu.querySelectorAll('a[href], button:not([disabled])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (isMenuOpen) toggleMenu();
            // "CONTACTO" abre el formulario directamente (antes scrolleaba al footer)
            if (link.id === 'contactoLink' && typeof openModal === 'function') {
                e.preventDefault();
                openModal();
                return;
            }
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetEl = document.querySelector(targetId);
                if (targetEl) targetEl.scrollIntoView({ behavior: scrollBehavior });
            }
        });
    });

    // ── HEADER + BOTÓN STICKY: aparecen/desaparecen al terminar el hero ──
    // Se cachea el alto del hero (se recalcula al redimensionar) para no
    // forzar un reflow en cada evento de scroll. El hero mide exactamente
    // un viewport (#inicio { height: 100vh }), así que si la medición
    // temprana sale rara —layout aún sin asentar, 100dvh en 0— usamos
    // window.innerHeight como piso: si no, el header/CTA/sticky arrancan
    // en estado "post-hero" encima del hero.
    let heroHeightCache = 0;
    const refreshHeroHeight = () => {
        const measured = heroSection.offsetHeight;
        heroHeightCache = measured > 100 ? measured : window.innerHeight;
        checkHeaderColor();
    };
    window.addEventListener('resize', refreshHeroHeight, { passive: true });
    window.addEventListener('load', refreshHeroHeight, { passive: true });

    const scrollProgress = document.getElementById('scroll-progress');
    const scrollCue = document.getElementById('scrollCue');

    const checkHeaderColor = () => {
        const y = window.scrollY;
        // Sin una medida fiable del hero, asumimos que seguimos en él:
        // así el header/CTA/sticky no aparecen encima del hero por una
        // medición temprana en 0.
        const pastHero = heroHeightCache > 100 && y >= heroHeightCache - 10;
        if (!isMenuOpen) header.classList.toggle('hidden', pastHero);
        const sticky = document.getElementById('sticky-menu-btn');
        if (sticky) sticky.classList.toggle('active', pastHero);
        const fcta = document.querySelector('.floating-cta');
        if (fcta) fcta.classList.toggle('active', pastHero && !isMenuOpen);

        // Barra de progreso de scroll (scaleX en vez de width: no toca layout)
        if (scrollProgress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = max > 0 ? Math.min(1, y / max) : 0;
            scrollProgress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
        }
        // El indicador de scroll del hero se esconde apenas hay movimiento
        if (scrollCue) scrollCue.classList.toggle('is-hidden', y > 40);
    };
    let headerTicking = false;
    window.addEventListener('scroll', () => {
        if (headerTicking) return;
        headerTicking = true;
        requestAnimationFrame(() => { headerTicking = false; checkHeaderColor(); });
    }, { passive: true });
    refreshHeroHeight(); // mide el hero y pinta el estado inicial

    // ── COREOGRAFÍA ZOOM CALUVA CON MASCARA DINÁMICA JS ──
    const zoomSpacer = document.getElementById('zoom-spacer');
    const heroSectionEl = document.getElementById('inicio');
    const heroCaluvaText = document.getElementById('hero-caluva-text');
    const heroPText = document.getElementById('hero-p-text');
    const vista2 = document.getElementById('vista-2');
    
    // Variables para el Autoscroll
    let autoScrollStarted = false;

    // Función de easing cúbico para un scroll muy cinematográfico
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Autoscroll cinematográfico PERO interrumpible: si el usuario hace
    // scroll/gesto/tecla durante la animación, se cancela al instante y le
    // devuelve el control. Nunca "secuestra" el scroll más de lo necesario.
    function smoothScrollTo(targetY, duration) {
        const startY = window.scrollY;
        const distance = targetY - startY;
        if (Math.abs(distance) < 2) return;
        const startTime = performance.now();
        let cancelled = false;

        const cancel = () => {
            if (cancelled) return;
            cancelled = true;
            document.body.style.overflow = '';
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('touchmove', cancel);
            window.removeEventListener('keydown', onKey);
        };
        const onWheel = (e) => {
            // Cancelar si el usuario "pelea" la animación (scrollea hacia arriba)
            if (e.deltaY < -1) cancel();
        };
        const onKey = (e) => {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar'].includes(e.key)) cancel();
        };

        // Bloqueo breve del scroll nativo para matar la inercia del trackpad
        document.body.style.overflow = 'hidden';
        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('touchmove', cancel, { passive: true });
        window.addEventListener('keydown', onKey);

        function step(currentTime) {
            if (cancelled) return;
            let progress = (currentTime - startTime) / duration;
            if (progress > 1) progress = 1;
            window.scrollTo(0, startY + distance * easeInOutCubic(progress));
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                cancel();
            }
        }
        requestAnimationFrame(step);
    }
    
    if (zoomSpacer && heroSectionEl && heroCaluvaText && vista2) {

        // En mobile —o si el usuario pidió reducir el movimiento a nivel SO—
        // deshabilitamos toda la animación de zoom: Vista 2 queda en flujo
        // normal y el contenido aparece directamente.
        const isMobile = window.innerWidth <= 768;
        if (isMobile || reduceMotion) {
            // El spacer de 350vh solo tiene sentido con la animación de zoom.
            // Sin ella, se colapsa a una pantalla para no dejar un hueco vacío.
            zoomSpacer.style.height = '100vh';
            vista2.style.position = 'relative';
            vista2.style.marginTop = '0';
            // Revelar todos los elementos de Vista 2 inmediatamente
            const v2Part1 = document.getElementById('v2-part1');
            const v2Part2 = document.getElementById('v2-part2');
            const v2Link  = document.getElementById('v2-link-container');
            const v2Logo  = document.getElementById('v2-logo');
            if (v2Part1) v2Part1.classList.add('hook-active');
            if (v2Part2) v2Part2.classList.add('reveal-active');
            if (v2Link)  v2Link.classList.add('reveal-active');
            if (v2Logo)  v2Logo.classList.add('reveal-active');
            heroCaluvaText.style.opacity = '1';
            heroCaluvaText.style.animation = '';
            // No continuar con la lógica del zoom
        } else {
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

        const runZoomChoreography = () => {
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
                        // Mantener las letras sólidas (color amarillo) durante la mayor
                        // parte del zoom, desvaneciendo el relleno solo en el último 20%
                        yellowOverlay.style.opacity = 1 - Math.max(0, (phase2 - 0.8) / 0.2);
                    }
                    
                    // Escala progresiva y calculada para abarcar la pantalla justo al final
                    const scaleFactor = 1 + Math.pow(phase2, 4) * 60; 
                    
                    // --- AUTO SCROLL TRIGGER ---
                    if (zoomProgress > 0.32 && !autoScrollStarted) {
                        autoScrollStarted = true;
                        v2Revealed = true; // Marcar como revelada desde el inicio del autoscroll
                        smoothScrollTo(zoomMaxScroll, 900);
                    }

                    // Aplicar transform al grupo SVG
                    const maskGroup = document.getElementById('maskTextGroup');
                    if (maskGroup) {
                        maskGroup.setAttribute('transform', `translate(${centerX}, ${currentCenterY}) scale(${scaleFactor})`);
                    }

                    // El mar se desvanece gradualmente desde el inicio del zoom (no solo al final)
                    if (phase2 > 0.3) {
                        heroSectionEl.style.opacity = 1 - ((phase2 - 0.3) / 0.7);
                        heroSectionEl.style.pointerEvents = "none";
                    } else {
                        heroSectionEl.style.opacity = 1;
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
                            vista2.style.marginTop = '-100vh'; // Consistencia exacta con CSS
                            vista2.style.top = '';
                            vista2.style.left = '';
                            vista2.style.width = '100%';
                        }
                    } else {
                        if (v2SwitchedToRelative) {
                            v2SwitchedToRelative = false;
                            // Fade rápido para esconder el salto de layout fixed→relative
                            vista2.style.transition = 'opacity 0.15s ease';
                            vista2.style.opacity = '0';
                            requestAnimationFrame(() => {
                                vista2.style.position = 'fixed';
                                vista2.style.top = '0';
                                vista2.style.left = '0';
                                vista2.style.width = '100%';
                                vista2.style.marginTop = '';
                                requestAnimationFrame(() => {
                                    vista2.style.opacity = '1';
                                    setTimeout(() => { vista2.style.transition = ''; }, 200);
                                });
                            });
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

            } else if (scrollY <= 30 && maskCreated) {
                // REVERTIR SI VOLVEMOS ARRIBA
                // Umbral ampliado a 30px (antes era 5px) para capturar correctamente
                // el movimiento hacia arriba en trackpads con inercia.
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
                heroCaluvaText.style.animation = "";
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
                    heroPText.style.animation = "";
                    heroPText.style.transform = `translateY(0)`;
                    heroPText.style.opacity = 1;
                }
                const headerEl = document.getElementById('mainHeader');
                if (headerEl) {
                    headerEl.style.transform = `translateY(0)`;
                    headerEl.style.opacity = 1;
                }

                // Fix Bug 1: Recalcular originalCenterY en tiempo real al volver arriba
                // para que CALUVA no baje de más en el próximo scroll
                delete heroSectionEl.dataset.originalCenterY;
                delete heroSectionEl.dataset.targetCenterY;
                delete heroSectionEl.dataset.centerX;
            }
        };

        // Coalesce: como mucho un recálculo por frame, aunque lleguen
        // decenas de eventos de scroll. Menos "layout thrashing" = scroll
        // más fluido en la coreografía del hero.
        let zoomTicking = false;
        window.addEventListener('scroll', () => {
            if (zoomTicking) return;
            zoomTicking = true;
            requestAnimationFrame(() => { zoomTicking = false; runZoomChoreography(); });
        }, { passive: true });
        runZoomChoreography();
        } // cierre del else (desktop only)
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

    let modalTriggerEl = null;
    const isModalOpen = () => callModal && callModal.classList.contains('active');

    const openModal = () => {
        if (!callModal) return;
        modalTriggerEl = document.activeElement;
        callModal.classList.add('active');
        callModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const firstField = callModal.querySelector('.call-input, .call-modal-close');
        if (firstField) { try { firstField.focus({ preventScroll: true }); } catch (_) {} }
    };
    const closeModal = () => {
        if (!callModal || !isModalOpen()) return;
        callModal.classList.remove('active');
        callModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (modalTriggerEl && typeof modalTriggerEl.focus === 'function') modalTriggerEl.focus();
        modalTriggerEl = null;
        
        // Resetear vista por si se envió el formulario
        setTimeout(() => {
            const callForm = document.getElementById('call-form');
            const successMessage = document.getElementById('call-success-message');
            if (callForm) {
                callForm.reset();
                callForm.style.display = 'flex';
                const btn = callForm.querySelector('.call-form-submit');
                if (btn) {
                    btn.textContent = 'LISTO!';
                    btn.style.opacity = '';
                    btn.disabled = false;
                }
            }
            if (successMessage) successMessage.style.display = 'none';
        }, 300); // 300ms espera a que termine la animación de cierre
    };

    btnAgendemosList.forEach(btn => btn.addEventListener('click', openModal));
    if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
    if (callModal) callModal.addEventListener('click', e => { if (e.target === callModal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isModalOpen()) closeModal(); });

    // Atrapar el foco dentro del modal mientras está abierto
    if (callModal) {
        callModal.addEventListener('keydown', e => {
            if (e.key !== 'Tab' || !isModalOpen()) return;
            const focusables = callModal.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
            );
            const visible = [...focusables].filter(el => el.offsetParent !== null);
            if (!visible.length) return;
            const first = visible[0];
            const last = visible[visible.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    // Formulario: enviar datos a Google Apps Script
    const callForm = document.getElementById('call-form');
    const successMessage = document.getElementById('call-success-message');
    // IMPORTANTE: El cliente debe reemplazar esta URL por la que le genere Google Apps Script
    const scriptURL = '<TU_URL_DE_APPS_SCRIPT_AQUI>'; 

    if (callForm) {
        callForm.addEventListener('submit', e => {
            e.preventDefault();
            const btn = callForm.querySelector('.call-form-submit');
            
            if (scriptURL === '<TU_URL_DE_APPS_SCRIPT_AQUI>') {
                alert('Falta configurar la URL de Google Apps Script. Contactate con tu desarrollador para activarla.');
                return;
            }

            // Cambiar estado del botón
            btn.textContent = 'ENVIANDO...';
            btn.style.opacity = '0.6';
            btn.disabled = true;

            const formData = new FormData(callForm);
            
            fetch(scriptURL, { method: 'POST', body: formData })
                .then(response => {
                    // Ocultar formulario y mostrar éxito
                    callForm.style.display = 'none';
                    if (successMessage) successMessage.style.display = 'flex';
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert('Hubo un error al enviar. Por favor, intentá nuevamente.');
                })
                .finally(() => {
                    btn.textContent = 'LISTO!';
                    btn.style.opacity = '';
                    btn.disabled = false;
                });
        });
    }

    // ── MAGNETIC BUTTONS ──
    // Se desactiva con movimiento reducido o en pantallas táctiles (no hay hover real).
    if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                // Atracción más sutil + seguimiento suave (antes: 0.25 y snap instantáneo)
                btn.style.transition = 'transform 0.2s var(--ease-out)';
                btn.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                // Vuelve a su lugar con un pequeño rebote y cede el control al CSS
                btn.style.transition = 'transform 0.5s var(--ease-spring)';
                btn.style.transform = '';
            });
        });
    }

    // ── STICKY MENU BUTTON ──
    // (su aparición/desaparición al scrollear la maneja checkHeaderColor)
    const stickyMenuBtn = document.getElementById('sticky-menu-btn');
    if (stickyMenuBtn) {
        stickyMenuBtn.addEventListener('click', () => { menuTriggerEl = stickyMenuBtn; toggleMenu(); });
    }

    // Año del footer siempre al día
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.textContent = new Date().getFullYear();

});
