import {readFileSync} from "fs";
import {resolve} from "path";
import {assign} from 'lodash';
import {isMatch} from 'micromatch';

export class BasicAuth {

    private readonly s3;

    private bucket_name: string;
    private bucket_key: string;
    private basic_user: string;
    private basic_pwd: string;

    constructor() {
        const AWS = require('aws-sdk');
        this.s3 = new AWS.S3();

        const path = resolve("params.json");
        const params = JSON.parse(readFileSync(path).toString());
        assign(this, params);
    }

    async handler(event, context, callback) {
        const request = event.Records[0].cf.request;
        const uri = request.uri;

        try {
            const filesStr = await this.readRestrictedFiles();
            if (!filesStr || filesStr.trim().length == 0) {
                throw new Error(`empty protect files => ignore`);
            }

            const uriPatterns = JSON.parse(filesStr);
            if (!Array.isArray(uriPatterns)) {
                throw new Error('Bucket key is not a Json Array => ignore')
            }

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

            // const authUser = this.basic_user;
            // const authPass = this.bucket_pwd;

            const authString = 'Basic ' + new Buffer(this.basic_user + ':' + this.basic_pwd).toString('base64');
            if (typeof headers.authorization === 'undefined' || headers.authorization[0].value !== authString) {
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
        }
        catch (e) {
            console.error(e);
        }
        return callback(null, request);
    }

    async readRestrictedFiles() {
        const params = {Bucket: this.bucket_name, Key: this.bucket_key};
        const data = await this.s3.getObject(params).promise();
        return data.Body.toString();
    }
}