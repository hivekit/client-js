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

## Static data and object categories

Object `create`, `update`, and `set` accept `staticData` and `categoryId`.
Area `create` and `update` accept `staticData`. Creation requires a shape;
metadata-only updates can omit it.

`data` and `staticData` are separate attribute maps. Updates patch the supplied
map: omitted keys stay unchanged, and a key with a `null` value is removed.
Both maps may contain the same key; dynamic `data` takes precedence when reading
an effective value. The SDK returns both maps separately on reads,
subscriptions, and history entries.

`categoryId` is the authoritative object category. Omit it to leave the category
unchanged, or send `null` to clear it. The server still accepts the
`$hkt_category` alias in either attribute map; an explicit `categoryId` wins,
followed by the alias in `data`, then in `staticData`. On reads, the server
provides the alias in `data` when a category is set.

`object.list` field selectors keep their full names:

```js
await realm.object.update('rider/12', {
    staticData: { model: 'Cargo bike', status: 'available' },
    data: { status: null },
    categoryId: 'courier'
});

const riders = await realm.object.list({
    field: ['data', 'staticData', 'categoryId']
});

await realm.object.update('rider/12', { categoryId: null });
```

The native protocol sends these properties as `dat`, `sdt`, and `cat` in both
WebSocket and HTTP modes. SDK callers use the full names above. History entries
contain historical dynamic data alongside current static data, label, and category.
