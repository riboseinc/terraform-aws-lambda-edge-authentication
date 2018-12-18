import {BasicAuth} from './basic_auth';

exports.handler = async (event, context, callback) => {
    const auth = new BasicAuth();
    return auth.handler(event, context, callback);
};
