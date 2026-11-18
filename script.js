const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = "civicai_reports_v1";
const seedReports = [
  {id:"CIV-284193",title:"Street light not working near park",category:"Electricity",location:"Central Park Road",date:"2026-11-16",status:"Under review",priority:"Medium",description:"The street light has not been working for a few days."},
  {id:"CIV-284067",title:"Garbage collection delay",category:"Waste",location:"Market Square",date:"2026-11-14",status:"In progress",priority:"High",description:"Garbage has been piling up near the market."},
  {id:"CIV-283812",title:"Pothole repaired near school",category:"Roads",location:"School Lane",date:"2026-11-10",status:"Resolved",priority:"Low",description:"A pothole was reported and has been marked resolved."}
];
let reports;
try { reports = JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedReports; } catch { reports = seedReports; }
let selectedCategory = "Roads";
let selectedPhoto = null;

function saveReports(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); }
function escapeHTML(value){ return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function dateLabel(date){ return new Date(date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function statusClass(status){ return status==="Resolved"?"resolved":status==="In progress"?"progress":""; }
function showToast(message){ const t=$("#toast"); t.textContent=message; t.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),2600); }

function goTo(page){
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  $$(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  const labels={"overview":"Overview","new-complaint":"Submit a complaint","track":"Track complaints","insights":"Civic insights"};
  $("#breadcrumb-current").textContent=labels[page]||"Overview";
  $("#sidebar").classList.remove("open");
  if(page==="overview") renderOverview();
  if(page==="track") renderTrack();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-page]").forEach(btn=>btn.addEventListener("click",()=>goTo(btn.dataset.page)));
$$("[data-go]").forEach(btn=>btn.addEventListener("click",()=>goTo(btn.dataset.go)));
$("#mobile-menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));

function renderOverview(){
  $("#stat-total").textContent=String(reports.length).padStart(2,"0");
  $("#stat-review").textContent=String(reports.filter(r=>r.status==="Under review"||r.status==="In progress").length).padStart(2,"0");
  $("#stat-resolved").textContent=String(reports.filter(r=>r.status==="Resolved").length).padStart(2,"0");
  const recent=[...reports].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  $("#recent-list").innerHTML=recent.length?recent.map(r=>`<div class="recent-item"><div class="issue-symbol">${categoryIcon(r.category)}</div><div><b>${escapeHTML(r.title)}</b><small>${escapeHTML(r.id)} · ${escapeHTML(r.location)}</small></div><span class="status-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span></div>`).join(""):`<p class="muted">No reports yet. Submit your first issue to get started.</p>`;
}
function categoryIcon(c){return ({Roads:"⌁",Waste:"♲",Water:"◉",Electricity:"ϟ",Drainage:"≋",Other:"＋"})[c]||"＋";}
function renderTrack(){
  const q=$("#track-search").value.toLowerCase(), status=$("#status-filter").value;
  const filtered=[...reports].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>(status==="All"||r.status===status)&&[r.title,r.id,r.category,r.location].join(" ").toLowerCase().includes(q));
  $("#track-count").textContent=`${filtered.length} report${filtered.length===1?"":"s"} found`;
  $("#empty-state").hidden=filtered.length!==0;
  $("#complaint-table").innerHTML=filtered.map(r=>`<tr><td><b>${escapeHTML(r.title)}</b><small>${escapeHTML(r.id)}</small></td><td class="table-category">${escapeHTML(r.category)}</td><td>${escapeHTML(r.location)}</td><td>${dateLabel(r.date)}</td><td><span class="status-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span></td><td><button class="view-report" data-report="${escapeHTML(r.id)}">Details ↗</button></td></tr>`).join("");
  $$("[data-report]").forEach(b=>b.addEventListener("click",()=>{const r=reports.find(x=>x.id===b.dataset.report);if(r)showToast(`${r.id}: ${r.description}`)}));
}
$("#track-search").addEventListener("input",renderTrack);
$("#status-filter").addEventListener("change",renderTrack);

$$(".category-option").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".category-option").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");selectedCategory=btn.dataset.category;
}));
$("#issue-description").addEventListener("input",e=>$("#char-count").textContent=e.target.value.length);
$("#issue-photo").addEventListener("change",e=>{
  const file=e.target.files[0]; selectedPhoto=null;
  if(!file){$("#file-name").textContent="";return;}
  if(file.size>5*1024*1024){e.target.value="";$("#file-name").textContent="";showToast("Please choose an image under 5 MB.");return;}
  selectedPhoto=file;$("#file-name").textContent=file.name;
});

