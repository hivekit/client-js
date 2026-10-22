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

// src/fields.js
var FIELDS = {
  CONNECTION_STATUS: {
    CONNECTED: { VAL: "connected" },
    DISCONNECTED: { VAL: "disconnected" },
    CONNECTING: { VAL: "connecting" },
    DISCONNECTING: { VAL: "disconnecting" },
    AUTHENTICATED: { VAL: "authenticated" }
  },
  MODE: {
    HTTP: { VAL: "http" },
    WS: { VAL: "ws" }
  },
  TYPE: {
    REALM: { VAL: "rea", FULL: "realm" },
    OBJECT: { VAL: "obj", FULL: "object" },
    AREA: { VAL: "are", FULL: "area" },
    SUBSCRIPTION: { VAL: "sub", FULL: "subscription" },
    SYSTEM: { VAL: "sys", FULL: "system" },
    INSTRUCTION: { VAL: "ins", FULL: "instruction" },
    LOGEVENT: { VAL: "log", FULL: "logEvent" },
    HISTORY: { VAL: "his", FULL: "history" },
    TASK: { VAL: "tsk", FULL: "task" }
  },
  TASK_STATUS: {
    NOT_STARTED: { VAL: "$hkt_not_started" },
    IN_PROGRESS: { VAL: "$hkt_in_progress" },
    COMPLETED: { VAL: "$hkt_completed" },
    FAILED: { VAL: "$hkt_failed" },
    CANCELED: { VAL: "$hkt_canceled" },
    PAUSED: { VAL: "$hkt_paused" },
    BLOCKED: { VAL: "$hkt_blocked" }
  },
  ERROR: {
    CONNECTION_ERROR: { VAL: "connection_error" },
    MAX_RECONNECT_ATTEMPTS_EXCEEDED: { VAL: "max_reconnect_attempts_exceeded" },
    MESSAGE_PARSE_ERROR: { VAL: "message_parse_error" },
    UNKNOWN_REQUEST: { VAL: "unknown_request" },
    UNKNOWN_TYPE: { VAL: "unknown_type" },
    SERVER_ERROR: { VAL: "server_error" },
    UNKNOWN_FIELD: { VAL: "unknown_field" },
    UNKNOWN_ACTION: { VAL: "unknown_action" },
    UNKNOWN_SUBSCRIPTION: { VAL: "unknown_subscription" },
    DISCONNECTED_RETRYING: { VAL: "disconnected_retrying" }
  },
  UPDATE_TYPE: {
    FULL: { VAL: "ful" },
    DELTA: { VAL: "dta" }
  },
  FIELD: {
    TYPE: { VAL: "typ", FULL: "type" },
    SCOPE_TYPE: { VAL: "sty", FULL: "scopeType" },
    SUB_TYPE: { VAL: "sty", FULL: "scopeType" },
    SCOPE_ID: { VAL: "sid", FULL: "scopeId" },
    EXECUTE_IMMEDIATELY: { VAL: "exe", FULL: "executeImmediately" },
    ACTION: { VAL: "act", FULL: "action" },
    RESULT: { VAL: "res", FULL: "result" },
    CORRELATION_ID: { VAL: "cid", FULL: "correlationId" },
    ID: { VAL: "id", FULL: "id" },
    REALM: { VAL: "rea", FULL: "realm" },
    DATA: { VAL: "dat", FULL: "data" },
    STATIC_DATA: { VAL: "sdt", FULL: "staticData" },
    CATEGORY_ID: { VAL: "cat", FULL: "categoryId" },
    LOCATION: { VAL: "loc", FULL: "location" },
    ERROR: { VAL: "err", FULL: "error" },
    LABEL: { VAL: "lab", FULL: "label" },
    ATTRIBUTE: { VAL: "atr", FULL: ["attribute", "where"] },
    UPDATE_TYPE: { VAL: "uty" },
    INSTRUCTION_STRING: { VAL: "ins", FULL: "instructionString" },
    PRESENCE_CONNECTION_STATUS: { VAL: "cst", FULL: "connectionStatus" },
    SHAPE: { VAL: "sha", FULL: "shape" },
    SHAPE_DATA: { VAL: "shapeData", FULL: "shapeData" },
    FIELD: { VAL: "fie", FULL: "field" },
    VALUE: { VAL: "val", FULL: "value" },
    SUBSCRIPTION_TARGET: { VAL: "sta", FULL: "start" },
    START: { VAL: "sta", FULL: "start" },
    END: { VAL: "end", FULL: "end" },
    LEVEL: { VAL: "lvl", FULL: "level" },
    EVENT_NAME: { VAL: "eve" },
    ID_PATTERN: { VAL: "idp" },
    ERROR_CODE: { VAL: "erc" },
    INTERVAL: { VAL: "int", FULL: "interval" },
    TIME: { VAL: "tim", FULL: "time" },
    SCOPE_TYPE_TARGET: { VAL: "tar" },
    RADIUS: { VAL: "r" },
    STATUS: { VAL: "sts", FULL: "status" },
    STEPS: { VAL: "stp", FULL: "steps" },
    DESCRIPTION: { VAL: "dsc", FULL: "description" },
    TARGET_ID: { VAL: "tid", FULL: "targetId" },
    TASK_IDS: { VAL: "tds", FULL: "taskIds" }
  },
  ACTION: {
    CREATE: { VAL: "cre", FULL: "create" },
    READ: { VAL: "rea", FULL: "read" },
    LIST: { VAL: "lis", FULL: "list" },
    UPDATE: { VAL: "upd", FULL: "update" },
    DELETE: { VAL: "del", FULL: "delete" },
    AUTHENTICATE: { VAL: "aut", FULL: "authenticate" },
    SET: { VAL: "set", FULL: "set" },
    SEARCH: { VAL: "sea" },
    HEARTBEAT: { VAL: "hbt" },
    SUBSCRIBE: { VAL: "sub" },
    UNSUBSCRIBE: { VAL: "uns" },
    PUBLISH: { VAL: "pub" },
    GET_STATS: { VAL: "sta" }
  },
  RESULT: {
    SUCCESS: { VAL: "suc", FULL: "success" },
    WARNING: { VAL: "war", FULL: "warning" },
    ERROR: { VAL: "err", FULL: "error" }
  },
  SUBSCRIPTION: {
    REALM: { VAL: "all-realms" }
  },
  LOCATION: {
    GEOGRAPHIC_COORDINATE_SYSTEM: { VAL: "gcs", FULL: "coordinateSystem" },
    LONGITUDE: { VAL: "lon", FULL: "longitude" },
    LATITUDE: { VAL: "lat", FULL: "latitude" },
    ACCURACY: { VAL: "acc", FULL: "accuracy" },
    SPEED: { VAL: "spe", FULL: "speed" },
    HEADING: { VAL: "hea", FULL: "heading" },
    ALTITUDE: { VAL: "alt", FULL: "altitude" },
    ALTITUDE_ACCURACY: { VAL: "alc", FULL: "altitudeAccuracy" },
    TIME: { VAL: "tim", FULL: "time" }
  },
  SHAPE_TYPE: {
    RECTANGLE: { VAL: "rec", FULL: "rectangle" },
    CIRCLE: { VAL: "cir", FULL: "circle" },
    POLYGON: { VAL: "pol", FULL: "polygon" }
  },
  PRESENCE_CONNECTION_STATUS: {
    CONNECTED: { VAL: "con", FULL: "connected" },
    DISCONNECTED: { VAL: "dis", FULL: "disconnected" }
  }
};
var C = function() {
  const C2 = {};
  for (let category in FIELDS) {
    C2[category] = {};
    for (let field in FIELDS[category]) {
      C2[category][field] = FIELDS[category][field].VAL;
    }
  }
  return C2;
}();
var fieldnames = function getFullNames() {
  const F = {};
  for (let category in FIELDS) {
    let entries = {};
    for (let field in FIELDS[category]) {
      if (FIELDS[category][field].FULL) {
        entries[FIELDS[category][field].VAL] = FIELDS[category][field].FULL;
      }
    }
    if (Object.keys(entries).length > 0) {
      F[category] = entries;
    }
  }
  return F;
}();

