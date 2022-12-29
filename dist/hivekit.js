var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, copyDefault, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toESM = (module, isNodeMode) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", !isNodeMode && module && module.__esModule ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};

// node_modules/form-data/lib/browser.js
var require_browser = __commonJS({
  "node_modules/form-data/lib/browser.js"(exports, module) {
    module.exports = typeof self == "object" ? self.FormData : window.FormData;
  }
});

// src/event-emitter.js
var EventEmitter = class {
  constructor() {
    this.listener = {};
    this.listenerId = 0;
  }
  on(eventName, fn, context, order) {
    this.listenerId++;
    if (!this.listener[eventName]) {
      this.listener[eventName] = [];
    }
    this.listener[eventName].push({
      eventName,
      fn,
      context,
      order,
      id: this.listenerId
    });
    this.listener[eventName].sort((a, b) => {
      if (a.order == b.order)
        return 0;
      return a.order > b.order ? 1 : -1;
    });
    return this.listenerId;
  }
  off(eventName, fn, context) {
    if (!this.listener[eventName]) {
      return;
    }
    var i = this.listener[eventName].length;
    while (i--) {
      if (this.listener[eventName][i].fn === fn && this.listener[eventName][i].context === context) {
        this.listener[eventName].splice(i, 1);
      }
    }
    if (this.listener[eventName].length === 0) {
      delete this.listener[eventName];
    }
  }
  removeListenerById(eventName, id) {
    if (!this.listener[eventName]) {
      throw new Error("No listener registered for eventname " + eventName);
    }
    var foundListener = false;
    this.listener[eventName] = this.listener[eventName].filter((listener) => {
      if (listener.id === id) {
        foundListener = true;
        return false;
      } else {
        return true;
      }
    });
    if (!foundListener) {
      throw new Error(`Failed to find listener with id ${id} for event ${eventName}`);
    }
  }
  emit(eventName) {
    if (!this.listener[eventName]) {
      return;
    }
    const args = Array.prototype.slice.call(arguments, 1);
    var last = null;
    var i = 0;
    while (this.listener[eventName] && this.listener[eventName][i]) {
      last = this.listener[eventName][i];
      if (this.listener[eventName][i].fn.apply(this.listener[eventName][i].context, args) === false) {
        return;
      }
      if (this.listener[eventName] && this.listener[eventName][i] === last) {
        i++;
      }
    }
  }
  hasListeners(eventName) {
    return !!(this.listener[eventName] && this.listener[eventName].length > 0);
  }
};

// src/constants.js
var constants_default = {
  CONNECTION_STATUS: {
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    CONNECTING: "connecting",
    DISCONNECTING: "disconnecting",
    AUTHENTICATED: "authenticated"
  },
  MODE: {
    HTTP: "http",
    WS: "ws"
  },
  TYPE: {
    REALM: "rea",
    OBJECT: "obj",
    AREA: "are",
    SUBSCRIPTION: "sub",
    SYSTEM: "sys",
    INSTRUCTION: "ins",
    LOGEVENT: "log"
  },
  UPDATE_TYPE: {
    FULL: "ful",
    DELTA: "dta"
  },
  STRING_VALUE: "val",
  INTERNAL_EVENTS: [
    "connectionStatusChanged"
  ],
  FIELD: {
    TYPE: "typ",
    SCOPE_TYPE: "sty",
    SUB_TYPE: "sty",
    SCOPE_ID: "sid",
    EXECUTE_IMMEDIATELY: "exe",
    ACTION: "act",
    RESULT: "res",
    CORRELATION_ID: "cid",
    ID: "id",
    REALM: "rea",
    DATA: "dat",
    LOCATION: "loc",
    ERROR: "err",
    LABEL: "lab",
    ATTRIBUTE: "atr",
    UPDATE_TYPE: "uty",
    INSTRUCTION_STRING: "ins",
    PRESENCE_CONNECTION_STATUS: "cst",
    SHAPE: "sha",
    SHAPE_DATA: "shapeData",
    FIELD: "fie",
    VALUE: "val",
    START: "sta",
    END: "end",
    LEVEL: "lvl",
    EVENT_NAME: "eve",
    ID_PATTERN: "idp",
    ERROR_CODE: "erc"
  },
  ACTION: {
    CREATE: "cre",
    READ: "rea",
    LIST: "lis",
    UPDATE: "upd",
    DELETE: "del",
    AUTHENTICATE: "aut",
    SET: "set",
    SEARCH: "sea",
    HEARTBEAT: "hbt",
    SUBSCRIBE: "sub",
    UNSUBSCRIBE: "uns",
    PUBLISH: "pub"
  },
  RESULT: {
    SUCCESS: "suc",
    WARNING: "war",
    ERROR: "err"
  },
  SUBSCRIPTION: {
    REALM: "all-realms"
  },
  LOCATION: {
    GEOGRAPHIC_COORDINATE_SYSTEM: "gcs",
    LONGITUDE: "lon",
    LATITUDE: "lat",
    ACCURACY: "acc",
    SPEED: "spe",
    HEADING: "hea",
    ALTITUDE: "alt",
    ALTITUDE_ACCURACY: "alc",
    TIME: "tim"
  },
  SHAPE_TYPE: {
    RECTANGLE: "rec",
    CIRCLE: "cir",
    POLYGON: "pol"
  },
  PRESENCE_CONNECTION_STATUS: {
    CONNECTED: "con",
    DISCONNECTED: "dis"
  }
};

// src/system-handler.js
var SystemHandler = class {
  constructor(client) {
    this._client = client;
    this._systemUpdateSubscription = null;
  }
  getHttpUrl() {
    return document.location.protocol + "//" + new URL(this._client._connection.url).host;
  }
  authenticateAdmin(password) {
    return new Promise(async (resolve, reject) => {
      const url = this.getHttpUrl() + this._client.options.adminDashboardBasePath + "api/authenticate-admin";
      var rawResponse;
      try {
        rawResponse = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username: "admin", password })
        });
      } catch (e) {
        reject(e.message);
        return;
      }
      if (rawResponse.status === 200) {
        resolve();
      } else {
        const result = await rawResponse.json();
        reject(result[0][constants_default.FIELD.ERROR]);
      }
    });
  }
  _sendAuthMessage(token) {
    if (this._client._connection.readyState === this._client._connection.constructor.OPEN) {
      this._client._connection.send("Bearer " + token);
    } else {
      this._client._connection.addEventListener("open", () => {
        this._client._connection.send("Bearer " + token);
      });
    }
  }
  _handleIncomingMessage(message) {
    switch (message[constants_default.FIELD.ACTION]) {
      case constants_default.ACTION.AUTHENTICATE:
        if (message[constants_default.FIELD.RESULT] === constants_default.RESULT.SUCCESS) {
          if (message[constants_default.FIELD.DATA]) {
            this._client.serverVersion = message[constants_default.FIELD.DATA].version;
            this._client.serverBuildDate = message[constants_default.FIELD.DATA].buildDate;
          }
          this._client._changeConnectionStatus(constants_default.CONNECTION_STATUS.AUTHENTICATED);
          this._client._onAuthenticatePromise && this._client._onAuthenticatePromise.resolve();
        }
        if (message[constants_default.FIELD.RESULT] === constants_default.RESULT.ERROR) {
          this._client._onAuthenticatePromise && this._client._onAuthenticatePromise.reject(message[constants_default.FIELD.DATA]);
        }
        break;
      default:
        this._client._onError(`Unknown action for type ${constants_default.TYPE.SYSTEM}: ${message[constants_default.FIELD.ACTION]}`);
    }
  }
};

// src/promise.js
function getPromise() {
  var resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  promise.resolve = resolve;
  promise.reject = reject;
  return promise;
}

// src/message.js
function createMessage(type, action, id, realm, data, location) {
  const message = {
    [constants_default.FIELD.TYPE]: type,
    [constants_default.FIELD.ACTION]: action
  };
  if (id)
    message[constants_default.FIELD.ID] = id;
  if (realm)
    message[constants_default.FIELD.REALM] = realm;
  if (data)
    message[constants_default.FIELD.DATA] = data;
  if (location)
    message[constants_default.FIELD.LOCATION] = location;
  return message;
}

