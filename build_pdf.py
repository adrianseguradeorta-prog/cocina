import os,json,math,textwrap,html
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor,Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from collections import Counter,defaultdict
O=os.getcwd(); D=json.load(open(O+'/datos.json'))
FONT='/usr/share/fonts/truetype/lato'
for nm,path in [('Lato','Lato-Regular.ttf'),('LatoBold','Lato-Bold.ttf'),('LatoBlack','Lato-Black.ttf'),('LatoItalic','Lato-Italic.ttf')]: pdfmetrics.registerFont(TTFont(nm,os.path.join(FONT,path)))
pdfmetrics.registerFontFamily('Lato',normal='Lato',bold='LatoBold',italic='LatoItalic',boldItalic='LatoBold')
W,H=A4; M=39; PW=W-2*M; OUT=O+'/Guia_despensa_30_dias_noviembre_2026.pdf'
c=canvas.Canvas(OUT,pagesize=A4,pageCompression=1)
c.setTitle('Despensa 30 | Guía de un mes de comida sin depender de la luz');c.setAuthor('Guía práctica para hogares en España · noviembre 2026')
BG=HexColor('#f7f5ef');INK=HexColor('#202b28');GREEN=HexColor('#2c6257');LIME=HexColor('#bad2ab');ORANGE=HexColor('#df9562');MUTED=HexColor('#6d7772');LINE=HexColor('#d9dfd8');WHITE=HexColor('#ffffff');SOFT=HexColor('#eaf0e8');PINK=HexColor('#f4e7e0')
page=0

def text(x,y,s,size=11,color=INK,font='Lato'):
 c.setFont(font,size);c.setFillColor(color);c.drawString(x,y,str(s))
def right(x,y,s,size=11,color=INK,font='Lato'):
 c.setFont(font,size);c.setFillColor(color);c.drawRightString(x,y,str(s))
def para(txt,x,top,w,size=10.1,leading=None,color=INK,bold=False,maxh=None,align=TA_LEFT):
 style=ParagraphStyle('_',fontName='LatoBold' if bold else 'Lato',fontSize=size,leading=leading or size*1.36,textColor=color,spaceAfter=0,allowWidows=0,allowOrphans=0,alignment=align)
 p=Paragraph(str(txt),style); ww,hh=p.wrap(w,800); hh=math.ceil(hh)
 if maxh is not None and hh>maxh:
  for sz in [size-.4,size-.8,size-1.2,size-1.6]:
   style.fontSize=sz;style.leading=sz*1.26;p=Paragraph(str(txt),style);ww,hh=p.wrap(w,800)
   if hh<=maxh:break
 p.drawOn(c,x,top-hh)
 return top-hh

def rect(x,y,w,h,fill=SOFT,r=12,stroke=None):
 c.setFillColor(fill);c.setStrokeColor(stroke or fill);c.roundRect(x,y,w,h,r,fill=1,stroke=int(stroke is not None))

def new(title=None,eyebrow=None):
 global page
 if page:c.showPage()
 page+=1;c.setFillColor(BG);c.rect(0,0,W,H,fill=1,stroke=0)
 if page not in [1,30]:
  c.setFillColor(GREEN);c.rect(0,H-9,W,9,fill=1,stroke=0)
  text(M,H-31,'DESPENSA 30',10,GREEN,'LatoBlack');right(W-M,H-31,'NOVIEMBRE 2026 · ESPAÑA',8,MUTED,'LatoBold')
  c.setStrokeColor(LINE);c.line(M,48,W-M,48)
  text(M,30,'Guía de despensa práctica · precios de referencia online',8,MUTED)
  right(W-M,30,f'{page:02d} / 30',9,GREEN,'LatoBold')
  if title:
   if eyebrow:text(M,777,eyebrow.upper(),9,ORANGE,'LatoBlack')
   text(M,744,title,23,INK,'LatoBlack');c.setFillColor(ORANGE);c.roundRect(M,724,45,4,2,fill=1,stroke=0)

def label(x,y,s,color=GREEN): text(x,y,s.upper(),9,color,'LatoBlack')
def bullet(s,x,top,w=PW,size=10,sp=8):
 c.setFillColor(ORANGE);c.circle(x+4,top-7,2.2,fill=1,stroke=0)
 yy=para(s,x+17,top,w-17,size=size)
 return yy-sp

def box_title(y,title,body,h=95,fill=SOFT):
 rect(M,y-h,PW,h,fill)
 text(M+15,y-26,title,13,GREEN,'LatoBlack')
 para(body,M+15,y-38,PW-30,10.1)
 return y-h-12