// src/message.js
function createMessage(type, action, id, realm, data, location) {
  const message = {
    [C.FIELD.TYPE]: type,
    [C.FIELD.ACTION]: action
  };
  if (id)
    message[C.FIELD.ID] = id;
  if (realm)
    message[C.FIELD.REALM] = realm;
  if (data)
    message[C.FIELD.DATA] = data;
  if (location)
    message[C.FIELD.LOCATION] = location;
  return message;
}

// src/system-handler.js
var SystemHandler = class {
  constructor(client) {
    this._client = client;
    this._systemUpdateSubscription = null;
  }
  getHttpRoot() {
    if (this._client.options.httpRoot) {
      return this._client.options.httpRoot;
    }
    const baseUrl = this._client._url || (typeof document == "undefined" ? null : document.location.href);
    if (!baseUrl) {
      return null;
    }
    var url;
    try {
      url = new URL(baseUrl);
    } catch (e) {
      return null;
    }
    const protocol = url.protocol === "wss:" || url.protocol === "https:" ? "https" : "http";
    return protocol + "://" + url.host;
  }
  authenticateAdmin(password) {
    return new Promise(async (resolve, reject) => {
      const httpRoot = this.getHttpRoot();
      if (!httpRoot) {
        reject(new Error("no http url found"));
        return;
      }
      const url = httpRoot + this._client.options.adminDashboardBasePath + "api/authenticate-admin";
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
        reject(new Error(result[0][C.FIELD.ERROR]));
      }
    });
  }
  getServerStats() {
    const msg = createMessage(C.TYPE.SYSTEM, C.ACTION.GET_STATS);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return response[C.FIELD.DATA];
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
    switch (message[C.FIELD.ACTION]) {
      case C.ACTION.AUTHENTICATE:
        if (message[C.FIELD.RESULT] === C.RESULT.SUCCESS) {
          if (message[C.FIELD.DATA]) {
            this._client.serverVersion = message[C.FIELD.DATA].version;
            this._client.serverBuildDate = message[C.FIELD.DATA].buildDate;
          }
          this._client._changeConnectionStatus(C.CONNECTION_STATUS.AUTHENTICATED);
          this._client._onAuthenticatePromise && this._client._onAuthenticatePromise.resolve();
        }
        if (message[C.FIELD.RESULT] === C.RESULT.ERROR) {
          this._client._onAuthenticatePromise && this._client._onAuthenticatePromise.reject(message[C.FIELD.ERROR]);
        }
        break;
      default:
        this._client._onError(`Unknown action for type ${C.TYPE.SYSTEM}: ${message[C.FIELD.ACTION]}`, C.ERROR.UNKNOWN_ACTION);
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

// src/tools.js
var ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
function generateId() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(21));
  let id = "";
  for (const byte of bytes) {
    id += ID_ALPHABET[byte & 63];
  }
  return id;
}
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
  "x1x2y1y2": C.SHAPE_TYPE.RECTANGLE,
  "cxcyr": C.SHAPE_TYPE.CIRCLE,
  "points": C.SHAPE_TYPE.POLYGON
};
function toShape(shapeData) {
  var shapeSignature = Object.keys(shapeData).sort().join("");
  if (shapeSignature === "eastnorthsouthwest") {
    shapeData = {
      x1: shapeData.west,
      y1: shapeData.south,
      x2: shapeData.east,
      y2: shapeData.north
    };
    shapeSignature = "x1x2y1y2";
  }
  if (!SHAPE_SIGNATURES[shapeSignature]) {
    return {
      err: "unknown shape data"
    };
  }
  return {
    type: SHAPE_SIGNATURES[shapeSignature],
    data: shapeData,
    err: null
  };
}
function isValidDate(value) {
  return value instanceof Date && value.toString() != "Invalid Date";
}
var locationFields = {};
for (fieldname in fieldnames.LOCATION) {
  locationFields[fieldnames.LOCATION[fieldname]] = fieldname;
}
var fieldname;
function parseLocation(location) {
  const parsedLocation = {};
  for (var key in location) {
    if (key.length === 0) {
      continue;
    }
    if (typeof location[key] !== "string") {
      parsedLocation[locationFields[key]] = location[key];
      continue;
    }
    if (location[key].length > 0) {
      if (key === fieldnames.LOCATION[C.LOCATION.TIME]) {
        try {
          parsedLocation[key] = new Date(location[key]).toISOString();
        } catch (e) {
          throw new Error(`Can't convert ${location[key]} into a valid date:${e}`);
        }
      } else {
        parsedLocation[locationFields[key]] = parseFloat(location[key]);
      }
    }
  }
  return parsedLocation;
}

