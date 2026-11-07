(async function(){
  try {
    if(!window.COCINA_BUNDLE) throw new Error('No se encontraron los datos');
    if(!('DecompressionStream' in window)) throw new Error('Navegador sin compatibilidad gzip');
    const binary=atob(window.COCINA_BUNDLE);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const bundle=JSON.parse(await new Response(stream).text());
    const style=document.createElement('style');style.textContent=bundle['style.css'];document.head.appendChild(style);
    for(const name of ['data.js','app.js']){
      const script=document.createElement('script');script.textContent=bundle[name];document.body.appendChild(script);
    }
    delete window.COCINA_BUNDLE;
  }catch(err){
    console.error('Error al iniciar Mi despensa:',err);
    const el=document.getElementById('content');
    if(el)el.innerHTML='<p>No se ha podido abrir la aplicación. Recarga esta página con conexión a Internet o utiliza Safari actualizado.</p>';
  }
})();