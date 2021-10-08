import C from './constants'
import { getPromise } from './promise'
import { createMessage } from './message'
import Realm from './realm'

export default class RealmHandler {
    constructor(client) {
        this._client = client;
        this._realms = {};
    }

    subscribe() {
        // TODO swap ID for C.SUBSCRIPTION.REALM once subscription multiplexing is implemented
        return this._client.subscription._getSubscription(this._client.getId('realm-subscription-'), C.TYPE.SYSTEM, {
            [C.FIELD.TYPE]: C.TYPE.SYSTEM,
            [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
        });
    }

    get(id) {
        if (this._realms[id]) {
            const result = getPromise();
            result.resolve(this._realms[id]);
            return result;
        }

        const msg = createMessage(C.TYPE.REALM, C.ACTION.READ, id);

        return this._client._sendRequestAndHandleResponse(msg, response => {
            this._realms[id] = new Realm(id,
                response[C.FIELD.DATA][C.FIELD.LABEL],
                response[C.FIELD.DATA][C.FIELD.DATA],
                this._client
            );
            return this._realms[id];
        });
    }

    create(id, label, data) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.CREATE, id);
        if (label) msg[C.FIELD.LABEL] = label;
        if (data && Object.keys(data).length > 0) msg[C.FIELD.DATA] = data;
        return this._client._sendRequestAndHandleResponse(msg);
    }

    list() {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.LIST);
        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result.dat);
        });
    }

    delete(id) {
        const msg = createMessage(C.TYPE.REALM, C.ACTION.DELETE, id);
        return this._client._sendRequestAndHandleResponse(msg);
    }
}