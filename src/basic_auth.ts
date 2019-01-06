import {readFileSync} from "fs";
import {resolve} from "path";
import {assign, isArray, extend} from 'lodash';
import {isMatch} from 'micromatch';
import {Config} from "./config";
import {Utils} from "./utils";


export class BasicAuth {

    private bucket_name: string;
    private bucket_key: string;

    private request: any;
    private response: any;
    private callback: any;

    private config: Config;
    private eventType: string;

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
    }

    async handler(event, context, callback) {
        console.log('debugging', JSON.stringify(event.Records[0].cf));
        this.initEvent(event, callback);

        // const uri = this.request.uri;

        try {
            const configRaw = await Utils.s3Read(this.bucket_name, this.bucket_key); //await this.readConfig();
            this.config = new Config(configRaw);

            // const uriPatterns = this.config.uriPatterns;
            // let uriProtected = false;
            // for (let i = 0; !uriProtected && i < uriPatterns.length; ++i) {
            //     const p = uriPatterns[i];
            //     uriProtected = isMatch(uri, p);
            // }
            //
            // if (!uriProtected) {
            //     return callback(null, this.request);
            // }
            //
            // console.log('uri= ' + uri + ' is protected');

            // const headers = request.headers;

            // const authenticatedStr = isArray(headers.authorization) ? headers.authorization[0].value : undefined;
            // if (!(authenticatedStr && config.htpasswdAuthenticated(authenticatedStr))) {
            //     return this.unauthorized(callback);
            // }

            return this.authorized();
        }
        catch (e) {
            console.error(e);
            return this.internalError();
        }
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

        if (this.isResponse) {
            extend(this.response.headers, {
                "Set-Cookie": [{
                    key: 'Set-Cookie',
                    value: 'mycookiee=test; domain=mysite.booppi.website; expires=Thu, 19 Apr 2019 20:41:27 GMT;'
                }],
                "Cookie": [{
                    key: 'Cookie',
                    value: 'anotherCookie=test; domain=mysite.booppi.website; expires=Thu, 19 Apr 2019 20:41:27 GMT;'
                }]
            });
        }

        //
        // console.log(response.headers);
        // console.log(response.headers.length);

        const reply = this.isResponse ? this.response : this.request;
        console.log(JSON.stringify(reply));
        console.log(123, this.isResponse);

        if (this.isResponse) {
            extend(reply.headers, {
                "Set-Cookie": [{
                    key: 'Set-Cookie',
                    value: 'mycookiee=test; domain=mysite.booppi.website; max-age=3600;'
                }],
                "Cookie": [{
                    key: 'Cookie',
                    value: 'anotherCookie=test; domain=mysite.booppi.website; expires=Thu, 19 Apr 2019 20:41:27 GMT;'
                }]
            });
        }

        return this.callback(null, reply);
    }

    get isResponse(): boolean {
        return this.eventType.endsWith('response');
    }
}

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
