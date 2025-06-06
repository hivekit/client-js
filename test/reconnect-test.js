import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js';

describe('Reconnect Test', function () {
    var receiverClient,
        senderClient,
        receiverRealm,
        senderRealm,
        realmIdA,
        originalConnection,
        carSubscription,
        busSubscription,
        realmA,
        objectSubscription,
        subscriptionMessages = [],
        receiverErrors = [];

    it('creates and authenticates receiver client', async function () {
        receiverClient = new HivekitClient({
            logErrors: false,
            logMessages: false,
            reconnectInterval: 10
        });
        await receiverClient.connect(config.wsUrl);
        await receiverClient.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(receiverClient.connectionStatus === receiverClient.constants.CONNECTION_STATUS.AUTHENTICATED);
        receiverClient.on('error', error => {
            receiverErrors.push(error);
        })
    });

    it('creates and authenticates sender client', async function () {
        senderClient = new HivekitClient({ logErrors: false, logMessages: false });
        await senderClient.connect(config.wsUrl);
        await senderClient.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(senderClient.connectionStatus === senderClient.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('sets up realms', async function () {
        realmIdA = senderClient.getId('realm-a');
        await senderClient.realm.create(realmIdA, 'Realm A', { some: 'realm data' });
        receiverRealm = await receiverClient.realm.get(realmIdA);
        senderRealm = await senderClient.realm.get(realmIdA);
    });

    it('creates subscriptions', async function () {
        await senderRealm.object.create('object-a', {
            label: 'Object A',
            location: {
                latitude: 12.34,
                longitude: 56.78
            },
            data: {
                fuelLevel: 98,
                type: 'car'
            }
        });

        await senderRealm.object.create('object-b', {
            label: 'Object B',
            location: {
                latitude: 12.34,
                longitude: 56.78
            },
            data: {
                fuelLevel: 55,
                type: 'bus'
            }
        });

        receiverRealm.on('update', () => {
            subscriptionMessages.push('realm-update');
        })

        const carSubscription = await receiverRealm.object.subscribe({
            where: ['type="car"']
        });
        busSubscription = await receiverRealm.object.subscribe({
            where: ['type="bus"']
        });

        carSubscription.on('update', data => {
            subscriptionMessages.push('car-update')
        });
        busSubscription.on('update', data => {
            subscriptionMessages.push('bus-update')
        });

        receiverRealm.pubsub.subscribe('my-event', () => {
            subscriptionMessages.push('pubsub-update');
        })

        receiverRealm.pubsub.subscribe('my-other-event', () => {
            subscriptionMessages.push('pubsub-other-update');
        })
    });

    it('triggers updates with sender client', async function () {
        await senderRealm.object.set('object-a', {
            data: {
                fuelLevel: 96
            }
        });
        await senderRealm.object.set('object-b', {
            data: {
                fuelLevel: 43
            }
        });
        senderRealm.setData('value', 44);
        senderRealm.pubsub.publish('my-event', { data: 'test' });
        senderRealm.pubsub.publish('my-other-event', { data: 'testff' });
        await sleep(400); // wait for the update to propagate
    });

    it('received updates on receiver client', async function () {
        subscriptionMessages.sort();
        expect(subscriptionMessages).to.deep.equal([
            'bus-update',
            'car-update',
            'pubsub-other-update',
            'pubsub-update',
            'realm-update'
        ]);
        // unsubscribe from subscription
        await busSubscription.cancel();
        await receiverRealm.pubsub.unsubscribe('my-other-event');
    });

    it('forcibly disconnects the receiver client', async function () {
        const connectionStatuses = [];
        originalConnection = receiverClient._connection;
        expect(receiverClient.connectionStatus).to.equal(receiverClient.constants.CONNECTION_STATUS.AUTHENTICATED);
        receiverClient.on('connectionStatusChanged', status => {
            connectionStatuses.push(status);
        })
        receiverClient._connection.close();
        await sleep(300); // wait for the disconnection to be processed
        expect(receiverClient.connectionStatus).to.equal(receiverClient.constants.CONNECTION_STATUS.AUTHENTICATED);

        expect(receiverErrors.length).to.equal(1);
        expect(connectionStatuses).to.deep.equal(['disconnected', 'connecting', 'connected', 'authenticated'])
    });

    it('triggers updates with sender client after disconnect', async function () {
        await senderRealm.object.set('object-a', {
            data: {
                fuelLevel: 95
            }
        });
        await senderRealm.object.set('object-b', {
            data: {
                fuelLevel: 42
            }
        });
        senderRealm.setData('value', 49);
        senderRealm.pubsub.publish('my-event', { data: 'test2' });
        senderRealm.pubsub.publish('my-other-event', { data: 'test43' });
        await sleep(400); // wait for the update to propagate
    });

    it('received updates on receiver client after disconnect', async function () {
        subscriptionMessages.sort();
        expect(subscriptionMessages).to.deep.equal([
            'bus-update',
            'car-update',
            'car-update',
            'pubsub-other-update',
            'pubsub-update',
            'pubsub-update',
            'realm-update',
            'realm-update'
        ]);
    });

    it('closes the client', async function () {
        await senderClient.disconnect();
        await receiverClient.disconnect();
    });
});