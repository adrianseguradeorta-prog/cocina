# Mi despensa · 30 días

Aplicación web progresiva (PWA) con listas de compra para 1–20 personas, 28 días de menús, 40 recetas, semana sin fuego y guía PDF imprimible.

## Uso en iPhone

Una vez publicado el sitio, abrir la dirección HTTPS en Safari y tocar **Compartir → Añadir a pantalla de inicio**. La app funciona sin conexión después de que se hayan descargado sus recursos en la primera visita. Las compras marcadas se guardan en el teléfono, sin sincronización con otros dispositivos.

## Publicación con GitHub Pages

El repositorio incluye el workflow `.github/workflows/publicar-web.yml` que verifica los archivos y publica la web con GitHub Actions tras cada cambio en `main`.

Si GitHub Pages aún no está habilitado, abrir **Settings → Pages → Build and deployment → Source → GitHub Actions**. Después se puede repetir el workflow desde la pestaña Actions. En cuentas GitHub Free, GitHub Pages exige un repositorio público; un repositorio privado requiere un plan compatible con GitHub Pages.

La URL habitual de proyecto (solo una vez activado y desplegado) es `https://adrianseguradeorta-prog.github.io/cocina/`.

## Archivos de la aplicación

- `index.html`, `style.css`: interfaz adaptada a móvil.
- `data.js`, `app.js`: menús, ingredientes, calculadora y recetas.
- `sw.js`, `manifest.webmanifest`, iconos: aplicación instalable y uso sin conexión.
- `Guia_despensa_30_dias_noviembre_2026.pdf`: guía A4.
- `Mi_despensa_webapp_iPhone.zip`: copia descargable.

El contenido de `payload.js` y `bootstrap.js` permanece como copia técnica previa; el sitio publicado carga `data.js` y `app.js` directamente.

Los precios son orientativos; deben revisarse en la tienda. No enciendas hornillos o dispositivos de combustión en espacios interiores sin ventilación ni autorización del fabricante.
