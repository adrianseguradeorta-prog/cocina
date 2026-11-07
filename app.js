(function () {
  'use strict';
  const M = window.COCINA_LOGIC;
  if (!M) throw new Error('No se ha cargado el motor de la despensa');
  const D = M.D;
  const VERSION = '2026.11.07.2';
  const KEY = 'mi_despensa_estado_v2';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
  const money = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n);
  const defaultState = () => ({
    plan:'basico', people:1, inventory:{}, prefs:{dislikedIngredients:[],dislikedRecipes:[]},
    overrides:{},onlyMenu:false,checked:{}
  });
  function load() {
    try {
      const old=JSON.parse(localStorage.getItem(KEY)||'null');
      const data=Object.assign(defaultState(),old||{});
      data.inventory=(data.inventory && typeof data.inventory==='object') ? data.inventory : {};
      data.prefs=(data.prefs && typeof data.prefs==='object') ? data.prefs : {};
      data.prefs.dislikedIngredients=Array.isArray(data.prefs.dislikedIngredients)?data.prefs.dislikedIngredients:[];
      data.prefs.dislikedRecipes=Array.isArray(data.prefs.dislikedRecipes)?data.prefs.dislikedRecipes:[];
      data.overrides=(data.overrides && typeof data.overrides==='object') ? data.overrides : {};
      data.checked=(data.checked && typeof data.checked==='object') ? data.checked : {};
      if (!old) {
        // Migración: las compras marcadas en la primera versión no se pierden.
        const previous=JSON.parse(localStorage.getItem('cocina_checked')||'{}');
        data.checked=previous && typeof previous==='object' ? previous : {};
      }
      if(!D.plans[data.plan]) data.plan='basico';
      data.people=Math.max(1,Math.min(20,Math.floor(Number(data.people)||1)));
      return data;
    } catch (error) { return defaultState(); }
  }
  const state=load();
  let tab='compra', recipeQuery='', pantryQuery='', shoppingQuery='';
  let menuDays=[];
  const saleCount=id=>Math.max(0,Math.min(100,Math.floor(Number(state.inventory[id])||0)));
  function persist() { try {localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('No se pudo guardar el estado',e);} }
  function compute() {
    menuDays=M.menu({plan:state.plan,inventory:state.inventory,prefs:state.prefs,overrides:state.overrides});
    return M.shopping({plan:state.plan,people:state.people,inventory:state.inventory,prefs:state.prefs,onlyMenu:state.onlyMenu},menuDays);
  }
  function hasFood(id) { return state.prefs.dislikedIngredients.includes(id); }
  function dislikesRecipe(id) { return state.prefs.dislikedRecipes.map(Number).includes(Number(id)); }
  function planningMessage() {
    return state.onlyMenu
      ? 'Compra orientativa solo para las recetas del menú. El cálculo usa raciones de referencia y envases enteros; revisa las necesidades de tu hogar.'
      : 'Reserva del plan más ingredientes necesarios para el menú, descontando los envases que ya tienes. Los precios no se actualizan automáticamente.';
  }
  function render() {
    const lines=compute();
    const due=lines.reduce((sum,row)=>sum+row.total,0);
    $('#budget').textContent=money(due);
    $('#budgetdesc').textContent=state.people+' '+(state.people===1?'persona':'personas')+
      ' · '+(state.plan==='sinfuego'?'7':'28')+' días · por comprar';
    $('#plan').value=state.plan; $('#people').value=state.people;
    document.querySelectorAll('[data-tab]').forEach(button=>{
      const active=button.dataset.tab===tab;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active?'page':'false');
    });
    const content=$('#content');
    if(tab==='compra') content.innerHTML=renderShopping(lines);
    else if(tab==='menu') content.innerHTML=renderMenu();
    else if(tab==='recetas') content.innerHTML=renderRecipes();
    else if(tab==='despensa') content.innerHTML=renderPantry();
    else if(tab==='gustos') content.innerHTML=renderPreferences();
    else if(tab==='seguridad') content.innerHTML=renderSafety();
    else content.innerHTML=renderSources();
  }

  function renderShopping(lines) {
    const shown=lines.filter(row=>M.fold(row.product.name).includes(M.fold(shoppingQuery)));
    const cost=shown.reduce((sum,row)=>sum+row.total,0);
    const inHouse=Object.values(state.inventory).reduce((sum,count)=>sum+Math.max(0,Number(count)||0),0);
    let html='<div class="section-title"><h2>Lista de la compra</h2><span class="muted">'+
      lines.reduce((n,row)=>n+(row.buy>0?1:0),0)+' productos por comprar</span></div>';
    html+='<p class="muted">'+esc(planningMessage())+'</p>';
    html+='<div class="toolbar"><label class="checkline"><input type="checkbox" data-only-menu '+
      (state.onlyMenu?'checked':'')+'> Solo lo necesario para este menú</label>'+
      '<button class="secondary" type="button" data-go="despensa">Revisar lo que tengo ('+inHouse+' envases)</button></div>';
    html+='<label class="search-label">Buscar en la compra<input id="shopping-search" type="search" value="'+esc(shoppingQuery)+'" placeholder="Buscar producto…"></label>';
    html+='<div class="list">';
    for(const row of lines){
      const key=state.plan+':'+state.people+':'+row.id;
      const marked=!!state.checked[key];
      const description='En casa: '+row.owned+' · Objetivo: '+row.target+' envases';
      html+='<label class="item '+(marked?'done':'')+'" data-shop-filter="'+esc(M.fold(row.product.name))+'" data-shop-price="'+row.total+'" '+(M.fold(row.product.name).includes(M.fold(shoppingQuery))?'':'hidden')+'><input type="checkbox" data-purchased="'+esc(key)+'" '+(marked?'checked':'')+
        ' aria-label="Marcar compra de '+esc(row.product.name)+'"><div><div class="itemname">'+esc(row.product.name)+
        '</div><div class="itemmeta">'+esc(row.product.size)+' · '+row.buy+' por comprar · '+esc(description)+
        '</div></div><div class="price">'+money(row.total)+'</div></label>';
    }
    html+='</div><p class="muted small">Total pendiente: '+money(lines.reduce((sum,row)=>sum+row.total,0))+
      ' · En esta búsqueda: <span id="shown-subtotal">'+money(cost)+'</span>. Marcar «comprado» no modifica automáticamente lo que tienes en casa.</p>';
    return html;
  }

  function renderMenu() {
    const meals=['Desayuno','Comida','Cena'];
    let html='<div class="section-title"><h2>'+(state.plan==='sinfuego'?'7 días sin fuego':'Menú adaptable de 28 días')+
      '</h2><span class="muted">'+state.people+' '+(state.people===1?'persona':'personas')+'</span></div>'+
      '<p class="muted">El menú se recalcula al marcar ingredientes disponibles o alimentos que no te gustan. Cada plato lleva a su receta. Puedes elegir otra receta compatible en el desplegable. Puede haber platos repetidos.</p>';
    for(let day=0;day<menuDays.length;day++){
      html+='<article class="day"><h3>Día '+(day+1)+'</h3>';
      for(let slot=0;slot<3;slot++){
        const id=menuDays[day][slot],r=M.byId[id];
        const available=M.candidateChoices({plan:state.plan,inventory:state.inventory,prefs:state.prefs},day,slot);
        html+='<div class="meal"><div class="meal-name"><span class="meal-label">'+meals[slot]+'</span>';
        html+=r?'<a href="#receta-'+r.id+'" data-recipe-link="'+r.id+'">'+esc(r.name)+'</a> '+
          (M.ownedEnough(r,state.inventory)?'<span class="pill">Lo tienes</span>':'')
          :'<span class="warn">No hay recetas compatibles. Revisa tus preferencias.</span>';
        html+='</div><label class="picker-label">Cambiar <select data-replace="'+state.plan+':'+day+':'+slot+
          '" aria-label="Cambiar '+meals[slot].toLowerCase()+' del día '+(day+1)+'">';
        if(!r)html+='<option value="">Sin alternativa</option>';
        for(const alternative of available) html+='<option value="'+alternative.id+'" '+(r&&r.id===alternative.id?'selected':'')+
          '>'+esc(alternative.name)+(M.ownedEnough(alternative,state.inventory)?' · En casa':'')+'</option>';
        html+='</select></label></div>';
      }
      html+='</article>';
    }
    return html;
  }

  function renderRecipes() {
    const liked=D.recipes.filter(r=>!M.unwanted(r,state.prefs));
    const marked=D.recipes.length-liked.length;
    let html='<div class="section-title"><h2>Recetario de despensa</h2><span class="muted">'+
      liked.length+' recetas compatibles de '+D.recipes.length+'</span></div>'+
      '<p class="muted">Busca por nombre, ingrediente o tipo. Selecciona «No me gusta» para que la receta deje de aparecer en tus menús. Las recetas que contienen ingredientes descartados se ocultan.</p>'+
      '<label class="search-label">Buscar recetas<input id="recipe-search" type="search" value="'+esc(recipeQuery)+'" placeholder="Pasta, garbanzos, sin fuego…" autocomplete="off"></label>'+
      '<div class="toolbar"><span class="muted small">'+marked+' recetas excluidas por tus preferencias</span>'+
      '<button type="button" class="secondary" data-go="gustos">Mis preferencias</button></div>';
    html+='<div class="cards recipes" id="recipe-cards">';
    for(const r of liked){
      const req=M.amounts[r.id]||{};
      const available=M.ownedEnough(r,state.inventory);
      const searchable=M.fold(r.name+' '+r.category+' '+r.ingredients+' '+Object.keys(req).map(id=>D.products[id].name).join(' '));
      html+='<article class="card recipe-card" id="receta-'+r.id+'" data-filter="'+esc(searchable)+'">'+
        '<div class="recipe-heading"><span class="pill">'+esc(r.category)+' · '+(String(r.fire)==='0'?'sin fuego':esc(r.fire))+'</span>'+
        (available?'<span class="pill success">Ingredientes en casa</span>':'')+'</div>'+
        '<h3>'+esc(r.name)+'</h3><p><b>Ingredientes:</b> '+esc(r.ingredients)+'</p>'+
        '<p><b>Preparación:</b> '+esc(r.steps)+'</p>'+
        '<p class="muted small">Ración orientativa para un adulto. Conserva las instrucciones originales y comprueba el estado de los alimentos.</p>'+
        '<div class="card-actions"><button class="secondary" type="button" data-toggle-recipe="'+r.id+
        '">No me gusta esta receta</button><button class="secondary" type="button" data-go="despensa">Ver mi despensa</button></div></article>';
    }
    html+='</div><p id="recipe-empty" class="empty" hidden>No hay recetas que coincidan. Cambia la búsqueda o tus preferencias.</p>';
    return html;
  }

  function filterRecipes() {
    const q=M.fold(recipeQuery);let visible=0;
    document.querySelectorAll('.recipe-card').forEach(card=>{
      const show=!q || (card.dataset.filter||'').includes(q);
      card.hidden=!show;
      if(show)visible++;
    });
    const empty=$('#recipe-empty');
    if(empty)empty.hidden=visible>0;
  }
  function renderPantry() {
    const choices=M.recipeSuggestions(state.prefs,state.inventory);
    const hasAny=Object.values(state.inventory).some(v=>Number(v)>0);
    const full=choices.filter(x=>x.complete);
    const partial=choices.filter(x=>!x.complete && x.coverage>0).slice(0,8);
    let html='<div class="section-title"><h2>Lo que tengo en casa</h2><span class="muted">'+full.length+
      ' recetas completas</span></div>'+
      '<p class="muted">Marca los productos que tienes y, si son varios envases, ajusta la cantidad con + y −. «Tengo» significa un envase completo del tamaño indicado; no equivale a tener reservas ilimitadas.</p>'+
      '<label class="search-label">Buscar alimentos de mi despensa<input id="pantry-search" type="search" value="'+
      esc(pantryQuery)+'" placeholder="Atún, leche, avena…"></label>';
    html+='<div class="list pantry-list">';
    for(const [id,p] of Object.entries(D.products)){
      const qty=saleCount(id),bad=hasFood(id);
      html+='<div class="pantry-item" data-filter="'+esc(M.fold(p.name))+'" '+(M.fold(p.name).includes(M.fold(pantryQuery))?'':'hidden')+'><label class="pantry-available">'+
        '<input type="checkbox" data-have="'+id+'" '+(qty?'checked':'')+' aria-label="Tengo '+esc(p.name)+'">'+
        '<span><strong>'+esc(p.name)+'</strong><small>'+esc(p.size)+'</small></span></label>'+
        '<div class="counter"><button type="button" data-inventory="'+id+'" data-delta="-1" aria-label="Restar un envase de '+esc(p.name)+'">−</button>'+
        '<output>'+qty+'</output><button type="button" data-inventory="'+id+'" data-delta="1" aria-label="Añadir un envase de '+esc(p.name)+'">+</button></div>'+
        '<label class="dislike-check"><input type="checkbox" data-dislike-ingredient="'+id+'" '+(bad?'checked':'')+'> No me gusta</label></div>';
    }
    html+='</div>';
    html+='<div class="section-title"><h2>Recetas con lo que tienes</h2><span class="muted">'+full.length+
      ' listas para preparar</span></div>';
    if(!hasAny)html+='<p class="notice">Selecciona al menos un alimento para ver recetas disponibles con tu despensa.</p>';
    if(full.length){
      html+='<div class="cards">'+full.map(x=>suggestionCard(x,true)).join('')+'</div>';
    }else if(hasAny)html+='<p class="muted">Aún no tienes todos los ingredientes necesarios para ninguna receta. Estas son las opciones más próximas:</p>';
    if(hasAny && partial.length){
      html+='<h3>Te falta poco para…</h3><div class="cards">'+partial.map(x=>suggestionCard(x,false)).join('')+'</div>';
    }
    html+='<p class="muted small">No se descuentan alimentos al consultar una receta. El menú favorece los productos que marcas, pero para cocinar durante un mes debes comprobar las cantidades y tener agua potable.</p>';
    return html;
  }
  function suggestionCard(x,full) {
    const r=x.recipe;
    const missing=x.missing.map(m=>m.name).join(', ');
    return '<article class="card suggestion-card"><span class="pill '+(full?'success':'')+'">'+
      (full?'Tienes todos los ingredientes':'Tienes '+Math.round(x.coverage*100)+' %')+'</span>'+
      '<h3>'+esc(r.name)+'</h3>'+
      (!full?'<p><b>Te falta:</b> '+esc(missing)+'</p>':'<p class="muted">Puedes prepararla con tus envases marcados.</p>')+
      '<a href="#receta-'+r.id+'" data-recipe-link="'+r.id+'">Ver receta y preparación</a></article>';
  }
  function renderPreferences() {
    const bad=state.prefs.dislikedIngredients,excluded=state.prefs.dislikedRecipes.map(Number);
    let html='<div class="section-title"><h2>Comidas que no me gustan</h2><span class="muted">'+
      bad.length+' ingredientes · '+excluded.length+' recetas</span></div>'+
      '<p class="muted">Los ingredientes marcados se excluyen de todas las recetas propuestas y de la lista de compra. Las recetas que hayas rechazado tampoco aparecen en el menú. Puedes cambiarlo en cualquier momento.</p>'+
      '<div class="preference-grid">';
    for(const [id,p] of Object.entries(D.products)){
      html+='<label class="pref-item"><input type="checkbox" data-dislike-ingredient="'+id+'" '+(bad.includes(id)?'checked':'')+'> '+esc(p.name)+'</label>';
    }
    html+='</div><h3>Recetas descartadas</h3>';
    if(!excluded.length)html+='<p class="muted">Todavía no has descartado ninguna receta individual.</p>';
    else html+='<div class="list">'+excluded.map(id=>M.byId[id]?'<div class="pref-row"><span>'+esc(M.byId[id].name)+
      '</span><button type="button" class="secondary" data-toggle-recipe="'+id+'">Volver a incluir</button></div>':'').join('')+'</div>';
    return html;
  }
  function renderSafety() {
    return '<h2>Sin electricidad: prioridades</h2>'+
      '<div class="notice"><b>Seguridad:</b> Nunca uses hornillos, barbacoas, braseros ni generadores de combustión en interiores. No enciendas gas si huele a gas. Consulta siempre el manual del fabricante.</div>'+
      '<div class="cards"><article class="card"><h3>Primeros minutos</h3><p>Comprueba el alcance del corte. Mantén cerrados frigorífico y congelador y usa linterna.</p></article>'+
      '<article class="card"><h3>Qué consumir primero</h3><p>Primero los alimentos refrigerados que sigan siendo seguros; después congelados seguros. Descarta perecederos que hayan estado demasiado tiempo a temperatura insegura.</p></article>'+
      '<article class="card"><h3>Cocinas sin luz</h3><p>Vitrocerámica e inducción no funcionan sin electricidad. Algunos quemadores de gas permiten encendido manual; comprueba el manual antes de intentarlo.</p></article>'+
      '<article class="card"><h3>Agua</h3><p>Planifica agua potable y su reposición. Los filtros domésticos no resuelven todos los tipos de contaminación.</p></article>'+
      '<article class="card"><h3>Conservación</h3><p>Como orientación, el frigorífico cerrado mantiene el frío unas 4 horas y el congelador lleno hasta unas 48 horas (24 si está medio lleno). Confirma la temperatura antes de consumir alimentos de riesgo.</p></article>'+
      '<article class="card"><h3>Necesidades especiales</h3><p>Bebés, personas con diabetes, alergias y enfermedad celíaca, mayores y mascotas requieren reservas adaptadas.</p></article></div>';
  }
  function renderSources() {
    return '<h2>Fuentes y precios</h2><p class="muted">Precios orientativos de marca blanca de noviembre de 2026. Revisa siempre el formato y la tarifa de tu tienda.</p>'+
      '<div class="list">'+D.sources.map(s=>{
        const url=typeof s==='string'?s:s.url||'';
        return /^https?:\/\//.test(url)?'<div class="source-row"><a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(url)+'</a></div>':'';
      }).join('')+'</div>';
  }

  function go(tabName) {
    tab=tabName;
    render();
    if(tabName==='recetas')filterRecipes();
    window.scrollTo({top:0,behavior:'auto'});
  }
  function openRecipe(id) {
    const r=M.byId[id];
    if(!r) return;
    if(M.unwanted(r,state.prefs)){
      // Explicar el motivo en vez de mostrar una receta incompatible.
      go('gustos'); return;
    }
    recipeQuery='';
    tab='recetas';
    render();
    history.replaceState(null,'','#receta-'+id);
    const card=$('#receta-'+id);
    if(card){card.classList.add('target-recipe');card.scrollIntoView({block:'start',behavior:'auto'});}
  }
  function arrayToggle(items,value) {
    const next=items.filter(x=>String(x)!==String(value));
    if(next.length===items.length) next.push(value);
    return next;
  }

  $('#plan').value=state.plan;
  $('#people').value=state.people;
  $('#plan').addEventListener('change',e=>{state.plan=e.target.value;persist();render();});
  $('#people').addEventListener('change',e=>{state.people=Math.max(1,Math.min(20,Math.floor(Number(e.target.value)||1)));persist();render();});
  document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.tab)));
  $('#content').addEventListener('click',event=>{
    const link=event.target.closest('[data-recipe-link]');
    if(link){event.preventDefault();openRecipe(Number(link.dataset.recipeLink));return;}
    const button=event.target.closest('button');
    if(!button) return;
    if(button.dataset.go){go(button.dataset.go);return;}
    if(button.dataset.toggleRecipe){
      state.prefs.dislikedRecipes=arrayToggle(state.prefs.dislikedRecipes,Number(button.dataset.toggleRecipe));
      persist();render();return;
    }
    if(button.dataset.inventory){
      const id=button.dataset.inventory, delta=Number(button.dataset.delta)||0;
      state.inventory[id]=Math.max(0,Math.min(100,saleCount(id)+delta));
      persist();render();return;
    }
  });
  $('#content').addEventListener('change',event=>{
    const input=event.target;
    if(input.dataset.have){
      state.inventory[input.dataset.have]=input.checked?Math.max(1,saleCount(input.dataset.have)):0;
    }else if(input.dataset.dislikeIngredient){
      const id=input.dataset.dislikeIngredient;
      state.prefs.dislikedIngredients=arrayToggle(state.prefs.dislikedIngredients,id);
    }else if(input.dataset.replace){
      const key=input.dataset.replace;
      if(input.value)state.overrides[key]=Number(input.value);else delete state.overrides[key];
    }else if(input.dataset.purchased){
      state.checked[input.dataset.purchased]=input.checked;
    }else if(input.hasAttribute('data-only-menu')){
      state.onlyMenu=input.checked;
    }else return;
    persist();render();
  });
  $('#content').addEventListener('input',event=>{
    if(event.target.id==='recipe-search'){recipeQuery=event.target.value;filterRecipes();}
    if(event.target.id==='pantry-search'){
      pantryQuery=event.target.value;
      const query=M.fold(pantryQuery);
      document.querySelectorAll('.pantry-item').forEach(item=>{
        item.hidden=!!query && !(item.dataset.filter||'').includes(query);
      });
    }
    if(event.target.id==='shopping-search'){
      shoppingQuery=event.target.value;
      const query=M.fold(shoppingQuery);
      let subtotal=0;
      document.querySelectorAll('[data-shop-filter]').forEach(item=>{
        const show=!query||(item.dataset.shopFilter||'').includes(query);
        item.hidden=!show;
        if(show)subtotal+=Number(item.dataset.shopPrice)||0;
      });
      const total=$('#shown-subtotal');
      if(total)total.textContent=money(subtotal);
    }
  });
  $('#content').addEventListener('keydown',event=>{
    if(event.key==='Enter' && event.target.id==='shopping-search'){event.preventDefault();render();}
  });
  // Los cambios en la despensa y en gustos se guardan; la pestaña actual no se interrumpe.
  render();
  if(window.location.hash.startsWith('#receta-')){
    const id=Number(window.location.hash.slice(8));
    if(M.byId[id])openRecipe(id);
  }
  window.addEventListener('hashchange',()=>{
    if(window.location.hash.startsWith('#receta-'))openRecipe(Number(window.location.hash.slice(8)));
  });

  // Detectar versiones en cada inicio y al regresar a la app.
  // La actualización espera la confirmación del usuario, sin interrumpir la compra actual.
  let registration=null, updating=false, nextVersion='', reloadOnTakeover=false, lastCheck=0;
  const banner=$('#update-banner');
  const message=$('#update-message');
  const button=$('#update-now');
  function showUpdate(text) {
    if(!banner) return;
    message.textContent=text;
    banner.hidden=false;
  }
  function hideUpdate(){if(banner)banner.hidden=true;}
  async function checkForUpdates() {
    const now=Date.now();
    if(updating || now-lastCheck<1500) return;
    lastCheck=now;
    if(!navigator.onLine) return;
    updating=true;
    try {
      if(registration)await registration.update();
      const result=await fetch('./version.json?check='+now,{cache:'no-store'});
      if(!result.ok)throw new Error('No se pudo comprobar la versión');
      const info=await result.json();
      if(info && info.version && info.version!==VERSION){
        nextVersion=String(info.version);
        showUpdate('Disponible una versión nueva ('+nextVersion+'). Puedes seguir usando esta hasta que elijas actualizar.');
      } else if(!registration || !registration.waiting){
        hideUpdate();
      }
      if(registration && registration.waiting){
        showUpdate('Hay una actualización lista. Puedes instalarla cuando termines de utilizar la aplicación.');
      }
    }catch(error){console.info('Comprobación de actualizaciones pospuesta',error);}
    finally {updating=false;}
  }
  async function installUpdate() {
    button.disabled=true;
    button.textContent='Actualizando…';
    try {
      if(registration)await registration.update();
      if(registration && registration.waiting){
        reloadOnTakeover=true;
        registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
      }else{
        // Recarga normal para casos sin service worker o con actualización ya activada.
        window.location.reload();
      }
    }catch(error){button.disabled=false;button.textContent='Actualizar ahora';}
  }
  if(button)button.addEventListener('click',installUpdate);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(reloadOnTakeover){reloadOnTakeover=false;window.location.reload();}
    });
    navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
      registration=reg;
      if(reg.waiting) showUpdate('Hay una actualización lista para instalar.');
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;
        if(worker)worker.addEventListener('statechange',()=>{
          if(worker.state==='installed' && navigator.serviceWorker.controller)
            showUpdate('Hay una actualización lista. Tu lista seguirá guardada.');
        });
      });
      checkForUpdates();
    }).catch(()=>checkForUpdates());
  } else checkForUpdates();
  window.addEventListener('pageshow',checkForUpdates);
  window.addEventListener('focus',checkForUpdates);
  window.addEventListener('online',checkForUpdates);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForUpdates();});
})();
