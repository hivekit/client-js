import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js';

describe('Realm Test', function () {
    var client,
        realmIdA,
        realmIdB,
        subscription,
        subscriptionUpdateCount = 0,
        lastSubscriptionMessage = [];

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: false, logMessages: false });
        await client.connect(config.wsUrl);
        await client.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(client.connectionStatus === client.constants.CONNECTION_STATUS.AUTHENTICATED);
        expect(typeof client.serverVersion).to.equal('string')
        expect(client.serverVersion.length).to.be.greaterThan(0);
        expect(client.serverBuildDate.length).to.be.greaterThan(0);
    });

    it('subscribes to realm events', async function () {
        subscription = await client.realm.subscribe();
        subscription.on('update', data => {
            subscriptionUpdateCount++;
            lastSubscriptionMessage = data;
        })
    });

    it('attempts to read a non existing realm', function (done) {
        const realmId = client.getId('realm');
        client.realm.get(realmId).catch(err => {
            expect(err).to.deep.equal({
                message: 'unknown realm ' + realmId,
                code: 404
            });
            done();
        })
    });

    it('creates a realm and retrieves it', async function () {
        realmIdA = client.getId('realm-a');
        expect(subscriptionUpdateCount).to.equal(0);
        await client.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        await sleep(200);
        expect(subscriptionUpdateCount).to.equal(1);
        expect(lastSubscriptionMessage).to.deep.equal({ realmId: realmIdA, action: 'create' });
        const realmData = await client.realm.get(realmIdA);
        expect(realmData.id).to.equal(realmIdA);
        expect(realmData.label).to.equal('label for realm a');
        expect(realmData.getData("some")).to.equal('value')
    });

    it('creates a second realm and retrieves it', async function () {
        realmIdB = client.getId('realm-b');
        expect(subscriptionUpdateCount).to.equal(1);
        await client.realm.create(realmIdB, 'label for realm b', { amount: 42 });
        await sleep(200);
        expect(subscriptionUpdateCount).to.equal(2);
        expect(lastSubscriptionMessage).to.deep.equal({ realmId: realmIdB, action: 'create' });
        const realmData = await client.realm.get(realmIdB);
        expect(realmData.id).to.equal(realmIdB);
        expect(realmData.label).to.equal('label for realm b');
        expect(realmData.getData("amount")).to.equal(42)
    });

    it('lists both realms', async function () {
        this.timeout(10000);
        const realmList = await client.realm.list()
        expect(Object.keys(realmList).length).to.be.greaterThan(1);
        expect(realmList[realmIdA].label).to.equal('label for realm a')
        expect(realmList[realmIdB].label).to.equal('label for realm b')
    });

    it('gets and sets realm data', async function () {
        const realm = await client.realm.get(realmIdB);
        await realm.setData('firstname', 'Joe')
        await realm.setData('address', { street: 'spooner street', number: 12 })
        expect(await realm.getData()).to.deep.equal({
            amount: 42,
            firstname: 'Joe',
            address: { street: 'spooner street', number: 12 }
        })
        await sleep(200)
        expect(subscriptionUpdateCount).to.equal(4)
        await realm.setData('firstname', null)
        expect(realm.getData()).to.deep.equal({
            amount: 42,
            address: { street: 'spooner street', number: 12 }
        })
        await sleep(200)
        expect(subscriptionUpdateCount).to.equal(5)
    });

    it('deletes realm b', async function () {
        this.timeout(10000);
        expect(subscriptionUpdateCount).to.equal(5);
        await client.realm.delete(realmIdB);
        await sleep(200);
        expect(subscriptionUpdateCount).to.equal(6);
        expect(lastSubscriptionMessage).to.deep.equal({ realmId: realmIdB, action: 'delete' });
        await sleep(200);
        const realmList = await client.realm.list()
        expect(realmList[realmIdA].label).to.equal('label for realm a')
        expect(typeof realmList[realmIdB]).to.equal('undefined')
    });

    it('unsubscribes before deleting realm a and receives no updates', async function () {
        expect(subscriptionUpdateCount).to.equal(6);
        lastSubscriptionMessage = null;
        await subscription.cancel();
        expect(lastSubscriptionMessage).to.equal(null);
        await client.realm.delete(realmIdA);
        expect(subscriptionUpdateCount).to.equal(6);
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});