// src/object-handler.js
var ObjectHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
  }
  subscribe(options) {
    options = options || {};
    if (options.shape) {
      const shape = toShape(options.shape);
      if (shape.err) {
        return Promise.reject(shape.err);
      }
      options.scopeType = shape.type;
      options.shape = shape.data;
    }
    if (options.target) {
      options[C.FIELD.SUBSCRIPTION_TARGET] = options.target;
      options[C.FIELD.SCOPE_TYPE] = C.FIELD.SCOPE_TYPE_TARGET;
      delete options.target;
    }
    return this._client._subscription._getSubscription(this._client.getId("object-subscription"), this._realm.id, extendMap({
      [C.FIELD.TYPE]: C.TYPE.OBJECT,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    }, this._client._compressFields(options, fieldnames.FIELD, true)));
  }
  get(id) {
    if (!id) {
      throw new Error("no id provided for object.get");
    }
    const msg = createMessage(C.TYPE.OBJECT, C.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      const obj = this._client._extendFields(response[C.FIELD.DATA]);
      obj.data = obj.data || {};
      obj.taskIds = obj.taskIds || [];
      return obj;
    });
  }
  create(id, options) {
    return this._setObjectState(id, options, C.ACTION.CREATE);
  }
  update(id, options) {
    return this._setObjectState(id, options, C.ACTION.UPDATE);
  }
  set(id, options) {
    return this._setObjectState(id, options, C.ACTION.SET);
  }
  list(options) {
    const msg = createMessage(C.TYPE.OBJECT, C.ACTION.LIST, null, this._realm.id);
    if (options && Object.keys(options).length > 0) {
      msg[C.FIELD.DATA] = this._client._compressFields(options, fieldnames.FIELD);
    }
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result[C.FIELD.DATA]);
    });
  }
  delete(id) {
    const msg = createMessage(C.TYPE.OBJECT, C.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _setObjectState(id, options, action) {
    const { label, location, data, staticData, categoryId, taskIds } = options;
    const msg = createMessage(C.TYPE.OBJECT, action, id, this._realm.id);
    if (label)
      msg[C.FIELD.LABEL] = label;
    if (location && Object.keys(location).length > 0) {
      msg[C.FIELD.LOCATION] = parseLocation(location);
    }
    if (data && Object.keys(data).length > 0)
      msg[C.FIELD.DATA] = data;
    if (staticData)
      msg[C.FIELD.STATIC_DATA] = staticData;
    if (categoryId !== void 0)
      msg[C.FIELD.CATEGORY_ID] = categoryId;
    if (Array.isArray(taskIds))
      msg[C.FIELD.TASK_IDS] = taskIds;
    if (action === C.ACTION.SET && this._client.mode !== C.MODE.HTTP) {
      this._client._sendMessage(msg);
    } else {
      return this._client._sendRequestAndHandleResponse(msg);
    }
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
      [C.FIELD.TYPE]: C.TYPE.AREA,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    }, this._client._compressFields(options, fieldnames.FIELD)));
  }
  get(id) {
    const msg = createMessage(C.TYPE.AREA, C.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return this._client._extendFields(response[C.FIELD.DATA]);
    });
  }
  create(id, options) {
    return this._setAreaState(id, options, C.ACTION.CREATE);
  }
  update(id, options) {
    return this._setAreaState(id, options, C.ACTION.UPDATE);
  }
  list() {
    const msg = createMessage(C.TYPE.AREA, C.ACTION.LIST, null, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      const areas = this._client._extendFieldsMap(result[C.FIELD.DATA]);
      for (var id in areas) {
        areas[id].shape = fieldnames.SHAPE_TYPE[areas[id].scopeType];
        delete areas[id].scopeType;
      }
      return areas;
    });
  }
  delete(id) {
    const msg = createMessage(C.TYPE.AREA, C.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _setAreaState(id, options, action) {
    const { label, data, staticData } = options;
    const shapeData = options.shapeData || options.shape;
    const msg = createMessage(C.TYPE.AREA, action, id, this._realm.id);
    if (shapeData) {
      const shape = toShape(shapeData);
      if (shape.err) {
        return Promise.reject(shape.err);
      }
      msg[C.FIELD.SUB_TYPE] = shape.type;
      msg[C.FIELD.SHAPE] = shape.data;
    }
    if (label)
      msg[C.FIELD.LABEL] = label;
    if (data)
      msg[C.FIELD.DATA] = data;
    if (staticData)
      msg[C.FIELD.STATIC_DATA] = staticData;
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
      [C.FIELD.TYPE]: C.TYPE.INSTRUCTION,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    }, this._client._compressFields(options, fieldnames.FIELD)));
  }
  subscribeToLogs(options) {
    return this._client._subscription._getSubscription(this._client.getId("instruction-log-subscription"), this._realm.id, extendMap({
      [C.FIELD.TYPE]: C.TYPE.LOGEVENT,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    }, this._client._compressFields(options, fieldnames.FIELD)));
  }
  get(id) {
    const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return this._client._extendFields(response[C.FIELD.DATA]);
    });
  }
  create(id, options) {
    return this._setInstructionState(id, options.label, options.instructionString, options.data, C.ACTION.CREATE);
  }
  update(id, options) {
    return this._setInstructionState(id, options.label, options.instructionString, options.data, C.ACTION.UPDATE);
  }
  list() {
    const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.LIST, null, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result[C.FIELD.DATA]);
    });
  }
  delete(id) {
    const msg = createMessage(C.TYPE.INSTRUCTION, C.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _setInstructionState(id, label, instructionString, data, action) {
    const msg = createMessage(C.TYPE.INSTRUCTION, action, id, this._realm.id);
    msg[C.FIELD.INSTRUCTION_STRING] = instructionString;
    if (label)
      msg[C.FIELD.LABEL] = label;
    if (data)
      msg[C.FIELD.DATA] = data;
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
    let idPattern = "*";
    if (arguments.length === 2) {
      callback = idPatternOrCallback;
    } else {
      idPattern = idPatternOrCallback;
    }
    const enip = `${eventName}:${idPattern}`;
    let exists = this._subscriptionCallbacks[enip];
    this._subscriptionCallbacks[enip] = this._subscriptionCallbacks[enip] || [];
    this._subscriptionCallbacks[enip].push(callback);
    if (!exists) {
      const msg = this._getPubSubMessage(C.ACTION.SUBSCRIBE, eventName, idPattern);
      this._client._repeatOnReconnect("pubsub", this._realm.id, eventName + idPattern, msg);
      return this._client._sendRequestAndHandleResponse(msg);
    }
    return Promise.resolve({});
  }
  unsubscribe(eventName, idPatternOrCallback, callbackFn) {
    let idPattern = "*";
    let callback = null;
    if (typeof idPatternOrCallback === "function") {
      callback = idPatternOrCallback;
    } else if (idPatternOrCallback) {
      idPattern = idPatternOrCallback;
    }
    const enip = `${eventName}:${idPattern}`;
    let exists = this._subscriptionCallbacks[enip];
    if (exists) {
      if (callback) {
        const subs = this._subscriptionCallbacks[enip];
        const index = subs.indexOf(callback);
        if (index > -1) {
          subs.splice(index, 1);
        }
      } else {
        this._subscriptionCallbacks[enip].length = 0;
      }
      if (this._subscriptionCallbacks[enip].length === 0) {
        delete this._subscriptionCallbacks[enip];
        this._client._removeFromRepeatOnReconnect("pubsub", this._realm.id, eventName + idPattern);
        return this._client._sendRequestAndHandleResponse(this._getPubSubMessage(C.ACTION.UNSUBSCRIBE, eventName, idPattern));
      }
    }
    return Promise.reject({
      message: "no subscription with that id pattern",
      code: 400
    });
  }
  publish(eventName, idPatternOrData, data) {
    var idPattern;
    if (arguments.length === 2) {
      idPattern = "*";
      data = idPatternOrData;
    } else {
      idPattern = idPatternOrData;
    }
    const msg = this._getPubSubMessage(C.ACTION.PUBLISH, eventName, idPattern);
    msg[C.FIELD.DATA][C.FIELD.DATA] = data;
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _emitSubscriptionEvent(eventName, data, idPattern) {
    const enip = `${eventName}:${idPattern}`;
    const subs = this._subscriptionCallbacks[enip];
    if (subs) {
      if (["connectionStatusChanged"].includes(eventName)) {
        data = this._client._extendFields(data);
      }
      for (let i = 0; i < subs.length; i++) {
        subs[i](data);
      }
    }
  }
  _getPubSubMessage(action, eventName, idPattern) {
    const msg = createMessage(C.TYPE.REALM, action, this._realm.id);
    msg[C.FIELD.DATA] = {
      [C.FIELD.EVENT_NAME]: eventName,
      [C.FIELD.ID_PATTERN]: idPattern || "*"
    };
    return msg;
  }
};

// src/history-handler.js
var HistoryHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
  }
  get(id, options) {
    const msg = createMessage(C.TYPE.HISTORY, C.ACTION.READ, id, this._realm.id);
    if (!isValidDate(options.startTime)) {
      throw new Error("startTime is not a valid Date object");
    }
    if (!isValidDate(options.endTime)) {
      throw new Error("endTime is not a valid Date object");
    }
    msg[C.FIELD.DATA] = {
      [C.FIELD.START]: options.startTime.toISOString(),
      [C.FIELD.END]: options.endTime.toISOString()
    };
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return response[C.FIELD.DATA].map((entry) => {
        return this._client._extendFields(entry);
      });
    });
  }
};

