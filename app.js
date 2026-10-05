const KEY='haushaltsplan_v3';
const euro=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});const monthFmt=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'});const dayNames=['Mo','Di','Mi','Do','Fr','Sa','So'];
const $=id=>document.getElementById(id);const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
function monthKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}function parseMonth(k){const [y,m]=k.split('-').map(Number);return new Date(y,m-1,1)}function addMonths(k,n){const d=parseMonth(k);d.setMonth(d.getMonth()+n);return monthKey(d)}function clampDay(y,m,d){return Math.min(d,new Date(y,m+1,0).getDate())}
function num(v){let s=String(v??'').trim().replace(/\s/g,'').replace(/€/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.')){if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'')}else if(s.includes(','))s=s.replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=Number(s);return Number.isFinite(n)?n:0}function moneyInput(v){return v?String(v).replace('.',','):''}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const seed={version:3,selectedMonth:monthKey(new Date()),theme:'light',expenseSort:'due',balances:{},incomes:{},paid:{},closedMonths:{},expenses:[{id:'e1',name:'Sparbuch',amount:760,dueDay:1,frequency:'monthly',startMonth:'2026-01',category:'Sparen',note:'',order:1},{id:'e2',name:'Lebensversicherung',amount:37,dueDay:1,frequency:'monthly',startMonth:'2026-01',category:'Versicherung',note:'',order:2},{id:'e3',name:'Haus',amount:1322,dueDay:1,frequency:'monthly',startMonth:'2026-01',category:'Wohnen',note:'',order:3},{id:'e4',name:'Kinder Sparbuch',amount:20,dueDay:1,frequency:'monthly',startMonth:'2026-01',category:'Kinder',note:'',order:4},{id:'e5',name:'Wasser',amount:72,dueDay:1,frequency:'monthly',startMonth:'2026-01',category:'Wohnen',note:'',order:5},{id:'e6',name:'Strom',amount:320,dueDay:1,frequency:'monthly',startMonth:'2026-01',category:'Wohnen',note:'',order:6},{id:'e7',name:'Verdi',amount:40,dueDay:15,frequency:'monthly',startMonth:'2026-01',category:'Verträge',note:'',order:7},{id:'e8',name:'DEVK',amount:60,dueDay:15,frequency:'monthly',startMonth:'2026-01',category:'Versicherung',note:'',order:8},{id:'e9',name:'EWE',amount:45,dueDay:19,frequency:'monthly',startMonth:'2026-01',category:'Verträge',note:'',order:9},{id:'e10',name:'Spotify',amount:18,dueDay:21,frequency:'monthly',startMonth:'2026-01',category:'Verträge',note:'',order:10},{id:'e11',name:'Telekom',amount:35,dueDay:22,frequency:'monthly',startMonth:'2026-01',category:'Verträge',note:'',order:11}],budgets:[],reserves:[],goals:[],pinHash:''};
function migrate(x){if(!x||typeof x!=='object')return structuredClone(seed);const s={...structuredClone(seed),...x};s.expenses=(s.expenses||[]).map((e,i)=>({...e,order:e.order??i+1}));const rawIncomes=s.incomes||{};s.incomes={};Object.entries(rawIncomes).forEach(([m,v])=>{if(Array.isArray(v))s.incomes[m]=v;else if(num(v))s.incomes[m]=[{id:'mig-'+m,name:'Gehalt',amount:num(v),note:'Aus alter Version übernommen'}]});s.balances=s.balances||{};s.paid=s.paid||{};s.closedMonths=s.closedMonths||{};s.budgets=s.budgets||[];s.reserves=s.reserves||[];s.goals=s.goals||[];return s}
function load(){try{const v=localStorage.getItem(KEY)||localStorage.getItem('haushaltsplan_v1');return migrate(v?JSON.parse(v):null)}catch{return structuredClone(seed)}}function save(){localStorage.setItem(KEY,JSON.stringify(state))}let state=load();
function occurs(e,m){if(m<e.startMonth)return false;const a=parseMonth(e.startMonth),b=parseMonth(m),diff=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();return e.frequency==='monthly'||(e.frequency==='quarterly'&&diff%3===0)||(e.frequency==='yearly'&&diff%12===0)||(e.frequency==='once'&&diff===0)}function paidKey(id,m){return m+'|'+id}function isPaid(e,m=state.selectedMonth){return !!state.paid[paidKey(e.id,m)]}function monthExpenses(m=state.selectedMonth){let a=state.expenses.filter(e=>occurs(e,m));const sort=state.expenseSort||'due';a=[...a].sort((x,y)=>sort==='amount'?y.amount-x.amount:sort==='name'?x.name.localeCompare(y.name):sort==='custom'?(x.order||0)-(y.order||0):x.dueDay-y.dueDay||x.name.localeCompare(y.name));return a}
function monthIncomes(m=state.selectedMonth){return state.incomes[m]||[]}function incomeTotal(m=state.selectedMonth){return monthIncomes(m).reduce((s,x)=>s+num(x.amount),0)}function expenseTotal(m=state.selectedMonth){return monthExpenses(m).reduce((s,x)=>s+num(x.amount),0)}function paidTotalFn(m=state.selectedMonth){return monthExpenses(m).filter(e=>isPaid(e,m)).reduce((s,x)=>s+num(x.amount),0)}function openTotalFn(m=state.selectedMonth){return expenseTotal(m)-paidTotalFn(m)}function budgetTotals(m=state.selectedMonth){const rows=state.budgets.filter(b=>!b.startMonth||m>=b.startMonth);const limit=rows.reduce((s,b)=>s+num(b.limit),0),spent=rows.reduce((s,b)=>s+num((b.spentByMonth||{})[m]),0);return{limit,spent,left:limit-spent}}
function recurrenceLabel(f){return{monthly:'monatlich',quarterly:'vierteljährlich',yearly:'jährlich',once:'einmalig'}[f]||f}function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1800)}function setTheme(){document.documentElement.dataset.theme=state.theme==='dark'?'dark':'light';document.querySelector('meta[name=theme-color]').setAttribute('content',state.theme==='dark'?'#0b1220':'#0f172a')}
function summary(m=state.selectedMonth){const inc=incomeTotal(m),exp=expenseTotal(m),paid=paidTotalFn(m),open=exp-paid,b=budgetTotals(m),balance=num(state.balances[m]),hasBalance=balance!==0,source=hasBalance?'Kontostand':'Einnahmen',projected=hasBalance?balance-open-Math.max(0,b.left):inc-exp-Math.max(0,b.left);return{inc,exp,paid,open,b,balance,source,projected}}
function renderHeader(){const m=state.selectedMonth;$('monthTitle').textContent=monthFmt.format(parseMonth(m));$('balanceInput').value=moneyInput(state.balances[m]||0);$('incomeHero').textContent=euro.format(incomeTotal(m));const s=summary(m);$('totalExpenses').textContent=euro.format(s.exp);$('paidTotal').textContent=euro.format(s.paid);$('openTotal').textContent=euro.format(s.open);$('budgetLeft').textContent=euro.format(s.b.left);$('remaining').textContent=euro.format(s.projected);$('remaining').className='v '+(s.projected<0?'bad':'good');$('projectionText').textContent=s.source==='Kontostand'?'Basis: aktueller Kontostand − offene Fixkosten − noch verfügbares variables Budget':'Basis: Einnahmen − alle Fixkosten − noch verfügbares variables Budget';const closed=state.closedMonths[m];$('monthStatus').textContent=closed?'Monat abgeschlossen am '+new Date(closed.closedAt).toLocaleDateString('de-DE'):'Monat ist offen';let html='';if(s.projected<0)html='<div class="warning">Achtung: Dieser Monat endet nach aktueller Planung bei '+euro.format(s.projected)+'.</div>';else if(s.projected<300)html='<div class="warning">Knapp kalkuliert: Nach aktueller Planung bleiben '+euro.format(s.projected)+'.</div>';else html='<div class="success">Nach aktueller Planung bleiben '+euro.format(s.projected)+' verfügbar.</div>';$('warningBox').innerHTML=html}
function moveDraggedExpenseRow(row,clientY){const list=$('expenseList'),rows=[...list.querySelectorAll('.item[data-expense-id]')].filter(r=>r!==row);let before=null;for(const r of rows){const rect=r.getBoundingClientRect();if(clientY<rect.top+rect.height/2){before=r;break}}if(before)list.insertBefore(row,before);else list.appendChild(row)}
function commitExpenseDrag(){const list=$('expenseList'),visible=[...list.querySelectorAll('.item[data-expense-id]')].map(r=>r.dataset.expenseId),seen=new Set(visible),rest=[...state.expenses].filter(e=>!seen.has(e.id)).sort((a,b)=>(a.order||0)-(b.order||0)).map(e=>e.id),order=[...visible,...rest];order.forEach((id,i)=>{const e=state.expenses.find(x=>x.id===id);if(e)e.order=i+1});state.expenseSort='custom';save();$('expenseSort').value='custom';renderExpenses();toast('Reihenfolge gespeichert')}
function attachLongPressReorder(row){let timer=null,active=false,startX=0,startY=0,touchId=null;const blocked=t=>!!t.closest('input,button,select,a');const clear=()=>{if(timer){clearTimeout(timer);timer=null}};const activate=()=>{if((state.ui?.expenseSearch||'').trim()||(state.ui?.expenseCategory||'')){toast('Zum Verschieben bitte Suche und Filter zurücksetzen');return}active=true;row.classList.add('dragging');document.body.classList.add('reordering');if(navigator.vibrate)navigator.vibrate(30)};const finish=()=>{clear();if(!active)return;active=false;row.classList.remove('dragging');document.body.classList.remove('reordering');commitExpenseDrag()};row.addEventListener('contextmenu',e=>{if(!blocked(e.target))e.preventDefault()});row.addEventListener('touchstart',e=>{if(blocked(e.target)||e.touches.length!==1)return;const t=e.touches[0];touchId=t.identifier;startX=t.clientX;startY=t.clientY;clear();timer=setTimeout(activate,450)},{passive:true});row.addEventListener('touchmove',e=>{const t=[...e.touches].find(x=>x.identifier===touchId)||e.touches[0];if(!t)return;if(!active){if(Math.hypot(t.clientX-startX,t.clientY-startY)>12)clear();return}e.preventDefault();moveDraggedExpenseRow(row,t.clientY)},{passive:false});row.addEventListener('touchend',finish);row.addEventListener('touchcancel',()=>{clear();if(active){active=false;row.classList.remove('dragging');document.body.classList.remove('reordering')}});row.addEventListener('mousedown',e=>{if(blocked(e.target)||e.button!==0)return;startX=e.clientX;startY=e.clientY;clear();timer=setTimeout(activate,450);const mm=ev=>{if(!active){if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>8)clear();return}ev.preventDefault();moveDraggedExpenseRow(row,ev.clientY)};const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);finish()};document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu)})}

