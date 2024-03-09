import { C, fieldnames } from './fields.js';
import { createMessage } from './message.js';
import { parseLocation, extendMap } from './tools.js';


/**
 * This handler manages CRUD and subscriptions for tasks.
 * It can be accessed within the client from realm.task, e.g.
 * 
 * realm.task.create(...)
 * 
 * @class TaskHandler
 */
export default class TaskHandler {
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
    }

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

    get(id) {
        const msg = createMessage(C.TYPE.TASK, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            const extended = this._client._extendFields(response[C.FIELD.DATA]);
            if (extended.steps) {
                extended.steps = extended.steps.map(step => this._client._extendFields(step));
            }
            return extended;
        });
    }

    create(id, options) {
        const hasLocation = options.location && Object.keys(options.location).length > 0;

        if (hasLocation && options.targetId) {
            throw new Error('Cannot set both location and targetId');
        }

        if (!hasLocation && !options.targetId) {
            throw new Error('Task needs either a targetId or location');
        }

        return this._setTaskState(id, options, C.ACTION.CREATE);
    }

    update(id, options) {
        return this._setTaskState(id, options, C.ACTION.UPDATE);
    }

    list() {
        const msg = createMessage(C.TYPE.TASK, C.ACTION.LIST, null, this._realm.id);

        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    delete(id) {
        const msg = createMessage(C.TYPE.TASK, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /********************************************
     * INTERNAL METHODS
     *******************************************/
    _setTaskState(id, options, action) {
        const msg = createMessage(C.TYPE.TASK, action, id, this._realm.id);
        if (options.label) msg[C.FIELD.LABEL] = options.label;
        if (options.data) msg[C.FIELD.DATA] = options.data;
        if (options.status) {
            if (!Object.values(C.TASK_STATUS).includes(options.status)) {
                throw new Error(`Invalid task status: ${options.status}`);
            }
            msg[C.FIELD.STATUS] = options.status;
        }

        if (options.location) {
            msg[C.FIELD.LOCATION] = parseLocation(options.location);
        }

        if (options.steps) {
            msg[C.FIELD.STEPS] = options.steps.map(step => {
                return this._client._compressFields(step, fieldnames.FIELD);
            });
        }

        if (options.targetId) {
            msg[C.FIELD.TARGET_ID] = options.targetId;
        }

        if (options.description) {
            msg[C.FIELD.DESCRIPTION] = options.description;
        }

        return this._client._sendRequestAndHandleResponse(msg);
    }
}