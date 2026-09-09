# AUDITORÍA DE ACCESIBILIDAD, UX Y DISEÑO RESPONSIVE

**Archivos auditados:** `index.html`, `styles.css`, `script.js`  
**Normativa:** WCAG 2.2 AA  
**Fecha:** 2026-09-07

---

## 1. RESUMEN EJECUTIVO

La página tribute a Cristiano Ronaldo presenta una **buena base semántica y de accesibilidad** con ARIA bien implementado, textos alternativos descriptivos y estructura lógica. Se identificaron **16 hallazgos** distribuidos en: 2 críticos, 4 altos, 6 medios y 4 bajos. Los problemas más relevantes son la eliminación del outline de foco sin alternativa adecuada, la falta de trampa de foco en el modal, ausencia de enlace "skip navigation" y posibles problemas de objetivos táctiles en pantallas pequeñas.

**Nivel de cumplimiento WCAG 2.2 AA:** Parcial — requiere correcciones para alcanzar conformidad completa.

---

## 2. HALLAZGOS

### 2.1 HALLAZGOS CRÍTICOS

#### C1: Outline de foco eliminado sin alternativa robusta
- **WCAG:** 2.4.7 Focus Visible (Nivel AA)
- **Archivo:** `styles.css:62-64`
- **Elemento:** `:focus { outline: none; }`
- **Problema:** Se elimina el outline nativo del navegador para todos los elementos. Aunque existe `:focus-visible` (línea 66), algunos navegadores antiguos o configuraciones de asistencia podrían no activarlo, dejando usuarios de teclado sin indicador de foco visible.
- **Corrección:** No usar `outline: none` en `:focus`. En su lugar, usar solo `:focus-visible` para ocultar el outline en foco por ratón, o agregar una regla `:focus:not(:focus-visible)` que mantenga el outline nativo.

#### C2: Modal sin trampa de foco (focus trap)
- **WCAG:** 2.4.3 Focus Order (Nivel A)
- **Archivo:** `script.js:148-167`, `index.html:286-294`
- **Elemento:** `#imageModal`
- **Problema:** Al abrir el modal, el foco se mueve al botón de cerrar, pero no existe trampa de foco. Un usuario puede hacer Tab y navegar a elementos detrás del modal (off-screen), violando el patron de dialog modal.
- **Corrección:** Implementar focus trap que intercepte Tab/Shift+Tab dentro del modal y mantenga el foco en los elementos interactivos del modal (botón cerrar, imagen). Usar `inert` en el contenido detrás del modal o gestionar tabindex.

---

### 2.2 HALLAZGOS ALTOS

#### A1: Ausencia de enlace "Skip Navigation"
- **WCAG:** 2.4.1 Bypass Blocks (Nivel A)
- **Archivo:** `index.html:18-41` (header y nav)
- **Problema:** No existe enlace para saltar la navegación y acceder directamente al contenido principal. Usuarios de teclado deben presionar Tab ~15 veces para llegar al contenido.
- **Corrección:** Agregar un enlace oculto visualmente pero accesible al inicio del `<body>` que apunte a `#main` o al primer `<section>`.

#### A2: Indicadores de estado insuficientes en filtros ARIA
- **WCAG:** 4.1.2 Name, Role, Value (Nivel A)
- **Archivo:** `index.html:123-131`, `script.js:44-66`
- **Elemento:** `.timeline-filters` con `role="tablist"`
- **Problema:** Los filtros usan `role="tab"` y `aria-selected`, pero no tienen `role="tabpanel"` asociado ni `aria-controls` que apunte al panel correspondiente. El patrón ARIA de tabs está incompleto.
- **Corrección:** Asociar cada tab con su panel usando `aria-controls` apuntando al `#timelineContainer`, o reconsiderar si el patrón adecuado es `role="tablist"` (dado que los paneles no son ocultados con `aria-hidden` sino con CSS `display:none`/clase `hidden`).

