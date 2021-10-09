import C from './constants'
import { createMessage } from './message'
import fieldnames from './fieldnames';
import { extendMap } from './tools';

export default class InstructionHandler {
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
    }

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

    get(id) {
        const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            return this._client._extendFields(response[C.FIELD.DATA]);
        });
    }

    create(id, label, instructionString, data) {
        return this._setInstructionState(id, label, instructionString, data, C.ACTION.CREATE);
    }

    update(id, label, instructionString, data) {
        return this._setInstructionState(id, label, instructionString, data, C.ACTION.UPDATE);
    }

    list() {
        const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.LIST, null, this._realm.id);

        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    delete(id) {
        const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    _setInstructionState(id, label, instructionString, data, action) {
        const msg = createMessage(C.TYPE.INSTRUCTION, action, id, this._realm.id);
        msg[C.FIELD.INSTRUCTION_STRING] = instructionString;

        if (label) msg[C.FIELD.LABEL] = label;
        if (data) msg[C.FIELD.DATA] = data;

        return this._client._sendRequestAndHandleResponse(msg);
    }
}