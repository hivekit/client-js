import { C } from './fields.js';

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

        fetch(this.url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + this.token,
                'Content-Type': 'application/json'
            },
            body: msg
        }).then(async response => {
            let data = await response.text();
            try {
                data = JSON.parse(data);
            } catch (e) {
                // Preserve plain-text responses, including server error messages.
            }

            if (!response.ok) {
                const error = new Error('Request failed with status code ' + response.status);
                error.response = { data };
                throw error;
            }

            return { data };
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
                if (typeof response.response.data === 'object') {
                    responseMessage[C.FIELD.ERROR] = response.response.data[C.FIELD.ERROR];
                    responseMessage[C.FIELD.ERROR_CODE] = response.response.data[C.FIELD.ERROR_CODE];
                } else {
                    responseMessage[C.FIELD.ERROR] = response.response.data;
                }

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
