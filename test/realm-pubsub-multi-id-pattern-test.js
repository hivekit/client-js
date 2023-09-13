import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('Realm PubSub Test', function () {
    var clientA,
        realmIdA,
        realmInstanceA,
        updatesWithoutIdPatterns = [],
        updatesWithIdPatterns = [],
        eventA;

    it('creates and authenticates clientA', async function () {
        clientA = new HivekitClient({ logErrors: true, logMessages: false });
        await clientA.connect(config.wsUrl);
        await clientA.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(clientA.connectionStatus === clientA.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates a realm with client a and retrieves it', async function () {
        realmIdA = clientA.getId('realm-a');
        await clientA.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        realmInstanceA = await clientA.realm.get(realmIdA);
    });

    it('subscribes to event a without an id pattern', async function () {
        eventA = clientA.getId('event-a');
        await realmInstanceA.pubsub.subscribe(eventA, msg => {
            updatesWithoutIdPatterns.push(msg);
        })
    })

    it('subscribes to event a with an id pattern', async function () {
        await realmInstanceA.pubsub.subscribe(eventA, 'some-id', msg => {
            updatesWithIdPatterns.push(msg);
        })
    })

    it('publishes event a from client a', async function () {
        await realmInstanceA.pubsub.publish(eventA, 'some-id', {
            msg: 'A'
        });
        await realmInstanceA.pubsub.publish(eventA, 'another-id', {
            msg: 'B'
        });
        await sleep(400);
        console.log(updatesWithoutIdPatterns, updatesWithIdPatterns)
    })

    it('received the events for the subscription with id patterns', async function () {
        expect(updatesWithoutIdPatterns).to.deep.equal([{ msg: 'A' }, { msg: 'B' }]);
    })

    it('received the events for the subscription with id patterns', async function () {
        expect(updatesWithIdPatterns).to.deep.equal([{ msg: 'A' }]);
    })

    it('closes the client', async function () {
        await clientA.disconnect();
    });
});