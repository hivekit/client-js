import axios from "axios";
import C from "./constants.js"

export default class HTTPConnection {
    constructor(url, messageCallback) {
        this.url = url;
        this.token = null;
        this.messageCallback = messageCallback;
    }

    getCorrelationId(msg) {
        if (typeof msg !== 'string') {
            return null;
        }
        var parsedMsg;

        try {
            parsedMsg = msg && JSON.parse(msg);
        } catch (e) {
            return null;
        }

        if (parsedMsg && parsedMsg[0] && parsedMsg[0][C.FIELD.CORRELATION_ID]) {
            return parsedMsg[0][C.FIELD.CORRELATION_ID];
        }
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

            if (msg.includes(C.ACTION.SET)) {
                const messages = JSON.parse(msg);
                messages.forEach(msg => {
                    if (msg[C.FIELD.ACTION] === C.ACTION.SET) {
                        response.data.push({
                            [C.FIELD.CORRELATION_ID]: msg[C.FIELD.CORRELATION_ID],
                            [C.FIELD.RESULT]: C.RESULT.SUCCESS
                        })
                    }
                })
            }
            this.messageCallback(response);
        }).catch(response => {
            const responseMessage = {
                [C.FIELD.RESULT]: C.RESULT.ERROR
            }

            const correlationId = this.getCorrelationId(msg);
            if (correlationId) {
                responseMessage[C.FIELD.CORRELATION_ID] = correlationId;
            }

            if (response.response && response.response.data) {
                responseMessage[C.FIELD.ERROR] = response.response.data
            } else {
                responseMessage[C.FIELD.ERROR] = response.message || response.body || response.toString();
            }

            this.messageCallback({
                data: [responseMessage]
            });
        });
    }

    close() {

    }


}