// src/fieldnames.js
var fieldnames_default = {
  TYPE: {
    [constants_default.TYPE.REALM]: "realm",
    [constants_default.TYPE.OBJECT]: "object",
    [constants_default.TYPE.AREA]: "area",
    [constants_default.TYPE.SUBSCRIPTION]: "subscription",
    [constants_default.TYPE.SYSTEM]: "system",
    [constants_default.TYPE.INSTRUCTION]: "instruction",
    [constants_default.TYPE.LOGEVENT]: "logEvent"
  },
  FIELD: {
    [constants_default.FIELD.TYPE]: "type",
    [constants_default.FIELD.SCOPE_TYPE]: "scopeType",
    [constants_default.FIELD.SCOPE_ID]: "scopeId",
    [constants_default.FIELD.ACTION]: "action",
    [constants_default.FIELD.RESULT]: "result",
    [constants_default.FIELD.CORRELATION_ID]: "correlationId",
    [constants_default.FIELD.ID]: "id",
    [constants_default.FIELD.REALM]: "realm",
    [constants_default.FIELD.DATA]: "data",
    [constants_default.FIELD.LOCATION]: "location",
    [constants_default.FIELD.ERROR]: "error",
    [constants_default.FIELD.LABEL]: "label",
    [constants_default.FIELD.ATTRIBUTE]: ["attribute", "where"],
    [constants_default.FIELD.EXECUTE_IMMEDIATELY]: "executeImmediately",
    [constants_default.FIELD.SHAPE]: "shape",
    [constants_default.FIELD.SHAPE_DATA]: "shapeData",
    [constants_default.FIELD.INSTRUCTION_STRING]: "instructionString",
    [constants_default.FIELD.FIELD]: "field",
    [constants_default.FIELD.VALUE]: "value",
    [constants_default.FIELD.START]: "start",
    [constants_default.FIELD.END]: "end",
    [constants_default.FIELD.LEVEL]: "level",
    [constants_default.FIELD.PRESENCE_CONNECTION_STATUS]: "connectionStatus"
  },
  PRESENCE_CONNECTION_STATUS: {
    [constants_default.PRESENCE_CONNECTION_STATUS.CONNECTED]: "connected",
    [constants_default.PRESENCE_CONNECTION_STATUS.DISCONNECTED]: "disconnected"
  },
  ACTION: {
    [constants_default.ACTION.CREATE]: "create",
    [constants_default.ACTION.READ]: "read",
    [constants_default.ACTION.LIST]: "list",
    [constants_default.ACTION.UPDATE]: "update",
    [constants_default.ACTION.DELETE]: "delete",
    [constants_default.ACTION.AUTHENTICATE]: "authenticate",
    [constants_default.ACTION.SET]: "set"
  },
  RESULT: {
    [constants_default.RESULT.SUCCESS]: "success",
    [constants_default.RESULT.WARNING]: "warning",
    [constants_default.RESULT.ERROR]: "error"
  },
  LOCATION: {
    [constants_default.LOCATION.GEOGRAPHIC_COORDINATE_SYSTEM]: "coordinateSystem",
    [constants_default.LOCATION.LONGITUDE]: "longitude",
    [constants_default.LOCATION.LATITUDE]: "latitude",
    [constants_default.LOCATION.ACCURACY]: "accuracy",
    [constants_default.LOCATION.SPEED]: "speed",
    [constants_default.LOCATION.HEADING]: "heading",
    [constants_default.LOCATION.ALTITUDE]: "altitude",
    [constants_default.LOCATION.ALTITUDE_ACCURACY]: "altitudeAccuracy",
    [constants_default.LOCATION.TIME]: "time"
  },
  SHAPE_TYPE: {
    [constants_default.SHAPE_TYPE.RECTANGLE]: "rectangle",
    [constants_default.SHAPE_TYPE.CIRCLE]: "circle",
    [constants_default.SHAPE_TYPE.POLYGON]: "polygon"
  }
};

// src/tools.js
function reverseMap(input) {
  const reversed = {};
  for (var key in input) {
    if (input[key] instanceof Array) {
      input[key].forEach((keyName) => {
        reversed[keyName] = key;
      });
    } else {
      reversed[input[key]] = key;
    }
  }
  return reversed;
}
function extendMap(mapA, mapB) {
  for (var key in mapB) {
    mapA[key] = mapB[key];
  }
  return mapA;
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
var SHAPE_SIGNATURES = {
  "x1x2y1y2": constants_default.SHAPE_TYPE.RECTANGLE,
  "cxcyr": constants_default.SHAPE_TYPE.CIRCLE,
  "points": constants_default.SHAPE_TYPE.POLYGON
};
function getShapeTypeFromSignature(shapeData) {
  return SHAPE_SIGNATURES[Object.keys(shapeData).sort().join("")] || null;
}

// src/object-handler.js
var ObjectHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
    this._locationFields = this._getLocationFields();
  }
  subscribe(options) {
    if (options && options.shape) {
      options.scopeType = getShapeTypeFromSignature(options.shape);
      if (options.scopeType === null) {
        return Promise.reject("unknown shape data");
      }
    }
    return this._client._subscription._getSubscription(this._client.getId("object-subscription"), this._realm.id, extendMap({
      [constants_default.FIELD.TYPE]: constants_default.TYPE.OBJECT,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    }, this._client._compressFields(options, fieldnames_default.FIELD)));
  }
  get(id) {
    if (!id) {
      throw new Error("no id provided for object.get");
    }
    const msg = createMessage(constants_default.TYPE.OBJECT, constants_default.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return this._client._extendFields(response[constants_default.FIELD.DATA]);
    });
  }
  create(id, options) {
    return this._setObjectState(id, options.label, options.location, options.data, constants_default.ACTION.CREATE);
  }
  update(id, options) {
    return this._setObjectState(id, options.label, options.location, options.data, constants_default.ACTION.UPDATE);
  }
  set(id, options) {
    return this._setObjectState(id, options.label, options.location, options.data, constants_default.ACTION.SET);
  }
  list(options) {
    const msg = createMessage(constants_default.TYPE.OBJECT, constants_default.ACTION.LIST, null, this._realm.id);
    if (options && Object.keys(options).length > 0) {
      msg[constants_default.FIELD.DATA] = this._client._compressFields(options, fieldnames_default.FIELD);
    }
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result[constants_default.FIELD.DATA]);
    });
  }
  delete(id) {
    const msg = createMessage(constants_default.TYPE.OBJECT, constants_default.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _getLocationFields() {
    const locationFields = {};
    for (var fieldname in fieldnames_default.LOCATION) {
      locationFields[fieldnames_default.LOCATION[fieldname]] = fieldname;
    }
    return locationFields;
  }
  _setObjectState(id, label, location, data, action) {
    const msg = createMessage(constants_default.TYPE.OBJECT, action, id, this._realm.id);
    if (label)
      msg[constants_default.FIELD.LABEL] = label;
    if (location && Object.keys(location).length > 0) {
      msg[constants_default.FIELD.LOCATION] = this._parseLocation(location);
    }
    if (data && Object.keys(data).length > 0)
      msg[constants_default.FIELD.DATA] = data;
    if (action === constants_default.ACTION.SET && this._client.mode !== constants_default.MODE.HTTP) {
      this._client._sendMessage(msg);
    } else {
      return this._client._sendRequestAndHandleResponse(msg);
    }
  }
  _parseLocation(location) {
    const parsedLocation = {};
    for (var key in location) {
      if (key.length === 0) {
        continue;
      }
      if (typeof location[key] !== "string") {
        parsedLocation[this._locationFields[key]] = location[key];
        continue;
      }
      if (location[key].length > 0) {
        if (key === fieldnames_default.LOCATION[constants_default.LOCATION.TIME]) {
          try {
            parsedLocation[key] = new Date(location[key]).toISOString();
          } catch (e) {
            throw new Error(`Can't convert ${location[key]} into a valid date:${e}`);
          }
        } else {
          parsedLocation[this._locationFields[key]] = parseFloat(location[key]);
        }
      }
    }
    return parsedLocation;
  }
};

// src/area-handler.js
var AreaHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
  }
  subscribe(options) {
    return this._client._subscription._getSubscription(this._client.getId("area-subscription"), this._realm.id, extendMap({
      [constants_default.FIELD.TYPE]: constants_default.TYPE.AREA,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    }, this._client._compressFields(options, fieldnames_default.FIELD)));
  }
  get(id) {
    const msg = createMessage(constants_default.TYPE.AREA, constants_default.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return this._client._extendFields(response[constants_default.FIELD.DATA]);
    });
  }
  create(id, options) {
    return this._setAreaState(id, options.label, options.shape, options.data, constants_default.ACTION.CREATE);
  }
  update(id, options) {
    return this._setAreaState(id, options.label, options.shape, options.data, constants_default.ACTION.UPDATE);
  }
  list() {
    const msg = createMessage(constants_default.TYPE.AREA, constants_default.ACTION.LIST, null, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      const areas = this._client._extendFieldsMap(result[constants_default.FIELD.DATA]);
      for (var id in areas) {
        areas[id].shape = fieldnames_default.SHAPE_TYPE[areas[id].scopeType];
        delete areas[id].scopeType;
      }
      return areas;
    });
  }
  delete(id) {
    const msg = createMessage(constants_default.TYPE.AREA, constants_default.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _setAreaState(id, label, shapeData, data, action) {
    const msg = createMessage(constants_default.TYPE.AREA, action, id, this._realm.id);
    if (label)
      msg[constants_default.FIELD.LABEL] = label;
    if (data)
      msg[constants_default.FIELD.DATA] = data;
    msg[constants_default.FIELD.SUB_TYPE] = getShapeTypeFromSignature(shapeData);
    if (!msg[constants_default.FIELD.SUB_TYPE]) {
      return Promise.reject("unknown shape data");
    }
    msg[constants_default.FIELD.SHAPE] = shapeData;
    return this._client._sendRequestAndHandleResponse(msg);
  }
};

// src/instruction-handler.js
var InstructionHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
  }
  subscribe(options) {
    return this._client._subscription._getSubscription(this._client.getId("instruction-subscription"), this._realm.id, extendMap({
      [constants_default.FIELD.TYPE]: constants_default.TYPE.INSTRUCTION,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    }, this._client._compressFields(options, fieldnames_default.FIELD)));
  }
  subscribeToLogs(options) {
    return this._client._subscription._getSubscription(this._client.getId("instruction-log-subscription"), this._realm.id, extendMap({
      [constants_default.FIELD.TYPE]: constants_default.TYPE.LOGEVENT,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    }, this._client._compressFields(options, fieldnames_default.FIELD)));
  }
  get(id) {
    const msg = createMessage(constants_default.TYPE.INSTRUCTION, constants_default.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return this._client._extendFields(response[constants_default.FIELD.DATA]);
    });
  }
  create(id, options) {
    return this._setInstructionState(id, options.label, options.instructionString, options.data, constants_default.ACTION.CREATE);
  }
  update(id, options) {
    return this._setInstructionState(id, options.label, options.instructionString, options.data, constants_default.ACTION.UPDATE);
  }
  list() {
    const msg = createMessage(constants_default.TYPE.INSTRUCTION, constants_default.ACTION.LIST, null, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result[constants_default.FIELD.DATA]);
    });
  }
  delete(id) {
    const msg = createMessage(constants_default.TYPE.INSTRUCTION, constants_default.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _setInstructionState(id, label, instructionString, data, action) {
    const msg = createMessage(constants_default.TYPE.INSTRUCTION, action, id, this._realm.id);
    msg[constants_default.FIELD.INSTRUCTION_STRING] = instructionString;
    if (label)
      msg[constants_default.FIELD.LABEL] = label;
    if (data)
      msg[constants_default.FIELD.DATA] = data;
    return this._client._sendRequestAndHandleResponse(msg);
  }
};

// src/pubsub-handler.js
var PubSubHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
    this._subscriptionCallbacks = [];
  }
  subscribe(eventName, idPatternOrCallback, callback) {
    var idPattern = null;
    if (arguments.length == 2) {
      callback = idPatternOrCallback;
    } else {
      idPattern = idPatternOrCallback;
    }
    this._subscriptionCallbacks[eventName] = callback;
    return this._client._sendRequestAndHandleResponse(this._getPubSubMessage(constants_default.ACTION.SUBSCRIBE, eventName, idPattern));
  }
  unsubscribe(eventName, idPattern) {
    delete this._subscriptionCallbacks[eventName];
    return this._client._sendRequestAndHandleResponse(this._getPubSubMessage(constants_default.ACTION.UNSUBSCRIBE, eventName, idPattern));
  }
  publish(eventName, idPatternOrData, data) {
    var idPattern;
    if (arguments.length == 2) {
      idPattern = "*";
      data = idPatternOrData;
    } else {
      idPattern = idPatternOrData;
    }
    const msg = this._getPubSubMessage(constants_default.ACTION.PUBLISH, eventName, idPattern);
    msg[constants_default.FIELD.DATA][constants_default.FIELD.DATA] = data;
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _emitSubscriptionEvent(eventName, data, idPattern) {
    if (this._subscriptionCallbacks[eventName]) {
      if (constants_default.INTERNAL_EVENTS.includes(eventName)) {
        data = this._client._extendFields(data);
      }
      this._subscriptionCallbacks[eventName](data, idPattern);
    }
  }
  _getPubSubMessage(action, eventName, idPattern) {
    const msg = createMessage(constants_default.TYPE.REALM, action, this._realm.id);
    msg[constants_default.FIELD.DATA] = {
      [constants_default.FIELD.EVENT_NAME]: eventName,
      [constants_default.FIELD.ID_PATTERN]: idPattern || "*"
    };
    return msg;
  }
};

