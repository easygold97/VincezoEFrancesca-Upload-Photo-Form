addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const CARTELLA = "/FotoMatrimonioVincenzo";

// Simple static file mapping
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
    return handleOptions(request);
  }

  if (pathname === "/api/upload" && request.method === "POST") {
    return uploadFile(request);
  }

  if (pathname === "/api/list" && request.method === "GET") {
    return listFiles(request);
  }

  if (pathname === "/api/temp-link" && request.method === "POST") {
    return getTemporaryLink(request);
  }

  // Serve static files
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

function handleOptions(request) {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function getDropboxToken() {
  const token = DROPBOX_TOKEN;
  if (!token) {
    return null;
  }
  return token;
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

  const args = {
    path: `${CARTELLA}/${Date.now()}_${file.name}`,
    mode: "add",
    autorename: true,
  };

  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify(args),
      "Content-Type": "application/octet-stream",
    },
    body: file.stream(),
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function listFiles(request) {
  const token = getDropboxToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "Dropbox token not configured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: CARTELLA }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function getTemporaryLink(request) {
  const token = getDropboxToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "Dropbox token not configured" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const body = await request.json();
  const path = body.path;
  if (!path) {
    return new Response(JSON.stringify({ error: "Path is required" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const response = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
		<img class="banner" src="assets/banner-wide.png">
		<img class="colonna" src="assets/colonna.png">
		<main>
			<section class="card">
				<h1>Vincenzo & Francesca 🌸</h1>
				<h2>Aiutaci a raccogliere i ricordi più belli del nostro matrimonio</h2>
				<p>Benvenuto nel nostro angolo dei ricordi.</p>
				<p>Durante questa giornata speciale scatterai sicuramente foto, video e momenti che magari noi non riusciremo a vedere.</p>
				<p>Caricali qui: finiranno direttamente nel nostro album privato del matrimonio. Non serve installare nessuna applicazione e non serve registrarsi.</p>
				<p>Scegli foto o video dal telefono e regalaci il tuo punto di vista di questa giornata speciale ❤️</p>

				<div class="upload-control">
					<input id="files" type="file" multiple accept="image/*,video/*" class="file-input">
					<label for="files" class="choose-btn">Scegli foto o video</label>
					<button class="upload-btn" onclick="uploadFiles()">Regala i tuoi ricordi 💕</button>
				</div>

				<div id="status"></div>

				<p class="firma">Grazie per essere parte della nostra storia.<br>Con affetto,<br>Vincenzo & Francesca</p>
			</section>

			<section class="card">
				<h2>Gli ultimi ricordi condivisi 🌷</h2>
				<p>Qui appariranno gli ultimi momenti caricati dagli invitati.</p>
				<div id="gallery"></div>
			</section>
		</main>
		<script src="script.js"><\/script>
	</body>
</html>`;

const styleCss = `body{margin:0;background:#fffafa;color:#6b5d4d;font-family:Georgia,serif;text-align:center;-webkit-font-smoothing:antialiased;font-size:18px;line-height:1.4}.banner{width:100%;height:140px;object-fit:cover;display:block}main{max-width:900px;margin:0 auto;padding:14px}.card{background:#fff5f3e8;border-radius:18px;padding:18px;margin:12px 0;box-shadow:0 8px 25px #0001}h1,h2{color:#b86b64;font-weight:normal;margin:8px 0}.choose-btn,.upload-btn,button{cursor:pointer;border:0;padding:14px 18px;border-radius:12px;font-size:18px;min-height:48px}.colonna{display:none}#gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}#gallery img,#gallery video{width:100%;border-radius:12px}.upload-control{display:flex;gap:12px;align-items:center;justify-content:center;margin:18px 0;flex-wrap:wrap}.file-input{display:none}.choose-btn{background:linear-gradient(135deg,#fff6f5,#ffeef0);color:#b86b64;border:2px solid rgba(184,107,100,0.06);box-shadow:0 6px 16px rgba(184,107,100,0.08);padding:12px 16px}.choose-btn:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(184,107,100,0.12)}.upload-btn{background:linear-gradient(90deg,#f49f9a,#d98980);color:#fff;box-shadow:0 6px 18px rgba(217,137,128,0.12)}.upload-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(217,137,128,0.18)}.upload-btn:active,.choose-btn:active{transform:translateY(0)}@media (max-width:420px){body{font-size:17px}.upload-control{flex-direction:column;align-items:stretch}.choose-btn,.upload-btn{width:100%}#gallery{grid-template-columns:repeat(2,1fr)}}@media (max-width:360px){.banner{height:110px}#gallery{grid-template-columns:1fr}.card{padding:14px;border-radius:14px}}.choose-btn:focus,.upload-btn:focus{outline:3px solid rgba(184,107,100,0.15);outline-offset:3px}`;

const scriptJs = `const CARTELLA = "/FotoMatrimonioVincenzo";async function uploadFiles() {const files = document.getElementById("files").files;if (!files.length) {return;}for (const file of files) {document.getElementById("status").innerText = "Caricamento " + file.name;const formData = new FormData();formData.append("file", file);const response = await fetch("/api/upload", {method: "POST",body: formData,});if (!response.ok) {const error = await response.text();document.getElementById("status").innerText = "Errore durante il caricamento di " + file.name;console.error(error);return;}}document.getElementById("status").innerText = "Grazie! Ricordi caricati ❤️";await caricaUltimi();}async function caricaUltimi() {const r = await fetch("/api/list");if (!r.ok) {console.error(await r.text());return;}const data = await r.json();const ultimi = (data.entries || []).sort((a, b) => b.client_modified.localeCompare(a.client_modified)).slice(0, 5);const g = document.getElementById("gallery");g.innerHTML = "";for (const f of ultimi) {const l = await fetch("/api/temp-link", {method: "POST",headers: { "Content-Type": "application/json" },body: JSON.stringify({ path: f.path_lower }),});if (!l.ok) {console.error(await l.text());continue;}const link = (await l.json()).link;const e = f.name.match(/mp4|mov/i) ? document.createElement("video") : document.createElement("img");e.src = link;if (e.tagName === "VIDEO") {e.controls = true;}g.appendChild(e);}}caricaUltimi();setInterval(caricaUltimi, 30000);`;
