
var STATUSES=["Received","In Progress","Waiting Parts","Ready","Delivered"];
var COMPLAINTS=["Engine not starting","Difficult to start","Engine stopping frequently","Engine noise","Engine misfire","Low power / poor pickup","Excessive vibration","Engine overheating","Oil leakage","Excessive exhaust smoke","Rough idling","Low compression","Front brake not working properly","Rear brake not working properly","Brake noise","Brake feels hard/soft","Brake vibration","Brake dragging","Clutch hard","Clutch slipping","Clutch noise","Gear shifting problem","Gear getting stuck","Unusual noise while changing gear","Battery weak/dead","Battery not charging","Self-start not working","Kick starter is hard","Headlight problem","Indicator not working","Horn not working","Tail light problem","Brake light not working","Fuse keeps blowing","Wiring/electrical issue","Tyre puncture","Tyre air leakage","Wheel alignment problem","Wheel wobbling","Tyre replacement required","Front suspension noise","Rear suspension noise","Suspension hard","Front fork oil leakage","Handlebar vibration","Steering problem","Low mileage","Fuel leakage","Fuel starting problem","Fuel tank issue","Carburetor issue","Fuel injector issue","Fuel pump issue","Service required","Oil change required","Chain adjustment","Chain noise","Chain lubrication required","Washing/cleaning required","General inspection","Speedometer not working","Odometer not working","Instrument lights not working","Side stand switch issue","Loose or damaged body panel","Seat or lock issue","Coolant leakage","Radiator fan not working","Other"];
var ADMIN={u:"ayyatwowheeler",p:"12345"};
var jobs=[],current=null;

/* Phase 2 & 7: database = browser storage (this device only) */
function load(){try{jobs=JSON.parse(localStorage.getItem("tw_jobs")||"[]");var migrated=false;jobs.forEach(function(j){if(j.totalAmount==null&&j.estimate!=null){j.totalAmount=j.estimate;migrated=true}if(Object.prototype.hasOwnProperty.call(j,"estimate")){delete j.estimate;migrated=true}if(Object.prototype.hasOwnProperty.call(j,"advance")){delete j.advance;migrated=true}});if(migrated)save()}catch(e){jobs=[]}}
function save(){try{localStorage.setItem("tw_jobs",JSON.stringify(jobs))}catch(e){toast("Could not save on this device")}}
function authed(){try{return sessionStorage.getItem("tw_auth")==="1"}catch(e){return window._a===true}}
function setAuth(v){try{sessionStorage.setItem("tw_auth",v?"1":"0")}catch(e){}window._a=v}

/* Phase 6: automatic JC-0001 numbering */
function nextNo(){var m=0;jobs.forEach(function(j){var n=parseInt(j.no.slice(3),10);if(n>m)m=n});return "JC-"+String(m+1).padStart(4,"0")}

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function $(id){return document.getElementById(id)}
function toast(m){var t=$("toast");t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(function(){t.style.display="none"},2200)}
function tag(s){return '<span class="tag s-'+s.replace(/ /g,"-")+'">'+esc(s)+'</span>'}
function money(n){return "₹"+(Number(n)||0).toLocaleString("en-IN")}

function showApp(){var a=authed();$("loginView").classList.toggle("hide",a);$("app").classList.toggle("hide",!a);if(a)go("dash")}
$("loginBtn").onclick=doLogin;
$("p").onkeydown=function(e){if(e.key==="Enter")doLogin()};
function doLogin(){
 if($("u").value.trim()===ADMIN.u&&$("p").value===ADMIN.p){setAuth(true);$("err").textContent="";showApp()}
 else $("err").textContent="Wrong username or password. Try again."
}
$("logout").onclick=function(){setAuth(false);$("p").value="";showApp()};
document.querySelectorAll("[data-go]").forEach(function(b){b.onclick=function(){go(b.dataset.go)}});

