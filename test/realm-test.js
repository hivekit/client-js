import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config'
import jwt from 'jsonwebtoken'

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
            expect(err).to.equal('unknown realm ' + realmId);
            done();
        })
    });

    it('creates a realm and retrieves it', async function () {
        realmIdA = client.getId('realm-a');
        expect(subscriptionUpdateCount).to.equal(0);
        await client.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        expect(subscriptionUpdateCount).to.equal(1);
        expect(lastSubscriptionMessage).to.deep.equal({ realmId: realmIdA, action: 'create' });
        const realmData = await client.realm.get(realmIdA);
        expect(realmData.id).to.equal(realmIdA);
        expect(realmData.label).to.equal('label for realm a');
        expect(realmData.data).to.deep.equal({ some: 'value' })
    });

    it('creates a second realm and retrieves it', async function () {
        realmIdB = client.getId('realm-b');
        expect(subscriptionUpdateCount).to.equal(1);
        await client.realm.create(realmIdB, 'label for realm b', { amount: 42 });
        expect(subscriptionUpdateCount).to.equal(2);
        expect(lastSubscriptionMessage).to.deep.equal({ realmId: realmIdB, action: 'create' });
        const realmData = await client.realm.get(realmIdB);
        expect(realmData.id).to.equal(realmIdB);
        expect(realmData.label).to.equal('label for realm b');
        expect(realmData.data).to.deep.equal({ amount: 42 })
    });

    it('lists both realms', async function () {
        const realmList = await client.realm.list()
        expect(Object.keys(realmList).length).to.be.greaterThan(1);
        expect(realmList[realmIdA].label).to.equal('label for realm a')
        expect(realmList[realmIdB].label).to.equal('label for realm b')
    });

    it('deletes realm b', async function () {
        expect(subscriptionUpdateCount).to.equal(2);
        await client.realm.delete(realmIdB);
        expect(subscriptionUpdateCount).to.equal(3);
        expect(lastSubscriptionMessage).to.deep.equal({ realmId: realmIdB, action: 'delete' });
        const realmList = await client.realm.list()
        expect(realmList[realmIdA].label).to.equal('label for realm a')
        expect(typeof realmList[realmIdB]).to.equal('undefined')
    });

    it('unsubscribes before deleting realm a and receives no updates', async function () {
        expect(subscriptionUpdateCount).to.equal(3);
        lastSubscriptionMessage = null;
        await subscription.cancel();
        expect(lastSubscriptionMessage).to.equal(null);
        await client.realm.delete(realmIdA);
        expect(subscriptionUpdateCount).to.equal(3);
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});