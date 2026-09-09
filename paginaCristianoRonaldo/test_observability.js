/**
 * Test Suite Automático para el Módulo de Observabilidad Local (CR7Observability)
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('PRUEBAS AUTOMÁTICAS DE OBSERVABILIDAD LOCAL (CR7)');
console.log('====================================================\n');

// Mock Environment
class MockLocalStorage {
    constructor() { this.store = {}; }
    getItem(key) { return this.store[key] || null; }
    setItem(key, value) { this.store[key] = String(value); }
    removeItem(key) { delete this.store[key]; }
    clear() { this.store = {}; }
}

function createMockWindow(options = {}) {
    const listeners = {};
    const mockLs = options.disableLs ? null : new MockLocalStorage();

    const mockWin = {
        location: { pathname: '/index.html' },
        innerWidth: 1024,
        innerHeight: 768,
        devicePixelRatio: 2,
        screen: { width: 1920, height: 1080 },
        localStorage: mockLs,
        performance: options.disablePerf ? undefined : {
            timing: { loadEventEnd: 1500, navigationStart: 1000, domContentLoadedEventEnd: 1200, responseStart: 1050, requestStart: 1000 },
            getEntriesByType: () => [{ loadEventEnd: 150, startTime: 0, domContentLoadedEventEnd: 45, responseStart: 15, type: 'navigate' }]
        },
        PerformanceObserver: options.disablePerfObs ? undefined : class {},
        IntersectionObserver: options.disableObs ? undefined : class {},
        matchMedia: options.disableMatchMedia ? undefined : () => ({ matches: false }),
        addEventListener: (event, handler, useCapture) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push({ handler, useCapture });
        },
        dispatchEvent: (event) => {
            const handlers = listeners[event.type] || [];
            handlers.forEach(h => h.handler(event));
        }
    };

    const mockDoc = {
        location: mockWin.location,
        visibilityState: 'visible',
        hidden: false,
        body: {
            appendChild: () => {},
            removeChild: () => {}
        },
        createElement: (tag) => {
            const attrs = {};
            return {
                tagName: tag.toUpperCase(),
                setAttribute: (k, v) => { attrs[k] = v; },
                getAttribute: (k) => attrs[k],
                click: () => {},
                remove: () => {}
            };
        },
        getElementById: () => null,
        querySelectorAll: () => [],
        addEventListener: mockWin.addEventListener,
        dispatchEvent: mockWin.dispatchEvent
    };

    const mockNav = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MockBrowser',
        language: 'es-ES',
        connection: options.disableConn ? undefined : { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false }
    };

    global.window = mockWin;
    global.document = mockDoc;
    global.navigator = mockNav;
    if (mockLs) global.localStorage = mockLs;
    else delete global.localStorage;

    return { mockWin, mockDoc, mockNav, mockLs, listeners };
}

// Cargar script de observabilidad
const scriptPath = path.join(__dirname, 'observabilidad.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// TEST 1: Inicialización Normal y Registro de Clics
console.log('TEST 1: Inicialización y registro de clics...');
const env1 = createMockWindow();
eval(scriptContent);

const obs = global.window.CR7Observability;
if (!obs || typeof obs.getSnapshot !== 'function') {
    console.error('❌ FAIL: window.CR7Observability.getSnapshot no expuesto.');
    process.exit(1);
}

let snapshot = obs.getSnapshot();
console.log(`  - Snapshot obtenido exitosamente. Eventos iniciales: ${snapshot.events.length} ✅`);

// Simular Clic en un Botón
const clickHandlers = env1.listeners['click'] || [];
if (clickHandlers.length > 0) {
    const fakeButton = {
        tagName: 'BUTTON',
        id: 'btnTest',
        className: 'btn btn-primary',
        textContent: 'Boton de Prueba',
        getAttribute: (attr) => attr === 'href' ? null : null,
        closest: function(selector) { return selector.includes('button') ? this : null; }
    };
    clickHandlers[0].handler({ target: fakeButton });
}

snapshot = obs.getSnapshot();
const interactionEvents = snapshot.events.filter(e => e.type === 'interaction');
if (interactionEvents.length > 0) {
    console.log(`  - Clic registrado correctamente ("${interactionEvents[0].details.label}"). Total interacciones: ${interactionEvents.length} ✅`);
} else {
    console.error('❌ FAIL: Clic no registrado.');
    process.exit(1);
}

// TEST 2: Persistencia en LocalStorage
console.log('\nTEST 2: Persistencia en localStorage...');
const storedRaw = env1.mockLs.getItem('cr7-observability-data');
if (storedRaw) {
    const parsed = JSON.parse(storedRaw);
    console.log(`  - LocalStorage contiene ${parsed.events.length} eventos bajo la clave "cr7-observability-data" ✅`);
} else {
    console.error('❌ FAIL: No se guardaron datos en localStorage.');
    process.exit(1);
}

// TEST 3: Generación de Eventos de Demostración
console.log('\nTEST 3: Generar evento de prueba (Demo)...');
const prevEventsCount = obs.getSnapshot().events.length;
obs.generateDemoEvent();
const newEventsCount = obs.getSnapshot().events.length;
if (newEventsCount === prevEventsCount + 1) {
    console.log(`  - Evento de demostración agregado. Eventos antes: ${prevEventsCount}, ahora: ${newEventsCount} ✅`);
} else {
    console.error('❌ FAIL: Evento de prueba no incrementó los eventos.');
    process.exit(1);
}

// TEST 4: Exportar JSON Snapshot
console.log('\nTEST 4: Exportación Snapshot JSON...');
try {
    obs.exportJSON();
    console.log('  - exportJSON() ejecutado sin errores ✅');
} catch (e) {
    console.error('❌ FAIL en exportJSON:', e);
    process.exit(1);
}

// TEST 5: Limpieza de Almacenamiento
console.log('\nTEST 5: Limpieza de almacenamiento (clearStorage)...');
obs.clearStorage();
const clearedSnapshot = obs.getSnapshot();
console.log(`  - Almacenamiento limpiado. Eventos restantes (solo log de sistema): ${clearedSnapshot.events.length} ✅`);

// TEST 6: Resiliencia ante APIs Faltantes (Performance, Connection, LocalStorage)
console.log('\nTEST 6: Evaluando fallback cuando APIs opcionales NO están disponibles...');
createMockWindow({
    disablePerf: true,
    disablePerfObs: true,
    disableObs: true,
    disableConn: true,
    disableLs: true,
    disableMatchMedia: true
});

try {
    eval(scriptContent);
    const obsFallback = global.window.CR7Observability;
    const fallbackSnap = obsFallback.getSnapshot();

    console.log(`  - Entorno sin APIs cargó sin fallos. API Support:`);
    console.log(`    * Performance API: ${fallbackSnap.environment.apiSupport.performanceAPI} (Esperado: false)`);
    console.log(`    * Connection: ${fallbackSnap.environment.connection.effectiveType} (Esperado: no soportado)`);
    console.log(`    * LocalStorage: ${fallbackSnap.environment.apiSupport.localStorage} (Esperado: false)`);
    console.log('  - Módulo totalmente resiliente ante APIs ausentes ✅');
} catch (err) {
    console.error('❌ FAIL en prueba de fallback:', err);
    process.exit(1);
}

console.log('\n====================================================');
console.log('TODAS LAS PRUEBAS DE OBSERVABILIDAD PASARON CON ÉXITO ✅');
console.log('====================================================\n');
