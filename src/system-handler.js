import C from './constants'

export default class SystemHandler {
    constructor(client) {
        this._client = client;
        this._systemUpdateSubscription = null;
    }

    getHttpUrl() {
        return document.location.protocol + '//' + new URL(this._client._wsConnection.url).host;
    }

    authenticateAdmin(password) {
        return new Promise(async (resolve, reject) => {
            const url = this.getHttpUrl() +
                this._client.options.adminDashboardBasePath + 'api/authenticate-admin';
            var rawResponse;

            try {
                rawResponse = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username: 'admin', password: password })
                })
            } catch (e) {
                reject(e.message);
                return;
            }

            if (rawResponse.status === 200) {
                resolve();
            } else {
                const result = await rawResponse.json();
                reject(result[0][C.FIELD.ERROR]);
            }
        });
    }

    _sendAuthMessage(token) {
        if (this._client._wsConnection.readyState === this._client._wsConnection.constructor.OPEN) {
            this._client._wsConnection.send('Bearer ' + token);
        } else {
            this._client._wsConnection.addEventListener('open', () => {
                this._client._wsConnection.send('Bearer ' + token);
            });
        }
    }

    _handleIncomingMessage(message) {
        switch (message[C.FIELD.ACTION]) {
            case C.ACTION.AUTHENTICATE:
                if (message[C.FIELD.RESULT] === C.RESULT.SUCCESS) {
                    this._client._changeConnectionStatus(C.CONNECTION_STATUS.AUTHENTICATED);
                    this._client._onAuthenticatePromise && this._client._onAuthenticatePromise.resolve();
                }
                if (message[C.FIELD.RESULT] === C.RESULT.ERROR) {
                    this._client._onAuthenticatePromise && this._client._onAuthenticatePromise.reject(message[C.FIELD.DATA]);
                }
                break;
            default:
                this._client._onError(`Unknown action for type ${C.TYPE.SYSTEM}: ${message[C.FIELD.ACTION]}`);
        }
    }
}