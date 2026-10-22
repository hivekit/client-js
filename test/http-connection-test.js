import { expect } from 'chai';
import { createServer } from 'node:http';
import HTTPConnection from '../src/http-connection.js';
import { C } from '../src/fields.js';

describe('HTTP connection', function () {
    let server, connection, requests, status, body, disconnect;

    before(function (done) {
        server = createServer(async (request, response) => {
            let requestBody = '';
            for await (const chunk of request) {
                requestBody += chunk;
            }
            requests.push({ method: request.method, headers: request.headers, body: requestBody });
            if (disconnect) {
                request.socket.destroy();
                return;
            }
            response.writeHead(status);
            response.end(body);
        });
        server.listen(0, '127.0.0.1', done);
    });

    after(function (done) {
        server.close(done);
        server.closeAllConnections();
    });

    beforeEach(function () {
        requests = [];
        status = 200;
        body = '[]';
        disconnect = false;
        connection = new HTTPConnection('http://127.0.0.1:' + server.address().port, null);
        connection.token = 'test-token';
    });

    function send(messages) {
        return new Promise(resolve => {
            connection.messageCallback = resolve;
            connection.send(typeof messages === 'string' ? messages : JSON.stringify(messages));
        });
    }

    it('requires authentication before sending', function () {
        connection.token = null;
        expect(() => connection.send('[]')).to.throw('HTTP Connection not yet authenticated');
        expect(requests).to.deep.equal([]);
    });

    it('posts JSON with a bearer token and delivers parsed messages', async function () {
        const messages = [{ cid: 'read', act: 'get' }];
        const data = [{ cid: 'read', res: 'suc', dat: { label: 'Café' } }];
        body = JSON.stringify(data);
        expect(await send(messages)).to.deep.equal({ data });
        expect(requests).to.have.lengthOf(1);
        expect(requests[0].method).to.equal('POST');
        expect(requests[0].headers.authorization).to.equal('Bearer test-token');
        expect(requests[0].headers['content-type']).to.equal('application/json');
        expect(requests[0].body).to.equal(JSON.stringify(messages));
    });

    it('acknowledges each set in a mixed batch while preserving other replies', async function () {
        const reply = { cid: 'read', res: 'suc', dat: {} };
        body = JSON.stringify([reply]);
        expect(await send([
            { cid: 'set-a', act: C.ACTION.SET },
            { cid: 'read', act: 'get' },
            { cid: 'set-b', act: C.ACTION.SET }
        ])).to.deep.equal({ data: [
            reply,
            { cid: 'set-a', res: 'suc' },
            { cid: 'set-b', res: 'suc' }
        ] });
    });

    it('does not acknowledge ordinary messages containing the word set', async function () {
        expect(await send([{ cid: 'read', act: 'get', id: 'set' }])).to.deep.equal({ data: [] });
    });

    it('forwards structured server errors and the request correlation ID', async function () {
        status = 401;
        body = JSON.stringify({ err: 'signature is invalid', erc: 401 });
        expect(await send([{ cid: 'auth', act: 'get' }])).to.deep.equal({
            data: [{ cid: 'auth', res: 'err', err: 'signature is invalid', erc: 401 }]
        });
    });

    it('forwards plain-text HTTP errors without acknowledging failed sets', async function () {
        status = 503;
        body = 'Service unavailable';
        expect(await send([{ cid: 'write', act: C.ACTION.SET }])).to.deep.equal({
            data: [{ cid: 'write', res: 'err', err: 'Service unavailable' }]
        });
    });

    it('forwards JSON string HTTP errors', async function () {
        status = 400;
        body = JSON.stringify('Invalid request');
        expect(await send([{ cid: 'bad', act: 'get' }])).to.deep.equal({
            data: [{ cid: 'bad', res: 'err', err: 'Invalid request' }]
        });
    });

    it('reports the HTTP status when an error response has no body', async function () {
        status = 500;
        body = '';
        expect(await send([{ cid: 'empty', act: 'get' }])).to.deep.equal({
            data: [{ cid: 'empty', res: 'err', err: 'Request failed with status code 500' }]
        });
    });

    it('handles failed requests without a correlation ID', async function () {
        status = 400;
        body = 'Invalid request';
        expect(await send('invalid JSON')).to.deep.equal({
            data: [{ res: 'err', err: 'Invalid request' }]
        });
    });

    it('reports network failures through the message callback', async function () {
        disconnect = true;
        const response = await send([{ cid: 'network', act: 'get' }]);
        expect(response.data).to.have.lengthOf(1);
        expect(response.data[0]).to.include({ cid: 'network', res: 'err' });
        expect(response.data[0].err).to.be.a('string').and.not.to.equal('');
    });
});

