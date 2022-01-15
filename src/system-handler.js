import C from './constants.js'

/**
 * The system handler is responsible for all aspects that are not
 * directly related to an entity such as a real, object, area, instruction or
 * subscription.
 * 
 * @class SystemHandler
 */
export default class SystemHandler {

    /**
     * The SystemHandler is instantiated by the HivekitClient and
     * exposed as `client.system`
     * 
     * @constructor
     * @param {HivekitClient} client 
     */
    constructor(client) {
        this._client = client;
        this._systemUpdateSubscription = null;
    }

    /**
     * @todo
     * 
     * This method tries to defer the URL for the HTTP endpoint from the websocket URL, assuming
     * that it follows the convention of:
     * 
     * ws(s)://someurl.com/path/to/ws -> http(s)://someurl.com/path/to/
     * 
     * This made sense when paths were hardcoded, but not since they are freely configurable it'd
     * be good to configure them in the app config and use different configurations for different
     * environments
     * 
     * @returns {string} httpUrl
     */
    getHttpUrl() {
        return document.location.protocol + '//' + new URL(this._client._wsConnection.url).host;
    }

    /**
     * Authenticates with an admin password via HTTP. This is meant to happen before
     * calling `client.connect()` so that the cookie returned by the HTTP request can
     * be used to authenticate the WebSocket connection.
     * 
     * @param {string} password 
     * @returns {Promise<authentication result>}
     */
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

    /********************************************
     * INTERNAL METHODS
     *******************************************/

    /**
     * Sends an authentication message via the Websocket connection - either straight away
     * if the connection is already established or once it is opened.
     * 
     * @param {string} token JWT token string
     */
    _sendAuthMessage(token) {
        if (this._client._wsConnection.readyState === this._client._wsConnection.constructor.OPEN) {
            this._client._wsConnection.send('Bearer ' + token);
        } else {
            this._client._wsConnection.addEventListener('open', () => {
                this._client._wsConnection.send('Bearer ' + token);
            });
        }
    }

    /**
     * Processes incoming messages for the SYSTEM type
     * 
     * @param {object} message incoming message
     */
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