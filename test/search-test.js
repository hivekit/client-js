import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config'
import jwt from 'jsonwebtoken'

describe('Search Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA,
        objectIdB,
        objectIdC,
        objectIdD,
        objectIdE,
        objectIdF,
        areaIdA,
        areaIdB,
        areaIdC,
        areaIdD,
        areaIdE,
        areaIdF,
        subscriptionMessageCount = 0,
        lastSubscriptionMessage;

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

    it('creates objects', async function () {
        objectIdA = client.getId('object-a');
        objectIdB = client.getId('object-b');
        objectIdC = client.getId('object-c');
        objectIdD = client.getId('object-d');
        objectIdE = client.getId('object-e');
        objectIdF = client.getId('object-f');

        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        const data = {
            type: 'scooter',
            charge: 0.5
        }

        await realmA.object.create(objectIdA, 'Object A Label', location, { type: 'scooter', charge: 0.1 });
        await realmA.object.create(objectIdB, 'Object B Label', location, { type: 'scooter', charge: 0.2 });
        await realmA.object.create(objectIdC, 'Object C Label', location, { type: 'car', charge: 0.3 });
        await realmA.object.create(objectIdD, 'Object D Label', location, { type: 'truck', charge: 0.4 });
        await realmA.object.create(objectIdE, 'Object E Label', location, { type: 'truck', charge: 0.5 });
        await realmA.object.create(objectIdF, 'Object F Label', location, { type: 'truck', charge: 0.6 });
        const list = await realmA.object.list()
        expect(Object.keys(list)).to.include(
            objectIdA,
            objectIdB,
            objectIdC,
            objectIdD,
            objectIdE,
            objectIdF
        );
    });

    it('creates areas', async function () {
        areaIdA = client.getId('area-a');
        areaIdB = client.getId('area-b');
        areaIdC = client.getId('area-c');
        areaIdD = client.getId('area-d');
        areaIdE = client.getId('area-e');
        areaIdF = client.getId('area-f');

        const shapeData = {
            x1: 0,
            y1: 0,
            x2: 10,
            y2: 10
        }

        await realmA.area.create(areaIdA, 'Area A Label', shapeData, { type: 'city scooter', charge: 0.1 });
        await realmA.area.create(areaIdB, 'Area B Label', shapeData, { type: 'city', charge: 0.2 });
        await realmA.area.create(areaIdC, 'Area C Label', shapeData, { type: 'city', charge: 0.3 });
        await realmA.area.create(areaIdD, 'Area D Label', shapeData, { type: 'country', charge: 0.4 });
        await realmA.area.create(areaIdE, 'Area E Label', shapeData, { type: 'country', charge: 0.5 });
        await realmA.area.create(areaIdF, 'Area F Label', shapeData, { type: 'country', charge: 0.6 });
        const list = await realmA.area.list()

        expect(Object.keys(list)).to.include(areaIdA);
        expect(Object.keys(list)).to.include(areaIdB);
        expect(Object.keys(list)).to.include(areaIdC);
        expect(Object.keys(list)).to.include(areaIdD);
        expect(Object.keys(list)).to.include(areaIdE);
        expect(Object.keys(list)).to.include(areaIdF);
    });

    it('searches for the term "scooter"', async function () {
        const result = await realmA.search('scooter');
        expect(result.length).to.equal(3);
        expect(result).to.deep.include({
            id: objectIdA,
            type: 'object',
            label: 'Object A Label',
            field: 'data',
            value: 'scooter',
            start: 0,
            end: 7,
            dataProperty: 'type'
        });
        expect(result).to.deep.include({
            id: objectIdB,
            type: 'object',
            label: 'Object B Label',
            field: 'data',
            value: 'scooter',
            start: 0,
            end: 7,
            dataProperty: 'type'
        });
        expect(result).to.deep.include({
            id: areaIdA,
            type: 'area',
            label: 'Area A Label',
            field: 'data',
            value: 'city scooter',
            start: 5,
            end: 12,
            dataProperty: 'type'
        });
    });

    it('limits object search results"', async function () {
        var result;
        result = await realmA.search('Object', { field: ['label', 'id'] });
        expect(result.length).to.equal(12);
        result = await realmA.search('Object', { field: ['label'] });
        expect(result.length).to.equal(6);
        result = await realmA.search('Object', { field: ['label'], maxObjectResults: 3 });
        expect(result.length).to.equal(3);
    });

    it('searches with empty result set', async function () {
        const result = await realmA.search('does-not-exist');
        expect(result.length).to.equal(0);
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});