$("#complaint-form").addEventListener("submit",e=>{
  e.preventDefault();
  const title=$("#issue-title").value.trim(), description=$("#issue-description").value.trim(), location=$("#issue-location").value.trim();
  if(!title||!description||!location){showToast("Please complete all required fields.");return;}
  const id="CIV-"+Math.floor(100000+Math.random()*900000);
  const report={id,title,description,location,category:selectedCategory,priority:$("#issue-priority").value,status:"Under review",date:new Date().toISOString().slice(0,10)};
  reports.unshift(report);saveReports();renderOverview();
  $("#reference-id").textContent=id;$("#success-message").textContent=`Your ${selectedCategory.toLowerCase()} report has been saved on this device.`;
  $("#success-modal").classList.add("show");
  e.target.reset();$("#char-count").textContent="0";$("#file-name").textContent="";selectedPhoto=null;
  $$(".category-option").forEach(b=>b.classList.toggle("selected",b.dataset.category==="Roads"));selectedCategory="Roads";
});
$("#modal-close").addEventListener("click",()=>$("#success-modal").classList.remove("show"));
$("#modal-done").addEventListener("click",()=>{$("#success-modal").classList.remove("show");goTo("track");});
$("#success-modal").addEventListener("click",e=>{if(e.target.id==="success-modal")e.currentTarget.classList.remove("show")});
$("#copy-reference").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#reference-id").textContent);showToast("Reference ID copied.");}catch{showToast("Copy is not available in this browser.");}});

function openAssistant(){$("#assistant-panel").classList.add("open");$("#assistant-scrim").classList.add("show");}
function closeAssistant(){$("#assistant-panel").classList.remove("open");$("#assistant-scrim").classList.remove("show");}
$("#open-assistant").addEventListener("click",openAssistant);
$("#close-assistant").addEventListener("click",closeAssistant);
$("#assistant-scrim").addEventListener("click",closeAssistant);
$("#notification-button").addEventListener("click",()=>showToast("You’re all caught up."));
function assistantReply(message){
  const m=message.toLowerCase();
  if(m.includes("pothole")||m.includes("road"))return "For a road issue, choose the Roads category. Add the street name or a nearby landmark, explain the hazard, and attach a clear photo if possible. Use “Submit a complaint” to create a demo report.";
  if(m.includes("photo")||m.includes("detail")||m.includes("include"))return "A useful report includes: a short title, what happened, how long it has been happening, an exact location or landmark, urgency, and an optional photo. Avoid sharing private or sensitive information.";
  if(m.includes("garbage")||m.includes("waste"))return "For garbage or sanitation concerns, choose Waste. Mention whether it is a missed collection, overflowing bin, or illegal dumping, and include the closest landmark.";
  if(m.includes("water")||m.includes("leak"))return "Choose Water for a leaking pipe or water-supply concern. Describe where the leak is, whether water is affecting traffic or homes, and how long it has continued.";
  if(m.includes("light")||m.includes("electric"))return "Choose Electricity for a broken street light. Mention the pole number if visible, street or landmark, and whether the whole area is dark.";
  if(m.includes("track")||m.includes("status"))return "Open Track complaints to view the reference ID and demo status of reports saved in this browser. This prototype does not contact a municipal department.";
  return "I can help you prepare a clear civic report. Tell me whether it concerns roads, waste, water, electricity, drainage or another public issue. I can suggest what information to include.";
}
function addMessage(text,type){const div=document.createElement("div");div.className=`assistant-message ${type}`;div.textContent=text;$("#assistant-messages").appendChild(div);$("#assistant-messages").scrollTop=$("#assistant-messages").scrollHeight;}
$("#assistant-form").addEventListener("submit",e=>{
  e.preventDefault();const input=$("#assistant-text"),message=input.value.trim();if(!message)return;
  addMessage(message,"user");input.value="";
  setTimeout(()=>addMessage(assistantReply(message),"bot"),300);
});
$$(".quick-prompts button").forEach(b=>b.addEventListener("click",()=>{const message=b.textContent;addMessage(message,"user");setTimeout(()=>addMessage(assistantReply(message),"bot"),250);}));

renderOverview();
