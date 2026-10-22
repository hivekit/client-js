import { expect } from 'chai';
import HivekitClient from '../src/index-node.js';

describe('ID generation', function () {
    it('preserves prefixes and the 21-character URL-safe suffix', function () {
        const client = new HivekitClient();
        for (const prefix of ['realm', 'object-subscription', 'car/', '']) {
            const id = client.getId(prefix);
            expect(id.slice(0, prefix.length + 1)).to.equal(prefix + '-');
            expect(id.slice(prefix.length + 1)).to.match(/^[A-Za-z0-9_-]{21}$/);
        }
    });

    it('generates distinct IDs across client instances', function () {
        const clients = [new HivekitClient(), new HivekitClient()];
        const ids = new Set();
        for (let i = 0; i < 1000; i++) {
            ids.add(clients[i % clients.length].getId('object'));
        }
        expect(ids.size).to.equal(1000);
    });

    it('correlates out-of-order replies and coalesces identical requests', function () {
        const client = new HivekitClient({ logErrors: false });
        const replies = [];
        for (const id of ['alpha', 'beta', 'gamma', 'alpha']) {
            client._sendRequest({ typ: 'rea', act: 'get', id }, response => {
                replies.push([id, response.dat]);
            });
        }

        const requests = client._pendingMessages;
        expect(requests).to.have.lengthOf(3);
        expect(new Set(requests.map(request => request.cid)).size).to.equal(3);
        for (const request of [...requests].reverse()) {
            expect(request.cid).to.match(/^[A-Za-z0-9_-]{21}$/);
            client._onMessage({ data: JSON.stringify([{
                cid: request.cid, res: 'suc', dat: request.id + '-result'
            }]) });
        }
        expect(replies).to.deep.equal([
            ['gamma', 'gamma-result'],
            ['beta', 'beta-result'],
            ['alpha', 'alpha-result'],
            ['alpha', 'alpha-result']
        ]);
        expect(client._pendingRequests).to.deep.equal({});
    });
});
