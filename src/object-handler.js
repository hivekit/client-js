import C from './constants.js'
import { createMessage } from './message.js'
import fieldnames from './fieldnames.js';
import { extendMap } from './tools.js';

/**
 * This class exposes functionality to create, read, update, delete
 * and subscribe to objects within the scope of a realm.
 * 
 * It is accessible from a realm object via e.g.
 * 
 * northLondon = await client.realm.get( 'north-london' );
 * taxi143 = await northLondon.object.get( 'taxi-143' );
 */
export default class ObjectHandler {

    /**
     * This class is created whenver a Realm is instantiated
     * 
     * @param {HivekitClient} client 
     * @param {Realm} realm 
     */
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
        this._locationFields = this._getLocationFields();
    }

    /**
     * Subscribes to updates to objects within a realm. This will be invoked whenever
     * any object within the realm is created, updated or deleted.
     *  
     * @param {Object} options A key/value map of subscription options including
     * @example
     * {
     *   executeImmediatly: true, // if set to true, an initial list of all objects that match the subscription criteria is sent out
     *   attributes: ["charge<0.5", "type=drone"] // filter criteria to limit the objects to receive updates for
     * }
     * 
     * @returns {Promise<Subscription>}
     */
    subscribe(options) {
        return this._client._subscription._getSubscription(
            this._client.getId('object-subscription'),
            this._realm.id,
            extendMap({
                [C.FIELD.TYPE]: C.TYPE.OBJECT,
                [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
            }, this._client._compressFields(options, fieldnames.FIELD))
        );
    }

    /**
     * Returns data for a given object
     * 
     * @param {string} id 
     * @returns {Promise<Object>}
     */
    get(id) {
        if (!id) {
            throw new Error('no id provided for object.get');
        }
        const msg = createMessage(C.TYPE.OBJECT, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            return this._client._extendFields(response[C.FIELD.DATA]);
        });
    }

    /**
     * Creates a new object and returns a confirmation. This method will fail 
     * if an object with this ID already exists.
     * 
     * If you don't wish to specify a label, location or data, provide null instead
     * 
     * If you wish to quickly create or update objects without the need for a confirmation,
     * use `set()` instead.
     * 
     * @param {string} id 
     * @param {string} [label]
     * @param {object} [location]
     * @param {object} [data]
     * 
     * @returns {Promise<result>}
     */
    create(id, label, location, data) {
        return this._setObjectState(id, label, location, data, C.ACTION.CREATE);
    }

    /**
     * Updates an existing object and returns a confirmation. This method will fail 
     * if an object with this ID does not exist.
     * 
     * If you don't wish to specify a label, location or data, provide null instead
     * 
     * If you wish to quickly create or update objects without checking if they already exist or receiving confirmation,
     * use `set()` instead.
     * 
     * @param {string} id 
     * @param {string} [label]
     * @param {object} [location]
     * @param {object} [data]
     * 
     * @returns {Promise<result>}
     */
    update(id, label, location, data) {
        return this._setObjectState(id, label, location, data, C.ACTION.UPDATE);
    }

    /**
     * Creates or updates objects without waiting for confirmation.
     * 
     * This is useful for data connectors or firehose scenarios where
     * you quickly want to pump large amounts of data into Hivekit without
     * the need to explicitly create objects first or to have strong consistency
     *
     * @param {string} id 
     * @param {string} [label]
     * @param {object} [location]
     * @param {object} [data]
     */
    set(id, label, location, data) {
        this._setObjectState(id, label, location, data, C.ACTION.SET);
    }

    /**
     * 
     * @param {object} options 
     * @returns 
     */
    list(options) {
        const msg = createMessage(C.TYPE.OBJECT, C.ACTION.LIST, null, this._realm.id);
        if (options && Object.keys(options).length > 0) {
            msg[C.FIELD.DATA] = this._client._compressFields(options, fieldnames.FIELD);
        }
        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    /**
     * Deletes an object. Will throw an error if the object can't be found.
     * 
     * @param {string} id 
     * @returns {Promise<Success>}
     */
    delete(id) {
        const msg = createMessage(C.TYPE.OBJECT, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /********************************************
     * INTERNAL METHODS
     *******************************************/

    /**
     * Maps location fields to fieldnames
     * 
     * @returns {object} locationFields
     */
    _getLocationFields() {
        const locationFields = {};
        for (var fieldname in fieldnames.LOCATION) {
            locationFields[fieldnames.LOCATION[fieldname]] = fieldname;
        }
        return locationFields
    }

    /**
     * Composes a message object and passes it on to the client
     * 
     * @param {string} id 
     * @param {string} label 
     * @param {object} location 
     * @param {object} data 
     * @param {string} action one of C.ACTION.*
     * 
     * @returns {Promise<success> }
     */
    _setObjectState(id, label, location, data, action) {
        const msg = createMessage(C.TYPE.OBJECT, action, id, this._realm.id);
        if (label) msg[C.FIELD.LABEL] = label;
        if (location && Object.keys(location).length > 0) {
            msg[C.FIELD.LOCATION] = this._parseLocation(location);
        }
        if (data && Object.keys(data).length > 0) msg[C.FIELD.DATA] = data;
        if (action === C.ACTION.SET) {
            this._client._sendMessage(msg);
        } else {
            return this._client._sendRequestAndHandleResponse(msg);
        }
    }

    /**
     * Converts a user defined location object into something
     * compatible with the servers idea of what a location
     * should look like.
     * 
     * @param {object} location 
     * @returns {object} parsed location
     */
    _parseLocation(location) {
        const parsedLocation = {};
        for (var key in location) {
            if (key.length === 0) {
                continue;
            }
            if (typeof location[key] !== 'string') {
                parsedLocation[this._locationFields[key]] = location[key];
                continue;
            }
            if (location[key].length > 0) {
                if (key === fieldnames.LOCATION[C.LOCATION.TIME]) {
                    try {
                        parsedLocation[key] = (new Date(location[key])).toISOString();
                    } catch (e) {
                        throw new Error(`Can't convert ${location[key]} into a valid date:${e}`);
                    }
                } else {
                    parsedLocation[this._locationFields[key]] = parseFloat(location[key]);
                }
            }
        }

        return parsedLocation;
    }
}