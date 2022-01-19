import EventEmitter from "./event-emitter.js";
import C from "./constants.js";
import fieldnames from "./fieldnames.js";

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
        return this._client._subscription._removeSubscription(this);
    }

    /**
     * Processes a message meant for this subscription. Extracts and formats
     * the associated data for user consumption and conflates full and delta updates.
     * 
     * @TODO Check sequence numbering and reconsile if update is missing
     * 
     * @param {Object} msg
     * @emits update 
     * @returns {void}
     */
    _processIncomingMessage(msg) {
        let data;

        if (msg[C.TYPE.OBJECT]) {
            data = this._client._extendFieldsMap(msg[C.TYPE.OBJECT]);
        }
        else if (msg[C.TYPE.AREA]) {
            data = this._client._extendFieldsMap(msg[C.TYPE.AREA]);
        }
        else if (msg[C.TYPE.INSTRUCTION]) {
            data = this._client._extendFieldsMap(msg[C.TYPE.INSTRUCTION]);
        } else if (msg[C.TYPE.LOGEVENT]) {
            data = msg[C.TYPE.LOGEVENT]
        } else if (msg[C.FIELD.DATA] && msg[C.FIELD.DATA][C.FIELD.TYPE] === C.TYPE.REALM) {
            data = {
                realmId: msg[C.FIELD.DATA][C.FIELD.ID],
                action: fieldnames.ACTION[msg[C.FIELD.DATA][C.FIELD.ACTION]]
            }
        }

        if (!data) {
            data = [];
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
                this._client._onError('Received subscription message with unknown update type ' + msg[C.FIELD.UPDATE_TYPE])
                return;
        }

        this.emit('update', this._data);
    }
}