#### A3: Elementos decorativos de emoji expuestos a tecnologías de asistencia
- **WCAG:** 1.1.1 Non-text Content (Nivel A)
- **Archivo:** `index.html:210,217,223,229,235`
- **Elemento:** `.stat-icon` (⚽, 🏆, ⭐, 👟, 🇵🇹)
- **Problema:** Los emojis en las tarjetas de estadísticas son leídos por lectores de pantalla como "balón de fútbol", "copa", etc., añadiendo ruido sin valor informativo real.
- **Corrección:** Agregar `aria-hidden="true"` a los emojis decorativos, o usar `role="presentation"` si no aportan información.

#### A4: Animación de contadores sin región aria-live
- **WCAG:** 4.1.3 Status Messages (Nivel AA)
- **Archivo:** `script.js:98-117`, `index.html:211-239`
- **Elemento:** `.stat-number[data-target]`
- **Problema:** Los contadores se actualizan dinámicamente sin notificar a tecnologías de asistencia. Un usuario de lector de pantalla no percibe la animación de conteo.
- **Corrección:** Envolver los números en un `aria-live="polite"` o `role="status"` para que el valor final sea anunciado al terminar la animación.

---

### 2.3 HALLAZGOS MEDIOS

#### M1: Objetivos táctiles potencialmente pequeños en galería
- **WCAG:** 2.5.8 Target Size (Nivel AA)
- **Archivo:** `styles.css:737-748`
- **Elemento:** `.view-btn` (botón "Ampliar imagen")
- **Problema:** El botón tiene `padding: 0.4rem 1rem` (~6.4px vertical, ~16px horizontal). En un dispositivo táctil, esto puede resultar en un objetivo menor a 44x44px recomendado por WCAG 2.5.8.
- **Corrección:** Aumentar padding a al menos `0.75rem 1.5rem` para garantizar un tamaño de objetivo mínimo de 44x44 CSS px.

#### M2: Superposición de galería solo visible en hover
- **WCAG:** 1.3.1 Info and Relationships (Nivel A)
- **Archivo:** `styles.css:708-723`
- **Elemento:** `.galeria-overlay`
- **Problema:** La superposición con el botón "Ampliar imagen" solo aparece en `:hover` y `:focus-within`. En dispositivos táctiles (sin hover), el contenido solo se muestra al tocar la imagen, pero no hay indicador visual de que es interactuable.
- **Corrección:** Considerar mostrar la superposición siempre en móvil, o agregar un indicador visual (icono) sobre la imagen que sugiera que es clickeable.

#### M3: Sin respetar prefers-reduced-motion
- **WCAG:** 2.3.3 Animation from Interactions (Nivel AAA, pero recomendado en AA)
- **Archivo:** `styles.css:891-911`, `script.js:98-117`
- **Elemento:** Animaciones `fadeInUp`, `scrollWheel`, contadores animados
- **Problema:** Las animaciones CSS y JavaScript se ejecutan sin consultar la preferencia `prefers-reduced-motion`. Usuarios con vértigo o sensibilidad al movimiento no pueden desactivarlas.
- **Corrección:** Agregar `@media (prefers-reduced-motion: reduce)` que deshabilite o reduzca las animaciones. En JS, consultar `window.matchMedia('(prefers-reduced-motion: reduce)')`.

#### M4: Smooth scroll sin consultar preferencia de movimiento
- **WCAG:** 2.3.3 Animation from Interactions
- **Archivo:** `styles.css:49`
- **Elemento:** `html { scroll-behavior: smooth; }`
- **Problema:** El scroll suave puede causar mareos en usuarios sensibles al movimiento.
- **Corrección:** Envolver en `@media (prefers-reduced-motion: no-preference)`.

