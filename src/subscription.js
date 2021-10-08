import EventEmitter from "./event-emitter";
import C from "./constants";

export default class Subscription extends EventEmitter{
    constructor( client, id ) {
        super();
        this._client = client;
        this.id = id;
        this._data = null;
    }

    update() {}

    cancel() {}

    _processIncomingMessage( msg ) {
        var data;

        if( msg[C.TYPE.OBJECT] ) {
            data = this._client._extendFieldsMap( msg[C.TYPE.OBJECT] );
        }
        else if( msg[C.TYPE.AREA] ) {
            data = this._client._extendFieldsMap( msg[C.TYPE.AREA] );
        }
        else if( msg[C.TYPE.INSTRUCTION] ) {
            data = this._client._extendFieldsMap( msg[C.TYPE.INSTRUCTION] );
        }
        
        switch (msg[C.FIELD.UPDATE_TYPE]) {
            case C.UPDATE_TYPE.FULL:
                this._data = data;
            break;
            case C.UPDATE_TYPE.DELTA:
                for( var id in data ) {
                    this._data[ id ] = data[ id ];
                }
            break;
            default:
                this._client._onError( 'Received subscription message with unknown update type ' + msg[C.FIELD.UPDATE_TYPE])
                return;
        }
        this.emit( 'data', this._data );
    }
}