def small_table(cols,rows,x=M,top=690,width=PW,rowh=24,colwidths=None,fs=9.5,headsize=9.3,links=None):
 if colwidths is None:colwidths=[width/len(cols)]*len(cols)
 c.setFillColor(GREEN);c.roundRect(x,top-rowh,width,rowh,5,fill=1,stroke=0)
 xx=x
 for i,hdr in enumerate(cols):
  text(xx+7,top-rowh+7,hdr,headsize,WHITE,'LatoBold');xx+=colwidths[i]
 y=top-rowh
 for k,row in enumerate(rows):
  if k%2==0:c.setFillColor(HexColor('#efeee8'));c.rect(x,y-rowh,width,rowh,stroke=0,fill=1)
  xx=x
  for i,val in enumerate(row):
   s=str(val);limit=colwidths[i]-12
   f=fs
   while pdfmetrics.stringWidth(s,'Lato',f)>limit and f>6.8:f-=.3
   text(xx+7,y-rowh+7,s,f,INK,'Lato')
   if links and i==0 and k in links:c.linkURL(links[k],(xx,y-rowh,xx+colwidths[i],y),relative=0)
   xx+=colwidths[i]
  y-=rowh
 return y

def euros(v):return f'{v:.2f} €'.replace('.',',')
def capacity(k):return '0' if k==0 else str(k)

def watermark(s,y):
 text(M,y,s,8,MUTED,'LatoItalic')
# 01
new();c.setFillColor(GREEN);c.rect(0,0,W,H,fill=1,stroke=0)
c.setFillColor(HexColor('#356f62'));c.circle(525,688,170,stroke=0,fill=1)
c.setFillColor(HexColor('#457e6e'));c.circle(515,672,125,stroke=0,fill=1)
label(M,740,'GUÍA IMPRIMIBLE + APLICACIÓN IPHONE',LIME)
text(M,653,'TU DESPENSA',40,WHITE,'LatoBlack');text(M,600,'PARA 30 DÍAS',40,WHITE,'LatoBlack')
para('Qué comprar, cuánto cuesta y qué cocinar cada día cuando la luz falla o el gas escasea.',M,558,450,size=15.3,leading=22,color=WHITE)
rect(M,362,PW,105,HexColor('#f0efe6'))
for i,(pr,t) in enumerate([('42,80 €','BÁSICO'),('113,41 €','EQUILIBRADO'),('159,83 €','CÓMODO')]):
 xx=M+22+i*174;text(xx,435,pr,20,GREEN,'LatoBlack');text(xx,408,t,9,MUTED,'LatoBlack')
para('Cestas para 1 adulto · precios de marca blanca consultados en supermercados españoles, 7 de noviembre de 2026.',M+19,388,PW-38,9.2)
text(M,299,'4 SEMANAS DE MENÚ · 40 RECETAS · 18 SIN FUEGO',14,WHITE,'LatoBold')
text(M,268,'AGUA · SEGURIDAD · ROTACIÓN · 21 ETIQUETAS',14,WHITE,'LatoBold')
rect(M,91,PW,99,HexColor('#244c45'))
para('Para usar en casa, imprimir en A4 o instalar la web app desde Safari en un iPhone. No requiere alimentos especiales de emergencia.',M+20,171,PW-40,12.2,color=WHITE)
text(M,46,'Edición 01 · 07.11.2026',9,LIME)
# 02
new('Empieza por aquí','Lectura en 3 minutos')
para('Esta es una reserva de comida normal: arroz, pasta, legumbres, leche UHT, conservas y galletas. Los presupuestos son de alimentos, no incluyen agua, gas, transporte ni utensilios.',M,707,PW,11)
sec=[('01','Comprueba tu cocina','p. 3 · Gas, vitro, inducción, electricidad y prueba de 2 minutos'),('02','Elige una cesta','p. 5–8 · Básico, Equilibrado o Cómodo, con unidades reales'),('03','Decide si tendrás fuego','p. 9 · Una semana entera sin calentar nada'),('04','Imprime el menú','p. 11–15 · 28 días con tres comidas'),('05','Usa las recetas','p. 16–20 · 40 fórmulas rápidas de despensa'),('06','Guarda sin desperdiciar','p. 21–27 · Calor, germinados, etiquetas, agua y casos especiales'),('07','Compra en ocho semanas','p. 28 · Propuesta de compra escalonada')]
y=641
for num,t,desc in sec:
 rect(M,y-57,PW,51,SOFT,8);text(M+13,y-26,num,14,ORANGE,'LatoBlack');text(M+57,y-23,t,12,GREEN,'LatoBold');text(M+57,y-41,desc,9,MUTED);y-=67
box_title(152,'Dos reglas antes de comprar','(1) Ninguna cesta sustituye una dieta variada de forma permanente: incorpora fruta y verdura fresca cuando puedas. (2) Sin agua potable no se puede depender del arroz, la pasta o las legumbres secas.',95)
# 03
new('Tu cocina sin electricidad','Decidir sin riesgo')
rows=[('Gas clásico con mandos mecánicos','Puede funcionar si el fabricante permite encendido manual.','Comprobar manual.'),('Gas con chispa eléctrica','A menudo admite cerilla/encendedor, pero depende del modelo.','No asumir.'),('Gas con válvulas electrónicas','Puede quedarse cerrado sin alimentación.','No forzar.'),('Vitrocerámica eléctrica','No funciona sin suministro eléctrico.','Plan sin fuego.'),('Inducción','No funciona sin electricidad compatible.','Plan sin fuego.'),('Horno eléctrico / microondas','No funcionan sin corriente.','Plan sin fuego.')]
y=696
for a,b,d in rows:
 rect(M,y-70,PW,64,SOFT,9);text(M+12,y-25,a,12,GREEN,'LatoBold');para(b,M+12,y-34,PW-26,9.6,maxh=22);right(W-M-13,y-24,d,9,ORANGE,'LatoBold');y-=79
