# 4N1F Publisher V1

Publisher V1 membuat package preview baru tanpa deploy Worker.

## Contract

- `4N1F_XXXXXXXXXXXX` = preview-only code.
- Source package disimpan di Cloudflare KV key `pkg:4N1F_XXXXXXXXXXXX`.
- Publish package tidak membuat `p_...`.
- `p_...` baru dibuat ketika user memilih **Open Live Editor**.
- Fetch tetap sistem terpisah dan tidak disentuh oleh Publisher V1.

## Queue format

Tambahkan tepat satu file JSON per commit ke:

`publisher/queue/4N1F_XXXXXXXXXXXX.json`

Minimal:

```json
{
  "package_key": "4N1F_0123456789AB",
  "project": "experiment-name",
  "version": "v1",
  "html_code": "<main>Hello</main>",
  "css_code": "main{font-family:sans-serif}",
  "js_code": ""
}
```

Workflow `4N1F Publisher V1` akan:

1. memvalidasi key dan source,
2. menghitung SHA-256 source,
3. menulis package langsung ke namespace KV canonical,
4. membaca ulang package untuk verifikasi,
5. smoke-test resolver production `/api/kv-package`.

Tidak ada `wrangler deploy` pada workflow publisher.