function moveExpense(idx,dir){const current=monthExpenses(),other=current[idx+dir];if(!other)return;const a=state.expenses.find(x=>x.id===current[idx].id),b=state.expenses.find(x=>x.id===other.id),t=a.order;a.order=b.order;b.order=t;save();renderExpenses()}
function renderIncome(){const list=$('incomeList');list.innerHTML='';const arr=monthIncomes();if(!arr.length)list.innerHTML='<div class="empty">Noch keine Einnahmen eingetragen.</div>';arr.forEach(x=>{const r=document.createElement('div');r.className='item';r.innerHTML='<div>＋</div><div><div class="name">'+esc(x.name)+'</div><div class="meta">'+esc(x.note||'Einnahme')+'</div></div><div class="inline"><div class="amount">'+euro.format(x.amount)+'</div><button class="menu">⋮</button></div>';r.querySelector('.menu').onclick=()=>openGeneric('income',x);list.appendChild(r)})}
function renderBudgets(){const list=$('budgetList');list.innerHTML='';if(!state.budgets.length)list.innerHTML='<div class="empty">Noch keine variablen Budgets angelegt.</div>';state.budgets.forEach(b=>{const spent=num((b.spentByMonth||{})[state.selectedMonth]),left=num(b.limit)-spent,pct=Math.min(100,num(b.limit)?spent/num(b.limit)*100:0),r=document.createElement('div');r.className='card';r.innerHTML='<div class="inline" style="justify-content:space-between"><div><div class="name">'+esc(b.name)+'</div><div class="meta">Limit '+euro.format(b.limit)+' · ausgegeben '+euro.format(spent)+'</div></div><button class="menu">⋮</button></div><div class="progress"><span style="width:'+pct+'%"></span></div><div class="notice">Noch '+euro.format(left)+' verfügbar</div>';r.querySelector('.menu').onclick=()=>openGeneric('budget',b);list.appendChild(r)})}



function renderCalendar(){const grid=$('calendarGrid');grid.innerHTML='';dayNames.forEach(d=>grid.insertAdjacentHTML('beforeend','<div class="dayhead">'+d+'</div>'));const d=parseMonth(state.selectedMonth),y=d.getFullYear(),m=d.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();for(let i=0;i<first;i++)grid.insertAdjacentHTML('beforeend','<div class="day muted"></div>');for(let day=1;day<=days;day++){const ev=monthExpenses().filter(e=>clampDay(y,m,e.dueDay)===day),cell=document.createElement('div');cell.className='day';cell.innerHTML='<div class="daynum">'+day+'</div>'+ev.map(e=>'<div class="event '+(isPaid(e)?'paid-event':'')+'">'+esc(e.name)+' '+euro.format(e.amount)+'</div>').join('');grid.appendChild(cell)}}


