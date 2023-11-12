import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js';

describe('Realm Test', function () {
    let client,
        realmIdA,
        realmIdB

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: false, logMessages: false });
        await client.useHTTP(config.httpUrl);
        await client.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(client.connectionStatus === client.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('attempts to read a non existing realm', function (done) {
        const realmId = client.getId('realm');
        const r = client.realm.get(realmId).catch(err => {
            expect(err).to.deep.equal({
                message: 'unknown realm ' + realmId,
                code: 404
            });
            done();
        })
    });

    it('creates a realm and retrieves it', async function () {
        realmIdA = client.getId('realm-a');
        await client.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        await sleep(200);
        const realmData = await client.realm.get(realmIdA);
        expect(realmData.id).to.equal(realmIdA);
        expect(realmData.label).to.equal('label for realm a');
        expect(await realmData.getData("some")).to.equal('value')
    });

    it('creates a second realm and retrieves it', async function () {
        realmIdB = client.getId('realm-b');
        await client.realm.create(realmIdB, 'label for realm b', { amount: 42 });
        await sleep(200);
        const realmData = await client.realm.get(realmIdB);
        expect(realmData.id).to.equal(realmIdB);
        expect(realmData.label).to.equal('label for realm b');
        expect(await realmData.getData("amount")).to.equal(42)
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
        await realm.setData('firstname', null)
        expect(await realm.getData()).to.deep.equal({
            amount: 42,
            address: { street: 'spooner street', number: 12 }
        })
    });

    it('deletes realm b', async function () {
        this.timeout(10000);
        await client.realm.delete(realmIdB);
        await sleep(200);
        await sleep(200);
        const realmList = await client.realm.list()
        expect(realmList[realmIdA].label).to.equal('label for realm a')
        expect(typeof realmList[realmIdB]).to.equal('undefined')
    });
});