function go(v,id){
 document.querySelectorAll("[data-go]").forEach(function(b){b.classList.toggle("on",b.dataset.go===v)});
 if(v==="dash")dash();else if(v==="new")form(null);else if(v==="list")list();
 else if(v==="view")detail(id);else if(v==="edit")form(id);
 window.scrollTo(0,0)
}

/* Phase 4: Dashboard */
function dash(){
 var c={};STATUSES.forEach(function(s){c[s]=0});jobs.forEach(function(j){c[j.status]++});
 var open=jobs.length-c["Delivered"];
 var recent=jobs.slice().reverse().slice(0,5);
 $("view").innerHTML='<div class="grid stats">'+
  stat(jobs.length,"Total job cards")+stat(open,"Open now")+stat(c["In Progress"],"In progress")+stat(c["Ready"],"Ready for pickup")+stat(c["Delivered"],"Delivered")+'</div>'+
  '<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h2>Recent job cards</h2><button class="btn" onclick="go(\'new\')">New job card</button></div>'+
  (recent.length?table(recent):'<p style="color:var(--mute)">No job cards yet. Create the first one when a bike comes in.</p>')+'</div>';
 bindRows()
}
function stat(n,l){return '<div class="card stat"><b>'+n+'</b><span>'+l+'</span></div>'}
function table(a){
 return '<div class="tbl"><table><thead><tr><th>Job card</th><th>Date</th><th>Customer</th><th>Bike</th><th>Status</th></tr></thead><tbody>'+
 a.map(function(j){return '<tr class="click" data-id="'+j.no+'"><td class="jc">'+j.no+'</td><td>'+esc(j.date)+'</td><td>'+esc(j.name)+'<br><small style="color:var(--mute)">'+esc(j.phone)+'</small></td><td>'+esc(j.reg)+'<br><small style="color:var(--mute)">'+esc(j.model)+'</small></td><td>'+tag(j.status)+'</td></tr>'}).join("")+'</tbody></table></div>'
}
function bindRows(){document.querySelectorAll("tr.click").forEach(function(r){r.onclick=function(){go("view",r.dataset.id)}})}

