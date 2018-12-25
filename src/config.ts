import {assign} from 'lodash';
import {Utils} from "./utils";
import {createHash} from 'crypto';
import {HtpasswdAuth} from "./htpasswd-auth";


export class Config {
    sessionDurationInMinutes: number = 30;
    htpasswd: string;
    uriPatterns: string[];

    constructor(jsonStr: string) {
        const config = JSON.parse(jsonStr);
        assign(this, config);
    }

    async htpasswdAuthenticated(basicAuth: string): Promise<boolean> {
        const [user, pass] = Utils.parseBasicAuth(basicAuth);
        const authenticated = await HtpasswdAuth.authenticate(user, pass, this.htpasswd);
        return authenticated;
    }

    generateExpires() {
        // Set expiration time to 1 hour from now
        const date = new Date();
        date.setMinutes(date.getMinutes() + this.sessionDurationInMinutes);
        // @ts-ignore
        return Math.floor(date / 1000);
    }

    generateSecurePathHash(expires, URL) {
        // construct string to sign
        const unsignedString = `${expires}${URL} ${this.htpasswd}`;// expires + URL  + ' ' + this.htpasswd;//secret;

        // compute signature
        const binaryHash = createHash("md5").update(unsignedString).digest();
        const base64Value = Buffer.from(binaryHash).toString('base64');
        return base64Value.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    // get basicAuth(): string {
    //     const buf = new Buffer(`${this.username}:${this.password}`).toString('base64');
    //     return `Basic ${buf}`;// 'Basic ' + buf;
    // }
}

// const CONFIG_KEYS = {
//     websiteDomain: 'WEBSITE_DOMAIN',
//     sessionDuration: 'SESSION_DURATION',
//     redirectOnSuccess: 'REDIRECT_ON_SUCCESS',
//     cloudFrontKeypairId: 'CLOUDFRONT_KEYPAIR_ID',
//     cloudFrontPrivateKey: 'ENCRYPTED_CLOUDFRONT_PRIVATE_KEY',
//     htpasswd: 'ENCRYPTED_HTPASSWD'
// }

// const crypto = require('crypto');
// const credentials = require('credentials.json');
// const secret = credentials.secret;
//
// exports.handler = (event, context, callback) => {
//     const request = event.Records[0].cf.request;
//
//     const expires = generateExpires();
//     const signature = "md5="+generateSecurePathHash(expires, request.origin.custom.path + request.uri)+"&expires="+expires;
//
//     if (request.querystring) {
//         request.querystring = request.querystring + "&" + signature;
//     } else {
//         request.querystring = signature;
//     }
//
//     callback(null, request);
// }
//
// function generateExpires() {
//     // Set expiration time to 1 hour from now
//     const date = new Date();
//     date.setHours(date.getHours()+1);
//     return Math.floor(date/1000);
// }
//
// function generateSecurePathHash(expires, URL) {
//     // construct string to sign
//     const unsignedString = expires + URL  + ' ' + secret;
//
//     // compute signature
//     const binaryHash = crypto.createHash("md5").update(unsignedString).digest();
//     const base64Value = new Buffer(binaryHash).toString('base64');
//     return base64Value.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
// }