import { expect } from 'chai'
import HivekitClient from '../src/index-node.js'
import config from './config.js'

describe('System Handler Admin Auth', function () {
    var client;

    // it('creates the client', async function () {
    //     client = new HivekitClient({
    //         logErrors: true,
    //         logMessages: false,
    //         httpRoot: config.httpRoot
    //     });
    // });

    // it('fails to authenticate as admin with wrong password', async function () {
    //     try {
    //         await client.system.authenticateAdmin('wrong password')
    //     } catch (e) {
    //         expect(e.toString()).to.contain('invalid admin password')
    //         return
    //     }

    //     expect('it').to.equal('should not get here');
    // });

    // it('authenticates with the correct admin password', async function () {
    //     await client.system.authenticateAdmin('CHANGE_ME');
    //     expect(true).to.equal(true);
    // });
});