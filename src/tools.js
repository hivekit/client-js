import C from './constants.js'

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

export function getShapeTypeFromSignature(shapeData) {
    return SHAPE_SIGNATURES[Object.keys(shapeData).sort().join('')] || null;
}