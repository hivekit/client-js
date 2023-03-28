import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('History Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA;

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


    it('creates object A and updates it twice', async function () {
        this.timeout(10000);
        objectIdA = client.getId('object-a');
        realmA.object.set(objectIdA, {
            location: {
                longitude: 13,
                latitude: 52
            },
            data: {
                valueA: 1
            }
        });
        realmA.object.set(objectIdA, {
            location: {
                longitude: 14,
                latitude: 53
            },
            data: {
                valueA: 2,
                valueB: 1
            }
        });
        realmA.object.set(objectIdA, {
            location: {
                longitude: 15,
                latitude: 54
            },
            data: {
                valueB: 2
            }
        });
        await sleep(6000);
    });

    it('retrieves the correct history', async function () {
        const history = await realmA.history.get(objectIdA, {
            startTime: new Date(Date.now() - 1000000),
            endTime: new Date()
        })

        expect(history[0].location.longitude).to.equal(13);
        expect(history[0].location.latitude).to.equal(52);
        expect(history[0].data).to.deep.equal({ valueA: 1 });

        expect(history[1].location.longitude).to.equal(14);
        expect(history[1].location.latitude).to.equal(53);
        expect(history[1].data).to.deep.equal({ valueA: 2, valueB: 1 });

        expect(history[2].location.longitude).to.equal(15);
        expect(history[2].location.latitude).to.equal(54);
        expect(history[2].data).to.deep.equal({ valueA: 2, valueB: 2 });
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});