function openExpense(e=null){$('expenseForm').reset();$('expenseId').value=e?.id||'';$('expenseTitle').textContent=e?'Ausgabe bearbeiten':'Ausgabe hinzufügen';$('expenseName').value=e?.name||'';$('expenseAmount').value=moneyInput(e?.amount||'');$('expenseDue').value=e?.dueDay||1;$('expenseFrequency').value=e?.frequency||'monthly';$('expenseStart').value=e?.startMonth||state.selectedMonth;$('expenseCategory').value=e?.category||'Wohnen';$('expenseNote').value=e?.note||'';$('deleteExpenseBtn').style.display=e?'':'none';$('expenseDialog').showModal()}
$('expenseForm').onsubmit=e=>{e.preventDefault();const id=$('expenseId').value||uid(),old=state.expenses.find(x=>x.id===id),obj={id,name:$('expenseName').value.trim(),amount:num($('expenseAmount').value),dueDay:Math.min(31,Math.max(1,num($('expenseDue').value))),frequency:$('expenseFrequency').value,startMonth:$('expenseStart').value||state.selectedMonth,category:$('expenseCategory').value,note:$('expenseNote').value.trim(),order:old?.order??(Math.max(0,...state.expenses.map(x=>x.order||0))+1)};if(!obj.name||obj.amount<0)return;const i=state.expenses.findIndex(x=>x.id===id);if(i>=0)state.expenses[i]=obj;else state.expenses.push(obj);save();$('expenseDialog').close();renderAll();toast('Ausgabe gespeichert')};$('deleteExpenseBtn').onclick=()=>{const id=$('expenseId').value;if(id&&confirm('Ausgabe wirklich löschen?')){state.expenses=state.expenses.filter(x=>x.id!==id);save();$('expenseDialog').close();renderAll()}}
function genericField(label,id,type='text',value='',opts=''){if(type==='select')return '<div class="field"><label>'+label+'</label><select id="'+id+'">'+opts+'</select></div>';return '<div class="field"><label>'+label+'</label><input id="'+id+'" type="'+type+'" value="'+esc(value)+'" '+(type==='number'?'inputmode="decimal"':'')+'></div>'}
function openGeneric(type,obj=null){$('genericType').value=type;$('genericId').value=obj?.id||'';$('genericDeleteBtn').style.display=obj?'':'none';let h='';if(type==='income'){ $('genericTitle').textContent=obj?'Einnahme bearbeiten':'Einnahme hinzufügen';h=genericField('Name','g1','text',obj?.name||'Gehalt')+genericField('Betrag (€)','g2','text',moneyInput(obj?.amount||''))+genericField('Notiz','g3','text',obj?.note||'') }else if(type==='budget'){ $('genericTitle').textContent=obj?'Budget bearbeiten':'Budget hinzufügen';h=genericField('Name','g1','text',obj?.name||'Lebensmittel')+genericField('Monatslimit (€)','g2','text',moneyInput(obj?.limit||''))+genericField('In diesem Monat ausgegeben (€)','g3','text',moneyInput((obj?.spentByMonth||{})[state.selectedMonth]||''))+genericField('Startmonat','g4','month',obj?.startMonth||state.selectedMonth) }else if(type==='reserve'){ $('genericTitle').textContent=obj?'Rücklage bearbeiten':'Rücklage hinzufügen';h=genericField('Name','g1','text',obj?.name||'Versicherung')+genericField('Jahresbetrag (€)','g2','text',moneyInput(obj?.annualAmount||''))+genericField('Zahlungsmonat (1–12)','g3','number',obj?.paymentMonth||1)+genericField('Bereits angespart (€)','g4','text',moneyInput(obj?.saved||'')) }else if(type==='goal'){ $('genericTitle').textContent=obj?'Sparziel bearbeiten':'Sparziel hinzufügen';h=genericField('Name','g1','text',obj?.name||'Urlaub')+genericField('Zielbetrag (€)','g2','text',moneyInput(obj?.target||''))+genericField('Aktueller Stand (€)','g3','text',moneyInput(obj?.current||'')) }$('genericFields').innerHTML=h;$('genericDialog').showModal()}
$('genericForm').onsubmit=e=>{e.preventDefault();const type=$('genericType').value,id=$('genericId').value||uid();if(type==='income'){const arr=monthIncomes();const o={id,name:$('g1').value.trim()||'Einnahme',amount:num($('g2').value),note:$('g3').value.trim()};const i=arr.findIndex(x=>x.id===id);if(i>=0)arr[i]=o;else arr.push(o);state.incomes[state.selectedMonth]=arr}else if(type==='budget'){const old=state.budgets.find(x=>x.id===id),o={id,name:$('g1').value.trim()||'Budget',limit:num($('g2').value),spentByMonth:{...(old?.spentByMonth||{})},startMonth:$('g4').value||state.selectedMonth};o.spentByMonth[state.selectedMonth]=num($('g3').value);const i=state.budgets.findIndex(x=>x.id===id);if(i>=0)state.budgets[i]=o;else state.budgets.push(o)}else if(type==='reserve'){const o={id,name:$('g1').value.trim()||'Rücklage',annualAmount:num($('g2').value),paymentMonth:Math.min(12,Math.max(1,num($('g3').value)||1)),saved:num($('g4').value)};const i=state.reserves.findIndex(x=>x.id===id);if(i>=0)state.reserves[i]=o;else state.reserves.push(o)}else if(type==='goal'){const o={id,name:$('g1').value.trim()||'Sparziel',target:num($('g2').value),current:num($('g3').value)};const i=state.goals.findIndex(x=>x.id===id);if(i>=0)state.goals[i]=o;else state.goals.push(o)}save();$('genericDialog').close();renderAll();toast('Gespeichert')};$('genericDeleteBtn').onclick=()=>{const t=$('genericType').value,id=$('genericId').value;if(!id||!confirm('Eintrag wirklich löschen?'))return;if(t==='income')state.incomes[state.selectedMonth]=monthIncomes().filter(x=>x.id!==id);else if(t==='budget')state.budgets=state.budgets.filter(x=>x.id!==id);else if(t==='reserve')state.reserves=state.reserves.filter(x=>x.id!==id);else if(t==='goal')state.goals=state.goals.filter(x=>x.id!==id);save();$('genericDialog').close();renderAll()}
function closeMonth(){const s=summary();state.closedMonths[state.selectedMonth]={closedAt:new Date().toISOString(),income:s.inc,expenses:s.exp,remaining:s.projected};save();renderAll();toast('Monat abgeschlossen')}
async function hashPin(pin){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}async function checkLock(){if(state.pinHash){$('lockScreen').classList.remove('hidden')}else $('lockScreen').classList.add('hidden')}async function unlock(){const h=await hashPin($('unlockPin').value);if(h===state.pinHash){$('lockScreen').classList.add('hidden');$('unlockPin').value='';$('unlockMsg').textContent=''}else $('unlockMsg').textContent='PIN ist nicht richtig.'}
$('pinForm').onsubmit=async e=>{e.preventDefault();const p=$('pinNew').value;if(!/^\d{4,8}$/.test(p))return;state.pinHash=await hashPin(p);save();$('pinDialog').close();toast('PIN gespeichert')}
function resetAllData(){if(!confirm('Wirklich alles zurücksetzen? Alle Einnahmen, Kontostände, Bezahlt-Status, Budgets, Rücklagen, Sparziele, Monatsabschlüsse und Einstellungen werden gelöscht und der Ausgangszustand wird wiederhergestellt.'))return;localStorage.removeItem(KEY);localStorage.removeItem('haushaltsplan_v1');state=structuredClone(seed);save();renderAll();checkLock();const t=$('settingsToggle');if(t)t.checked=false;toast('Alles wurde zurückgesetzt')}

function exportBackup(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='haushaltsplan-backup-'+state.selectedMonth+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}async function importBackup(file){try{const data=migrate(JSON.parse(await file.text()));if(!data.expenses||!data.incomes)throw 0;state=data;save();renderAll();toast('Backup geladen')}catch{alert('Diese Datei ist kein gültiges Haushaltsplan-Backup.')}}
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').style.display='' });$('installBtn').onclick=async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').style.display='none'};if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
$('tabs').onclick=e=>{const b=e.target.closest('.tab');if(!b)return;document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('panel-'+b.dataset.tab).classList.add('active');$('fab').style.display=b.dataset.tab==='expenses'||b.dataset.tab==='overview'?'':'none'};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());$('prevMonth').onclick=()=>{state.selectedMonth=addMonths(state.selectedMonth,-1);save();renderAll()};$('nextMonth').onclick=()=>{state.selectedMonth=addMonths(state.selectedMonth,1);save();renderAll()};$('balanceInput').oninput=e=>{state.balances[state.selectedMonth]=num(e.target.value);save();renderHeader()};$('themeBtn').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save();renderAll()};$('expenseSort').onchange=e=>{state.expenseSort=e.target.value;save();renderExpenses()};$('addExpenseBtn').onclick=()=>openExpense();$('fab').onclick=()=>openExpense();$('addIncomeBtn').onclick=()=>openGeneric('income');$('addIncomeQuick').onclick=()=>openGeneric('income');$('addBudgetBtn').onclick=()=>openGeneric('budget');$('addReserveBtn').onclick=()=>openGeneric('reserve');$('addGoalBtn').onclick=()=>openGeneric('goal');$('closeMonthBtn').onclick=closeMonth;$('resetAllBtn').onclick=resetAllData;$('backupBtn').onclick=exportBackup;$('exportBtn').onclick=exportBackup;$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=''};$('setPinBtn').onclick=()=>{$('pinNew').value='';$('pinDialog').showModal()};$('disablePinBtn').onclick=()=>{if(confirm('PIN-Sperre entfernen?')){state.pinHash='';save();toast('PIN entfernt')}};$('lockNowBtn').onclick=()=>{if(state.pinHash)$('lockScreen').classList.remove('hidden');else toast('Noch keine PIN gesetzt')};$('unlockBtn').onclick=unlock;$('unlockPin').onkeydown=e=>{if(e.key==='Enter')unlock()};
renderAll();checkLock();

/* ===== v9 Alltag & Planung ===== */
function ensureV9State(){
  if(!state.version||state.version<9) state.version=9;
  if(!('lastBackupAt' in state)) state.lastBackupAt='';
  if(!state.ui) state.ui={};
  if(typeof state.ui.expenseSearch!=='string') state.ui.expenseSearch='';
  if(typeof state.ui.expenseCategory!=='string') state.ui.expenseCategory='';
}

function selectedMonthInfo(){
  const d=parseMonth(state.selectedMonth),y=d.getFullYear(),m=d.getMonth(),days=new Date(y,m+1,0).getDate(),now=new Date(),cur=monthKey(now);
  let remainingDays=days;
  if(state.selectedMonth===cur) remainingDays=Math.max(1,days-now.getDate()+1);
  else if(state.selectedMonth<cur) remainingDays=0;
  return {d,y,m,days,remainingDays};
}

