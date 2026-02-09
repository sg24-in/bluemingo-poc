const http = require('http');

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
  });
}

function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname,
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const login = await httpPost('http://localhost:8080/api/auth/login', { email: 'admin@mes.com', password: 'admin123' }, {});
  const auth = { Authorization: `Bearer ${login.accessToken}` };

  // Check orders
  const orders = await httpGet('http://localhost:8080/api/orders', auth);
  const maxOrderId = Math.max(...orders.map(o => o.orderId));
  const maxLineItemId = Math.max(...orders.flatMap(o => o.lineItems.map(li => li.orderLineId)));
  const maxOpId = Math.max(...orders.flatMap(o => o.lineItems.flatMap(li => (li.operations || []).map(op => op.operationId))));
  console.log(`Orders: ${orders.length}, max orderId=${maxOrderId}`);
  console.log(`Line items: max orderLineId=${maxLineItemId}`);
  console.log(`Operations: max operationId=${maxOpId}`);

  // Check customers
  const customers = await httpGet('http://localhost:8080/api/customers', auth);
  console.log(`Customers: ${customers.length}`);
  customers.forEach(c => console.log(`  ${c.customerCode}: ${c.customerName}`));

  // Check products
  const products = await httpGet('http://localhost:8080/api/products', auth);
  console.log(`\nProducts: ${products.length}`);
  products.forEach(p => console.log(`  ${p.sku}: ${p.productName}`));

  // Check order statuses
  const statusCounts = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  console.log('\nOrder status distribution:', statusCounts);

  // Orders NOT returned by /api/orders (completed, cancelled, etc.)
  console.log('\nOrder numbers returned:', orders.map(o => o.orderNumber).join(', '));
})();
