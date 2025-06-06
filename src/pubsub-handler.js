import { C } from './fields.js';
import { createMessage } from "./message.js";

/**
 * This class provides methods for publish/subscribe
 * functionality for realms. It allows clients to publish
 * messages to other clients as well as subscribe to updates
 * from others and from the server.
 * 
 * This class is accessible as a property on the realm instance,
 * e.g. myRealm.pubsub.subscribe('someevent', data => {})
 * 
 * @class PubSubHandler
 */
export default class PubSubHandler {

    /**
     * @constructor
     * @param {HivekitClient} client 
     * @param {Realm} realm 
     */
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
        this._subscriptionCallbacks = [];
    }

    /**
     * Subscribe to messages for a given event and optionally
     * idPattern.
     * 
     * This method can be invoked with two arguments, eventName and callback
     * or with eventName, idPattern, callback
     * 
     * @param {string} eventName the name of the event to subscribe to
     * @param {string|function} idPatternOrCallback an optional id pattern, further specifying the subject of an event
     * @param {function} callback function that will be invoked with the event data when the event occurs
     * 
     * @returns Promise<success>
     */
    subscribe(eventName, idPatternOrCallback, callback) {
        let idPattern = "*";

        if (arguments.length === 2) {
            callback = idPatternOrCallback;
        } else {
            idPattern = idPatternOrCallback
        }

        const enip = `${eventName}:${idPattern}`;
        let exists = this._subscriptionCallbacks[enip];
        this._subscriptionCallbacks[enip] = this._subscriptionCallbacks[enip] || [];
        this._subscriptionCallbacks[enip].push(callback);
        if (!exists) {
            const msg = this._getPubSubMessage(
                C.ACTION.SUBSCRIBE,
                eventName,
                idPattern
            );

            this._client._repeatOnReconnect('pubsub', this._realm.id, eventName + idPattern, msg);
            return this._client._sendRequestAndHandleResponse(msg);
        }
        return Promise.resolve({});
    }

    /**
     * Ends a subscription that was previously established via .subscribe()
     * 
     * @param {string} eventName name of the previously subscribed event
     * @param {string} idPatternOrCallback optional id pattern
     * @param {function} callbackFn the callback that was previously registered. If omitted, all callbacks for the given event and idPattern will be removed.
     * @returns Promise<success>
     */
    unsubscribe(eventName, idPatternOrCallback, callbackFn) {
        let idPattern = "*";
        let callback = null;

        if (typeof idPatternOrCallback === 'function') {
            callback = idPatternOrCallback;
        } else if (idPatternOrCallback) {
            idPattern = idPatternOrCallback;
        }

        const enip = `${eventName}:${idPattern}`;
        let exists = this._subscriptionCallbacks[enip];
        if (exists) {
            if (callback) {
                const subs = this._subscriptionCallbacks[enip];
                const index = subs.indexOf(callback);
                if (index > -1) {
                    subs.splice(index, 1);
                }
            } else {
                this._subscriptionCallbacks[enip].length = 0;
            }

            if (this._subscriptionCallbacks[enip].length === 0) {
                delete this._subscriptionCallbacks[enip];
                this._client._removeFromRepeatOnReconnect('pubsub', this._realm.id, eventName + idPattern);
                return this._client._sendRequestAndHandleResponse(this._getPubSubMessage(
                    C.ACTION.UNSUBSCRIBE,
                    eventName,
                    idPattern
                ));
            }
        }

        return Promise.reject({
            message: "no subscription with that id pattern",
            code: 400
        })
    }

    /**
     * Send a message to all subscribers.
     * 
     * @param {string} eventName name of the event
     * @param {string} idPatternOrData an optional id or id pattern to further specify the subject of the event
     * @param {object} data any JSON-serializable data that should be sent as part of the event
     * 
     * @returns Promise<success>
     */
    publish(eventName, idPatternOrData, data) {
        var idPattern;

        if (arguments.length === 2) {
            idPattern = '*';
            data = idPatternOrData;
        } else {
            idPattern = idPatternOrData
        }
        const msg = this._getPubSubMessage(C.ACTION.PUBLISH, eventName, idPattern)
        msg[C.FIELD.DATA][C.FIELD.DATA] = data;
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * This method is invoked by the realm handler when a publish message is received
     * 
     * @private
     * @param {string} eventName 
     * @param {object} data 
     * @param {string} idPattern
     */
    _emitSubscriptionEvent(eventName, data, idPattern) {
        const enip = `${eventName}:${idPattern}`;
        const subs = this._subscriptionCallbacks[enip];
        if (subs) {
            if (['connectionStatusChanged'].includes(eventName)) {
                data = this._client._extendFields(data);
            }
            for (let i = 0; i < subs.length; i++) {
                subs[i](data);
            }
        }
    }

    /**
     * This method constructs a message for a pub/sub action
     * 
     * @private
     * @param {string} action 
     * @param {string} eventName 
     * @param {string} idPattern 
     * @returns {object} message
     */
    _getPubSubMessage(action, eventName, idPattern) {
        const msg = createMessage(C.TYPE.REALM, action, this._realm.id);

        msg[C.FIELD.DATA] = {
            [C.FIELD.EVENT_NAME]: eventName,
            [C.FIELD.ID_PATTERN]: idPattern || '*'
        };

        return msg;
    }
}