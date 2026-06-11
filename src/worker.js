addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const CARTELLA = "/FotoMatrimonioVincenzo";

const staticFiles = {
  "/": { body: indexHtml, contentType: "text/html" },
  "/index.html": { body: indexHtml, contentType: "text/html" },
  "/style.css": { body: styleCss, contentType: "text/css" },
  "/script.js": { body: scriptJs, contentType: "application/javascript" },
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === "OPTIONS") {
    return handleOptions();
  }

  if (pathname === "/api/upload" && request.method === "POST") {
    return uploadFile(request);
  }

  if (pathname === "/api/recent" && request.method === "GET") {
    return getRecentFiles();
  }

  if (staticFiles[pathname]) {
    const file = staticFiles[pathname];
    return new Response(file.body, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function handleOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getDropboxToken() {
  return DROPBOX_TOKEN || null;
}

async function uploadFile(request) {
  const token = getDropboxToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "Dropbox token not configured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return new Response(JSON.stringify({ error: "File is required" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const uploadPath = `${CARTELLA}/${Date.now()}_${file.name}`;
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({
        path: uploadPath,
        mode: "add",
        autorename: true,
      }),
      "Content-Type": "application/octet-stream",
    },
    body: file.stream(),
  });

  const payload = await response.text();
  return new Response(payload, {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function getRecentFiles() {
  const token = getDropboxToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "Dropbox token not configured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const listRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: CARTELLA }),
  });

  if (!listRes.ok) {
    const payload = await listRes.text();
    return new Response(payload, {
      status: listRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  const data = await listRes.json();
  const entries = (data.entries || [])
    .filter(entry => entry?.name)
    .sort((a, b) => (b.client_modified || "").localeCompare(a.client_modified || ""))
    .slice(0, 5);

  const files = await Promise.all(
    entries.map(async entry => {
      const path = entry.path_lower || entry.path_display;
      const tempRes = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });

      if (!tempRes.ok) {
        const errorText = await tempRes.text();
        throw new Error(errorText);
      }

      const tempData = await tempRes.json();
      return {
        name: entry.name,
        link: tempData.link,
        isVideo: /mp4|mov|webm/i.test(entry.name),
      };
    })
  );

  return new Response(JSON.stringify(files), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const indexHtml = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Vincenzo & Francesca</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <main>
      <section class="hero-card">
        <div class="hero-copy">
          <h1>Vincenzo & Francesca 🌸</h1>
          <p>Carica foto e video del matrimonio in modo semplice e sicuro. Nessuna registrazione richiesta.</p>
        </div>
      </section>

      <section class="card">
        <h2>Regala i tuoi ricordi</h2>
        <p>Seleziona file dal telefono e inviali direttamente nell'album privato del nostro matrimonio.</p>

        <div class="upload-control">
          <input id="files" type="file" multiple accept="image/*,video/*" class="file-input">
          <label for="files" class="choose-btn">Scegli foto o video</label>
          <button class="upload-btn" onclick="uploadFiles()">Invia i tuoi ricordi</button>
        </div>

        <div id="status" class="status"></div>
        <p class="note">Solo foto e video. I file vengono salvati direttamente su Dropbox e il token non viene mai esposto nel browser.</p>
      </section>

      <section class="card">
        <h2>Ultimi ricordi condivisi</h2>
        <div id="gallery"></div>
      </section>
    </main>

    <script src="script.js"></script>
  </body>
</html>`;

const styleCss = `:root{color-scheme:light}body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fff6f4;color:#5f453e;min-height:100vh}*{box-sizing:border-box}main{width:min(100%,980px);margin:0 auto;padding:18px}body::before{content:"";position:fixed;inset:0;background:radial-gradient(circle at top left,rgba(241,192,192,.24),transparent 26%),radial-gradient(circle at top right,rgba(218,151,147,.18),transparent 18%),radial-gradient(circle at bottom left,rgba(205,126,119,.16),transparent 18%);pointer-events:none;z-index:-1}
.hero-card{background:linear-gradient(180deg,#feefed,#ffffff);border:1px solid rgba(233,180,174,.56);border-radius:32px;padding:34px 24px;margin:18px 0;box-shadow:0 24px 60px rgba(124,72,62,.08);text-align:center}
.hero-copy h1{margin:0 0 12px;font-size:clamp(2.2rem,4vw,3.6rem);line-height:1.02;color:#b65c55}
.hero-copy p{margin:0;font-size:1.05rem;line-height:1.75;color:#6c514a;max-width:720px;margin-inline:auto}
.card{background:#fff;border-radius:28px;padding:26px 24px;margin:22px 0;box-shadow:0 16px 44px rgba(103,71,67,.08)}
.card h2{margin-top:0;color:#a25c51;font-size:1.55rem}
.card p{margin:0 0 14px;color:#6d524c;line-height:1.75}
.upload-control{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin:20px 0}
.file-input{display:none}
.choose-btn,.upload-btn{border-radius:16px;border:0;padding:0 20px;min-height:52px;font-size:1rem;font-weight:700;cursor:pointer;transition:transform .22s,box-shadow .22s}
.choose-btn{background:#fff2f0;color:#b85952;box-shadow:0 12px 30px rgba(184,89,82,.14)}
.upload-btn{background:linear-gradient(135deg,#c96f6c,#d5867f);color:#fff;box-shadow:0 14px 36px rgba(213,120,112,.18)}
.choose-btn:hover,.upload-btn:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(0,0,0,.12)}
.status{min-height:1.6rem;font-size:0.98rem;color:#6a4d48}
.note{margin-top:8px;font-size:0.95rem;color:#8b6d66}
#gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
#gallery img,#gallery video{width:100%;border-radius:18px;display:block;max-height:420px;object-fit:cover}
@media(max-width:720px){.upload-control{grid-template-columns:1fr}.choose-btn,.upload-btn{width:100%}}
@media(max-width:520px){main{padding:14px}.hero-card{padding:28px 18px}.card{padding:22px}.hero-copy h1{font-size:2.35rem}.#gallery{grid-template-columns:1fr}}
`;

const scriptJs = `async function uploadFiles(){
  const files = document.getElementById("files").files;
  const status = document.getElementById("status");
  if (!files.length) {
    status.innerText = "Seleziona prima almeno un file.";
    return;
  }

  try {
    for (const file of files) {
      status.innerText = "Caricamento " + file.name + "...";
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || payload?.error_summary || response.statusText);
      }
    }

    status.innerText = "Grazie! Ricordi caricati ❤️";
    await caricaUltimi();
  } catch (error) {
    console.error(error);
    document.getElementById("status").innerText = "Errore: " + error.message;
  }
}

async function caricaUltimi(){
  const status = document.getElementById("status");
  const response = await fetch("/api/recent");
  if (!response.ok) {
    const text = await response.text();
    console.error(text);
    status.innerText = "Impossibile caricare la galleria.";
    return;
  }

  const files = await response.json();
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  for (const file of files) {
    const element = file.isVideo ? document.createElement("video") : document.createElement("img");
    element.src = file.link;
    if (file.isVideo) {
      element.controls = true;
      element.muted = true;
      element.playsInline = true;
    }
    gallery.appendChild(element);
  }
}

caricaUltimi();
setInterval(caricaUltimi, 30000);`;
