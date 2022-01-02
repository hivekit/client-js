import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config'
import jwt from 'jsonwebtoken'

describe('Area Test', function () {
    var client,
        realmIdA,
        realmA,
        areaIdA,
        areaIdB,
        areaIdC,
        lastSubscriptionMessage;

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: false, logMessages: false });
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

    it('subscribes to all areas', async function () {
        const subscription = await realmA.area.subscribe();
        subscription.on('update', data => {
            lastSubscriptionMessage = data;
        })
    })

    it('creates area A as a rectangle and retrieves it', async function () {
        areaIdA = client.getId('area-a');
        const shape = {
            x1: 5,
            y1: 5,
            x2: 10,
            y2: 10
        }

        const data = {
            some: 'Value'
        }

        await realmA.area.create(areaIdA, 'area A Label', shape, data);
        const areaA = await realmA.area.get(areaIdA);
        expect(areaA.shape).to.equal('rectangle');
        expect(areaA.shapeData).to.deep.equal(shape);
        expect(areaA.data).to.deep.equal(data);
        expect(areaA.label).to.equal('area A Label');
    });

    it('fails to create area A again', function (done) {
        const shape = {
            x1: 5,
            y1: 5,
            x2: 10,
            y2: 10
        }

        const data = {
            some: 'Value'
        }
        realmA.area.create(areaIdA, 'area A Label', shape, data)
            .then(() => {
                expect('it').to.equal('should not get here');
            })
            .catch(e => {
                expect(e).to.equal(`area with id ${areaIdA} already exists`)
                done();
            })
    });

    it('fails to create area with invalid shape data', function (done) {
        areaIdB = client.getId('area-b');
        const shape = {
            qq: 123
        }

        const data = {
            some: 'Value'
        }
        realmA.area.create(areaIdB, 'area B Label', shape, data)
            .then(() => {
                expect('it').to.equal('should not get here');
            })
            .catch(e => {
                expect(e).to.equal(`unknown shape data`)
                done();
            })
    });


    it('creates area B as a circle', async function () {
        const shape = {
            cx: 52.52395580723212,
            cy: 13.397644336372132,
            r: 20000
        }
        await realmA.area.create(areaIdB, 'Berlin', shape, { isCapital: true, country: 'Germany' });

        const areaB = await realmA.area.get(areaIdB);
        expect(areaB.shape).to.equal('circle');
        expect(areaB.shapeData.cx.toFixed(6)).to.deep.equal(shape.cx.toFixed(6));
        expect(areaB.shapeData.cy.toFixed(6)).to.deep.equal(shape.cy.toFixed(6));
        expect(areaB.data).to.deep.equal({ isCapital: true, country: 'Germany' });
        expect(areaB.label).to.equal('Berlin');
    });

    it('creates area C as a polygon', async function () {
        areaIdC = client.getId('area-c');
        const shape = {
            points: [
                { x: 52.52395, y: 12.39764 },
                { x: 53.52395, y: 13.39764 },
                { x: 51.52395, y: 14.39764 },
            ]
        };


        await realmA.area.create(areaIdC, 'Berlin Part', shape, { isCapital: true, country: 'Germany' });

        const areaC = await realmA.area.get(areaIdC);
        expect(areaC.shape).to.equal('polygon');
        expect(areaC.shapeData).to.deep.equal(shape);
        expect(areaC.data).to.deep.equal({ isCapital: true, country: 'Germany' });
        expect(areaC.label).to.equal('Berlin Part');
    });


    it('lists all areas', async function () {
        const list = await realmA.area.list();
        expect(list).to.deep.equal({
            [areaIdA]: { id: areaIdA, label: 'area A Label', shape: 'rectangle' },
            [areaIdB]: { id: areaIdB, label: 'Berlin', shape: 'circle' },
            [areaIdC]: { id: areaIdC, label: 'Berlin Part', shape: 'polygon' },
        });
    });


    it('waits and receives subscription update', function (done) {
        setTimeout(() => {

            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([areaIdA, areaIdB, areaIdC]);
            done();
        }, 500);
    })

    it('updates area b data with delta', async function () {
        await realmA.area.update(areaIdB, 'New Label', { cx: 1, cy: 2, r: 3 }, { charge: 0.5 });
        const objBData = await realmA.area.get(areaIdB);
        expect(objBData.shapeData).to.deep.equal({ cx: 1, cy: 2, r: 3 })
        expect(objBData.data).to.deep.equal({ isCapital: true, country: 'Germany', charge: 0.5 })
    });

    it('waits and receives subscription update', function (done) {
        setTimeout(() => {
            expect(lastSubscriptionMessage[areaIdB].data.charge).to.equal(0.5);
            done();
        }, 500);
    })

    it('deletes area b', async function () {
        await realmA.area.delete(areaIdB);
        const list = await realmA.area.list()
        expect(typeof list[areaIdA]).to.equal('object');
        expect(typeof list[areaIdB]).to.equal('undefined');
    });


    it('waits and receives subscription update', function (done) {
        setTimeout(() => {

            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                areaIdA, areaIdC
            ]);
            done();
        }, 500);
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});