import C from './constants'
import { createMessage } from './message'
import fieldnames from './fieldnames';
import { extendMap } from './tools';

export default class ObjectHandler {
    constructor(client, realm) {
        this._client = client;
        this._realm = realm;
        this._locationFields = this._getLocationFields();
    }

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

    get(id) {
        if (!id) {
            throw new Error('no id provided for object.get');
        }
        const msg = createMessage(C.TYPE.OBJECT, C.ACTION.READ, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg, response => {
            return this._client._extendFields(response[C.FIELD.DATA]);
        });
    }

    create(id, label, location, data) {
        return this._setObjectState(id, label, location, data, C.ACTION.CREATE);
    }

    update(id, label, location, data) {
        return this._setObjectState(id, label, location, data, C.ACTION.UPDATE);
    }

    list(options) {
        const msg = createMessage(C.TYPE.OBJECT, C.ACTION.LIST, null, this._realm.id);
        if (options && Object.keys(options).length > 0) {
            msg[C.FIELD.DATA] = this._client._compressFields(options, fieldnames.FIELD);
        }
        return this._client._sendRequestAndHandleResponse(msg, result => {
            return this._client._extendFieldsMap(result[C.FIELD.DATA]);
        });
    }

    delete(id) {
        const msg = createMessage(C.TYPE.OBJECT, C.ACTION.DELETE, id, this._realm.id);
        return this._client._sendRequestAndHandleResponse(msg);
    }

    _getLocationFields() {
        const locationFields = {};
        for (var fieldname in fieldnames.LOCATION) {
            locationFields[fieldnames.LOCATION[fieldname]] = fieldname;
        }
        return locationFields
    }

    _setObjectState(id, label, location, data, action) {
        const msg = createMessage(C.TYPE.OBJECT, action, id, this._realm.id);
        if (label) msg[C.FIELD.LABEL] = label;
        if (data && Object.keys(location).length > 0) {
            msg[C.FIELD.LOCATION] = this._parseLocation(location);
        }
        if (data && Object.keys(data).length > 0) msg[C.FIELD.DATA] = data;
        return this._client._sendRequestAndHandleResponse(msg);
    }

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