#### M5: Overflow hidden en body puede ocultar contenido
- **WCAG:** 1.4.10 Reflow (Nivel AA)
- **Archivo:** `styles.css:58`
- **Elemento:** `body { overflow-x: hidden; }`
- **Problema:** `overflow-x: hidden` oculta horizontalmente cualquier contenido que se desborde, lo que podría enmascarar problemas de diseño en lugar de resolverlos. En 320px, elementos con ancho fijo podrían ser cortados silenciosamente.
- **Corrección:** Investigar y corregir las causas del desbordamiento en lugar de ocultarlo. Usar herramientas de inspección para identificar elementos que exceden el ancho del viewport.

#### M6: Galería grid puede causar scroll horizontal en 320px
- **WCAG:** 1.4.10 Reflow (Nivel AA)
- **Archivo:** `styles.css:682-686`
- **Elemento:** `.galeria-grid { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }`
- **Problema:** En un viewport de 320px, `minmax(320px, 1fr)` forzaría un ancho mínimo de 320px por columna, pero el contenedor tiene `width: 90%` (~288px). Esto causaría un desbordamiento horizontal.
- **Corrección:** Usar `minmax(min(320px, 100%), 1fr)` o agregar un breakpoint específico para 320px que cambie a una columna.

---

### 2.4 HALLAZGOS BAJOS

#### B1: Enlaces externos sin indicación explícita de apertura en nueva ventana
- **WCAG:** 3.2.5 Change on Request (Nivel AAA, pero recomendado)
- **Archivo:** `index.html:319-322`
- **Elemento:** Enlaces con `target="_blank"`
- **Problema:** Los enlaces externos incluyen el icono `↗` visualmente, pero no tienen `aria-label` que indique "abre en nueva ventana". El icono podría no ser interpretado por todos los usuarios.
- **Corrección:** Agregar `aria-label` descriptivo o un texto visual " (se abre en nueva ventana)" oculto visualmente con `sr-only`.

#### B2: Heading hierarchy usa h4 en sidebar sin h3 previo
- **WCAG:** 1.3.1 Info and Relationships (Nivel A)
- **Archivo:** `index.html:87,99`
- **Elemento:** `<h4>Ficha Técnica</h4>`, `<h4>Valores Clave</h4>`
- **Problema:** Dentro de `.biografia-sidebar`, los h4 aparecen sin un h3 que los agrupe. Aunque están en un контекsto visual claro, la jerarquía saltaría de h2 (section title) a h4.
- **Corrección:** Considerar usar h3 para "Ficha Técnica" y "Valores Clave" para mantener la jerarquía correcta, o agregar un h3 contenedor en el sidebar.

#### B3: Etiquetas ARIA redundantes en filtros
- **WCAG:** — (buena práctica)
- **Archivo:** `index.html:124-131`
- **Elemento:** `role="tab"` + texto visible en botones
- **Problema:** Los botones de filtro tienen texto visible descriptivo ("Todos", "Sporting CP", etc.) que ya proporciona nombre accesible. El `role="tab"` añade semántica pero el patrón no está completo (ver A2).
- **Corrección:** Completar el patrón ARIA de tabs o simplificar a botones con `aria-pressed` si no se usa el patrón tablist.

#### B4: Scroll indicator sin role ni aria-label descriptivo suficiente
- **WCAG:** 1.1.1 Non-text Content (Nivel A)
- **Archivo:** `index.html:56-62`
- **Elemento:** `.scroll-indicator` con `aria-label="Desplazarse hacia abajo"`
- **Problema:** El enlace contiene un elemento visual decorativo (mouse/wheel) sin contenido de texto visible. El `aria-label` es correcto, pero el elemento `span.mouse` y `span.wheel` no están ocultos de tecnologías de asistencia.
- **Corrección:** Agregar `aria-hidden="true"` a los spans decorativos o usar un icono SVG con `aria-hidden="true"` y rely en el aria-label.

---

## 3. CRITERIOS WCAG 2.2 AA QUE CUMPLEN