// src/realm.js
var Realm = class extends EventEmitter {
  constructor(id, label, data, client) {
    super();
    this._client = client;
    this._data = data;
    this._subscriptionCallbacks = {};
    this.id = id;
    this.label = label;
    this.object = new ObjectHandler(client, this);
    this.area = new AreaHandler(client, this);
    this.instruction = new InstructionHandler(client, this);
    this.pubsub = new PubSubHandler(client, this);
  }
  getData(key) {
    if (!key) {
      return deepClone(this._data);
    }
    if (typeof this._data[key] === "object") {
      return deepClone(this._data[key]);
    } else {
      return this._data[key];
    }
  }
  setData(key, value) {
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.UPDATE, this.id);
    this._data[key] = value;
    msg[constants_default.FIELD.DATA] = this._data;
    this.emit("update");
    return this._client._sendRequestAndHandleResponse(msg);
  }
  setLabel(label) {
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.UPDATE, this.id);
    this.label = label;
    msg[constants_default.FIELD.LABEL] = label;
    this.emit("update");
    return this._client._sendRequestAndHandleResponse(msg);
  }
  search(searchString, options) {
    const data = this._client._compressFields(options, fieldnames_default.FIELD, true);
    data[constants_default.STRING_VALUE] = searchString;
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.SEARCH, null, this.id, data);
    return this._client._sendRequestAndHandleResponse(msg, (results) => {
      if (!results[constants_default.FIELD.DATA]) {
        return [];
      }
      return results[constants_default.FIELD.DATA].map((result) => {
        const extendedResult = this._client._extendFields(result);
        extendedResult.dataProperty = extendedResult.scopeType;
        delete extendedResult.scopeType;
        return extendedResult;
      });
    });
  }
};

// src/realm-handler.js
var RealmHandler = class {
  constructor(client) {
    this._client = client;
    this._realms = {};
  }
  subscribe() {
    return this._client._subscription._getSubscription(this._client.getId("realm-subscription-"), constants_default.TYPE.SYSTEM, {
      [constants_default.FIELD.TYPE]: constants_default.TYPE.SYSTEM,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    });
  }
  get(id) {
    if (this._realms[id]) {
      const result = getPromise();
      result.resolve(this._realms[id]);
      return result;
    }
    if (this._client.mode === constants_default.MODE.HTTP) {
      this._realms[id] = new Realm(id, null, {}, this._client);
      return Promise.resolve(this._realms[id]);
    }
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.READ, id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      this._realms[id] = new Realm(id, response[constants_default.FIELD.DATA][constants_default.FIELD.LABEL], response[constants_default.FIELD.DATA][constants_default.FIELD.DATA] || {}, this._client);
      return this._realms[id];
    });
  }
  create(id, label, data) {
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.CREATE, id);
    if (label)
      msg[constants_default.FIELD.LABEL] = label;
    if (data && Object.keys(data).length > 0)
      msg[constants_default.FIELD.DATA] = data;
    return this._client._sendRequestAndHandleResponse(msg);
  }
  list() {
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.LIST);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result.dat);
    });
  }
  delete(id) {
    const msg = createMessage(constants_default.TYPE.REALM, constants_default.ACTION.DELETE, id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _handleIncomingMessage(msg) {
    if (msg[constants_default.FIELD.ACTION] == constants_default.ACTION.PUBLISH && this._realms[msg[constants_default.FIELD.REALM]]) {
      this._realms[msg[constants_default.FIELD.REALM]].pubsub._emitSubscriptionEvent(msg[constants_default.FIELD.DATA][constants_default.FIELD.EVENT_NAME], msg[constants_default.FIELD.DATA][constants_default.FIELD.DATA], msg[constants_default.FIELD.DATA][constants_default.FIELD.ID_PATTERN]);
    }
  }
};

// node_modules/nanoid/index.prod.js
if (false) {
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative" && typeof crypto === "undefined") {
    throw new Error("React Native does not have a built-in secure random generator. If you don\u2019t need unpredictable IDs use `nanoid/non-secure`. For secure IDs, import `react-native-get-random-values` before Nano ID.");
  }
  if (typeof msCrypto !== "undefined" && typeof crypto === "undefined") {
    throw new Error("Import file with `if (!window.crypto) window.crypto = window.msCrypto` before importing Nano ID to fix IE 11 support");
  }
  if (typeof crypto === "undefined") {
    throw new Error("Your browser does not have secure random generator. If you don\u2019t need unpredictable IDs, you can use nanoid/non-secure.");
  }
}
var nanoid = (size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size));
  while (size--) {
    let byte = bytes[size] & 63;
    if (byte < 36) {
      id += byte.toString(36);
    } else if (byte < 62) {
      id += (byte - 26).toString(36).toUpperCase();
    } else if (byte < 63) {
      id += "_";
    } else {
      id += "-";
    }
  }
  return id;
};

