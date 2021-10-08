/**
 * Why promises don't do this natively is a mystery to me.
 * 
 * @returns Promise
 */
export function getPromise() {
    var resolve, reject;
    const promise = new Promise(( _resolve, _reject ) => {
        resolve = _resolve;
        reject = _reject;
    });

    promise.resolve = resolve;
    promise.reject = reject;

    return promise;
}