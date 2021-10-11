/**
 * Takes a JavaScript promise object and sticks the resolve
 * and reject methods onto it as properties.
 * 
 * This makes it possible to create and store promises as
 * variables to be resolved by other methods later.
 * 
 * Why promises don't do this natively is a mystery to me.
 * 
 * @returns Promise
 */
export function getPromise() {
    var resolve, reject;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    promise.resolve = resolve;
    promise.reject = reject;

    return promise;
}