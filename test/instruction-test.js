import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('Instruction Test', function () {
    var client,
        realmIdA,
        realmA,
        instructionIdA,
        instructionIdB,
        instructionIdC,
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

    it('subscribes to all instructions', async function () {
        const subscription = await realmA.instruction.subscribe();
        subscription.on('update', data => {
            lastSubscriptionMessage = data;
        })
    })

    it('creates instruction A and retrieves it', async function () {
        instructionIdA = client.getId('instruction-a');
        const instructionString = `
            when
                object(type=scooter, charge<0.2)
            then
                set(needsCharging, true)
            until
                set(needsCharging, false)
        `

        const data = {
            some: 'Value'
        }

        await realmA.instruction.create(instructionIdA, { label: 'instruction A Label', instructionString, data });
        const instructionA = await realmA.instruction.get(instructionIdA);
        expect(instructionA.instructionString.trim()).to.equal(instructionString.trim());
        expect(instructionA.data).to.deep.equal(data);
        expect(instructionA.label).to.equal('instruction A Label');
    });

    it('fails to create instruction A again', function (done) {
        const instructionString = `
            when
                object(type=scooter, charge<0.2)
            then
                set(needsCharging, true)
            until
                set(needsCharging, false)
        `

        const data = {
            some: 'Value'
        }

        realmA.instruction.create(instructionIdA, { label: 'instruction A Label', instructionString, data })
            .then(() => {
                expect('it').to.equal('should not get here');
            })
            .catch(e => {
                expect(e).to.deep.equal({
                    message: `instruction with id ${instructionIdA} already exists`,
                    code: 409
                })
                done();
            })
    });

    it('fails to create an instruction with a syntax error', function (done) {
        instructionIdB = client.getId('instruction-b')

        const instructionString = `
            when blablub
                object(type=scooter, charge<0.2)
            then
                set(needsCharging, true)
            until
                set(needsCharging, false)
        `

        const data = {
            some: 'Value'
        }

        realmA.instruction.create(instructionIdB, 'instruction B Label', instructionString, data)
            .then(() => {
                expect('it').to.equal('should not get here');
            })
            .catch(e => {
                expect(e.message.startsWith('Error: Incorrect Syntax.')).to.equal(true)
                done();
            })
    });

    it('creates instructions b and c', async function () {
        instructionIdC = client.getId('instruction-c')

        const instructionString = `
            every 10 min
            when
                object(type=scooter, charge<0.2)
            then
                set(needsCharging, true)
            until
                set(needsCharging, false)
        `

        await realmA.instruction.create(instructionIdB, { label: 'instruction B Label', instructionString, data: { letter: 'B' } })
        await realmA.instruction.create(instructionIdC, { label: 'instruction C Label', instructionString, data: { letter: 'C' } })
    });

    it('lists all instructions', async function () {
        const list = await realmA.instruction.list();
        expect(list).to.deep.equal({
            [instructionIdA]: { id: instructionIdA, label: 'instruction A Label', data: { some: 'Value' } },
            [instructionIdB]: { id: instructionIdB, label: 'instruction B Label', data: { letter: 'B' } },
            [instructionIdC]: { id: instructionIdC, label: 'instruction C Label', data: { letter: 'C' } },
        });
    });

    it('waits and receives subscription update', function (done) {
        setTimeout(() => {

            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([instructionIdA, instructionIdB, instructionIdC]);
            done();
        }, 500);
    })

    it('updates instruction b data with delta', async function () {
        const instructionString = `
            every 10 min
            when
                object(type=scooter, charge<0.2)
            then
                set(needsCharging, true)
            until
                set(needsCharging, false)`;
        await realmA.instruction.update(instructionIdB, { label: 'New Label', instructionString, data: { charge: 0.5 } });
        const intructionData = await realmA.instruction.get(instructionIdB);
        expect(intructionData.instructionString.trim()).to.deep.equal(instructionString.trim())
        expect(intructionData.data).to.deep.equal({ letter: 'B', charge: 0.5 })
        expect(intructionData.label).to.deep.equal('New Label')
    });

    it('waits and receives subscription update', function (done) {
        setTimeout(() => {
            expect(lastSubscriptionMessage[instructionIdB].data.charge).to.equal(0.5);
            done();
        }, 500);
    })

    it('deletes instruction b', async function () {
        await realmA.instruction.delete(instructionIdB);
        const list = await realmA.instruction.list()
        expect(typeof list[instructionIdA]).to.equal('object');
        expect(typeof list[instructionIdB]).to.equal('undefined');
    });


    it('waits and receives subscription update', function (done) {
        setTimeout(() => {

            const ids = Object.keys(lastSubscriptionMessage);
            ids.sort((a, b) => {
                return a > b ? 1 : -1;
            });
            expect(ids).to.deep.equal([
                instructionIdA, instructionIdC
            ]);
            done();
        }, 500);
    });

    it('closes the client', async function () {
        await client.disconnect();
    });
});