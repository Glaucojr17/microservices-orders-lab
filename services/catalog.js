const http = require('node:http');

const products = Object.freeze({
  teclado: { id: 'teclado', name: 'Teclado mecânico', priceCents: 23990 },
  mouse: { id: 'mouse', name: 'Mouse ergonômico', priceCents: 12990 },
});

function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (req.url === '/health' && req.method === 'GET') {
    res.end(JSON.stringify({ status: 'ok', service: 'catalog' }));
    return;
  }
  if (req.method === 'GET' && req.url === '/products') {
    res.end(JSON.stringify(Object.values(products)));
    return;
  }
  const match = /^\/products\/([a-z0-9-]+)$/.exec(req.url || '');
  if (req.method === 'GET' && match) {
    const product = products[match[1]];
    res.statusCode = product ? 200 : 404;
    res.end(JSON.stringify(product || { error: 'Produto não encontrado' }));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
}

if (require.main === module) {
  http.createServer(handler).listen(Number(process.env.PORT || 3001), '0.0.0.0');
}
module.exports = { handler, products };
