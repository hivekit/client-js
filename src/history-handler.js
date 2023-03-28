import C from './constants.js'
import { createMessage } from './message.js'
import fieldnames from './fieldnames.js';
import { extendMap } from './tools.js';
import { isValidDate } from './tools.js';

/**
 * This handler manages retrieval of location
 * and event histories. It can be accessed via
 * 
 * realm.history.get(...)
 * 
 * @class HistoryHandler
 */
export default class HistoryHandler {
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
    }

    /**
     * Retrieve a list of all location and data updates for a given object
     * that occured in a given period of time.
     * 
     * @param {string} id the id of the object you wish to retrieve the history for
     *  
     * @param {object} options a object with startTime: Date and endTime: date
     * @returns {object} location history
     */
    get(id, options) {
        const msg = createMessage(C.TYPE.HISTORY, C.ACTION.READ, id, this._realm.id);
        const startTimeField = fieldnames.FIELD[[C.FIELD.START_TIME]];
        const endTimeField = fieldnames.FIELD[[C.FIELD.END_TIME]];

        if (!isValidDate(options[startTimeField])) {
            throw new Error(options[startTimeField] + ' is not a valid Date object');
        }
        if (!isValidDate(options[endTimeField])) {
            throw new Error(options[endTimeField] + ' is not a valid Date object');
        }

        msg[C.FIELD.DATA] = {
            [C.FIELD.START_TIME]: options[startTimeField].toISOString(),
            [C.FIELD.END_TIME]: options[endTimeField].toISOString()
        }

        return this._client._sendRequestAndHandleResponse(msg, response => {
            return response[C.FIELD.DATA].map(entry => {
                return this._client._extendFields(entry);
            });
        });
    }
}