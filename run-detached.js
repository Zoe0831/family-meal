const { spawn } = require('child_process');
const http = require('http');

// 启动 server
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  detached: false,
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', d => process.stdout.write('[srv] ' + d));
server.stderr.on('data', d => process.stderr.write('[err] ' + d));
server.on('exit', code => { console.log('Server exited:', code); process.exit(code || 0); });

console.log('Server PID:', server.pid);
console.log('Will run until killed. Press Ctrl+C to stop.');
