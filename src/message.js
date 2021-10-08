import C from './constants'

export function createMessage( type, action, id, realm, data, location ) {
    const message = {
        [C.FIELD.TYPE]: type,
        [C.FIELD.ACTION]: action,
    };

    if(id) message[C.FIELD.ID ] = id;
    if(realm) message[C.FIELD.REALM] = realm;
    if(data) message[C.FIELD.DATA] = data;
    if(location) message[C.FIELD.LOCATION] = location;

    return message;
}