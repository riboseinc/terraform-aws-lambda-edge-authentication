import {readFileSync} from "fs";
import {resolve} from "path";
import {assign, isArray} from 'lodash';
import {isMatch} from 'micromatch';
import {Config} from "./config";
import {Utils} from "./utils";


export class BasicAuth {

    private readonly s3;

    private bucket_name: string;
    private bucket_key: string;

    constructor() {
        console.log('calling 123');

        const path = resolve("params.json");
        let text = readFileSync(path).toString();
        const params = JSON.parse(text);
        assign(this, params);
    }

    async handler(event, context, callback) {
        console.log(JSON.stringify(event));
        const request = event.Records[0].cf.request;
        console.log(JSON.stringify(request));
        const uri = request.uri;

        try {
            const configRaw = await Utils.s3Read(this.bucket_name, this.bucket_key); //await this.readConfig();
            console.log(`configRaw= ${configRaw}`);
            const config = new Config(configRaw);
            // const filesStr = await this.readConfig();
            // if (!filesStr || filesStr.trim().length == 0) {
            //     throw new Error(`empty protect files => ignore`);
            // }

            // const uriPatterns = JSON.parse(filesStr);
            // if (!Array.isArray(uriPatterns)) {
            //     throw new Error('Bucket key is not a Json Array => ignore');
            // }

            const uriPatterns = config.uriPatterns;
            let uriProtected = false;
            for (let i = 0; !uriProtected && i < uriPatterns.length; ++i) {
                const p = uriPatterns[i];
                uriProtected = isMatch(uri, p);
            }

            if (!uriProtected) {
                return callback(null, request);
            }

            console.log('uri= ' + uri + ' is protected');

            const headers = request.headers;

            const headerAuthorization = isArray(headers.authorization) ? headers.authorization[0].value : undefined;
            if (!(headerAuthorization && config.htpasswdAuthenticated(headerAuthorization))) {
                return this.unauthorized(callback);
            }

            return this.authorized(config, request, callback);

            // const authString = 'Basic ' + new Buffer(this.basic_user + ':' + this.basic_pwd).toString('base64');
            // if (typeof headers.authorization === 'undefined' || headers.authorization[0].value !== authString) {
            //     const body = 'Unauthorized';
            //     const response = {
            //         status: '401',
            //         statusDescription: 'Unauthorized',
            //         body: body,
            //         headers: {
            //             'www-authenticate': [{key: 'WWW-Authenticate', value: 'Basic'}]
            //         },
            //     };
            //     return callback(null, response);
            // }

            /*
                        htpasswd.authenticate(body.username, body.password, config.htpasswd).then((authenticated) => {
                    if (authenticated) {
            */
        }
        catch (e) {
            console.error(e);
            return this.internalError(callback);
        }
    }

    private internalError(callback: any) {
        const body = 'Internal Error. Check Log for more details.';
        const response = {
            status: '500',
            statusDescription: 'Internal Error',
            body: body
        };
        return callback(null, response);
    }

    private unauthorized(callback: any) {
        const body = 'Unauthorized';
        const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: body,
            headers: {
                'www-authenticate': [{key: 'WWW-Authenticate', value: 'Basic'}]
            },
        };
        return callback(null, response);
    }

    private authorized(config: Config, request: any, callback: any) {
        const expires = config.generateExpires();
        const hash = config.generateSecurePathHash(expires, request.origin.custom.path + request.uri);
        // const signature = `md5=` + config.generateSecurePathHash(expires, request.origin.custom.path + request.uri) + "&expires=" + expires;
        const signature = `md5=${hash}&expires=expires`;
        if (request.querystring) {
            request.querystring = request.querystring + "&" + signature;
        } else {
            request.querystring = signature;
        }
        return callback(null, request);
    }
}