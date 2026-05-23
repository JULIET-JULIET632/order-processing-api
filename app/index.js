const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// METRICS SETUP
// prom-client collects default Node.js metrics
// CPU, memory, event loop lag etc
// Prometheus will scrape /metrics every 15 seconds
// ─────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metric — counts every HTTP request
// Labels: method (GET/POST), route (/orders), status (200/500)
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// Custom metric — measures how long requests take
// This is what gives us p95 response time in Grafana
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 3],
  registers: [register]
});

// ─────────────────────────────────────────
// MIDDLEWARE
// Runs on every request before hitting the route
// Records metrics automatically for all endpoints
// ─────────────────────────────────────────
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
    end({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  next();
});

app.use(express.json());

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

// Health endpoint — used by Kubernetes readiness
// and liveness probes to check if app is alive
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint — Prometheus scrapes this
// every 15 seconds to collect all metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Orders endpoints — simulates a real API
app.get('/orders', (req, res) => {
  res.status(200).json({
    orders: [
      { id: '001', item: 'Laptop', status: 'shipped' },
      { id: '002', item: 'Phone', status: 'processing' },
      { id: '003', item: 'Tablet', status: 'delivered' }
    ]
  });
});

app.post('/orders', (req, res) => {
  const { item } = req.body;
  if (!item) {
    return res.status(400).json({ error: 'item is required' });
  }
  res.status(201).json({
    id: Date.now().toString(),
    item,
    status: 'created',
    timestamp: new Date().toISOString()
  });
});

// Simulate error endpoint — we'll use this later
// to deliberately trigger the automatic rollback
app.get('/simulate-error', (req, res) => {
  res.status(500).json({ error: 'Simulated failure for rollback testing' });
});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Order Processing API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
});
