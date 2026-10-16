'use strict';
const $=i=>document.getElementById(i),el=(t,c,h)=>{const e=document.createElement(t);e.className=c||'';if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
// Türkçe harfleri ÖNCE eşle, sonra küçült (İ.toLowerCase() birleşik nokta üretir)
const TRM={ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u',Ç:'c',Ğ:'g',İ:'i',I:'i',Ö:'o',Ş:'s',Ü:'u'};
const slug=s=>String(s).replace(/[çğıöşüÇĞİIÖŞÜ]/g,c=>TRM[c]).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
let tt;const toast=(m,ms)=>{const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),ms||1600)};
const gen=(window.javascript&&javascript.javascriptGenerator)||Blockly.JavaScript;
gen.addReservedWords('data,bot,TOKEN,TopluyoBOT,err,require,console,process,module,exports,setTimeout,setInterval,Promise,_son,_loop,_mesgul,_ilk,_kucuk');
// Sonsuz döngü koruması (her olay çalışmasında ayrı sayaç: _loop)
gen.INFINITE_LOOP_TRAP='if (--_loop < 0) throw new Error("Sonsuz döngü engellendi");\n';
const val=(b,g,n)=>g.valueToCode(b,n,99);
// _son ve _loop her çalışmada YENİ tanımlanır (olaylar arası yarış durumu yok)
const safe=(b,g)=>"  let _son;\n  let _loop = 1000000;\n  try {\n"+g.prefixLines(g.statementToCode(b,'DO'),'  ')+"  } catch (err) {\n    console.error('Blok hatası:', err);\n  }\n";
const HELPERS="const _kucuk = (s) => String(s).replace(/[İIı]/g, 'i').toLowerCase();";

// ---- Olaylar ve gelen veriler ----
const EV={olay_mesaj:['📨 Mesaj gelince','post/add'],olay_mention:['🔔 Mention (bildirim) gelince','post/mention'],olay_form:['📋 Form gönderilince','post/bumote'],
 olay_ozel:['💬 Özel mesaj gelince','message/send'],olay_turbo:['💸 Turbo transferi gelince','turbo/transfer'],
 olay_gir:['➕ Gruba biri katılınca','group/join'],olay_cik:['➖ Gruptan biri ayrılınca','group/leave'],olay_at:['🚪 Gruptan biri atılınca','group/kick']};
const ALL=Object.keys(EV);
const VD={veri_kullanici:['👤 Kullanıcı ID (olayı yapan)','data.user_id',ALL],veri_kanal:['📺 Kanal ID','data.channel_id',['olay_mesaj','olay_mention']],
 veri_mesaj:['💬 Mesaj metni','data.message',['olay_mesaj','olay_mention','olay_ozel']],veri_grup:['👥 Grup ID','data.group_id',['olay_gir','olay_cik','olay_at']],
 veri_gonderi:['🧾 Gönderi ID','data.post_id',['olay_form']],veri_buton:['🔘 Form buton etiketi','data.message.submit',['olay_form']],
 veri_miktar:['💰 Turbo miktarı','data.message.quantity',['olay_turbo']],veri_not:['📝 Turbo notu','data.message.message',['olay_turbo']],
 veri_transfer:['🔢 Transfer ID','data.transfer_id',['olay_turbo']]};
