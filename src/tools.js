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
 * Creates a copy of an object or array
 * 
 * @param {object} obj
 * 
 * @returns {object}
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}