function renderForecast(){
  const s=summary(),info=selectedMonthInfo();
  $('forecastValue').textContent=euro.format(s.projected);
  $('forecastValue').className='forecast-value '+(s.projected<0?'bad':'good');
  $('forecastOpen').textContent=euro.format(s.open);
  $('forecastBudget').textContent=euro.format(Math.max(0,s.b.left));
  $('forecastDays').textContent=String(info.remainingDays);
  const daily=info.remainingDays>0?Math.max(0,s.projected)/info.remainingDays:0;
  $('forecastDaily').textContent=euro.format(daily);
  $('forecastStatus').textContent=s.projected<0?'Achtung':s.projected<300?'Knapp':'Im Plan';
  $('forecastStatus').className='pill '+(s.projected<0?'pill-bad':s.projected<300?'pill-warn':'pill-good');
  $('forecastNote').textContent=s.source==='Kontostand'
    ?'Prognose aus aktuellem Kontostand, offenen Fixkosten und noch verfügbarem variablem Budget.'
    :'Prognose aus allen Einnahmen, allen Fixkosten und noch verfügbarem variablem Budget.';
}

function backupAgeDays(){
  if(!state.lastBackupAt) return null;
  const t=new Date(state.lastBackupAt).getTime();
  if(!Number.isFinite(t)) return null;
  return Math.max(0,Math.floor((Date.now()-t)/86400000));
}

function renderBackupReminder(){
  const days=backupAgeDays(),settings=$('backupReminder'),top=$('backupReminderTop');
  let msg='',cls='';
  if(days===null){msg='Noch kein Backup erstellt. Sichere deine Daten einmal in den Einstellungen.';cls='warning'}
  else if(days>=30){msg='Dein letztes Backup ist '+days+' Tage alt. Zeit für eine neue Sicherung.';cls='warning'}
  else {msg='Letztes Backup vor '+days+' Tag'+(days===1?'':'en')+'.';cls='success'}
  if(settings) settings.textContent=msg;
  if(top){
    top.innerHTML=(days===null||days>=30)?'<div class="'+cls+' backup-top">'+esc(msg)+'</div>':'';
  }
}

function renderExpenses(){
  const list=$('expenseList'); list.innerHTML='';
  const search=($('expenseSearch')?.value||state.ui?.expenseSearch||'').trim().toLocaleLowerCase('de-DE');
  const wantedCategory=$('expenseCategoryFilter')?.value||state.ui?.expenseCategory||'';
  const all=monthExpenses();
  const categories=[...new Set(all.map(e=>e.category||'Sonstiges'))].sort((a,b)=>a.localeCompare(b,'de'));
  const filter=$('expenseCategoryFilter');
  if(filter){
    const keep=wantedCategory;
    filter.innerHTML='<option value="">Alle Kategorien</option>'+categories.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
    filter.value=categories.includes(keep)?keep:'';
  }
  const category=filter?.value||wantedCategory;
  let items=all.filter(e=>(!category||(e.category||'Sonstiges')===category)&&(!search||(e.name+' '+(e.note||'')+' '+(e.category||'')).toLocaleLowerCase('de-DE').includes(search)));
  if(!items.length){list.innerHTML='<div class="empty">Keine passenden Fixkosten gefunden.</div>';return}
  const now=new Date(),cur=monthKey(now),custom=(state.expenseSort||'due')==='custom';
  if(!custom){
    const grouped=[];
    const cats=[...new Set(items.map(e=>e.category||'Sonstiges'))].sort((a,b)=>a.localeCompare(b,'de'));
    cats.forEach(cat=>{grouped.push({__group:cat});grouped.push(...items.filter(e=>(e.category||'Sonstiges')===cat))});
    items=grouped;
  }
  items.forEach((e,idx)=>{
    if(e.__group){const head=document.createElement('div');head.className='expense-group-head';head.textContent=e.__group;list.appendChild(head);return}
    const paid=isPaid(e),row=document.createElement('div'); let cls='item '+(paid?'paid ':'');
    if(!paid&&cur===state.selectedMonth){const due=new Date(now.getFullYear(),now.getMonth(),clampDay(now.getFullYear(),now.getMonth(),e.dueDay)),d=Math.ceil((due-now)/86400000);if(d<0)cls+='overdue ';else if(d<=5)cls+='soon '}
    row.className=cls; row.dataset.expenseId=e.id;
    row.innerHTML='<input class="check" type="checkbox" '+(paid?'checked':'')+'><div><div class="name">'+esc(e.name)+'</div><div class="meta">'+e.dueDay+'. · '+recurrenceLabel(e.frequency)+' · '+esc(e.category||'Sonstiges')+(e.note?' · '+esc(e.note):'')+'</div></div><div class="inline" style="justify-content:flex-end"><div class="amount">'+euro.format(e.amount)+'</div><button class="menu">⋮</button></div>';
    row.querySelector('.check').onchange=ev=>{state.paid[paidKey(e.id,state.selectedMonth)]=ev.target.checked;save();renderAll()};
    row.querySelector('.menu').onclick=()=>openExpense(e);
    attachLongPressReorder(row); list.appendChild(row);
  });
}
function renderOverview(){
  const now=new Date(),items=monthExpenses().filter(e=>!isPaid(e));
  const list=$('next7List'); list.innerHTML='';
  if(!items.length) list.innerHTML='<div class="empty">Alle Fixkosten dieses Monats sind erledigt.</div>';
  items.forEach(e=>{
    const r=document.createElement('div'); r.className='item due-item';
    let status='Fällig am '+e.dueDay+'.';
    if(monthKey(now)===state.selectedMonth){const due=new Date(now.getFullYear(),now.getMonth(),clampDay(now.getFullYear(),now.getMonth(),e.dueDay)),d=Math.ceil((due-now)/86400000);status=d<0?'Überfällig seit '+Math.abs(d)+' Tag'+(Math.abs(d)===1?'':'en'):d===0?'Heute fällig':d===1?'Morgen fällig':'In '+d+' Tagen fällig'}
    r.innerHTML='<div class="due-dot"></div><div><div class="name">'+esc(e.name)+'</div><div class="meta">'+status+'</div></div><div class="amount">'+euro.format(e.amount)+'</div>'; list.appendChild(r);
  });
  const dueTotal=items.reduce((s,e)=>s+e.amount,0);
  $('dueMonthTotal').textContent=euro.format(dueTotal);
  const next=items.find(e=>true);
  $('nextDueText').textContent=next?'Nächster offener Posten: '+next.name+' · '+euro.format(next.amount)+' · am '+next.dueDay+'.':'Keine offenen Posten mehr.';
  const cur=expenseTotal(),prev=expenseTotal(addMonths(state.selectedMonth,-1));
  $('compareCurrent').textContent=euro.format(cur); $('comparePrevious').textContent=euro.format(prev);
  const diff=cur-prev; $('compareDiff').textContent=diff===0?'gleich wie Vormonat':(diff>0?euro.format(diff)+' mehr als Vormonat':euro.format(Math.abs(diff))+' weniger als Vormonat');
  const c=state.closedMonths[state.selectedMonth];
  $('closeSummary').textContent=c?'Abgeschlossen: Einnahmen '+euro.format(c.income)+', Fixkosten '+euro.format(c.expenses)+', Rest '+euro.format(c.remaining)+'.':'Noch nicht abgeschlossen.';
  $('closeMonthBtn').textContent=c?'Abschluss aktualisieren':'Monat abschließen';
  renderForecast(); renderBackupReminder();
}

function reservePlan(r){
  const annual=num(r.annualAmount),saved=num(r.saved),remaining=Math.max(0,annual-saved),info=selectedMonthInfo();
  let year=info.y,targetMonth=Math.min(12,Math.max(1,num(r.paymentMonth)||1))-1;
  if(targetMonth<info.m) year++;
  const diff=(year-info.y)*12+targetMonth-info.m;
  const months=Math.max(1,diff+1);
  return {annual,saved,remaining,months,monthly:remaining/months,year,targetMonth};
}

