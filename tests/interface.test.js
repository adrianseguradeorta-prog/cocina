'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

async function main(){
  const html=fs.readFileSync('index.html','utf8');
  const dom=new JSDOM(html,{url:'https://example.org/cocina/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.scrollTo=()=>{};
  w.Element.prototype.scrollIntoView=function(){};
  w.fetch=async()=>({ok:true,json:async()=>({version:'2026.11.07.3'})});
  for(const f of ['data.js','logic.js','app.js'])w.eval(fs.readFileSync(f,'utf8'));
  const $=s=>w.document.querySelector(s);
  const click=(element)=>{assert.ok(element,'Falta elemento');element.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));};
  const change=(element,checked)=>{assert.ok(element);element.checked=checked;element.dispatchEvent(new w.Event('change',{bubbles:true}));};
  assert.ok($('#content').textContent.includes('Lista de la compra'));
  assert.ok($('#budget').textContent.includes('€'));
  const existing=$('[data-purchased]');
  change(existing,true);
  assert.ok(JSON.parse(w.localStorage.getItem('mi_despensa_estado_v2')).checked[existing.dataset.purchased]);
  click($('[data-tab="despensa"]'));
  assert.equal(w.document.querySelectorAll('[data-have]').length,25);
  change($('[data-have="avena"]'),true);
  change($('[data-have="leche"]'),true);
  assert.equal(JSON.parse(w.localStorage.getItem('mi_despensa_estado_v2')).inventory.leche,1);
  assert.ok($('#content').textContent.includes('Recetas con lo que tienes'));
  assert.ok(Array.from(w.document.querySelectorAll('.suggestion-card')).some(el=>el.textContent.includes('Tienes todos los ingredientes')));
  change($('[data-dislike-ingredient="tomate"]'),true);
  click($('[data-tab="menu"]'));
  assert.equal(w.document.querySelectorAll('.day').length,28);
  const links=Array.from(w.document.querySelectorAll('a[data-recipe-link]'));
  assert.ok(links.length>75,'Cada comida debe ofrecer enlace de receta');
  for(const link of links){
    const id=Number(link.dataset.recipeLink);
    assert.ok(!Object.keys(w.COCINA_LOGIC.amounts[id]).includes('tomate'),'El menú no debe incluir ingredientes rechazados');
  }
  const firstLink=links[0];
  const id=Number(firstLink.dataset.recipeLink);
  click(firstLink);
  assert.ok($('#receta-'+id),'El enlace debe abrir la receta correcta');
  assert.ok($('#receta-'+id).classList.contains('target-recipe'));
  assert.ok(w.location.hash==='#receta-'+id);
  const finder=$('#recipe-search');
  assert.ok(finder,'Falta buscador de recetas');
  finder.value='Garbanzos';
  finder.dispatchEvent(new w.Event('input',{bubbles:true}));
  const found=Array.from(w.document.querySelectorAll('.recipe-card')).filter(x=>!x.hidden);
  assert.ok(found.length>0 && found.length<w.COCINA_DATA.recipes.length,'El buscador debe filtrar recetas');
  assert.ok(found.every(el=>w.COCINA_LOGIC.fold(el.textContent).includes('garbanzos') ||
    (el.dataset.filter||'').includes('garbanzos')));

  // La pestaña No me gusta ahora es un buscador con autocompletado.
  click($('[data-tab="gustos"]'));
  assert.ok($('#dislike-search'),'Debe mostrar buscador de comidas');
  const finderDislike=$('#dislike-search');
  finderDislike.value='maca';
  finderDislike.dispatchEvent(new w.Event('input',{bubbles:true}));
  const suggestions=Array.from(w.document.querySelectorAll('[data-suggest-type]'));
  assert.ok(suggestions.length>=10,'Deben verse resultados de todo el recetario');
  assert.ok(suggestions.some(el=>el.dataset.suggestType==='ingredient'&&el.dataset.suggestId==='pasta'),
    'Maca debe sugerir macarrones como ingrediente');
  const late=suggestions.find(el=>el.dataset.suggestType==='recipe'&&Number(el.dataset.suggestId)>60);
  assert.ok(late,'Debe sugerir recetas posteriores a las iniciales');
  click(late);
  const newPrefs=JSON.parse(w.localStorage.getItem('mi_despensa_estado_v2')).prefs;
  assert.ok(newPrefs.dislikedRecipes.includes(Number(late.dataset.suggestId)),
    'Las sugerencias deben guardar los platos descartados');
  assert.equal($('#dislike-search').value,'maca','La búsqueda permanece activa para marcar más platos');
  const tag=$('[data-toggle-recipe="'+late.dataset.suggestId+'"]');
  assert.ok(tag,'El plato descartado debe aparecer en la lista de seleccionados');
  click(tag);
  assert.ok(!JSON.parse(w.localStorage.getItem('mi_despensa_estado_v2')).prefs.dislikedRecipes.includes(Number(late.dataset.suggestId)),
    'Se puede retirar una exclusión');
  // Mostrar todas las 180 recetas y filtrar por categoría.
  click($('[data-tab="recetas"]'));
  assert.ok(w.document.querySelectorAll('.recipe-card').length>100,'El recetario debe estar ampliado');
  const selectCategory=$('#recipe-category');
  assert.ok(selectCategory);
  selectCategory.value='Desayunos';
  selectCategory.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.ok(Array.from(w.document.querySelectorAll('.recipe-card')).filter(x=>!x.hidden)
    .every(x=>x.dataset.category==='Desayunos'),'El filtro por categoría funciona');
  click($('[data-tab="gustos"]'));
  assert.ok($('#content').textContent.includes('Comidas que no me gustan'));
  assert.ok($('[data-dislike-ingredient="tomate"]').checked);
  click($('[data-tab="recetas"]'));
  const toDislike=$('[data-toggle-recipe]');
  assert.ok(toDislike);
  const disliked=Number(toDislike.dataset.toggleRecipe);
  click(toDislike);
  assert.ok(JSON.parse(w.localStorage.getItem('mi_despensa_estado_v2')).prefs.dislikedRecipes.includes(disliked));
  click($('[data-tab="compra"]'));
  assert.ok($('[data-only-menu]'));
  change($('[data-only-menu]'),true);
  assert.equal(JSON.parse(w.localStorage.getItem('mi_despensa_estado_v2')).onlyMenu,true);
  w.fetch=async()=>({ok:true,json:async()=>({version:'2026.11.07.4'})});
  await new Promise(resolve=>setTimeout(resolve,1600));
  w.dispatchEvent(new w.Event('focus'));
  await new Promise(resolve=>setTimeout(resolve,50));
  assert.equal($('#update-banner').hidden,false,'La app debe avisar cuando hay una versión nueva');
  assert.ok($('#update-message').textContent.includes('2026.11.07.4'));
  w.close();
  console.log('INTERFAZ OK: selección, guardado, preferencias, inventario, enlaces, búsqueda y aviso de actualización.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