const ALLOW={veri_form:['olay_form'],veri_ben:ALL};Object.keys(VD).forEach(k=>ALLOW[k]=VD[k][2]);
const HATS=new Set([...ALL,'bot_baglandi','zamanlayici']);
const defs=[{type:'bot_baglandi',message0:'🟢 Bot bağlanınca %1',args0:[{type:'input_statement',name:'DO'}],colour:30},
 {type:'zamanlayici',message0:'⏰ Her %1 saniyede bir %2',args0:[{type:'field_number',name:'S',value:60,min:1},{type:'input_statement',name:'DO'}],colour:30},
 {type:'veri_form',message0:'📋 Form alanı %1',args0:[{type:'input_value',name:'A'}],output:null,colour:180,tooltip:'Formdaki alanın değeri'},
 {type:'veri_ben',message0:'🤖 Olayı yapan ben (bot) miyim?',output:'Boolean',colour:180,tooltip:'Botun kendi mesajına cevap verip sonsuz döngüye girmesini önlemek için kullan'},
 {type:'yaz',message0:'🖨️ Konsola yaz %1',args0:[{type:'input_value',name:'A'}],previousStatement:null,nextStatement:null,colour:290},
 {type:'bekle',message0:'⏱️ Bekle %1 saniye',args0:[{type:'input_value',name:'S'}],previousStatement:null,nextStatement:null,colour:290,inputsInline:true},
 {type:'metin_baslar',message0:'%1 şununla başlıyor mu: %2 harf farkını yoksay %3',args0:[{type:'input_value',name:'A'},{type:'input_value',name:'B'},{type:'field_checkbox',name:'CI',checked:false}],output:'Boolean',colour:160,inputsInline:true},
 {type:'metin_icerir',message0:'%1 içinde geçiyor mu: %2 harf farkını yoksay %3',args0:[{type:'input_value',name:'A'},{type:'input_value',name:'B'},{type:'field_checkbox',name:'CI',checked:false}],output:'Boolean',colour:160,inputsInline:true},
 {type:'metin_kelime',message0:'%1 metninin %2. kelimesi',args0:[{type:'input_value',name:'A'},{type:'input_value',name:'N'}],output:null,colour:160,inputsInline:true},
 {type:'api_yanit',message0:'📦 Son API yanıtı',output:null,colour:290},
 {type:'api_yanit_alan',message0:'📦 Son yanıtın %1 alanı',args0:[{type:'input_value',name:'F'}],output:null,colour:290,inputsInline:true}];
ALL.forEach(t=>{defs.push({type:t,message0:EV[t][0]+' %1',args0:[{type:'input_statement',name:'DO'}],colour:30,tooltip:EV[t][1]});
 gen.forBlock[t]=(b,g)=>"bot.on('message', async (data) => {\n  if (data.action === '"+EV[t][1]+"') {\n"+g.prefixLines(safe(b,g),'  ')+"  }\n});\n"});
Object.keys(VD).forEach(t=>{defs.push({type:t,message0:VD[t][0],output:null,colour:180,tooltip:VD[t][1]});gen.forBlock[t]=()=>[VD[t][1],0]});
gen.forBlock.veri_form=(b,g)=>['data.message.form['+(val(b,g,'A')||"''")+']',0];
gen.forBlock.veri_ben=()=>['(bot._ben != null && String(data.user_id) === String(bot._ben))',0];
// "Bot bağlanınca" sadece BİR kez çalışır (yeniden bağlanmada tekrarlamaz)
gen.forBlock.bot_baglandi=(b,g)=>"{\n  let _ilk = true;\n  bot.on('connected', async () => {\n    if (!_ilk) return;\n    _ilk = false;\n"+g.prefixLines(safe(b,g),'  ')+"  });\n}\n";
// Zamanlayıcı: önceki tur bitmeden yenisi başlamaz, bot bağlanmadan çalışmaz
gen.forBlock.zamanlayici=(b,g)=>"{\n  let _mesgul = false;\n  setInterval(async () => {\n    if (_mesgul || !bot._hazir) return;\n    _mesgul = true;\n"+g.prefixLines(safe(b,g),'  ')+"    _mesgul = false;\n  }, "+(b.getFieldValue('S')*1000)+");\n}\n";
gen.forBlock.yaz=(b,g)=>'console.log('+(val(b,g,'A')||"''")+');\n';
gen.forBlock.bekle=(b,g)=>'await new Promise(r => setTimeout(r, ('+(val(b,g,'S')||1)+') * 1000));\n';
const KU=b=>{const v=b.getFieldValue('CI');return v===true||v==='TRUE'};
const cs=(b,x)=>KU(b)?'_kucuk('+x+')':'String('+x+')';
gen.forBlock.metin_baslar=(b,g)=>[cs(b,val(b,g,'A')||"''")+'.startsWith('+cs(b,val(b,g,'B')||"''")+')',0];
gen.forBlock.metin_icerir=(b,g)=>[cs(b,val(b,g,'A')||"''")+'.includes('+cs(b,val(b,g,'B')||"''")+')',0];
gen.forBlock.metin_kelime=(b,g)=>["(String("+(val(b,g,'A')||"''")+").trim().split(/\\s+/)[("+(val(b,g,'N')||1)+") - 1] ?? '')",0];
gen.forBlock.api_yanit=()=>['_son',0];
gen.forBlock.api_yanit_alan=(b,g)=>['(_son ? _son['+(val(b,g,'F')||"''")+'] : undefined)',0];