// src/subscription.js
var Subscription = class extends EventEmitter {
  constructor(client, id, realmId) {
    super();
    this.id = id;
    this.realmId = realmId;
    this._client = client;
    this._data = null;
  }
  cancel() {
    this.listener = {};
    return this._client._subscription._removeSubscription(this);
  }
  update(options) {
    if (options && options.shape) {
      options.scopeType = getShapeTypeFromSignature(options.shape);
      if (options.scopeType === null) {
        return Promise.reject("unknown shape data");
      }
    }
    const msg = createMessage(constants_default.TYPE.SUBSCRIPTION, constants_default.ACTION.UPDATE, this.id, this.realmId, extendMap({
      [constants_default.FIELD.TYPE]: constants_default.TYPE.OBJECT,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    }, this._client._compressFields(options, fieldnames_default.FIELD)));
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _processIncomingMessage(msg) {
    let data = {};
    if (msg[constants_default.TYPE.OBJECT]) {
      data = this._client._extendFieldsMap(msg[constants_default.TYPE.OBJECT]);
    } else if (msg[constants_default.TYPE.AREA]) {
      data = this._client._extendFieldsMap(msg[constants_default.TYPE.AREA]);
    } else if (msg[constants_default.TYPE.INSTRUCTION]) {
      data = this._client._extendFieldsMap(msg[constants_default.TYPE.INSTRUCTION]);
    } else if (msg[constants_default.TYPE.LOGEVENT]) {
      data = this._client._extendFieldsArray(msg[constants_default.TYPE.LOGEVENT]);
    } else if (msg[constants_default.FIELD.DATA] && msg[constants_default.FIELD.DATA][constants_default.FIELD.TYPE] === constants_default.TYPE.REALM) {
      data = {
        realmId: msg[constants_default.FIELD.DATA][constants_default.FIELD.ID],
        action: fieldnames_default.ACTION[msg[constants_default.FIELD.DATA][constants_default.FIELD.ACTION]]
      };
    }
    switch (msg[constants_default.FIELD.UPDATE_TYPE]) {
      case constants_default.UPDATE_TYPE.FULL:
        this._data = data;
        break;
      case constants_default.UPDATE_TYPE.DELTA:
        for (var id in data) {
          this._data[id] = data[id];
        }
        break;
      default:
        this._client._onError("Received subscription message with unknown update type " + msg[constants_default.FIELD.UPDATE_TYPE]);
        return;
    }
    this.emit("update", this._data);
  }
};

// src/subscription-handler.js
var SubscriptionHandler = class {
  constructor(client) {
    this._client = client;
    this._subscriptionCollections = {};
    this._pendingSubscriptionPromises = {};
  }
  _getSubscription(id, realmId, options) {
    const resultPromise = getPromise();
    const signature = this._client._getSignature(realmId, options);
    var subscription;
    var subscriptionCollection = this._subscriptionCollections[id];
    if (!subscriptionCollection) {
      for (var _id in this._subscriptionCollections) {
        if (this._subscriptionCollections[_id].signature === signature) {
          id = _id;
          subscriptionCollection = this._subscriptionCollections[id];
        }
      }
    }
    if (subscriptionCollection) {
      subscription = new Subscription(this._client, id, realmId);
      subscriptionCollection.push(subscription);
      resultPromise.resolve(subscription);
      if (options[constants_default.FIELD.EXECUTE_IMMEDIATELY]) {
        this._invokeImmediatly(subscription);
      }
      return resultPromise;
    }
    if (!id) {
      id = this.getId(this.constants.TYPE.SUBSCRIPTION);
    }
    subscription = new Subscription(this._client, id, realmId);
    this._subscriptionCollections[id] = [subscription];
    this._subscriptionCollections[id].signature = signature;
    if (this._pendingSubscriptionPromises[signature]) {
      this._pendingSubscriptionPromises[signature].push({ resultPromise, subscription });
      return resultPromise;
    }
    this._pendingSubscriptionPromises[signature] = [{ resultPromise, subscription }];
    const msg = createMessage(constants_default.TYPE.SUBSCRIPTION, constants_default.ACTION.CREATE, id, realmId, options);
    this._client._sendRequest(msg, (res) => {
      if (res[constants_default.FIELD.RESULT] === constants_default.RESULT.SUCCESS) {
        this._pendingSubscriptionPromises[signature].forEach((entry) => {
          entry.resultPromise.resolve(entry.subscription);
        });
      } else {
        this._pendingSubscriptionPromises[signature].forEach((promise) => {
          promise.resultPromise.reject(res[constants_default.FIELD.ERROR]);
        });
      }
      delete this._pendingSubscriptionPromises[signature];
    });
    return resultPromise;
  }
  _removeSubscription(subscription) {
    if (!this._subscriptionCollections[subscription.id]) {
      throw new Error("Can`t remove unknown subscription " + subscription.id);
    }
    if (!this._subscriptionCollections[subscription.id].includes(subscription)) {
      throw new Error("Subscription not found for id " + subscription.id);
    }
    this._subscriptionCollections[subscription.id] = this._subscriptionCollections[subscription.id].filter((_subscription) => {
      return subscription !== _subscription;
    });
    if (this._subscriptionCollections[subscription.id].length > 0) {
      return new Promise((resolve) => {
        resolve();
      });
    }
    const msg = createMessage(constants_default.TYPE.SUBSCRIPTION, constants_default.ACTION.DELETE, subscription.id, subscription.realmId);
    delete this._subscriptionCollections[subscription.id];
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _handleIncomingMessage(msg) {
    const id = msg[constants_default.FIELD.ID];
    if (!this._subscriptionCollections[id]) {
      this._client._onError("Received message for unknown subscription " + msg);
    } else {
      for (var i = 0; i < this._subscriptionCollections[id].length; i++) {
        this._subscriptionCollections[id][i]._processIncomingMessage(msg);
        if (!this._subscriptionCollections[id]) {
          break;
        }
      }
    }
  }
  _invokeImmediatly(subscription) {
    if (!this._subscriptionCollections[subscription.id]) {
      return;
    }
    var data = null, i;
    for (i = 0; i < this._subscriptionCollections[subscription.id].length; i++) {
      if (this._subscriptionCollections[subscription.id][i]._data) {
        data = this._subscriptionCollections[subscription.id][i]._data;
      }
    }
    if (data) {
      setTimeout(() => {
        subscription.emit("update", data);
      }, 10);
    }
  }
};

// node_modules/axios/lib/helpers/bind.js
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}

// node_modules/axios/lib/utils.js
var { toString } = Object.prototype;
var { getPrototypeOf } = Object;
var kindOf = ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
var kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
var typeOfTest = (type) => (thing) => typeof thing === type;
var { isArray } = Array;
var isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
var isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
var isString = typeOfTest("string");
var isFunction = typeOfTest("function");
var isNumber = typeOfTest("number");
var isObject = (thing) => thing !== null && typeof thing === "object";
var isBoolean = (thing) => thing === true || thing === false;
var isPlainObject = (val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype3 = getPrototypeOf(val);
  return (prototype3 === null || prototype3 === Object.prototype || Object.getPrototypeOf(prototype3) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
};
var isDate = kindOfTest("Date");
var isFile = kindOfTest("File");
var isBlob = kindOfTest("Blob");
var isFileList = kindOfTest("FileList");
var isStream = (val) => isObject(val) && isFunction(val.pipe);
var isFormData = (thing) => {
  const pattern = "[object FormData]";
  return thing && (typeof FormData === "function" && thing instanceof FormData || toString.call(thing) === pattern || isFunction(thing.toString) && thing.toString() === pattern);
};
var isURLSearchParams = kindOfTest("URLSearchParams");
var trim = (str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function merge() {
  const result = {};
  const assignValue = (val, key) => {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  };
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}
var extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, { allOwnKeys });
  return a;
};
var stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
var inherits = (constructor, superConstructor, props, descriptors2) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors2);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, "super", {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
var toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null)
    return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
var endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
var toArray = (thing) => {
  if (!thing)
    return null;
  if (isArray(thing))
    return thing;
  let i = thing.length;
  if (!isNumber(i))
    return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
var isTypedArray = ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
var forEachEntry = (obj, fn) => {
  const generator = obj && obj[Symbol.iterator];
  const iterator = generator.call(obj);
  let result;
  while ((result = iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
var matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
var isHTMLForm = kindOfTest("HTMLFormElement");
var toCamelCase = (str) => {
  return str.toLowerCase().replace(/[_-\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
var hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
var isRegExp = kindOfTest("RegExp");
var reduceDescriptors = (obj, reducer) => {
  const descriptors2 = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors2, (descriptor, name) => {
    if (reducer(descriptor, name, obj) !== false) {
      reducedDescriptors[name] = descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
var freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    const value = obj[name];
    if (!isFunction(value))
      return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not read-only method '" + name + "'");
      };
    }
  });
};
var toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
var noop = () => {
};
var toFiniteNumber = (value, defaultValue) => {
  value = +value;
  return Number.isFinite(value) ? value : defaultValue;
};
var utils_default = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber
};

// node_modules/axios/lib/core/AxiosError.js
function AxiosError(message, code, config, request, response) {
  Error.call(this);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack;
  }
  this.message = message;
  this.name = "AxiosError";
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}
utils_default.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});
var prototype = AxiosError.prototype;
var descriptors = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
].forEach((code) => {
  descriptors[code] = { value: code };
});
Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, "isAxiosError", { value: true });
AxiosError.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(prototype);
  utils_default.toFlatObject(error, axiosError, function filter2(obj) {
    return obj !== Error.prototype;
  }, (prop) => {
    return prop !== "isAxiosError";
  });
  AxiosError.call(axiosError, error.message, code, config, request, response);
  axiosError.cause = error;
  axiosError.name = error.name;
  customProps && Object.assign(axiosError, customProps);
  return axiosError;
};
var AxiosError_default = AxiosError;

