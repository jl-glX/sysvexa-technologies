// Wrangler generates configured bindings. Deployed secrets are intentionally
// absent from wrangler.jsonc, so their type is merged here without a value.
interface Env {
  TURNSTILE_SECRET_KEY: string;
}
