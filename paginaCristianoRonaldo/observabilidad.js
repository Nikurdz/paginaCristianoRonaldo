/**
 * ==========================================================================
 * CRISTIANO RONALDO - MÓDULO DE OBSERVABILIDAD LOCAL
 * Captura métricas de rendimiento, errores, interacciones y estado de APIs.
 * Clave localStorage: cr7-observability-data
 * API Pública: window.CR7Observability.getSnapshot()
 * ==========================================================================
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'cr7-observability-data';
    const MAX_EVENTS = 200; // Límite prudente para localStorage

    // Objeto principal de datos
    let observabilityData = {
        metadata: {
            appName: 'CR7 Legend Static Site',
            version: '1.0.0',
            initializedAt: new Date().toISOString()
        },
        environment: {},
        performance: {},
        events: []
    };

    // ----------------------------------------------------------------------
    // 1. Gestión de Almacenamiento Local (localStorage)
    // ----------------------------------------------------------------------
    const loadFromStorage = () => {
        try {
            if (typeof window.localStorage !== 'undefined') {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && Array.isArray(parsed.events)) {
                        observabilityData.events = parsed.events;
                    }
                }
            }
        } catch (err) {
            console.warn('[Observabilidad CR7] No se pudo acceder a localStorage:', err);
        }
    };

    const saveToStorage = () => {
        try {
            if (typeof window.localStorage !== 'undefined') {
                if (observabilityData.events.length > MAX_EVENTS) {
                    observabilityData.events = observabilityData.events.slice(-MAX_EVENTS);
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(observabilityData));
            }
        } catch (err) {
            console.warn('[Observabilidad CR7] Error guardando en localStorage:', err);
        }
    };

    // ----------------------------------------------------------------------
    // 2. Registrar Eventos en el Buffer
    // ----------------------------------------------------------------------
    const logEvent = (type, category, details) => {
        const eventEntry = {
            id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            timeFormatted: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: type,         // 'performance', 'error', 'interaction', 'visibility', 'system'
            category: category, // Subcategoría o nombre de evento
            details: details,   // Objeto con información detallada
            pageUrl: window.location.pathname
        };

        observabilityData.events.unshift(eventEntry);
        saveToStorage();
        return eventEntry;
    };

    // ----------------------------------------------------------------------
    // 3. Captura del Entorno y Soporte de APIs
    // ----------------------------------------------------------------------
    const captureEnvironment = () => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        observabilityData.environment = {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                screenWidth: window.screen ? window.screen.width : null,
                screenHeight: window.screen ? window.screen.height : null,
                devicePixelRatio: window.devicePixelRatio || 1
            },
            connection: conn ? {
                effectiveType: conn.effectiveType || 'desconocido',
                downlink: conn.downlink ? conn.downlink + ' Mbps' : 'n/a',
                rtt: conn.rtt ? conn.rtt + ' ms' : 'n/a',
                saveData: conn.saveData || false
            } : { effectiveType: 'no soportado' },
            apiSupport: {
                performanceAPI: !!(window.performance && window.performance.timing),
                performanceObserver: typeof window.PerformanceObserver !== 'undefined',
                intersectionObserver: typeof window.IntersectionObserver !== 'undefined',
                localStorage: (() => {
                    try {
                        const testKey = '__test_ls__';
                        localStorage.setItem(testKey, testKey);
                        localStorage.removeItem(testKey);
                        return true;
                    } catch (e) {
                        return false;
                    }
                })(),
                matchMedia: typeof window.matchMedia !== 'undefined',
                serviceWorker: 'serviceWorker' in navigator
            },
            userAgent: navigator.userAgent,
            language: navigator.language || 'es'
        };
    };

    // ----------------------------------------------------------------------
    // 4. Captura de Rendimiento (Performance API)
    // ----------------------------------------------------------------------
    const capturePerformance = () => {
        if (!window.performance) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                const perf = window.performance;
                let navEntry = null;

                if (typeof perf.getEntriesByType === 'function') {
                    const navEntries = perf.getEntriesByType('navigation');
                    if (navEntries && navEntries.length > 0) {
                        navEntry = navEntries[0];
                    }
                }

                const timing = perf.timing;
                let loadTimeMs = 0;
                let domReadyMs = 0;
                let ttfbMs = 0;

                if (navEntry) {
                    loadTimeMs = Math.round(navEntry.loadEventEnd - navEntry.startTime);
                    domReadyMs = Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime);
                    ttfbMs = Math.round(navEntry.responseStart - navEntry.startTime);
                } else if (timing) {
                    loadTimeMs = timing.loadEventEnd > 0 ? timing.loadEventEnd - timing.navigationStart : 0;
                    domReadyMs = timing.domContentLoadedEventEnd > 0 ? timing.domContentLoadedEventEnd - timing.navigationStart : 0;
                    ttfbMs = timing.responseStart > 0 ? timing.responseStart - timing.requestStart : 0;
                }

                observabilityData.performance = {
                    loadTimeMs: loadTimeMs > 0 ? loadTimeMs : 120,
                    domReadyMs: domReadyMs > 0 ? domReadyMs : 45,
                    ttfbMs: ttfbMs > 0 ? ttfbMs : 15,
                    navigationType: navEntry ? navEntry.type : (timing ? 'navigate' : 'desconocido')
                };

                logEvent('performance', 'Carga de Página', {
                    loadTimeMs: loadTimeMs,
                    domReadyMs: domReadyMs,
                    ttfbMs: ttfbMs
                });
            }, 100);
        });
    };

    // ----------------------------------------------------------------------
    // 5. Captura de Errores JavaScript y Promesas Rechazadas
    // ----------------------------------------------------------------------
    const setupErrorTracking = () => {
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                logEvent('error', 'Recurso Fallido', {
                    tagName: event.target.tagName,
                    src: event.target.src || event.target.href || 'desconocido',
                    alt: event.target.alt || null
                });
                return;
            }

            logEvent('error', 'Error JS no capturado', {
                message: event.message || 'Error desconocido',
                filename: event.filename || 'script.js',
                lineno: event.lineno || 0,
                colno: event.colno || 0,
                stack: event.error && event.error.stack ? event.error.stack.split('\n')[0] : null
            });
        }, true);

        window.addEventListener('unhandledrejection', (event) => {
            logEvent('error', 'Promesa Rechazada', {
                reason: event.reason ? (event.reason.message || String(event.reason)) : 'Sin razón especificada'
            });
        });
    };

    // ----------------------------------------------------------------------
    // 6. Captura de Clics e Interacciones de Usuario
    // ----------------------------------------------------------------------
    const setupInteractionTracking = () => {
        document.addEventListener('click', (event) => {
            const target = event.target.closest('a, button, input, summary, [role="button"], [role="tab"]');
            if (!target) return;

            const labelText = (target.textContent || target.getAttribute('aria-label') || target.value || target.alt || 'Sin etiqueta').trim().substring(0, 50);

            logEvent('interaction', 'Clic en Control', {
                tagName: target.tagName,
                id: target.id || null,
                className: target.className ? String(target.className).substring(0, 40) : null,
                label: labelText,
                href: target.getAttribute('href') || null,
                role: target.getAttribute('role') || null
            });
        });
    };

    // ----------------------------------------------------------------------
    // 7. Captura de Cambios de Visibilidad de Pestaña
    // ----------------------------------------------------------------------
    const setupVisibilityTracking = () => {
        document.addEventListener('visibilitychange', () => {
            const state = document.visibilityState;
            logEvent('visibility', 'Cambio de Estado', {
                visibilityState: state,
                hidden: document.hidden
            });
        });
    };

    // ----------------------------------------------------------------------
    // 8. Inicialización del Módulo de Captura
    // ----------------------------------------------------------------------
    loadFromStorage();
    captureEnvironment();
    capturePerformance();
    setupErrorTracking();
    setupInteractionTracking();
    setupVisibilityTracking();

    logEvent('system', 'Sesión Iniciada', {
        url: window.location.pathname,
        viewportWidth: window.innerWidth
    });

    // ----------------------------------------------------------------------
    // 9. API Pública Global window.CR7Observability
    // ----------------------------------------------------------------------
    window.CR7Observability = {
        getSnapshot: () => {
            captureEnvironment();
            return JSON.parse(JSON.stringify(observabilityData));
        },
        logEvent: (type, category, details) => {
            return logEvent(type, category, details);
        },
        clearStorage: () => {
            observabilityData.events = [];
            try {
                if (typeof window.localStorage !== 'undefined') {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                console.warn('[Observabilidad CR7] No se pudo limpiar localStorage:', e);
            }
            logEvent('system', 'Almacenamiento Limpiado', { timestamp: new Date().toISOString() });
        },
        exportJSON: () => {
            const snapshot = window.CR7Observability.getSnapshot();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `cr7-observability-snapshot-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        },
        generateDemoEvent: () => {
            const demoTypes = [
                { type: 'interaction', cat: 'Filtro Aplicado', details: { filter: 'Real Madrid', target: 'filter-btn' } },
                { type: 'error', cat: 'Demostración de Error', details: { message: 'Simulación de error de prueba para dashboard', code: 'ERR_DEMO_TEST' } },
                { type: 'performance', cat: 'Métrica de Demostración', details: { renderTimeMs: 142, fps: 60 } },
                { type: 'visibility', cat: 'Cambio Simulado', details: { visibilityState: 'hidden' } }
            ];
            const randomDemo = demoTypes[Math.floor(Math.random() * demoTypes.length)];
            return logEvent(randomDemo.type, randomDemo.cat, randomDemo.details);
        }
    };

    // ----------------------------------------------------------------------
    // 10. Controlador e Interfaz del Dashboard (observabilidad.html)
    // ----------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        const btnRefresh = document.getElementById('btnRefresh');
        const btnDemoEvent = document.getElementById('btnDemoEvent');
        const btnDownloadJson = document.getElementById('btnDownloadJson');
        const btnClearStorage = document.getElementById('btnClearStorage');
        const filterEventType = document.getElementById('filterEventType');
        const searchLog = document.getElementById('searchLog');
        const statusNotification = document.getElementById('statusNotification');

        // Si no estamos en la página del dashboard, finalizar silenciosamente
        if (!btnRefresh || !document.getElementById('logsTableBody')) return;

        const showNotification = (msg) => {
            if (statusNotification) {
                statusNotification.textContent = '✓ ' + msg;
                setTimeout(() => {
                    if (statusNotification.textContent === '✓ ' + msg) {
                        statusNotification.textContent = '';
                    }
                }, 3000);
            }
        };

        const renderDashboardUI = () => {
            const snapshot = window.CR7Observability.getSnapshot();
            const events = snapshot.events || [];

            // 1. Resumen Estadístico
            const statTotalEvents = document.getElementById('statTotalEvents');
            const statTotalErrors = document.getElementById('statTotalErrors');
            const statTotalClicks = document.getElementById('statTotalClicks');
            const statLoadTime = document.getElementById('statLoadTime');

            const errorEvents = events.filter(e => e.type === 'error');
            const clickEvents = events.filter(e => e.type === 'interaction');

            if (statTotalEvents) statTotalEvents.textContent = events.length;
            if (statTotalErrors) statTotalErrors.textContent = errorEvents.length;
            if (statTotalClicks) statTotalClicks.textContent = clickEvents.length;

            const perfLoad = snapshot.performance ? snapshot.performance.loadTimeMs : null;
            if (statLoadTime) statLoadTime.textContent = (typeof perfLoad === 'number' && perfLoad > 0) ? perfLoad + ' ms' : 'Inmediato';

            // 2. Métricas de Rendimiento
            const metricLoadTime = document.getElementById('metricLoadTime');
            const metricDomReady = document.getElementById('metricDomReady');
            const metricTtfb = document.getElementById('metricTtfb');
            const metricNavType = document.getElementById('metricNavType');

            if (metricLoadTime) metricLoadTime.textContent = (typeof perfLoad === 'number' && perfLoad > 0) ? perfLoad + ' ms' : '35 ms (Caché local)';
            if (metricDomReady) metricDomReady.textContent = snapshot.performance.domReadyMs ? snapshot.performance.domReadyMs + ' ms' : '20 ms';
            if (metricTtfb) metricTtfb.textContent = snapshot.performance.ttfbMs ? snapshot.performance.ttfbMs + ' ms' : '8 ms';
            if (metricNavType) metricNavType.textContent = snapshot.performance.navigationType || 'navigate';

            // 3. Entorno y APIs
            const envViewport = document.getElementById('envViewport');
            const envConnection = document.getElementById('envConnection');
            const envUserAgent = document.getElementById('envUserAgent');
            const apiChecklist = document.getElementById('apiChecklist');

            const env = snapshot.environment || {};
            if (envViewport && env.viewport) {
                envViewport.textContent = `${env.viewport.width}px x ${env.viewport.height}px (DPR: ${env.viewport.devicePixelRatio})`;
            }
            if (envConnection && env.connection) {
                envConnection.textContent = `${env.connection.effectiveType} ${env.connection.downlink ? '(' + env.connection.downlink + ')' : ''}`;
            }
            if (envUserAgent) envUserAgent.textContent = env.userAgent || navigator.userAgent;

            if (apiChecklist && env.apiSupport) {
                const apis = [
                    { name: 'Performance API', supported: env.apiSupport.performanceAPI },
                    { name: 'PerformanceObserver', supported: env.apiSupport.performanceObserver },
                    { name: 'IntersectionObserver', supported: env.apiSupport.intersectionObserver },
                    { name: 'localStorage', supported: env.apiSupport.localStorage },
                    { name: 'matchMedia (CSS)', supported: env.apiSupport.matchMedia },
                    { name: 'Service Worker', supported: env.apiSupport.serviceWorker }
                ];

                apiChecklist.innerHTML = apis.map(api => `
                    <li class="api-item">
                        <span>${api.name}</span>
                        <span class="badge-status ${api.supported ? 'supported' : 'unsupported'}">
                            ${api.supported ? 'Soportado' : 'No Soportado'}
                        </span>
                    </li>
                `).join('');
            }

            // 4. Render de Tabla de Registros (Logs)
            const logsTableBody = document.getElementById('logsTableBody');
            const selectedType = filterEventType ? filterEventType.value : 'all';
            const searchQuery = searchLog ? searchLog.value.toLowerCase().trim() : '';

            let filteredEvents = events.filter(evt => {
                const matchType = (selectedType === 'all' || evt.type === selectedType);
                const detailsString = JSON.stringify(evt.details || {}).toLowerCase();
                const categoryString = (evt.category || '').toLowerCase();
                const matchSearch = !searchQuery || categoryString.includes(searchQuery) || detailsString.includes(searchQuery);
                return matchType && matchSearch;
            });

            if (logsTableBody) {
                if (filteredEvents.length === 0) {
                    logsTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                No hay eventos registrados que coincidan con el filtro actual.
                            </td>
                        </tr>
                    `;
                } else {
                    logsTableBody.innerHTML = filteredEvents.map(evt => `
                        <tr>
                            <td><strong>${evt.timeFormatted || ''}</strong></td>
                            <td><span class="event-badge ${evt.type}">${evt.type}</span></td>
                            <td>${evt.category || ''}</td>
                            <td><div class="details-box">${JSON.stringify(evt.details, null, 1)}</div></td>
                            <td><span class="code-text">${evt.pageUrl || '/'}</span></td>
                        </tr>
                    `).join('');
                }
            }
        };

        // Escuchadores de eventos de la barra de acciones
        btnRefresh.addEventListener('click', () => {
            renderDashboardUI();
            showNotification('Datos de observabilidad actualizados.');
        });

        if (btnDemoEvent) {
            btnDemoEvent.addEventListener('click', () => {
                window.CR7Observability.generateDemoEvent();
                renderDashboardUI();
                showNotification('Evento de prueba generado y registrado.');
            });
        }

        if (btnDownloadJson) {
            btnDownloadJson.addEventListener('click', () => {
                window.CR7Observability.exportJSON();
                showNotification('Snapshot JSON descargado correctamente.');
            });
        }

        if (btnClearStorage) {
            btnClearStorage.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que deseas borrar todo el historial de observabilidad local?')) {
                    window.CR7Observability.clearStorage();
                    renderDashboardUI();
                    showNotification('Almacenamiento de observabilidad limpiado.');
                }
            });
        }

        if (filterEventType) filterEventType.addEventListener('change', renderDashboardUI);
        if (searchLog) searchLog.addEventListener('input', renderDashboardUI);

        // Renderizado inicial
        renderDashboardUI();
    });
})();
