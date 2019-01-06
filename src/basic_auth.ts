import {readFileSync} from "fs";
import {resolve} from "path";
import {assign, isArray, extend, find} from 'lodash';
import {isMatch} from 'micromatch';
import {Config} from "./config";
import {Utils} from "./utils";
import {CookieName, Header} from "./aws";


export class BasicAuth {

    private bucketName: string;
    private bucketKey: string;
    private cookieDomain: string;

    private request: any;
    private response: any;
    private callback: any;

    private config: Config;
    private eventType: string;
    private cookie: Header;
    private requestUri: string;

    constructor() {
        const path = resolve("params.json");
        let text = readFileSync(path).toString();
        const params = JSON.parse(text);
        assign(this, params);
    }

    private initEvent(event: any, callback: any) {
        const cf = event.Records[0].cf;
        this.request = cf.request;
        this.response = cf.response;
        this.eventType = cf.config.eventType;
        this.callback = callback;

        const cookies = this.request.headers.cookie || [];
        this.cookie = cookies.find(c => c.value.startsWith(CookieName));

        // this.cookie = this.request.headers.cookie;
        this.requestUri = this.request.uri;
    }

    async handler(event, context, callback) {
        console.log('debugging', JSON.stringify(event.Records[0].cf));
        this.initEvent(event, callback);

        try {
            const configRaw = await Utils.s3Read(this.bucketName, this.bucketKey); //await this.readConfig();
            this.config = new Config(configRaw);

            const uriPatterns = this.config.uriPatterns;
            let uriProtected = false;
            for (let i = 0; !uriProtected && i < uriPatterns.length; ++i) {
                const p = uriPatterns[i];
                uriProtected = isMatch(this.requestUri, p);
            }

            if (!uriProtected) {
                return this.forward();
            }

            console.log('uri= ' + this.requestUri + ' is protected');

            const headers = this.request.headers;
            const authenticatedStr = isArray(headers.authorization) ? headers.authorization[0].value : undefined;
            if (!(authenticatedStr && this.config.htpasswdAuthenticated(authenticatedStr))) {
                return this.unauthorized();
            }

            return this.authorized();
        }
        catch (e) {
            console.error(e);
            return this.internalError();
        }
    }

    private forward() {
        const reply = this.isResponse ? this.response : this.request;
        console.log(456, JSON.stringify(reply));
        return this.callback(null, reply);
    }

    private internalError() {
        const body = 'Internal Error. Check Log for more details.';
        const response = {
            status: '500',
            statusDescription: 'Internal Error',
            body: body
        };
        return this.callback(null, response);
    }

