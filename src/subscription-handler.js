import { getPromise } from './promise.js'
import { createMessage } from './message.js'
import C from './constants.js'
import Subscription from './subscription.js'

/**
 * The SubscriptionHandler is not directly exposed to the user, but used
 * internally to manage subscriptions and subscription related message routing.
 */
export default class SubscriptionHandler {

    /**
     * This class is instantiated once by the Hivekit Client
     * 
     * @constructor
     * @param {HivekitClient} client 
     */
    constructor(client) {
        this._client = client;

        /**
         * The HivekitClient tries to optimize data usage by creating
         * a single server side subscription for a given set of subscription criteria
         * and distribute its updates onto multiple client side subscription objects.
         * 
         * To achieve this, it maintains an Array of subscription collections in the following
         * format:
         * 
         * this._subscriptionCollections[ id ] = [
         *      subscription,
         *      subscription
         * ].signature
         * 
         * where
         * 
         * - id is the ID with which the subscription is registered with the server
         * - subscription is an instance of {Subscription}. Each instance can be cancelled individually
         *   which will unbind its event handlers and remove it from the subscription collection.
         *   Only if all subscription objects are removed from the collection will the server be notified
         *   to cancel the subscription
         * - signature is a hash based on the subscriptions realm and options. So even if the client subscribes
         *   to the same criteria in multiple places across an app, it will be mapped to the same subscription.
         *   
         */
        this._subscriptionCollections = {};
        this._pendingSubscriptionPromises = {};
    }

    /**
     * Returns and - if necessary - creates a subscription.
     * 
     * @param {String} [id] 
     * @param {String} realmId
     * @param {Map} options
     * @returns {Promise<Subscription>}
     */
    _getSubscription(id, realmId, options) {
        const resultPromise = getPromise();
        const signature = this._client._getSignature(realmId, options);
        var subscription;

        // Let's see if a subscription collection with a given id already exists
        var subscriptionCollection = this._subscriptionCollections[id];

        // If no subscriptionCollection exists for a given ID, maybe there is one
        // with the same parameters (realm and options) as expressed by its signature
        if (!subscriptionCollection) {
            for (var _id in this._subscriptionCollections) {
                if (this._subscriptionCollections[_id].signature === signature) {
                    id = _id;
                    subscriptionCollection = this._subscriptionCollections[id];
                }
            }
        }

        // If we've found a collection, let's add our subscription to it and we're good
        if (subscriptionCollection) {
            subscription = new Subscription(this._client, id, realmId);
            subscriptionCollection.push(subscription)
            resultPromise.resolve(subscription)
            if (options[C.FIELD.EXECUTE_IMMEDIATELY]) {
                this._invokeImmediatly(subscription)
            }
            return resultPromise;
        }

        // The id parameter is optional and usually will be null when the subscription
        // is created by the client. Let's create an id.
        if (!id) {
            id = this.getId(this.constants.TYPE.SUBSCRIPTION);
        }

        // If we still haven't found a subscriptionCollection, create a new one
        subscription = new Subscription(this._client, id, realmId);
        this._subscriptionCollections[id] = [subscription];
        this._subscriptionCollections[id].signature = signature;

        // If a subscription with the same signature has been requested already,
        // but the request has not yet resolved, register this promise to be resolved
        // once the subscription is loaded
        if (this._pendingSubscriptionPromises[signature]) {
            this._pendingSubscriptionPromises[signature].push({ resultPromise, subscription })
            return resultPromise;
        }

        // No subscription with the given id or signature exists. We need to create
        // it. First, let's register it as a pending request.
        this._pendingSubscriptionPromises[signature] = [{ resultPromise, subscription }];

        // Let's send a message to the server to subscribe
        const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.CREATE, id, realmId, options)
        this._client._sendRequest(msg, res => {
            if (res[C.FIELD.RESULT] === C.RESULT.SUCCESS) {
                this._pendingSubscriptionPromises[signature].forEach(entry => {
                    entry.resultPromise.resolve(entry.subscription);
                });
            } else {
                this._pendingSubscriptionPromises[signature].forEach(promise => {
                    promise.reject(res[C.FIELD.ERROR]);
                });
            }

            delete this._pendingSubscriptionPromises[signature];
        })

        return resultPromise;
    }

    /**
     * Invoked, when `subscription.cancel()` is called. This
     * removes the subscription from its collection and - should the collection
     * be empty afterwards - unsubscribes from the server and removes the collection itself.
     * 
     * @param {Subscription} subscription 
     * @returns {Promise<success>}
     */
    _removeSubscription(subscription) {
        if (!this._subscriptionCollections[subscription.id]) {
            throw new Error('Can`t remove unknown subscription ' + subscription.id);
        }

        if (!this._subscriptionCollections[subscription.id].includes(subscription)) {
            throw new Error('Subscription not found for id ' + subscription.id);
        }

        this._subscriptionCollections[subscription.id] = this._subscriptionCollections[subscription.id].filter(_subscription => {
            return subscription !== _subscription;
        })

        // If there are still other subscriptions left, do nothing
        if (this._subscriptionCollections[subscription.id].length > 0) {
            return new Promise(resolve => {
                resolve();
            })
        }

        const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.DELETE, subscription.id, subscription.realmId);
        delete this._subscriptionCollections[subscription.id];
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * Handles incoming messages with topic=subscription
     * 
     * @param {Object} msg 
     */
    _handleIncomingMessage(msg) {
        const id = msg[C.FIELD.ID];
        if (!this._subscriptionCollections[id]) {
            this._client._onError('Received message for unknown subscription ' + msg);
        } else {
            for (var i = 0; i < this._subscriptionCollections[id].length; i++) {
                this._subscriptionCollections[id][i]._processIncomingMessage(msg)
            }
        }
    }

    /**
     * If the user registers a subscription that has the same signature as an
     * existing subscription for which we already received an update, this method
     * will find the similar subscription and invoke the new subscription with
     * the existing subscription's data.
     * 
     * @param {Subscription} subscription 
     * @returns {void}
     */
    _invokeImmediatly(subscription) {
        if (!this._subscriptionCollections[subscription.id]) {
            return;
        }

        var data = null, i;
        for (i = 0; i < this._subscriptionCollections[subscription.id].length; i++) {
            if (this._subscriptionCollections[subscription.id][i]._data) {
                data = this._subscriptionCollections[subscription.id][i]._data;
            }
        }

        if (data) {
            setTimeout(() => {
                subscription.emit('update', data);
            }, 10);
        }
    }
}