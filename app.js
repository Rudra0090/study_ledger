const SUBJECTS = [
  "Probability & Statistics",
  "Linear Algebra & Calculus",
  "Python, DS & Algorithms",
  "DBMS & Warehousing",
  "Machine Learning",
  "Artificial Intelligence"
];
const DEFAULT_EXTRAS = [
  { id:"resources", label:"Finding resources", topic:"", minutes:"" },
  { id:"revision", label:"Revision", topic:"", minutes:"" },
  { id:"project", label:"Project / practical work", topic:"", minutes:"" }
];
const STORAGE_KEY = "studyLedger.v1";
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const localDate = (date=new Date()) => {
  const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,"0"), d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
};
const prettyDate = (iso, options={weekday:"long",year:"numeric",month:"long",day:"numeric"}) => {
  if(!iso) return "";
  const [y,m,d]=iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,options);
};
let store = loadStore();
let activeDate = localDate();
let toastTimer;

function loadStore(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveStore(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
function freshDay(){
  return { subjects:SUBJECTS.map((name,i)=>({id:`s${i}`,name,topic:"",minutes:""})), extras:DEFAULT_EXTRAS.map(x=>({...x})), updatedAt:new Date().toISOString() };
}
function ensureDay(date){
  if(!store[date]) store[date]=freshDay();
  const day=store[date];
  // Keep the default subject list current while preserving any saved entries.
  const existing=new Map((day.subjects||[]).map(s=>[s.name,s]));
  day.subjects=SUBJECTS.map((name,i)=>existing.get(name)||({id:`s${i}`,name,topic:"",minutes:""}));
  day.extras=Array.isArray(day.extras)?day.extras:[];
  DEFAULT_EXTRAS.forEach((x,i)=>{if(!day.extras.some(e=>e.id===x.id)) day.extras.splice(i,0,{...x});});
  return day;
}
function mins(value){const n=Number(value);return Number.isFinite(n)&&n>0?n:0}
function getTotal(day){return [...(day.subjects||[]),...(day.extras||[])].reduce((sum,row)=>sum+mins(row.minutes),0)}
function getActiveDay(){return ensureDay(activeDate)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderEntry(){
  const day=getActiveDay();
  $("#entryDate").value=activeDate;
  $("#paperDateTitle").textContent=activeDate===localDate()?"Today's notes":prettyDate(activeDate,{month:"long",day:"numeric",year:"numeric"});
  $("#headerDate").textContent=prettyDate(localDate(),{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
  $("#pageNumber").textContent=`PAGE ${String(Object.keys(store).sort().indexOf(activeDate)+1).padStart(3,"0")}`;
  $("#subjectRows").innerHTML=day.subjects.map((row,i)=>renderRow(row,i,false)).join("");
  $("#extraRows").innerHTML=day.extras.map((row,i)=>renderRow(row,i,true)).join("");
  $("#entryTotal").innerHTML=`${getTotal(day)} <small>min</small>`;
  bindRows();
}
function renderRow(row,i,isExtra){
  const num=String(i+1).padStart(2,"0");
  const label=isExtra
    ? `<div class="custom-label"><input aria-label="Activity name" data-field="label" data-id="${escapeHtml(row.id)}" value="${escapeHtml(row.label||"")}" placeholder="Name this activity"></div>`
    : `<span class="row-label">${escapeHtml(row.name)}</span>`;
  return `<div class="entry-row" data-row-id="${escapeHtml(row.id)}" data-kind="${isExtra?"extra":"subject"}">
    <span class="row-number">${num}</span>
    <div class="row-main">${label}<input class="topic-input" data-field="topic" data-id="${escapeHtml(row.id)}" placeholder="${isExtra?"What did you do?":"Topics covered today…"}" value="${escapeHtml(row.topic||"")}" aria-label="Topics or details for ${escapeHtml(row.name||row.label)}"></div>
    <div class="time-wrap"><input class="time-input" type="number" min="0" max="1440" step="1" inputmode="numeric" data-field="minutes" data-id="${escapeHtml(row.id)}" value="${escapeHtml(row.minutes??"")}" placeholder="—" aria-label="Minutes spent"><span class="time-unit">MIN</span>${isExtra&&!DEFAULT_EXTRAS.some(x=>x.id===row.id)?`<button class="row-delete" data-delete="${escapeHtml(row.id)}" title="Remove activity" aria-label="Remove activity">×</button>`:""}</div>
  </div>`;
}
function bindRows(){
  $$("#subjectRows [data-field], #extraRows [data-field]").forEach(input=>{
    input.addEventListener("focus",()=>input.closest(".entry-row")?.classList.add("writing-now"));
    input.addEventListener("blur",()=>input.closest(".entry-row")?.classList.remove("writing-now"));
    input.addEventListener("input",()=>{
      const day=getActiveDay(), isExtra=input.closest(".entry-row").dataset.kind==="extra";
      const list=isExtra?day.extras:day.subjects;
      const row=list.find(r=>r.id===input.dataset.id);
      if(!row)return;
      row[input.dataset.field]=input.value;
      day.updatedAt=new Date().toISOString();saveStore();
      $("#entryTotal").innerHTML=`${getTotal(day)} <small>min</small>`;
      if(input.dataset.field==="minutes") refreshCurrentDashboardIfVisible();
      if(input.dataset.field==="label") { /* value is persisted while typing */ }
      renderHistory();
      refreshDashboardIfVisible();
    });
  });
  $$("#extraRows [data-delete]").forEach(btn=>btn.addEventListener("click",()=>{
    const day=getActiveDay();day.extras=day.extras.filter(r=>r.id!==btn.dataset.delete);day.updatedAt=new Date().toISOString();saveStore();renderEntry();refreshDashboardIfVisible();renderHistory();showToast("Activity removed");
  }));
}
function addExtra(){
  const day=getActiveDay();
  day.extras.push({id:`x-${Date.now()}-${Math.random().toString(16).slice(2,6)}`,label:"",topic:"",minutes:""});
  day.updatedAt=new Date().toISOString();saveStore();renderEntry();
  const fields=$$("#extraRows [data-field='label']");fields[fields.length-1]?.focus();
}
function refreshCurrentDashboardIfVisible(){if($("#dashboardView").classList.contains("active"))renderDashboard()}
function refreshDashboardIfVisible(){if($("#dashboardView").classList.contains("active"))renderDashboard()}
function renderDashboard(){
  const date=$("#dashboardDate").value||activeDate;
  const day=store[date]||freshDay(), total=getTotal(day);
  const all=[...(day.subjects||[]),...(day.extras||[])];
  const filled=all.filter(r=>mins(r.minutes)>0);
  const subjects=(day.subjects||[]).filter(r=>mins(r.minutes)>0);
  $("#dashTotal").innerHTML=`${total}<span> min</span>`;
  $("#dashHours").textContent=`That's ${(total/60).toLocaleString(undefined,{maximumFractionDigits:1})} hours of recorded effort.`;
  $("#dashSubjects").textContent=subjects.length;
  renderWeek();
}
function renderWeek(){
  const chosen=$("#dashboardDate").value||activeDate;
  const [y,m,d]=chosen.split("-").map(Number), end=new Date(y,m-1,d);
  const days=[];
  for(let i=6;i>=0;i--){const dt=new Date(end);dt.setDate(dt.getDate()-i);const iso=localDate(dt);days.push({iso,label:dt.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2),total:getTotal(store[iso]||freshDay())})}
  const max=Math.max(1,...days.map(d=>d.total));
  $("#weekChart").innerHTML=days.map(day=>`<div class="week-day ${day.iso===chosen?"today":""}" title="${prettyDate(day.iso)}: ${day.total} minutes"><div class="week-bar-wrap"><div class="week-bar" style="height:${day.total?Math.max(5,day.total/max*100):2}%"></div></div><label>${day.label}</label></div>`).join("");
  $("#weekTotal").textContent=`${days.reduce((s,d)=>s+d.total,0)} min total`;
}
function renderHistory(){
  const dates=Object.keys(store).filter(date=>{
    const day=store[date];return day&&([...((day.subjects)||[]),...((day.extras)||[])].some(r=>(String(r.topic||"").trim()||mins(r.minutes)>0||(r.label&& !DEFAULT_EXTRAS.some(x=>x.id===r.id)))));
  }).sort((a,b)=>b.localeCompare(a));
  $("#historyCount").textContent=dates.length;
  $("#emptyHistory").style.display=dates.length?"none":"block";
  $("#historyBook").innerHTML=dates.map((date,index)=>{
    const day=store[date], total=getTotal(day);
    const completed=[...(day.subjects||[]),...(day.extras||[])].filter(r=>String(r.topic||"").trim()||mins(r.minutes)>0).length;
    const [yy,mm,dd]=date.split("-").map(Number);
    const dateObj=new Date(yy,mm-1,dd);
    const tint=["#e6dac2","#d8dfca","#e4d3c8","#d9d2e6","#e9dfc9"][index%5];
    return `<button class="history-card" data-open-date="${date}" style="background:${tint}"><span class="book-spine"></span><div class="book-content"><span class="book-kicker">FIELD NOTES · ${String(index+1).padStart(2,"0")}</span><div class="book-date">${dateObj.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</div><div class="book-year">${dateObj.toLocaleDateString(undefined,{weekday:"long",year:"numeric"})}</div><div class="book-rule"></div><div class="book-total">${total}<small> MINUTES</small></div><div class="book-summary">${completed} topic/activity entries</div></div><span class="book-open">↗</span></button>`;
  }).join("");
  $$("#historyBook [data-open-date]").forEach(btn=>btn.addEventListener("click",()=>{activeDate=btn.dataset.openDate;$("#entryDate").value=activeDate;renderEntry();$("#dashboardDate").value=activeDate;renderDashboard();switchView("entry");showToast("Opened "+prettyDate(activeDate,{month:"short",day:"numeric"}));}));
}
function switchView(view){
  $$(".tab").forEach(tab=>tab.classList.toggle("active",tab.dataset.view===view));
  $$(".view").forEach(section=>section.classList.toggle("active",section.id===`${view}View`));
  if(view==="dashboard")renderDashboard();
  if(view==="history")renderHistory();
  window.scrollTo({top:0,behavior:"smooth"});
}
function showToast(message){
  const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2100);
}
function exportBackup(){
  const blob=new Blob([JSON.stringify({app:"Study Ledger",version:1,exportedAt:new Date().toISOString(),days:store},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`study-ledger-backup-${localDate()}.json`;a.click();URL.revokeObjectURL(url);showToast("Backup exported");
}
function init(){
  $("#year").textContent=new Date().getFullYear();
  $("#entryDate").value=activeDate;$("#dashboardDate").value=activeDate;
  renderEntry();renderDashboard();renderHistory();
  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>switchView(tab.dataset.view)));
  $$("[data-go]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.go)));
  $("#entryDate").addEventListener("change",e=>{activeDate=e.target.value||localDate();renderEntry();if($("#dashboardView").classList.contains("active")){$("#dashboardDate").value=activeDate;renderDashboard()}});
  $("#dashboardDate").addEventListener("change",renderDashboard);
  $("#addExtraBtn").addEventListener("click",addExtra);
  $("#exportBtn").addEventListener("click",exportBackup);
  // Save a day-end snapshot when the page is open near 23:59. Entries are already saved on every edit,
  // so the final total remains available even if the browser is closed.
  const snapshotDay=()=>{const today=localDate();if(store[today]){store[today].dayEndTotal=getTotal(store[today]);store[today].dayClosedAt=new Date().toISOString();saveStore();}};
  const checkDayEnd=()=>{const now=new Date();if(now.getHours()===23&&now.getMinutes()===59)snapshotDay();};
  checkDayEnd();setInterval(checkDayEnd,30000);
}
init();