    private unauthorized() {
        //check cookie
        const hash = this.config.generateCookieValue(this.cookieDomain);
        if (this.cookie.value == hash) {
            return this.authorized();
        }

        const body = 'Unauthorized';
        const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: body,
            headers: {
                'www-authenticate': [{key: 'WWW-Authenticate', value: 'Basic'}]
            },
        };
        return this.callback(null, response);
    }

    private authorized() {
        // const expires = config.generateExpires();
        // const hash = config.generateSecurePathHash(expires, request.origin.custom.path + request.uri);
        // // const signature = `md5=` + config.generateSecurePathHash(expires, request.origin.custom.path + request.uri) + "&expires=" + expires;
        // const signature = `md5=${hash}&expires=expires`;
        // if (request.querystring) {
        //     request.querystring = request.querystring + "&" + signature;
        // } else {
        //     request.querystring = signature;
        // }

        // const options = '; Domain=' + config.websiteDomain + '; Path=/; Secure; HttpOnly';
        // {
        //     'Set-Cookie': 'CloudFront-Policy=' + signedCookies['CloudFront-Policy'] + options,
        //     'SEt-Cookie': 'CloudFront-Signature=' + signedCookies['CloudFront-Signature'] + options,
        //     'SET-Cookie': 'CloudFront-Key-Pair-Id=' + signedCookies['CloudFront-Key-Pair-Id'] + options
        // }     const authCookie = 'My-Special-Auth-Cookie=AFHJAkfhasfhlafskaj';

        // const request = event.Records[0].cf.request;
        // const headers = request.headers;
        // headers.cookie = headers.cookie || [];
        // headers.cookie.push({ key:'Cookie', value: 'sample-cookie' });
        // console.log('set cookie', headers);

        // headers: {
        //     "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        //         "Access-Control-Allow-Credentials" : true, // Required for cookies, authorization headers with HTTPS
        //         "Set-Cookie": 'mycookiee=test; domain=localhost; expires=Thu, 19 Apr 2018 20:41:27 GMT;"',
        //         "Cookie": 'anotherCookie=test; domain=localhost; expires=Thu, 19 Apr 2018 20:41:27 GMT;"'
        // },


        // extend(request.headers, {
        //     "Access-Control-Allow-Origin": [{
        //         key: 'Access-Control-Allow-Origin',
        //         value: "*"
        //     }],
        //     "Access-Control-Allow-Credentials": [{
        //         key: 'Access-Control-Allow-Credentials',
        //         value: true
        //     }],
        //     "Set-Cookie": [{
        //         key: 'Set-Cookie',
        //         value: 'mycookiee=test; domain=booppi.website; expires=Thu, 19 Apr 2019 20:41:27 GMT;'
        //     }],
        //     "Cookie": [{
        //         key: 'Cookie',
        //         value: 'anotherCookie=test; domain=booppi.website; expires=Thu, 19 Apr 2019 20:41:27 GMT;'
        //     }]
        // });

        // const response = event.Records[0].cf.response;
        // const request = event.Records[0].cf.request;

        // if (this.isResponse) {
        //     extend(this.response.headers, {
        //         "Set-Cookie": [{
        //             key: 'Set-Cookie',
        //             value: this.config.generateCookieValue(this.cookieDomain)
        //         }]
        //     });
        // }

        //
        // console.log(response.headers);
        // console.log(response.headers.length);

        // const reply = this.isResponse ? this.response : this.request;
        // console.log(JSON.stringify(reply));
        // console.log(123, this.isResponse);

        if (this.isResponse) {
            extend(this.response.headers, {
                "Set-Cookie": [{
                    key: 'Set-Cookie',
                    value: this.config.generateCookieValue(this.cookieDomain)
                }]
            });
        }

        const reply = this.isResponse ? this.response : this.request;
        console.log(123, JSON.stringify(reply));
        return this.callback(null, reply);
    }

    // generateCookieValue(): string {
    //     const hash = this.config.generateHash(this.cookieDomain);
    //     return `${CookieName}=${hash}; domain=${this.cookieDomain}; max-age=${this.config.cookieMaxAgeInSeconds};`;
    // }

    get isResponse(): boolean {
        return this.eventType.endsWith('response');
    }
}

// "request": {
//     "clientIp": "171.232.156.243",
//         "headers": {
//         "host": [
//             {
//                 "key": "Host",
//                 "value": "mysite.booppi.website"
//             }
//         ],
//             "user-agent": [
//             {
//                 "key": "User-Agent",
//                 "value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"
//             }
//         ],
//             "upgrade-insecure-requests": [
//             {
//                 "key": "upgrade-insecure-requests",
//                 "value": "1"
//             }
//         ],
//             "dnt": [
//             {
//                 "key": "dnt",
//                 "value": "1"
//             }
//         ],
//             "accept": [
//             {
//                 "key": "accept",
//                 "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
//             }
//         ],
//             "accept-encoding": [
//             {
//                 "key": "accept-encoding",
//                 "value": "gzip, deflate, br"
//             }
//         ],
//             "accept-language": [
//             {
//                 "key": "accept-language",
//                 "value": "en-US,en;q=0.9,vi;q=0.8,ja;q=0.7"
//             }
//         ],
//             "cookie": [
//             {
//                 "key": "cookie",
//                 "value": "mycookiee=test"
//             }
//         ]
//     },
//     "method": "GET",
//         "querystring": "",
//         "uri": "/sample.png"
// },

// 'use strict';
//
// const sourceCoookie = 'X-Source';
// const sourceMain = 'main';
// const sourceExperiment = 'experiment';
// const experimentTraffic = 0.5;
//
// // Viewer request handler
// exports.handler = (event, context, callback) => {
//     const request = event.Records[0].cf.request;
//     const headers = request.headers;
//
//     // Look for source cookie
//     if ( headers.cookie ) {
//         for (let i = 0; i < headers.cookie.length; i++) {
//            ss if (headers.cookie[i].value.indexOf(sourceCoookie) >= 0) {
//                 console.log('Source cookie found. Forwarding request as-is');
//                 // Forward request as-is
//                 callback(null, request);
//                 return;
//             }
//         }
//     }
//
//     console.log('Source cookie has not been found. Throwing dice...');
//     const source = ( Math.random() < experimentTraffic ) ? sourceExperiment : sourceMain;
//     console.log(`Source: ${source}`)
//
//     // Add Source cookie
//     const cookie = `${sourceCoookie}=${source}`
//     console.log(`Adding cookie header: ${cookie}`);
//     headers.cookie = headers.cookie || [];
//     headers.cookie.push({ key:'Cookie', value: cookie });
//
//     // Forwarding request
//     callback(null, request);
// };