// node_modules/axios/lib/env/classes/FormData.js
var import_form_data = __toESM(require_browser(), 1);
var FormData_default = import_form_data.default;

// node_modules/axios/lib/helpers/toFormData.js
function isVisitable(thing) {
  return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
function removeBrackets(key) {
  return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path)
    return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils_default.isArray(arr) && !arr.some(isVisitable);
}
var predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function isSpecCompliant(thing) {
  return thing && utils_default.isFunction(thing.append) && thing[Symbol.toStringTag] === "FormData" && thing[Symbol.iterator];
}
function toFormData(obj, formData, options) {
  if (!utils_default.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (FormData_default || FormData)();
  options = utils_default.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, function defined(option, source) {
    return !utils_default.isUndefined(source[option]);
  });
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const useBlob = _Blob && isSpecCompliant(formData);
  if (!utils_default.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null)
      return "";
    if (utils_default.isDate(value)) {
      return value.toISOString();
    }
    if (!useBlob && utils_default.isBlob(value)) {
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
    }
    if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (value && !path && typeof value === "object") {
      if (utils_default.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]") && (arr = utils_default.toArray(value)))) {
        key = removeBrackets(key);
        arr.forEach(function each(el, index) {
          !(utils_default.isUndefined(el) || el === null) && formData.append(indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]", convertValue(el));
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path) {
    if (utils_default.isUndefined(value))
      return;
    if (stack.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils_default.forEach(value, function each(el, key) {
      const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(formData, el, utils_default.isString(key) ? key.trim() : key, path, exposedHelpers);
      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    });
    stack.pop();
  }
  if (!utils_default.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
var toFormData_default = toFormData;

// node_modules/axios/lib/helpers/AxiosURLSearchParams.js
function encode(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData_default(params, this, options);
}
var prototype2 = AxiosURLSearchParams.prototype;
prototype2.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype2.toString = function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode);
  } : encode;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
var AxiosURLSearchParams_default = AxiosURLSearchParams;

// node_modules/axios/lib/helpers/buildURL.js
function encode2(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _encode = options && options.encode || encode2;
  const serializeFn = options && options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}

// node_modules/axios/lib/core/InterceptorManager.js
var InterceptorManager = class {
  constructor() {
    this.handlers = [];
  }
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  forEach(fn) {
    utils_default.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
};
var InterceptorManager_default = InterceptorManager;

// node_modules/axios/lib/defaults/transitional.js
var transitional_default = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

// node_modules/axios/lib/platform/browser/classes/URLSearchParams.js
var URLSearchParams_default = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams_default;

// node_modules/axios/lib/platform/browser/classes/FormData.js
var FormData_default2 = FormData;

// node_modules/axios/lib/platform/browser/index.js
var isStandardBrowserEnv = (() => {
  let product;
  if (typeof navigator !== "undefined" && ((product = navigator.product) === "ReactNative" || product === "NativeScript" || product === "NS")) {
    return false;
  }
  return typeof window !== "undefined" && typeof document !== "undefined";
})();
var browser_default = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams_default,
    FormData: FormData_default2,
    Blob
  },
  isStandardBrowserEnv,
  protocols: ["http", "https", "file", "blob", "url", "data"]
};

// node_modules/axios/lib/helpers/toURLEncodedForm.js
function toURLEncodedForm(data, options) {
  return toFormData_default(data, new browser_default.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (browser_default.isNode && utils_default.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
}

// node_modules/axios/lib/helpers/formDataToJSON.js
function parsePropPath(name) {
  return utils_default.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils_default.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils_default.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils_default.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils_default.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
    const obj = {};
    utils_default.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
var formDataToJSON_default = formDataToJSON;

// node_modules/axios/lib/core/settle.js
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError_default("Request failed with status code " + response.status, [AxiosError_default.ERR_BAD_REQUEST, AxiosError_default.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4], response.config, response.request, response));
  }
}

// node_modules/axios/lib/helpers/cookies.js
var cookies_default = browser_default.isStandardBrowserEnv ? function standardBrowserEnv() {
  return {
    write: function write(name, value, expires, path, domain, secure) {
      const cookie = [];
      cookie.push(name + "=" + encodeURIComponent(value));
      if (utils_default.isNumber(expires)) {
        cookie.push("expires=" + new Date(expires).toGMTString());
      }
      if (utils_default.isString(path)) {
        cookie.push("path=" + path);
      }
      if (utils_default.isString(domain)) {
        cookie.push("domain=" + domain);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      document.cookie = cookie.join("; ");
    },
    read: function read(name) {
      const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
      return match ? decodeURIComponent(match[3]) : null;
    },
    remove: function remove(name) {
      this.write(name, "", Date.now() - 864e5);
    }
  };
}() : function nonStandardBrowserEnv() {
  return {
    write: function write() {
    },
    read: function read() {
      return null;
    },
    remove: function remove() {
    }
  };
}();

// node_modules/axios/lib/helpers/isAbsoluteURL.js
function isAbsoluteURL(url) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

// node_modules/axios/lib/helpers/combineURLs.js
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}

// node_modules/axios/lib/core/buildFullPath.js
function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}

// node_modules/axios/lib/helpers/isURLSameOrigin.js
var isURLSameOrigin_default = browser_default.isStandardBrowserEnv ? function standardBrowserEnv2() {
  const msie = /(msie|trident)/i.test(navigator.userAgent);
  const urlParsingNode = document.createElement("a");
  let originURL;
  function resolveURL(url) {
    let href = url;
    if (msie) {
      urlParsingNode.setAttribute("href", href);
      href = urlParsingNode.href;
    }
    urlParsingNode.setAttribute("href", href);
    return {
      href: urlParsingNode.href,
      protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, "") : "",
      host: urlParsingNode.host,
      search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, "") : "",
      hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, "") : "",
      hostname: urlParsingNode.hostname,
      port: urlParsingNode.port,
      pathname: urlParsingNode.pathname.charAt(0) === "/" ? urlParsingNode.pathname : "/" + urlParsingNode.pathname
    };
  }
  originURL = resolveURL(window.location.href);
  return function isURLSameOrigin(requestURL) {
    const parsed = utils_default.isString(requestURL) ? resolveURL(requestURL) : requestURL;
    return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
  };
}() : function nonStandardBrowserEnv2() {
  return function isURLSameOrigin() {
    return true;
  };
}();

// node_modules/axios/lib/cancel/CanceledError.js
function CanceledError(message, config, request) {
  AxiosError_default.call(this, message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config, request);
  this.name = "CanceledError";
}
utils_default.inherits(CanceledError, AxiosError_default, {
  __CANCEL__: true
});
var CanceledError_default = CanceledError;

// node_modules/axios/lib/helpers/parseProtocol.js
function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || "";
}

// node_modules/axios/lib/helpers/parseHeaders.js
var ignoreDuplicateOf = utils_default.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
var parseHeaders_default = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};

