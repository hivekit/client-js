import C from './constants.js'
import { getPromise } from './promise.js'
import { createMessage } from './message.js'
import Realm from './realm.js'

/**
 * The realm handler provides CRUD and subscription methods for realms.
 * 
 * @class RealmHandler
 */
export default class RealmHandler {

    /**
     * The RealmHandler is instantiated by the HivekitClient directly
     * 
     * @constructor
     * @param {HivekitClient} client 
     */
    constructor(client) {
        this._client = client;
        this._realms = {};
    }

    /**
     * Subscribes to the creation, updating and deletion of realms.
     * 
     * @returns {Promise<Subscription>}
     */
    subscribe() {
        return this._client._subscription._getSubscription(this._client.getId('realm-subscription-'), C.TYPE.SYSTEM, {
            [C.FIELD.TYPE]: C.TYPE.SYSTEM,
            [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
        });
    }

    /**
     * Resurns a realm object for an existing realm
     * 
     * @param {string} id 
     * @returns {Promise<Realm>}
     */
    get(id) {
        if (this._realms[id]) {
            const result = getPromise();
            result.resolve(this._realms[id]);
            return result;
        }

        if (this._client.mode === C.MODE.HTTP) {
            this._realms[id] = new Realm(id, null, {}, this._client);
            return Promise.resolve(this._realms[id]);
        }

        const msg = createMessage(C.TYPE.REALM, C.ACTION.READ, id);

        return this._client._sendRequestAndHandleResponse(msg, response => {
            this._realms[id] = new Realm(id,
                response[C.FIELD.DATA][C.FIELD.LABEL],
                response[C.FIELD.DATA][C.FIELD.DATA] || {},
                this._client
            );
            return this._realms[id];
        });
    }

    /**
     * Creates a new realm. Will throw an error if a realm with the given ID already exists.
     * 
     * @param {string} id 
     * @param {string} label 
     * @param {object} data Arbitrary key/valua data to be associated with the realm
     * 
     * @returns {Promise<success>}
     */
    create(id, label, data) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.CREATE, id);
        if (label) msg[C.FIELD.LABEL] = label;
        if (data && Object.keys(data).length > 0) msg[C.FIELD.DATA] = data;
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * Lists all realms the currently authenticated tenant has access to.
     * 
     * @returns {Promise<list>}
     */
    list() {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.LIST);
        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result.dat);
        });
    }

    /**
     * Deletes an existing realm. Will throw an error if the given realm
     * does not exist.
     * 
     * @param {string} id 
     * @returns {Promise<success>}
     */
    delete(id) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.DELETE, id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * proxies messages to pubsub handler
     * 
     * @param {Object} msg 
     */
    _handleIncomingMessage(msg) {
        if (msg[C.FIELD.ACTION] == C.ACTION.PUBLISH && this._realms[msg[C.FIELD.REALM]]) {
            this._realms[msg[C.FIELD.REALM]].pubsub._emitSubscriptionEvent(
                msg[C.FIELD.DATA][C.FIELD.EVENT_NAME],
                msg[C.FIELD.DATA][C.FIELD.DATA],
                msg[C.FIELD.DATA][C.FIELD.ID_PATTERN]
            )
        }
    }
}