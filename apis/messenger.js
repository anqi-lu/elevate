'use strict';

const express = require('express');
const app = express.Router();

const APP_SECRET = process.env.MESSENGER_APP_SECRET;
const VALIDATION_TOKEN = process.env.MESSENGER_VALIDATION_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
const SERVER_URL = process.env.SERVER_URL;

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === VALIDATION_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function (req, res) {
    var accountLinkingToken = req.query.account_linking_token;
    var redirectURI = req.query.redirect_uri;

    // Authorization Code should be generated per user by the developer. This will 
    // be passed to the Account Linking callback.
    var authCode = "1234567890";

    // Redirect users to this URI on successful login
    var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

    res.render('authorize', {
        accountLinkingToken: accountLinkingToken,
        redirectURI: redirectURI,
        redirectURISuccess: redirectURISuccess
    });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */

const verifySignatureRequest = (req, res, next) => {
    const signature = req.headers["x-hub-signature"];

    if (!signature) {
        return res.status(401).send({
            message: 'Invalid Signature'
        });
    } else {
        const elements = signature.split('=');
        const method = elements[0];
        const signatureHash = elements[1];

        // TODO: use the buf correctly

        const expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            return res.status(401).send({
                message: 'Invalid Signature'
            });
        }
        next();
    }
}

app.post('/webhook', verifySignatureRequest, (req, res) => {
    const data = req.body;

    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched

        promises = []

        for (const pageEntry of data.entry) {
            const pageID = pageEntry.id;
            const timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            for (const messagingEvent of pageEntry) {
                if (messagingEvent.optin) {
                    promises.push(require('./events/optin')(messagingEvent));
                }
                else if (messagingEvent.message) {
                    promises.push(require('./events/message')(messagingEvent));
                }
                //else if (messagingEvent.delivery) {
                //    promises.push(require('./events/delivery')(messagingEvent));
                //}
                else if (messagingEvent.postback) {
                    promises.push(require('./events/postback')(messagingEvent));
                }
                else if (messagingEvent.read) {
                    promises.push(require('./events/read')(messagingEvent));
                }
                else if (messagingEvent.account_linking) {
                    promises.push(require('./events/account_linking')(messagingEvent));
                }
                else {
                    promises.push(Promise.reject({
                        message: 'Invalid message type'
                    }));
                }
            }
        }

        Promise.all(promises).then(() => {
            // Assume all went well.
            //
            // You must send back a 200, within 20 seconds, to let us know you've 
            // successfully received the callback. Otherwise, the request will time out.
            res.sendStatus(200);
        }).catch((err) => {
            res.status(401).send(err);
        });
    }
});


module.exports = app;