/* Phase 5 & 9: Create / update job card */
function form(id){
 var j=id?find(id):null;
 var d=j||{no:nextNo(),date:new Date().toISOString().slice(0,10),name:"",phone:"",reg:"",model:"",km:"",nextServiceDate:"",nextServiceKm:"",fuel:"Half",complaint:"",work:"",totalAmount:"",status:"Received"};
 var complaintData=parseComplaints(d.complaint);
 function f(k,l,t,cls){return '<div class="'+(cls||"")+'"><label for="f_'+k+'">'+l+'</label><input id="f_'+k+'" type="'+(t||"text")+'" value="'+esc(d[k])+'"></div>'}
 $("view").innerHTML='<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>'+(j?'Update job card':'New job card')+'</h2><span class="jc">'+d.no+'</span></div>'+
 '<div class="grid form">'+f("date","Date","date")+f("deliveredDate","Delivered date","date")+f("name","Customer name")+f("phone","Mobile number","tel")+f("reg","Vehicle number (e.g. TN 66 AB 1234)")+f("model","Make and model")+f("km","Odometer (km)","number")+f("nextServiceDate","Next service date","date")+f("nextServiceKm","Next service at (km)","number")+
 '<div><label for="f_fuel">Fuel level</label><select id="f_fuel">'+["Empty","Quarter","Half","Three quarter","Full"].map(function(x){return '<option'+(x===d.fuel?' selected':'')+'>'+x+'</option>'}).join("")+'</select></div>'+
 '<div><label for="f_status">Status</label><select id="f_status">'+STATUSES.map(function(x){return '<option'+(x===d.status?' selected':'')+'>'+x+'</option>'}).join("")+'</select></div>'+
 '<div class="full"><label>Customer complaints (select all that apply)</label><details class="complaint-menu"><summary id="complaintSummary">Choose complaints</summary><input id="complaintSearch" type="search" placeholder="Search complaints" aria-label="Search complaints"><div class="complaint-options" id="complaintOptions">'+COMPLAINTS.map(function(c){return '<label class="complaint-option"><input type="checkbox" class="complaint-choice" value="'+esc(c)+'"'+(complaintData.selected.indexOf(c)>-1?' checked':'')+'><span>'+esc(c)+'</span></label>'}).join("")+'</div></details><div id="complaintOtherBox" class="'+(complaintData.other?'':'hide')+'" style="margin-top:8px"><label for="f_complaintOther">Other complaint (type here)</label><textarea id="f_complaintOther" placeholder="Describe the issue">'+esc(complaintData.other)+'</textarea></div></div>'+
 '<div class="full"><label for="f_work">Work to be done / parts used</label><textarea id="f_work">'+esc(d.work)+'</textarea></div>'+
 '<div class="full"><label>Before photos (vehicle on arrival, up to 4)</label><div class="imgs" id="th_before"></div><div class="row" style="margin-top:6px"><button type="button" class="btn alt" id="cam_before">Take photo</button><button type="button" class="btn alt" id="pick_before">Choose files</button></div><input class="hide" type="file" id="in_before" accept="image/*" capture="environment"><input class="hide" type="file" id="files_before" accept="image/*" multiple></div>'+
 '<div class="full"><label>After photos (work completed, up to 4)</label><div class="imgs" id="th_after"></div><div class="row" style="margin-top:6px"><button type="button" class="btn alt" id="cam_after">Take photo</button><button type="button" class="btn alt" id="pick_after">Choose files</button></div><input class="hide" type="file" id="in_after" accept="image/*" capture="environment"><input class="hide" type="file" id="files_after" accept="image/*" multiple></div>'+
 f("totalAmount","Total amount (₹)","number")+'</div>'+
 '<div class="row" style="margin-top:14px"><button class="btn" id="saveBtn">Save job card</button><button class="btn alt" onclick="go(\''+(j?'view\',\''+d.no:'list')+'\')">Cancel</button></div><p class="err" id="ferr"></p></div>';
 ph={before:((j&&j.before)||[]).slice(),after:((j&&j.after)||[]).slice()};bindPh("before");bindPh("after");
 var complaintChoices=document.querySelectorAll(".complaint-choice");
 function updateComplaintSummary(){var n=document.querySelectorAll(".complaint-choice:checked").length;$("complaintSummary").textContent=n?n+" complaint"+(n===1?"":"s")+" selected":"Choose complaints"}
 function toggleOther(){var otherSelected=Array.prototype.some.call(complaintChoices,function(c){return c.value==="Other"&&c.checked});$("complaintOtherBox").classList.toggle("hide",!otherSelected)}
 complaintChoices.forEach(function(c){c.onchange=function(){updateComplaintSummary();toggleOther()}});
 $("complaintSearch").oninput=function(){var q=this.value.trim().toLowerCase();document.querySelectorAll(".complaint-option").forEach(function(row){row.style.display=row.textContent.toLowerCase().indexOf(q)>-1?"flex":"none"})};
 updateComplaintSummary();toggleOther();
 $("saveBtn").onclick=function(){
  var o={no:d.no};["date","deliveredDate","name","phone","reg","model","km","nextServiceDate","nextServiceKm","fuel","work","totalAmount","status"].forEach(function(k){o[k]=$("f_"+k).value.trim()});
  var selectedComplaints=Array.prototype.map.call(document.querySelectorAll(".complaint-choice:checked"),function(c){return c.value}),otherSelected=selectedComplaints.indexOf("Other")>-1,otherText=otherSelected?$("f_complaintOther").value.trim():"";if(otherText)selectedComplaints.push("Other: "+otherText);o.complaint=selectedComplaints.join("; ");
  if(!o.name||!o.phone||!o.reg){$("ferr").textContent="Enter customer name, mobile number and vehicle number.";return}
  o.reg=o.reg.toUpperCase();o.before=ph.before;o.after=ph.after;
  if(o.status==="Delivered"&&!o.deliveredDate)o.deliveredDate=localDate();
  if(j){jobs[jobs.indexOf(j)]=o}else{o.no=nextNo();jobs.push(o)}
  save();toast(j?"Job card updated":"Saved as "+o.no);go("view",o.no)
 }
}
function parseComplaints(value){var parts=String(value||"").split(/\s*;\s*/).filter(Boolean),selected=[],other=[];parts.forEach(function(part){if(COMPLAINTS.indexOf(part)>-1)selected.push(part);else if(/^Other:\s*/i.test(part))other.push(part.replace(/^Other:\s*/i,""));else other.push(part)});if(other.length&&selected.indexOf("Other")<0)selected.push("Other");return{selected:selected,other:other.join("\n")}}
function find(id){return jobs.filter(function(j){return j.no===id})[0]}

