import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Keep default OpenNext configuration. Avoid specifying unknown properties that
// the typed API does not accept (e.g. 'assets'). OpenNext will handle assets
// produced under .open-next automatically.
export default defineCloudflareConfig();