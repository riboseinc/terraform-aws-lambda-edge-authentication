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
        this.cookie = cookies.find(c => c.value.startsWith(CookieName)) || {};

        // this.cookie = this.request.headers.cookie;
        this.requestUri = this.request.uri;
    }

    async handler(event, context, callback) {
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

            const isAuthenticated = await this.config.htpasswdAuthenticated(authenticatedStr);

            if (isAuthenticated) {
                return this.authorized();
            }

            return this.unauthorized();
        }
        catch (e) {
            console.error(e);
            return this.internalError();
        }
    }

    private forward() {
        const reply = this.isResponse ? this.response : this.request;
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
        if (this.isResponse) {
            extend(this.response.headers, {
                "Set-Cookie": [{
                    key: 'Set-Cookie',
                    value: this.config.generateCookieValue(this.cookieDomain)
                }]
            });
        }

        const reply = this.isResponse ? this.response : this.request;
        return this.callback(null, reply);
    }

    get isResponse(): boolean {
        return this.eventType.endsWith('response');
    }
}
