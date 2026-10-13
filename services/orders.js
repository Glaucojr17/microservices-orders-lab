const http = require('node:http');
const { randomUUID } = require('node:crypto');

function createHandler({ catalogUrl, request = fetch }) {
  const orders = new Map();
  return async (req, res) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && req.url === '/health') return send(200, { status: 'ok', service: 'orders' });
    if (req.method === 'GET' && req.url === '/orders') return send(200, [...orders.values()]);
    if (req.method !== 'POST' || req.url !== '/orders') return send(404, { error: 'Rota não encontrada' });
    let raw = '';
    try {
      for await (const part of req) {
        raw += part;
        if (raw.length > 8192) return send(413, { error: 'Requisição muito grande' });
      }
      const { productId, quantity } = JSON.parse(raw);
      if (!/^[a-z0-9-]+$/.test(productId || '') || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return send(400, { error: 'Informe productId e quantity entre 1 e 20' });
      }
      let productResponse;
      try {
        productResponse = await request(`${catalogUrl}/products/${productId}`, { signal: AbortSignal.timeout(2000) });
      } catch {
        return send(503, { error: 'Catálogo indisponível' });
      }
      if (productResponse.status === 404) return send(404, { error: 'Produto não encontrado' });
      if (!productResponse.ok) return send(503, { error: 'Catálogo indisponível' });
      const product = await productResponse.json();
      const order = { id: randomUUID(), productId, quantity, totalCents: product.priceCents * quantity, status: 'received' };
      orders.set(order.id, order);
      return send(201, order);
    } catch (err) {
      if (err instanceof SyntaxError) return send(400, { error: 'JSON inválido' });
      return send(503, { error: 'Falha ao consultar catálogo' });
    }
  };
}

if (require.main === module) {
  http.createServer(createHandler({ catalogUrl: process.env.CATALOG_URL || 'http://localhost:3001' }))
    .listen(Number(process.env.PORT || 3002), '0.0.0.0');
}
module.exports = { createHandler };
