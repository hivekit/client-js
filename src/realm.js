import ObjectHandler from "./object-handler";
import AreaHandler from "./area-handler";
import InstructionHandler from './instruction-handler';
import C from './constants';
import fieldnames from "./fieldnames";
import { createMessage } from "./message";

/**
 * Represents a single realm. This class is returned
 * whenever `client.realm.get(id)` is called. It provides
 * information (id, data, label) of the realm itself as well
 * as accessor methods to interact with the objects, areas and
 * instructions within it.
 */
export default class Realm {

    /**
     * Realms are instantiated by the {RealmHandler}
     * 
     * @param {string} id 
     * @param {string} label 
     * @param {object} data 
     * @param {HivekitClient} client 
     */
    constructor(id, label, data, client) {
        this._client = client;
        this.id = id;
        this.label = label;
        this.data = data;
        this.object = new ObjectHandler(client, this);
        this.area = new AreaHandler(client, this);
        this.instruction = new InstructionHandler(client, this);
    }

    /**
     * Searches Objects and Areas within the given realm.
     * 
     * @param {string} searchString 
     * @param {object} options
     * {
     *      // a list of properties to search in
     *  	field: ['data', 'label', 'id' ]
     * 
     *      // max amount of object results to be returned
            maxObjectResults

            // max amount of area results to be returned
            maxAreaResults
     * }
     * 
     * @returns {Promise<search results>}
     */
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