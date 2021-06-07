import {Utils} from "./utils";
import {HtpasswdAuth} from "./htpasswd-auth";
import * as crypto from 'crypto';
import {CookieName} from "./aws";

export class Config {
    htpasswd: string;
    cookieMaxAgeInSeconds: number;
    uriPatterns: string[];

    constructor(jsonStr: string) {
        const config = JSON.parse(jsonStr);
        Object.assign(this, config);
    }

    async htpasswdAuthenticated(basicAuth: string): Promise<boolean> {
        if (!basicAuth) {
            return false;
        }

        const [user, pass] = Utils.parseBasicAuth(basicAuth);
        const authenticated = await HtpasswdAuth.authenticate(user, pass, this.htpasswd);
        return authenticated;
    }

    generateHash(domain: string): string {
        const data = `${this.htpasswd}-${domain}`;
        return crypto.createHash('md5')
            .update(data).digest("hex");
    }

    generateCookieValue(domain: string): string {
        const hash = this.generateHash(domain);
        return `${CookieName}=${hash}; domain=${domain}; max-age=${this.cookieMaxAgeInSeconds};`;
    }
}

// Part of https://github.com/chris-rock/node-crypto-examples

// Nodejs encryption with CTR
// var crypto = require('crypto'),
//     algorithm = 'aes-256-ctr',
//     password = 'd6F3Efeq';
//
// function encrypt(text){
//     var cipher = crypto.createCipher(algorithm,password)
//     var crypted = cipher.update(text,'utf8','hex')
//     crypted += cipher.final('hex');
//     return crypted;
// }
//
// function decrypt(text){
//     var decipher = crypto.createDecipher(algorithm,password)
//     var dec = decipher.update(text,'hex','utf8')
//     dec += decipher.final('utf8');
//     return dec;
// }
//
// var hw = encrypt("hello world")
// // outputs hello world
// console.log(decrypt(hw));


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
