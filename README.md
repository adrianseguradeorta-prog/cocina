# Mi despensa · 30 días

Aplicación web progresiva (PWA) de la guía «Un mes de comida en casa» (noviembre de 2026). Incluye listas de compra con cantidades y precios por persona, menús para 28 días, 40 recetas, semana sin fuego, recomendaciones de conservación y fuentes.

## Ver la aplicación

El punto de entrada es `index.html`. Para instalarla en un iPhone, es necesario alojar estos archivos por HTTPS; abre la URL en Safari y elige **Compartir → Añadir a pantalla de inicio**. Una vez abierta con Internet y guardados los recursos por el service worker, funciona sin conexión. No se ha publicado automáticamente una web pública.

## Archivos

- `index.html`: página y controles.
- `payload.js`: datos, estilos y lógica originales comprimidos en gzip/base64 para transporte.
- `bootstrap.js`: carga los recursos del paquete en el navegador.
- `sw.js`: almacenamiento sin conexión.
- `manifest.webmanifest` e iconos: instalación como web app.

Los precios son orientativos y no se actualizan solos. Las casillas de compra se guardan en el navegador del propio dispositivo y no se sincronizan entre teléfonos. Requiere Safari moderno compatible con `DecompressionStream`.

## Seguridad

Nunca utilizar hornillos, braseros, barbacoas ni generadores de combustión dentro de la vivienda. En los aparatos de gas seguir el manual del fabricante. Las recomendaciones generales de conservación no sustituyen las condiciones de seguridad de cada alimento o situación médica.
