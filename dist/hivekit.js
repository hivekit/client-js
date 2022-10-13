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
  TYPE: {
    REALM: "rea",
    OBJECT: "obj",
    AREA: "are",
    TASK: "tsk",
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
    DESCRIPTION: "dsc",
    OBJECT_IDS: "obs",
    STATUS: "sts",
    PRIORITY: "pri",
    INSTRUCTION_STRING: "ins",
    SHAPE: "sha",
    SHAPE_DATA: "shapeData",
    FIELD: "fie",
    VALUE: "val",
    START: "sta",
    END: "end",
    LEVEL: "lvl"
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
    HEARTBEAT: "hbt"
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
  }
};

// src/system-handler.js
var SystemHandler = class {
  constructor(client) {
    this._client = client;
    this._systemUpdateSubscription = null;
  }
  getHttpUrl() {
    return document.location.protocol + "//" + new URL(this._client._wsConnection.url).host;
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
    if (this._client._wsConnection.readyState === this._client._wsConnection.constructor.OPEN) {
      this._client._wsConnection.send("Bearer " + token);
    } else {
      this._client._wsConnection.addEventListener("open", () => {
        this._client._wsConnection.send("Bearer " + token);
      });
    }
  }
  _handleIncomingMessage(message) {
    switch (message[constants_default.FIELD.ACTION]) {
      case constants_default.ACTION.AUTHENTICATE:
        if (message[constants_default.FIELD.RESULT] === constants_default.RESULT.SUCCESS) {
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
function createMessage(type, action, id, realm, data, location, description, objectIds, status, priority) {
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
  if (description !== void 0)
    message[constants_default.FIELD.DESCRIPTION] = description;
  if (objectIds !== void 0)
    message[constants_default.FIELD.OBJECT_IDS] = objectIds;
  if (status !== void 0)
    message[constants_default.FIELD.STATUS] = status;
  if (priority !== void 0)
    message[constants_default.FIELD.PRIORITY] = priority;
  return message;
}

// src/fieldnames.js
var fieldnames_default = {
  TYPE: {
    [constants_default.TYPE.REALM]: "realm",
    [constants_default.TYPE.OBJECT]: "object",
    [constants_default.TYPE.AREA]: "area",
    [constants_default.TYPE.TASK]: "task",
    [constants_default.TYPE.SUBSCRIPTION]: "subscription",
    [constants_default.TYPE.SYSTEM]: "system",
    [constants_default.TYPE.INSTRUCTION]: "instruction",
    [constants_default.TYPE.LOGEVENT]: "logEvent"
  },
  FIELD: {
    [constants_default.FIELD.TYPE]: "type",
    [constants_default.FIELD.SCOPE_TYPE]: "scopeType",
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
    [constants_default.FIELD.DESCRIPTION]: "description",
    [constants_default.FIELD.OBJECT_IDS]: "objects",
    [constants_default.FIELD.PRIORITY]: "priority",
    [constants_default.FIELD.FIELD]: "field",
    [constants_default.FIELD.VALUE]: "value",
    [constants_default.FIELD.START]: "start",
    [constants_default.FIELD.END]: "end",
    [constants_default.FIELD.LEVEL]: "level"
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

// src/object-handler.js
var ObjectHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
    this._locationFields = this._getLocationFields();
  }
  subscribe(options) {
    if (options && options.shape) {
      const shapeDataSignature = Object.keys(options.shape).sort().join("");
      switch (shapeDataSignature) {
        case "x1x2y1y2":
          options.scopeType = constants_default.SHAPE_TYPE.RECTANGLE;
          break;
        case "cxcyr":
          options.scopeType = constants_default.SHAPE_TYPE.CIRCLE;
          break;
        case "points":
          options.scopeType = constants_default.SHAPE_TYPE.POLYGON;
          break;
        default:
          throw new Error("Unknown shape data");
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
  create(id, label, location, data) {
    return this._setObjectState(id, label, location, data, constants_default.ACTION.CREATE);
  }
  update(id, label, location, data) {
    return this._setObjectState(id, label, location, data, constants_default.ACTION.UPDATE);
  }
  set(id, label, location, data) {
    this._setObjectState(id, label, location, data, constants_default.ACTION.SET);
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
    if (action === constants_default.ACTION.SET) {
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
  create(id, label, shapeData, data) {
    return this._setAreaState(id, label, shapeData, data, constants_default.ACTION.CREATE);
  }
  update(id, label, shapeData, data) {
    return this._setAreaState(id, label, shapeData, data, constants_default.ACTION.UPDATE);
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
    const shapeDataSignature = Object.keys(shapeData).sort().join("");
    switch (shapeDataSignature) {
      case "x1x2y1y2":
        msg[constants_default.FIELD.SUB_TYPE] = constants_default.SHAPE_TYPE.RECTANGLE;
        break;
      case "cxcyr":
        msg[constants_default.FIELD.SUB_TYPE] = constants_default.SHAPE_TYPE.CIRCLE;
        break;
      case "points":
        msg[constants_default.FIELD.SUB_TYPE] = constants_default.SHAPE_TYPE.POLYGON;
        break;
      default:
        return new Promise((_, reject) => {
          reject("unknown shape data");
        });
    }
    msg[constants_default.FIELD.SHAPE] = shapeData;
    return this._client._sendRequestAndHandleResponse(msg);
  }
};

// src/task-handler.js
var TaskHandler = class {
  constructor(client, realm) {
    this._client = client;
    this._realm = realm;
    this._locationFields = this._getLocationFields();
  }
  subscribe(options) {
    return this._client._subscription._getSubscription(this._client.getId("task-subscription"), this._realm.id, extendMap({
      [constants_default.FIELD.TYPE]: constants_default.TYPE.TASK,
      [constants_default.FIELD.SCOPE_TYPE]: constants_default.TYPE.REALM
    }, this._client._compressFields(options, fieldnames_default.FIELD)));
  }
  get(id) {
    if (!id) {
      throw new Error("no id provided for task.get");
    }
    const msg = createMessage(constants_default.TYPE.TASK, constants_default.ACTION.READ, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg, (response) => {
      return this._client._extendFields(response[constants_default.FIELD.DATA]);
    });
  }
  create(id, label, location, data, description, objectIds, status, priority) {
    const arg = arguments.length === 1 ? arguments[0] : {};
    return this._setTaskState(arg.id || id, arg.label || label, arg.location || location, arg.data || data, constants_default.ACTION.CREATE, arg.description || description || "", arg.objectIds || objectIds || [], arg.status || status || "open", arg.priority || priority || 0);
  }
  update(id, label, location, data, description, objectIds, status, priority) {
    return this._setTaskState(id, label, location, data, constants_default.ACTION.UPDATE, description, objectIds, status, priority);
  }
  set(id, label, location, data, description, objectIds, status, priority) {
    this._setTaskState(id, label, location, data, constants_default.ACTION.SET, description, objectIds, status, priority);
  }
  list(options) {
    const msg = createMessage(constants_default.TYPE.TASK, constants_default.ACTION.LIST, null, this._realm.id);
    if (options && Object.keys(options).length > 0) {
      msg[constants_default.FIELD.DATA] = this._client._compressFields(options, fieldnames_default.FIELD);
    }
    return this._client._sendRequestAndHandleResponse(msg, (result) => {
      return this._client._extendFieldsMap(result[constants_default.FIELD.DATA]);
    });
  }
  delete(id) {
    const msg = createMessage(constants_default.TYPE.TASK, constants_default.ACTION.DELETE, id, this._realm.id);
    return this._client._sendRequestAndHandleResponse(msg);
  }
  _getLocationFields() {
    const locationFields = {};
    for (var fieldname in fieldnames_default.LOCATION) {
      locationFields[fieldnames_default.LOCATION[fieldname]] = fieldname;
    }
    return locationFields;
  }
  _setTaskState(id, label, location, data, action, description, objectIds, status, priority) {
    const msg = createMessage(constants_default.TYPE.TASK, action, id, this._realm.id, void 0, void 0, description, objectIds, status, priority);
    if (label)
      msg[constants_default.FIELD.LABEL] = label;
    if (location && Object.keys(location).length > 0) {
      msg[constants_default.FIELD.LOCATION] = this._parseLocation(location);
    }
    if (data && Object.keys(data).length > 0)
      msg[constants_default.FIELD.DATA] = data;
    if (action === constants_default.ACTION.SET) {
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
  create(id, label, instructionString, data) {
    return this._setInstructionState(id, label, instructionString, data, constants_default.ACTION.CREATE);
  }
  update(id, label, instructionString, data) {
    return this._setInstructionState(id, label, instructionString, data, constants_default.ACTION.UPDATE);
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

// src/realm.js
var Realm = class extends EventEmitter {
  constructor(id, label, data, client) {
    super();
    this._client = client;
    this._data = data;
    this.id = id;
    this.label = label;
    this.object = new ObjectHandler(client, this);
    this.area = new AreaHandler(client, this);
    this.task = new TaskHandler(client, this);
    this.instruction = new InstructionHandler(client, this);
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
    return this._client._subscription._removeSubscription(this);
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

// src/hivekit-client.js
var HivekitClient = class extends EventEmitter {
  constructor(options) {
    super();
    this.constants = constants_default;
    this.connectionStatus = constants_default.CONNECTION_STATUS.DISCONNECTED;
    this.ping = null;
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
    this._wsConnection = null;
    this._reconnectInterval = null;
    this._onConnectPromise = null;
    this._onAuthenticatePromise = null;
    this._onDisconnectPromise = null;
    this._pendingRequests = {};
    this._pendingMessages = null;
    this._pendingHeartbeats = {};
    this._typeHandler = {
      [constants_default.TYPE.SYSTEM]: this.system,
      [constants_default.TYPE.SUBSCRIPTION]: this._subscription
    };
  }
  connect(url) {
    this._url = url;
    this._changeConnectionStatus(constants_default.CONNECTION_STATUS.CONNECTING);
    this._wsConnection = new this.WsConstructor(url);
    this._wsConnection.onopen = this._onOpen.bind(this);
    this._wsConnection.onclose = this._onClose.bind(this);
    this._wsConnection.onerror = this._onError.bind(this);
    this._wsConnection.onmessage = this._onMessage.bind(this);
    this._onConnectPromise = getPromise();
    return this._onConnectPromise;
  }
  authenticate(token) {
    this.system._sendAuthMessage(token);
    this._onAuthenticatePromise = getPromise();
    return this._onAuthenticatePromise;
  }
  disconnect() {
    this._changeConnectionStatus(constants_default.CONNECTION_STATUS.DISCONNECTING);
    this._wsConnection.close();
    this._onDisconnectPromise = getPromise();
    return this._onDisconnectPromise;
  }
  getId(prefix) {
    return prefix + "-" + nanoid();
  }
  getURL() {
    return this._wsConnection.url;
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
    try {
      const messages = JSON.parse(msg.data);
      if (Array.isArray(messages)) {
        messages.forEach(this._handleIncomingMessage.bind(this));
      } else {
        this._onError(`Websocket Message was not expected form: ${JSON.stringify(messages)}`);
      }
    } catch (e) {
      this._onError(`Failed to parse Websocket Message: ${e} - ${msg.data}`);
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
    this._wsConnection.send(JSON.stringify(this._pendingMessages));
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
    this._wsConnection.send(JSON.stringify(heartbeatMessage));
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
        this._onError(`${response[constants_default.FIELD.ERROR]}`);
        result.reject(`${response[constants_default.FIELD.ERROR]}`);
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
  _extendFields(data, fields = fieldnames_default.FIELD) {
    const translated = {};
    for (let key in data) {
      if (fields[key]) {
        if (key === constants_default.FIELD.LOCATION) {
          translated[fields[key]] = this._extendFields(data[key], fieldnames_default.LOCATION);
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