/* Phase 11: Search + Phase 8: View */
function list(){
 $("view").innerHTML='<div class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin-right:auto">All job cards</h2></div>'+
 '<div class="grid form" style="margin-bottom:10px"><input id="q" placeholder="Search by job card, name, mobile or vehicle number" aria-label="Search"><select id="sf" aria-label="Filter by status"><option value="">All statuses</option>'+STATUSES.map(function(s){return '<option>'+s+'</option>'}).join("")+'</select></div><div id="res"></div></div>';
 function run(){
  var q=$("q").value.toLowerCase().replace(/\s+/g,""),s=$("sf").value;
  var a=jobs.filter(function(j){
   var hay=(j.no+j.name+j.phone+j.reg+j.model).toLowerCase().replace(/\s+/g,"");
   return (!q||hay.indexOf(q)>-1)&&(!s||j.status===s)}).reverse();
  $("res").innerHTML=a.length?table(a):'<p style="color:var(--mute)">No job cards match. Check the spelling or clear the filter.</p>';bindRows()
 }
 $("q").oninput=run;$("sf").onchange=run;run()
}

function detail(id){
 var j=find(id);if(!j){list();return}
 $("view").innerHTML='<div class="card sheet"><div class="head"><img class="brand-logo" src="image/logo.png" alt="Ayya Two Wheeler Workshop logo"><div style="margin-right:auto"><h2>Ayya Two Wheeler</h2><div style="color:var(--mute);font-size:14px">Two wheeler service job card</div></div><div style="text-align:right"><div class="jc" style="font-size:28px">'+j.no+'</div><div style="font-size:14px">'+esc(j.date)+'</div>'+(j.deliveredDate?'<div style="font-size:13px">Delivered: '+esc(j.deliveredDate)+'</div>':'')+'</div></div>'+
 '<div class="kv"><div><span>Customer</span>'+esc(j.name)+'</div><div><span>Mobile</span>'+esc(j.phone)+'</div><div><span>Vehicle number</span>'+esc(j.reg)+'</div><div><span>Make and model</span>'+esc(j.model||"-")+'</div><div><span>Odometer</span>'+esc(j.km||"-")+' km</div><div><span>Next service date</span>'+esc(j.nextServiceDate||"-")+'</div><div><span>Next service at</span>'+esc(j.nextServiceKm||"-")+' km</div><div><span>Fuel level</span>'+esc(j.fuel)+'</div><div><span>Status</span>'+tag(j.status)+'</div></div>'+
 '<div class="kv"><div style="grid-column:1/-1"><span>Customer complaints</span>'+(esc(j.complaint)||"-").replace(/\n/g,"<br>")+'</div><div style="grid-column:1/-1"><span>Work to be done / parts used</span>'+(esc(j.work)||"-").replace(/\n/g,"<br>")+'</div></div>'+
 '<div class="kv"><div><span>Total amount</span><b>'+money(j.totalAmount)+'</b></div></div>'+
 '<div class="noprint" style="margin:14px 0"><label for="st">Status (Phase 10)</label><div class="row"><select id="st" style="max-width:220px">'+STATUSES.map(function(s){return '<option'+(s===j.status?' selected':'')+'>'+s+'</option>'}).join("")+'</select>'+tag(j.status)+'</div></div>'+
 '<div class="ph">'+phBox("Before",j.before)+phBox("After",j.after)+'</div>'+
 '<div class="row noprint" style="margin-top:22px"><button class="btn" id="edit">Update job card</button><button class="btn wa" id="wa">Share job card on WhatsApp</button><button class="btn alt" id="sharePdf">Share PDF</button><button class="btn alt" id="pr">Print / Save as PDF</button><button class="btn alt" onclick="go(\'list\')">Back to list</button><button class="btn" id="deleteJob" style="background:#9f211a">Delete job card</button></div>'+
 '<div class="noprint upd"><h3>Update message to customer</h3><textarea id="um" aria-label="Update message">'+esc(updateMsg(j))+'</textarea><div class="row"><button class="btn wa" id="uw">Send update on WhatsApp</button><button class="btn alt" id="us">Share update</button></div></div></div>';
 $("st").onchange=function(){j.status=$("st").value;if(j.status==="Delivered"&&!j.deliveredDate)j.deliveredDate=localDate();save();toast("Status updated. Review the message below and send it.");detail(id)};
 $("edit").onclick=function(){go("edit",id)};
 $("deleteJob").onclick=function(){if(!window.confirm("Delete job card "+j.no+"? This also removes its saved photos and cannot be undone."))return;jobs=jobs.filter(function(item){return item.no!==id});save();toast("Job card deleted");go("list")};
 $("pr").onclick=function(){document.title=j.no+" "+j.reg;window.print()};
 $("wa").onclick=function(){share(j,summary(j),false,true)};
 $("sharePdf").onclick=function(){shareJobCardPdf(j)};
 $("uw").onclick=function(){share(j,$("um").value,false,true)};
 $("us").onclick=function(){share(j,$("um").value,false)}
}

