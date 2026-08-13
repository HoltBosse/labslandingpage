import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain; charset=utf-8',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

function send(res, statusCode, body, headers = {}) {
	res.writeHead(statusCode, headers);
	res.end(body);
}

const server = http.createServer((req, res) => {
	if (req.method !== 'GET' && req.method !== 'HEAD') {
		return send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
	}

	let requestPath;
	try {
		requestPath = decodeURIComponent(req.url.split('?')[0]);
	} catch {
		return send(res, 400, 'Bad request');
	}

	if (requestPath.includes('\0')) {
		return send(res, 400, 'Bad request');
	}

	if (requestPath === '/') requestPath = '/index.html';

	const filePath = path.normalize(path.join(ROOT, requestPath));

	if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
		return send(res, 403, 'Forbidden');
	}

	fs.readFile(filePath, (err, data) => {
		if (err) {
			if (err.code === 'ENOENT') {
				return fs.readFile(path.join(ROOT, '404.html'), (notFoundErr, notFoundData) => {
					if (notFoundErr) return send(res, 404, 'Not found');
					send(res, 404, notFoundData, { 'Content-Type': MIME_TYPES['.html'] });
				});
			}
			if (err.code === 'EISDIR') {
				return send(res, 403, 'Forbidden');
			}
			return send(res, 500, 'Internal server error');
		}
		const ext = path.extname(filePath).toLowerCase();
		const contentType = MIME_TYPES[ext] || 'application/octet-stream';
		send(res, 200, data, { 'Content-Type': contentType });
	});
});

process.on('uncaughtException', (err) => {
	console.error('Uncaught exception (server kept running):', err);
});

server.requestTimeout = 30000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;

server.listen(PORT, HOST, () => {
	console.log(`Serving ${ROOT} at http://${HOST}:${PORT}`);
});