import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('Presence Test', function () {
    var dataProviderClient,
        objectReaderClient,
        realmIdA,
        realmInstanceA,
        connectionStatusUpdateMsg = null,
        objectAId,
        objectA;

    it('creates and authenticates objectReaderClient', async function () {
        objectReaderClient = new HivekitClient({ logErrors: true, logMessages: false });
        await objectReaderClient.connect(config.wsUrl);
        await objectReaderClient.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(objectReaderClient.connectionStatus === objectReaderClient.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates a realm with objectReaderClient and retrieves it', async function () {
        realmIdA = objectReaderClient.getId('realm-a');
        await objectReaderClient.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        realmInstanceA = await objectReaderClient.realm.get(realmIdA);
    });

    it('subscribes to connection status updates', async function () {
        await realmInstanceA.pubsub.subscribe('connectionStatusChanged', function (a, b) {
            connectionStatusUpdateMsg = Array.from(arguments)
        })
    })

    it('creates an object with objectReaderClient and retrieves it', async function () {
        objectAId = objectReaderClient.getId('car/');
        await realmInstanceA.object.create(objectAId, { label: 'object a' })
        objectA = await realmInstanceA.object.get(objectAId);
        expect(objectA.connectionStatus).to.equal('disconnected');
        expect(connectionStatusUpdateMsg).to.equal(null)
    });

    it('creates and authenticates dataProviderClient', async function () {
        dataProviderClient = new HivekitClient({ logErrors: true, logMessages: false });
        await dataProviderClient.connect(config.wsUrl);
        const jstData = {
            sub: 'dataProviderClient',
            dpv: {
                [realmIdA]: [
                    'car/*'
                ]
            }
        }
        await dataProviderClient.authenticate(jwt.sign(jstData, config.authTokenSecret));
        expect(dataProviderClient.connectionStatus === dataProviderClient.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('received the connection status change', async function () {
        await sleep(400);
        expect(connectionStatusUpdateMsg).to.deep.equal([{ connectionStatus: 'connected' }, objectAId])

        objectA = await realmInstanceA.object.get(objectAId);
        expect(objectA.connectionStatus).to.equal('connected');
    })

    it('disconnects the data provider', async function () {
        await dataProviderClient.disconnect();
    })

    it('received the connection status change', async function () {
        await sleep(400);
        expect(connectionStatusUpdateMsg).to.deep.equal([{ connectionStatus: 'disconnected' }, objectAId])

        objectA = await realmInstanceA.object.get(objectAId);
        expect(objectA.connectionStatus).to.equal('disconnected');
    })

    it('closes the client', async function () {
        await objectReaderClient.disconnect();
    });
});