var ph={before:[],after:[]};
function compress(f,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var s=Math.min(1,720/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.65))};im.src=r.result};r.readAsDataURL(f)}
function bindPh(k){
 function draw(){$("th_"+k).innerHTML=ph[k].map(function(d,i){return '<div class="thumb"><img alt="'+k+' photo '+(i+1)+'" src="'+d+'"><button type="button" aria-label="Remove photo" data-i="'+i+'">×</button></div>'}).join("");
  $("th_"+k).querySelectorAll("button").forEach(function(b){b.onclick=function(){ph[k].splice(+b.dataset.i,1);draw()}})}
 $("cam_"+k).onclick=function(){$("in_"+k).click()};$("pick_"+k).onclick=function(){$("files_"+k).click()};
 function addFiles(e){var remaining=4-ph[k].length,files=Array.prototype.slice.call(e.target.files).slice(0,remaining);if(e.target.files.length>remaining)toast("Maximum 4 photos");files.forEach(function(f){compress(f,function(d){if(ph[k].length<4){ph[k].push(d);draw()}})});e.target.value=""}
 $("in_"+k).onchange=addFiles;$("files_"+k).onchange=addFiles;
 draw()}
function phBox(t,a){return '<div><h3>'+t+' photos</h3>'+(a&&a.length?'<div class="imgs">'+a.map(function(d,i){return '<img alt="'+t+' photo '+(i+1)+'" src="'+d+'">'}).join("")+'</div>':'<div class="none">No '+t.toLowerCase()+' photos added</div>')+'</div>'}
function localDate(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return d.getFullYear()+"-"+m+"-"+day}
function loadPdfLib(){if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf.jsPDF);var urls=["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js","https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"];return new Promise(function(resolve,reject){function next(){var s=document.createElement("script");s.src=urls.shift();s.onload=function(){window.jspdf&&window.jspdf.jsPDF?resolve(window.jspdf.jsPDF):(s.remove(),urls.length?next():reject(new Error("PDF library loaded but jsPDF was not found")))};s.onerror=function(){s.remove();urls.length?next():reject(new Error("Could not load the PDF library. Check internet access or open this page online."))};document.head.appendChild(s)}next()})}
function buildJobCardPdf(j,JsPDF,logo){
 var doc=new JsPDF({unit:"mm",format:"a4"}),w=210,left=14,right=196,y=15;
 try{doc.addImage(logo,"PNG",left,y-2,15,15,"ayya-logo","FAST")}catch(e){}
 doc.setTextColor(29,36,48);doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text("Ayya Two Wheeler",left+18,y+5);
 doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text("Two wheeler service job card",left+18,y+10);
 doc.setTextColor(200,40,30);doc.setFont("helvetica","bold");doc.setFontSize(17);doc.text(j.no,right,y+4,{align:"right"});
 doc.setTextColor(40,40,40);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(String(j.date||""),right,y+10,{align:"right"});if(j.deliveredDate)doc.text("Delivered: "+j.deliveredDate,right,y+14,{align:"right"});
 y+=19;doc.setDrawColor(200,40,30);doc.setLineWidth(1);doc.line(left,y,right,y);y+=7;
 function field(x,yy,label,value){doc.setTextColor(100,110,125);doc.setFontSize(8);doc.text(label,x,yy);doc.setTextColor(29,36,48);doc.setFontSize(10);doc.text(doc.splitTextToSize(String(value||"-"),54).slice(0,2),x,yy+5)}
 field(left,y,"Customer",j.name);field(left+68,y,"Mobile",j.phone);field(left+136,y,"Vehicle number",j.reg);y+=17;
 field(left,y,"Make and model",j.model);field(left+68,y,"Odometer",(j.km||"-")+" km");field(left+136,y,"Fuel level",j.fuel);y+=17;
 field(left,y,"Next service date",j.nextServiceDate);field(left+68,y,"Next service at",(j.nextServiceKm||"-")+" km");y+=17;
 field(left,y,"Status",j.status);if(j.deliveredDate)field(left+68,y,"Delivered date",j.deliveredDate);y+=17;
 doc.setDrawColor(220,216,210);doc.setLineWidth(.3);doc.line(left,y,right,y);y+=6;
 function paragraph(label,value){doc.setTextColor(100,110,125);doc.setFontSize(8);doc.text(label,left,y);y+=5;doc.setTextColor(29,36,48);doc.setFontSize(9);var lines=doc.splitTextToSize(String(value||"-"),right-left);doc.text(lines,left,y);y+=Math.max(5,lines.length*4)+3}
 paragraph("Customer complaints",j.complaint);paragraph("Work to be done / parts used",j.work);
 field(left,y,"Total amount","Rs. "+(Number(j.totalAmount)||0).toLocaleString("en-IN"));y+=18;
 [["Before photos",j.before||[]],["After photos",j.after||[]]].forEach(function(group,idx){var x=left+idx*92;doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(20,33,61);doc.text(group[0],x,y);if(group[1].length){group[1].slice(0,2).forEach(function(img,n){try{doc.addImage(img,"JPEG",x+n*43,y+3,40,30,"","FAST")}catch(e){}})}else{doc.setDrawColor(220,216,210);doc.rect(x,y+3,84,20);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100,110,125);doc.text("No photos added",x+42,y+15,{align:"center"})}});
 return doc.output("blob")
}
async function shareJobCardPdf(j){
 var popup=window.open("about:blank","_blank");
 try{
  toast("Preparing job card PDF…");var JsPDF=await loadPdfLib(),logo=await loadLogoImage(),blob=buildJobCardPdf(j,JsPDF,logo),name=j.no+"-"+j.reg.replace(/[^a-z0-9-]/gi,"_")+".pdf",file=new File([blob],name,{type:"application/pdf"}),message=summary(j);
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
   try{if(popup)popup.close();await navigator.share({files:[file],text:message,title:"Ayya Two Wheeler "+j.no});return}
   catch(shareError){if(shareError&&shareError.name==="AbortError")return}
  }
  var url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  var digits=String(j.phone||"").replace(/\D/g,"");if(digits.length===10)digits="91"+digits;var wa="https://wa.me/"+digits+"?text="+encodeURIComponent(message+"\n\nPDF downloaded: "+name);
  if(popup)popup.location.href=wa;else window.location.href=wa;toast("PDF downloaded. Attach it in the WhatsApp chat.");setTimeout(function(){URL.revokeObjectURL(url)},60000)
 }catch(e){if(popup)popup.close();if(e&&e.name==="AbortError")return;console.error("Job card PDF error:",e);toast(e&&e.message?e.message:"Could not create/share the PDF. Please try again.")}
}
function loadLogoImage(){return new Promise(function(resolve,reject){var img=new Image();img.onload=function(){resolve(img)};img.onerror=function(){reject(new Error("Logo image could not be loaded from image/logo.png"))};img.src="image/logo.png"})}
function summary(j){
 return "*Ayya Two Wheeler - Job Card "+j.no+"*\nDate: "+j.date+"\nCustomer: "+j.name+"\nMobile: "+j.phone+"\nVehicle: "+j.reg+(j.model?" ("+j.model+")":"")+"\nOdometer: "+(j.km||"-")+" km | Fuel: "+j.fuel+"\nNext service: "+(j.nextServiceDate||"-")+" or at "+(j.nextServiceKm||"-")+" km\nComplaints: "+(j.complaint||"-")+"\nWork / parts: "+(j.work||"-")+"\nTotal amount: "+money(j.totalAmount)+"\nStatus: "+j.status+(j.deliveredDate?"\nDelivered date: "+j.deliveredDate:"")+"\nPhotos: "+((j.before||[]).length)+" before, "+((j.after||[]).length)+" after"}
