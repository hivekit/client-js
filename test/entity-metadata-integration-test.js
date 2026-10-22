import { expect } from 'chai';
import HivekitClient from '../src/index-node.js';
import config from './config.js';
import jwt from 'jsonwebtoken';
import { sleep, nextSubscriptionUpdate } from './tools.js';

for (const mode of ['ws', 'http']) {
    describe('Entity metadata integration (' + mode + ')', function () {
        this.timeout(10000);
        let client, realm, realmId;

        before(async function () {
            client = new HivekitClient({ logErrors: false });
            if (mode === 'ws') {
                await client.connect(config.wsUrl);
            } else {
                client.useHTTP(config.httpUrl);
            }
            await client.authenticate(jwt.sign({ sub: 'metadata-sdk-test' }, config.authTokenSecret));
            realmId = client.getId('metadata-sdk');
            await client.realm.create(realmId, 'SDK metadata');
            realm = await client.realm.get(realmId);
        });

        after(async function () {
            try {
                if (realm) await client.realm.delete(realmId);
            } finally {
                if (client && client._connection && mode === 'ws') await client.disconnect();
            }
        });

        it('creates and reads separate object maps and a dedicated category', async function () {
            await realm.object.create('truck', {
                label: 'Truck', location: { longitude: 13, latitude: 52 },
                data: { speed: 12, status: 'moving' },
                staticData: { model: 'Hilux', status: 'available' }, categoryId: 'pickup'
            });
            const truck = await realm.object.get('truck');
            expect(truck.data).to.deep.equal({ speed: 12, status: 'moving', $hkt_category: 'pickup' });
            expect(truck.staticData).to.deep.equal({ model: 'Hilux', status: 'available' });
            expect(truck.categoryId).to.equal('pickup');
            expect(truck).not.to.have.property('sdt');
            expect(truck).not.to.have.property('cat');
        });

        it('patches maps independently and filters on static attributes', async function () {
            await realm.object.update('truck', { data: { status: null }, staticData: { model: 'Hilux SR' } });
            const truck = await realm.object.get('truck');
            expect(truck.data).to.deep.equal({ speed: 12, $hkt_category: 'pickup' });
            expect(truck.staticData).to.deep.equal({ model: 'Hilux SR', status: 'available' });
            expect(truck.categoryId).to.equal('pickup');
            expect(truck.location.longitude).to.equal(13);
            const list = await realm.object.list({
                where: ['model="Hilux SR"'], field: ['data', 'staticData', 'categoryId']
            });
            expect(list.truck.data).to.deep.equal(truck.data);
            expect(list.truck.staticData).to.deep.equal(truck.staticData);
            expect(list.truck.categoryId).to.equal('pickup');
        });

        it('set preserves metadata and category aliases while explicit null clears the category', async function () {
            await realm.object.set('truck', { data: { $hkt_category: 'loader', enabled: false, speed: 0 } });
            let truck = await realm.object.get('truck');
            expect(truck.categoryId).to.equal('loader');
            expect(truck.data).to.deep.equal({ speed: 0, enabled: false, $hkt_category: 'loader' });
            expect(truck.staticData).to.deep.equal({ model: 'Hilux SR', status: 'available' });
            await realm.object.set('truck', {
                data: { $hkt_category: 'ignored' }, categoryId: null,
                staticData: { model: null, status: null }
            });
            truck = await realm.object.get('truck');
            expect(truck.categoryId).to.equal('');
            expect(truck.data).to.deep.equal({ speed: 0, enabled: false });
            expect(truck.staticData).to.deep.equal({});
        });

        it('updates area metadata without resending or changing its shape', async function () {
            const shape = { cx: 1, cy: 2, r: 3 };
            await realm.area.create('bay', {
                shape, data: { occupancy: 4, status: 'busy' },
                staticData: { zoneType: 'workshop', status: 'available' }
            });
            await realm.area.update('bay', { data: { status: null }, staticData: { zoneType: 'service-bay' } });
            const bay = await realm.area.get('bay');
            expect(bay.shapeData).to.deep.equal(shape);
            expect(bay.data).to.deep.equal({ occupancy: 4 });
            expect(bay.staticData).to.deep.equal({ zoneType: 'service-bay', status: 'available' });
            const list = await realm.area.list();
            expect(list.bay.data).to.deep.equal(bay.data);
            expect(list.bay.staticData).to.deep.equal(bay.staticData);
        });

        it('creates metadata-only objects without fabricating dynamic state', async function () {
            await realm.object.create('metadata-object', { staticData: { model: 'Hilux' }, categoryId: 'pickup' });
            const object = await realm.object.get('metadata-object');
            expect(object.staticData).to.deep.equal({ model: 'Hilux' });
            expect(object.categoryId).to.equal('pickup');
            expect(object.data).to.deep.equal({ $hkt_category: 'pickup' });
        });

        it('history uses historical data with current metadata', async function () {
            await realm.object.create('history-truck', {
                location: { longitude: 13, latitude: 52 }, data: { speed: 5 },
                label: 'Old label', staticData: { model: 'Old model' }, categoryId: 'pickup'
            });
            await realm.object.update('history-truck', {
                label: 'Current label', staticData: { model: 'Hilux SR' }, categoryId: 'loader'
            });
            // History is written asynchronously; wait for the observation to appear.
            let entries = [];
            const deadline = Date.now() + 5000;
            while (entries.length === 0 && Date.now() < deadline) {
                await sleep(100);
                entries = await realm.history.get('history-truck', {
                    startTime: new Date(Date.now() - 60000), endTime: new Date()
                });
            }
            expect(entries).to.have.length(1);
            expect(entries[0].data).to.deep.equal({ speed: 5, $hkt_category: 'loader' });
            expect(entries[0].staticData).to.deep.equal({ model: 'Hilux SR' });
            expect(entries[0].categoryId).to.equal('loader');
            expect(entries[0].label).to.equal('Current label');
        });

        if (mode === 'ws') {
            for (const kind of ['object', 'area']) {
                it(kind + ' subscriptions carry metadata-only updates and clearing', async function () {
                    const handler = realm[kind];
                    const id = kind === 'object' ? 'truck' : 'bay';
                    await handler.update(id, {
                        staticData: { status: 'available' }, ...(kind === 'object' ? { categoryId: 'pickup' } : {})
                    });
                    const subscription = await handler.subscribe({ executeImmediately: true });
                    try {
                        const initial = await nextSubscriptionUpdate(subscription);
                        expect(initial.data[id].staticData.status).to.equal('available');
                        if (kind === 'object') expect(initial.data[id].categoryId).to.equal('pickup');
                        const pending = nextSubscriptionUpdate(subscription);
                        await handler.update(id, {
                            staticData: kind === 'object' ? { status: null } : { status: null, zoneType: null },
                            ...(kind === 'object' ? { categoryId: null } : {})
                        });
                        const update = await pending;
                        expect(update.data[id].staticData).to.deep.equal({});
                        if (kind === 'object') {
                            expect(update.data[id].categoryId).to.equal('');
                            expect(update.data[id].data).not.to.have.property('$hkt_category');
                        }
                    } finally {
                        await subscription.cancel();
                    }
                });
            }
        }
    });
}
