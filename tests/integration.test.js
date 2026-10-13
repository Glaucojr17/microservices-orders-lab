const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { handler: catalog } = require('../services/catalog');
const { createHandler } = require('../services/orders');

async function start(handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

test('pedido consulta o catálogo, calcula em centavos e rejeita entradas ruins', async t => {
  const c = await start(catalog);
  const o = await start(createHandler({ catalogUrl: c.url }));
  t.after(() => { c.server.close(); o.server.close(); });
  const post = body => fetch(`${o.url}/orders`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const good = await post({ productId: 'teclado', quantity: 2 });
  assert.equal(good.status, 201);
  assert.equal((await good.json()).totalCents, 47980);
  assert.equal((await (await fetch(`${o.url}/orders`)).json()).length, 1);
  assert.equal((await post({ productId: 'teclado', quantity: 0 })).status, 400);
  assert.equal((await post({ productId: 'inexistente', quantity: 1 })).status, 404);
  assert.equal((await fetch(`${c.url}/health`)).status, 200);
});

test('falha de dependência retorna 503 sem gravar pedido', async t => {
  const o = await start(createHandler({ catalogUrl: 'http://127.0.0.1:1' }));
  t.after(() => o.server.close());
  const response = await fetch(`${o.url}/orders`, { method: 'POST', body: JSON.stringify({ productId: 'mouse', quantity: 1 }) });
  assert.equal(response.status, 503);
  assert.deepEqual(await (await fetch(`${o.url}/orders`)).json(), []);
});