function updateMsg(j){
 var m={"Received":"we have received your vehicle "+j.reg+" (Job card "+j.no+"). Our technicians will inspect it and update you shortly.",
 "In Progress":"work on your vehicle "+j.reg+" (Job card "+j.no+") is in progress. We will update you when it is complete.",
 "Waiting Parts":"your vehicle "+j.reg+" (Job card "+j.no+") is waiting for spare parts. We will inform you as soon as they arrive.",
 "Ready":"your vehicle "+j.reg+" (Job card "+j.no+") is ready for pickup. Total amount: "+money(j.totalAmount)+".",
 "Delivered":"thank you for choosing us. Your vehicle "+j.reg+" (Job card "+j.no+") has been delivered. Please visit again."};
 return "Hello "+j.name+", "+m[j.status]+"\n- Ayya Two Wheeler"}
function toFile(d,n){var a=d.split(","),b=atob(a[1]),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new File([u],n,{type:"image/jpeg"})}
async function share(j,text,pics,forceWa){
 var ph2=j.phone.replace(/\D/g,"");if(ph2.length===10)ph2="91"+ph2;
 if(!forceWa){
  try{
   var fs=[];
   if(pics){(j.before||[]).forEach(function(d,i){fs.push(toFile(d,j.no+"-before-"+(i+1)+".jpg"))});(j.after||[]).forEach(function(d,i){fs.push(toFile(d,j.no+"-after-"+(i+1)+".jpg"))})}
   if(fs.length&&navigator.canShare&&navigator.canShare({files:fs})){await navigator.share({text:text,files:fs});return}
   if(!pics&&navigator.share){await navigator.share({text:text});return}
  }catch(e){if(e&&e.name==="AbortError")return}
  if(pics)toast("This device cannot attach photos. Use Print / Save as PDF and send the file.")
 }
 window.open("https://wa.me/"+ph2+"?text="+encodeURIComponent(text),"_blank")}
load();showApp();




