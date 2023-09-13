export async function sleep(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    })
}

export async function nextSubscriptionUpdate(subscription) {
    return new Promise(resolve => {
        const callback = (data, changes) => {
            resolve({ data, changes });
            subscription.off('update', callback);
        }

        subscription.on('update', callback);
    });

}