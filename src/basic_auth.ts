import {readFileSync} from "fs";
import * as AWS from 'aws-sdk';

export class BasicAuth {

    private s3 = new AWS.S3();
    
    async handler(event, context, callback) {
        const request = event.Records[0].cf.request;
        const uri = request.uri;

        if (!'${BUCKET_NAME}') {
            console.log(`Bucket not defined (key is empty) => ignore`);
            return callback(null, request);
        }

        try {
            const filesStr = await this.readRestrictedFiles();
            if (!filesStr || filesStr.trim().length == 0) {
                throw new Error(`empty protect files => ignore`);
            }

            const rawFiles = JSON.parse(filesStr);
            if (!Array.isArray(rawFiles)) {
                throw new Error('${BUCKET_KEY} is not any array => ignore')
            }
            const files = rawFiles.map(f => f.startsWith('/') ? f : '/' + f);
            // @ts-ignore
            if (!files.includes(uri)) {
                throw new Error(uri + ` not protected`);
            }

            const headers = request.headers;

            const authUser = '${BASIC_USER}';
            const authPass = '${BASIC_PWD}';

            const authString = 'Basic ' + new Buffer(authUser + ':' + authPass).toString('base64');
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
        const params = {Bucket: '${BUCKET_NAME}', Key: '${BUCKET_KEY}'};
        const data = await this.s3.getObject(params).promise();
        return data.Body.toString();
    }
}