label(M,220,'Prueba de 2 minutos · hazla HOY')
y=207
for s in ['0–40 s · Lee la marca y el modelo; busca en el manual «encendido manual» o «fallo de corriente».','40–80 s · Comprueba dónde está la llave de gas y cómo se cierra. Revisa ventilación y detector si existe.','80–120 s · Solo si lo autoriza el manual: en algunos modelos, acerca una cerilla larga encendida al quemador y abre el gas según el manual. Cierra si no prende.']:
 y=bullet(s,M,y,size=9.4,sp=5)
rect(M,75,PW,51,PINK,7);para('<b>Seguridad:</b> nunca improvises con un mechero si el fabricante no lo permite. Si hueles gas: cierra la llave, ventila, no generes chispas ni actives interruptores y avisa a emergencias/servicio técnico.',M+12,116,PW-24,9.3)
# 04
new('Se va la luz: qué comer primero','Protocolo y 10 euros')
para('Mantén cerradas las puertas. Como referencia, una nevera sin abrir conserva el frío unas 4 horas; un congelador lleno unas 48 h (24 h si está a medias). Son cifras orientativas: comprueba con termómetro.',M,707,PW,11)
y=646
for title,body in [('En las primeras 4 horas','Usa alimentos ya preparados o muy perecederos si continúan fríos y se cocinan por completo; no abras la nevera para «mirar». Prioriza también los restos refrigerados.'),('Si se prolonga el corte','Descarta carne, pescado, lácteos frescos, huevos y sobras si han perdido el frío seguro; no pruebes para «ver si están bien». Usa comida cerrada de despensa.'),('Con la vuelta de la luz','Revisa temperaturas, etiqueta lo rescatable y registra lo desechado. No recongeles sin saber si se mantuvo a 4 °C o menos o aún contiene cristales de hielo.')]:
 y=box_title(y,title,body,111)
label(M,278,'Primera compra útil por menos de 10 €')
first=[('Arroz 1 kg',1.15),('Lentejas secas 1 kg',1.85),('Garbanzos cocidos 400 g × 2',1.60),('Atún natural 6 latas',3.89),('Tomate triturado 390 g × 2',1.08)]
small_table(['QUÉ LLEVAR','PRECIO'],[(n,euros(v)) for n,v in first],top=260,rowh=28,colwidths=[390,PW-390],fs=10)
text(M,67,'TOTAL: '+euros(sum(v for _,v in first))+'  ·  Si NO tienes fuego, cambia arroz y lentejas por legumbres cocidas.',9,GREEN,'LatoBold')
# 05
new('Tres maneras de llenar la despensa','Qué incluye cada plan')
for yy,key,tag in [(687,'basico','MÁS BARATO'),(502,'equilibrado','RECOMENDADO PARA USO HABITUAL'),(317,'comodo','SI NO QUIERES COCINAR')]:
 p=D['plans'][key];rect(M,yy-167,PW,160,SOFT,12);text(M+17,yy-30,p['name'],17,GREEN,'LatoBlack');right(W-M-17,yy-30,euros(p['total']),20,INK,'LatoBlack');text(M+17,yy-50,tag,8,ORANGE,'LatoBold')
 para(p['subtitle'],M+17,yy-64,PW-34,11.1)
 if key=='basico':msg='Mucho alimento seco; exige agua y calor. El precio ajustado deja poca diversidad de vegetales.'
 elif key=='equilibrado':msg='Incluye pescado, fruta en conserva, legumbres listas y leche; los menús de 28 días usan sobre todo esta cesta.'
 else:msg='Sin cocción obligatoria: abre latas, mezcla y come. Comprueba siempre la indicación del fabricante.'
 para(msg,M+17,yy-106,PW-34,10.1)
