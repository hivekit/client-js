import C from './constants.js'
import { createMessage } from './message.js'
import fieldnames from './fieldnames.js';
import { extendMap } from './tools.js';

/**
 * This class exposes functionality to create, read, update, delete
 * and subscribe to tasks within the scope of a realm.
 * 
 * It is accessible from a realm object via e.g.
 * 
 * northLondon = await client.realm.get( 'north-london' );
 * task123 = await northLondon.task.get( 'task-143' );
 */
export default class TaskHandler {

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
     * Subscribes to updates to tasks within a realm. This will be invoked whenever
     * any task within the realm is created, updated or deleted.
     *  
     * @param {Object} options A key/value map of subscription options including
     * @example
     * {
     *   executeImmediatly: true, // if set to true, an initial list of all tasks that match the subscription criteria is sent out
     *   attributes: ["charge<0.5", "type=drone"] // filter criteria to limit the tasks to receive updates for
     * }
     * 
     * @returns {Promise<Subscription>}
     */
    subscribe(options) {
        return this._client._subscription._getSubscription(
            this._client.getId('task-subscription'),
            this._realm.id,
            extendMap({
                [C.FIELD.TYPE]: C.TYPE.TASK,
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
            throw new Error('no id provided for task.get');
        }
        const msg = createMessage(C.TYPE.TASK, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            return this._client._extendFields(response[C.FIELD.DATA]);
        });
    }

    /**
     * Creates a new task and returns a confirmation. This method will fail
     * if an object with this ID already exists.
     * 
     * If you don't wish to specify a label, location or data, provide null instead
     * 
     * If you wish to quickly create or update tasks without the need for a confirmation,
     * use `set()` instead.
     * 
     * @param {string} id 
     * @param {string} [label]
     * @param {object} [location]
     * @param {object} [data]
     * @param {string} description
     * @param {string[]} objectIds
     * @param {string} status
     * @param {number} priority
     *
     * @returns {Promise<result>}
     */
    create(id, label, location, data, description, objectIds, status, priority) {
        return this._setTaskState(id, label, location, data, C.ACTION.CREATE, description, objectIds, status, priority);
    }

    /**
     * Updates an existing task and returns a confirmation. This method will fail
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
     * @param {string} description
     * @param {string[]} objectIds
     * @param {string} status
     * @param {number} priority
     * 
     * @returns {Promise<result>}
     */
    update(id, label, location, data, description, objectIds, status, priority) {
        return this._setTaskState(id, label, location, data, C.ACTION.UPDATE, description, objectIds, status, priority);
    }

    /**
     * Creates or updates task without waiting for confirmation.
     * 
     * This is useful for data connectors or firehose scenarios where
     * you quickly want to pump large amounts of data into Hivekit without
     * the need to explicitly create the task first or to have strong consistency
     *
     * @param {string} id 
     * @param {string} [label]
     * @param {object} [location]
     * @param {object} [data]
     * @param {string} description
     * @param {string} [objectIds]
     * @param {string} status
     * @param {number} priority
     */
    set(id, label, location, data, description, objectIds, status, priority) {
        this._setTaskState(id, label, location, data, C.ACTION.SET, description, objectIds, status, priority);
    }

    /**
     * 
     * @param {object} options 
     * @returns 
     */
    list(options) {
        const msg = createMessage(C.TYPE.TASK, C.ACTION.LIST, null, this._realm.id);
        if (options && Object.keys(options).length > 0) {
            msg[C.FIELD.DATA] = this._client._compressFields(options, fieldnames.FIELD);
        }
        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    /**
     * Deletes a task. Will throw an error if the task can't be found.
     * 
     * @param {string} id 
     * @returns {Promise<Success>}
     */
    delete(id) {
        const msg = createMessage(C.TYPE.TASK, C.ACTION.DELETE, id, this._realm.id);
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
     * @param {string} description
     * @param {string[]} objectIds
     * @param {string} status
     * @param {number} priority
     * 
     * @returns {Promise<success> }
     */
    _setTaskState(id, label, location, data, action, description, objectIds, status, priority) {
        const msg = createMessage(C.TYPE.TASK, action, id, this._realm.id, undefined, undefined, description, objectIds, status, priority);
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