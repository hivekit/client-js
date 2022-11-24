import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('HTTP Set Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA,
        objectIdB,
        objectIdC,
        objectIdD,
        objectIdE,
        objectIdF;


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

    it('creates object A via set and retrieves it straight away', async function () {
        objectIdA = client.getId('object-a');
        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        const data = {
            type: 'scooter',
            charge: 0.5
        }

        await realmA.object.set(objectIdA, { label: 'Object A Label', location, data });
        const objectA = await realmA.object.get(objectIdA);
        expect(objectA.data).to.deep.equal(data);
        expect(objectA.location.latitude).to.equal(location.latitude);
        expect(objectA.location.altitude).to.equal(0);
        expect(objectA.label).to.equal('Object A Label');
    });


    it('updates object A via set and retrieves it straight away', async function () {
        const data = {
            charge: 0.7
        }

        await realmA.object.set(objectIdA, { data });
        const objectA = await realmA.object.get(objectIdA);
        expect(objectA.data.charge).to.equal(0.7);
    });
});