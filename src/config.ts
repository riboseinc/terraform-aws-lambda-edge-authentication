import {assign} from 'lodash';
import {Utils} from "./utils";
import {createHash} from 'crypto';
import {HtpasswdAuth} from "./htpasswd-auth";


export class Config {
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
}
