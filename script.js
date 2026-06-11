const API_BASE = document.documentElement.dataset.apiBase || "https://vincezofrancesca-upload-photo-form.bitter-math-a7a4.workers.dev";

function apiUrl(path){
 return API_BASE.replace(/\/$/, "") + path;
}

async function uploadFiles(){
 const files=document.getElementById("files").files;
 if(!files.length){
  document.getElementById("status").innerText = "Seleziona prima almeno un file.";
  return;
 }
 try{
  for(const file of files){
   document.getElementById("status").innerText = "Caricamento " + file.name;
   const formData = new FormData();
   formData.append("file", file);
   const response = await fetch(apiUrl("/api/upload"), {
    method: "POST",
    body: formData,
   });
   const body = await response.json().catch(() => null);
   if(!response.ok){
    throw new Error(body?.error || body?.error_summary || response.statusText);
   }
  }
  document.getElementById("status").innerText = "Grazie! Ricordi caricati ❤️";
  await caricaUltimi();
 }catch(error){
  console.error(error);
  document.getElementById("status").innerText = "Errore: " + error.message;
 }
}

async function caricaUltimi(){
 const r = await fetch(apiUrl("/api/recent"));
 if(!r.ok){
  const text = await r.text();
  console.error(text);
  document.getElementById("status").innerText = "Impossibile caricare la galleria.";
  return;
 }
 const files = await r.json();
 const g = document.getElementById("gallery");
 g.innerHTML = "";
 for(const f of files){
  const e = f.isVideo ? document.createElement("video") : document.createElement("img");
  e.src = f.link;
  if(f.isVideo){
   e.controls = true;
  }
  g.appendChild(e);
 }
}

caricaUltimi();
setInterval(caricaUltimi, 30000);