// ---- API blokları (api.js tablosundan) ----
// Riskli uçlar (silme, atma, Turbo, giriş/hesap) blokta ⚠️ ile işaretlenir
const RISK=/^(user\/(login|auth|register|logout|2fa|qr)|pass\/)|\/(del|kick|transfer|reset|hide)$/;
const GR=[];API.trim().split('\n').forEach(l=>{if(l.startsWith('## ')){const[n,h]=l.slice(3).split('|');GR.push({n,h:+h,e:[]})}else if(l.trim()){const[p,t,f]=l.split('|');GR[GR.length-1].e.push({p,t,f:f?f.split(','):[]})}});
GR.forEach(grp=>grp.e.forEach(e=>{
 const ty=e.ty='api_'+e.p.replace(/\//g,'_'),fs=e.f.map(x=>x.replace('#','')),rk=RISK.test(e.p),ic=rk?'⚠️ ':'🌐 ',
  d={type:ty,previousStatement:null,nextStatement:null,colour:grp.h,tooltip:'/!api/'+e.p+(rk?'  —  ⚠️ Dikkat: geri alınamaz ya da hesabı etkiler':'')};
 if(fs.length<=3){d.message0=ic+e.t+fs.map((f,i)=>' '+f+' %'+(i+1)).join('');if(fs.length)d.args0=fs.map(f=>({type:'input_value',name:f}));d.inputsInline=true}
 else{d.message0=ic+e.t;fs.forEach((f,i)=>{d['message'+(i+1)]=f+' %1';d['args'+(i+1)]=[{type:'input_value',name:f,align:'RIGHT'}]})}
 defs.push(d);
 gen.forBlock[ty]=(b,g)=>{const kv=[];e.f.forEach(f=>{const n=f.replace('#','');let c=val(b,g,n);if(!c||c==="''")return;
   // # alanlarda tırnağı yalnızca sayı bire bir aynı kalıyorsa düşür (büyük ID, 0123, 1.50 gibi değerler string kalır)
   const m=/^'(-?(?:0|[1-9]\d*)(?:\.\d+)?)'$/.exec(c);if(f[0]==='#'&&m&&String(Number(m[1]))===m[1])c=m[1];
   kv.push(n+': '+c)});
  return '_son = await bot.post('+JSON.stringify('/!api/'+e.p)+', {'+(kv.length?' '+kv.join(', ')+' ':'')+'});\n'};
}));
Blockly.defineBlocksWithJsonArray(defs);

// ---- Araç kutusu ----
const sh=(t,f)=>({shadow:{type:t,fields:f}}),tx=()=>sh('text',{TEXT:''}),nm=v=>sh('math_number',{NUM:v});
const bl=(type,inputs)=>({kind:'block',type,inputs});
const T=[
 {kind:'category',name:'🎧 Dinle',colour:'30',contents:[...ALL,'bot_baglandi','zamanlayici'].map(t=>bl(t))},
 {kind:'category',name:'📥 Gelen veri',colour:'180',contents:[...Object.keys(VD).map(t=>bl(t)),bl('veri_ben'),bl('veri_form',{A:tx()})]},
 {kind:'category',name:'🌐 API (tüm özellikler)',colour:'210',contents:GR.map(grp=>({kind:'category',name:grp.n,colour:String(grp.h),contents:grp.e.map(e=>bl(e.ty,Object.fromEntries(e.f.map(f=>[f.replace('#',''),tx()]))))}))},
 {kind:'sep'},
 {kind:'category',name:'🔀 Mantık',colour:'210',contents:['controls_if','logic_compare','logic_operation','logic_negate','logic_boolean'].map(t=>bl(t))},
 {kind:'category',name:'🔁 Döngü',colour:'120',contents:[bl('controls_repeat_ext',{TIMES:nm(3)}),bl('controls_whileUntil'),bl('controls_flow_statements')]},
 {kind:'category',name:'🔢 Matematik',colour:'230',contents:[bl('math_number'),bl('math_arithmetic',{A:nm(1),B:nm(1)}),bl('math_random_int',{FROM:nm(1),TO:nm(100)}),bl('math_modulo',{DIVIDEND:nm(10),DIVISOR:nm(3)})]},
 {kind:'category',name:'🔤 Metin',colour:'160',contents:[bl('text'),bl('text_join'),bl('text_length',{VALUE:tx()}),bl('metin_baslar',{A:tx(),B:tx()}),bl('metin_icerir',{A:tx(),B:tx()}),bl('metin_kelime',{A:tx(),N:nm(1)})]},
 {kind:'category',name:'📦 Değişkenler',colour:'330',custom:'VARIABLE'},
 {kind:'category',name:'🧰 Yardımcı',colour:'290',contents:[bl('yaz',{A:tx()}),bl('bekle',{S:nm(1)}),bl('api_yanit'),bl('api_yanit_alan',{F:tx()})]}
];
const ws=Blockly.inject('ws',{toolbox:{kind:'categoryToolbox',contents:T},media:'https://cdn.jsdelivr.net/npm/blockly@10.4.3/media/',trashcan:true,zoom:{controls:true,wheel:true,startScale:.9},grid:{spacing:24,length:2,colour:'#e3e3e3',snap:true}});

// ---- Dosyalar ----
let S={files:[{n:'index.js',s:null}],cur:0},rt,qw=0;
try{const j=JSON.parse(localStorage.getItem('botluyo-v2'));
 if(j&&Array.isArray(j.files)&&j.files[0]&&j.files[0].n==='index.js'){S=j;S.cur=(Number.isInteger(S.cur)&&S.cur>=0&&S.cur<S.files.length)?S.cur:0}}catch(e){}
const SER=Blockly.serialization.workspaces;
const loadF=i=>{const s=S.files[i].s;s?SER.load(s,ws):ws.clear()};
function codeOf(i){
 const st=i===S.cur?SER.save(ws):S.files[i].s,hw=new Blockly.Workspace();if(st)SER.load(st,hw);
 hw.getTopBlocks().forEach(b=>{if(!HATS.has(b.type))b.dispose()});
 const c=gen.workspaceToCode(hw);hw.dispose();
 if(i>0)return '// '+S.files[i].n+' — Botluyo ile oluşturuldu\nmodule.exports = (bot) => {\n'+(HELPERS+'\n\n'+c).replace(/^(?=.)/gm,'  ')+'};\n';
 return ["// index.js — Botluyo ile oluşturuldu",
  "const TopluyoBOT = require('topluyo-bot');",
  "const TOKEN = process.env.TOPLUYO_TOKEN || require('./.token.json');",
  "const bot = TopluyoBOT(TOKEN);",
  "bot._hazir = false;",
  "",
  HELPERS,
  "const _idAl = (r) => { if (r == null) return null; if (typeof r !== 'object') return r; const d = r.data ?? r; return typeof d === 'object' ? (d.id ?? d.user_id ?? null) : d; };",
  "",
  "process.on('unhandledRejection', (e) => console.error('Yakalanmamış hata:', e));",
  "",
  "bot.on('connected', async () => {",
  "  bot._hazir = true;",
  "  console.log('Bot bağlandı ✅');",
  "  try { bot._ben = _idAl(await bot.post('/!api/user/id', {})); } catch (e) { console.warn('Bot ID alınamadı:', e); }",
  "  if (bot._ben == null) console.warn('Bot ID bilinmiyor; \"ben miyim\" bloğu çalışmaz.');",
  "});",
  "bot.on('auth_problem', () => console.error('Token geçersiz! \"Cihazlarım\" bölümünden yenisini alın.'));",
  "bot.on('error', (err) => console.error('Hata:', err));",
  "",
  ...S.files.slice(1).map(f=>"require('./"+f.n+"')(bot);"),
  "",
  c].join('\n')}
function sw(i){S.files[S.cur].s=SER.save(ws);S.cur=i;loadF(i);tabsR();refresh()}
function newFile(){const n=slug((prompt('Dosya adı (örn: yardim-menusu)')||'').replace(/\.js$/i,''));if(!n)return;const fn=n+'.js';
 if(fn==='index.js'||S.files.some(f=>f.n===fn))return toast('Bu ad kullanılıyor');S.files.push({n:fn,s:null});sw(S.files.length-1)}
function delFile(){if(!confirm(S.files[S.cur].n+' silinsin mi?'))return;S.files.splice(S.cur,1);S.cur=0;loadF(0);tabsR();refresh()}
function tabsR(){const t=$('tabs');t.innerHTML='';
 S.files.forEach((f,i)=>{const b=el('button','tab'+(i===S.cur?' on':''),esc(f.n));b.onclick=()=>sw(i);t.append(b)});
 const a=el('button','tab','＋ Dosya');a.onclick=newFile;t.append(a);
 if(S.cur>0){const x=el('button','tab','🗑️');x.onclick=delFile;t.append(x)}}
function refresh(){
 S.files[S.cur].s=SER.save(ws);
 ws.getAllBlocks(false).forEach(b=>{const r=b.getRootBlock(),al=ALLOW[b.type];let m=null;
  if(!HATS.has(r.type))m='Bu blok bir olay bloğunun içinde değil, koda eklenmez.';
  else if(al&&!al.includes(r.type))m='Bu değer sadece şu olaylarda var: '+al.map(a=>EV[a][0]).join(', ');
  if(b._w!==m){b._w=m;b.setWarningText(m)}});
 try{$('code').textContent=codeOf(S.cur)}catch(e){$('code').textContent='// Kod üretilemedi: '+e.message}
 $('tree').innerHTML='📁 <b>bot/</b>'+S.files.map((f,i)=>'<span class="ti'+(i===S.cur?' on':'')+'" data-i="'+i+'">📄 '+esc(f.n)+'</span>').join('')+'<span class="ti dim">📄 package.json</span><span class="ti dim">🔑 .token.json</span><span class="ti dim">📄 .gitignore · README.md</span>';
 $('tree').querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>sw(+x.dataset.i));
 try{localStorage.setItem('botluyo-v2',JSON.stringify(S));qw=0}catch(e){if(!qw){qw=1;toast('⚠️ Otomatik kayıt başarısız (depolama dolu olabilir)',4000)}}}
