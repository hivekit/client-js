import { expect } from 'chai'
import EventEmitter from '../src/event-emitter.js';

function spy() {
    var spyFn = function () {
        spyFn.callCount++;
        spyFn.hasBeenCalled = true;
        spyFn.lastCall = {
            context: this,
            arguments: Array.prototype.slice.call(arguments),
        };
        spyFn.calls.push(spyFn.lastCall);
    }

    spyFn.callCount = 0;
    spyFn.hasBeenCalled = false;
    spyFn.lastCall = null;
    spyFn.calls = [];

    return spyFn;
}

describe('Event Emitter', function () {
    it('creates the event emitter', function () {
        const eventEmitter = new EventEmitter();
        expect(typeof eventEmitter.on).to.equal('function');
    });

    it('triggers simple callbacks', function () {
        const eventEmitter = new EventEmitter();
        const callback = spy();
        eventEmitter.on('some-event', callback);
        expect(callback.hasBeenCalled).to.equal(false);
        eventEmitter.emit('some-event');
        expect(callback.hasBeenCalled).to.equal(true);
    });

    it('triggers callbacks with arguments and unsubscribes', function () {
        const eventEmitter = new EventEmitter();
        const callback = spy();
        eventEmitter.on('some-event', callback);
        expect(callback.hasBeenCalled).to.equal(false);
        eventEmitter.emit('some-event', 'a', 'b');
        expect(callback.hasBeenCalled).to.equal(true);
        expect(callback.lastCall.arguments).to.deep.equal(['a', 'b']);
        expect(callback.callCount).to.equal(1);
        eventEmitter.off('some-event', callback);
        eventEmitter.emit('some-event', 'a', 'b');
        expect(callback.callCount).to.equal(1);
        eventEmitter.off('some-event', () => { })
    });

    it('respects contexts', function () {
        const eventEmitter = new EventEmitter();
        const callback = spy();
        const testContext = { 'this': 'one' };
        eventEmitter.on('some-event', callback, testContext);
        expect(callback.hasBeenCalled).to.equal(false);
        eventEmitter.emit('some-event', 'a', 'b');
        expect(callback.hasBeenCalled).to.equal(true);
        expect(callback.lastCall.arguments).to.deep.equal(['a', 'b']);
        expect(callback.lastCall.context).to.equal(testContext);
        expect(callback.callCount).to.equal(1);
        eventEmitter.off('some-event', callback);
        eventEmitter.emit('some-event', 'a', 'b');
        expect(callback.callCount).to.equal(2);
        eventEmitter.off('some-event', callback, testContext);
        eventEmitter.emit('some-event', 'a', 'b');
        expect(callback.callCount).to.equal(2);
    });

    it('respects order', function () {
        const eventEmitter = new EventEmitter();
        const calls = [];
        const callback1 = function () { calls.push(1); };
        const callback2 = function () { calls.push(2); };
        const callback3 = function () { calls.push(3); };
        const callback4 = function () { calls.push(4); };

        eventEmitter.on('abc', callback3, null, 0);
        eventEmitter.on('abc', callback1, null, 2);
        eventEmitter.on('abc', callback2, null, 1);
        eventEmitter.on('abc', callback4, null, 3);
        eventEmitter.emit('abc');

        expect(calls).to.deep.equal([3, 2, 1, 4]);
    });

    it('stops if false is returned', function () {
        const eventEmitter = new EventEmitter();
        const calls = [];
        const callback1 = function () { calls.push(1); };
        const callback2 = function () { calls.push(2); return false };
        const callback3 = function () { calls.push(3); };

        eventEmitter.on('abc', callback1);
        eventEmitter.on('abc', callback2);
        eventEmitter.on('abc', callback3);

        eventEmitter.emit('abc');

        expect(calls).to.deep.equal([1, 2]);
    });

    it('calls all handlers even if some unsubscribe during loop', function () {
        const eventEmitter = new EventEmitter();
        const calls = [];
        const callback1 = function () { calls.push(1); eventEmitter.off('abc', callback1) };
        const callback2 = function () { calls.push(2); };
        const callback3 = function () { calls.push(3); };

        eventEmitter.on('abc', callback1);
        eventEmitter.on('abc', callback2);
        eventEmitter.on('abc', callback3);

        eventEmitter.emit('abc');

        expect(calls).to.deep.equal([1, 2, 3]);
    });

    it('unsubscribes handlers in loop', function () {
        const eventEmitter = new EventEmitter();
        const calls = [];
        const callback1 = function () { calls.push(1); eventEmitter.off('abc', callback2) };
        const callback2 = function () { calls.push(2); };
        const callback3 = function () { calls.push(3); };

        eventEmitter.on('abc', callback1);
        eventEmitter.on('abc', callback2);
        eventEmitter.on('abc', callback3);

        eventEmitter.emit('abc');

        expect(calls).to.deep.equal([1, 3]);
    });

    it('removes listener by id', function () {
        const eventEmitter = new EventEmitter();
        const callbackA = spy();
        const callbackB = spy();
        expect(eventEmitter.hasListeners('abc')).to.equal(false)
        const listenerAId = eventEmitter.on('abc', callbackA);
        const listenerBId = eventEmitter.on('abc', callbackB);
        expect(eventEmitter.hasListeners('abc')).to.equal(true)
        eventEmitter.emit('abc');
        expect(callbackA.callCount).to.equal(1);
        expect(callbackB.callCount).to.equal(1);
        eventEmitter.removeListenerById('abc', listenerAId);
        eventEmitter.emit('abc');
        expect(callbackA.callCount).to.equal(1);
        expect(callbackB.callCount).to.equal(2);
        expect(() => { eventEmitter.removeListenerById('abc', 1234) }).to.throw('Failed to find listener with id 1234 for event abc')
        expect(() => { eventEmitter.removeListenerById('abcd', 1234) }).to.throw('No listener registered for eventname abcd')
    });
});