export function reverseMap( input ) {
    const reversed = {};
    for( var key in input ) {
        reversed[input[key]] = key;
    }
    return reversed;
}

export function extendMap( mapA, mapB ) {
    for( var key in mapB ) {
        mapA[key] = mapB[key];
    }
    return mapA;
}