text(M,102,'Los importes se calculan con envases completos, sin ofertas de fidelización.',10,MUTED)
text(M,85,'Una «ración de adulto» no equivale a prometer que todos los nutrientes estén cubiertos.',9.2,MUTED)
# 06-08
for key in ['basico','equilibrado','comodo']:
 p=D['plans'][key];new(p['name']+' · lista exacta','Compra por adulto y por hogar')
 text(M,702,p['subtitle'],10.2,MUTED)
 text(M,675,'Toca el producto en el PDF para abrir la ficha del supermercado.',9.3,GREEN)
 items=p['items'];rr=[];lnk={}
 for i,(pid,n) in enumerate(items.items()):
  pr=D['products'][pid];rr.append((pr['name'],pr['size'],str(n),str(n*2-(1 if pid=='sal' else 0)),str(n*4-(3 if pid=='sal' else 0)),euros(n*pr['price'])))
  lnk[i]=pr['url']
 h=21 if len(rr)>20 else 24
 bottom=small_table(['PRODUCTO','ENVASE','1','2','4','€ / 1'],rr,top=650,rowh=h,colwidths=[203,88,31,31,31,PW-384],fs=9.1,links=lnk)
 totals=[p['total'],round(p['total']*2-(.44 if key=='basico' else 0),2),round(p['total']*4-(1.32 if key=='basico' else 0),2)]
 text(M,bottom-27,'TOTAL 1 ADULTO',10,MUTED,'LatoBold');right(M+235,bottom-27,euros(totals[0]),14,GREEN,'LatoBlack')
 text(M,bottom-50,'TOTAL 2 ADULTOS',10,MUTED,'LatoBold');right(M+235,bottom-50,euros(totals[1]),14,GREEN,'LatoBlack')
 text(M+275,bottom-27,'4 RACIONES ADULTAS',9,MUTED,'LatoBold');right(W-M,bottom-27,euros(totals[2]),14,GREEN,'LatoBlack')
 y=bottom-72
 if key=='basico':note='La sal de 1 kg se comparte en hogares de 2 y de 4: por eso el total familiar no es una multiplicación exacta. No consumas toda la sal.'
 elif key=='equilibrado':note='No hay dependencia de nevera antes de abrir, salvo que el fabricante indique lo contrario. Frascos abiertos: consumir de una vez si no puedes refrigerar.'
 else:note='Atún, conservas de legumbres y cereales permiten comidas completas sin hornillo, pero comprueba etiquetas de platos preparados antes de comerlos fríos.'
 para(note,M,y,PW,9.6,color=MUTED,maxh=46)
# 09
new('Siete días sin fuego','Lista y coste por persona')
p=D['plans']['sinfuego'];text(M,698,p['subtitle'],10.3,MUTED)
rr=[];lks={}
for i,(pid,n) in enumerate(p['items'].items()):
 pr=D['products'][pid];rr.append((pr['name'],pr['size'],f'× {n}',euros(n*pr['price'])));lks[i]=pr['url']
bot=small_table(['PRODUCTO','FORMATO','UDS.','IMPORTE'],rr,top=666,rowh=30,colwidths=[230,112,64,PW-406],links=lks)
text(M,bot-35,'TOTAL 1 ADULTO',13,GREEN,'LatoBlack');right(W-M,bot-35,euros(p['total']),19,INK,'LatoBlack')
para('2 adultos: '+euros(p['total']*2)+' · 4 raciones adultas: '+euros(p['total']*4)+'. Se compra con margen; no hay que agotar todos los envases en siete días.',M,bot-53,PW,10.1)
rect(M,75,PW,73,PINK,8);para('<b>Importante:</b> no hay fuego ni frío: usa envases pequeños cuando sea posible y termina inmediatamente lo abierto. Prepara con agua potable; no guardes mezclas de legumbre y pescado a temperatura ambiente.',M+12,139,PW-24,10)
# 10
new('Menú de una semana sin fuego','Vitro o inducción apagada')
notes=['Desayuno','Comida','Cena']
y=690
for i,items in enumerate(D['noFireMenu']):
 rect(M,y-79,PW,74,SOFT if i%2==0 else HexColor('#f0eee7'),8)
 text(M+12,y-22,f'DÍA {i+1}',11,GREEN,'LatoBlack')
 for j,meal in enumerate(items):
  para('<b>'+notes[j]+':</b> '+meal,M+95,y-9-j*22,PW-114,9.8,maxh=21)
 y-=87
rect(M,75,PW,83,PINK,9)
para('* Las preparaciones cocidas de lata solo se comen frías si son listas para consumir según la etiqueta. Si indican «calentar bien antes de consumir», elige legumbres cocidas, atún y maíz en su lugar. No uses restos de una lata abierta sin frío.',M+13,149,PW-26,10.1)
# 11? new numbering check: cover1 index2 kitchen3 apagón4 overview5 3 list6-8 sinfuego9 menu10.
new('Dos adultos y familia de cuatro','Tablas cerradas · sin multiplicar')
rows=[]
for k in ['basico','equilibrado','comodo','sinfuego']:
 p=D['plans'][k];t=p['total'];b=2*t-(.44 if k=='basico' else 0);f=4*t-(1.32 if k=='basico' else 0)
 rows.append((p['name'],euros(t),euros(b),euros(f)))
small_table(['CESTA','1 ADULTO','2 ADULTOS','4 RACIONES ADULTAS'],rows,top=684,rowh=50,colwidths=[145,101,113,PW-359],fs=10.2)
y=445
label(M,y,'Una familia de 4 no siempre equivale a cuatro adultos')
y=430
para('Para no quedarse corto, la columna de cuatro utiliza cuatro raciones de adulto. Si los niños son pequeños, la cesta real puede durar más. No reduzcas las necesidades de agua de un bebé, ni ajustes leche de fórmula o dietas terapéuticas mediante una regla fija.',M,y,PW,11)
y=322
label(M,y,'Cifras útiles ya calculadas')
for i,(a,b) in enumerate([('Equilibrado: compra por semana durante 8 semanas',euros(D['plans']['equilibrado']['total']/8)+' de media'),('Básico: coste por día adulto',euros(D['plans']['basico']['total']/30)),('Cómodo: coste por día adulto',euros(D['plans']['comodo']['total']/30)),('Semana sin fuego: 2 adultos',euros(D['plans']['sinfuego']['total']*2)),('Semana sin fuego: 4 raciones',euros(D['plans']['sinfuego']['total']*4))]):
 rect(M,291-i*42,PW,36,SOFT,7);text(M+10,313-i*42,a,10,INK,'Lato');right(W-M-11,313-i*42,b,10,GREEN,'LatoBold')
