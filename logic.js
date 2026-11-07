(function (root) {
  'use strict';
  const D = root.COCINA_DATA;
  if (!D || !D.products || !D.recipes) throw new Error('Faltan los datos de la despensa');

  // Las cantidades son estimaciones para una ración de adulto (g o ml).
  // Ingredientes opcionales (miel, sal, especias, agua) no figuran salvo que definan el plato.
  const amounts = {
    1:{avena:70,leche:200}, 2:{avena:70,leche:150,cacahuete:20},
    3:{harina:80,aceite:5}, 4:{galletas:70,leche:200},
    5:{avena:60,tomate:100}, 6:{avena:60,harina:40,miel:15},
    7:{lenteja_s:90,tomate:120}, 8:{arroz:75,alubia_c:150},
    9:{pasta:85,atun:56,tomate:100}, 10:{garbanzo_c:180,tomate:100},
    11:{pasta:70,maiz:70}, 12:{lenteja_c:160,verduras:120},
    13:{arroz:75,sardina:88}, 14:{alubia_c:200},
    15:{pasta:75,espinacas:150}, 16:{arroz:80,tomate:100},
    17:{garbanzo_c:180,atun:56}, 18:{lenteja_c:180,maiz:70},
    19:{wraps:62,alubia_c:150}, 20:{garbanzo_c:180,tomate:90},
    21:{sardina:88,galletas:80}, 22:{avena:70,leche:170},
    23:{lenteja_c:160,verduras:100}, 24:{alubia_c:180,maiz:60},
    25:{atun:56,tomate:150}, 26:{garbanzo_c:180,aceite:10},
    27:{wraps:62,sardina:88}, 28:{garbanzo_c:70,alubia_c:70,lenteja_c:70},
    29:{avena:65,cacahuete:25}, 30:{wraps:62,atun:56,maiz:50},
    31:{garbanzo_c:180,verduras:100}, 32:{alubia_c:170,tomate:100,aceite:5},
    33:{lenteja_c:180,atun:56}, 34:{galletas:70,cacahuete:30},
    35:{harina:100,aceite:5}, 36:{harina:100,tomate:100,alubia_c:50},
    37:{galletas:70,miel:20}, 38:{avena:60,cacahuete:35},
    39:{wraps:62,garbanzo_c:150,maiz:50}, 40:{pasta:65,maiz:30,tomate:60}
  };

  const packs = {
    avena:500,arroz:1000,pasta:1000,lenteja_s:1000,garbanzo_s:1000,
    harina:1000,aceite:1000,tomate:390,leche:1000,garbanzo_c:400,
    alubia_c:400,lenteja_c:400,maiz:420,atun:336,sardina:176,sal:1000,
    galletas:800,cacahuete:500,verduras:325,fabada:440,espinacas:430,
    miel:500,wraps:370,pina:420,melocoton:235
  };

  function safeNum(n, max) {
    n = Number(n);
    return Number.isFinite(n) ? Math.max(0,Math.min(max || 999,n)) : 0;
  }
  function fold(text) {
    return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,' ').trim();
  }
  function tokenize(text) {
    const ignore = new Set(['con','sin','para','la','el','los','las','y','de','del','un','una','en','al','a','fria','frio','caliente','rapida','salsa','cocida','cocidas','completa','ligero','ligera','de','sarten','racion']);
    return new Set(fold(text).split(' ').filter(t=>t.length>2 && !ignore.has(t)));
  }
  const byId=Object.fromEntries(D.recipes.map(r=>[r.id,r]));
  function unwanted(r, prefs) {
    prefs=prefs||{};
    const badFoods=new Set(prefs.dislikedIngredients||[]);
    const badRecipes=new Set((prefs.dislikedRecipes||[]).map(Number));
    return !r || badRecipes.has(r.id) || Object.keys(amounts[r.id]||{}).some(k=>badFoods.has(k));
  }
  function matchesMeal(r, slot, plan) {
    if (plan==='sinfuego' && String(r.fire).trim()!=='0') return false;
    if (slot===0) return r.category==='Desayunos' || [22,29,34,37,38,35].includes(r.id);
    if (slot===1) return ['Platos calientes','Sin fuego','Para niños','Pan y pizza'].includes(r.category)
      && ![21,22,29,34,37,38].includes(r.id);
    return ['Sin fuego','Platos calientes','Para niños','Pan y pizza'].includes(r.category)
      && ![22,29,34].includes(r.id);
  }
  function ownedEnough(r, inventory) {
    const req=amounts[r.id];
    return Object.entries(req).every(([id,q])=>safeNum((inventory||{})[id])*(packs[id]||1)>=q);
  }
  function pantryScore(r, inventory) {
    const entries=Object.entries(amounts[r.id]);
    if(!entries.length) return 0;
    return entries.reduce((total,[id,q])=>{
      return total+Math.min(1,(safeNum((inventory||{})[id])*(packs[id]||1))/q);
    },0)/entries.length;
  }
  function recipeSuggestions(prefs, inventory) {
    return D.recipes.filter(r=>!unwanted(r,prefs))
      .map(r=>({recipe:r,complete:ownedEnough(r,inventory),coverage:pantryScore(r,inventory),
        missing:Object.entries(amounts[r.id]).filter(([id,q])=>safeNum((inventory||{})[id])*(packs[id]||1)<q)
        .map(([id,q])=>({id,name:D.products[id].name,quantity:q}))}))
      .sort((a,b)=>Number(b.complete)-Number(a.complete)||b.coverage-a.coverage||a.recipe.id-b.recipe.id);
  }
  function originalLabel(plan, day, slot) {
    const row = plan==='sinfuego' ? D.noFireMenu[day] : D.menus[day];
    return Array.isArray(row) ? row[slot] : row[['breakfast','lunch','dinner'][slot]];
  }
  function menu(options) {
    const plan=D.plans[options.plan]?options.plan:'basico';
    const days=plan==='sinfuego'?7:28, inventory=options.inventory||{};
    const prefs=options.prefs||{}, overrides=options.overrides||{};
    const hasStock=Object.values(inventory).some(v=>safeNum(v)>0);
    const usage={}, picked=[], lastSeen={};
    for(let day=0;day<days;day++){
      const slots=[];
      for(let slot=0;slot<3;slot++){
        const key=plan+':'+day+':'+slot;
        let candidates=D.recipes.filter(r=>!unwanted(r,prefs)&&matchesMeal(r,slot,plan));
        const wanted=Number(overrides[key]);
        let selected=candidates.find(r=>r.id===wanted);
        if(!selected && candidates.length){
          const original=tokenize(originalLabel(plan,day,slot));
          candidates=candidates.map(r=>{
            const terms=tokenize(r.name+' '+r.ingredients);
            let overlap=0;
            original.forEach(word=>{if(terms.has(word))overlap+=1;});
            const owned=pantryScore(r,inventory), seen=usage[r.id]||0;
            const planProducts=D.plans[plan].items;
            const planFit=Object.keys(amounts[r.id]).reduce((s,id)=>s+Number(!!planProducts[id]),0)/
              Math.max(1,Object.keys(amounts[r.id]).length);
            const repeat=lastSeen[r.id]===day?10:lastSeen[r.id]===day-1?3:0;
            const preference=(plan==='sinfuego'||plan==='comodo')?Number(String(r.fire).trim()==='0')*2.5:0;
            const score=overlap*5.2+planFit*2+(hasStock?owned*8+(owned===1?3:0):0)
               +preference-seen*1.7-repeat+((r.id*13+day*7+slot*11)%19)/190;
            return {r,score};
          }).sort((a,b)=>b.score-a.score||a.r.id-b.r.id);
          selected=candidates[0].r;
        }
        if(selected){usage[selected.id]=(usage[selected.id]||0)+1;lastSeen[selected.id]=day;}
        slots.push(selected?selected.id:null);
      }
      picked.push(slots);
    }
    return picked;
  }
  function shopping(options, menuDays) {
    const plan=D.plans[options.plan]?options.plan:'basico', persons=Math.max(1,Math.min(20,Math.floor(safeNum(options.people)||1)));
    const prefs=options.prefs||{}, inventory=options.inventory||{};
    const bad=new Set(prefs.dislikedIngredients||[]);
    const needs={};
    menuDays.flat().forEach(id=>{if(id!=null)Object.entries(amounts[id]||{}).forEach(([product,q])=>{
      needs[product]=(needs[product]||0)+q*persons;
    });});
    const result=[];
    for(const [id,p] of Object.entries(D.products)){
      if(bad.has(id)) continue;
      const base=(options.onlyMenu?0:(D.plans[plan].items[id]||0)*persons);
      const required=Math.ceil((needs[id]||0)/(packs[id]||1));
      const target=Math.max(base,required);
      const owned=Math.floor(safeNum(inventory[id],100));
      const buy=Math.max(0,target-owned);
      if(target || owned) result.push({id,product:p,target,owned,buy,base,required,total:buy*p.price});
    }
    return result;
  }
  function candidateChoices(options,day,slot) {
    const plan=D.plans[options.plan]?options.plan:'basico';
    return D.recipes.filter(r=>!unwanted(r,options.prefs||{})&&matchesMeal(r,slot,plan))
      .sort((a,b)=>pantryScore(b,options.inventory||{})-pantryScore(a,options.inventory||{})||a.id-b.id);
  }
  root.COCINA_LOGIC={D,amounts,packs,byId,fold,unwanted,matchesMeal,ownedEnough,pantryScore,recipeSuggestions,menu,shopping,candidateChoices};
})(typeof window !== 'undefined' ? window : globalThis);
