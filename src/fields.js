/**
 * Fieldnames are used to map messages coming from and going 
 * to the server to constants and string values
 */
export const FIELDS = {
    CONNECTION_STATUS: {
        CONNECTED: { VAL: 'connected' },
        DISCONNECTED: { VAL: 'disconnected' },
        CONNECTING: { VAL: 'connecting' },
        DISCONNECTING: { VAL: 'disconnecting' },
        AUTHENTICATED: { VAL: 'authenticated' },
    },
    MODE: {
        HTTP: { VAL: 'http' },
        WS: { VAL: 'ws' },
    },
    TYPE: {
        REALM: { VAL: 'rea', FULL: 'realm' },
        OBJECT: { VAL: 'obj', FULL: 'object' },
        AREA: { VAL: 'are', FULL: 'area' },
        SUBSCRIPTION: { VAL: 'sub', FULL: 'subscription' },
        SYSTEM: { VAL: 'sys', FULL: 'system' },
        INSTRUCTION: { VAL: 'ins', FULL: 'instruction' },
        LOGEVENT: { VAL: 'log', FULL: 'logEvent' },
        HISTORY: { VAL: 'his', FULL: 'history' },
        TASK: { VAL: 'tsk', FULL: 'task' },
    },
    TASK_STATUS: {
        NOT_STARTED: { VAL: '$hkt_not_started' },
        IN_PROGRESS: { VAL: '$hkt_in_progress' },
        COMPLETED: { VAL: '$hkt_completed' },
        FAILED: { VAL: '$hkt_failed' },
        CANCELED: { VAL: '$hkt_canceled' },
        PAUSED: { VAL: '$hkt_paused' },
        BLOCKED: { VAL: '$hkt_blocked' },
    },
    ERROR: {
        CONNECTION_ERROR: { VAL: 'connection_error' },
        MAX_RECONNECT_ATTEMPTS_EXCEEDED: { VAL: 'max_reconnect_attempts_exceeded' },
        MESSAGE_PARSE_ERROR: { VAL: 'message_parse_error' },
        UNKNOWN_REQUEST: { VAL: 'unknown_request' },
        UNKNOWN_TYPE: { VAL: 'unknown_type' },
        SERVER_ERROR: { VAL: 'server_error' },
        UNKNOWN_FIELD: { VAL: 'unknown_field' },
        UNKNOWN_ACTION: { VAL: 'unknown_action' },
        UNKNOWN_SUBSCRIPTION: { VAL: 'unknown_subscription' },
        DISCONNECTED_RETRYING: { VAL: 'disconnected_retrying' },
    },
    UPDATE_TYPE: {
        FULL: { VAL: 'ful' },
        DELTA: { VAL: 'dta' },
    },
    FIELD: {
        TYPE: { VAL: 'typ', FULL: 'type' },
        SCOPE_TYPE: { VAL: 'sty', FULL: 'scopeType' },
        SUB_TYPE: { VAL: 'sty', FULL: 'scopeType' },
        SCOPE_ID: { VAL: 'sid', FULL: 'scopeId' },
        EXECUTE_IMMEDIATELY: { VAL: 'exe', FULL: 'executeImmediately' },
        ACTION: { VAL: 'act', FULL: 'action' },
        RESULT: { VAL: 'res', FULL: 'result' },
        CORRELATION_ID: { VAL: 'cid', FULL: 'correlationId' },
        ID: { VAL: 'id', FULL: 'id' },
        REALM: { VAL: 'rea', FULL: 'realm' },
        DATA: { VAL: 'dat', FULL: 'data' },
        LOCATION: { VAL: 'loc', FULL: 'location' },
        ERROR: { VAL: 'err', FULL: 'error' },
        LABEL: { VAL: 'lab', FULL: 'label' },
        ATTRIBUTE: { VAL: 'atr', FULL: ['attribute', 'where'] },
        UPDATE_TYPE: { VAL: 'uty' },
        INSTRUCTION_STRING: { VAL: 'ins', FULL: 'instructionString' },
        PRESENCE_CONNECTION_STATUS: { VAL: 'cst', FULL: 'connectionStatus' },
        SHAPE: { VAL: 'sha', FULL: 'shape' },
        SHAPE_DATA: { VAL: 'shapeData', FULL: 'shapeData' },
        FIELD: { VAL: 'fie', FULL: 'field' },
        VALUE: { VAL: 'val', FULL: 'value' },
        SUBSCRIPTION_TARGET: { VAL: 'sta', FULL: 'start' },
        START: { VAL: 'sta', FULL: 'start' },
        END: { VAL: 'end', FULL: 'end' },
        LEVEL: { VAL: 'lvl', FULL: 'level' },
        EVENT_NAME: { VAL: 'eve' },
        ID_PATTERN: { VAL: 'idp' },
        ERROR_CODE: { VAL: 'erc' },
        INTERVAL: { VAL: 'int', FULL: 'interval' },
        TIME: { VAL: 'tim', FULL: 'time' },
        SCOPE_TYPE_TARGET: { VAL: 'tar' },
        RADIUS: { VAL: 'r' },
        STATUS: { VAL: 'sts', FULL: 'status' },
        STEPS: { VAL: 'stp', FULL: 'steps' },
        DESCRIPTION: { VAL: 'dsc', FULL: 'description' },
        TARGET_ID: { VAL: 'tid', FULL: 'targetId' },
    },
    ACTION: {
        CREATE: { VAL: 'cre', FULL: 'create' },
        READ: { VAL: 'rea', FULL: 'read' },
        LIST: { VAL: 'lis', FULL: 'list' },
        UPDATE: { VAL: 'upd', FULL: 'update' },
        DELETE: { VAL: 'del', FULL: 'delete' },
        AUTHENTICATE: { VAL: 'aut', FULL: 'authenticate' },
        SET: { VAL: 'set', FULL: 'set' },
        SEARCH: { VAL: 'sea' },
        HEARTBEAT: { VAL: 'hbt' },
        SUBSCRIBE: { VAL: 'sub' },
        UNSUBSCRIBE: { VAL: 'uns' },
        PUBLISH: { VAL: 'pub' },
        GET_STATS: { VAL: 'sta' },
    },
    RESULT: {
        SUCCESS: { VAL: 'suc', FULL: 'success' },
        WARNING: { VAL: 'war', FULL: 'warning' },
        ERROR: { VAL: 'err', FULL: 'error' },
    },
    SUBSCRIPTION: {
        REALM: { VAL: 'all-realms' },
    },
    LOCATION: {
        GEOGRAPHIC_COORDINATE_SYSTEM: { VAL: 'gcs', FULL: 'coordinateSystem' },
        LONGITUDE: { VAL: 'lon', FULL: 'longitude' },
        LATITUDE: { VAL: 'lat', FULL: 'latitude' },
        ACCURACY: { VAL: 'acc', FULL: 'accuracy' },
        SPEED: { VAL: 'spe', FULL: 'speed' },
        HEADING: { VAL: 'hea', FULL: 'heading' },
        ALTITUDE: { VAL: 'alt', FULL: 'altitude' },
        ALTITUDE_ACCURACY: { VAL: 'alc', FULL: 'altitudeAccuracy' },
        TIME: { VAL: 'tim', FULL: 'time' },
    },
    SHAPE_TYPE: {
        RECTANGLE: { VAL: 'rec', FULL: 'rectangle' },
        CIRCLE: { VAL: 'cir', FULL: 'circle' },
        POLYGON: { VAL: 'pol', FULL: 'polygon' },
    },
    PRESENCE_CONNECTION_STATUS: {
        CONNECTED: { VAL: 'con', FULL: 'connected' },
        DISCONNECTED: { VAL: 'dis', FULL: 'disconnected' },
    },
}

export const C = (function () {
    const C = {};
    for (let category in FIELDS) {
        C[category] = {}
        for (let field in FIELDS[category]) {
            C[category][field] = FIELDS[category][field].VAL;
        }
    }

    return C;
})()

export const fieldnames = (function getFullNames() {
    const F = {};
    for (let category in FIELDS) {
        let entries = {};
        for (let field in FIELDS[category]) {
            if (FIELDS[category][field].FULL) {
                entries[FIELDS[category][field].VAL] = FIELDS[category][field].FULL;
            }
        }
        if (Object.keys(entries).length > 0) {
            F[category] = entries;
        }
    }
    return F;
})()