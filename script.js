const CARTELLA = "/FotoMatrimonioVincenzo";

async function uploadFiles() {
  const files = document.getElementById("files").files;
  if (!files.length) {
    return;
  }

  for (const file of files) {
    document.getElementById("status").innerText = "Caricamento " + file.name;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      document.getElementById("status").innerText = "Errore durante il caricamento di " + file.name;
      console.error(error);
      return;
    }
  }

  document.getElementById("status").innerText = "Grazie! Ricordi caricati ❤️";
  await caricaUltimi();
}

async function caricaUltimi() {
  const r = await fetch("/api/list");
  if (!r.ok) {
    console.error(await r.text());
    return;
  }

  const data = await r.json();
  const ultimi = (data.entries || [])
    .sort((a, b) => b.client_modified.localeCompare(a.client_modified))
    .slice(0, 5);

  const g = document.getElementById("gallery");
  g.innerHTML = "";

  for (const f of ultimi) {
    const l = await fetch("/api/temp-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: f.path_lower }),
    });

    if (!l.ok) {
      console.error(await l.text());
      continue;
    }

    const link = (await l.json()).link;
    const e = f.name.match(/mp4|mov/i) ? document.createElement("video") : document.createElement("img");
    e.src = link;
    if (e.tagName === "VIDEO") {
      e.controls = true;
    }
    g.appendChild(e);
  }
}

caricaUltimi();
setInterval(caricaUltimi, 30000);
