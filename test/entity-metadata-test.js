import { expect } from 'chai';
import HivekitClient from '../src/index-node.js';
import ObjectHandler from '../src/object-handler.js';
import AreaHandler from '../src/area-handler.js';
import HistoryHandler from '../src/history-handler.js';
import { C } from '../src/fields.js';

describe('Entity metadata protocol', function () {
    let client, object, area, history, requests, responseData;

    beforeEach(function () {
        client = new HivekitClient({ logErrors: false });
        client.mode = C.MODE.WS;
        client.connectionStatus = C.CONNECTION_STATUS.AUTHENTICATED;
        requests = [];
        responseData = {};
        // Exercise the normal request queue and JSON serialization without a server.
        client._connection = {
            send(serialized) {
                for (const message of JSON.parse(serialized)) {
                    requests.push(message);
                    if (message.cid) {
                        client._onMessage({ data: JSON.stringify([{
                            cid: message.cid, res: 'suc', dat: responseData
                        }]) });
                    }
                }
            }
        };
        const realm = { id: 'realm' };
        object = new ObjectHandler(client, realm);
        area = new AreaHandler(client, realm);
        history = new HistoryHandler(client, realm);
    });

    afterEach(function () {
        clearTimeout(client._sendPendingMessageTimeout);
    });

    for (const mode of ['ws', 'http']) {
        for (const method of ['create', 'update', 'set']) {
            it(mode + ' object.' + method + ' sends separate data and metadata', async function () {
                client.mode = mode;
                const options = {
                    label: 'Truck', location: { longitude: 13, latitude: 52 },
                    data: { status: 'moving', speed: 0 },
                    staticData: { status: 'available', model: 'Hilux', obsolete: null },
                    categoryId: 'pickup', taskIds: []
                };
                const result = object[method]('truck', options);
                client._sendPendingMessages();
                await result;
                const { cid, ...message } = requests[0];
                expect(message).to.deep.equal({
                    typ: 'obj', act: { create: 'cre', update: 'upd', set: 'set' }[method],
                    id: 'truck', rea: 'realm', lab: 'Truck', loc: { lon: 13, lat: 52 },
                    dat: options.data, sdt: options.staticData, cat: 'pickup', tds: []
                });
                expect(Boolean(cid)).to.equal(method !== 'set' || mode === 'http');
                expect(options.staticData.obsolete).to.equal(null);
            });

            for (const categoryId of [undefined, null, '']) {
                it(mode + ' object.' + method + ' preserves category ' + String(categoryId), async function () {
                    client.mode = mode;
                    const result = object[method]('truck', {
                        categoryId,
                        data: { $hkt_category: 'pickup' },
                        staticData: { $hkt_category: 'drill' }
                    });
                    client._sendPendingMessages();
                    await result;
                    expect(requests[0]).to.have.property('dat').that.deep.equals({ $hkt_category: 'pickup' });
                    expect(requests[0]).to.have.property('sdt').that.deep.equals({ $hkt_category: 'drill' });
                    if (categoryId === undefined) {
                        expect(requests[0]).not.to.have.property('cat');
                    } else {
                        expect(requests[0]).to.have.property('cat', categoryId);
                    }
                });
            }
        }
    }

    it('does not add metadata to ordinary dynamic writes', async function () {
        const result = object.update('truck', { data: { speed: 0, enabled: false, note: '' } });
        client._sendPendingMessages();
        await result;
        expect(requests[0].dat).to.deep.equal({ speed: 0, enabled: false, note: '' });
        expect(requests[0]).not.to.have.property('sdt');
        expect(requests[0]).not.to.have.property('cat');
    });

    for (const method of ['create', 'update']) {
        it('area.' + method + ' sends static data with shape data', async function () {
            const result = area[method]('bay', {
                shapeData: { cx: 1, cy: 2, r: 3 },
                data: { occupancy: 0 }, staticData: { zoneType: 'workshop' }
            });
            client._sendPendingMessages();
            await result;
            expect(requests[0]).to.include({ typ: 'are', sty: 'cir' });
            expect(requests[0].sha).to.deep.equal({ cx: 1, cy: 2, r: 3 });
            expect(requests[0].dat).to.deep.equal({ occupancy: 0 });
            expect(requests[0].sdt).to.deep.equal({ zoneType: 'workshop' });
            expect(requests[0]).not.to.have.property('staticData');
        });
    }

    it('area.update permits metadata without a shape', async function () {
        const result = area.update('bay', { staticData: { zoneType: 'workshop', obsolete: null } });
        client._sendPendingMessages();
        await result;
        expect(requests[0].sdt).to.deep.equal({ zoneType: 'workshop', obsolete: null });
        expect(requests[0]).not.to.have.property('sha');
        expect(requests[0]).not.to.have.property('sty');
        expect(requests[0]).not.to.have.property('dat');
    });

    it('still rejects invalid supplied area shapes', async function () {
        let error;
        try {
            await area.update('bay', { shape: { invalid: true }, staticData: { zoneType: 'workshop' } });
        } catch (err) {
            error = err;
        }
        expect(error).to.equal('unknown shape data');
        expect(requests).to.have.length(0);
    });

    it('object.get exposes separate maps and the category', async function () {
        responseData = {
            id: 'truck', dat: { status: 'moving', $hkt_category: 'pickup' },
            sdt: { status: 'available', model: 'Hilux' }, cat: 'pickup'
        };
        const result = object.get('truck');
        client._sendPendingMessages();
        expect(await result).to.deep.equal({
            id: 'truck', data: { status: 'moving', $hkt_category: 'pickup' },
            staticData: { status: 'available', model: 'Hilux' }, categoryId: 'pickup', taskIds: []
        });
    });

    it('object.list preserves full field selectors and decodes empty metadata', async function () {
        responseData = { truck: { id: 'truck', dat: {}, sdt: {}, cat: '' } };
        const result = object.list({ field: ['data', 'staticData', 'categoryId'] });
        client._sendPendingMessages();
        expect(requests[0].dat).to.deep.equal({ fie: ['data', 'staticData', 'categoryId'] });
        expect(await result).to.deep.equal({ truck: { id: 'truck', data: {}, staticData: {}, categoryId: '' } });
    });

    for (const method of ['get', 'list']) {
        it('area.' + method + ' exposes static data', async function () {
            const entity = { id: 'bay', dat: { occupancy: 0 }, sdt: { zoneType: 'workshop' }, sty: 'cir' };
            responseData = method === 'get' ? { ...entity, sha: { cx: 1, cy: 2, r: 3 } } : { bay: entity };
            const result = area[method]('bay');
            client._sendPendingMessages();
            const value = await result;
            const bay = method === 'get' ? value : value.bay;
            expect(bay.data).to.deep.equal({ occupancy: 0 });
            expect(bay.staticData).to.deep.equal({ zoneType: 'workshop' });
            expect(bay.shape).to.equal('circle');
            expect(bay).not.to.have.property('sdt');
        });
    }

    it('history exposes current metadata alongside historical dynamic data', async function () {
        responseData = [{
            loc: { lon: 13, lat: 52 }, lab: 'Truck', cat: 'pickup',
            dat: { speed: 5, $hkt_category: 'pickup' }, sdt: { model: 'Hilux' }
        }];
        const result = history.get('truck', { startTime: new Date(0), endTime: new Date(1000) });
        client._sendPendingMessages();
        expect(await result).to.deep.equal([{
            location: { longitude: 13, latitude: 52 }, label: 'Truck', categoryId: 'pickup',
            data: { speed: 5, $hkt_category: 'pickup' }, staticData: { model: 'Hilux' }
        }]);
    });

    for (const kind of ['object', 'area']) {
        it(kind + ' subscriptions decode full and delta metadata, including clearing', async function () {
            const result = (kind === 'object' ? object : area).subscribe();
            client._sendPendingMessages();
            const subscription = await result;
            const updates = [];
            subscription.on('update', (data, changes) => updates.push(JSON.parse(JSON.stringify({ data, changes }))));
            const entity = {
                id: 'entity', dat: { status: 'moving', $hkt_category: 'pickup' },
                sdt: { status: 'available' }, ...(kind === 'object' ? { cat: 'pickup' } : {})
            };
            const wireKind = kind === 'object' ? 'obj' : 'are';
            client._onMessage({ data: JSON.stringify([{
                typ: 'sub', id: subscription.id, uty: 'ful',
                [wireKind]: kind === 'object' ? { cre: { entity }, upd: {}, del: {} } : { entity }
            }]) });
            expect(updates[0].data.entity.staticData).to.deep.equal({ status: 'available' });
            expect(updates[0].data.entity.data.status).to.equal('moving');
            if (kind === 'object') {
                expect(updates[0].data.entity.categoryId).to.equal('pickup');
                expect(updates[0].changes.added.entity.staticData).to.deep.equal({ status: 'available' });
            }
            const cleared = { id: 'entity', dat: {}, sdt: {}, ...(kind === 'object' ? { cat: '' } : {}) };
            client._onMessage({ data: JSON.stringify([{
                typ: 'sub', id: subscription.id, uty: 'dta',
                [wireKind]: kind === 'object' ? { cre: {}, upd: { entity: cleared }, del: {} } : { entity: cleared }
            }]) });
            expect(updates[1].data.entity.staticData).to.deep.equal({});
            expect(updates[1].data.entity.data).to.deep.equal({});
            if (kind === 'object') {
                expect(updates[1].data.entity.categoryId).to.equal('');
                expect(updates[1].changes.updated.entity.categoryId).to.equal('');
            }
            expect(updates[0].data.entity.staticData).to.deep.equal({ status: 'available' });
        });
    }
});
