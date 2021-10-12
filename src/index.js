import EventEmitter from './event-emitter'
import C from './constants'
import SystemHandler from './system-handler'
import RealmHandler from './realm-handler'
import { WebSocket as NodeWebSocket } from 'ws'
import { getPromise } from './promise'
import { nanoid } from 'nanoid'
import SubscriptionHandler from './subscription-handler'
import fieldnames from './fieldnames'
import { reverseMap } from './tools'

/**
 * HivekitClient is the main class and the only class the user
 * is meant to instantiate directly. It provides access to realms
 * through its `.realm` namespace as well as constants and connection status.
 * 
 * This class also provides connectivity functionality to the other classes
 * in this package.
 * 
 * @class HivekitClient
 * @extends EventEmitter
 */
export default class HivekitClient extends EventEmitter {

    /**
     * Creates, but does not yet connect the client
     * 
     * @constructor
     * @public
     * @param {Object} options 
     */
    constructor(options) {
        super();

        // public properties
        this.constants = C;
        this.connectionStatus = C.CONNECTION_STATUS.DISCONNECTED;

        // default options
        this.options = this._extendOptions(options, {
            outgoingMessageBufferTime: 0,
            logMessages: false,
            logErrors: true,
            adminDashboardBasePath: '/admin/'
        });

        // public handlers
        this.system = new SystemHandler(this);
        this.realm = new RealmHandler(this);

        // internal handlers
        this._subscription = new SubscriptionHandler(this);

        // private properties
        this._wsConnection = null;
        this._onConnectPromise = null;
        this._onAuthenticatePromise = null;
        this._onDisconnectPromise = null;
        this._pendingRequests = {};
        this._pendingMessages = null;
        this._typeHandler = {
            [C.TYPE.SYSTEM]: this.system,
            [C.TYPE.SUBSCRIPTION]: this._subscription
        };
    }

    /**
     * Establishes a WebSocket connection to the Hivekit Server or Platform.
     * 
     * If the user is already authenticated and has an active cookie set, that
     * cookie will be sent to the server as part of the WebSocket establishing request
     * and the connection will be authenticated immediatly.
     * 
     * If no cookie token is present, this method will connect, but the connection
     * will stay in an `'awaiting_authentiation'` connection state until `authenticate()`
     * is called.
     * 
     * @param {String} url 
     * @returns {Promise} <on connect>
     */
    connect(url) {
        this._changeConnectionStatus(C.CONNECTION_STATUS.CONNECTING);
        this._wsConnection = typeof window !== 'undefined' && window.WebSocket ? new window.WebSocket(url) : new NodeWebSocket(url);
        this._wsConnection.onopen = this._onOpen.bind(this);
        this._wsConnection.onclose = this._onClose.bind(this);
        this._wsConnection.onerror = this._onError.bind(this);
        this._wsConnection.onmessage = this._onMessage.bind(this);
        this._onConnectPromise = getPromise();
        return this._onConnectPromise;
    }

    /**
     * Authenticates the connection via a token. This is only necessary
     * if the token is not already provided as a cookie with the initial `connect()`
     * 
     * @param {string} token a JWT or Hivekit admin token
     * @returns {Promise} <on authenticated>
     */
    authenticate(token) {
        this.system._sendAuthMessage(token);
        this._onAuthenticatePromise = getPromise();
        return this._onAuthenticatePromise;
    }

