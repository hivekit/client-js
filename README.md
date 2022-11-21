# Hivekit Client for Browsers/NodeJS

The javascript/node client for Hivekit

## Installation
Install via yarn or npm
```sh
npm install @hivekit/client-js --save-dev

yarn add @hivekit/client-js
```

## Usage
```js
import HivekitClient from '@hivekit/client-js'

// Create an instance of the client. This will not yet connect it.
// All settings are optional
const client = new HivekitClient({
    outgoingMessageBufferTime: 0,
    logMessages: false,
    logErrors: true,
    heartbeatInterval: 5000,
    reconnectInterval: 1000
});

// Client Properties
client.connectionStatus // 'connected','disconnected','connecting','disconnecting','authenticated'
client.ping // heartbeat roundtrip time in milliseconds
client.constants // access to system level constants
client.options // a map of user provided and default options
client.version // the version of the client SDK

// the version and build date of the server the client is connected to.
// populated once connectionStatus == 'authenticated'
client.serverVersion
client.serverBuildDate


// Events
'error' // emitted when an error occurs
'connectionStatusChanged' // emitted whenever the connectionStatus changes
'ping' // emitted when the ping measurement changes

// Subscribing to events (this is the same for all classes that emit events)
.on( eventName, callback, [context],[order])
.off( eventName, [callback], [context])
.emit( eventName, arg1, arg2, argN...)
.removeListenerById(id)
.hasListener(eventName)

// Methods
client.connect(url) // connect via Websocket. returns {Promise} OR
client.useHTTP(url) // prepare to make HTTP requests

client.authenticate(token) // returns {Promise}, only needs to be called explicitly if no token is set
client.disconnect() // returns {Promise}
client.getId(prefix) // returns randomly generated id
client.getURL() // returns the current WS URL - which might be different from the provided one if redirects occured


/**********************************
 * REALM
 * *******************************/
client.realm.subscribe() //returns {Promise<Subscription>} subscribe to create/update/delete for realms
client.realm.get(id) //returns {Promise<Realm>}
client.realm.create(id, {label: '...', data: {}}) //returns {Promise}
client.realm.update(id, {label: '...', data: {}}) //returns {Promise}
client.realm.delete(id)//returns {Promise}
client.realm.list()


/**********************************
 * SUBSCRIPTION
 * *******************************/
subscription.on('update', data=>{})
subscription.cancel()


/**********************************
 * REALM OBJECT (returned by client.realm.get(id)
 * *******************************/
realm.search( searchString, {
    // a list of properties to search in (default all)
    field: ['data', 'label', 'id' ],
    // max amount of object results to be returned
    maxObjectResults: 999,

    // max amount of area results to be returned
    maxAreaResults: 999
}) // returns {Promise<search results>}


/**********************************
 * OBJECT
 * *******************************/
realm.object.subscribe({
    // if set to true, an initial list of all objects that match the subscription criteria is sent out
    executeImmediatly: true, 
    // filter criteria to limit the objects to receive updates for
    attributes: ["charge<0.5", "type=drone"]
}) // returns {Promise<Subscription>}

realm.object.get(id) // returns {Promise<ObjectData>}
realm.object.create(id, {label: '...', location: {}, data: {}}) // returns {Promise}
realm.object.update(id, {label: '...', location: {}, data: {}}) // returns {Promise}
realm.object.set(id, {label: '...', location: {}, data: {}})
realm.object.delete(id) // returns {Promise}
realm.object.list(options) // returns {Promise<id:objectData>} options can be any of 
{
    field: ['customValue'] // fieldnames from data to be included in result
    where: ['key>value'] // key -> operator -> value filters
}

/**********************************
 * AREA
 * *******************************/
realm.area.subscribe({
    // if set to true, an initial list of all areas that match the subscription criteria is sent out
    executeImmediatly: true, 
    // filter criteria to limit the areas to receive updates for
    attributes: ["charge<0.5", "type=drone"] 
}) // returns {Promise<Subscription>}

realm.area.get(id) // returns {Promise<AreaData>}
realm.area.create(id, {label: '...', shapeData: {}, data: {}}) // returns {Promise}
realm.area.update(id, {label: '...', shapeData: {}, data: {}}) // returns {Promise}
realm.area.delete(id) // returns {Promise}
realm.area.list(options) // returns {Promise<areas>}
/**********************************
 * INSTRUCTION
 * *******************************/
realm.instruction.subscribe() // returns {Promise<Subscription>}

realm.instruction.get(id) // returns {Promise<AreaData>}
realm.instruction.create(id,{label: '...', instructionString: '...', data: {}}) // returns {Promise}
realm.instruction.update(id, {label: '...', instructionString: '...', data: {}}) // returns {Promise}
realm.instruction.delete(id) // returns {Promise}
realm.instruction.list(options) // returns {Promise<instructions>}
```