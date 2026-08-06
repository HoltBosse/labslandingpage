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
	let requestPath = decodeURIComponent(req.url.split('?')[0]);
	if (requestPath === '/') requestPath = '/index.html';

	const filePath = path.normalize(path.join(ROOT, requestPath));

	// Prevent path traversal outside the project root.
	if (!filePath.startsWith(ROOT)) {
		return send(res, 403, 'Forbidden');
	}

	fs.readFile(filePath, (err, data) => {
		if (err) {
			if (err.code === 'ENOENT') return send(res, 404, 'Not found');
			return send(res, 500, 'Internal server error');
		}
		const ext = path.extname(filePath).toLowerCase();
		const contentType = MIME_TYPES[ext] || 'application/octet-stream';
		send(res, 200, data, { 'Content-Type': contentType });
	});
});

server.listen(PORT, HOST, () => {
	console.log(`Serving ${ROOT} at http://${HOST}:${PORT}`);
});
