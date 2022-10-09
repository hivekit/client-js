import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

/**
 * This test addresses a specific scenario in which out of two 
 * subscriptions for area updates, both with executeImmediatly: true
 * only one fired.
 */
describe('Area Subscription Test', function () {
    var client,
        realmIdA,
        realmA,
        areaIdA,
        subscriptionA,
        subscriptionB,
        messagesA = [],
        messagesB = [];

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

    it('creates area A as a rectangle and retrieves it', async function () {
        areaIdA = client.getId('area-a');
        const shape = { x1: 5, y1: 5, x2: 10, y2: 10 }
        const data = { some: 'Value' };
        await realmA.area.create(areaIdA, 'area A Label', shape, data);
        const areaA = await realmA.area.get(areaIdA);
        expect(areaA.shape).to.equal('rectangle');
    });


    it('creates subscription A', async function () {
        subscriptionA = await realmA.area.subscribe({ executeImmediately: true });
        subscriptionA.on('update', msg => {
            messagesA.push(msg);
        });
    });
    it('waits for 300ms', function (done) {
        setTimeout(done, 300);
    });

    it('received updates for both subscriptions', function () {
        expect(messagesA.length).to.equal(1);
        expect(messagesB.length).to.equal(0);
        expect(Object.keys(messagesA[0])).to.deep.equal([areaIdA]);
    });

    it('creates subscription B', async function () {
        subscriptionB = await realmA.area.subscribe({ executeImmediately: true });
        subscriptionB.on('update', msg => {
            messagesB.push(msg);
        });
        expect(subscriptionA.id).to.equal(subscriptionB.id);
    });

    it('waits for 300ms', function (done) {
        setTimeout(done, 300);
    });

    it('received updates for both subscriptions', function () {
        expect(messagesA.length).to.equal(1);
        expect(messagesB.length).to.equal(1);
        expect(Object.keys(messagesA[0])).to.deep.equal([areaIdA]);
        expect(Object.keys(messagesB[0])).to.deep.equal([areaIdA]);
    })

    it('deletes the realm and closes the client', async function () {
        await client.realm.delete(realmIdA);
        await client.disconnect();
    });
});