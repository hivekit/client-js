import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('Subscription Test', function () {
    var client,
        realmIdA,
        realmA,
        objectIdA;

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

    it('subscribes and receives an empty response immediately', function (done) {
        realmA.object.subscribe({ executeImmediately: true }).then(subscription => {
            subscription.on('update', data => {
                expect(data).to.deep.equal({});
                subscription.cancel().then(() => {
                    done();
                });
            });
        })
    });

    it('creates object A ', async function () {
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
    });

    it('subscribes and receives a message', function (done) {
        realmA.object.subscribe({ executeImmediately: true }).then(subscription => {
            subscription.on('update', data => {
                expect(Object.keys(data)).to.deep.equal([objectIdA]);
                done();
            });
        })
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});