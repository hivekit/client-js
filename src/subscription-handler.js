import { getPromise } from './promise'
import {createMessage} from './message'
import C from './constants'
import Subscription from './subscription'

export default class SubscriptionHandler{
    constructor( client ) {
        this._client = client;
        this._subscriptions = {};
        this._pendingSubscriptionPromises = {};
    }

    /**
     * Returns and - if necessary - creates a subscription.
     * 
     * @param {String} [id] 
     * @param {String} realm 
     * @param {Map} options
     * @returns {Promise<Subscription>}
     */
    _getSubscription( id, realmId, options ) {
        const resultPromise = getPromise();

        // If a subscription with this ID already exists, return it.
        if( this._subscriptions[ id ] ) {
            resultPromise.resolve( this._subscriptions[ id ] );
            return resultPromise;
        }

        // If a subscription with the same parameters (realm and options) already
        // exists, return it.
        const signature = this._client._getSignature( realmId, options );
        for( var key in this._subscriptions ) {
            if( this._subscriptions[ key ].signature === signature ) {
                resultPromise.resolve( this._subscriptions[ key ] );
                return resultPromise;
            }
        }

        // If a subscription with the same signature has been requested already,
        // but the request has not yet resolved, register this promise to be resolved
        // once the subscription is loaded
        if( this._pendingSubscriptionPromises[ signature ] ) {
            this._pendingSubscriptionPromises[ signature ].push( resultPromise );
            return resultPromise;
        }

        // No subscription with the given id or signature exists. We need to create
        // it. First, let's register it as a pending request.
        this._pendingSubscriptionPromises[ signature ] = [ resultPromise ];

        // The id parameter is optional and usually will be null when the subscription
        // is created by the client. Let's create an id.
        if( !id ) {
            id = this.getId( this.constants.TYPE.SUBSCRIPTION );
        }
        
        const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.CREATE, id, realmId)
        msg[C.FIELD.DATA] = options;

        this._client._sendRequest(msg, res => {
            if( res[C.FIELD.RESULT] === C.RESULT.SUCCESS ) {
                this._subscriptions[ id ] = new Subscription( this._client, id );
                this._subscriptions[ id ].signature = signature;
                this._pendingSubscriptionPromises[ signature ].forEach( promise => {
                    promise.resolve( this._subscriptions[ id ] );
                });

                // TODO if the subscription already exists and is called with execute immediatly
                // make it emit its current dataset
            } else {
                this._pendingSubscriptionPromises[ signature ].forEach( promise => {
                    promise.reject(res[C.FIELD.ERROR]);
                });
            }

            delete this._pendingSubscriptionPromises[ signature ];
        })
     
        return resultPromise;
    }

    _handleIncomingMessage( msg ) {
        const id = msg[ C.FIELD.ID ];

        if( !this._subscriptions[ id ] ) {
            this._client._onError( 'Received message for unknown subscription ' + msg );
        } else {
            this._subscriptions[ id ]._processIncomingMessage( msg )
        }
    }
}