import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js';

describe('Subscription Update', function () {
    var client,
        realmIdA,
        realmA,
        subscriptionA,
        allUpdates = [],
        lastUpdate,
        objectKeys,
        updateCount = 0;

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

    it('creates a subscription to a circular area', async function () {
        subscriptionA = await realmA.object.subscribe({
            shape: {
                cx: -0.14061314560500038,
                cy: 51.50186617865612,
                r: 110
            }
        })

        subscriptionA.on('update', data => {
            objectKeys = Object.keys(data).sort();
            allUpdates.push(data);
            lastUpdate = data;
            updateCount++;
        })
    })

    it('creates ten objects', async function () {
        const updates = [];
        for (var i = 0; i < 10; i++) {
            updates.push(realmA.object.create('obj-id-' + i, {
                location: {
                    latitude: 51.50186617865612,
                    longitude: -0.14061314560500038 + i * 0.001
                },
                data: {
                    testValue: i
                }
            }))
        }
    })

    it('has received an initial update', async function () {
        await sleep(200);
        expect(objectKeys).to.deep.equal([
            'obj-id-0',
            'obj-id-1'
        ])
    })

    it('updates the subscription circle location', async function () {
        await subscriptionA.update({
            shape: {
                cx: -0.14061314560500038 + 2 * 0.001,
                cy: 51.50186617865612,
                r: 110
            }
        })
    })

    it('has received an update for the updated subscription', async function () {
        await sleep(200);
        expect(objectKeys).to.deep.equal([
            'obj-id-1',
            'obj-id-2',
            'obj-id-3',
        ])
    })



    // it('moves object 2 out of radius', async function () {
    //     await realmA.object.update('obj-id-2', {
    //      
    //location: {
    //             latitude: 50.50186617865612,
    //             longitude: -0.14061314560500038
    //         }
    //     })
    // })

    // @todo this requires stateful subscriptions
    // it('has received an update for the moved object', async function () {
    //     await sleep(200);
    //     expect(Object.keys(subscriptionUpdates[2])).to.deep.equal([
    //         'obj-id-1',
    //         'obj-id-3',
    //     ])
    // })

    it('moves object 4 into the radius', async function () {
        realmA.object.update('obj-id-4', {
            location: {
                longitude: -0.14061314560500038 + 2 * 0.001,
                latitude: 51.50186617865612,
            }
        })
    })

    it('has received an update for object 4', async function () {
        await sleep(200);
        expect(objectKeys).to.deep.equal([
            'obj-id-1',
            'obj-id-2',
            'obj-id-3',
            'obj-id-4',
        ])
    })

    it('updates the subscription circle radius and adds an attribute filter', async function () {
        await subscriptionA.update({
            shape: {
                cx: -0.14061314560500038 + 2 * 0.001,
                cy: 51.50186617865612,
                r: 5000
            },
            where: ['testValue>5']
        })
    })

    it('has received an update for the updated radius', async function () {
        await sleep(200);
        expect(objectKeys).to.deep.equal([
            'obj-id-6',
            'obj-id-7',
            'obj-id-8',
            'obj-id-9',
        ])
    })

    it('updates the test value for object 1', async function () {
        realmA.object.update('obj-id-1', {
            data: {
                testValue: 10
            }
        })
    })

    it('has received an update for the object 1', async function () {
        await sleep(200);
        expect(objectKeys).to.deep.equal([
            'obj-id-1',
            'obj-id-6',
            'obj-id-7',
            'obj-id-8',
            'obj-id-9',
        ])
    })

    // @todo this requires a nil check for filter criteria
    // it('removes the filter criteria', async function () {
    //     await subscriptionA.update({
    //         where: []
    //     })
    // })

    // it('has received an update without filter criteria', async function () {
    //     await sleep(200);
    //     expect(objectKeys).to.deep.equal([
    //         'obj-id-1',
    //         'obj-id-2',
    //         'obj-id-3',
    //         'obj-id-4',
    //         'obj-id-5',
    //         'obj-id-6',
    //         'obj-id-7',
    //         'obj-id-8',
    //         'obj-id-9',
    //     ])
    // })

    it('cancels the subscription', async function () {
        expect(updateCount).to.equal(5);
        await subscriptionA.cancel();
    })

    it('updates the test value for object 1', async function () {
        realmA.object.update('obj-id-2', {
            data: {
                testValue: 10
            }
        })
    })

    it('has not received an update for object 5', async function () {
        await sleep(200);
        expect(updateCount).to.equal(5);
    })

    it('disconnects the client', async function () {
        await client.disconnect();
    })
});