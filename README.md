# Mi despensa · planificador de 30 días

Web app instalable para iPhone, con compras, 28 días de menú y 180 recetas de despensa. La semana sin fuego incluye siete días.

## Abrir e instalar

La web se publica desde la rama **main** de GitHub Pages:

**https://adrianseguradeorta-prog.github.io/cocina/**

Abre la dirección en Safari y selecciona **Compartir → Añadir a pantalla de inicio**. Si GitHub Pages no aparece disponible, comprueba su estado en [Settings → Pages](https://github.com/adrianseguradeorta-prog/cocina/settings/pages). El repositorio permanece privado; el sitio de Pages puede ser público aunque su código esté en un repositorio privado.

## Funciones

- **Compra:** selecciona plan y número de adultos. Verás el coste pendiente por envases y el descuento de lo que ya tienes. Puedes elegir entre «reserva del plan + menú» y «solo lo necesario para el menú».
- **Menús:** 28 días (o siete sin fuego), con desayuno, comida y cena. Cada plato tiene un enlace a su receta y un desplegable para cambiarlo.
- **Recetas:** recetario ampliado a 180 recetas (140 nuevas), con buscador por nombre e ingredientes y filtro por categorías. Abre cualquier receta desde el menú o la despensa.
- **Mi despensa:** marca los productos disponibles e indica cuántos envases completos tienes. La app propone recetas con todos sus ingredientes y otras para las que te falta poco. El menú da preferencia a lo disponible.
- **No me gusta:** buscador autocompletable sobre todo el catálogo. Al escribir «maca» aparecen «macarrones» como ingrediente y las recetas que coinciden; puedes excluir un alimento entero o solamente platos concretos y revertir la selección. El menú y la compra se recalculan.
- **Actualizaciones:** cuando se abre o se vuelve a la aplicación con conexión, consulta \`version.json\` y comprueba su service worker. Si hay cambios, presenta un aviso; **no interrumpe la sesión ni borra las compras**. El cambio se aplica cuando pulsas «Actualizar ahora».

Los cambios se guardan en el almacenamiento local de ese navegador; no se sincronizan entre varios teléfonos. La compra marcada en la versión anterior se migra la primera vez que se inicia la nueva. No se descuentan automáticamente los ingredientes por consultar una receta.

## Criterios de cálculo

- «Tengo» representa **un envase completo**. Para más unidades, usa + o −. No equivale a stock indefinido.
- Las recetas usan cantidades estimadas por adulto para ajustar la compra. El presupuesto no es una garantía nutricional ni un precio cerrado; comprueba cantidades, raciones y precios antes de comprar.
- Si no hay recetas compatibles con tus gustos, el menú deja el hueco sin inventar una preparación.
- El modo «sin fuego» únicamente elige recetas marcadas sin cocción.
- La recomendación «puedes cocinar con lo que tienes» comprueba ingredientes por receta, **no descuenta** cantidades de comidas anteriores. La lista de compra sí agrega las cantidades del menú.

## Ficheros y pruebas

\`index.html\`, \`style.css\`, \`data.js\`, \`logic.js\`, \`app.js\`, \`sw.js\`, \`version.json\`, \`manifest.webmanifest\`, iconos y guía PDF forman la PWA. \`tests/logic.test.js\` y \`tests/interface.test.js\` prueban las cuatro modalidades y la navegación. El workflow \`generar-descargas.yml\` crea el ZIP directamente desde estos archivos, sin recuperar versiones antiguas.

Para mantener el servicio durante una actualización, desarrolla y prueba en una rama separada. Solo después de pasar las pruebas, fusiona los cambios en \`main\`. GitHub Pages despliega la nueva versión y quien tenga la app instalada verá un aviso al volver a utilizarla.

## Seguridad y privacidad

No utilices hornillos, braseros ni equipos de combustión no autorizados dentro de la vivienda. Consulta las condiciones del fabricante, la seguridad de la conservación y las necesidades especiales de cada persona. Los precios de noviembre de 2026 son orientativos. La guía impresa incluida sigue siendo la edición original de 40 recetas; las 180 están disponibles en esta aplicación web y en sus archivos descargables. No se envía el inventario doméstico a ningún servidor de la aplicación.
