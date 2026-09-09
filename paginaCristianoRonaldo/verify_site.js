const fs = require('fs');
const path = require('path');

console.log('--- RUNNING TERMINAL COMPROBATIONS FOR ALL PAGES ---');

const pages = ['index.html', 'observabilidad.html'];

pages.forEach(page => {
    console.log(`\n=== Evaluando ${page} ===`);
    const pagePath = path.join(__dirname, page);
    const content = fs.readFileSync(pagePath, 'utf8');

    const hasCss = /styles\.css/.test(content);
    const hasJs = /observabilidad\.js/.test(content);
    console.log(`- Carga de CSS: ${hasCss ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`- Carga de JS Observabilidad: ${hasJs ? 'PASS ✅' : 'FAIL ❌'}`);

    const idMatches = [...content.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
    const idSet = new Set(idMatches);

    const hrefMatches = [...content.matchAll(/href=["']#([^"']+)["']/g)].map(m => m[1]);
    const uniqueHrefs = Array.from(new Set(hrefMatches));

    let broken = 0;
    uniqueHrefs.forEach(h => {
        if (!idSet.has(h)) broken++;
    });
    console.log(`- Enlaces internos probados (${uniqueHrefs.length}): ${broken === 0 ? '0 rotos ✅' : broken + ' rotos ❌'}`);
});

console.log('\n--- FIN DE COMPROBACIONES TERMINAL ---');
