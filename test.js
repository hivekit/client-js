import HivekitClient from './src/index-node.js'
import config from './test/config.js'
import jwt from 'jsonwebtoken'

(async () => {
    const clientA = new HivekitClient({ logErrors: true, logMessages: false });
    await clientA.connect(config.wsUrl);
    await clientA.authenticate(jwt.sign({ sub: 'userA' }, config.authTokenSecret));


    const realmIdA = clientA.getId('realm-a');
    await clientA.realm.create(realmIdA, 'label for realm a', { some: 'value' });
    const realmInstanceA = await clientA.realm.get(realmIdA);

    const eventA = clientA.getId('event-a');
    await realmInstanceA.pubsub.subscribe(eventA, "/object/*", msg => {
        console.log('clientA received event', msg)
    })

    const clientB = new HivekitClient({ logErrors: true, logMessages: false });
    await clientB.connect(config.wsUrl);
    await clientB.authenticate(jwt.sign({ sub: 'userB' }, config.authTokenSecret));

    const realmInstanceB = await clientB.realm.get(realmIdA);
    await realmInstanceB.pubsub.publish(eventA, "/object/123", {
        firstname: 'Max'
    });

})()
