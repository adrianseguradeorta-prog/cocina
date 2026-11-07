'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
global.window=global;
for(const file of ['data.js','logic.js']) vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
const D=global.COCINA_DATA,M=global.COCINA_LOGIC;
const empty={dislikedIngredients:[],dislikedRecipes:[]};
const opts=(plan='basico',extra={})=>Object.assign({plan,people:1,inventory:{},prefs:empty,overrides:{},onlyMenu:false},extra);
assert.equal(D.recipes.length,40,'Deben existir 40 recetas');
assert.equal(D.menus.length,28,'El menú mensual debe contener 28 días');
assert.equal(Object.keys(M.amounts).length,40,'Cada receta debe tener cantidades orientativas');
for(const r of D.recipes){
  assert.ok(M.amounts[r.id],'Faltan ingredientes: '+r.id);
  for(const [id,amount] of Object.entries(M.amounts[r.id])){
    assert.ok(D.products[id],'Producto inexistente: '+id+' receta '+r.id);
    assert.ok(Number.isFinite(amount) && amount>0,'Cantidad inválida: '+id);
    assert.ok(M.packs[id]>0,'Envase inválido: '+id);
  }
}
for(const name of Object.keys(D.plans)){
  const plan=M.menu(opts(name));
  assert.equal(plan.length,name==='sinfuego'?7:28);
  plan.forEach((day,dayIndex)=>{
    assert.equal(day.length,3);
    day.forEach((id,slot)=>{
      assert.ok(id && M.byId[id],'Sin receta el día '+(dayIndex+1)+', comida '+slot+', plan '+name);
      assert.ok(M.matchesMeal(M.byId[id],slot,name),'Receta inadecuada para la comida '+slot);
      if(name==='sinfuego')assert.equal(String(M.byId[id].fire),'0','Se necesita fuego en plan sin fuego');
    });
  });
}
const some=M.menu(opts('basico',{prefs:{dislikedIngredients:['tomate','atun'],dislikedRecipes:[8]}}));
for(const id of some.flat()){
  if(!id)continue;
  assert.equal(M.unwanted(M.byId[id],{dislikedIngredients:['tomate','atun'],dislikedRecipes:[8]}),false);
}
const onlyHome=M.recipeSuggestions(empty,{avena:1,leche:1});
assert.ok(onlyHome.some(x=>x.recipe.id===22&&x.complete),'Avena con leche debe poder hacerse');
assert.ok(onlyHome.some(x=>x.recipe.id===9&&!x.complete),'Macarrones con atún deben tener ingredientes pendientes');
assert.equal(M.recipeSuggestions({dislikedIngredients:['leche'],dislikedRecipes:[]},{avena:1,leche:1}).some(x=>x.recipe.id===22),false,'Se excluyen ingredientes no deseados');
const fixed=M.menu(opts());
const before=M.shopping(opts(),fixed),after=M.shopping(opts('basico',{inventory:{arroz:1}}),fixed);
const find=(rows,id)=>rows.find(x=>x.id===id);
assert.equal(find(after,'arroz').buy,Math.max(0,find(before,'arroz').buy-1),'Descontar el envase registrado');
const two=M.shopping(opts('basico',{people:2}),fixed);
assert.ok(find(two,'arroz').target>=2*find(before,'arroz').base,'Plan familiar debe cubrir 2 adultos');
const planOnly=M.shopping(opts('basico',{onlyMenu:true}),fixed);
assert.ok(planOnly.reduce((s,x)=>s+x.total,0)<=before.reduce((s,x)=>s+x.total,0),'Solo menú no puede costar más que reservar todo el plan');
const none=M.menu(opts('sinfuego',{prefs:{dislikedIngredients:Object.keys(D.products),dislikedRecipes:[]}}));
assert.ok(none.flat().every(x=>x===null),'Ante exclusiones totales se informa que no hay receta');
assert.equal(M.fold('Garbanzos con limón'),'garbanzos con limon','Buscar sin tilde');
for(const file of ['index.html','app.js','sw.js','version.json'])assert.ok(fs.existsSync(file),'Falta '+file);
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
assert.ok(html.includes('./logic.js'),'La página debe cargar el motor');
assert.ok(html.includes('data-tab="gustos"') && html.includes('data-tab="despensa"'),'Las pestañas nuevas están disponibles');
for(const text of ['recipe-search','data-recipe-link','data-have','data-dislike-ingredient','version.json','visibilitychange','pageshow'])
  assert.ok(app.includes(text),'Falta función '+text);
assert.equal(JSON.parse(fs.readFileSync('version.json','utf8')).version,'2026.11.07.2');
console.log('PRUEBAS OK: 40 recetas, 4 planes, enlaces, preferencias, inventario, cantidades y actualización.');
