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
    // window.innerHeight como piso: si no, el header y el botón sticky
    // arrancan en estado "post-hero" encima del hero.
    let heroHeightCache = 0;
    const refreshHeroHeight = () => {
        const measured = heroSection.offsetHeight;
        heroHeightCache = measured > 100 ? measured : window.innerHeight;
        checkHeaderColor();
    };
    window.addEventListener('resize', refreshHeroHeight, { passive: true });
    window.addEventListener('load', refreshHeroHeight, { passive: true });

    const scrollCue = document.getElementById('scrollCue');

    const checkHeaderColor = () => {
        const y = window.scrollY;
        // Sin una medida fiable del hero, asumimos que seguimos en él:
        // así el header y el botón sticky no aparecen encima del hero
        // por una medición temprana en 0.
        const pastHero = heroHeightCache > 100 && y >= heroHeightCache - 10;
        if (!isMenuOpen) header.classList.toggle('hidden', pastHero);
        const sticky = document.getElementById('sticky-menu-btn');
        if (sticky) sticky.classList.toggle('active', pastHero);
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
            const v2Part3 = document.getElementById('v2-part3');
            const v2Link  = document.getElementById('v2-link-container');
            const v2Top    = document.getElementById('v2-topbar');
            const v2Bottom = document.getElementById('v2-bottom');
            if (v2Part1) v2Part1.classList.add('hook-active');
            if (v2Part2) v2Part2.classList.add('reveal-active');
            if (v2Part3) v2Part3.classList.add('reveal-active');
            if (v2Link)  v2Link.classList.add('reveal-active');
            if (v2Top)    v2Top.classList.add('reveal-active');
            if (v2Bottom) v2Bottom.classList.add('reveal-active');
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
                inner.style.transitionDelay = `${index * 0.09}s`;
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

            // Snap nativo (CSS) solo activo una vez que Vista 2 termino de
            // salir de pantalla, para que nunca interfiera con la coreografia
            // del hero/zoom.
            document.documentElement.classList.toggle('snap-services', scrollY >= zoomSpacer.offsetHeight);

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

                    // --- ANIMACIÓN EN VISTA 2: Reveal de título, párrafos y enlace ---
                    const v2Part2 = document.getElementById('v2-part2');
                    const v2Part3 = document.getElementById('v2-part3');
                    const v2Link = document.getElementById('v2-link-container');
                    const v2Top = document.getElementById('v2-topbar');
                    const v2Bottom = document.getElementById('v2-bottom');

                    if (isPastZoom || v2Revealed) {
                        v2Revealed = true;
                        if (v2Part1) v2Part1.classList.add('hook-active');
                        if (v2Part2) v2Part2.classList.add('reveal-active');
                        if (v2Part3) v2Part3.classList.add('reveal-active');
                        if (v2Link) v2Link.classList.add('reveal-active');
                        if (v2Top) v2Top.classList.add('reveal-active');
                        if (v2Bottom) v2Bottom.classList.add('reveal-active');
                    } else {
                        if (v2Part1) v2Part1.classList.remove('hook-active');
                        if (v2Part2) v2Part2.classList.remove('reveal-active');
                        if (v2Part3) v2Part3.classList.remove('reveal-active');
                        if (v2Link) v2Link.classList.remove('reveal-active');
                        if (v2Top) v2Top.classList.remove('reveal-active');
                        if (v2Bottom) v2Bottom.classList.remove('reveal-active');
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
    const btnServicios  = document.getElementById('btn-servicios');

    let modalTriggerEl = null;
    const isModalOpen = () => callModal && callModal.classList.contains('active');

    // Si se cierra el modal sin enviar, las respuestas quedan guardadas
    // (tanto en la sesión como entre visitas, vía localStorage) hasta que
    // se envíe con éxito o se borren a mano.
    const FORM_DRAFT_KEY = 'caluva_form_draft_v1';
    let formWasJustSubmitted = false;

    // ── SELECTS PERSONALIZADOS ──
    // El <select> nativo del navegador se ve distinto en cada sistema
    // operativo y no se puede maquillar del todo. Acá se lo deja en el DOM
    // (oculto pero funcional, para el envío del form) y se dibuja un
    // botón + lista propios encima, con la tipografía del sitio.
    let closeAllSelectShellsBound = false;

    function closeSelectShell(shell) {
        shell.classList.remove('is-open');
        if (shell.panelEl) shell.panelEl.classList.remove('is-open');
        const face = shell.querySelector('.call-select-face');
        if (face) face.setAttribute('aria-expanded', 'false');
    }

    function enhanceCustomSelects(root) {
        root.querySelectorAll('select.call-select').forEach(nativeSelect => {
            if (nativeSelect.dataset.enhanced) return;
            nativeSelect.dataset.enhanced = 'true';

            const shell = document.createElement('div');
            shell.className = 'call-select-shell';

            const face = document.createElement('button');
            face.type = 'button';
            face.className = 'call-select-face';
            face.setAttribute('aria-haspopup', 'listbox');
            face.setAttribute('aria-expanded', 'false');

            const faceLabel = document.createElement('span');
            faceLabel.className = 'call-select-face-label';

            const chevron = document.createElement('span');
            chevron.className = 'call-select-chevron';
            chevron.setAttribute('aria-hidden', 'true');
            chevron.innerHTML = '<svg viewBox="0 0 12 8" width="12" height="8"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

            face.appendChild(faceLabel);
            face.appendChild(chevron);

            const group = nativeSelect.closest('.call-select-group');
            const groupLabel = group ? group.querySelector('.call-label') : null;
            if (groupLabel) face.setAttribute('aria-label', groupLabel.textContent.trim());

            const panel = document.createElement('ul');
            panel.className = 'call-select-panel';
            panel.setAttribute('role', 'listbox');

            const optionEls = [];
            [...nativeSelect.options].forEach(opt => {
                if (opt.disabled) return; // el placeholder no es una opción elegible
                const li = document.createElement('li');
                li.className = 'call-select-option';
                li.setAttribute('role', 'option');
                li.dataset.value = opt.value;
                li.textContent = opt.textContent;
                panel.appendChild(li);
                optionEls.push(li);
            });

            // El select real queda invisible pero en el mismo lugar y tamaño
            // que el botón visible, así si el navegador necesita mostrar un
            // aviso de validación (campo obligatorio vacío) aparece anclado
            // en el lugar correcto.
            nativeSelect.classList.add('call-select-native');
            nativeSelect.tabIndex = -1;
            nativeSelect.setAttribute('aria-hidden', 'true');

            nativeSelect.parentNode.insertBefore(shell, nativeSelect);
            shell.appendChild(nativeSelect);
            shell.appendChild(face);

            // La lista se cuelga directo del <body> (no adentro del shell):
            // así se pinta siempre por encima de todo, sin depender del
            // orden/stacking de los <fieldset> y <legend> del formulario
            // (los legend tienen un comportamiento de apilamiento propio
            // que puede terminar dibujándose arriba de un dropdown anidado).
            document.body.appendChild(panel);
            shell.panelEl = panel;

            function positionPanel() {
                const rect = shell.getBoundingClientRect();
                const panelHeight = panel.offsetHeight;
                const spaceBelow = window.innerHeight - rect.bottom;
                const openUpward = spaceBelow < panelHeight + 16 && rect.top > panelHeight + 16;
                panel.style.left = rect.left + 'px';
                panel.style.width = rect.width + 'px';
                if (openUpward) {
                    panel.style.top = (rect.top - panelHeight - 6) + 'px';
                } else {
                    panel.style.top = (rect.bottom + 6) + 'px';
                }
            }

            function sync() {
                const opt = nativeSelect.options[nativeSelect.selectedIndex];
                const isPlaceholder = !opt || opt.disabled || opt.value === '';
                faceLabel.textContent = opt ? opt.textContent : '';
                face.classList.toggle('is-placeholder', isPlaceholder);
                if (nativeSelect.value) face.classList.remove('has-error');
                optionEls.forEach(li => {
                    const selected = li.dataset.value === nativeSelect.value;
                    li.setAttribute('aria-selected', String(selected));
                    li.classList.toggle('is-selected', selected);
                });
            }
            nativeSelect.callSelectSync = sync;

            let activeIndex = -1;
            function highlight(idx) {
                optionEls.forEach(li => li.classList.remove('is-active'));
                if (optionEls[idx]) {
                    optionEls[idx].classList.add('is-active');
                    optionEls[idx].scrollIntoView({ block: 'nearest' });
                }
                activeIndex = idx;
            }
            function open() {
                document.querySelectorAll('.call-select-shell.is-open').forEach(s => {
                    if (s !== shell) closeSelectShell(s);
                });
                panel.classList.add('is-open');
                positionPanel();
                shell.classList.add('is-open');
                face.setAttribute('aria-expanded', 'true');
                const currentIdx = optionEls.findIndex(li => li.dataset.value === nativeSelect.value);
                highlight(currentIdx >= 0 ? currentIdx : 0);
            }
            function close() {
                closeSelectShell(shell);
                activeIndex = -1;
            }
            function choose(idx) {
                const li = optionEls[idx];
                if (!li) return;
                nativeSelect.value = li.dataset.value;
                nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                sync();
                close();
                face.focus();
            }

            face.addEventListener('click', () => {
                if (shell.classList.contains('is-open')) close(); else open();
            });
            face.addEventListener('keydown', e => {
                const navKeys = ['ArrowDown', 'ArrowUp', 'Enter', ' '];
                if (navKeys.includes(e.key)) e.preventDefault();
                if (!shell.classList.contains('is-open')) {
                    if (navKeys.includes(e.key)) open();
                    return;
                }
                if (e.key === 'ArrowDown') highlight(Math.min(activeIndex + 1, optionEls.length - 1));
                else if (e.key === 'ArrowUp') highlight(Math.max(activeIndex - 1, 0));
                else if (e.key === 'Enter' || e.key === ' ') choose(activeIndex);
                else if (e.key === 'Escape') close();
            });
            panel.addEventListener('click', e => {
                const li = e.target.closest('.call-select-option');
                if (li) choose(optionEls.indexOf(li));
            });
            panel.addEventListener('mousemove', e => {
                const li = e.target.closest('.call-select-option');
                if (li) highlight(optionEls.indexOf(li));
            });

            sync();
        });

        // Listeners globales (una sola vez, sin importar cuántos selects se
        // hayan mejorado): cerrar al clickear afuera (el panel vive en el
        // <body>, así que hay que revisarlo aparte del shell), y cerrar
        // ante scroll o resize para no dejar una lista flotando en un
        // lugar que ya no corresponde.
        if (!closeAllSelectShellsBound) {
            closeAllSelectShellsBound = true;
            document.addEventListener('click', e => {
                document.querySelectorAll('.call-select-shell.is-open').forEach(shell => {
                    const clickedInsideShell = shell.contains(e.target);
                    const clickedInsidePanel = shell.panelEl && shell.panelEl.contains(e.target);
                    if (!clickedInsideShell && !clickedInsidePanel) closeSelectShell(shell);
                });
            });
            document.addEventListener('scroll', e => {
                // El scrollIntoView interno de la lista (al resaltar una
                // opción) también dispara este evento — si no se filtra,
                // el panel se cierra solo apenas se abre.
                if (e.target && e.target.closest && e.target.closest('.call-select-panel')) return;
                document.querySelectorAll('.call-select-shell.is-open').forEach(closeSelectShell);
            }, true);
            window.addEventListener('resize', () => {
                document.querySelectorAll('.call-select-shell.is-open').forEach(closeSelectShell);
            });
        }
    }

    function syncAllCustomSelects(container) {
        container.querySelectorAll('select.call-select').forEach(sel => {
            if (sel.callSelectSync) sel.callSelectSync();
        });
    }

    function saveFormDraft() {
        const form = document.getElementById('call-form');
        if (!form) return;
        try {
            const data = {};
            new FormData(form).forEach((value, key) => {
                if (key === 'secret' || key === 'website') return;
                if (data[key] === undefined) data[key] = value;
                else if (Array.isArray(data[key])) data[key].push(value);
                else data[key] = [data[key], value];
            });
            localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(data));
        } catch (err) { /* localStorage puede fallar (modo privado, etc.) — no es grave */ }
    }

    function loadFormDraft() {
        const form = document.getElementById('call-form');
        if (!form) return;
        let saved;
        try {
            const raw = localStorage.getItem(FORM_DRAFT_KEY);
            if (!raw) return;
            saved = JSON.parse(raw);
        } catch (err) { return; }

        Object.keys(saved).forEach(name => {
            const fields = form.querySelectorAll(`[name="${name}"]`);
            if (!fields.length) return;
            const value = saved[name];
            if (fields[0].type === 'checkbox') {
                const values = Array.isArray(value) ? value : [value];
                fields.forEach(f => { f.checked = values.includes(f.value); });
            } else {
                fields[0].value = value;
            }
        });

        // Disparar los listeners dependientes para que la UI se acomode
        // (mostrar el bloque de servicio correcto, revelar el "otro", etc.)
        const servicioField = form.querySelector('[name="servicio"]');
        if (servicioField && servicioField.value) servicioField.dispatchEvent(new Event('change'));
        form.querySelectorAll('.call-checkbox-otro').forEach(cb => cb.dispatchEvent(new Event('change')));
        syncAllCustomSelects(form);
    }

    function clearFormDraft() {
        try { localStorage.removeItem(FORM_DRAFT_KEY); } catch (err) { /* nada que hacer */ }
    }

    function resetFormToPristine(form) {
        form.reset();
        form.style.display = 'flex';
        // El reset() nativo no toca las clases que manejamos a mano, así que
        // las secciones de servicio y los detalles de "otro" se vuelven a
        // esconder manualmente para que el modal arranque limpio.
        form.querySelectorAll('.service-fields').forEach(block => {
            block.classList.remove('is-active');
            block.querySelectorAll('select, textarea, input:not([type="checkbox"])').forEach(field => {
                if (!field.dataset.otroDetail) field.required = false;
            });
        });
        form.querySelectorAll('input[data-otro-detail]').forEach(inp => {
            inp.hidden = true;
            inp.required = false;
        });
        syncAllCustomSelects(form);
        const btn = form.querySelector('.call-form-submit');
        if (btn) {
            btn.textContent = 'LISTO!';
            btn.style.opacity = '';
            btn.disabled = false;
        }
    }

    // Barra de progreso: refleja cuánto se scrolleó dentro del modal (no
    // cuántos campos están completos), para que la persona vea que el
    // formulario tiene un final y no es una lista infinita.
    const callModalScroll = document.querySelector('.call-modal-scroll');
    const progressFill = document.getElementById('call-progress-fill');
    function updateFormProgress() {
        if (!callModalScroll || !progressFill) return;
        const scrollable = callModalScroll.scrollHeight - callModalScroll.clientHeight;
        const pct = scrollable > 0 ? Math.min(100, (callModalScroll.scrollTop / scrollable) * 100) : 100;
        progressFill.style.width = pct + '%';
    }
    if (callModalScroll) callModalScroll.addEventListener('scroll', updateFormProgress, { passive: true });

    const openModal = () => {
        if (!callModal) return;
        modalTriggerEl = document.activeElement;
        callModal.classList.add('active');
        callModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        loadFormDraft();
        if (callModalScroll) callModalScroll.scrollTop = 0;
        updateFormProgress();
        const firstField = callModal.querySelector('.call-input, .call-modal-close');
        if (firstField) { try { firstField.focus({ preventScroll: true }); } catch (_) {} }
    };
    const closeModal = () => {
        if (!callModal || !isModalOpen()) return;
        callModal.classList.remove('active');
        callModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Los paneles de los selects personalizados viven en el <body>, no
        // adentro del modal — si quedó alguno abierto, se cierra también.
        document.querySelectorAll('.call-select-shell.is-open').forEach(closeSelectShell);

        if (modalTriggerEl && typeof modalTriggerEl.focus === 'function') modalTriggerEl.focus();
        modalTriggerEl = null;

        // Si se acaba de enviar con éxito, dejamos todo listo para la
        // próxima consulta. Si no, no tocamos nada: las respuestas quedan
        // tal cual para la próxima vez que se abra el modal.
        if (formWasJustSubmitted) {
            setTimeout(() => {
                const callForm = document.getElementById('call-form');
                const successMessage = document.getElementById('call-success-message');
                if (callForm) resetFormToPristine(callForm);
                if (successMessage) successMessage.style.display = 'none';
                formWasJustSubmitted = false;
            }, 300); // 300ms espera a que termine la animación de cierre
        }
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

    // Guardar el borrador ante cualquier cambio en el formulario
    if (document.getElementById('call-form')) {
        document.getElementById('call-form').addEventListener('input', saveFormDraft);
        document.getElementById('call-form').addEventListener('change', saveFormDraft);
    }

    // ── FORMULARIO: preguntas dinámicas según el servicio elegido ──
    const servicioSelect = document.getElementById('servicio-select');
    const serviceFieldBlocks = document.querySelectorAll('.service-fields');

    function setRequiredRecursive(container, isRequired) {
        container.querySelectorAll('select, textarea, input:not([type="checkbox"])').forEach(field => {
            // Los inputs de detalle de "otro" manejan su required aparte, según el checkbox.
            if (field.dataset.otroDetail) return;
            field.required = isRequired;
        });
    }

    function resetFieldsIn(container) {
        container.querySelectorAll('select').forEach(sel => { sel.selectedIndex = 0; });
        container.querySelectorAll('textarea, input[type="text"]').forEach(inp => { inp.value = ''; });
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        container.querySelectorAll('input[hidden]').forEach(inp => { inp.required = false; });
        syncAllCustomSelects(container);
    }

    if (servicioSelect && serviceFieldBlocks.length) {
        servicioSelect.addEventListener('change', () => {
            const selected = servicioSelect.value;
            serviceFieldBlocks.forEach(block => {
                if (block.dataset.service === selected) {
                    block.classList.add('is-active');
                    setRequiredRecursive(block, true);
                } else {
                    block.classList.remove('is-active');
                    setRequiredRecursive(block, false);
                    resetFieldsIn(block);
                }
            });
            // La altura del modal cambia con el reveal animado; la barra de
            // progreso se recalcula cuando termina la transición.
            setTimeout(updateFormProgress, 420);
        });
    }

    // Reemplazar cada <select> del formulario por la versión personalizada.
    enhanceCustomSelects(document);

    // Checkboxes con opción "¡Otro!": muestran/ocultan su input de detalle
    document.querySelectorAll('.call-checkbox-group[data-otro-target]').forEach(group => {
        const targetInput = document.getElementById(group.dataset.otroTarget);
        const otroCheckbox = group.querySelector('.call-checkbox-otro');
        if (!targetInput || !otroCheckbox) return;
        otroCheckbox.addEventListener('change', () => {
            targetInput.hidden = !otroCheckbox.checked;
            targetInput.required = otroCheckbox.checked;
            if (!otroCheckbox.checked) targetInput.value = '';
        });
    });

    // Formulario: enviar datos a Google Apps Script
    const callForm = document.getElementById('call-form');
    const successMessage = document.getElementById('call-success-message');
    const formErrorMessage = document.getElementById('call-form-error');
    // IMPORTANTE: pegar acá la URL que genera Apps Script al desplegar (ver formulario-backend/SETUP.md)
    const scriptURL = 'https://script.google.com/macros/s/AKfycbydTCTQ9dZtyM8bkDLwTszCitNxihobwDY7OA8-mFozK1nPk9cVH_40Ybs1Lx4dtTLQ/exec';
    // Mismo valor que la Script Property FORM_SECRET del lado de Apps Script (ver SETUP.md)
    const formSecret = 'be0adc5cfca65e0b49e1eec21b04ada819fb25be65c01296';

    function showFormError(message) {
        if (!formErrorMessage) return;
        formErrorMessage.textContent = message;
        formErrorMessage.hidden = false;
    }
    function hideFormError() {
        if (!formErrorMessage) return;
        formErrorMessage.hidden = true;
    }

    // Vaciar formulario: por si alguien quiere arrancar de cero (se
    // completó para otro negocio, se equivocó mucho, etc.) — ahora que las
    // respuestas se guardan solas, hace falta una forma explícita de
    // descartarlas.
    const clearFormBtn = document.getElementById('call-form-clear');
    if (clearFormBtn && callForm) {
        clearFormBtn.addEventListener('click', () => {
            hideFormError();
            resetFormToPristine(callForm);
            clearFormDraft();
            callForm.querySelector('[name="nombre"]')?.focus();
        });
    }

    // Los <select> personalizados esconden el <select> real (tabindex -1),
    // así que no confiamos en que el navegador muestre solo su aviso nativo
    // de "campo obligatorio" — se valida a mano y se marca el select en rojo.
    function findFirstInvalidCustomSelect(form) {
        const selects = [...form.querySelectorAll('select.call-select[required]')];
        for (const sel of selects) {
            if (sel.value) continue;
            const shell = sel.closest('.call-select-shell');
            const group = sel.closest('.call-select-group');
            const labelEl = group ? group.querySelector('.call-label') : null;
            return {
                face: shell ? shell.querySelector('.call-select-face') : null,
                shell,
                labelText: labelEl ? labelEl.textContent.replace(/\*\s*$/, '').trim() : 'este campo'
            };
        }
        return null;
    }

    if (callForm) {
        callForm.addEventListener('submit', e => {
            e.preventDefault();
            hideFormError();
            const btn = callForm.querySelector('.call-form-submit');

            // El <form novalidate> deja todo el control acá: primero los
            // selects personalizados (con su propio cartel), después el
            // resto de los campos nativos (input/textarea) con el aviso
            // nativo del navegador, que para esos sigue funcionando bien.
            const invalid = findFirstInvalidCustomSelect(callForm);
            if (invalid) {
                if (invalid.face) invalid.face.classList.add('has-error');
                if (invalid.shell) invalid.shell.scrollIntoView({ block: 'center', behavior: 'smooth' });
                showFormError('Falta completar "' + invalid.labelText + '".');
                if (invalid.face) invalid.face.focus();
                return;
            }

            if (!callForm.checkValidity()) {
                callForm.reportValidity();
                return;
            }

            if (!scriptURL || scriptURL === 'PEGAR_AQUI_LA_URL_DE_APPS_SCRIPT') {
                showFormError('El formulario todavía no está conectado. Avisale a quien mantiene el sitio.');
                return;
            }

            // Cambiar estado del botón
            btn.textContent = 'ENVIANDO...';
            btn.style.opacity = '0.6';
            btn.disabled = true;

            const formData = new FormData(callForm);
            formData.append('secret', formSecret);

            fetch(scriptURL, { method: 'POST', body: formData })
                .then(response => response.json())
                .then(data => {
                    if (!data || data.ok !== true) {
                        throw new Error((data && data.error) || 'unknown_error');
                    }
                    // Ocultar formulario y mostrar éxito
                    formWasJustSubmitted = true;
                    clearFormDraft();
                    callForm.style.display = 'none';
                    if (successMessage) successMessage.style.display = 'flex';
                })
                .catch(error => {
                    console.error('Error al enviar el formulario:', error.message);
                    showFormError('Hubo un problema al enviar. Probá de nuevo en un momento, o escribinos directo por Instagram.');
                })
                .finally(() => {
                    btn.textContent = 'LISTO!';
                    btn.style.opacity = '';
                    btn.disabled = false;
                });
        });
    }

    // NUESTROS SERVICIOS → scroll suave al primer servicio
    if (btnServicios) {
        btnServicios.addEventListener('click', () => {
            const target = document.getElementById('vista-3') || document.getElementById('vista-4');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Fotos del equipo: si el archivo todavía no existe, se muestra el placeholder
    document.querySelectorAll('.v2-photo img').forEach(img => {
        const markMissing = () => img.classList.add('is-missing');
        img.addEventListener('error', markMissing);
        if (img.complete && img.naturalWidth === 0) markMissing();
    });

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

});
