import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('Subscription Multiplexing Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA,
        objectIdB,
        subscriptionAdata = [],
        subscriptionBdata = [],
        subscriptionCdata = [],
        subscriptionDdata = [];

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

        const data = {
            type: 'scooter',
            charge: 0.5
        }

        await realmA.object.create(objectIdA, { label: 'Object A Label', location, data });
    });

    it('subscribes twice simultaniously and receives two responses immediatly', async function () {
        realmA.object.subscribe({ executeImmediately: true }).then(subscription => {
            subscription.on('update', data => {
                subscriptionAdata.push(data);
            })
        })


        realmA.object.subscribe({ executeImmediately: true }).then(subscription => {
            subscription.on('update', data => {
                subscriptionBdata.push(data);
            })
        })

        await sleep(500);

        expect(subscriptionAdata.length).to.equal(1);
        expect(Object.keys(subscriptionAdata[0])).to.deep.equal([objectIdA])
        expect(subscriptionBdata.length).to.equal(1);
        expect(Object.keys(subscriptionBdata[0])).to.deep.equal([objectIdA])
    });

    it('subscribes twice in series and receives two responses', async function () {
        (await realmA.object.subscribe({ executeImmediately: true })).on('update', data => {
            subscriptionCdata.push(data);
        });

        await sleep(300);

        expect(subscriptionCdata.length).to.equal(1);
        expect(Object.keys(subscriptionCdata[0])).to.deep.equal([objectIdA]);

        (await realmA.object.subscribe({ executeImmediately: true })).on('update', data => {
            subscriptionDdata.push(data);
        });

        await sleep(300);

        expect(subscriptionDdata.length).to.equal(1);
        expect(Object.keys(subscriptionDdata[0])).to.deep.equal([objectIdA]);
    });

    it('creates object B ', async function () {
        objectIdB = client.getId('object-b');
        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        const data = {
            type: 'scooter',
            charge: 0.5
        }

        await realmA.object.create(objectIdB, { label: 'Object B Label', location, data });
    });

    it('received four updates', async function () {
        await sleep(300);
        expect(subscriptionAdata.length).to.equal(2);
        expect(Object.keys(subscriptionAdata[1])).to.deep.equal([objectIdA, objectIdB]);
        expect(subscriptionBdata.length).to.equal(2);
        expect(Object.keys(subscriptionBdata[1])).to.deep.equal([objectIdA, objectIdB]);
        expect(subscriptionCdata.length).to.equal(2);
        expect(Object.keys(subscriptionCdata[1])).to.deep.equal([objectIdA, objectIdB]);
        expect(subscriptionDdata.length).to.equal(2);
        expect(Object.keys(subscriptionDdata[1])).to.deep.equal([objectIdA, objectIdB]);
    });


    it('closes the client', async function () {
        await client.disconnect();
    });
});


