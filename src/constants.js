export default {
    CONNECTION_STATUS: {
        CONNECTED: 'connected',
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        DISCONNECTING: 'disconnecting',
        AUTHENTICATED: 'authenticated'
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

    UPDATE_TYPE: {
        FULL: 'ful',
        DELTA: 'dta'
    },

    STRING_VALUE: 'val',

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
        LEVEL: 'lvl'
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
        HEARTBEAT: 'hbt'
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
    }
}