// node_modules/axios/lib/core/AxiosHeaders.js
var $internals = Symbol("internals");
var $defaults = Symbol("defaults");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils_default.isArray(value) ? value.map(normalizeValue) : String(value);
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
function matchHeaderValue(context, value, header, filter2) {
  if (utils_default.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (!utils_default.isString(value))
    return;
  if (utils_default.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils_default.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils_default.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
function AxiosHeaders(headers, defaults2) {
  headers && this.set(headers);
  this[$defaults] = defaults2 || null;
}
Object.assign(AxiosHeaders.prototype, {
  set: function(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = findKey(self2, lHeader);
      if (key && _rewrite !== true && (self2[key] === false || _rewrite === false)) {
        return;
      }
      self2[key || _header] = normalizeValue(_value);
    }
    if (utils_default.isPlainObject(header)) {
      utils_default.forEach(header, (_value, _header) => {
        setHeader(_value, _header, valueOrRewrite);
      });
    } else {
      setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  },
  get: function(header, parser) {
    header = normalizeHeader(header);
    if (!header)
      return void 0;
    const key = findKey(this, header);
    if (key) {
      const value = this[key];
      if (!parser) {
        return value;
      }
      if (parser === true) {
        return parseTokens(value);
      }
      if (utils_default.isFunction(parser)) {
        return parser.call(this, value, key);
      }
      if (utils_default.isRegExp(parser)) {
        return parser.exec(value);
      }
      throw new TypeError("parser must be boolean|regexp|function");
    }
  },
  has: function(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = findKey(this, header);
      return !!(key && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  },
  delete: function(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils_default.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  },
  clear: function() {
    return Object.keys(this).forEach(this.delete.bind(this));
  },
  normalize: function(format) {
    const self2 = this;
    const headers = {};
    utils_default.forEach(this, (value, header) => {
      const key = findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  },
  toJSON: function(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils_default.forEach(Object.assign({}, this[$defaults] || null, this), (value, header) => {
      if (value == null || value === false)
        return;
      obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value;
    });
    return obj;
  }
});
Object.assign(AxiosHeaders, {
  from: function(thing) {
    if (utils_default.isString(thing)) {
      return new this(parseHeaders_default(thing));
    }
    return thing instanceof this ? thing : new this(thing);
  },
  accessor: function(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype3 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype3, _header);
        accessors[lHeader] = true;
      }
    }
    utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
});
AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent"]);
utils_default.freezeMethods(AxiosHeaders.prototype);
utils_default.freezeMethods(AxiosHeaders);
var AxiosHeaders_default = AxiosHeaders;

// node_modules/axios/lib/helpers/speedometer.js
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
var speedometer_default = speedometer;

// node_modules/axios/lib/adapters/xhr.js
function progressEventReducer(listener, isDownloadStream) {
  let bytesNotified = 0;
  const _speedometer = speedometer_default(50, 250);
  return (e) => {
    const loaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;
    bytesNotified = loaded;
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total && inRange ? (total - loaded) / rate : void 0
    };
    data[isDownloadStream ? "download" : "upload"] = true;
    listener(data);
  };
}
function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    let requestData = config.data;
    const requestHeaders = AxiosHeaders_default.from(config.headers).normalize();
    const responseType = config.responseType;
    let onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }
      if (config.signal) {
        config.signal.removeEventListener("abort", onCanceled);
      }
    }
    if (utils_default.isFormData(requestData) && browser_default.isStandardBrowserEnv) {
      requestHeaders.setContentType(false);
    }
    let request = new XMLHttpRequest();
    if (config.auth) {
      const username = config.auth.username || "";
      const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : "";
      requestHeaders.set("Authorization", "Basic " + btoa(username + ":" + password));
    }
    const fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);
    request.timeout = config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders_default.from("getAllResponseHeaders" in request && request.getAllResponseHeaders());
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config, request));
      request = null;
    };
    request.onerror = function handleError() {
      reject(new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, config, request));
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = config.timeout ? "timeout of " + config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = config.transitional || transitional_default;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new AxiosError_default(timeoutErrorMessage, transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED, config, request));
      request = null;
    };
    if (browser_default.isStandardBrowserEnv) {
      const xsrfValue = (config.withCredentials || isURLSameOrigin_default(fullPath)) && config.xsrfCookieName && cookies_default.read(config.xsrfCookieName);
      if (xsrfValue) {
        requestHeaders.set(config.xsrfHeaderName, xsrfValue);
      }
    }
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils_default.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils_default.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = config.responseType;
    }
    if (typeof config.onDownloadProgress === "function") {
      request.addEventListener("progress", progressEventReducer(config.onDownloadProgress, true));
    }
    if (typeof config.onUploadProgress === "function" && request.upload) {
      request.upload.addEventListener("progress", progressEventReducer(config.onUploadProgress));
    }
    if (config.cancelToken || config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError_default(null, config, request) : cancel);
        request.abort();
        request = null;
      };
      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(fullPath);
    if (protocol && browser_default.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError_default("Unsupported protocol " + protocol + ":", AxiosError_default.ERR_BAD_REQUEST, config));
      return;
    }
    request.send(requestData || null);
  });
}

// node_modules/axios/lib/adapters/index.js
var adapters = {
  http: xhrAdapter,
  xhr: xhrAdapter
};
var adapters_default = {
  getAdapter: (nameOrAdapter) => {
    if (utils_default.isString(nameOrAdapter)) {
      const adapter = adapters[nameOrAdapter];
      if (!nameOrAdapter) {
        throw Error(utils_default.hasOwnProp(nameOrAdapter) ? `Adapter '${nameOrAdapter}' is not available in the build` : `Can not resolve adapter '${nameOrAdapter}'`);
      }
      return adapter;
    }
    if (!utils_default.isFunction(nameOrAdapter)) {
      throw new TypeError("adapter is not a function");
    }
    return nameOrAdapter;
  },
  adapters
};

// node_modules/axios/lib/defaults/index.js
var DEFAULT_CONTENT_TYPE = {
  "Content-Type": "application/x-www-form-urlencoded"
};
function getDefaultAdapter() {
  let adapter;
  if (typeof XMLHttpRequest !== "undefined") {
    adapter = adapters_default.getAdapter("xhr");
  } else if (typeof process !== "undefined" && utils_default.kindOf(process) === "process") {
    adapter = adapters_default.getAdapter("http");
  }
  return adapter;
}
function stringifySafely(rawValue, parser, encoder) {
  if (utils_default.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils_default.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
var defaults = {
  transitional: transitional_default,
  adapter: getDefaultAdapter(),
  transformRequest: [function transformRequest(data, headers) {
    const contentType = headers.getContentType() || "";
    const hasJSONContentType = contentType.indexOf("application/json") > -1;
    const isObjectPayload = utils_default.isObject(data);
    if (isObjectPayload && utils_default.isHTMLForm(data)) {
      data = new FormData(data);
    }
    const isFormData2 = utils_default.isFormData(data);
    if (isFormData2) {
      if (!hasJSONContentType) {
        return data;
      }
      return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
    }
    if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data)) {
      return data;
    }
    if (utils_default.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils_default.isURLSearchParams(data)) {
      headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
      return data.toString();
    }
    let isFileList2;
    if (isObjectPayload) {
      if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }
      if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
        const _FormData = this.env && this.env.FormData;
        return toFormData_default(isFileList2 ? { "files[]": data } : data, _FormData && new _FormData(), this.formSerializer);
      }
    }
    if (isObjectPayload || hasJSONContentType) {
      headers.setContentType("application/json", false);
      return stringifySafely(data);
    }
    return data;
  }],
  transformResponse: [function transformResponse(data) {
    const transitional2 = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
    const JSONRequested = this.responseType === "json";
    if (data && utils_default.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
      const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === "SyntaxError") {
            throw AxiosError_default.from(e, AxiosError_default.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }
    return data;
  }],
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: browser_default.classes.FormData,
    Blob: browser_default.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      "Accept": "application/json, text/plain, */*"
    }
  }
};
utils_default.forEach(["delete", "get", "head"], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});
utils_default.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
  defaults.headers[method] = utils_default.merge(DEFAULT_CONTENT_TYPE);
});
var defaults_default = defaults;

// node_modules/axios/lib/core/transformData.js
function transformData(fns, response) {
  const config = this || defaults_default;
  const context = response || config;
  const headers = AxiosHeaders_default.from(context.headers);
  let data = context.data;
  utils_default.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}

// node_modules/axios/lib/cancel/isCancel.js
function isCancel(value) {
  return !!(value && value.__CANCEL__);
}

// node_modules/axios/lib/core/dispatchRequest.js
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError_default();
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders_default.from(config.headers);
  config.data = transformData.call(config, config.transformRequest);
  const adapter = config.adapter || defaults_default.adapter;
  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);
    response.data = transformData.call(config, config.transformResponse, response);
    response.headers = AxiosHeaders_default.from(response.headers);
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);
      if (reason && reason.response) {
        reason.response.data = transformData.call(config, config.transformResponse, reason.response);
        reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
      }
    }
    return Promise.reject(reason);
  });
}

// node_modules/axios/lib/core/mergeConfig.js
function mergeConfig(config1, config2) {
  config2 = config2 || {};
  const config = {};
  function getMergedValue(target, source) {
    if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
      return utils_default.merge(target, source);
    } else if (utils_default.isPlainObject(source)) {
      return utils_default.merge({}, source);
    } else if (utils_default.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(prop) {
    if (!utils_default.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils_default.isUndefined(config1[prop])) {
      return getMergedValue(void 0, config1[prop]);
    }
  }
  function valueFromConfig2(prop) {
    if (!utils_default.isUndefined(config2[prop])) {
      return getMergedValue(void 0, config2[prop]);
    }
  }
  function defaultToConfig2(prop) {
    if (!utils_default.isUndefined(config2[prop])) {
      return getMergedValue(void 0, config2[prop]);
    } else if (!utils_default.isUndefined(config1[prop])) {
      return getMergedValue(void 0, config1[prop]);
    }
  }
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(void 0, config1[prop]);
    }
  }
  const mergeMap = {
    "url": valueFromConfig2,
    "method": valueFromConfig2,
    "data": valueFromConfig2,
    "baseURL": defaultToConfig2,
    "transformRequest": defaultToConfig2,
    "transformResponse": defaultToConfig2,
    "paramsSerializer": defaultToConfig2,
    "timeout": defaultToConfig2,
    "timeoutMessage": defaultToConfig2,
    "withCredentials": defaultToConfig2,
    "adapter": defaultToConfig2,
    "responseType": defaultToConfig2,
    "xsrfCookieName": defaultToConfig2,
    "xsrfHeaderName": defaultToConfig2,
    "onUploadProgress": defaultToConfig2,
    "onDownloadProgress": defaultToConfig2,
    "decompress": defaultToConfig2,
    "maxContentLength": defaultToConfig2,
    "maxBodyLength": defaultToConfig2,
    "beforeRedirect": defaultToConfig2,
    "transport": defaultToConfig2,
    "httpAgent": defaultToConfig2,
    "httpsAgent": defaultToConfig2,
    "cancelToken": defaultToConfig2,
    "socketPath": defaultToConfig2,
    "responseEncoding": defaultToConfig2,
    "validateStatus": mergeDirectKeys
  };
  utils_default.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    const merge2 = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge2(prop);
    utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  return config;
}