| Criterio | Nivel | Estado |
|----------|-------|--------|
| 1.1.1 Non-text Content (textos alternativos en galería) | A | ✅ CUMPLE |
| 1.3.1 Info and Relationships (estructura semántica) | A | ✅ CUMPLE |
| 1.3.2 Meaningful Sequence | A | ✅ CUMPLE |
| 1.3.4 Orientation | AA | ✅ CUMPLE |
| 1.4.1 Use of Color | A | ✅ CUMPLE |
| 1.4.3 Contrast Minimum (texto principal) | AA | ✅ CUMPLE |
| 1.4.4 Resize Text | AA | ✅ CUMPLE |
| 1.4.12 Text Spacing | AA | ✅ CUMPLE |
| 2.1.1 Keyboard | A | ✅ CUMPLE |
| 2.1.2 No Keyboard Trap | A | ⚠️ PARCIAL (falta en modal) |
| 2.4.2 Page Titled | A | ✅ CUMPLE |
| 2.4.4 Link Purpose (enlaces de navegación) | A | ✅ CUMPLE |
| 2.4.6 Headings and Labels | AA | ✅ CUMPLE |
| 2.5.3 Label in Name | A | ✅ CUMPLE |
| 3.1.1 Language of Page | A | ✅ CUMPLE |
| 3.1.2 Language of Parts | AA | ✅ CUMPLE |
| 4.1.2 Name, Role, Value | A | ⚠️ PARCIAL (patrón tabs incompleto) |

---

## 4. RESUMEN DE HALLAZGOS

| Severidad | Cantidad | IDs |
|-----------|----------|-----|
| Crítica | 2 | C1, C2 |
| Alta | 4 | A1, A2, A3, A4 |
| Media | 6 | M1, M2, M3, M4, M5, M6 |
| Baja | 4 | B1, B2, B3, B4 |
| **Total** | **16** | |

---

## 5. PRUEBAS A REPETIR DESPUÉS DE CORREGIR

### 5.1 Accesibilidad con teclado
- [ ] Navegar toda la página solo con Tab/Shift+Tab
- [ ] Verificar que el foco visible aparece en todos los elementos interactivos
- [ ] Abrir y cerrar el modal con teclado, verificando trampa de foco
- [ ] Navegar los filtros de timeline con flechas izquierda/derecha
- [ ] Presionar Escape para cerrar modal y menú móvil
- [ ] Verificar que el skip navigation lleva al contenido principal

### 5.2 Lector de pantalla
- [ ] NVDA/VoiceOver: Verificar que los contadores de estadísticas anuncian el valor final
- [ ] Verificar que los emojis decorativos no son leídos
- [ ] Verificar que el modal anuncia "diálogo" y tiene nombre accesible
- [ ] Verificar que los filtros de timeline anuncian su estado (seleccionado/no seleccionado)

### 5.3 Responsive design
- [ ] 320px: Verificar que no hay scroll horizontal
- [ ] 390px: Verificar que la galería muestra 1 columna
- [ ] 768px: Verificar que el menú hamburguesa funciona correctamente
- [ ] Escritorio: Verificar que la navegación horizontal se muestra completa
- [ ] Verificar que todos los objetivos táctiles son ≥44x44px

### 5.4 Contraste y visual
- [ ] Verificar contraste de todos los textos con herramienta (axe, WAVE)
- [ ] Verificar que las animaciones se desactivan con prefers-reduced-motion
- [ ] Verificar que el scroll suave se desactiva con prefers-reduced-motion
- [ ] Verificar que el contenido no se oculta con overflow-x: hidden

### 5.5 JavaScript
- [ ] Verificar que no hay errores en consola
- [ ] Verificar que el fallback de IntersectionObserver funciona
- [ ] Verificar que el scroll spy actualiza correctamente el estado activo
- [ ] Probar con JavaScript deshabilitado (progressive enhancement)

### 5.6 Automatizadas
- [ ] Ejecutar axe-core o Lighthouse accessibility audit
- [ ] Ejecutar WAVE browser extension
- [ ] Ejecutar pa11y con las URLs de prueba
- [ ] Verificar HTML con validator.w3.org