    /**
     * Disconnects an existing Websocket connection.
     * 
     * @returns {Promise} <on disconnect>
     */
    disconnect() {
        this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTING);
        this._wsConnection.close();
        this._onDisconnectPromise = getPromise();
        return this._onDisconnectPromise;
    }

    /**
     * Generates a unique id with a prefix
     * 
     * @param {string} prefix 
     * @returns string unique id with prefix
     */
    getId(prefix) {
        return prefix + '-' + nanoid();
    }

    /**
     * Returns the Websocket URL of the current connection. This might be different
     * from the URL supplied in `.connect()` if the browser e.g. followed redirects.
     * 
     * @returns string URL
     */
    getURL() {
        return this._wsConnection.url;
    }

    /********************************************
     * INTERNAL METHODS
     *******************************************/

    _onOpen() {
        this._changeConnectionStatus(C.CONNECTION_STATUS.CONNECTED);
        this._onConnectPromise.resolve();
    }

    _onClose() {
        this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTED);
        this._onDisconnectPromise.resolve();
    }

    _onError(error) {
        this.emit('error', error);
        if (this.options.logErrors) {
            console.warn(error);
        }

    }

    _onMessage(msg) {
        var messages;

        try {
            messages = JSON.parse(msg.data);
        } catch (e) {
            this._onError('Failed to parse Websocket Message:', e);
        }

        messages.forEach(this._handleIncomingMessage.bind(this));
    }

    _sendMessage(msg) {
        if (this._pendingMessages === null) {
            this._pendingMessages = [msg];
            if (this.connectionStatus === C.CONNECTION_STATUS.AUTHENTICATED) {
                this._sendPendingMessageTimeout = setTimeout(this._sendPendingMessages.bind(this), this.options.outgoingMessageBufferTime);
            } else {
                if (this.options.logErrors) {
                    console.warn('hivekit connection not authenticated. Outgoing messages will be queued until authentication')
                }
            }
        } else {
            this._pendingMessages.push(msg);
        }
    }

    _sendPendingMessages() {
        if (!this._pendingMessages || this._pendingMessages.length === 0) {
            return;
        }
        if (this.options.logMessages) {
            for (var i = 0; i < this._pendingMessages.length; i++) {
                console.log('>', this._pendingMessages[i]);
            }
        }
        this._wsConnection.send(JSON.stringify(this._pendingMessages));
        this._pendingMessages = null;
    }

    _handleIncomingMessage(msg) {
        if (this.options.logMessages) {
            console.log('<', msg);
        }
        if (msg[C.FIELD.CORRELATION_ID]) {
            if (this._pendingRequests[msg[C.FIELD.CORRELATION_ID]]) {
                this._pendingRequests[msg[C.FIELD.CORRELATION_ID]].responseCallbacks.forEach(callback => {
                    callback(msg);
                });
                delete this._pendingRequests[msg[C.FIELD.CORRELATION_ID]];
            } else {
                this._onError('Received response for unknown request', msg);
            }
        }
        // Generic Error without Correlation ID
        else if (msg[C.FIELD.RESULT] === C.RESULT.ERROR) {
            this._onError(msg[C.FIELD.ERROR] || msg[C.FIELD.DATA]);
        }
        else if (!this._typeHandler[msg[C.FIELD.TYPE]]) {
            this._onError('Received message for unknown type ' + this._typeHandler[msg[C.FIELD.TYPE]])
        } else {
            this._typeHandler[msg[C.FIELD.TYPE]]._handleIncomingMessage(msg);
        }
    }

    _changeConnectionStatus(connectionStatus) {
        this.connectionStatus = connectionStatus;
        this.emit('connectionStatusChanged', connectionStatus);
        if (connectionStatus === C.CONNECTION_STATUS.AUTHENTICATED) {
            this._sendPendingMessages();
        }
    }

    _sendRequest(msg, responseCallback) {
        const signature = this._getSignature(msg);
        // We combine identical requests into one
        for (var id in this._pendingRequests) {
            if (this._pendingRequests[id].signature === signature) {
                this._pendingRequests[id].responseCallbacks.push(responseCallback);
                return;
            }
        }
        const requestId = nanoid();
        msg[C.FIELD.CORRELATION_ID] = requestId;
        this._pendingRequests[requestId] = {
            signature: signature,
            responseCallbacks: [responseCallback]
        }
        this._sendMessage(msg);
    }

    _sendRequestAndHandleResponse(msg, successDataTransform) {
        const result = getPromise();

        this._sendRequest(msg, response => {
            if (response[C.FIELD.RESULT] === C.RESULT.ERROR) {
                this._onError(`${response[C.FIELD.ERROR]}`);
                result.reject(`${response[C.FIELD.ERROR]}`);
            } else {
                result.resolve(successDataTransform ? successDataTransform(response) : response);
            }
        });

        return result;
    }

    _getSignature() {
        var val = JSON.stringify(Array.from(arguments)),
            i = 0,
            hash = 0;

        for (i; i < val.length; i++) {
            hash = ((hash << 5) - hash) + val.charCodeAt(i);
            hash = hash & hash;
        }

        return hash
    }

    /**
    * 
    * @private
    * @param {Object} options 
    * @param {Object} defaults
    * @param {Object} fieldNames
    * @returns {Object} extended options
    */
    _extendOptions(options, defaults, fieldNames) {
        if (!options) {
            return defaults;
        }

        if (fieldNames) {
            options = this._compressFields(options, fieldNames);
        }

        const combinedOptions = {};

        for (var key in defaults) {
            if (typeof options[key] !== 'undefined') {
                combinedOptions[key] = options[key];
            } else {
                combinedOptions[key] = defaults[key];
            }
        }
        //TODO - Add check for unknown options
        return combinedOptions;
    }

    _extendFields(data, fields) {
        if (!fields) {
            fields = fieldnames.FIELD;
        }

        const translated = {};
        for (var key in data) {
            if (fields[key]) {
                if (key === C.FIELD.LOCATION) {
                    translated[fields[key]] = this._extendFields(data[key], fieldnames.LOCATION);
                }
                else if (key === C.FIELD.SUB_TYPE && data[C.FIELD.SHAPE]) {
                    translated[fields[C.FIELD.SHAPE]] = fieldnames.SHAPE_TYPE[data[key]];
                }
                else if (key === C.FIELD.SHAPE) {
                    translated[fields[C.FIELD.SHAPE_DATA]] = data[key];
                }
                else if (key === C.FIELD.TYPE) {
                    translated[fields[C.FIELD.TYPE]] = fieldnames.TYPE[data[key]];
                }
                else if (key === C.FIELD.FIELD) {
                    translated[fields[C.FIELD.FIELD]] = fieldnames.FIELD[data[key]];
                }
                else {
                    translated[fields[key]] = data[key]
                }
            } else {
                translated[key] = data[key];
            }
        }
        return translated;
    }

    _extendFieldsMap(entries) {
        const result = {};
        for (var id in entries) {
            result[id] = this._extendFields(entries[id]);
        }
        return result;
    }

    _compressFields(extendedFields, fieldnames, ignoreUnknown) {
        const reversedFieldNames = reverseMap(fieldnames);
        const compressedFields = {};
        for (var key in extendedFields) {
            if (reversedFieldNames[key]) {
                compressedFields[reversedFieldNames[key]] = extendedFields[key]
            } else if (ignoreUnknown) {
                compressedFields[key] = extendedFields[key]
            } else {
                this._onError('Unknown field ' + key);
            }
        }
        return compressedFields;
    }
}