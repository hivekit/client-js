import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'
import { nextSubscriptionUpdate } from './tools.js';

describe('Task Test', function () {
    var client,
        realmIdA,
        realmA,
        taskIdA,
        taskIdB,
        taskIdC,
        targetIdA,
        subscriptionA,
        subscriptionB;

    it('creates and authenticates the client', async function () {
        client = new HivekitClient({ logErrors: true, logMessages: false });
        realmIdA = client.getId('realm-a');
        taskIdA = client.getId('task-a');
        taskIdB = client.getId('task-b');
        taskIdC = client.getId('task-c');
        targetIdA = client.getId('target-a');

        await client.connect(config.wsUrl);
        await client.authenticate(jwt.sign({ sub: 'userName' }, config.authTokenSecret));
        expect(client.connectionStatus === client.constants.CONNECTION_STATUS.AUTHENTICATED);
    });

    it('creates realm A', async function () {
        await client.realm.create(realmIdA, 'label for realm a', { some: 'value' });
        realmA = await client.realm.get(realmIdA);
        expect(realmA.id).to.equal(realmIdA);
    });

    it('subscribes to all tasks for realm A', async function () {
        subscriptionA = await realmA.task.subscribe();
    });

    it('creates task A with just a label and target id retrieves it', async function () {
        realmA.task.create(taskIdA, {
            label: 'label for task a',
            targetId: targetIdA
        })

        const update = await nextSubscriptionUpdate(subscriptionA);
        expect(update.changes.added[taskIdA]).to.exist;
        expect(update.changes.added[taskIdA].label).to.equal('label for task a');
        expect(update.changes.added[taskIdA].location.longitude).to.equal(0);
        expect(update.changes.added[taskIdA].status).to.equal('$hkt_not_started');

        const taskAData = await realmA.task.get(taskIdA);
        expect(taskAData.label).to.equal('label for task a');
        expect(taskAData.location.longitude).to.equal(0);
        expect(taskAData.status).to.equal('$hkt_not_started');
    });

    it('creates task B with a label, description, location and steps', async function () {
        realmA.task.create(taskIdB, {
            label: 'label for task b',
            description: 'description for task b',
            status: '$hkt_blocked',
            location: {
                latitude: 1,
                longitude: 2,
            },
            steps: [
                { data: { weight: 1 }, label: 'step 1', status: '$hkt_not_started' },
                { data: { weight: 2 }, label: 'step 2', status: '$hkt_completed' },
            ]
        })
        const update = await nextSubscriptionUpdate(subscriptionA);
        expect(update.data[taskIdB]).to.exist;
        expect(update.data[taskIdB].steps[0].status).to.equal('$hkt_not_started');

        const taskData = await realmA.task.get(taskIdB);
        expect(taskData.label).to.equal('label for task b');
        expect(taskData.description).to.equal('description for task b');
        expect(taskData.status).to.equal('$hkt_blocked');
        expect(taskData.location.latitude).to.equal(1);
        expect(taskData.location.longitude).to.equal(2);
        expect(taskData.steps[0].label).to.equal('step 1');
        expect(taskData.steps[0].status).to.equal('$hkt_not_started');
        expect(taskData.steps[0].data.weight).to.equal(1);
        expect(taskData.steps[1].label).to.equal('step 2');
        expect(taskData.steps[1].status).to.equal('$hkt_completed');
        expect(taskData.steps[1].data.weight).to.equal(2);
    });

    it('fails to create task C with a targetId and location', async function () {
        expect(function () {
            realmA.task.create(taskIdC, {
                label: 'label for task c',
                location: {
                    latitude: 1,
                    longitude: 2,
                },
                targetId: targetIdA
            })
        }).to.throw('Cannot set both location and targetId')
    });

    it('fails to create task C with an invalid status ', async function () {
        expect(function () {
            realmA.task.create(taskIdC, {
                label: 'label for task c',
                targetId: targetIdA,
                status: 'doesnotexist',
            })
        }).to.throw('Invalid task status: doesnotexist')
    });

    it('fails to create task C with neither a targetId nor location', async function () {
        expect(function () {
            realmA.task.create(taskIdC, {
                label: 'label for task c',
            })
        }).to.throw('Task needs either a targetId or location')
    });

    it('lists tasks without options', async function () {
        const list = await realmA.task.list();
        expect(Object.keys(list)).to.deep.equal([taskIdA, taskIdB]);
        expect(list[taskIdA].label).to.equal('label for task a');
        expect(list[taskIdB].label).to.equal('label for task b');
    });

    it('updates the label for task A', async function () {
        await realmA.task.update(taskIdA, { label: 'new label for task a' });
        const taskAData = await realmA.task.get(taskIdA);
        expect(taskAData.label).to.equal('new label for task a');
    });

    it('creates a second subscription with execute immediatly', async function () {
        subscriptionB = await realmA.task.subscribe({
            executeImmediately: true
        });

        const update = await nextSubscriptionUpdate(subscriptionB);
        expect(update.data[taskIdA]).to.exist;
        expect(update.data[taskIdB]).to.exist;
    });

    it('completes step 1 of task B', async function () {
        await realmA.task.update(taskIdB, {
            steps: [
                { data: { weight: 1 }, label: 'step 1', status: '$hkt_completed' },
                { data: { weight: 2 }, label: 'step 2', status: '$hkt_completed' },
            ]
        });
        const taskData = await realmA.task.get(taskIdB);
        expect(taskData.steps[0].status).to.equal('$hkt_completed');
        expect(taskData.steps[1].status).to.equal('$hkt_completed');
    });

    it('deletes task 1', async function () {
        await realmA.task.delete(taskIdA);
        const list = await realmA.task.list();
        expect(Object.keys(list)).to.deep.equal([taskIdB]);
    })

    it('closes the client', async function () {
        await client.disconnect();
    });
});