// node_modules/axios/lib/env/data.js
var VERSION = "1.1.3";

// node_modules/axios/lib/helpers/validator.js
var validators = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators[type] = function validator(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
var deprecatedWarnings = {};
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError_default(formatMessage(opt, " has been removed" + (version ? " in " + version : "")), AxiosError_default.ERR_DEPRECATED);
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(formatMessage(opt, " has been deprecated since v" + version + " and will be removed in the near future"));
    }
    return validator ? validator(value, opt, opts) : true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === void 0 || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError_default("option " + opt + " must be " + result, AxiosError_default.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
    }
  }
}
var validator_default = {
  assertOptions,
  validators
};

// node_modules/axios/lib/core/Axios.js
var validators2 = validator_default.validators;
var Axios = class {
  constructor(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager_default(),
      response: new InterceptorManager_default()
    };
  }
  request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig(this.defaults, config);
    const { transitional: transitional2, paramsSerializer } = config;
    if (transitional2 !== void 0) {
      validator_default.assertOptions(transitional2, {
        silentJSONParsing: validators2.transitional(validators2.boolean),
        forcedJSONParsing: validators2.transitional(validators2.boolean),
        clarifyTimeoutError: validators2.transitional(validators2.boolean)
      }, false);
    }
    if (paramsSerializer !== void 0) {
      validator_default.assertOptions(paramsSerializer, {
        encode: validators2.function,
        serialize: validators2.function
      }, true);
    }
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    const defaultHeaders = config.headers && utils_default.merge(config.headers.common, config.headers[config.method]);
    defaultHeaders && utils_default.forEach(["delete", "get", "head", "post", "put", "patch", "common"], function cleanHeaderConfig(method) {
      delete config.headers[method];
    });
    config.headers = new AxiosHeaders_default(config.headers, defaultHeaders);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift.apply(chain, requestInterceptorChain);
      chain.push.apply(chain, responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    i = 0;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils_default.forEach(["delete", "get", "head", "options"], function forEachMethodNoData2(method) {
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method,
      url,
      data: (config || {}).data
    }));
  };
});
utils_default.forEach(["post", "put", "patch"], function forEachMethodWithData2(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method,
        headers: isForm ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url,
        data
      }));
    };
  }
  Axios.prototype[method] = generateHTTPMethod();
  Axios.prototype[method + "Form"] = generateHTTPMethod(true);
});
var Axios_default = Axios;

// node_modules/axios/lib/cancel/CancelToken.js
var CancelToken = class {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners)
        return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError_default(message, config, request);
      resolvePromise(token.reason);
    });
  }
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
var CancelToken_default = CancelToken;

// node_modules/axios/lib/helpers/spread.js
function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}

// node_modules/axios/lib/helpers/isAxiosError.js
function isAxiosError(payload) {
  return utils_default.isObject(payload) && payload.isAxiosError === true;
}

// node_modules/axios/lib/axios.js
function createInstance(defaultConfig) {
  const context = new Axios_default(defaultConfig);
  const instance = bind(Axios_default.prototype.request, context);
  utils_default.extend(instance, Axios_default.prototype, context, { allOwnKeys: true });
  utils_default.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  return instance;
}
var axios = createInstance(defaults_default);
axios.Axios = Axios_default;
axios.CanceledError = CanceledError_default;
axios.CancelToken = CancelToken_default;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData_default;
axios.AxiosError = AxiosError_default;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread;
axios.isAxiosError = isAxiosError;
axios.formToJSON = (thing) => {
  return formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
};
var axios_default = axios;

// node_modules/axios/index.js
var axios_default2 = axios_default;

// src/http-connection.js
var HTTPConnection = class {
  constructor(url, messageCallback) {
    this.url = url;
    this.token = null;
    this.messageCallback = messageCallback;
  }
  getCorrelationId(msg) {
    if (typeof msg !== "string") {
      return null;
    }
    var parsedMsg;
    try {
      parsedMsg = msg && JSON.parse(msg);
    } catch (e) {
      return null;
    }
    if (parsedMsg && parsedMsg[0] && parsedMsg[0][constants_default.FIELD.CORRELATION_ID]) {
      return parsedMsg[0][constants_default.FIELD.CORRELATION_ID];
    }
  }
  send(msg) {
    if (this.token === null) {
      throw new Error("HTTP Connection not yet authenticated. Call authenticate() first.");
    }
    axios_default2({
      url: this.url,
      method: "post",
      responseType: "json",
      responseEncoding: "utf8",
      headers: {
        "Authorization": "Bearer " + this.token,
        "Content-Type": "application/json"
      },
      data: msg
    }).then((response) => {
      if (msg.includes(constants_default.ACTION.SET)) {
        const messages = JSON.parse(msg);
        messages.forEach((msg2) => {
          if (msg2[constants_default.FIELD.ACTION] === constants_default.ACTION.SET) {
            response.data.push({
              [constants_default.FIELD.CORRELATION_ID]: msg2[constants_default.FIELD.CORRELATION_ID],
              [constants_default.FIELD.RESULT]: constants_default.RESULT.SUCCESS
            });
          }
        });
      }
      this.messageCallback(response);
    }).catch((response) => {
      const responseMessage = {
        [constants_default.FIELD.RESULT]: constants_default.RESULT.ERROR
      };
      const correlationId = this.getCorrelationId(msg);
      if (correlationId) {
        responseMessage[constants_default.FIELD.CORRELATION_ID] = correlationId;
      }
      if (response.response && response.response.data) {
        if (typeof response.response.data === "object") {
          responseMessage[constants_default.FIELD.ERROR] = response.response.data[constants_default.FIELD.ERROR];
          responseMessage[constants_default.FIELD.ERROR_CODE] = response.response.data[constants_default.FIELD.ERROR_CODE];
        } else {
          responseMessage[constants_default.FIELD.ERROR] = response.response.data;
        }
      } else {
        responseMessage[constants_default.FIELD.ERROR] = response.message || response.body || response.toString();
      }
      this.messageCallback({
        data: [responseMessage]
      });
    });
  }
  close() {
  }
};

