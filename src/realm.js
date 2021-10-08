import ObjectHandler from "./object-handler";
import AreaHandler from "./area-handler";
import InstructionHandler from './instruction-handler';
import C from './constants';
import fieldnames from "./fieldnames";
import { createMessage } from "./message";

export default class Realm {
    constructor(id, label, data, client) {
        this._client = client;
        this.id = id;
        this.label = label;
        this.data = data;
        this.object = new ObjectHandler(client, this);
        this.area = new AreaHandler(client, this);
        this.instruction = new InstructionHandler(client, this);
    }

    search(searchString, options) {
        const data = this._client._compressFields(options, fieldnames.FIELD, true);
        data[C.STRING_VALUE] = searchString;
        const msg = createMessage(C.TYPE.REALM, C.ACTION.SEARCH, null, this.id, data);
        return this._client._sendRequestAndHandleResponse(msg, results => {
            if (!results[C.FIELD.DATA]) {
                return [];
            }
            return results[C.FIELD.DATA].map(result => {
                const extendedResult = this._client._extendFields(result);

                // These two transformations are specific to search results - maybe this should be more generic though?
                extendedResult.dataProperty = extendedResult.scopeType;
                delete extendedResult.scopeType;
                return extendedResult;
            });
        });
    }
}