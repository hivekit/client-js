import { C, fieldnames } from './fields.js';
import { createMessage } from './message.js';
import { extendMap } from './tools.js';

/**
 * This handler manages CRUD for instructions (executable
 * codeblocks in hivescript)
 * 
 * @class InstructionHandler
 */
export default class InstructionHandler {

    /**
     * The instruction handler is instantiated whenever a new
     * realm is created and exposed as `realm.instruction`
     * 
     * @constructor
     * @param {HivekitClient} client 
     * @param {Realm} realm 
     */
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
    }

    /**
     * Subscribes to creation, updates and deletes for 
     * instructions
     * 
     * @todo Are there actually viable subscription options for instructions?
     * If so - document them.
     * 
     * @param {object} options 
     * @returns {Promise<Subscription>}
     */
    subscribe(options) {
        return this._client._subscription._getSubscription(
            this._client.getId('instruction-subscription'),
            this._realm.id,
            extendMap({
                [C.FIELD.TYPE]: C.TYPE.INSTRUCTION,
                [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
            }, this._client._compressFields(options, fieldnames.FIELD))
        );
    }

    /**
     * Subscribes to log events.
     *
     * @todo Are there actually viable subscription options for log events?
     * If so - document them.
     *
     * @returns {Promise<Subscription>}
     */
    subscribeToLogs(options) {
        return this._client._subscription._getSubscription(
            this._client.getId('instruction-log-subscription'),
            this._realm.id,
            extendMap({
                [C.FIELD.TYPE]: C.TYPE.LOGEVENT,
                [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM,
            }, this._client._compressFields(options, fieldnames.FIELD))
        );
    }

    /**
     * Retrieves the data associated with an instruction from the server
     * 
     * @param {string} id 
     * @returns {Promise<object>} instruction
     */
    get(id) {
        const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            return this._client._extendFields(response[C.FIELD.DATA]);
        });
    }

    /**
     * Registers a new instruction to be executed by the server. Will return
     * an error if an instruction with the given ID already exists.
     * 
     * @param {string} id 
     * @param {object} options 
     * @param {string} options.label 
     * @param {string} options.instructionString 
     * @param {object} options.data 
     * 
     * @returns {Promise<success>}
     */
    create(id, options) {
        return this._setInstructionState(id, options.label, options.instructionString, options.data, C.ACTION.CREATE);
    }

    /**
     * Updates an existing instruction. Will return an error if no instruction with
     * the given ID exists.
     * 
     * @param {string} id 
     * @param {object} options 
     * @param {string} options.label 
     * @param {string} options.instructionString 
     * @param {object} options.data 
     * 
     * @returns {Promise<success>}
     */
    update(id, options) {
        return this._setInstructionState(id, options.label, options.instructionString, options.data, C.ACTION.UPDATE);
    }

    /**
     * Returns a list of all currently active instructions for this realm.
     * 
     * @returns {Promise<object>}
     */
    list() {
        const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.LIST, null, this._realm.id);

        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    /**
     * Deletes a previously registered instruction. Will return an error if no instruction
     * with the given ID could be found.
     * 
     * @param {string} id 
     * @returns {Promise<success>}
     */
    delete(id) {
        const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /********************************************
     * INTERNAL METHODS
     *******************************************/

    /**
     * Constructs a message and forwards it to the client.
     * 
     * @param {string} id 
     * @param {string} label 
     * @param {string} instructionString 
     * @param {object} data 
     * @param {string} action 
     * @returns 
     */
    _setInstructionState(id, label, instructionString, data, action) {
        const msg = createMessage(C.TYPE.INSTRUCTION, action, id, this._realm.id);
        msg[C.FIELD.INSTRUCTION_STRING] = instructionString;

        if (label) msg[C.FIELD.LABEL] = label;
        if (data) msg[C.FIELD.DATA] = data;

        return this._client._sendRequestAndHandleResponse(msg);
    }
}