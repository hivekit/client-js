import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('Object Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA,
        objectIdB,
        objectIdC,
        objectIdD,
        objectIdE,
        objectIdF,
        subscriptionB,
        subscriptionC,
        subscriptionMessageCount = 0,
        lastSubscriptionMessage,
        subscriptionBMessageCount = 0,
        lastSubscriptionBMessage,
        subscriptionCMessageCount = 0,
        lastSubscriptionCMessage;

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

    it('subscribes to all objects', async function () {
        const subscription = await realmA.object.subscribe();
        subscription.on('update', data => {
            lastSubscriptionMessage = data;
            subscriptionMessageCount++;
        });
        subscriptionB = await realmA.object.subscribe();
        subscriptionB.on('update', data => {
            lastSubscriptionBMessage = data;
            subscriptionBMessageCount++;
        });
        subscriptionC = await realmA.object.subscribe({
            shape: { x1: 12.5, y1: 50.5, x2: 13.5, y2: 51.5 }
        })
        subscriptionC.on('update', data => {
            lastSubscriptionCMessage = data
            subscriptionCMessageCount++
        })
    })

    it('creates object A and retrieves it', async function () {
        objectIdA = client.getId('object-a');
        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        const data = {
            type: 'scooter',
            charge: 0.5
        }

        await realmA.object.create(objectIdA, { label: 'Object A Label', location, data });
        const objectA = await realmA.object.get(objectIdA);
        expect(objectA.data).to.deep.equal(data);
        expect(objectA.location.latitude).to.equal(location.latitude);
        expect(objectA.location.altitude).to.equal(0);
        expect(objectA.label).to.equal('Object A Label');
    });

    it('creates object B and C ', async function () {
        objectIdB = client.getId('object-b');
        objectIdC = client.getId('object-c');
        const location = {
            longitude: 13,
            latitude: 51
        }

        await realmA.object.create(objectIdB, { label: 'Object B Label', location, data: { type: 'scooter', charge: 0.3 } });
        await realmA.object.create(objectIdC, { label: 'Object C Label', location, data: { type: 'maintenance-vehicle' } });
    });

    it('lists all objects', async function () {
        const list = await realmA.object.list()
        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label', connectionStatus: 'disconnected' },
            [objectIdB]: { id: objectIdB, label: 'Object B Label', connectionStatus: 'disconnected' },
            [objectIdC]: { id: objectIdC, label: 'Object C Label', connectionStatus: 'disconnected' },
        });
    });

    it('applies filters to list', async function () {
        var list = await realmA.object.list({
            where: ['type=scooter']
        })
        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label', connectionStatus: 'disconnected' },
            [objectIdB]: { id: objectIdB, label: 'Object B Label', connectionStatus: 'disconnected' },
        });

        list = await realmA.object.list({
            where: ['type=maintenance-vehicle']
        })
        expect(list).to.deep.equal({
            [objectIdC]: { id: objectIdC, label: 'Object C Label', connectionStatus: 'disconnected' },
        });
    });

    it('includes additional data in the list result', async function () {
        var list = await realmA.object.list({
            where: ['type=scooter'],
            field: ['charge']
        });

        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label', connectionStatus: 'disconnected', data: { charge: 0.5 } },
            [objectIdB]: { id: objectIdB, label: 'Object B Label', connectionStatus: 'disconnected', data: { charge: 0.3 } },
        });
    })

    it('finds objects within a shape', async function () {
        var list = await realmA.object.list({
            where: ['type=scooter'],
            field: ['charge'],
            shape: {
                x1: 13,
                x2: 14,
                y1: 52,
                y2: 53
            }
        });

        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label', connectionStatus: 'disconnected', data: { charge: 0.5 } },
        });
    })

    it('does not find objects outside of a shape', async function () {
        var list = await realmA.object.list({
            where: ['type=scooter'],
            field: ['charge'],
            shape: {
                x1: 14,
                x2: 15,
                y1: 52,
                y2: 53
            }
        });

        expect(list).to.deep.equal({});
    })


    it('waits and receives subscription update A for Message A', async function () {
        await sleep(500);
        var ids = Object.keys(lastSubscriptionMessage);
        ids.sort((a, b) => {
            return a > b ? 1 : -1;
        });
        expect(ids).to.deep.equal([
            objectIdA, objectIdB, objectIdC
        ]);
        expect(lastSubscriptionMessage[objectIdB].data.charge).to.equal(0.3);
    });

    it('waits and receives subscription update A for Message B', async function () {
        var ids = Object.keys(lastSubscriptionBMessage);
        ids.sort((a, b) => {
            return a > b ? 1 : -1;
        });
        expect(ids).to.deep.equal([
            objectIdA, objectIdB, objectIdC
        ]);

        expect(lastSubscriptionBMessage[objectIdB].data.charge).to.equal(0.3);
    });

    it('waits and receives subscription update A for Message C', async function () {
        // Object A update was out of the shape of subscription C
        var ids = Object.keys(lastSubscriptionCMessage);
        ids.sort((a, b) => {
            return a > b ? 1 : -1;
        });
        expect(ids).to.deep.equal([
            objectIdB, objectIdC
        ]);
    });

    it('cancels subscription b', async function () {
        await subscriptionB.cancel();
    })

    it('updates object b data with delta', async function () {
        await realmA.object.update(objectIdB, { label: 'New Label', data: { charge: 0.5 } });
        const objBData = await realmA.object.get(objectIdB);
        expect(objBData.data).to.deep.equal({ type: 'scooter', charge: 0.5 })
    });

    it('waits and receives subscription update B', function (done) {
        setTimeout(() => {
            expect(lastSubscriptionMessage[objectIdB].data.charge).to.equal(0.5);
            done();
        }, 500);
    })

    it('deletes object b', async function () {
        await realmA.object.delete(objectIdB);
        const list = await realmA.object.list()
        expect(typeof list[objectIdA]).to.equal('object');
        expect(typeof list[objectIdB]).to.equal('undefined');
    });


    it('waits and receives subscription update C', function (done) {
        setTimeout(() => {
            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                objectIdA, objectIdC
            ]);
            done();
        }, 500);
    });

    it('Uses set to quickly create 3 additional objects ', async function () {
        objectIdD = client.getId('object-d');
        objectIdE = client.getId('object-e');
        objectIdF = client.getId('object-f');
        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        realmA.object.set(objectIdD, { label: 'Object D Label', location });
        realmA.object.set(objectIdE, { label: 'Object E Label', location });
        realmA.object.set(objectIdF, { label: 'Object F Label', location });
    });

    it('waits and receives subscription update D', function (done) {
        setTimeout(() => {

            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                objectIdA, objectIdC, objectIdD, objectIdE, objectIdF
            ]);
            done();
        }, 500);
    })
    it('closes the client', async function () {
        await client.disconnect();
    });
});