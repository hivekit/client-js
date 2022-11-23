import axios from "axios";
import C from "./constants.js"

export default class HTTPConnection {
    constructor(url, messageCallback) {
        this.url = url;
        this.token = null;
        this.messageCallback = messageCallback;
    }

    send(msg) {
        if (this.token === null) {
            throw new Error('HTTP Connection not yet authenticated. Call authenticate() first.');
        }

        axios({
            url: this.url,
            method: 'post',
            responseType: 'json',
            responseEncoding: 'utf8',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            data: msg
        }).then(response => {
            this.messageCallback(response);
        }).catch(response => {
            this.messageCallback({
                data: [{
                    [C.FIELD.RESULT]: C.RESULT.ERROR,
                    [C.FIELD.ERROR]: response.response.data,
                    [C.FIELD.CORRELATION_ID]: JSON.parse(msg)[0][C.FIELD.CORRELATION_ID]
                }]
            });
        });
    }

    close() {

    }


}