// src/task-handler.js
var TaskHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
  }
  subscribe(options) {
    return this._client._subscription._getSubscription(this._client.getId("task-subscription"), this._realm.id, extendMap({
      [C.FIELD.TYPE]: C.TYPE.TASK,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    }, this._client._compressFields(options, fieldnames.FIELD)));
  }
  get(id) {
    const msg = createMessage(C.TYPE.TASK, C.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      const extended = this._client._extendFields(response[C.FIELD.DATA]);
      if (extended.steps) {
        extended.steps = extended.steps.map((step) => this._client._extendFields(step));
      }
      return extended;
    });
  }
  create(id, options) {
    const hasLocation = options.location && Object.keys(options.location).length > 0;
    if (hasLocation && options.targetId) {
      throw new Error("Cannot set both location and targetId");
    }
    if (!hasLocation && !options.targetId) {
      throw new Error("Task needs either a targetId or location");
    }
    return this._setTaskState(id, options, C.ACTION.CREATE);
  }
  update(id, options) {
    return this._setTaskState(id, options, C.ACTION.UPDATE);
  }
  list() {
    const msg = createMessage(C.TYPE.TASK, C.ACTION.LIST, null, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result[C.FIELD.DATA]);
    });
  }
  delete(id) {
    const msg = createMessage(C.TYPE.TASK, C.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _setTaskState(id, options, action) {
    const msg = createMessage(C.TYPE.TASK, action, id, this._realm.id);
    if (options.label)
      msg[C.FIELD.LABEL] = options.label;
    if (options.data)
      msg[C.FIELD.DATA] = options.data;
    if (options.status) {
      if (!Object.values(C.TASK_STATUS).includes(options.status)) {
        throw new Error(`Invalid task status: ${options.status}`);
      }
      msg[C.FIELD.STATUS] = options.status;
    }
    if (options.location) {
      msg[C.FIELD.LOCATION] = parseLocation(options.location);
    }
    if (options.steps) {
      msg[C.FIELD.STEPS] = options.steps.map((step) => {
        return this._client._compressFields(step, fieldnames.FIELD);
      });
    }
    if (options.targetId) {
      msg[C.FIELD.TARGET_ID] = options.targetId;
    }
    if (options.description) {
      msg[C.FIELD.DESCRIPTION] = options.description;
    }
    return this._client._sendRequestAndHandleResponse(msg);
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
    this.history = new HistoryHandler(client, this);
    this.task = new TaskHandler(client, this);
    if (client.mode !== C.MODE.HTTP) {
      client._subscription._getSubscription(client.getId(`realm-data-${id}`), id, {
        [C.FIELD.TYPE]: C.TYPE.REALM,
        [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
      }).then((subscription) => {
        this._dataSub = subscription;
        subscription.on("update", ({ data: data2, label: label2 }) => {
          this._data = data2;
          this.label = label2;
          this.emit("update");
        });
      });
    }
  }
  getData(key) {
    if (this._client.mode === C.MODE.HTTP) {
      const msg = createMessage(C.TYPE.REALM, C.ACTION.READ, this.id);
      return this._client._sendRequestAndHandleResponse(msg, (response) => {
        const data = response[C.FIELD.DATA][C.FIELD.DATA] || {};
        if (!key) {
          return data;
        } else {
          return data[key];
        }
      });
    }
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
    const msg = createMessage(C.TYPE.REALM, C.ACTION.UPDATE, this.id);
    this._data[key] = value;
    msg[C.FIELD.DATA] = deepClone(this._data);
    if (value === null) {
      delete this._data[key];
    }
    this.emit("update");
    return this._client._sendRequestAndHandleResponse(msg);
  }
  setLabel(label) {
    const msg = createMessage(C.TYPE.REALM, C.ACTION.UPDATE, this.id);
    this.label = label;
    msg[C.FIELD.LABEL] = label;
    this.emit("update");
    return this._client._sendRequestAndHandleResponse(msg);
  }
  search(searchString, options) {
    const data = this._client._compressFields(options, fieldnames.FIELD, true);
    data.val = searchString;
    const msg = createMessage(C.TYPE.REALM, C.ACTION.SEARCH, null, this.id, data);
    return this._client._sendRequestAndHandleResponse(msg, (results) => {
      if (!results[C.FIELD.DATA]) {
        return [];
      }
      return results[C.FIELD.DATA].map((result) => {
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
    this._useCache = client.mode !== C.MODE.HTTP;
  }
  subscribe() {
    return this._client._subscription._getSubscription(this._client.getId("realm-subscription-"), C.TYPE.SYSTEM, {
      [C.FIELD.TYPE]: C.TYPE.SYSTEM,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    });
  }
  get(id) {
    if (this._useCache && this._realms[id]) {
      return Promise.resolve(this._realms[id]);
    }
    const msg = createMessage(C.TYPE.REALM, C.ACTION.READ, id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      const realm = new Realm(id, response[C.FIELD.DATA][C.FIELD.LABEL], response[C.FIELD.DATA][C.FIELD.DATA] || {}, this._client);
      if (this._useCache) {
        this._realms[id] = realm;
      }
      return realm;
    });
  }
  create(id, label, data) {
    const msg = createMessage(C.TYPE.REALM, C.ACTION.CREATE, id);
    if (label)
      msg[C.FIELD.LABEL] = label;
    if (data && Object.keys(data).length > 0)
      msg[C.FIELD.DATA] = data;
    return this._client._sendRequestAndHandleResponse(msg);
  }
  list() {
    const msg = createMessage(C.TYPE.REALM, C.ACTION.LIST);
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result.dat);
    });
  }
  delete(id) {
    const msg = createMessage(C.TYPE.REALM, C.ACTION.DELETE, id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _handleIncomingMessage(msg) {
    if (msg[C.FIELD.ACTION] === C.ACTION.PUBLISH && this._realms[msg[C.FIELD.REALM]]) {
      this._realms[msg[C.FIELD.REALM]].pubsub._emitSubscriptionEvent(msg[C.FIELD.DATA][C.FIELD.EVENT_NAME], msg[C.FIELD.DATA][C.FIELD.DATA], msg[C.FIELD.SCOPE_ID]);
    }
  }
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
      const shape = toShape(options.shape);
      if (shape.err) {
        return Promise.reject(shape.err);
      }
      options.scopeType = shape.type;
      options.shape = shape.data;
    }
    const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.UPDATE, this.id, this.realmId, extendMap({
      [C.FIELD.TYPE]: C.TYPE.OBJECT,
      [C.FIELD.SCOPE_TYPE]: C.TYPE.REALM
    }, this._client._compressFields(options, fieldnames.FIELD)));
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _processIncomingMessage(msg) {
    if (this._data === null) {
      this._data = {};
    }
    if (msg[C.TYPE.OBJECT] || msg[C.TYPE.TASK]) {
      const update = msg[C.TYPE.OBJECT] || msg[C.TYPE.TASK];
      const delta = {
        added: this._client._extendFieldsMap(update[C.ACTION.CREATE]),
        updated: this._client._extendFieldsMap(update[C.ACTION.UPDATE]),
        removed: update[C.ACTION.DELETE]
      };
      if (msg[C.FIELD.UPDATE_TYPE] === C.UPDATE_TYPE.FULL) {
        this._data = {};
      }
      for (let id2 in delta.added) {
        this._data[id2] = delta.added[id2];
      }
      for (let id2 in delta.updated) {
        this._data[id2] = delta.updated[id2];
      }
      for (let id2 in delta.removed) {
        delete this._data[id2];
      }
      this.emit("update", this._data, delta, msg[C.FIELD.UPDATE_TYPE] === C.UPDATE_TYPE.FULL ? "full" : "delta");
      return;
    }
    var data = {};
    if (msg[C.TYPE.AREA]) {
      data = this._client._extendFieldsMap(msg[C.TYPE.AREA]);
    } else if (msg[C.TYPE.INSTRUCTION]) {
      data = this._client._extendFieldsMap(msg[C.TYPE.INSTRUCTION]);
    } else if (msg[C.TYPE.LOGEVENT]) {
      data = this._client._extendFieldsArray(msg[C.TYPE.LOGEVENT]);
    } else if (msg[C.TYPE.REALM]) {
      data = this._client._extendFields(msg[C.TYPE.REALM]);
    } else if (msg[C.FIELD.DATA] && msg[C.FIELD.DATA][C.FIELD.TYPE] === C.TYPE.REALM) {
      data = {
        realmId: msg[C.FIELD.DATA][C.FIELD.ID],
        action: fieldnames.ACTION[msg[C.FIELD.DATA][C.FIELD.ACTION]]
      };
    }
    switch (msg[C.FIELD.UPDATE_TYPE]) {
      case C.UPDATE_TYPE.FULL:
        this._data = data;
        break;
      case C.UPDATE_TYPE.DELTA:
        for (var id in data) {
          this._data[id] = data[id];
        }
        break;
      default:
        this._client._onError("Received subscription message with unknown update type " + msg[C.FIELD.UPDATE_TYPE], C.ERROR.UNKNOWN_TYPE);
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
      if (options[C.FIELD.EXECUTE_IMMEDIATELY]) {
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
    const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.CREATE, id, realmId, options);
    this._client._repeatOnReconnect(C.TYPE.SUBSCRIPTION, realmId, id, msg);
    this._client._sendRequest(msg, (res) => {
      if (res[C.FIELD.RESULT] === C.RESULT.SUCCESS) {
        this._pendingSubscriptionPromises[signature].forEach((entry) => {
          entry.resultPromise.resolve(entry.subscription);
        });
      } else {
        this._pendingSubscriptionPromises[signature].forEach((promise) => {
          promise.resultPromise.reject(res[C.FIELD.ERROR]);
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
    const msg = createMessage(C.TYPE.SUBSCRIPTION, C.ACTION.DELETE, subscription.id, subscription.realmId);
    this._client._removeFromRepeatOnReconnect(C.TYPE.SUBSCRIPTION, subscription.realmId, subscription.id);
    delete this._subscriptionCollections[subscription.id];
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _handleIncomingMessage(msg) {
    const id = msg[C.FIELD.ID];
    if (!this._subscriptionCollections[id]) {
      this._client._onError("Received message for unknown subscription " + msg, C.ERROR.UNKNOWN_SUBSCRIPTION);
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
        break;
      }
    }
    if (data) {
      setTimeout(() => {
        subscription._data = deepClone(data);
        subscription.emit("update", subscription._data);
      }, 1);
    }
  }
};

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
    if (parsedMsg && parsedMsg[0] && parsedMsg[0][C.FIELD.CORRELATION_ID]) {
      return parsedMsg[0][C.FIELD.CORRELATION_ID];
    }
  }
  send(msg) {
    if (this.token === null) {
      throw new Error("HTTP Connection not yet authenticated. Call authenticate() first.");
    }
    fetch(this.url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + this.token,
        "Content-Type": "application/json"
      },
      body: msg
    }).then(async (response) => {
      let data = await response.text();
      try {
        data = JSON.parse(data);
      } catch (e) {
      }
      if (!response.ok) {
        const error = new Error("Request failed with status code " + response.status);
        error.response = { data };
        throw error;
      }
      return { data };
    }).then((response) => {
      if (msg.includes(C.ACTION.SET)) {
        const messages = JSON.parse(msg);
        messages.forEach((msg2) => {
          if (msg2[C.FIELD.ACTION] === C.ACTION.SET) {
            response.data.push({
              [C.FIELD.CORRELATION_ID]: msg2[C.FIELD.CORRELATION_ID],
              [C.FIELD.RESULT]: C.RESULT.SUCCESS
            });
          }
        });
      }
      this.messageCallback(response);
    }).catch((response) => {
      const responseMessage = {
        [C.FIELD.RESULT]: C.RESULT.ERROR
      };
      const correlationId = this.getCorrelationId(msg);
      if (correlationId) {
        responseMessage[C.FIELD.CORRELATION_ID] = correlationId;
      }
      if (response.response && response.response.data) {
        if (typeof response.response.data === "object") {
          responseMessage[C.FIELD.ERROR] = response.response.data[C.FIELD.ERROR];
          responseMessage[C.FIELD.ERROR_CODE] = response.response.data[C.FIELD.ERROR_CODE];
        } else {
          responseMessage[C.FIELD.ERROR] = response.response.data;
        }
      } else {
        responseMessage[C.FIELD.ERROR] = response.message || response.body || response.toString();
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
    this.constants = C;
    this.connectionStatus = C.CONNECTION_STATUS.DISCONNECTED;
    this.ping = null;
    this.version = "1.12.0";
    this.serverVersion = null;
    this.serverBuildDate = null;
    this.mode = null;
    this.token = null;
    this.options = this._extendOptions(options, {
      outgoingMessageBufferTime: 0,
      logMessages: false,
      logErrors: true,
      adminDashboardBasePath: "/admin/",
      heartbeatInterval: 6e4,
      reconnectInterval: 1e3,
      maxReconnectAttempts: Infinity,
      httpRoot: null
    });
    this.system = new SystemHandler(this);
    this.realm = new RealmHandler(this);
    this._subscription = new SubscriptionHandler(this);
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
      throw new Error("Can't use HTTP. This client is already connected via Websocket.");
    }
    clearInterval(this._heartbeatInterval);
    this.mode = C.MODE.HTTP;
    this._url = url;
    this._connection = new HTTPConnection(url, this._onMessage.bind(this));
  }
  connect(url) {
    if (this.mode === C.MODE.HTTP) {
      throw new Error("Can't connect via Websocket. This client is already using HTTP");
    }
    if (this.mode === C.MODE.WS && this._connection.readyState === this.WsConstructor.OPEN) {
      throw new Error("This client is already connected");
    }
    this.mode = C.MODE.WS;
    this._url = url;
    this._changeConnectionStatus(C.CONNECTION_STATUS.CONNECTING);
    this._connection = new this.WsConstructor(url);
    this._connection.onopen = this._onOpen.bind(this);
    this._connection.onclose = this._onClose.bind(this);
    this._connection.onerror = (err) => {
      this._onError(err.message, C.ERROR.CONNECTION_ERROR);
    };
    this._connection.onmessage = this._onMessage.bind(this);
    if (!this._onConnectPromise) {
      this._onConnectPromise = getPromise();
    }
    return this._onConnectPromise;
  }
  authenticate(token) {
    if (!this._connection) {
      return Promise.reject("can't authenticate: client not connected. Did you call .connect() before calling .authenticate()?");
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
  disconnect() {
    if (!this._connection) {
      return Promise.reject("client not connected");
    }
    this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTING);
    this._connection.close();
    this._onDisconnectPromise = getPromise();
    return this._onDisconnectPromise;
  }
  getId(prefix) {
    return prefix + "-" + generateId();
  }
  getURL() {
    return this._connection.url;
  }
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
    clearInterval(this._heartbeatInterval);
    this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTED);
    this._onDisconnectPromise && this._onDisconnectPromise.resolve();
  }
  _onClose() {
    if (this.connectionStatus === C.CONNECTION_STATUS.DISCONNECTING) {
      this._onDisconnect();
    } else {
      this._reconnectAttempts++;
      if (this._reconnectAttempts > this.options.maxReconnectAttempts) {
        const errorMsg2 = "exceeded max reconnect attempts. giving up :-(";
        this._onError(errorMsg2, C.ERROR.MAX_RECONNECT_ATTEMPTS_EXCEEDED);
        clearTimeout(this._reconnectTimeout);
        this._onConnectPromise.reject(errorMsg2);
        this._connection.close();
        this._onDisconnect();
        return;
      }
      const errorMsg = `Disconnected, attempting to reconnect. (Attempt ${this._reconnectAttempts} of ${this.options.maxReconnectAttempts})`;
      this._onError(errorMsg, C.ERROR.DISCONNECTED_RETRYING);
      clearTimeout(this._reconnectTimeout);
      this._changeConnectionStatus(C.CONNECTION_STATUS.DISCONNECTED);
      this._reconnectTimeout = setTimeout(async () => {
        await this.connect(this._url);
        if (this.token) {
          await this.authenticate(this.token);
        }
        this._sendRepeatOnReconnectMessages();
      }, this.options.reconnectInterval);
    }
  }
  _onError(errorMsg, errorType, details) {
    this.emit("error", errorMsg, errorType, details);
    if (this.options.logErrors) {
      console.warn(errorMsg, details || "");
    }
  }
  _onMessage(msg) {
    var messages;
    try {
      messages = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
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
    if (this.connectionStatus !== C.CONNECTION_STATUS.AUTHENTICATED) {
      return;
    }
    const id = this.getId("heartbeat");
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
      this.emit("ping", this.ping);
    }
    delete this._pendingHeartbeats[msg[C.FIELD.CORRELATION_ID]];
  }
  _handleIncomingMessage(msg) {
    if (this.options.logMessages) {
      console.log("<", msg);
    }
    if (msg[C.FIELD.CORRELATION_ID]) {
      if (this._pendingHeartbeats[msg[C.FIELD.CORRELATION_ID]]) {
        this._processHeartbeatResponse(msg);
      } else if (this._pendingRequests[msg[C.FIELD.CORRELATION_ID]]) {
        this._pendingRequests[msg[C.FIELD.CORRELATION_ID]].responseCallbacks.forEach((callback) => {
          callback(msg);
        });
        delete this._pendingRequests[msg[C.FIELD.CORRELATION_ID]];
      } else {
        this._onError("Received response for unknown request", C.ERROR.UNKNOWN_REQUEST, msg);
      }
    } else if (msg[C.FIELD.RESULT] === C.RESULT.ERROR && msg[C.FIELD.TYPE] !== C.TYPE.SYSTEM) {
      this._onError(msg[C.FIELD.ERROR] || msg[C.FIELD.DATA], C.ERROR.SERVER_ERROR);
    } else if (!this._typeHandler[msg[C.FIELD.TYPE]]) {
      this._onError("Received message for unknown type " + this._typeHandler[msg[C.FIELD.TYPE]], C.ERROR.UNKNOWN_TYPE);
    } else {
      this._typeHandler[msg[C.FIELD.TYPE]]._handleIncomingMessage(msg);
    }
  }
  _changeConnectionStatus(connectionStatus) {
    this.connectionStatus = connectionStatus;
    this.emit("connectionStatusChanged", connectionStatus);
    if (connectionStatus === C.CONNECTION_STATUS.AUTHENTICATED) {
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
    const requestId = generateId();
    msg[C.FIELD.CORRELATION_ID] = requestId;
    this._pendingRequests[requestId] = {
      signature,
      responseCallbacks: [responseCallback]
    };
    this._sendMessage(msg);
  }
  _sendRequestAndHandleResponse(msg, successDataTransform) {
    const result = getPromise();
    this._sendRequest(msg, (response) => {
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
    let val = JSON.stringify(args), i = 0, hash = 0;
    for (i; i < val.length; i++) {
      hash = (hash << 5) - hash + val.charCodeAt(i);
      hash = hash & hash;
    }
    return hash;
  }
  _extendOptions(options, defaults, fieldNames) {
    if (!options) {
      return defaults;
    }
    if (fieldNames) {
      options = this._compressFields(options, fieldNames);
    }
    const combinedOptions = {};
    for (let key in defaults) {
      if (typeof options[key] !== "undefined") {
        combinedOptions[key] = options[key];
      } else {
        combinedOptions[key] = defaults[key];
      }
    }
    return combinedOptions;
  }
  _extendFields(data, fields = fieldnames.FIELD) {
    const translated = {};
    for (let key in data) {
      if (fields[key]) {
        if (key === C.FIELD.LOCATION) {
          translated[fields[key]] = this._extendFields(data[key], fieldnames.LOCATION);
        } else if (key === C.FIELD.STEPS) {
          translated[fields[key]] = this._extendFieldsArray(data[key], fieldnames.FIELD);
        } else if (key === C.FIELD.PRESENCE_CONNECTION_STATUS) {
          translated[fields[C.FIELD.PRESENCE_CONNECTION_STATUS]] = fieldnames.PRESENCE_CONNECTION_STATUS[data[key]];
        } else if (key === C.FIELD.SUB_TYPE && data[C.FIELD.SHAPE]) {
          translated[fields[C.FIELD.SHAPE]] = fieldnames.SHAPE_TYPE[data[key]];
        } else if (key === C.FIELD.SHAPE) {
          translated[fields[C.FIELD.SHAPE_DATA]] = data[key];
        } else if (key === C.FIELD.TYPE) {
          translated[fields[C.FIELD.TYPE]] = fieldnames.TYPE[data[key]];
        } else if (key === C.FIELD.FIELD) {
          translated[fields[C.FIELD.FIELD]] = fieldnames.FIELD[data[key]];
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
  _compressFields(extendedFields, fieldnames2, ignoreUnknown) {
    const reversedFieldNames = reverseMap(fieldnames2);
    const compressedFields = {};
    for (let key in extendedFields) {
      if (reversedFieldNames[key]) {
        compressedFields[reversedFieldNames[key]] = extendedFields[key];
      } else if (ignoreUnknown) {
        compressedFields[key] = extendedFields[key];
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
      this._sendRequest(this._repeatOnReconnectMessages[key], () => {
      });
    }
  }
};

// src/index-browser.js
HivekitClient.prototype.WsConstructor = window.WebSocket;
var index_browser_default = HivekitClient;
export {
  index_browser_default as default
};
