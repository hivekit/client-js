import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('Task Test', function () {
    var client,
        realmIdA,
        lastSubscriptionMessage,
        taskIdA,
        realmA;

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

    it('subscribes to all tasks', async function () {
        const subscription = await realmA.task.subscribe();
        subscription.on('update', data => {
            lastSubscriptionMessage = data;
        })
    })

    it('creates a task and retrieves it', async function () {
        taskIdA = client.getId('task-a-');
        const location = {
            longitude: 13.404954,
            latitude: 52.520008
        }

        const data = {
            strength: 5,
            intellience: 0.5,
            charisma: 4
        }

        await realmA.task.create(taskIdA, 'Task A Label', location, data, "sort out the rowdy folks", [], "NOT DONE", 4);

        const taskA = await realmA.task.get(taskIdA);
        expect(taskA.location.latitude).to.equal(location.latitude);
        expect(taskA.location.altitude).to.equal(0);
        expect(taskA.label).to.equal('Task A Label');
        expect(taskA.data).to.deep.equal(data);
    });

    it('cleans up the realm and closes the client', async function () {
        await client.realm.delete(realmIdA);
        await client.disconnect();
    });
});