ws.addChangeListener(e=>{if(e.isUiEvent)return;clearTimeout(rt);rt=setTimeout(refresh,200)});

// ---- ZIP ----
function crc32(b){let c=-1;for(let i=0;i<b.length;i++){c^=b[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1))}return(c^-1)>>>0}
function zip(files){
 const e=new TextEncoder(),parts=[],cd=[];let off=0;
 const h=(...a)=>{const b=new Uint8Array(a.reduce((s,[n])=>s+n,0)),v=new DataView(b.buffer);let o=0;a.forEach(([n,x])=>{n===2?v.setUint16(o,x,true):v.setUint32(o,x,true);o+=n});return b};
 files.forEach(f=>{const nm=e.encode(f.n),dt=e.encode(f.c),c=crc32(dt),L=dt.length;
  parts.push(h([4,0x04034b50],[2,20],[2,0x800],[2,0],[2,0],[2,0x21],[4,c],[4,L],[4,L],[2,nm.length],[2,0]),nm,dt);
  cd.push(h([4,0x02014b50],[2,20],[2,20],[2,0x800],[2,0],[2,0],[2,0x21],[4,c],[4,L],[4,L],[2,nm.length],[2,0],[2,0],[2,0],[2,0],[4,0],[4,off]),nm);
  off+=30+nm.length+L});
 const cs=cd.reduce((s,x)=>s+x.length,0);
 return new Blob([...parts,...cd,h([4,0x06054b50],[2,0],[2,0],[2,files.length],[2,files.length],[4,cs],[4,off],[2,0])],{type:'application/zip'})}