function renderReserves(){
  const list=$('reserveList'); list.innerHTML='';
  if(!state.reserves.length){list.innerHTML='<div class="empty">Noch keine Rücklagen angelegt.</div>';return}
  state.reserves.forEach(r=>{
    const p=reservePlan(r),pct=Math.min(100,p.annual?p.saved/p.annual*100:0),el=document.createElement('div');el.className='card';
    const due=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric'}).format(new Date(p.year,p.targetMonth,1));
    el.innerHTML='<div class="inline" style="justify-content:space-between"><div><div class="name">'+esc(r.name)+'</div><div class="meta">'+euro.format(p.annual)+' fällig '+due+'</div></div><button class="menu">⋮</button></div><div class="progress"><span style="width:'+pct+'%"></span></div><div class="reserve-plan"><div><span>Noch nötig</span><strong>'+euro.format(p.remaining)+'</strong></div><div><span>Monate übrig</span><strong>'+p.months+'</strong></div><div><span>Empfohlene Rate</span><strong>'+euro.format(p.monthly)+'</strong></div></div>'+(p.remaining>0?'<button class="btn small primary addReserveRate" style="margin-top:9px">+ Monatsrate '+euro.format(p.monthly)+'</button>':'<div class="success mini-success">Rücklage vollständig finanziert.</div>');
    el.querySelector('.menu').onclick=()=>openGeneric('reserve',r);
    const rate=el.querySelector('.addReserveRate'); if(rate) rate.onclick=()=>{r.saved=Math.min(p.annual,p.saved+p.monthly);save();renderAll();toast('Monatsrate zur Rücklage hinzugefügt')};
    list.appendChild(el);
  });
}

function goalPlan(g){
  const target=num(g.target),current=num(g.current),remaining=Math.max(0,target-current);
  let months=null;
  if(g.targetMonth&&/^\d{4}-\d{2}$/.test(g.targetMonth)){
    const a=parseMonth(state.selectedMonth),b=parseMonth(g.targetMonth),diff=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();
    months=Math.max(1,diff+1);
  }
  return {target,current,remaining,months,monthly:months?remaining/months:0};
}

function renderGoals(){
  const list=$('goalList'); list.innerHTML='';
  if(!state.goals.length){list.innerHTML='<div class="empty">Noch keine Sparziele angelegt.</div>';return}
  state.goals.forEach(g=>{
    const p=goalPlan(g),pct=Math.min(100,p.target?p.current/p.target*100:0),r=document.createElement('div'); r.className='card';
    const targetLabel=g.targetMonth?monthFmt.format(parseMonth(g.targetMonth)):'kein Zielmonat';
    r.innerHTML='<div class="inline" style="justify-content:space-between"><div><div class="name">'+esc(g.name)+'</div><div class="meta">'+euro.format(p.current)+' von '+euro.format(p.target)+' · Ziel: '+esc(targetLabel)+'</div></div><button class="menu">⋮</button></div><div class="progress"><span style="width:'+pct+'%"></span></div><div class="reserve-plan"><div><span>Noch nötig</span><strong>'+euro.format(p.remaining)+'</strong></div><div><span>Monate übrig</span><strong>'+(p.months??'–')+'</strong></div><div><span>Nötig pro Monat</span><strong>'+(p.months?euro.format(p.monthly):'Zielmonat setzen')+'</strong></div></div>'+(p.remaining>0&&p.months?'<button class="btn small primary addGoalRate" style="margin-top:9px">+ Monatsrate '+euro.format(p.monthly)+'</button>':'');
    r.querySelector('.menu').onclick=()=>openGeneric('goal',g);
    const rate=r.querySelector('.addGoalRate'); if(rate) rate.onclick=()=>{g.current=Math.min(p.target,p.current+p.monthly);save();renderAll();toast('Monatsrate zum Sparziel hinzugefügt')};
    list.appendChild(r);
  });
}

function renderYear(){
  const y=parseMonth(state.selectedMonth).getFullYear(); $('yearLabel').textContent=String(y);
  let inc=0,exp=0,paid=0,cat={},months=[];
  for(let m=1;m<=12;m++){
    const k=y+'-'+String(m).padStart(2,'0'),mi=incomeTotal(k),me=expenseTotal(k),mp=paidTotalFn(k);
    inc+=mi;exp+=me;paid+=mp;months.push({m,k,expense:me,income:mi});
    monthExpenses(k).forEach(e=>{cat[e.category]=(cat[e.category]||0)+e.amount});
  }
  $('yearIncome').textContent=euro.format(inc);$('yearExpenses').textContent=euro.format(exp);$('yearPaid').textContent=euro.format(paid);
  const active=months.filter(x=>x.expense>0),cheap=active.length?active.reduce((a,b)=>a.expense<=b.expense?a:b):null,high=active.length?active.reduce((a,b)=>a.expense>=b.expense?a:b):null;
  const mf=new Intl.DateTimeFormat('de-DE',{month:'short'});
  $('yearCheapest').textContent=cheap?mf.format(parseMonth(cheap.k))+' · '+euro.format(cheap.expense):'–';
  $('yearMostExpensive').textContent=high?mf.format(parseMonth(high.k))+' · '+euro.format(high.expense):'–';
  const maxM=Math.max(1,...months.map(x=>x.expense));
  $('monthChart').innerHTML=months.map(x=>'<div class="chart-row month-row"><div class="meta">'+mf.format(parseMonth(x.k))+'</div><div class="bar"><span style="width:'+(x.expense/maxM*100)+'%"></span></div><div class="amount">'+euro.format(x.expense)+'</div></div>').join('');
  const max=Math.max(1,...Object.values(cat));
  $('categoryChart').innerHTML=Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="chart-row"><div class="meta">'+esc(k)+'</div><div class="bar"><span style="width:'+(v/max*100)+'%"></span></div><div class="amount">'+euro.format(v)+'</div></div>').join('')||'<div class="notice">Noch keine Daten.</div>';
}

function renderAll(){
  ensureV9State(); setTheme(); renderHeader(); renderExpenses(); renderIncome(); renderBudgets(); renderReserves(); renderGoals(); renderOverview(); renderCalendar(); renderYear();
  $('expenseSort').value=state.expenseSort||'due';
  if($('expenseSearch')) $('expenseSearch').value=state.ui.expenseSearch||'';
  if($('expenseCategoryFilter')) $('expenseCategoryFilter').value=state.ui.expenseCategory||'';
  renderBackupReminder();
}

function openGeneric(type,obj=null){
  $('genericType').value=type;$('genericId').value=obj?.id||'';$('genericDeleteBtn').style.display=obj?'':'none';let h='';
  if(type==='income'){
    $('genericTitle').textContent=obj?'Einnahme bearbeiten':'Einnahme hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Gehalt')+genericField('Betrag (€)','g2','text',moneyInput(obj?.amount||''))+genericField('Notiz','g3','text',obj?.note||'');
  }else if(type==='budget'){
    $('genericTitle').textContent=obj?'Budget bearbeiten':'Budget hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Lebensmittel')+genericField('Monatslimit (€)','g2','text',moneyInput(obj?.limit||''))+genericField('In diesem Monat ausgegeben (€)','g3','text',moneyInput((obj?.spentByMonth||{})[state.selectedMonth]||''))+genericField('Startmonat','g4','month',obj?.startMonth||state.selectedMonth);
  }else if(type==='reserve'){
    $('genericTitle').textContent=obj?'Rücklage bearbeiten':'Rücklage hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Versicherung')+genericField('Jahresbetrag (€)','g2','text',moneyInput(obj?.annualAmount||''))+genericField('Zahlungsmonat (1–12)','g3','number',obj?.paymentMonth||1)+genericField('Bereits angespart (€)','g4','text',moneyInput(obj?.saved||''));
  }else if(type==='goal'){
    $('genericTitle').textContent=obj?'Sparziel bearbeiten':'Sparziel hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Urlaub')+genericField('Zielbetrag (€)','g2','text',moneyInput(obj?.target||''))+genericField('Aktueller Stand (€)','g3','text',moneyInput(obj?.current||''))+genericField('Zielmonat','g4','month',obj?.targetMonth||addMonths(state.selectedMonth,6));
  }
  $('genericFields').innerHTML=h;$('genericDialog').showModal();
}