para('Los importes son orientativos; una familia con menores debe ajustar texturas, alergias y cantidades. La calculadora exacta de paquetes está incluida en la web app.',M,66,PW,8.8,color=MUTED)
# 12-15 month menu
for week in range(4):
 new(f'Semana {week+1} · menú sin repeticiones',f'Días {week*7+1} a {week*7+7} · cesta equilibrada')
 text(M,696,'Una ración adulta. Ajusta apetito, actividad, alergias y disponibilidad de agua.',9.8,MUTED)
 y=674
 for i in range(7):
  m=D['menus'][week*7+i]
  rect(M,y-79,PW,74,SOFT if i%2==0 else HexColor('#eeede7'),8)
  text(M+10,y-24,f'DÍA {m["day"]:02d}',11,GREEN,'LatoBlack')
  for j,(a,s) in enumerate([('D','breakfast'),('C','lunch'),('N','dinner')]):
   para('<b>'+a+'</b> · '+m[s],M+91,y-9-21*j,PW-108,10,maxh=21)
  y-=87
 rect(M,73,PW,44,PINK,7)
 para('D = desayuno · C = comida · N = cena. La variedad de ingredientes es la de una despensa; añade fruta y verdura fresca siempre que puedas. Evita guardar arroz cocido sin refrigeración.',M+11,111,PW-22,9.2)
# 16 weekly example others
new('Una semana tipo según tu plan','7 días de orientación')
ex={
 'BÁSICO':['Avena / Arroz con lentejas / Garbanzos al tomate','Galletas / Pasta con tomate / Lentejas espesas','Avena / Garbanzos con arroz / Macarrones','Torta de harina / Lentejas / Arroz con atún','Avena / Pasta con alubias / Crema de garbanzos','Leche y galletas / Arroz con tomate / Lentejas','Tortita / Pasta con legumbres / Sopa de arroz'],
 'EQUILIBRADO':['Avena y leche / Arroz con sardinas / Ensalada de legumbres','Galletas y fruta / Pasta con atún / Verduras con lentejas','Avena con cacahuete / Garbanzos con tomate / Fabada','Torta y miel / Pasta con maíz / Alubias con verduras','Avena / Arroz con garbanzos / Ensalada de sardinas','Leche y galletas / Lentejas / Pasta con espinacas','Avena / Arroz de tomate / Garbanzos y fruta'],
 'CÓMODO':['Avena en leche / Garbanzos con atún / Wrap de alubias','Galletas / Lentejas con maíz / Sardinas con tomate','Avena con cacahuete / Fabada lista / Ensalada de legumbres','Leche y galletas / Garbanzos y maíz / Wrap de atún','Avena / Garbanzos con espinaca / Alubias con tomate','Galletas y cacahuete / Sardinas y legumbres / Lentejas frías','Avena y miel / Ensalada de tres botes / Wrap de garbanzos']}
y=697
for key,meals in ex.items():
 rect(M,y-191,PW,185,SOFT,10);text(M+13,y-25,key,13,GREEN,'LatoBlack')
 for i,s in enumerate(meals):
  text(M+14,y-51-i*19,f'{i+1}',9,ORANGE,'LatoBlack')
  para(s,M+34,y-39-i*19,PW-48,8.3,leading=11,maxh=17)
 y-=202
text(M,67,'En el Cómodo, la avena se toma remojada y los platos listos solo en frío si su etiqueta lo permite.',9,MUTED)
# 17-21 40 recipes
cats=['DESAYUNOS Y PLATOS CALIENTES','PLATOS CALIENTES Y SIN FUEGO','18 FORMAS DE COMER SIN FUEGO','SIN FUEGO: MEZCLAR Y COMER','SIN FUEGO, PAN, DULCES Y NIÑOS']
for idx in range(5):
 recipes=D['recipes'][idx*8:(idx+1)*8]
 new(f'Recetas de despensa · {idx*8+1:02d}–{idx*8+8:02d}',cats[idx])
 y=696
 for r in recipes:
  rect(M,y-77,PW,72,SOFT if r['id']%2==0 else HexColor('#efeee8'),8)
  text(M+10,y-24,f'{r["id"]:02d}',13,ORANGE,'LatoBlack')
  name=r['name'];siz=12.4
  while pdfmetrics.stringWidth(name,'LatoBold',siz)>425:siz-=.2
  text(M+40,y-22,name,siz,GREEN,'LatoBold')
  right(W-M-11,y-22,'SIN FUEGO' if r['category']=='Sin fuego' or r['fire']=='0' else r['fire'],8,ORANGE,'LatoBold')
  para('<b>Para 1:</b> '+html.escape(r['ingredients'])+'. <b>Cómo:</b> '+html.escape(r['steps']),M+40,y-34,PW-53,9.35,leading=12,maxh=37)
  y-=81
 para('Preparación orientativa para una ración. Los platos calientes deben cocinarse por completo; no guardes sobras sin frío. Si el ingrediente de la receta no está en tu cesta, se trata de una variante.',M,72,PW,8.9,color=MUTED)
