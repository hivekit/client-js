import axios from "axios";

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
        }).catch(result => {
            console.warn(`Failed to make request to ${this.url}: ${result.response.status} - ${result.response.data}`);
        });
    }

    close() {

    }


}