import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { sleep } from './tools.js'

describe('HTTP Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA,
        objectIdB,
        objectIdC,
        objectIdD,
        objectIdE,
        objectIdF;

    it('receives an error message for a faulty token', function (done) {
        const client = new HivekitClient({ logErrors: true, logMessages: false });
        client.useHTTP(config.httpUrl);
        client.authenticate(jwt.sign({ sub: 'userName' }, 'INVALID_SECRET'));
        const realmIdA = client.getId('realm-a');

        client.realm.create(realmIdA, 'label for realm a', { some: 'value' }).catch(e => {
            expect(e).to.deep.equal({
                message: 'signature is invalid',
                code: 401
            })
            done();
        });
    })

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: true, logMessages: false });
        client.useHTTP(config.httpUrl);
        client.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(client.connectionStatus === client.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates realm A', async function () {
        realmIdA = client.getId('realm-a');
        await client.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        realmA = await client.realm.get(realmIdA);
        expect(realmA.id).to.equal(realmIdA);
    });

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
            where: ['type="scooter"']
        })
        expect(list).to.deep.equal({
            [objectIdA]: { id: objectIdA, label: 'Object A Label', connectionStatus: 'disconnected' },
            [objectIdB]: { id: objectIdB, label: 'Object B Label', connectionStatus: 'disconnected' },
        });

        list = await realmA.object.list({
            where: ['type="maintenance-vehicle"']
        })
        expect(list).to.deep.equal({
            [objectIdC]: { id: objectIdC, label: 'Object C Label', connectionStatus: 'disconnected' },
        });
    });

    it('updates object b data with delta', async function () {
        await realmA.object.update(objectIdB, { label: 'New Label', data: { charge: 0.5 } });
        const objBData = await realmA.object.get(objectIdB);
        expect(objBData.data).to.deep.equal({ type: 'scooter', charge: 0.5 })
    });

    it('deletes object b', async function () {
        await realmA.object.delete(objectIdB);
        const list = await realmA.object.list()
        expect(typeof list[objectIdA]).to.equal('object');
        expect(typeof list[objectIdB]).to.equal('undefined');
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
});