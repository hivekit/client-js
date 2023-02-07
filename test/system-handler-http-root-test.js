import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'

describe('System Handler HTTP Root', function () {
    var client;

    it('creates the client', async function () {
        client = new HivekitClient({
            logErrors: true,
            logMessages: false
        });
        expect(client.system.getHttpRoot()).to.equal(null);
    });

    it('retrieves httpRoot from document location', function () {
        global.document = { location: { href: 'https://hivekit.io/somepath' } };
        expect(client.system.getHttpRoot()).to.equal('https://hivekit.io');

        global.document = { location: { href: 'http://hivekit.io/aa/bb/cc?d=e&f=h' } };
        expect(client.system.getHttpRoot()).to.equal('http://hivekit.io');
    })

    it('retrieves httpRoot from websocket ur', async function () {
        await client.connect(config.wsUrl);
        expect(client.system.getHttpRoot()).to.equal('http://127.0.0.1:8090');
    })

    it('disconnects the client', async function () {
        await client.disconnect();
    })

    it('retrieves url from config parameter', async function () {
        const httpRoot = 'http://thisexactone.com/a'
        client = new HivekitClient({
            logErrors: true,
            logMessages: false,
            httpRoot: 'http://thisexactone.com/a'
        });
        await client.connect(config.wsUrl);
        global.document = { location: { href: 'https://hivekit.io/somepath' } };
        expect(client.system.getHttpRoot()).to.equal(httpRoot);
        await client.disconnect();
        delete global.document;
    });
});