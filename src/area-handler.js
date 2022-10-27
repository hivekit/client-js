import C from './constants.js'
import { createMessage } from './message.js'
import fieldnames from './fieldnames.js';
import { extendMap } from './tools.js';

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

    create(id, options) {
        return this._setAreaState(id, options.label, options.shape, options.data, C.ACTION.CREATE);
    }

    update(id, options) {
        return this._setAreaState(id, options.label, options.shape, options.data, C.ACTION.UPDATE);
    }

    list() {
        const msg = createMessage(C.TYPE.AREA, C.ACTION.LIST, null, this._realm.id);

        return this._client._sendRequestAndHandleResponse(msg, result => {
            const areas = this._client._extendFieldsMap(result[C.FIELD.DATA]);

            // the field SCOPE_TYPE and SUB_TYPE have the same field name and are
            // thus ambigious. Likewise, the meaning of their value depends on the
            // type of the entity they relate to. For new, we'll just translate it here,
            // but in the long run we should do something about it.
            for (var id in areas) {
                areas[id].shape = fieldnames.SHAPE_TYPE[areas[id].scopeType]
                delete areas[id].scopeType;
            }
            return areas;
        });
    }

    delete(id) {
        const msg = createMessage(C.TYPE.AREA, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    /********************************************
     * INTERNAL METHODS
     *******************************************/

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
            default:
                return new Promise((_, reject) => {
                    reject('unknown shape data');
                })
        }

        msg[C.FIELD.SHAPE] = shapeData;
        return this._client._sendRequestAndHandleResponse(msg);
    }
}