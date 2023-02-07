import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('System Handler Server Stats', function () {
    var client;

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: true, logMessages: false });
        await client.connect(config.wsUrl);
        await client.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(client.connectionStatus === client.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('retrieves server stats', async function () {
        const serverStats = await client.system.getServerStats();
        expect(typeof serverStats.version).to.equal('string');
    });

    it('disconnects the client', async function () {
        await client.disconnect();
    })
});