import ObjectHandler from "./object-handler.js";
import AreaHandler from "./area-handler.js";
import InstructionHandler from './instruction-handler.js';
import EventEmitter from './event-emitter.js'
import { C, fieldnames } from './fields.js';
import { createMessage } from "./message.js";
import {deepClone} from "./tools.js";
import PubSubHandler from "./pubsub-handler.js";
import HistoryHandler from "./history-handler.js";
import TaskHandler from "./task-handler.js";

/**
 * Represents a single realm. This class is returned
 * whenever `client.realm.get(id)` is called. It provides
 * information (id, data, label) of the realm itself as well
 * as accessor methods to interact with the objects, areas and
 * instructions within it.
 */
export default class Realm extends EventEmitter {

    /**
     * Realms are instantiated by the {RealmHandler}
     * 
     * @param {string} id 
     * @param {string} label 
     * @param {object} data 
     * @param {HivekitClient} client 
     */
    constructor(id, label, data, client) {
        super();
        this._client = client;
        this._data = data;
        this._subscriptionCallbacks = {};
        this.id = id;
        this.label = label;

        this.object = new ObjectHandler(client, this);
        this.area = new AreaHandler(client, this);
        this.instruction = new InstructionHandler(client, this);
        this.pubsub = new PubSubHandler(client, this);
        this.history = new HistoryHandler(client, this);
        this.task = new TaskHandler(client, this);

        if (client.mode === C.MODE.WS) {
            client._subscription._getSubscription(
                client.getId(`realm-data-${id}`),
                id,
                {
                    [C.FIELD.TYPE]: C.TYPE.REALM,
                    [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM,
                }
            ).then(subscription => {
                this._dataSub = subscription
                subscription.on('update', ({data, label}) => {
                    this._data = data
                    this.label = label
                    this.emit('update')
                })
            })
        }
    }

    /**
     * Gets a value in the realm's metadata
     * 
     * @param {string} key
     * @returns {Promise<any>} value
     */
    async getData(key) {
        if (this._client.mode === C.MODE.HTTP) {
            const msg = createMessage(C.TYPE.REALM, C.ACTION.READ, this.id);
            return this._client._sendRequestAndHandleResponse(msg, response => {
                const data = response[C.FIELD.DATA][C.FIELD.DATA] || {}
                if (!key) {
                    return data
                } else {
                    return data[key]
                }
            });
        }

        if (!key) {
            return deepClone(this._data);
        }
        if (typeof this._data[key] === 'object') {
            return deepClone(this._data[key]);
        } else {
            return this._data[key]
        }
    }

    /**
     * Updates a value in the realm's metadata
     * 
     * @param {string} key 
     * @param {any} value
     * 
     * @returns {Promise<success>}
     */
    setData(key, value) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.UPDATE, this.id);
        this._data[key] = value;
        msg[C.FIELD.DATA] = deepClone(this._data);

        if (value === null) {
            delete this._data[key];
        }

        // this will result in a second update when the message comes back from the server
        this.emit('update');
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * Changes a realm's label
     * 
     * @param {string} label 
     * 
     * @returns {Promise<success>}
     */
    setLabel(label) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.UPDATE, this.id);
        this.label = label;
        msg[C.FIELD.LABEL] = label;

        // this will result in a second update when the message comes back from the server
        this.emit('update');
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * Searches Objects and Areas within the given realm.
     * 
     * @param {string} searchString 
     * @param {{field: string[],maxObjectResults: number,maxAreaResults: number}} options
     * {
     *      // a list of properties to search in
     *  	field: ['data', 'label', 'id' ]
     * 
     *      // max amount of object results to be returned
     *      maxObjectResults
     *
     *      // max amount of area results to be returned
     *      maxAreaResults
     * }
     * 
     * @returns {Promise<search results>}
     */
    search(searchString, options) {
        const data = this._client._compressFields(options, fieldnames.FIELD, true);
        data.val = searchString;
        const msg = createMessage(C.TYPE.REALM, C.ACTION.SEARCH, null, this.id, data);
        return this._client._sendRequestAndHandleResponse(msg, results => {
            if (!results[C.FIELD.DATA]) {
                return [];
            }
            return results[C.FIELD.DATA].map(result => {
                const extendedResult = this._client._extendFields(result);

                // These two transformations are specific to search results - maybe this should be more generic though?
                extendedResult.dataProperty = extendedResult.scopeType;
                delete extendedResult.scopeType;
                return extendedResult;
            });
        });
    }
}