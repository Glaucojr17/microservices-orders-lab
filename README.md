# Pedidos entre microsserviços

Um pedido simples atravessa dois serviços: **orders** valida a entrada, consulta **catalog** pela rede e calcula o total em centavos. Montei este laboratório para deixar visíveis tanto o caminho feliz quanto o comportamento quando a dependência cai. É o tipo de integração que precisa de timeout e resposta compreensível antes de ir para um ambiente maior.

## Executar

Requisitos: Docker com Compose. `docker compose up --build --wait`. A API de pedidos fica em `http://localhost:3002`.

```bash
curl -sS -X POST http://localhost:3002/orders \
  -H 'Content-Type: application/json' \
  -d '{"productId":"teclado","quantity":2}'
curl -sS http://localhost:3002/orders
docker compose down
```

Para testar sem Docker: `npm test` (Node.js 22+). Os testes levantam servidores temporários, criam um pedido, verificam o cálculo, entradas inválidas e indisponibilidade do catálogo. O CI também sobe os containers e faz uma chamada pela rede do Compose.

## Decisões e limites

- Dois processos independentes, comunicando-se por HTTP; `CATALOG_URL` é configurado por ambiente.
- `orders` usa timeout de 2 segundos e responde 503 se não conseguir consultar o catálogo. `/health` verifica apenas o próprio processo: não transforma a falha do catálogo em reinícios em cascata.
- O estado dos pedidos é **em memória**, apenas para homologação. Não há banco, autenticação, reserva de estoque ou garantia de idempotência. Para produção, eu adicionei persistência, autenticação, chave de idempotência, logs com request ID e métricas.