function down(tok){
 const files=[...S.files.map((f,i)=>({n:f.n,c:codeOf(i)})),
  {n:'package.json',c:JSON.stringify({name:'topluyo-bot-projesi',version:'1.0.0',main:'index.js',scripts:{start:'node index.js'},engines:{node:'>=18'},dependencies:{'topluyo-bot':'latest'}},null,2)},
  {n:'.token.json',c:JSON.stringify(tok||'BURAYA_TOKENINIZI_YAZIN')},
  {n:'.gitignore',c:'.token.json\nnode_modules/\n'},
  {n:'README.md',c:'# Topluyo Botum\n\n1. `npm install`\n2. Tokenini `.token.json` içine yaz ("Cihazlarım" bölümünden alınır) ya da `TOPLUYO_TOKEN` ortam değişkenini ayarla\n3. `npm start`\n\nBot hesabının adı `bot` ile başlamalı ya da bitmeli. Node.js 18+ gerekir.\n'}];
 const a=document.createElement('a');a.href=URL.createObjectURL(zip(files));a.download='topluyo-bot.zip';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);$('dlg').close()}
$('export').onclick=()=>$('dlg').showModal();
$('dl').onclick=()=>down();
$('dlt').onclick=()=>{const t=$('tok').value.trim();if(!t)return toast('Önce tokeni gir');down(t);$('tok').value=''};
$('cls').onclick=()=>$('dlg').close();

loadF(S.cur);tabsR();refresh();
