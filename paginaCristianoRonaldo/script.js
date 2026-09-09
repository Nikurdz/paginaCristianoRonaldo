/**
 * ==========================================================================
 * CRISTIANO RONALDO - LEYENDA DEL FÚTBOL
 * Script Principal Vanilla JavaScript (ES6+) - Accesibilidad WCAG 2.2 AA
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // ----------------------------------------------------------------------
    // 1. Menú Hamburguesa Móvil & Accesibilidad
    // ----------------------------------------------------------------------
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');

    const closeMobileNav = () => {
        if (mainNav && mainNav.classList.contains('open')) {
            mainNav.classList.remove('open');
            if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        }
    };

    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!isExpanded));
            mainNav.classList.toggle('open');
        });

        // Cerrar menú al presionar una opción
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });
    }

    // ----------------------------------------------------------------------
    // 2. Filtro Interactivo para la Línea de Tiempo (Trayectoria - Pattern Tabs ARIA)
    // ----------------------------------------------------------------------
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const timelineItems = document.querySelectorAll('.timeline-item');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyTimelineFilter = (button) => {
        const filterValue = button.getAttribute('data-filter');

        // Actualizar botones activos y atributos ARIA
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');

        // Filtrar elementos de la línea de tiempo con animación condicional
        timelineItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');

            if (filterValue === 'all' || itemCategory === filterValue) {
                item.classList.remove('hidden');
                if (!prefersReducedMotion) {
                    item.style.animation = 'fadeInUp 0.5s ease forward';
                }
            } else {
                item.classList.add('hidden');
            }
        });
    };

    filterButtons.forEach((button, index) => {
        button.addEventListener('click', () => applyTimelineFilter(button));

        // Soporte de navegación por teclado (flechas izquierda / derecha, inicio, fin)
        button.addEventListener('keydown', (e) => {
            let targetIndex = null;
            if (e.key === 'ArrowRight') {
                targetIndex = (index + 1) % filterButtons.length;
            } else if (e.key === 'ArrowLeft') {
                targetIndex = (index - 1 + filterButtons.length) % filterButtons.length;
            } else if (e.key === 'Home') {
                targetIndex = 0;
            } else if (e.key === 'End') {
                targetIndex = filterButtons.length - 1;
            }

            if (targetIndex !== null) {
                e.preventDefault();
                filterButtons[targetIndex].focus();
                applyTimelineFilter(filterButtons[targetIndex]);
            }
        });
    });

    // ----------------------------------------------------------------------
    // 3. Contadores Animados de Estadísticas (Respetando prefers-reduced-motion)
    // ----------------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    const animateCounters = () => {
        statNumbers.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'), 10);

            // M3: Si el usuario prefiere movimiento reducido, mostrar inmediatamente
            if (prefersReducedMotion) {
                counter.textContent = target.toLocaleString('es-ES');
                return;
            }

            const duration = 1800; // 1.8 segundos
            const stepTime = 25;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString('es-ES');
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString('es-ES');
                }
            }, stepTime);
        });
    };

    const statsSection = document.getElementById('estadisticas');
    if (statsSection && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animateCounters();
                    animated = true; // Ejecutar solo una vez
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);
    } else {
        // Fallback en caso de que no exista IntersectionObserver
        animateCounters();
    }

    // ----------------------------------------------------------------------
    // 4. Visor Lightbox Modal Accesible con Trampa de Foco (WCAG C2)
    // ----------------------------------------------------------------------
    const galeriaItems = document.querySelectorAll('.galeria-item');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalCaption = document.getElementById('modalCaption');
    const modalClose = document.getElementById('modalClose');
    const modalBackdrop = document.getElementById('modalBackdrop');
    let lastFocusedElement = null;

    // C2: Trampa de foco (Focus Trap)
    const handleFocusTrap = (e) => {
        if (e.key !== 'Tab' || !imageModal || !imageModal.classList.contains('active')) return;

        const focusables = Array.from(
            imageModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else { // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    const openModal = (item) => {
        const img = item.querySelector('img');
        const title = item.querySelector('.galeria-overlay h3')?.textContent || 'Imagen de Cristiano Ronaldo';
        const caption = item.querySelector('.galeria-overlay p')?.textContent || (img ? img.alt : '');

        if (img && imageModal) {
            lastFocusedElement = document.activeElement;
            modalImage.src = img.src;
            modalImage.alt = img.alt || title;
            modalTitle.textContent = title;
            modalCaption.textContent = caption;

            imageModal.removeAttribute('hidden');
            setTimeout(() => {
                imageModal.classList.add('active');
                if (modalClose) modalClose.focus();
                document.addEventListener('keydown', handleFocusTrap);
            }, 10);
            document.body.style.overflow = 'hidden'; // Bloquear scroll del body
        }
    };

    const closeModal = () => {
        if (imageModal) {
            imageModal.classList.remove('active');
            document.removeEventListener('keydown', handleFocusTrap);
            setTimeout(() => {
                imageModal.setAttribute('hidden', 'true');
                document.body.style.overflow = '';
                if (lastFocusedElement) {
                    lastFocusedElement.focus();
                }
            }, 300);
        }
    };

    galeriaItems.forEach(item => {
        const viewBtn = item.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(item);
            });
        }
        item.addEventListener('click', () => openModal(item));
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Cerrar componentes abiertos con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (imageModal && imageModal.classList.contains('active')) {
                closeModal();
            }
            closeMobileNav();
        }
    });

    // ----------------------------------------------------------------------
    // 5. ScrollSpy - Resaltar opción del Menú según la sección visible
    // ----------------------------------------------------------------------
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 120;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

            if (correspondingLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    correspondingLink.classList.add('active');
                }
            }
        });
    });
});
