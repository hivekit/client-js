import { expect } from 'chai'
import HivekitClient from '../src/index.js'
import config from './config'
import jwt from 'jsonwebtoken'

describe( 'Connectivity Test', function(){
    var client;

    it( 'creates the client without options', async function() {
        client = new HivekitClient({logMessages: false});
        expect( client.connectionStatus ).to.equal( client.constants.CONNECTION_STATUS.DISCONNECTED );
    });

    it( 'connects the unauthenticated client to a server', function( done ) {
        client.connect( config.wsUrl ).then(() => {
            expect( client.connectionStatus ).to.equal( client.constants.CONNECTION_STATUS.CONNECTED );
            done();
        })
        expect( client.connectionStatus ).to.equal( client.constants.CONNECTION_STATUS.CONNECTING );
    });

    it( 'queues unauthenticated messages and sends them after authentication', function( done ) {
        var hasRealm = false;
        var isAuthenticated = false;
        const token = jwt.sign({ sub: 'userName' }, config.authTokenSecret );
        client.realm.create( client.getId('realm'), 'some-label' ).then( realm => {
            hasRealm = true;
            expect( isAuthenticated ).to.equal( true );
            done();
        })
        
        client.authenticate( token ).then(() => {
            isAuthenticated = true;
            expect( hasRealm ).to.equal( false );
        });
    });

    it( 'connects the unauthenticated client to a server', async function() {
        await client.disconnect()
        expect( client.connectionStatus ).to.equal( client.constants.CONNECTION_STATUS.DISCONNECTED );
    });
});