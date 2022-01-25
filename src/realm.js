import ObjectHandler from "./object-handler.js";
import AreaHandler from "./area-handler.js";
import InstructionHandler from './instruction-handler.js';
import EventEmitter from './event-emitter'
import C from './constants.js';
import fieldnames from "./fieldnames.js";
import { createMessage } from "./message.js";
import { extendMap, deepClone } from "./tools.js";

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
        this.id = id;
        this.label = label;

        this.object = new ObjectHandler(client, this);
        this.area = new AreaHandler(client, this);
        this.instruction = new InstructionHandler(client, this);
    }

    /**
     * Subscribes to log events within a realm.
     * 
     * @todo - we will need the ability to subscribe to changes in realm meta data as well
     * so might want to make this method more explicit (e.g. subscribeToLogs, subscribeToData)
     * or support an option argument defining what should be listened to
     *
     * @returns {Promise<Subscription>}
     */
    subscribe(options) {
        return this._client._subscription._getSubscription(
            this._client.getId('log-subs'),
            this.id,
            extendMap({
                [C.FIELD.TYPE]: C.TYPE.LOGEVENT,
                [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
            }, this._client._compressFields(options, fieldnames.FIELD))
        )
    }

    /**
     * Updates a value in the realm's metadata
     * 
     * @param {string} key 
     * @param {mixed} value
     * 
     * @returns {Promise<success>}
     */
    getData(key) {
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
     * @param {mixed} value
     * 
     * @returns {Promise<success>}
     */
    setData(key, value) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.UPDATE, this.id);
        this._data[key] = value;
        msg[C.FIELD.DATA] = this._data;
        this.emit('update'); // @todo - react to remote data changes
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /**
     * Searches Objects and Areas within the given realm.
     * 
     * @param {string} searchString 
     * @param {object} options
     * {
     *      // a list of properties to search in
     *  	field: ['data', 'label', 'id' ]
     * 
     *      // max amount of object results to be returned
            maxObjectResults

            // max amount of area results to be returned
            maxAreaResults
     * }
     * 
     * @returns {Promise<search results>}
     */
    search(searchString, options) {
        const data = this._client._compressFields(options, fieldnames.FIELD, true);
        data[C.STRING_VALUE] = searchString;
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