// src/hivekit-client.js
var HivekitClient = class extends EventEmitter {
  constructor(options) {
    super();
    this.constants = constants_default;
    this.connectionStatus = constants_default.CONNECTION_STATUS.DISCONNECTED;
    this.ping = null;
    this.version = "1.5.0";
    this.serverVersion = null;
    this.serverBuildDate = null;
    this.mode = null;
    this.options = this._extendOptions(options, {
      outgoingMessageBufferTime: 0,
      logMessages: false,
      logErrors: true,
      adminDashboardBasePath: "/admin/",
      heartbeatInterval: 5e3,
      reconnectInterval: 1e3
    });
    this.system = new SystemHandler(this);
    this.realm = new RealmHandler(this);
    this._subscription = new SubscriptionHandler(this);
    this._heartbeatInterval = setInterval(this._sendHeartbeatMessage.bind(this), this.options.heartbeatInterval);
    this._url = null;
    this._connection = null;
    this._reconnectInterval = null;
    this._onConnectPromise = null;
    this._onAuthenticatePromise = null;
    this._onDisconnectPromise = null;
    this._pendingRequests = {};
    this._pendingMessages = null;
    this._pendingHeartbeats = {};
    this._typeHandler = {
      [constants_default.TYPE.SYSTEM]: this.system,
      [constants_default.TYPE.SUBSCRIPTION]: this._subscription,
      [constants_default.TYPE.REALM]: this.realm
    };
  }
  useHTTP(url) {
    if (this.mode == constants_default.MODE.WS) {
      throw new Error("Can't use HTTP. This client is already connected via Websocket.");
    }
    clearInterval(this._heartbeatInterval);
    this.mode = constants_default.MODE.HTTP;
    this._url = url;
    this._connection = new HTTPConnection(url, this._onMessage.bind(this));
  }
  connect(url) {
    if (this.mode === constants_default.MODE.HTTP) {
      throw new Error("Can't connect via Websocket. This client is already using HTTP");
    }
    if (this.mode !== null) {
      throw new Error("This client is already connected");
    }
    this.mode = constants_default.MODE.WS;
    this._url = url;
    this._changeConnectionStatus(constants_default.CONNECTION_STATUS.CONNECTING);
    this._connection = new this.WsConstructor(url);
    this._connection.onopen = this._onOpen.bind(this);
    this._connection.onclose = this._onClose.bind(this);
    this._connection.onerror = this._onError.bind(this);
    this._connection.onmessage = this._onMessage.bind(this);
    this._onConnectPromise = getPromise();
    return this._onConnectPromise;
  }
  authenticate(token) {
    if (this.mode === constants_default.MODE.HTTP) {
      this._connection.token = token;
      this.connectionStatus = constants_default.CONNECTION_STATUS.AUTHENTICATED;
      return Promise.resolve();
    }
    this.system._sendAuthMessage(token);
    this._onAuthenticatePromise = getPromise();
    return this._onAuthenticatePromise;
  }
  disconnect() {
    this._changeConnectionStatus(constants_default.CONNECTION_STATUS.DISCONNECTING);
    this._connection.close();
    this._onDisconnectPromise = getPromise();
    return this._onDisconnectPromise;
  }
  getId(prefix) {
    return prefix + "-" + nanoid();
  }
  getURL() {
    return this._connection.url;
  }
  _onOpen() {
    this._changeConnectionStatus(constants_default.CONNECTION_STATUS.CONNECTED);
    clearInterval(this._reconnectInterval);
    this._onConnectPromise.resolve();
  }
  _onClose() {
    if (this.connectionStatus === constants_default.CONNECTION_STATUS.DISCONNECTING) {
      clearInterval(this._heartbeatInterval);
      this._changeConnectionStatus(constants_default.CONNECTION_STATUS.DISCONNECTED);
      this._onDisconnectPromise && this._onDisconnectPromise.resolve();
    } else {
      this._onError("Disconnected, attempting to reconnect");
      this.connect(this._url).catch(() => {
        clearInterval(this._reconnectInterval);
        this._reconnectInterval = setInterval(() => {
          this._onError("Disconnected, attempting to reconnect");
          this.connect(this._url);
        }, this.options.reconnectInterval);
      });
    }
  }
  _onError(error) {
    this.emit("error", error);
    if (this.options.logErrors) {
      console.warn(error.message || error);
    }
  }
  _onMessage(msg) {
    var messages;
    try {
      messages = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
    } catch (e) {
      this._onError(`Failed to parse message: ${e} - ${msg.data}`);
    }
    if (Array.isArray(messages)) {
      messages.forEach(this._handleIncomingMessage.bind(this));
    } else {
      this._onError(`message was not in expected form: ${JSON.stringify(messages)}`);
    }
  }
  _sendMessage(msg) {
    if (this._pendingMessages === null) {
      this._pendingMessages = [msg];
      if (this.connectionStatus === constants_default.CONNECTION_STATUS.AUTHENTICATED) {
        this._sendPendingMessageTimeout = setTimeout(this._sendPendingMessages.bind(this), this.options.outgoingMessageBufferTime);
      } else {
        if (this.options.logErrors) {
          console.warn("hivekit connection not authenticated. Outgoing messages will be queued until authentication");
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
        console.log(">", this._pendingMessages[i]);
      }
    }
    this._connection.send(JSON.stringify(this._pendingMessages));
    this._pendingMessages = null;
  }
  _sendHeartbeatMessage() {
    if (this.connectionStatus !== constants_default.CONNECTION_STATUS.AUTHENTICATED) {
      return;
    }
    const id = this.getId("heartbeat");
    this._pendingHeartbeats[id] = Date.now();
    const heartbeatMessage = [{
      [constants_default.FIELD.TYPE]: constants_default.TYPE.SYSTEM,
      [constants_default.FIELD.ACTION]: constants_default.ACTION.HEARTBEAT,
      [constants_default.FIELD.CORRELATION_ID]: id
    }];
    this._connection.send(JSON.stringify(heartbeatMessage));
  }
  _processHeartbeatResponse(msg) {
    if (this._pendingHeartbeats[msg[constants_default.FIELD.CORRELATION_ID]]) {
      this.ping = Date.now() - this._pendingHeartbeats[msg[constants_default.FIELD.CORRELATION_ID]];
      this.emit("ping", this.ping);
    }
    delete this._pendingHeartbeats[msg[constants_default.FIELD.CORRELATION_ID]];
  }
  _handleIncomingMessage(msg) {
    if (this.options.logMessages) {
      console.log("<", msg);
    }
    if (msg[constants_default.FIELD.CORRELATION_ID]) {
      if (this._pendingHeartbeats[msg[constants_default.FIELD.CORRELATION_ID]]) {
        this._processHeartbeatResponse(msg);
      } else if (this._pendingRequests[msg[constants_default.FIELD.CORRELATION_ID]]) {
        this._pendingRequests[msg[constants_default.FIELD.CORRELATION_ID]].responseCallbacks.forEach((callback) => {
          callback(msg);
        });
        delete this._pendingRequests[msg[constants_default.FIELD.CORRELATION_ID]];
      } else {
        this._onError("Received response for unknown request", msg);
      }
    } else if (msg[constants_default.FIELD.RESULT] === constants_default.RESULT.ERROR) {
      this._onError(msg[constants_default.FIELD.ERROR] || msg[constants_default.FIELD.DATA]);
    } else if (!this._typeHandler[msg[constants_default.FIELD.TYPE]]) {
      this._onError("Received message for unknown type " + this._typeHandler[msg[constants_default.FIELD.TYPE]]);
    } else {
      this._typeHandler[msg[constants_default.FIELD.TYPE]]._handleIncomingMessage(msg);
    }
  }
  _changeConnectionStatus(connectionStatus) {
    this.connectionStatus = connectionStatus;
    this.emit("connectionStatusChanged", connectionStatus);
    if (connectionStatus === constants_default.CONNECTION_STATUS.AUTHENTICATED) {
      this._sendPendingMessages();
    }
  }
  _sendRequest(msg, responseCallback) {
    const signature = this._getSignature(msg);
    for (let id in this._pendingRequests) {
      if (this._pendingRequests[id].signature === signature) {
        this._pendingRequests[id].responseCallbacks.push(responseCallback);
        return;
      }
    }
    const requestId = nanoid();
    msg[constants_default.FIELD.CORRELATION_ID] = requestId;
    this._pendingRequests[requestId] = {
      signature,
      responseCallbacks: [responseCallback]
    };
    this._sendMessage(msg);
  }
  _sendRequestAndHandleResponse(msg, successDataTransform) {
    const result = getPromise();
    this._sendRequest(msg, (response) => {
      if (response[constants_default.FIELD.RESULT] === constants_default.RESULT.ERROR) {
        this._onError(response[constants_default.FIELD.ERROR]);
        result.reject({
          message: response[constants_default.FIELD.ERROR],
          code: response[constants_default.FIELD.ERROR_CODE]
        });
      } else {
        result.resolve(successDataTransform ? successDataTransform(response) : response);
      }
    });
    return result;
  }
  _getSignature(...args) {
    let val = JSON.stringify(args), i = 0, hash = 0;
    for (i; i < val.length; i++) {
      hash = (hash << 5) - hash + val.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }
  _extendOptions(options, defaults2, fieldNames) {
    if (!options) {
      return defaults2;
    }
    if (fieldNames) {
      options = this._compressFields(options, fieldNames);
    }
    const combinedOptions = {};
    for (let key in defaults2) {
      if (typeof options[key] !== "undefined") {
        combinedOptions[key] = options[key];
      } else {
        combinedOptions[key] = defaults2[key];
      }
    }
    return combinedOptions;
  }
  _extendFields(data, fields = fieldnames_default.FIELD) {
    const translated = {};
    for (let key in data) {
      if (fields[key]) {
        if (key === constants_default.FIELD.LOCATION) {
          translated[fields[key]] = this._extendFields(data[key], fieldnames_default.LOCATION);
        } else if (key === constants_default.FIELD.PRESENCE_CONNECTION_STATUS) {
          translated[fields[constants_default.FIELD.PRESENCE_CONNECTION_STATUS]] = fieldnames_default.PRESENCE_CONNECTION_STATUS[data[key]];
        } else if (key === constants_default.FIELD.SUB_TYPE && data[constants_default.FIELD.SHAPE]) {
          translated[fields[constants_default.FIELD.SHAPE]] = fieldnames_default.SHAPE_TYPE[data[key]];
        } else if (key === constants_default.FIELD.SHAPE) {
          translated[fields[constants_default.FIELD.SHAPE_DATA]] = data[key];
        } else if (key === constants_default.FIELD.TYPE) {
          translated[fields[constants_default.FIELD.TYPE]] = fieldnames_default.TYPE[data[key]];
        } else if (key === constants_default.FIELD.FIELD) {
          translated[fields[constants_default.FIELD.FIELD]] = fieldnames_default.FIELD[data[key]];
        } else {
          translated[fields[key]] = data[key];
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
        compressedFields[reversedFieldNames[key]] = extendedFields[key];
      } else if (ignoreUnknown) {
        compressedFields[key] = extendedFields[key];
      } else {
        this._onError(`Unknown field ${key}`);
      }
    }
    return compressedFields;
  }
};

// src/index-browser.js
HivekitClient.prototype.WsConstructor = window.WebSocket;
var index_browser_default = HivekitClient;
export {
  index_browser_default as default
};