#22 low gas
new('Cocinar con poco gas','Cocción retenida o «cocina de caja»')
para('Una caja aislante reduce el tiempo de llama tras alcanzar el hervor, pero no sustituye una cocción segura. Para usarla necesitas una olla con tapa que cierre bien, toallas secas y una caja térmica resistente. Nunca metas el hornillo encendido ni una bombona dentro.',M,705,PW,10.6)
steps=[('1','Preparar','Remoja las legumbres que lo requieran. Ten agua potable, receta y tapa listas antes de encender.'),('2','Arranque con llama','Calienta la olla hasta ebullición real. Cocina el tiempo inicial indicado por la receta.'),('3','Aislar','Apaga el gas. Cierra la olla, envuélvela y colócala en la caja. Mantén lejos de niños y material inflamable.'),('4','Verificar y comer','Comprueba que se ha cocinado por completo. Si ha enfriado demasiado o necesitas más cocción, vuelve a hervir y termina al fuego.')]
y=611
for n,tt,body in steps:
 rect(M,y-77,PW,71,SOFT,9);text(M+12,y-33,n,19,ORANGE,'LatoBlack');text(M+43,y-26,tt,12,GREEN,'LatoBold');para(body,M+43,y-37,PW-57,9.5);y-=86
label(M,262,'Referencias orientativas para ahorrar llama')
small_table(['ALIMENTO','HERVOR INICIAL','REPOSO EN CAJA','COMPROBAR'],[
('Arroz blanco','4–6 min','10–20 min','Tierno y caliente'),('Pasta corta','3–5 min','6–10 min','Al dente'),('Lenteja pardina','≥10 min','20–40 min','Muy tierna'),('Garbanzo seco','Cocción completa','No usar caja sola','Sin dureza'),('Alubia roja seca','Hervor fuerte ≥10 min','No usar caja sola','Lectinas')],top=244,rowh=25,colwidths=[118,105,105,PW-328],fs=9.2)
rect(M,73,PW,39,PINK,6);para('Seguridad: si no puedes asegurar una temperatura de mantenimiento superior a 60 °C, sirve pronto y evita dejar comida templada. El arroz cocido no se conserva sin frío.',M+11,103,PW-22,9.1)
#23 sprouts
new('Germinados de lenteja en 3 días','Fresco, pero cocinado por seguridad')
para('Puedes obtener brotes verdes de lentejas secas aptas para alimentación en 48–72 h, aunque no todos los lotes germinan. Los germinados crudos pueden transmitir Salmonella o E. coli; la opción segura es cocinarlos completamente antes de comer.',M,709,PW,11)
y=635
for i,(a,b) in enumerate([
('Día 0 · seleccionar','Revisa que las lentejas no estén deterioradas. Retira cuerpos extraños, lávalas con agua potable y remoja 8–12 h.'),
('Día 1 · escurrir','Escurre en recipiente limpio con gasa o malla, sin agua estancada. Aclara con agua potable 2 veces al día.'),
('Día 2 · mantener','Repite los aclarados y escurre por completo; mantenlos sin sol directo. Desecha si huelen mal, se enmohecen o están viscosos.'),
('Día 3 · consumir','Si han germinado, aclara, cocínalos bien y cómelos en el momento. Nunca son sustituto de una reserva de verduras.')]):
 y=box_title(y,a,b,99)
label(M,174,'Cuándo no hacerlo')
para('No germines durante un corte de agua, sin higiene, sin posibilidad de cocerlos o en días de mucho calor. Evita los brotes crudos especialmente en niños pequeños, embarazadas, personas mayores e inmunodeprimidas. EFSA comunicó en junio de 2026 un brote multinacional de salmonelosis ligado a semillas germinadas.',M,161,PW,10.2)
#24 storage
new('Guardar, revisar y rotar','Primero lo que vence antes')
blocks=[('Lugar correcto','Seco, limpio, sin luz directa, lejos de detergentes y del suelo. Etiqueta fecha de compra, apertura y consumo preferente. No trasvases alimentos a botes sin indicar alérgenos.'),('Primero en entrar, primero en salir','Coloca delante el lote con fecha anterior. Antes de comprar, usa la caja «consumir este mes». Revisa una vez al mes y repón solo lo usado.'),('Sin nevera','Abre una ración cada vez. Leche UHT, tomate, conservas vegetales y atún necesitan frío DESPUÉS de abrirse; consume la unidad entera si no dispones de él.'),('En verano','Protege del calor intenso, especialmente grasas y harinas integrales; compra unidades pequeñas y revisa insectos y humedad más a menudo.'),('En invierno','Evita condensaciones en trasteros, terrazas y armarios junto a paredes frías. Ventila el almacén y comprueba juntas y cierres.'),('No tirar por rutina','La fecha de consumo preferente no es una caducidad; examina integridad y conservación. La fecha de caducidad sí es límite de seguridad.')]
y=696
for tt,bb in blocks:
 y=box_title(y,tt,bb,91)
