export default {
    CONNECTION_STATUS: {
        CONNECTED: 'connected',
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        DISCONNECTING: 'disconnecting',
        AUTHENTICATED: 'authenticated'
    },
    MODE: {
        HTTP: 'http',
        WS: 'ws'
    },
    TYPE: {
        REALM: 'rea',
        OBJECT: 'obj',
        AREA: 'are',
        SUBSCRIPTION: 'sub',
        SYSTEM: 'sys',
        INSTRUCTION: 'ins',
        LOGEVENT: "log"
    },
    ERROR: {
        CONNECTION_ERROR: 'connection_error',
        MAX_RECONNECT_ATTEMPTS_EXCEEDED: 'max_reconnect_attempts_exceeded',
        MESSAGE_PARSE_ERROR: 'message_parse_error',
        UNKNOWN_REQUEST: 'unknown_request',
        UNKNOWN_TYPE: 'unknown_type',
        SERVER_ERROR: 'server_error',
        UNKNOWN_FIELD: 'unknown_field',
        UNKNOWN_ACTION: 'unknown_action',
        UNKNOWN_SUBSCRIPTION: 'unknown_subscription',
        DISCONNECTED_RETRYING: 'disconnected_retrying'
    },
    UPDATE_TYPE: {
        FULL: 'ful',
        DELTA: 'dta'
    },

    STRING_VALUE: 'val',
    INTERNAL_EVENTS: [
        'connectionStatusChanged'
    ],

    FIELD: {
        TYPE: 'typ',
        SCOPE_TYPE: 'sty',
        SUB_TYPE: 'sty',
        SCOPE_ID: 'sid',
        EXECUTE_IMMEDIATELY: 'exe',
        ACTION: 'act',
        RESULT: 'res',
        CORRELATION_ID: 'cid',
        ID: 'id',
        REALM: 'rea',
        DATA: 'dat',
        LOCATION: 'loc',
        ERROR: 'err',
        LABEL: 'lab',
        ATTRIBUTE: 'atr',
        UPDATE_TYPE: 'uty',
        INSTRUCTION_STRING: 'ins',
        PRESENCE_CONNECTION_STATUS: 'cst',
        // Here we cheat a bit to hide an implementation detail. Technically, shape is sent via the SUB_TYPE field.
        // So the incoming message would look like
        // { sty: 'rec' (SUB_TYPE: 'rectangle'), sha: {x1:12, y1:32...}
        // but for the end user we translate it to
        // {shape: 'rectangle', shapeData: {x1:12, y1:32...}}
        SHAPE: 'sha',
        SHAPE_DATA: 'shapeData',
        FIELD: 'fie',
        VALUE: 'val',
        START: 'sta',
        END: 'end',
        LEVEL: 'lvl',
        EVENT_NAME: 'eve',
        ID_PATTERN: 'idp',
        ERROR_CODE: 'erc'
    },

    ACTION: {
        CREATE: 'cre',
        READ: 'rea',
        LIST: 'lis',
        UPDATE: 'upd',
        DELETE: 'del',
        AUTHENTICATE: 'aut',
        SET: 'set',
        SEARCH: 'sea',
        HEARTBEAT: 'hbt',
        SUBSCRIBE: 'sub',
        UNSUBSCRIBE: 'uns',
        PUBLISH: 'pub',
        GET_STATS: 'sta'
    },

    RESULT: {
        SUCCESS: 'suc',
        WARNING: 'war',
        ERROR: 'err'
    },

    SUBSCRIPTION: {
        REALM: 'all-realms'
    },

    LOCATION: {
        GEOGRAPHIC_COORDINATE_SYSTEM: 'gcs',
        LONGITUDE: 'lon',
        LATITUDE: 'lat',
        ACCURACY: 'acc',
        SPEED: 'spe',
        HEADING: 'hea',
        ALTITUDE: 'alt',
        ALTITUDE_ACCURACY: 'alc',
        TIME: 'tim'
    },

    SHAPE_TYPE: {
        RECTANGLE: 'rec',
        CIRCLE: 'cir',
        POLYGON: 'pol'
    },

    PRESENCE_CONNECTION_STATUS: {
        CONNECTED: 'con',
        DISCONNECTED: 'dis'
    }
}