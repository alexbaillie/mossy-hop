// Builds and deploys the game to Cloudflare Workers (https://mossy-hop.alexbaillie.workers.dev).
// The site URL is baked in at build time so link previews (og:image) point at this host.
// Log in first with `npx wrangler login`. Extra arguments are passed to `vinext deploy`.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://mossy-hop.alexbaillie.workers.dev";
const vinextCli = fileURLToPath(new URL("../node_modules/vinext/dist/cli.js", import.meta.url));

const result = spawnSync(process.execPath, [vinextCli, "deploy", "--name", "mossy-hop", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_SITE_URL: SITE_URL },
});
process.exit(result.status ?? 1);
