# Mi despensa · 30 días

Web app para iPhone con listas de compra para 1–20 personas, menús para 28 días, 40 recetas, semana sin fuego y guía PDF A4.

## Ponerla en marcha desde GitHub

La web está lista para publicarse desde la raíz de la rama `main`; no necesita servidor, base de datos ni compilación.

1. Abrir [Settings → Pages](https://github.com/adrianseguradeorta-prog/cocina/settings/pages).
2. En **Build and deployment**, elegir **Source: Deploy from a branch**.
3. Elegir **Branch: main**, carpeta **/(root)** y pulsar **Save**.

GitHub publica automáticamente el contenido de `main`. La dirección prevista es:

**https://adrianseguradeorta-prog.github.io/cocina/**

No consideres esa dirección operativa hasta que GitHub muestre que Pages se ha publicado. Esta opción necesita un plan compatible con Pages en repositorios privados (por ejemplo GitHub Pro). En GitHub Free es necesario usar un repositorio público o un servicio de hosting externo, como Vercel. **No cambies el repositorio a público sin valorar qué archivos quieres exponer.**

Si la opción por rama no está disponible, también existe el workflow manual `Publicar Mi despensa para iPhone` para desplegar mediante **GitHub Actions** una vez habilitada esa fuente en Settings → Pages.

## Instalarla en iPhone

1. Abrir la dirección HTTPS de la web en **Safari**.
2. Tocar **Compartir → Añadir a pantalla de inicio → Añadir**.
3. Abrir el nuevo icono «Mi despensa» en la pantalla de inicio.

Tras cargar todos sus recursos la primera vez, la app permite navegar, consultar menús y marcar compras sin Internet. Los datos de compra se guardan localmente en ese iPhone y no se sincronizan entre dispositivos.

## Archivos

- `index.html` y `style.css`: interfaz.
- `data.js` y `app.js`: calculadora, menús, recetas y listas.
- `sw.js`, `manifest.webmanifest` e iconos: uso offline e instalación.
- `Guia_despensa_30_dias_noviembre_2026.pdf`: PDF A4, también enlazado en la app.
- `Mi_despensa_webapp_iPhone.zip`: descarga del paquete.
- `payload.js` y `bootstrap.js`: copia técnica antigua; no se utilizan para iniciar la web publicada.

Los precios son orientativos de noviembre de 2026. Comprueba conservación y seguridad de cada alimento. No utilices hornillos, braseros ni aparatos de combustión no autorizados para interiores dentro de casa.
