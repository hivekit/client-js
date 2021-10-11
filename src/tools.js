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

export function extendMap(mapA, mapB) {
    for (var key in mapB) {
        mapA[key] = mapB[key];
    }
    return mapA;
}