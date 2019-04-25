const request = require('request-promise');
const uuidv4 = require('uuid/v4');
const path = require('path');
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

async function Translator(to, text) {
    let options = {
        method: 'POST',
        baseUrl: 'https://api.cognitive.microsofttranslator.com/',
        url: 'translate',
        qs: {
            'api-version': '3.0',
            'to': to
        },
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.SubscriptionKey,
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
        },
        body: [{
            'text': text
        }],
        json: true
    };

    const response = request(options)
        .then((body) => {
            return body;
        })
        .catch((err) => {
            return err;
        });
    return response;
};

module.exports.Translate = Translator;
