import { C, fieldnames } from './fields.js';

/**
 * switches the keys and values in a map.
 * 
 * If the value is an array, the revered map will contain
 * an entry for every value in the array.
 * 
 * @param {object} input map 
 * @returns {object} reversed map
 */
export function reverseMap(input) {
    const reversed = {};
    for (var key in input) {
        if (input[key] instanceof Array) {
            // support multiple entries
            input[key].forEach(keyName => {
                reversed[keyName] = key;
            })
        } else {
            reversed[input[key]] = key;
        }

    }
    return reversed;
}

/**
 * Merges the properties from mapB into mapA
 * 
 * @param {object} mapA 
 * @param {object} mapB
 * 
 * @returns {object} extended map
 */
export function extendMap(mapA, mapB) {
    for (var key in mapB) {
        mapA[key] = mapB[key];
    }
    return mapA;
}

/**
 * Creates a deep copy of an object or array
 * 
 * @param {object} obj
 * 
 * @returns {object}
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Creates a shallow copy of an object
 * 
 * @param {object} obj 
 * @returns {object}
 */
export function shallowClone(obj) {
    const clonedObj = {};

    for (let key in obj) {
        clonedObj[key] = obj[key];
    }

    return clonedObj;
}

const SHAPE_SIGNATURES = {
    'x1x2y1y2': C.SHAPE_TYPE.RECTANGLE,
    'cxcyr': C.SHAPE_TYPE.CIRCLE,
    'points': C.SHAPE_TYPE.POLYGON
};

export function toShape(shapeData) {
    var shapeSignature = Object.keys(shapeData).sort().join('');

    if (shapeSignature === 'eastnorthsouthwest') {
        shapeData = {
            x1: shapeData.west,
            y1: shapeData.south,
            x2: shapeData.east,
            y2: shapeData.north
        }

        shapeSignature = 'x1x2y1y2';
    }

    if (!SHAPE_SIGNATURES[shapeSignature]) {
        return {
            err: 'unknown shape data'
        }
    }

    // @todo shape type specific validation
    return {
        type: SHAPE_SIGNATURES[shapeSignature],
        data: shapeData,
        err: null
    }
}

/**
 * Checks if a given value is a valid JavaScript Date object
 * 
 * @param {Mixed} value 
 * @returns Boolean
 */
export function isValidDate(value) {
    return value instanceof Date && value.toString() != 'Invalid Date';
}

// remap location fields
const locationFields = {};
for (var fieldname in fieldnames.LOCATION) {
    locationFields[fieldnames.LOCATION[fieldname]] = fieldname;
}

/**
 * Converts a user defined location object into something
 * compatible with the servers idea of what a location
 * should look like.
 * 
 * @param {object} location 
 * @returns {object} parsed location
 */
export function parseLocation(location) {
    const parsedLocation = {};
    for (var key in location) {
        if (key.length === 0) {
            continue;
        }
        if (typeof location[key] !== 'string') {
            parsedLocation[locationFields[key]] = location[key];
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
                parsedLocation[locationFields[key]] = parseFloat(location[key]);
            }
        }
    }

    return parsedLocation;
}