/**
 * A custom EventEmitter implementation, can be instantiated directly
 * e.g. as the EventHub or (more commonly) inheritet from.
 * 
 * This event emitter has a unique feature. It allows you to pass an order
 * in which events are triggered to each listener - allowing for event bubbling
 * without a DOM. It also allows to cut the event chain by returning false from a handler.
 * 
 * Another feature is the ability to pass a context with which events should be
 * invoked. This means there's no need for this.doStuff.bind( this ) type constructs
 * or for keeping references of a bound function for later deletion.
 */
export default class EventEmitter {

    /**
     * @constructor
     */
    constructor() {
        this.listener = {};
        this.listenerId = 0;
    }

    /**
     * Registers an event callback
     * 
     * @param {String} eventName the name of the event
     * @param {Function} fn Callback function. Will be invoked with context if provided
     * @param {Object} [context] An optional context object the callback will be invoked with
     * @param {Number} [order] The optional order in which this callback will be invoked.
     * 
     * @returns {Number} listenerId
     */
    on(eventName, fn, context, order) {
        this.listenerId++;

        if (!this.listener[eventName]) {
            this.listener[eventName] = [];
        }

        this.listener[eventName].push({
            eventName: eventName,
            fn,
            context: context,
            order: order,
            id: this.listenerId
        });

        this.listener[eventName].sort((a, b) => {
            if (a.order == b.order) return 0;
            return a.order > b.order ? 1 : -1;
        });

        return this.listenerId;
    }

    /**
     * Removes an event callback
     * 
     * @param {String} eventName 
     * @param {Function} fn 
     * @param {Object} context 
     */
    off(eventName, fn, context) {
        if (!this.listener[eventName]) {
            return;
        }

        var i = this.listener[eventName].length;

        while (i--) {
            if (
                this.listener[eventName][i].fn === fn &&
                this.listener[eventName][i].context === context
            ) {
                this.listener[eventName].splice(i, 1);
            }
        }

        if (this.listener[eventName].length === 0) {
            delete this.listener[eventName];
        }
    }

    /**
     * Removes a listener based on a previously stored listenerId
     * 
     * @param {String} eventName 
     * @param {Number} id 
     */
    removeListenerById(eventName, id) {
        if (!this.listener[eventName]) {
            throw new Error('No listener registered for eventname ' + eventName);
        }

        var foundListener = false;

        this.listener[eventName] = this.listener[eventName].filter(listener => {
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

    /**
     * Invokes an event with any number of arguments
     * 
     * @param {String} eventName 
     * @param {Mixed} arguments
     */
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

    /**
     * Returns true if listeners are registered for this event
     * 
     * @param {String} eventName 
     * @returns {Boolean}
     */
    hasListeners(eventName) {
        return !!(this.listener[eventName] && this.listener[eventName].length > 0);
    }
}
