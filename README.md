# VincezoEFrancesca-Upload-Photo-Form
VincezoEFrancesca Upload Photo Form

## Cloudflare Worker
Questo progetto ora usa un Cloudflare Worker per nascondere il token Dropbox e inviare le richieste solo dal server.

### Configurazione
1. Imposta `account_id` in `wrangler.toml` con il tuo Cloudflare account ID.

2. Se vuoi che il worker aggiorni automaticamente il token Dropbox quando scade, configura il refresh token e le credenziali dell'app:

```bash
wrangler secret put DROPBOX_REFRESH_TOKEN
wrangler secret put DROPBOX_APP_KEY
wrangler secret put DROPBOX_APP_SECRET
```

3. Se preferisci un setup più semplice, usa un token di accesso diretto con `DROPBOX_TOKEN`:

```bash
wrangler secret put DROPBOX_TOKEN
```

> Nota: con `DROPBOX_TOKEN` diretto, il token non viene rinnovato automaticamente. Per il refresh automatico devi usare `DROPBOX_REFRESH_TOKEN`, `DROPBOX_APP_KEY` e `DROPBOX_APP_SECRET`.

### Ottenere un refresh token Dropbox
1. Crea un'app Dropbox su https://www.dropbox.com/developers/apps.
2. Imposta il tipo di accesso su `Scoped access` e abilita il token di refresh (offline access).
3. Nel pannello dell'app, genera un refresh token oppure usa un flusso OAuth con `token_access_type=offline`.
4. Salva il refresh token e impostalo come secret Cloudflare.

4. Pubblica il worker:

```bash
wrangler publish
```

### Configurazione assistita
Se vuoi, puoi usare lo script di setup per impostare i segreti Dropbox in modo guidato:

```bash
bash setup-dropbox-secrets.sh
```

### Come funziona
- Il frontend chiama `/api/upload` per caricare i file.
- Il worker esegue le chiamate a Dropbox usando il token segreto.
- Il token Dropbox non è più esposto nel client.
