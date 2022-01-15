import C from './constants.js'

/**
 * Creates a message object based on provided parameters
 * 
 * @param {string} type one of C.TYPE.*
 * @param {string} action one of C.ACTION.*
 * @param {string} id the id of the entity
 * @param {string} realm the id of realm
 * @param {object} data data object
 * @param {object} location location object
 * 
 * @returns {object} message
 */
export function createMessage(type, action, id, realm, data, location) {
    const message = {
        [C.FIELD.TYPE]: type,
        [C.FIELD.ACTION]: action,
    };

    if (id) message[C.FIELD.ID] = id;
    if (realm) message[C.FIELD.REALM] = realm;
    if (data) message[C.FIELD.DATA] = data;
    if (location) message[C.FIELD.LOCATION] = location;

    return message;
}