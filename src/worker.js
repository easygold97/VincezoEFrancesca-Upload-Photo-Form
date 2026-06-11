addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const CARTELLA = "/FotoMatrimonioVincenzo";

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