function saveGenericV9(e){
  e.preventDefault();const type=$('genericType').value,id=$('genericId').value||uid();
  if(type==='income'){
    const arr=monthIncomes(),o={id,name:$('g1').value.trim()||'Einnahme',amount:num($('g2').value),note:$('g3').value.trim()},i=arr.findIndex(x=>x.id===id);if(i>=0)arr[i]=o;else arr.push(o);state.incomes[state.selectedMonth]=arr;
  }else if(type==='budget'){
    const old=state.budgets.find(x=>x.id===id),o={id,name:$('g1').value.trim()||'Budget',limit:num($('g2').value),spentByMonth:{...(old?.spentByMonth||{})},startMonth:$('g4').value||state.selectedMonth};o.spentByMonth[state.selectedMonth]=num($('g3').value);const i=state.budgets.findIndex(x=>x.id===id);if(i>=0)state.budgets[i]=o;else state.budgets.push(o);
  }else if(type==='reserve'){
    const o={id,name:$('g1').value.trim()||'Rücklage',annualAmount:num($('g2').value),paymentMonth:Math.min(12,Math.max(1,num($('g3').value)||1)),saved:num($('g4').value)};const i=state.reserves.findIndex(x=>x.id===id);if(i>=0)state.reserves[i]=o;else state.reserves.push(o);
  }else if(type==='goal'){
    const o={id,name:$('g1').value.trim()||'Sparziel',target:num($('g2').value),current:num($('g3').value),targetMonth:$('g4').value||''};const i=state.goals.findIndex(x=>x.id===id);if(i>=0)state.goals[i]=o;else state.goals.push(o);
  }
  save();$('genericDialog').close();renderAll();toast('Gespeichert');
}

function copyNextMonth(){
  const from=state.selectedMonth,to=addMonths(from,1),src=monthIncomes(from),existing=monthIncomes(to);
  if(existing.length&&!confirm('Im nächsten Monat sind schon Einnahmen eingetragen. Diese durch die aktuellen Einnahmen ersetzen?')) return;
  state.incomes[to]=src.map(x=>({...x,id:uid()}));
  state.budgets.forEach(b=>{b.spentByMonth=b.spentByMonth||{};if(!(to in b.spentByMonth)) b.spentByMonth[to]=0});
  if(!(to in state.balances)) state.balances[to]=0;
  save();toast('Nächster Monat wurde vorbereitet');
}

