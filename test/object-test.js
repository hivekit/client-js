import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

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

        await realmA.object.create(objectIdA, 'Object A Label', location, data);
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

        await realmA.object.create(objectIdB, 'Object B Label', location, { type: 'scooter', charge: 0.3 });
        await realmA.object.create(objectIdC, 'Object C Label', location, { type: 'maintenance-vehicle' });
    });

    it('lists all objects', async function () {
        const list = await realmA.object.list()
        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label' },
            [objectIdB]: { id: objectIdB, label: 'Object B Label' },
            [objectIdC]: { id: objectIdC, label: 'Object C Label' },
        });
    });

    it('applies filters to list', async function () {
        var list = await realmA.object.list({
            where: ['type=scooter']
        })
        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label' },
            [objectIdB]: { id: objectIdB, label: 'Object B Label' },
        });

        list = await realmA.object.list({
            where: ['type=maintenance-vehicle']
        })
        expect(list).to.deep.equal({
            [objectIdC]: { id: objectIdC, label: 'Object C Label' },
        });
    });

    it('waits and receives subscription update', function (done) {
        setTimeout(() => {

            var ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                objectIdA, objectIdB, objectIdC
            ]);
            expect(subscriptionMessageCount).to.equal(1);
            expect(lastSubscriptionMessage[objectIdB].data.charge).to.equal(0.3);

            ids = Object.keys(lastSubscriptionBMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                objectIdA, objectIdB, objectIdC
            ]);
            expect(subscriptionBMessageCount).to.equal(1);
            expect(lastSubscriptionBMessage[objectIdB].data.charge).to.equal(0.3);

            // Object A update was out of the shape of subscription C
            ids = Object.keys(lastSubscriptionCMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                objectIdB, objectIdC
            ]);
            expect(subscriptionCMessageCount).to.equal(1);

            done();
        }, 500);
    });

    it('cancels subscription b', async function () {
        await subscriptionB.cancel();
    })

    it('updates object b data with delta', async function () {
        expect(subscriptionMessageCount).to.equal(1);
        expect(subscriptionBMessageCount).to.equal(1);
        await realmA.object.update(objectIdB, 'New Label', null, { charge: 0.5 });
        const objBData = await realmA.object.get(objectIdB);
        expect(objBData.data).to.deep.equal({ type: 'scooter', charge: 0.5 })
    });

    it('waits and receives subscription update', function (done) {
        setTimeout(() => {
            expect(lastSubscriptionMessage[objectIdB].data.charge).to.equal(0.5);
            expect(subscriptionMessageCount).to.equal(2);
            expect(subscriptionBMessageCount).to.equal(1);
            done();
        }, 500);
    })

    it('deletes object b', async function () {
        await realmA.object.delete(objectIdB);
        const list = await realmA.object.list()
        expect(typeof list[objectIdA]).to.equal('object');
        expect(typeof list[objectIdB]).to.equal('undefined');
    });


    it('waits and receives subscription update', function (done) {
        setTimeout(() => {

            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                objectIdA, objectIdC
            ]);
            expect(subscriptionMessageCount).to.equal(3);
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

        realmA.object.set(objectIdD, 'Object D Label', location, null);
        realmA.object.set(objectIdE, 'Object E Label', location, null);
        realmA.object.set(objectIdF, 'Object F Label', location, null);
    });

    it('waits and receives subscription update', function (done) {
        setTimeout(() => {
            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            console.log(ids)
            expect(ids).to.deep.equal([
                objectIdA, objectIdC, objectIdD, objectIdE, objectIdF
            ]);
            expect(subscriptionMessageCount).to.equal(4);
            done();
        }, 500);
    })
    it('cleans up the realm and closes the client', async function () {
        await client.realm.delete(realmIdA);
        await client.disconnect();
    });
});