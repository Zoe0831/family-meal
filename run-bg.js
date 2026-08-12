// 后台启动 server
const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', ['server.js'], {
  cwd: path.join(__dirname),
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit'],
  windowsHide: true
});

server.unref();
console.log('Server started, PID:', server.pid);
console.log('Open http://localhost:3000 in browser');
process.exit(0);
