import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('Subscription Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA,
        objectIdB,
        subscriptionUpdates = [];

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: true, logMessages: false });
        await client.connect(config.wsUrl);
        await client.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(client.connectionStatus === client.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates realm A', async function () {
        realmIdA = client.getId('realm-a');
        await client.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        realmA = await client.realm.get(realmIdA);
        expect(realmA.id).to.equal(realmIdA);
    });

    it('creates object A ', async function () {
        objectIdA = client.getId('object-a');
        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        await realmA.object.create(objectIdA, { label: 'Object A Label', location });
    });

    it('creates a subscription with object a as a target', async function () {
        const subscriptionOptions = {
            target: {
                id: objectIdA,
                r: 2000
            },
            where: ['$id!=' + objectIdA]
        }
        await realmA.object.subscribe(subscriptionOptions).then(subscription => {
            subscription.on('update', data => {
                subscriptionUpdates.push(data);
            });
        });
    });

    it('creates object B ', async function () {
        objectIdB = client.getId('object-b');
        const location = {
            longitude: 13.404953,
            latitude: 52.520007
        }

        await realmA.object.create(objectIdB, { label: 'Object B Label', location });
    });

    it('updates object A ', async function () {


        await realmA.object.create(objectIdA, {
            label: 'Object A Label', location: {
                longitude: 13.404953,
                latitude: 52.520009
            }
        });
    });

    it('waits', async function () {
        await sleep(200)
    })

    it('has received only one update for object b', () => {
        expect(Object.keys(subscriptionUpdates[0])).to.deep.equal([objectIdB]);
        expect(subscriptionUpdates[0][objectIdB].location.longitude).to.equal(13.404953);
    })

    it('closes the client', async function () {
        await client.disconnect();
    });
});


