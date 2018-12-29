import {createHash} from 'crypto';
import * as md5 from 'apache-md5';
import {compare} from 'bcryptjs';
import * as crypt from 'apache-crypt';

//copied from https://github.com/jdxcode/htpasswd-auth/
export class HtpasswdAuth {

    private static sha1(password) {
        var hash = createHash('sha1');
        hash.update(password);
        return hash.digest('base64');
    }

    private static checkPassword(digest, password): Promise<boolean> {
        return new Promise(function (fulfill, reject) {
            if (digest.substr(0, 6) === '$apr1$') {
                fulfill(digest === md5(password, digest));
            } else if (digest.substr(0, 4) === '$2y$') {
                digest = '$2a$' + digest.substr(4);
                compare(password, digest, function (err, res) {
                    if (err) {
                        return reject(err);
                    }
                    fulfill(res);
                });
            } else if (digest.substr(0, 5) === '{SHA}') {
                fulfill('{SHA}' + HtpasswdAuth.sha1(password) === digest);
            } else if (digest === password) {
                fulfill(true);
            } else {
                fulfill(crypt(password, digest) === digest);
            }
        });
    }

    static authenticate(username, password, htpasswd): Promise<boolean> {
        return new Promise(function (fulfill) {
            var lines = htpasswd.split('\n');
            lines.forEach(function (line) {
                line = line.split(':');
                if (line[0] === username) {
                    fulfill(HtpasswdAuth.checkPassword(line[1], password));
                }
            });
            fulfill(false);
        });
    }
}
