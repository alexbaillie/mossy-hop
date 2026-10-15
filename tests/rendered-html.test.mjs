import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the game page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Mossy Hop<\/title>/);
  assert.match(html, /Ten worlds\. Your pace\./i);
  assert.match(html, /Enter the meadow/);
});

test("sets social preview metadata", async () => {
  const html = await (await render()).text();
  assert.match(html, /property="og:image" content="https:\/\/[^"]+\/og\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});