#25 discard
new('Conservar o tirar','Guía de decisión doméstica')
lab=[('TIRAR SIN PROBAR','Lata hinchada, fuga, óxido profundo o abombamiento; tapa de frasco levantada; conserva abierta durante horas sin frío; moho; olor anormal.'),('FECHA DE CADUCIDAD','Si ha pasado la fecha de caducidad, no consumir. No usar olfato o aspecto para decidir.'),('CONSUMO PREFERENTE','Puede seguir siendo apto si el envase está íntegro, se ha conservado bien y el alimento no presenta alteraciones. Comprueba lote e instrucciones.'),('FRIGORÍFICO EN APAGÓN','Cerrado: referencia 4 horas. Si supera el plazo y no tienes lectura fiable de temperatura, descarta perecederos de riesgo. Nevera bien calibrada: ≤4 °C.'),('CONGELADOR EN APAGÓN','Lleno y sin abrir: hasta unas 48 h; medio lleno: 24 h. Si aún tiene cristales de hielo o sigue ≤4 °C, puede ser recuperable.'),('ARROZ, PASTA Y LEGUMBRES COCIDOS','Consume recién hechos. Si hay frigorífico, enfría de forma rápida y guarda tapados; no dejes arroz cocido horas a temperatura ambiente.')]
y=701
for a,b in lab:
 rect(M,y-91,PW,85,PINK if 'TIRAR' in a else SOFT,9)
 text(M+12,y-28,a,11,GREEN,'LatoBlack');para(b,M+12,y-39,PW-24,9.8)
 y-=103
para('Ante una inundación, agua de origen dudoso, envases contaminados o problemas de salud, aplica un criterio más conservador y consulta avisos oficiales de AESAN.',M,68,PW,9,color=MUTED)
#26 labels
new('21 etiquetas para tus botes','Imprime y recorta')
names=['Arroz','Pasta','Avena','Lentejas','Garbanzos','Alubias','Harina','Azúcar','Sal yodada','Aceite','Tomate','Atún','Sardinas','Maíz','Verduras','Leche UHT','Galletas','Cacahuete','Miel','Fruta conserva','RESERVA / abrir']
for i,n in enumerate(names):
 col=i%3;row=i//3;xx=M+col*(PW/3+1);yy=693-row*87
 c.setStrokeColor(LINE);c.setLineWidth(1);c.setDash(3,2);c.roundRect(xx,yy-74,PW/3-10,72,4,stroke=1,fill=0);c.setDash()
 text(xx+10,yy-22,n.upper(),9.2,GREEN,'LatoBlack')
 text(xx+10,yy-42,'Compra: ____ / ____',8.3,MUTED)
 text(xx+10,yy-58,'Pref.: ____ / ____',8.3,MUTED)
 text(xx+10,yy-70,'Abierto: ________',7.7,MUTED)
para('Escribe el lote o conserva la etiqueta original si hay alérgenos, instrucciones especiales o fecha de caducidad. No guardes productos perecederos en un bote a temperatura ambiente.',M,76,PW,9.1,color=MUTED)
#27 water
new('Agua para un mes','Sin engañarse con el espacio')
para('La comida seca necesita agua para cocinar, y el cuerpo necesita agua aunque no haya luz. Los CDC aconsejan reservar al menos 1 galón por persona y día (≈3,8 L) para una emergencia, empezando por 3 días y aspirando a 2 semanas si es posible.',M,707,PW,10.8)
small_table(['RESERVA','1 PERSONA','2 PERSONAS','4 PERSONAS'],[
('3 días', '11,4 L', '22,8 L','45,6 L'),('14 días','53,2 L','106,4 L','212,8 L'),('30 días','114 L','228 L','456 L')],top=622,rowh=47,colwidths=[128,126,126,PW-380],fs=11)
y=440
label(M,y,'Cómo organizarla sin llenar la casa de garrafas')
y=423
for s in ['Mantén primero 3 días de agua segura en botellas sin abrir; amplía gradualmente hasta 14 días si tienes espacio.', 'Usa recipientes apilables de uso alimentario, de 10–20 L, opacos o guardados sin luz. Rotula fecha y sustituye agua rellenada cada 6 meses.', 'Para los días 15–30 no hay «truco» que sustituya 114 L de agua real por persona: identifica un punto de suministro POTABLE alternativo y un plan de transporte.', 'Un filtro doméstico no garantiza eliminar todos los contaminantes químicos ni hace potable automáticamente agua de una fuente insegura.', 'Más necesidades con calor, enfermedad, bebés o mascotas. No uses agua no potable para preparar fórmula infantil.']:
 y=bullet(s,M,y,size=10.1,sp=12)
