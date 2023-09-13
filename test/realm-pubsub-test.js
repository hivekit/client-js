import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('Realm PubSub Test', function () {
    var clientA,
        clientB,
        realmIdA,
        realmInstanceA,
        realmInstanceB,
        clientAUpdateMsg = null,
        clientBUpdateMsg = null,
        eventA,
        eventB;

    it('creates and authenticates clientA', async function () {
        clientA = new HivekitClient({ logErrors: true, logMessages: false });
        await clientA.connect(config.wsUrl);
        await clientA.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(clientA.connectionStatus === clientA.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates and authenticates clientB', async function () {
        clientB = new HivekitClient({ logErrors: true, logMessages: false });
        await clientB.connect(config.wsUrl);
        await clientB.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(clientB.connectionStatus === clientB.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates a realm with client a and retrieves it', async function () {
        realmIdA = clientA.getId('realm-a');
        await clientA.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        realmInstanceA = await clientA.realm.get(realmIdA);
    });

    it('subscribes to event a', async function () {
        eventA = clientA.getId('event-a');
        await realmInstanceA.pubsub.subscribe(eventA, msg => {
            clientAUpdateMsg = msg
        })
    })

    it('publishes event a from client b', async function () {
        realmInstanceB = await clientB.realm.get(realmIdA);
        await realmInstanceB.pubsub.publish(eventA, {
            firstname: 'Max'
        });
    })

    it('received the event update', async function () {
        await sleep(400);
        expect(clientAUpdateMsg).to.deep.equal({
            firstname: 'Max'
        })
    })

    it('subscribes to event b on both', async function () {
        eventB = clientA.getId('event-B');
        await realmInstanceA.pubsub.subscribe(eventB, msg => {
            clientAUpdateMsg = msg
        })
        await realmInstanceB.pubsub.subscribe(eventB, msg => {
            clientBUpdateMsg = msg
        })
        clientAUpdateMsg = null;
        clientBUpdateMsg = null;
    })

    it('publishes event b from client a', async function () {
        await realmInstanceA.pubsub.publish(eventB, {
            some: 'value'
        });
    })

    it('received the event update on both', async function () {
        await sleep(400);
        expect(clientAUpdateMsg).to.deep.equal({ some: 'value' })
        expect(clientBUpdateMsg).to.deep.equal({ some: 'value' })
    })

    it('unsubscribes client b from event b', async function () {
        await realmInstanceB.pubsub.unsubscribe(eventB)
        clientAUpdateMsg = null;
        clientBUpdateMsg = null;
    })

    it('publishes event b from client b', async function () {
        await realmInstanceB.pubsub.publish(eventB, {
            third: 'try'
        });
    })

    it('received the event update on client A only', async function () {
        await sleep(400);
        expect(clientAUpdateMsg).to.deep.equal({ third: 'try' })
        expect(clientBUpdateMsg).to.equal(null)
    })

    it('closes the client', async function () {
        await clientA.disconnect();
        await clientB.disconnect();
    });
});