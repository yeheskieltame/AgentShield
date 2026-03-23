/**
 * AgentShield HF Space Backend Server
 *
 * Runs on Hugging Face Spaces (Docker, port 7860).
 * - Coordinator agent always running in background
 * - Observer agent always running in background
 * - Demo scenarios triggered on demand via HTTP API
 */

import http from 'node:http';
import { ChildProcess, fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PORT = parseInt(process.env.PORT || '7860', 10);
const startTime = Date.now();

// Track background processes
let coordinatorProcess: ChildProcess | null = null;
let observerProcess: ChildProcess | null = null;
let demoProcess: ChildProcess | null = null;
let currentDemo: { scenario: string; startedAt: number } | null = null;

// ============================================
// Process Management
// ============================================

function startAgent(script: string, args: string[] = [], label: string): ChildProcess {
  const child = fork(
    path.join(PROJECT_ROOT, 'node_modules', '.bin', 'tsx'),
    [path.join(PROJECT_ROOT, script), ...args],
    {
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env },
    },
  );

  child.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      console.log(`[${label}] ${line}`);
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      console.error(`[${label}:err] ${line}`);
    }
  });

  child.on('exit', (code) => {
    console.log(`[${label}] Process exited with code ${code}`);
  });

  return child;
}

function startCoordinator() {
  if (coordinatorProcess && !coordinatorProcess.killed) return;
  console.log('[Server] Starting Coordinator agent...');
  coordinatorProcess = startAgent('agents/coordinator/index.ts', [], 'Coordinator');
}

function startObserver() {
  if (observerProcess && !observerProcess.killed) return;
  console.log('[Server] Starting Observer agent...');
  observerProcess = startAgent('agents/observer/index.ts', [], 'Observer');
}

function triggerDemo(scenario: 'crash' | 'whale' | 'normal'): boolean {
  if (demoProcess && !demoProcess.killed) {
    return false; // Already running
  }

  const scriptMap: Record<string, string> = {
    crash: 'agents/sentinel/scenarios/flash-crash.ts',
    whale: 'agents/sentinel/scenarios/whale-dump.ts',
    normal: 'agents/sentinel/scenarios/normal-trading.ts',
  };

  const script = scriptMap[scenario];
  if (!script) return false;

  console.log(`[Server] Triggering demo: ${scenario}`);
  currentDemo = { scenario, startedAt: Date.now() };

  demoProcess = startAgent(script, [], `Demo:${scenario}`);
  demoProcess.on('exit', () => {
    console.log(`[Server] Demo ${scenario} completed.`);
    currentDemo = null;
    demoProcess = null;
  });

  return true;
}

function stopDemo() {
  if (demoProcess && !demoProcess.killed) {
    demoProcess.kill('SIGTERM');
    demoProcess = null;
    currentDemo = null;
    console.log('[Server] Demo stopped.');
  }
}

// ============================================
// HTTP Server
// ============================================

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const method = req.method || 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/health' && method === 'GET') {
    return json(res, 200, {
      status: 'online',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      agents: {
        coordinator: coordinatorProcess !== null && !coordinatorProcess.killed,
        observer: observerProcess !== null && !observerProcess.killed,
        sentinels: demoProcess && !demoProcess.killed ? 3 : 0,
      },
      demo: currentDemo
        ? { running: true, scenario: currentDemo.scenario, elapsed: Math.floor((Date.now() - currentDemo.startedAt) / 1000) }
        : { running: false, scenario: null },
    });
  }

  // Trigger demo
  if (url.pathname.startsWith('/demo/') && method === 'POST') {
    const scenario = url.pathname.split('/')[2];

    if (scenario === 'stop') {
      stopDemo();
      return json(res, 200, { ok: true, message: 'Demo stopped' });
    }

    if (!['crash', 'whale', 'normal'].includes(scenario)) {
      return json(res, 400, { error: 'Invalid scenario. Use: crash, whale, normal' });
    }

    const started = triggerDemo(scenario as 'crash' | 'whale' | 'normal');
    if (!started) {
      return json(res, 409, { error: 'A demo is already running. Stop it first via POST /demo/stop' });
    }

    return json(res, 200, {
      ok: true,
      scenario,
      message: `Demo "${scenario}" started. Monitor the dashboard for real-time updates.`,
    });
  }

  // Root — simple landing
  if (url.pathname === '/' && method === 'GET') {
    return json(res, 200, {
      name: 'AgentShield Backend',
      version: '1.0.0',
      description: 'DeFi Circuit Breaker Protocol — Agent Backend',
      endpoints: {
        'GET /health': 'Backend and agent status',
        'POST /demo/crash': 'Trigger flash crash simulation',
        'POST /demo/whale': 'Trigger whale dump simulation',
        'POST /demo/normal': 'Trigger normal trading simulation',
        'POST /demo/stop': 'Stop running demo',
      },
    });
  }

  json(res, 404, { error: 'Not found' });
});

// ============================================
// Startup
// ============================================

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] AgentShield Backend running on port ${PORT}`);
  console.log(`[Server] Health: http://localhost:${PORT}/health`);

  // Auto-start coordinator and observer
  startCoordinator();
  startObserver();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down...');
  coordinatorProcess?.kill('SIGTERM');
  observerProcess?.kill('SIGTERM');
  demoProcess?.kill('SIGTERM');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down...');
  coordinatorProcess?.kill('SIGTERM');
  observerProcess?.kill('SIGTERM');
  demoProcess?.kill('SIGTERM');
  server.close(() => process.exit(0));
});
