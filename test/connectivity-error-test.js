import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'
import jwt from 'jsonwebtoken'

describe('Connectivity Error Test', function () {

    it('attempts to connect a client to a non existing url', function (done) {
        this.timeout(3000);

        const client = new HivekitClient({
            logMessages: false,
            logErrors: false,
            reconnectInterval: 300,
            maxReconnectAttempts: 3
        });

        const errorCodes = [];

        client.on('error', (msg, code, details) => {
            errorCodes.push(code);
        })

        //expect(client.connectionStatus).to.equal(client.constants.CONNECTION_STATUS.DISCONNECTED);

        client.connect('ws://doesnotexist.com').then(() => {
            expect('it').to.equal('should not get here');
        }).catch(e => {
            errorCodes.push('give_up');
            expect(errorCodes).to.deep.equal([
                'connection_error',
                'disconnected_retrying',
                'connection_error',
                'disconnected_retrying',
                'connection_error',
                'disconnected_retrying',
                'connection_error',
                'max_reconnect_attempts_exceeded',
                'give_up'
            ]);
            expect(client.connectionStatus).to.equal(client.constants.CONNECTION_STATUS.DISCONNECTED);
            done();
        })

        expect(client.connectionStatus).to.equal(client.constants.CONNECTION_STATUS.CONNECTING);
    });
});