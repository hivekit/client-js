import EventEmitter from './event-emitter.js'
import { C, fieldnames } from './fields.js';
import SystemHandler from './system-handler.js'
import RealmHandler from './realm-handler.js'
import { getPromise } from './promise.js'
import { nanoid } from 'nanoid'
import SubscriptionHandler from './subscription-handler.js'
import { reverseMap } from './tools.js'
import HTTPConnection from './http-connection.js'

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
        this.ping = null;
        this.version = '1.11.1'; // will be replaced by the build script
        this.serverVersion = null; // will be replaced by data in auth message
        this.serverBuildDate = null; // will be replaced by data in auth message
        this.mode = null; // either HTTP or WS
        this.token = null; // the JWT token used for authentication

        // default options
        this.options = this._extendOptions(options, {
            outgoingMessageBufferTime: 0,
            logMessages: false,
            logErrors: true,
            adminDashboardBasePath: '/admin/',
            heartbeatInterval: 60000,
            reconnectInterval: 1000,
            maxReconnectAttempts: Infinity,
            httpRoot: null
        });

        // public handlers
        this.system = new SystemHandler(this);
        this.realm = new RealmHandler(this);

        // internal handlers
        this._subscription = new SubscriptionHandler(this);

        // private properties
        this._url = null;
        this._connection = null;
        this._reconnectTimeout = null;
        this._reconnectAttempts = 0;
        this._onConnectPromise = null;
        this._onAuthenticatePromise = null;
        this._onDisconnectPromise = null;
        this._pendingRequests = {};
        this._pendingMessages = null;
        this._pendingHeartbeats = {};
        this._repeatOnReconnectMessages = {};
        this._typeHandler = {
            [C.TYPE.SYSTEM]: this.system,
            [C.TYPE.SUBSCRIPTION]: this._subscription,
            [C.TYPE.REALM]: this.realm
        };
    }

    useHTTP(url) {
        if (this.mode == C.MODE.WS) {
            throw new Error('Can\'t use HTTP. This client is already connected via Websocket.');
        }
        clearInterval(this._heartbeatInterval);
        this.mode = C.MODE.HTTP;
        this._url = url;
        this._connection = new HTTPConnection(url, this._onMessage.bind(this));
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
        if (this.mode === C.MODE.HTTP) {
            throw new Error('Can\'t connect via Websocket. This client is already using HTTP');
        }
        if (this.mode === C.MODE.WS && this._connection.readyState === this.WsConstructor.OPEN) {
            throw new Error('This client is already connected');
        }
        this.mode = C.MODE.WS;
        this._url = url;
        this._changeConnectionStatus(C.CONNECTION_STATUS.CONNECTING);
        this._connection = new this.WsConstructor(url);
        this._connection.onopen = this._onOpen.bind(this);
        this._connection.onclose = this._onClose.bind(this);
        this._connection.onerror = err => {
            this._onError(err.message, C.ERROR.CONNECTION_ERROR);
        }
        this._connection.onmessage = this._onMessage.bind(this);
        if (!this._onConnectPromise) {
            this._onConnectPromise = getPromise();
        }
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
        if (!this._connection) {
            return Promise.reject('can\'t authenticate: client not connected. Did you call .connect() before calling .authenticate()?')
        }
        if (this.mode === C.MODE.HTTP) {
            this._connection.token = token;
            this.connectionStatus = C.CONNECTION_STATUS.AUTHENTICATED;
            return Promise.resolve();
        }
        this.token = token;
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
        if (!this._connection) {
            return Promise.reject('client not connected');
        }
        this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTING);
        this._connection.close();
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
        return this._connection.url;
    }

    /********************************************
     * INTERNAL METHODS
     *******************************************/
    _onOpen() {
        this._changeConnectionStatus(C.CONNECTION_STATUS.CONNECTED);
        clearInterval(this._heartbeatInterval);
        this._heartbeatInterval = setInterval(this._sendHeartbeatMessage.bind(this), this.options.heartbeatInterval);
        clearTimeout(this._reconnectTimeout);
        this._reconnectTimeout = null;
        this._reconnectAttempts = 0;
        this._onConnectPromise.resolve();
    }

    _onDisconnect() {
        clearInterval(this._heartbeatInterval)
        this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTED);
        this._onDisconnectPromise && this._onDisconnectPromise.resolve();
    }

    _onClose() {
        // Intended Close
        if (this.connectionStatus === C.CONNECTION_STATUS.DISCONNECTING) {
            this._onDisconnect();
        }

        // Unintended Close - reconnect
        else {
            this._reconnectAttempts++;

            if (this._reconnectAttempts > this.options.maxReconnectAttempts) {
                const errorMsg = 'exceeded max reconnect attempts. giving up :-(';
                this._onError(errorMsg, C.ERROR.MAX_RECONNECT_ATTEMPTS_EXCEEDED);
                clearTimeout(this._reconnectTimeout);
                this._onConnectPromise.reject(errorMsg);
                this._connection.close();
                this._onDisconnect();

                return;
            }

            const errorMsg = `Disconnected, attempting to reconnect. (Attempt ${this._reconnectAttempts} of ${this.options.maxReconnectAttempts})`
            this._onError(errorMsg, C.ERROR.DISCONNECTED_RETRYING);
            clearTimeout(this._reconnectTimeout);
            this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTED);

            this._reconnectTimeout = setTimeout(async () => {
                await this.connect(this._url);
                if (this.token) {
                    await this.authenticate(this.token);
                }
                this._sendRepeatOnReconnectMessages();
            }, this.options.reconnectInterval)
        }
    }

    _onError(errorMsg, errorType, details) {
        this.emit('error', errorMsg, errorType, details);
        if (this.options.logErrors) {
            console.warn(errorMsg, details || "");
        }
    }

    _onMessage(msg) {
        var messages;

        try {
            messages = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        } catch (e) {
            this._onError(`Failed to parse message: ${e} - ${msg.data}`, C.ERROR.MESSAGE_PARSE_ERROR);
        }

        if (Array.isArray(messages)) {
            messages.forEach(this._handleIncomingMessage.bind(this));
        } else {
            this._onError(`message was not in expected form: ${JSON.stringify(messages)}`, C.ERROR.MESSAGE_PARSE_ERROR);
        }
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
            for (let i = 0; i < this._pendingMessages.length; i++) {
                console.log('>', this._pendingMessages[i]);
            }
        }
        this._connection.send(JSON.stringify(this._pendingMessages));
        this._pendingMessages = null;
    }

    _sendHeartbeatMessage() {
        if (this.connectionStatus !== C.CONNECTION_STATUS.AUTHENTICATED) {
            return;
        }
        const id = this.getId('heartbeat');
        this._pendingHeartbeats[id] = Date.now();
        const heartbeatMessage = [{
            [C.FIELD.TYPE]: C.TYPE.SYSTEM,
            [C.FIELD.ACTION]: C.ACTION.HEARTBEAT,
            [C.FIELD.CORRELATION_ID]: id
        }];

        this._connection.send(JSON.stringify(heartbeatMessage));
    }

    _processHeartbeatResponse(msg) {
        if (this._pendingHeartbeats[msg[C.FIELD.CORRELATION_ID]]) {
            this.ping = Date.now() - this._pendingHeartbeats[msg[C.FIELD.CORRELATION_ID]];
            this.emit('ping', this.ping);
        }
        delete this._pendingHeartbeats[msg[C.FIELD.CORRELATION_ID]];
    }

    _handleIncomingMessage(msg) {
        if (this.options.logMessages) {
            console.log('<', msg);
        }
        if (msg[C.FIELD.CORRELATION_ID]) {
            if (this._pendingHeartbeats[msg[C.FIELD.CORRELATION_ID]]) {
                this._processHeartbeatResponse(msg);
            }
            else if (this._pendingRequests[msg[C.FIELD.CORRELATION_ID]]) {
                this._pendingRequests[msg[C.FIELD.CORRELATION_ID]].responseCallbacks.forEach(callback => {
                    callback(msg);
                });
                delete this._pendingRequests[msg[C.FIELD.CORRELATION_ID]];
            } else {
                this._onError('Received response for unknown request', C.ERROR.UNKNOWN_REQUEST, msg);
            }
        }
        // Generic Error without Correlation ID
        else if (msg[C.FIELD.RESULT] === C.RESULT.ERROR && msg[C.FIELD.TYPE] !== C.TYPE.SYSTEM) {
            this._onError(msg[C.FIELD.ERROR] || msg[C.FIELD.DATA], C.ERROR.SERVER_ERROR);
        }
        else if (!this._typeHandler[msg[C.FIELD.TYPE]]) {
            this._onError('Received message for unknown type ' + this._typeHandler[msg[C.FIELD.TYPE]], C.ERROR.UNKNOWN_TYPE)
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
        for (let id in this._pendingRequests) {
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
                this._onError(response[C.FIELD.ERROR], C.FIELD.SERVER_ERROR, C.FIELD.ERROR_CODE);
                result.reject({
                    message: response[C.FIELD.ERROR],
                    code: response[C.FIELD.ERROR_CODE]
                });
            } else {
                result.resolve(successDataTransform ? successDataTransform(response) : response);
            }
        });

        return result;
    }

    _getSignature(...args) {
        let val = JSON.stringify(args),
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

        for (let key in defaults) {
            if (typeof options[key] !== 'undefined') {
                combinedOptions[key] = options[key];
            } else {
                combinedOptions[key] = defaults[key];
            }
        }
        //TODO - Add check for unknown options
        return combinedOptions;
    }

    _extendFields(data, fields = fieldnames.FIELD) {
        const translated = {};
        for (let key in data) {
            if (fields[key]) {
                if (key === C.FIELD.LOCATION) {
                    translated[fields[key]] = this._extendFields(data[key], fieldnames.LOCATION);
                }
                else if (key === C.FIELD.STEPS) {
                    translated[fields[key]] = this._extendFieldsArray(data[key], fieldnames.FIELD);
                }
                else if (key === C.FIELD.PRESENCE_CONNECTION_STATUS) {
                    translated[fields[C.FIELD.PRESENCE_CONNECTION_STATUS]] = fieldnames.PRESENCE_CONNECTION_STATUS[data[key]];
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
        for (let id in entries) {
            result[id] = this._extendFields(entries[id]);
        }
        return result;
    }

    _extendFieldsArray(entries) {
        const result = [];
        for (let entry of entries) {
            result.push(this._extendFields(entry));
        }
        return result;
    }

    _compressFields(extendedFields, fieldnames, ignoreUnknown) {
        const reversedFieldNames = reverseMap(fieldnames);
        const compressedFields = {};
        for (let key in extendedFields) {
            if (reversedFieldNames[key]) {
                compressedFields[reversedFieldNames[key]] = extendedFields[key]
            } else if (ignoreUnknown) {
                compressedFields[key] = extendedFields[key]
            } else {
                this._onError(`Unknown field ${key}`, C.ERROR.UNKNOWN_FIELD);
            }
        }
        return compressedFields;
    }

    _repeatOnReconnect(type, realmId, id, msg) {
        const key = `${type}-${realmId}-${id}`;
        this._repeatOnReconnectMessages[key] = msg;
    }

    _removeFromRepeatOnReconnect(type, realmId, id) {
        const key = `${type}-${realmId}-${id}`;
        delete this._repeatOnReconnectMessages[key];
    }

    _sendRepeatOnReconnectMessages() {
        for (let key in this._repeatOnReconnectMessages) {
            this._sendRequest(this._repeatOnReconnectMessages[key], () => { });
        }
    }
}