import EventEmitter from "./event-emitter.js";
import { C, fieldnames } from './fields.js';
import { createMessage } from "./message.js";
import { extendMap, toShape } from './tools.js';

/**
 * Subscription represents a single subscription to a given subject with
 * a given set of options. It emits an `update` event whenever a subscription
 * notification is received and can by unsubscribed by calling `cancel()`
 * 
 * @class Subscription
 * @extends EventEmitter
 */
export default class Subscription extends EventEmitter {

    /**
     * Subscriptions are created by the {SubscriptionHandler}
     * 
     * @constructor
     * @param {HivekitClient} client 
     * @param {string} id 
     * @param {string} realmId 
     */
    constructor(client, id, realmId) {
        super();
        this.id = id;
        this.realmId = realmId;
        this._client = client;
        this._data = null;
    }

    /**
     * Unsubscribes this subscription
     * 
     * @returns {Promise<success>}
     */
    cancel() {
        this.listener = {};
        return this._client._subscription._removeSubscription(this);
    }

    /**
     * Updates an existing subscription. This is useful to subscribe e.g. to objects
     * within a moving radius or to limit updates to the area currently visible on the screen.
     *  
     * @param {Object} options A key/value map of subscription options including
     * @example
     * {
     *   shape: {cx: -0.14059031608, cy: 51.50183460, r: 500}
     *   attributes: ["charge<0.5", "type=drone"] // optional filter criteria to limit the objects to receive updates for
     * }
     * 
     * @returns {Promise<Subscription>}
     */
    update(options) {
        if (options && options.shape) {
            const shape = toShape(options.shape);
            if (shape.err) {
                return Promise.reject(shape.err);
            }
            options.scopeType = shape.type;
            options.shape = shape.data;
        }

        const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.UPDATE, this.id, this.realmId, extendMap({
            [C.FIELD.TYPE]: C.TYPE.OBJECT,
            [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
        }, this._client._compressFields(options, fieldnames.FIELD)));

        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * Processes a message meant for this subscription. Extracts and formats
     * the associated data for user consumption and conflates full and delta updates.
     * 
     * @TODO Check sequence numbering and reconcile if update is missing
     * 
     * @param {Object} msg
     * @emits update 
     * @returns {void}
     */
    _processIncomingMessage(msg) {
        if (this._data === null) {
            this._data = {};
        }
        if (msg[C.TYPE.OBJECT] || msg[C.TYPE.TASK]) {
            const update = msg[C.TYPE.OBJECT] || msg[C.TYPE.TASK];
            const delta = {
                added: this._client._extendFieldsMap(update[C.ACTION.CREATE]),
                updated: this._client._extendFieldsMap(update[C.ACTION.UPDATE]),
                removed: update[C.ACTION.DELETE],
            };

            if (msg[C.FIELD.UPDATE_TYPE] === C.UPDATE_TYPE.FULL) {
                this._data = {};
            }

            for (let id in delta.added) {
                this._data[id] = delta.added[id];
            }

            for (let id in delta.updated) {
                this._data[id] = delta.updated[id];
            }

            for (let id in delta.removed) {
                delete this._data[id];
            }

            this.emit('update', this._data, delta, msg[C.FIELD.UPDATE_TYPE] === C.UPDATE_TYPE.FULL ? 'full' : 'delta')
            return;
        }

        var data = {};

        if (msg[C.TYPE.AREA]) {
            data = this._client._extendFieldsMap(msg[C.TYPE.AREA]);
        } else if (msg[C.TYPE.INSTRUCTION]) {
            data = this._client._extendFieldsMap(msg[C.TYPE.INSTRUCTION]);
        } else if (msg[C.TYPE.LOGEVENT]) {
            data = this._client._extendFieldsArray(msg[C.TYPE.LOGEVENT]);
        } else if (msg[C.FIELD.DATA] && msg[C.FIELD.DATA][C.FIELD.TYPE] === C.TYPE.REALM) {
            data = {
                realmId: msg[C.FIELD.DATA][C.FIELD.ID],
                action: fieldnames.ACTION[msg[C.FIELD.DATA][C.FIELD.ACTION]]
            }
        }

        switch (msg[C.FIELD.UPDATE_TYPE]) {
            case C.UPDATE_TYPE.FULL:
                this._data = data;
                break;
            case C.UPDATE_TYPE.DELTA:
                for (var id in data) {
                    this._data[id] = data[id];
                }
                break;
            default:
                this._client._onError('Received subscription message with unknown update type ' + msg[C.FIELD.UPDATE_TYPE], C.ERROR.UNKNOWN_TYPE)
                return;
        }

        this.emit('update', this._data);
    }
}