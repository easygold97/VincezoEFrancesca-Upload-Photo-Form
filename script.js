const DROPBOX_TOKEN="INSERISCI_TOKEN_DROPBOX";
const CARTELLA="/FotoMatrimonioVincenzo";

async function uploadFiles(){
 const files=document.getElementById("files").files;
 for(const file of files){
  document.getElementById("status").innerText="Caricamento "+file.name;
  await fetch("https://content.dropboxapi.com/2/files/upload",{method:"POST",headers:{"Authorization":"Bearer "+DROPBOX_TOKEN,"Dropbox-API-Arg":JSON.stringify({path:CARTELLA+"/"+Date.now()+"_"+file.name,mode:"add",autorename:true}),"Content-Type":"application/octet-stream"},body:file});
 }
 document.getElementById("status").innerText="Grazie! Ricordi caricati ❤️";
 caricaUltimi();
}

async function caricaUltimi(){
 const r=await fetch("https://api.dropboxapi.com/2/files/list_folder",{method:"POST",headers:{"Authorization":"Bearer "+DROPBOX_TOKEN,"Content-Type":"application/json"},body:JSON.stringify({path:CARTELLA})});
 const data=await r.json();
 const ultimi=(data.entries||[]).sort((a,b)=>b.client_modified.localeCompare(a.client_modified)).slice(0,5);
 const g=document.getElementById("gallery"); g.innerHTML="";
 for(const f of ultimi){
  const l=await fetch("https://api.dropboxapi.com/2/files/get_temporary_link",{method:"POST",headers:{"Authorization":"Bearer "+DROPBOX_TOKEN,"Content-Type":"application/json"},body:JSON.stringify({path:f.path_lower})});
  const link=(await l.json()).link;
  let e=f.name.match(/mp4|mov/i)?document.createElement("video"):document.createElement("img");
  e.src=link;if(e.tagName==="VIDEO")e.controls=true;g.appendChild(e);
 }
}
caricaUltimi(); setInterval(caricaUltimi,30000);
