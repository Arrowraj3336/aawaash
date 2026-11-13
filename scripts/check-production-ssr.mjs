// Exercise the built Worker entry in a server environment without browser globals.
// This catches browser-only dependencies accidentally shared into SSR chunks.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { default: app } = await import(pathToFileURL(path.resolve('dist/server/index.mjs')).href);
for (const route of ['/', '/projects/27th']) {
  const response = await app.fetch(new Request(`https://aawaash-property-workspace.we-rynovel.chatgpt.site${route}`), {}, { waitUntil() {} });
  const html = await response.text();
  assert.equal(response.status, 200, `${route} returned ${response.status}: ${html.slice(0, 180)}`);
  assert.match(html, /<html/i);
  assert.match(html, /Aawaash/i);
  console.log(`Production SSR ${route}: HTTP 200`);
}