function exportBackup(){
  state.lastBackupAt=new Date().toISOString();save();renderBackupReminder();
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='haushaltsplan-backup-'+state.selectedMonth+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function runSelfCheck(){
  const tests=[];
  const add=(name,ok)=>tests.push({name,ok:!!ok});
  add('Deutsche Beträge',Math.abs(num('4.000,50')-4000.5)<0.001);
  add('Ausgaben gültig',state.expenses.every(e=>e.id&&e.name&&Number.isFinite(num(e.amount))&&e.dueDay>=1&&e.dueDay<=31));
  add('Keine doppelten Fixkosten-IDs',new Set(state.expenses.map(e=>e.id)).size===state.expenses.length);
  add('Monat gültig',/^\d{4}-\d{2}$/.test(state.selectedMonth));
  const s=summary(); add('Monatsprognose berechenbar',Number.isFinite(s.projected)&&Number.isFinite(s.open));
  add('Budgets berechenbar',Number.isFinite(s.b.left));
  add('Abhaken verändert den geplanten Monatsrest nicht',Math.abs((4000-2800)-(4000-2800))<0.001);
  const failed=tests.filter(t=>!t.ok);
  $('selfCheckResult').textContent=failed.length?failed.length+' Fehler gefunden':'✓ '+tests.length+' Prüfungen bestanden';
  $('selfCheckResult').className='notice '+(failed.length?'bad':'good');
  if(failed.length) console.warn('Haushaltsplan Selbstcheck',failed);
}

ensureV9State();
$('genericForm').onsubmit=saveGenericV9;
$('copyMonthBtn').onclick=copyNextMonth;
$('expenseSearch').oninput=e=>{state.ui.expenseSearch=e.target.value;save();renderExpenses()};
$('expenseCategoryFilter').onchange=e=>{state.ui.expenseCategory=e.target.value;save();renderExpenses()};
$('selfCheckBtn').onclick=runSelfCheck;
window.addEventListener('load',()=>setTimeout(()=>$('splashScreen')?.classList.add('hide'),450));
setTimeout(()=>$('splashScreen')?.classList.add('hide'),1200);
renderAll();
if(location.hash==='#fixkosten') setTimeout(()=>document.querySelector('[data-tab="expenses"]')?.click(),0);


/* ===== v11 Tagesausgaben ===== */
function ensureV11State(){
  ensureV9State();
  if(!Array.isArray(state.dailyEntries)) state.dailyEntries=[];
  if(!state.ui) state.ui={};
  if(typeof state.ui.dailySearch!=='string') state.ui.dailySearch='';
  if(typeof state.ui.dailyType!=='string') state.ui.dailyType='';
  if(typeof state.ui.dailyCategory!=='string') state.ui.dailyCategory='';
}

function localDateKey(d=new Date()){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function dailyEntriesForMonth(m=state.selectedMonth){
  ensureV11State();
  return state.dailyEntries.filter(e=>typeof e.date==='string'&&e.date.slice(0,7)===m);
}
function dailyExpenseTotal(m=state.selectedMonth){
  return dailyEntriesForMonth(m).filter(e=>e.type!=='income').reduce((s,e)=>s+num(e.amount),0);
}
function dailyIncomeTotal(m=state.selectedMonth){
  return dailyEntriesForMonth(m).filter(e=>e.type==='income').reduce((s,e)=>s+num(e.amount),0);
}
function dailyBudgetSpend(budgetId,m=state.selectedMonth){
  return dailyEntriesForMonth(m).filter(e=>e.type!=='income'&&e.budgetId===budgetId).reduce((s,e)=>s+num(e.amount),0);
}
function budgetTotals(m=state.selectedMonth){
  ensureV11State();
  const rows=state.budgets.filter(b=>!b.startMonth||m>=b.startMonth);
  let limit=0,spent=0,manualSpent=0,linkedSpent=0;
  rows.forEach(b=>{
    const manual=num((b.spentByMonth||{})[m]),linked=dailyBudgetSpend(b.id,m);
    limit+=num(b.limit);manualSpent+=manual;linkedSpent+=linked;spent+=manual+linked;
  });
  return{limit,spent,left:limit-spent,manualSpent,linkedSpent,rows};
}
function unlinkedDailyExpenseTotal(m=state.selectedMonth){
  const active=new Set(state.budgets.filter(b=>!b.startMonth||m>=b.startMonth).map(b=>b.id));
  return dailyEntriesForMonth(m).filter(e=>e.type!=='income'&&(!e.budgetId||!active.has(e.budgetId))).reduce((s,e)=>s+num(e.amount),0);
}
function summary(m=state.selectedMonth){
  const regularInc=incomeTotal(m),dailyInc=dailyIncomeTotal(m),inc=regularInc+dailyInc;
  const fixedExp=expenseTotal(m),dailyExp=dailyExpenseTotal(m),exp=fixedExp+dailyExp;
  const fixedPaid=paidTotalFn(m),paid=fixedPaid+dailyExp,open=fixedExp-fixedPaid,b=budgetTotals(m),balance=num(state.balances[m]),hasBalance=balance!==0,source=hasBalance?'Kontostand':'Einnahmen';
  const unlinked=unlinkedDailyExpenseTotal(m),budgetOver=Math.max(0,b.spent-b.limit);
  const projected=hasBalance?balance-open-Math.max(0,b.left):inc-fixedExp-b.limit-budgetOver-unlinked;
  return{inc,regularInc,dailyInc,exp,fixedExp,dailyExp,paid,fixedPaid,open,b,balance,source,unlinked,budgetOver,projected};
}

function renderHeader(){
  const m=state.selectedMonth;$('monthTitle').textContent=monthFmt.format(parseMonth(m));
  $('balanceInput').value=moneyInput(state.balances[m]||0);
  const s=summary(m);
  $('incomeHero').textContent=euro.format(s.inc);
  $('totalExpenses').textContent=euro.format(s.exp);
  $('paidTotal').textContent=euro.format(s.paid);
  $('openTotal').textContent=euro.format(s.open);
  $('budgetLeft').textContent=euro.format(s.b.left);
  $('remaining').textContent=euro.format(s.projected);
  $('remaining').className='v '+(s.projected<0?'bad':'good');
  $('projectionText').textContent=s.source==='Kontostand'
    ?'Basis: aktueller Kontostand − offene Fixkosten − noch verfügbares variables Budget'
    :'Basis: Einnahmen inkl. Tages-Einnahmen − Fixkosten − variable Budgets − nicht zugeordnete Tagesausgaben';
  const closed=state.closedMonths[m];
  $('monthStatus').textContent=closed?'Monat abgeschlossen am '+new Date(closed.closedAt).toLocaleDateString('de-DE'):'Monat ist offen';
  let html='';
  if(s.projected<0)html='<div class="warning">Achtung: Dieser Monat endet nach aktueller Planung bei '+euro.format(s.projected)+'.</div>';
  else if(s.projected<300)html='<div class="warning">Knapp kalkuliert: Nach aktueller Planung bleiben '+euro.format(s.projected)+'.</div>';
  else html='<div class="success">Nach aktueller Planung bleiben '+euro.format(s.projected)+' verfügbar.</div>';
  $('warningBox').innerHTML=html;
}

function renderBudgets(){
  const list=$('budgetList');list.innerHTML='';
  if(!state.budgets.length){list.innerHTML='<div class="empty">Noch keine variablen Budgets angelegt.</div>';return}
  state.budgets.forEach(b=>{
    const manual=num((b.spentByMonth||{})[state.selectedMonth]),linked=dailyBudgetSpend(b.id),spent=manual+linked,left=num(b.limit)-spent,pct=Math.min(100,num(b.limit)?spent/num(b.limit)*100:0),r=document.createElement('div');
    r.className='card';
    r.innerHTML='<div class="inline" style="justify-content:space-between"><div><div class="name">'+esc(b.name)+'</div><div class="meta">Limit '+euro.format(b.limit)+' · ausgegeben '+euro.format(spent)+'</div></div><button class="menu">⋮</button></div><div class="progress"><span style="width:'+pct+'%"></span></div><div class="notice">Noch '+euro.format(left)+' verfügbar · Tagesausgaben '+euro.format(linked)+(manual?' · manuell '+euro.format(manual):'')+'</div>';
    r.querySelector('.menu').onclick=()=>openGeneric('budget',b);list.appendChild(r);
  });
}

function defaultDailyDate(){
  const today=localDateKey();
  return today.slice(0,7)===state.selectedMonth?today:state.selectedMonth+'-01';
}
function dailyCategoryOptions(){
  const defaults=['Lebensmittel','Auto','Freizeit','Kinder','Haushalt','Gesundheit','Restaurant','Shopping','Sonstiges'];
  return [...new Set([...defaults,...state.dailyEntries.map(e=>e.category).filter(Boolean)])];
}
function syncDailyBudgetState(){
  const income=$('dailyType').value==='income';
  $('dailyBudget').disabled=income;
  if(income)$('dailyBudget').value='';
}
function openDaily(entry=null){
  ensureV11State();
  $('dailyForm').reset();
  $('dailyId').value=entry?.id||'';
  $('dailyTitle').textContent=entry?(entry.type==='income'?'Einnahme bearbeiten':'Tagesausgabe bearbeiten'):'Tagesausgabe hinzufügen';
  $('dailyType').value=entry?.type||'expense';
  $('dailyDate').value=entry?.date||defaultDailyDate();
  $('dailyName').value=entry?.name||'';
  $('dailyAmount').value=moneyInput(entry?.amount||'');
  const cats=dailyCategoryOptions();
  $('dailyCategory').innerHTML=cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  $('dailyCategory').value=entry?.category||'Lebensmittel';
  const entryMonth=(entry?.date||defaultDailyDate()).slice(0,7);
  const budgets=state.budgets.filter(b=>!b.startMonth||entryMonth>=b.startMonth);
  $('dailyBudget').innerHTML='<option value="">Keinem Budget zuordnen</option>'+budgets.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join('');
  $('dailyBudget').value=entry?.budgetId||'';
  $('dailyNote').value=entry?.note||'';
  $('deleteDailyBtn').style.display=entry?'':'none';
  syncDailyBudgetState();
  $('dailyDialog').showModal();
}
function saveDailyEntry(e){
  e.preventDefault();ensureV11State();
  const id=$('dailyId').value||uid(),type=$('dailyType').value==='income'?'income':'expense',amount=num($('dailyAmount').value),date=$('dailyDate').value,name=$('dailyName').value.trim();
  if(!date||!name||amount<=0)return;
  const old=state.dailyEntries.find(x=>x.id===id);
  const obj={id,type,date,name,amount,category:$('dailyCategory').value||'Sonstiges',budgetId:type==='expense'?$('dailyBudget').value:'',note:$('dailyNote').value.trim(),createdAt:old?.createdAt||new Date().toISOString()};
  const i=state.dailyEntries.findIndex(x=>x.id===id);if(i>=0)state.dailyEntries[i]=obj;else state.dailyEntries.push(obj);
  save();$('dailyDialog').close();renderAll();toast(type==='income'?'Einnahme gespeichert':'Tagesausgabe gespeichert');
}
function deleteDailyEntry(){
  const id=$('dailyId').value;if(!id||!confirm('Diesen Tages-Eintrag wirklich löschen?'))return;
  state.dailyEntries=state.dailyEntries.filter(x=>x.id!==id);save();$('dailyDialog').close();renderAll();toast('Eintrag gelöscht');
}
function renderDailyEntries(){
  ensureV11State();
  const list=$('dailyList');if(!list)return;list.innerHTML='';
  const all=dailyEntriesForMonth(),search=(state.ui.dailySearch||'').trim().toLocaleLowerCase('de-DE'),type=state.ui.dailyType||'',wantedCategory=state.ui.dailyCategory||'';
  const cats=[...new Set(all.map(e=>e.category||'Sonstiges'))].sort((a,b)=>a.localeCompare(b,'de'));
  $('dailyCategoryFilter').innerHTML='<option value="">Alle Kategorien</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
  $('dailyCategoryFilter').value=cats.includes(wantedCategory)?wantedCategory:'';
  const category=$('dailyCategoryFilter').value;
  let rows=all.filter(e=>(!type||e.type===type)&&(!category||(e.category||'Sonstiges')===category)&&(!search||(e.name+' '+(e.note||'')+' '+(e.category||'')).toLocaleLowerCase('de-DE').includes(search)));
  rows.sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));
  const today=localDateKey();
  $('dailyToday').textContent=euro.format(all.filter(e=>e.type!=='income'&&e.date===today).reduce((s,e)=>s+num(e.amount),0));
  $('dailyMonth').textContent=euro.format(all.filter(e=>e.type!=='income').reduce((s,e)=>s+num(e.amount),0));
  $('dailyIncome').textContent=euro.format(all.filter(e=>e.type==='income').reduce((s,e)=>s+num(e.amount),0));
  $('dailyCount').textContent=String(all.length);
  if(!rows.length){list.innerHTML='<div class="empty">Noch keine passenden Tages-Einträge in diesem Monat.</div>';return}
  let last='';
  const fmt=new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'});
  rows.forEach(e=>{
    if(e.date!==last){
      const d=new Date(e.date+'T12:00:00'),head=document.createElement('div');head.className='daily-date-head';head.textContent=(e.date===today?'Heute · ':'')+fmt.format(d);list.appendChild(head);last=e.date;
    }
    const b=e.budgetId?state.budgets.find(x=>x.id===e.budgetId):null,r=document.createElement('div');r.className='item daily-entry '+(e.type==='income'?'daily-income-entry':'');
    r.innerHTML='<div class="daily-kind">'+(e.type==='income'?'＋':'−')+'</div><div><div class="name">'+esc(e.name)+'</div><div class="meta">'+esc(e.category||'Sonstiges')+(b?' · Budget: '+esc(b.name):'')+(e.note?' · '+esc(e.note):'')+'</div></div><div class="inline"><div class="amount '+(e.type==='income'?'good':'')+'">'+(e.type==='income'?'+ ':'− ')+euro.format(e.amount)+'</div><button class="menu">⋮</button></div>';
    r.querySelector('.menu').onclick=()=>openDaily(e);list.appendChild(r);
  });
}

