# VincezoEFrancesca-Upload-Photo-Form
VincezoEFrancesca Upload Photo Form

## Cloudflare Worker
Questo progetto ora usa un Cloudflare Worker per nascondere il token Dropbox e inviare le richieste solo dal server.

### Configurazione
1. Imposta `account_id` in `wrangler.toml` con il tuo Cloudflare account ID.
2. Crea il secret Dropbox nel tuo account Cloudflare:

```bash
wrangler secret put DROPBOX_TOKEN
```

3. Pubblica il worker:

```bash
wrangler publish
```

### Come funziona
- Il frontend chiama `/api/upload` per caricare i file.
- Il worker esegue le chiamate a Dropbox usando il token segreto.
- Il token Dropbox non è più esposto nel client.
