import C from './constants'
import { createMessage } from './message'
import fieldnames from './fieldnames';
import { extendMap } from './tools';

export default class AreaHandler {
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
    }

    subscribe(options) {
        return this._client._subscription._getSubscription(
            this._client.getId('area-subscription'),
            this._realm.id,
            extendMap({
                [C.FIELD.TYPE]: C.TYPE.AREA,
                [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
            }, this._client._compressFields(options, fieldnames.FIELD))
        );
    }

    get(id) {
        const msg = createMessage(C.TYPE.AREA, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            return this._client._extendFields(response[C.FIELD.DATA]);
        });
    }

    create(id, label, shapeData, data) {
        return this._setAreaState(id, label, shapeData, data, C.ACTION.CREATE);
    }

    update(id, label, shapeData, data) {
        return this._setAreaState(id, label, shapeData, data, C.ACTION.UPDATE);
    }

    list() {
        const msg = createMessage(C.TYPE.AREA, C.ACTION.LIST, null, this._realm.id);

        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    delete(id) {
        const msg = createMessage(C.TYPE.AREA, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    _setAreaState(id, label, shapeData, data, action) {
        const msg = createMessage(C.TYPE.AREA, action, id, this._realm.id);
        if (label) msg[C.FIELD.LABEL] = label;
        if (data) msg[C.FIELD.DATA] = data;

        // we infer the shapeType from the shapeData provided. Is that a good idea?
        const shapeDataSignature = Object.keys(shapeData).sort().join('');

        switch (shapeDataSignature) {
            case 'x1x2y1y2':
                msg[C.FIELD.SUB_TYPE] = C.SHAPE_TYPE.RECTANGLE;
                break;
            case 'cxcyr':
                msg[C.FIELD.SUB_TYPE] = C.SHAPE_TYPE.CIRCLE;
                break;
            case 'points':
                msg[C.FIELD.SUB_TYPE] = C.SHAPE_TYPE.POLYGON;
                break
        }

        msg[C.FIELD.SHAPE] = shapeData;
        return this._client._sendRequestAndHandleResponse(msg);
    }
}