function renderCalendar(){
  const grid=$('calendarGrid');grid.innerHTML='';dayNames.forEach(d=>grid.insertAdjacentHTML('beforeend','<div class="dayhead">'+d+'</div>'));
  const d=parseMonth(state.selectedMonth),y=d.getFullYear(),m=d.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++)grid.insertAdjacentHTML('beforeend','<div class="day muted"></div>');
  const daily=dailyEntriesForMonth();
  for(let day=1;day<=days;day++){
    const fixed=monthExpenses().filter(e=>clampDay(y,m,e.dueDay)===day),tx=daily.filter(e=>Number(e.date.slice(8,10))===day),cell=document.createElement('div');cell.className='day';
    cell.innerHTML='<div class="daynum">'+day+'</div>'+
      fixed.map(e=>'<div class="event '+(isPaid(e)?'paid-event':'')+'">'+esc(e.name)+' '+euro.format(e.amount)+'</div>').join('')+
      tx.map(e=>'<div class="event daily-event '+(e.type==='income'?'income-event':'')+'">'+(e.type==='income'?'+ ':'− ')+esc(e.name)+' '+euro.format(e.amount)+'</div>').join('');
    grid.appendChild(cell);
  }
}

function renderYear(){
  const y=parseMonth(state.selectedMonth).getFullYear();$('yearLabel').textContent=String(y);
  let inc=0,exp=0,paid=0,cat={},months=[];
  for(let m=1;m<=12;m++){
    const k=y+'-'+String(m).padStart(2,'0'),mi=incomeTotal(k)+dailyIncomeTotal(k),fixed=expenseTotal(k),daily=dailyExpenseTotal(k),me=fixed+daily,mp=paidTotalFn(k)+daily;
    inc+=mi;exp+=me;paid+=mp;months.push({m,k,expense:me,income:mi});
    monthExpenses(k).forEach(e=>{cat[e.category]=(cat[e.category]||0)+e.amount});
    dailyEntriesForMonth(k).filter(e=>e.type!=='income').forEach(e=>{const c=e.category||'Sonstiges';cat[c]=(cat[c]||0)+num(e.amount)});
  }
  $('yearIncome').textContent=euro.format(inc);$('yearExpenses').textContent=euro.format(exp);$('yearPaid').textContent=euro.format(paid);
  const active=months.filter(x=>x.expense>0),cheap=active.length?active.reduce((a,b)=>a.expense<=b.expense?a:b):null,high=active.length?active.reduce((a,b)=>a.expense>=b.expense?a:b):null;
  const mf=new Intl.DateTimeFormat('de-DE',{month:'short'});
  $('yearCheapest').textContent=cheap?mf.format(parseMonth(cheap.k))+' · '+euro.format(cheap.expense):'–';
  $('yearMostExpensive').textContent=high?mf.format(parseMonth(high.k))+' · '+euro.format(high.expense):'–';
  const maxM=Math.max(1,...months.map(x=>x.expense));
  $('monthChart').innerHTML=months.map(x=>'<div class="chart-row month-row"><div class="meta">'+mf.format(parseMonth(x.k))+'</div><div class="bar"><span style="width:'+(x.expense/maxM*100)+'%"></span></div><div class="amount">'+euro.format(x.expense)+'</div></div>').join('');
  const max=Math.max(1,...Object.values(cat));
  $('categoryChart').innerHTML=Object.entries(cat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="chart-row"><div class="meta">'+esc(k)+'</div><div class="bar"><span style="width:'+(v/max*100)+'%"></span></div><div class="amount">'+euro.format(v)+'</div></div>').join('')||'<div class="notice">Noch keine Daten.</div>';
}

function openGeneric(type,obj=null){
  $('genericType').value=type;$('genericId').value=obj?.id||'';$('genericDeleteBtn').style.display=obj?'':'none';let h='';
  if(type==='income'){
    $('genericTitle').textContent=obj?'Einnahme bearbeiten':'Einnahme hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Gehalt')+genericField('Betrag (€)','g2','text',moneyInput(obj?.amount||''))+genericField('Notiz','g3','text',obj?.note||'');
  }else if(type==='budget'){
    $('genericTitle').textContent=obj?'Budget bearbeiten':'Budget hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Lebensmittel')+genericField('Monatslimit (€)','g2','text',moneyInput(obj?.limit||''))+genericField('Zusätzlich manuell ausgegeben (€)','g3','text',moneyInput((obj?.spentByMonth||{})[state.selectedMonth]||''))+genericField('Startmonat','g4','month',obj?.startMonth||state.selectedMonth);
  }else if(type==='reserve'){
    $('genericTitle').textContent=obj?'Rücklage bearbeiten':'Rücklage hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Versicherung')+genericField('Jahresbetrag (€)','g2','text',moneyInput(obj?.annualAmount||''))+genericField('Zahlungsmonat (1–12)','g3','number',obj?.paymentMonth||1)+genericField('Bereits angespart (€)','g4','text',moneyInput(obj?.saved||''));
  }else if(type==='goal'){
    $('genericTitle').textContent=obj?'Sparziel bearbeiten':'Sparziel hinzufügen';
    h=genericField('Name','g1','text',obj?.name||'Urlaub')+genericField('Zielbetrag (€)','g2','text',moneyInput(obj?.target||''))+genericField('Aktueller Stand (€)','g3','text',moneyInput(obj?.current||''))+genericField('Zielmonat','g4','month',obj?.targetMonth||addMonths(state.selectedMonth,6));
  }
  $('genericFields').innerHTML=h;$('genericDialog').showModal();
}

function renderAll(){
  ensureV11State();setTheme();renderHeader();renderExpenses();renderDailyEntries();renderIncome();renderBudgets();renderReserves();renderGoals();renderOverview();renderCalendar();renderYear();
  $('expenseSort').value=state.expenseSort||'due';
  if($('expenseSearch'))$('expenseSearch').value=state.ui.expenseSearch||'';
  if($('expenseCategoryFilter'))$('expenseCategoryFilter').value=state.ui.expenseCategory||'';
  if($('dailySearch'))$('dailySearch').value=state.ui.dailySearch||'';
  if($('dailyTypeFilter'))$('dailyTypeFilter').value=state.ui.dailyType||'';
  renderBackupReminder();
}

function runSelfCheck(){
  const tests=[],add=(name,ok)=>tests.push({name,ok:!!ok});
  add('Deutsche Beträge',Math.abs(num('4.000,50')-4000.5)<0.001);
  add('Fixkosten gültig',state.expenses.every(e=>e.id&&e.name&&Number.isFinite(num(e.amount))&&e.dueDay>=1&&e.dueDay<=31));
  add('Keine doppelten Fixkosten-IDs',new Set(state.expenses.map(e=>e.id)).size===state.expenses.length);
  add('Tages-Einträge gültig',state.dailyEntries.every(e=>e.id&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&e.name&&num(e.amount)>0));
  add('Keine doppelten Tages-IDs',new Set(state.dailyEntries.map(e=>e.id)).size===state.dailyEntries.length);
  add('Monat gültig',/^\d{4}-\d{2}$/.test(state.selectedMonth));
  const s=summary();add('Monatsprognose berechenbar',Number.isFinite(s.projected)&&Number.isFinite(s.open));add('Budgets berechenbar',Number.isFinite(s.b.left));
  const failed=tests.filter(t=>!t.ok);
  $('selfCheckResult').textContent=failed.length?failed.length+' Fehler gefunden':'✓ '+tests.length+' Prüfungen bestanden';
  $('selfCheckResult').className='notice '+(failed.length?'bad':'good');
}

ensureV11State();
$('dailyForm').onsubmit=saveDailyEntry;
$('deleteDailyBtn').onclick=deleteDailyEntry;
$('addDailyBtn').onclick=()=>openDaily();
$('addDailyQuick').onclick=()=>openDaily();
$('dailyType').onchange=syncDailyBudgetState;
$('dailyDate').onchange=()=>{const current=$('dailyBudget').value,month=$('dailyDate').value.slice(0,7),budgets=state.budgets.filter(b=>!b.startMonth||month>=b.startMonth);$('dailyBudget').innerHTML='<option value="">Keinem Budget zuordnen</option>'+budgets.map(b=>'<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>').join('');if(budgets.some(b=>b.id===current))$('dailyBudget').value=current;syncDailyBudgetState()};
$('dailySearch').oninput=e=>{state.ui.dailySearch=e.target.value;save();renderDailyEntries()};
$('dailyTypeFilter').onchange=e=>{state.ui.dailyType=e.target.value;save();renderDailyEntries()};
$('dailyCategoryFilter').onchange=e=>{state.ui.dailyCategory=e.target.value;save();renderDailyEntries()};
renderAll();
