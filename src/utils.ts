export class Utils {

    static async s3Read(bucketName: string, bucketKey: string): Promise<string> {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const params = {Bucket: bucketName, Key: bucketKey};
        const data = await s3.getObject(params).promise();
        return data.Body.toString();
    }

    //return [username, password]
    static parseBasicAuth(basicAuth: string): [string, string] {
        const plain = Buffer.from(basicAuth.split(' ')[1], 'base64').toString();
        const parts = plain.split(':');
        return [parts[0], parts[1]];
    }
}