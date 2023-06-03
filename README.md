# Hivekit Client for Browsers/NodeJS

The javascript/node client SDK for **[Hivekit](https://hivekit.io)**

Please find the full documentation for the client library at [https://hivekit.io/docs/js-client-sdk/client/](https://hivekit.io/docs/js-client-sdk/client/)

## Installation
Install via yarn or npm
```sh
npm install @hivekit/client-js --save-dev

yarn add @hivekit/client-js
```

## Basic Usage Example
```js
import HivekitClient from '@hivekit/client-js'

// Use a token issued via the Hivekit account interface
// or sign your own with a Hivekit provided secret.
// import jwt from 'jsonwebtoken'
// const token = jwt.sign({ sub: 'username' }, 'CHANGE_ME')

const client = new HivekitClient();

// Let's track the client's connection status below. If everything
// goes well, we should see:
// - connecting
// - connected
// - authenticated (that's when the client is ready to use)
client.on('connectionStatusChanged', () => {
    console.log(client.connectionStatus)
})
await client.connect('wss://api.hivekit.io/v1/ws');
await client.authenticate(token);

// A realm is a space within which something happens, e.g.
// a city or a factory hall. If we don't have one yet, we need
// to create it first using: 
await client.realm.create('test-realm'); // !!!this will throw an error if the realm already exists

// Most concepts within Hivekit exist within the scope
// of a realm
const realm = await client.realm.get('test-realm');

// Objects can represent vehicles, people, machines or
// other datasources. Let's create one:
await realm.object.create('rider/12', {
    label: 'Delivery Rider 12',
    location: {
        latitude: 52.5241175089,
        longitude: 13.3975679517
    },
    data: {
        charge: 0.6
    }
});

// This will return the object's data, e.g.:
// {
//     label: 'Delivery Rider 12',
//     location: {
//         coordinateSystem: '',
//         longitude: 13.3975679517,
//         latitude: 52.5241175089,
//         accuracy: 0,
//         speed: 0,
//         heading: 0,
//         altitude: 0,
//         altitudeAccuracy: 0,
//         time: '2023-03-29T10:08:55.4061132+02:00'
//     },
//     data: { charge: 0.6 },
//     connectionStatus: 'disconnected'
// }
const rider = await realm.object.get('rider/12');

// Use a subscription to get a realtime feed of object updates.
// Subscriptions can be scoped and filtered in lots of ways, but
// lets keep things simple for now.
const subscription = await realm.object.subscribe()
subscription.on('update', data => {
    console.log(data);
});

// Let's update the object to trigger the subscription above.
realm.object.update('rider/12', {
    location: {
        latitude: 52.52826383714,
        longitude: 13.38901541951
    }
});
```