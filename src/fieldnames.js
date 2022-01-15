import C from './constants.js'

/**
 * Fieldnames is the inverse to constants. It lists human
 * readable names that will be passed from the client to the user and
 * back. These values are translated back to the abbreviated constants
 * before sending them to the server.
 */
export default {
    TYPE: {
        [C.TYPE.REALM]: 'realm',
        [C.TYPE.OBJECT]: 'object',
        [C.TYPE.AREA]: 'area',
        [C.TYPE.SUBSCRIPTION]: 'subscription',
        [C.TYPE.SYSTEM]: 'system',
        [C.TYPE.INSTRUCTION]: 'instruction',
        [C.TYPE.LOGEVENT]: 'logEvent'
    },
    FIELD: {
        [C.FIELD.TYPE]: 'type',
        [C.FIELD.SCOPE_TYPE]: 'scopeType',
        [C.FIELD.ACTION]: 'action',
        [C.FIELD.RESULT]: 'result',
        [C.FIELD.CORRELATION_ID]: 'correlationId',
        [C.FIELD.ID]: 'id',
        [C.FIELD.REALM]: 'realm',
        [C.FIELD.DATA]: 'data',
        [C.FIELD.LOCATION]: 'location',
        [C.FIELD.ERROR]: 'error',
        [C.FIELD.LABEL]: 'label',
        [C.FIELD.ATTRIBUTE]: ['attribute', 'where'],
        [C.FIELD.EXECUTE_IMMEDIATELY]: 'executeImmediately',
        [C.FIELD.SHAPE]: 'shape',
        [C.FIELD.SHAPE_DATA]: 'shapeData',
        [C.FIELD.INSTRUCTION_STRING]: 'instructionString',
        [C.FIELD.FIELD]: 'field',
        [C.FIELD.VALUE]: 'value',
        [C.FIELD.START]: 'start',
        [C.FIELD.END]: 'end'
    },
    ACTION: {
        [C.ACTION.CREATE]: 'create',
        [C.ACTION.READ]: 'read',
        [C.ACTION.LIST]: 'list',
        [C.ACTION.UPDATE]: 'update',
        [C.ACTION.DELETE]: 'delete',
        [C.ACTION.AUTHENTICATE]: 'authenticate',
        [C.ACTION.SET]: 'set'
    },
    RESULT: {
        [C.RESULT.SUCCESS]: 'success',
        [C.RESULT.WARNING]: 'warning',
        [C.RESULT.ERROR]: 'error'
    },
    LOCATION: {
        [C.LOCATION.GEOGRAPHIC_COORDINATE_SYSTEM]: 'coordinateSystem',
        [C.LOCATION.LONGITUDE]: 'longitude',
        [C.LOCATION.LATITUDE]: 'latitude',
        [C.LOCATION.ACCURACY]: 'accuracy',
        [C.LOCATION.SPEED]: 'speed',
        [C.LOCATION.HEADING]: 'heading',
        [C.LOCATION.ALTITUDE]: 'altitude',
        [C.LOCATION.ALTITUDE_ACCURACY]: 'altitudeAccuracy',
        [C.LOCATION.TIME]: 'time'
    },
    SHAPE_TYPE: {
        [C.SHAPE_TYPE.RECTANGLE]: 'rectangle',
        [C.SHAPE_TYPE.CIRCLE]: 'circle',
        [C.SHAPE_TYPE.POLYGON]: 'polygon'
    }
}