rect(M,91,PW,66,PINK,8);para('Agua almacenada y agua futura son conceptos distintos: este plan permite tener un mes de alimentos, pero la autonomía hídrica real depende de cuánto almacenes y de que exista suministro seguro.',M+13,146,PW-26,9.8)
#28 special
new('Personas y animales con necesidades especiales','Adaptar, no improvisar')
ca=[('Bebés','Fórmula apropiada, utensilios limpios, agua segura y modo de preparación indicado por pediatría. No se sustituye por leche UHT; reserva pañales e higiene.'),('Niños','Usa raciones según edad y apetito, texturas seguras y acompañamiento al comer. Vigila atragantamientos con frutos secos, trozos duros y alimentos espesos.'),('Celiaquía','Arroz y legumbres simples suelen ser compatibles, pero verifica etiquetado «sin gluten» y contaminación cruzada en avena, harinas, salsas y utensilios.'),('Diabetes','Prioriza legumbres, verduras y proteína; controla porciones de cereales, galletas y miel según pauta individual. Prevé medicación, medidor y refrigeración si procede.'),('Personas mayores','Texturas fáciles, apertura de envases, hidratación, bajo exceso de sal y provisión de medicación. Evita germinados crudos.'),('Vegetarianos','Sustituye pescado por legumbres, crema de cacahuete y otros alimentos de la cesta; revisa B12 y otras necesidades dietéticas.'),('Mascotas','Reserva su alimento habitual y agua extra, más medicación si corresponde. No bases su dieta en comida humana salada.')]
y=698
for tt,bb in ca:
 rect(M,y-79,PW,74,SOFT,8);text(M+12,y-24,tt,12,GREEN,'LatoBold');para(bb,M+12,y-33,PW-24,9.3)
 y-=86
para('Si hay alergias, disfagia o una dieta médica, prepara una lista individual y consérvala con la medicación. Este documento no sustituye las indicaciones clínicas.',M,69,PW,9,color=MUTED)
#29 8 week plan + sources
new('Compra escalonada en ocho semanas','Empezar sin gastar todo de golpe')
steps=[
('1','Arranque','Arroz, 2 frascos de garbanzos, 1 lata de tomate y atún. Prioridad: 24 h sin cocinar.'),
('2','Desayunos','Avena, leche UHT, galletas y crema de cacahuete.'),
('3','Legumbres','Lentejas secas, garbanzo seco, alubias y lentejas cocidas.'),
('4','Proteína','Atún y sardinas; añade reserva de agua y abrelatas.'),
('5','Verduras','Tomate, maíz, macedonia de verduras y garbanzos con espinacas.'),
('6','Cocina','Pasta, harina y aceite; revisa el encendido sin luz y combustible.'),
('7','Variedad','Fabada, miel, piña y melocotón en conserva.'),
('8','Cerrar y rotar','Completa unidades de la lista Equilibrada; marca fechas y usa primero lo más antiguo.')]
y=696
for n,t,d in steps:
 rect(M,y-61,PW,56,SOFT,8);text(M+12,y-24,n,15,ORANGE,'LatoBlack');text(M+41,y-24,t,11,GREEN,'LatoBold');para(d,M+41,y-30,PW-54,9,maxh=23)
 y-=69
label(M,121,'Precios, contrastes y fuentes')
para('Cesta de Carrefour (marca blanca) y macedonia DIA; precios online observados el 07.11.2026. Comparación DIA: arroz extra 1 kg 1,15 €, lenteja pardina 1 kg 1,85 € y macarrón 1 kg 1,00–1,20 € según oferta. Precios sin transporte ni descuentos acumulables. Las fichas son clicables en las tablas.',M,108,PW,8.6,maxh=57)
#30 end
new();c.setFillColor(GREEN);c.rect(0,0,W,H,stroke=0,fill=1)
label(M,740,'RECORTA O GUARDA EN EL MÓVIL',LIME)
text(M,669,'UNA DESPENSA',35,WHITE,'LatoBlack');text(M,624,'QUE SE UTILIZA',35,WHITE,'LatoBlack')
para('No compres lo que no sueles comer. Elige un plan, usa la comida más antigua y repón lo consumido. El objetivo es que la reserva forme parte de tu cocina diaria.',M,561,470,15,color=WHITE,leading=22)
rect(M,309,PW,168,HexColor('#244d44'),12)
for i,t in enumerate(['☐ Sé qué funciona en mi cocina sin luz','☐ Tengo agua potable para empezar','☐ He elegido una cesta que cabe en casa','☐ Conozco qué tirar tras un apagón','☐ Puedo preparar una comida sin fuego']):
 # unsupported checkbox glyph? use square drawn
 yy=445-i*28;c.setStrokeColor(LIME);c.rect(M+22,yy-2,10,10,stroke=1,fill=0);text(M+45,yy,t[2:],11,WHITE)
text(M,239,'FUENTES Y COMPROBACIÓN',10,LIME,'LatoBlack')
for i,src in enumerate(D['sources'][:6]):
 yy=218-i*19;txt=f'{i+1}. '+src['name'];text(M,yy,txt,8.3,WHITE);c.linkURL(src['url'],(M,yy-3,W-M,yy+12),relative=0)
para('PDF A4 · 30 páginas · consulta de precios 07.11.2026 · fichas de producto y referencias oficiales enlazadas.',M,56,PW,8.8,color=LIME)
c.save();print('CREADO',OUT,'PÁGINAS',page)
