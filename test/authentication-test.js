import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('Authentication Test', function () {
    var client;

    it('creates the client without options', async function () {
        client = new HivekitClient();
        expect(client.connectionStatus).to.equal(client.constants.CONNECTION_STATUS.DISCONNECTED);
    });

    it('attempts to authenticate the client before connecting it', function (done) {
        client.authenticate(jwt.sign({ sub: 'userName' }, 'invalid secret')).then(() => {
            expect('it').to.equal('should not get here');
        }).catch(e => {
            expect(e).to.equal('can\'t authenticate: client not connected. Did you call .connect() before calling .authenticate()?')
            done();
        })
    });

    it('disconnects the client before it connected', function (done) {
        client.disconnect().catch(e => {
            expect(e).to.equal('client not connected')
            done();
        })
    });

    it('connects the client', async function () {
        await client.connect(config.wsUrl);
        expect(client.connectionStatus).to.equal(client.constants.CONNECTION_STATUS.CONNECTED);
    })
    it('fails to authenticate with an invalid token', function (done) {
        client.authenticate(jwt.sign({ sub: 'userName' }, 'invalid secret')).catch(e => {
            expect(e.includes('signature is invalid')).to.equal(true);
            done();
        })
    });
    it('disconnects the client', async function () {
        await client.disconnect();
    })
});