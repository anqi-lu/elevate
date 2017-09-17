/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const config = require('config'),
    crypto = require('crypto'),
    request = require('request');

module.exports = class MessengerController {
    constructor(app) {
        // App Secret can be retrieved from the App Dashboard
        this.APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
            process.env.MESSENGER_APP_SECRET :
            config.get('appSecret');

        // Arbitrary value used to validate a webhook
        this.VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
            (process.env.MESSENGER_VALIDATION_TOKEN) :
            config.get('validationToken');

        // Generate a page access token for your page from the App Dashboard
        this.PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
            (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
            config.get('pageAccessToken');

        // URL where the app is running (include protocol). Used to point to scripts and
        // assets located at this address.
        this.SERVER_URL = (process.env.SERVER_URL) ?
            (process.env.SERVER_URL) :
            config.get('serverURL');

        if (!(this.APP_SECRET && this.VALIDATION_TOKEN && this.PAGE_ACCESS_TOKEN && this.SERVER_URL)) {
            console.error("Missing config values");
            process.exit(1);
        }


        /*
         * Use your own validation token. Check that the token used in the Webhook
         * setup is the same token used here.
         *
         */
        app.get('/webhook', (req, res) => {
            if (req.query['hub.mode'] === 'subscribe' &&
                req.query['hub.verify_token'] === this.VALIDATION_TOKEN) {
                console.log("Validating webhook");
                res.status(200).send(req.query['hub.challenge']);
            } else {
                console.error("Failed validation. Make sure the validation tokens match.");
                res.sendStatus(403);
            }
        });


        /*
         * All callbacks for Messenger are POST-ed. They will be sent to the same
         * webhook. Be sure to subscribe your app to your page to receive callbacks
         * for your page.
         * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
         *
         */
        app.post('/webhook', (req, res) => {
                var data = req.body;

                // Make sure this is a page subscription
                if (data.object === 'page') {
                    // Iterate over each entry
                    // There may be multiple if batched
                    data.entry.forEach((pageEntry) => {
                            var pageID = pageEntry.id;
                            var timeOfEvent = pageEntry.time;

                            // Iterate over each messaging event
                            pageEntry.messaging.forEach((messagingEvent) => {
                                    if (messagingEvent.optin) {
                                        this.receivedAuthentication(messagingEvent);
                                    } else if (messagingEvent.message) {
                                        this.receivedMessage(messagingEvent);
                                    } else if (messagingEvent.delivery) {
                                        this.receivedDeliveryConfirmation(messagingEvent);
                                    } else if (messagingEvent.postback) {
                                        this.receivedPostback(messagingEvent);
                                    } else if (messagingEvent.read) {
                                        this.receivedMessageRead(messagingEvent);
                                    } else if (messagingEvent.account_linking) {
                                        this.receivedAccountLink(messagingEvent);
                                    } else {
                                        console.log("Webhook received unknown messagingEvent: ", messagingEvent);
                                    }
                                }
                            );
                        }
                    );

                    // Assume all went well.
                    //
                    // You must send back a 200, within 20 seconds, to let us know you've
                    // successfully received the callback. Otherwise, the request will time out.
                    res.sendStatus(200);
                }
            }
        );

        /*
         * This path is used for account linking. The account linking call-to-action
         * (sendAccountLinking) is pointed to this URL.
         *
         */
        app.get('/authorize', (req, res) => {
                var accountLinkingToken = req.query.account_linking_token;
                var redirectURI = req.query.redirect_uri;

                // Authorization Code should be generated per user by the developer. This will
                // be passed to the Account Linking callback.
                var authCode = "1234567890";

                // Redirect users to this URI on successful login
                var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;
            }
        );
    }

    /*
     * Verify that the callback came from Facebook. Using the App Secret from
     * the App Dashboard, we can verify the signature that is sent with each
     * callback in the x-hub-signature field, located in the header.
     *
     * https://developers.facebook.com/docs/graph-api/webhooks#setup
     *
     */
    verifyRequestSignature(req, res, buf) {
        var signature = req.headers["x-hub-signature"];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];

            var expectedHash = crypto.createHmac('sha1', this.APP_SECRET)
                .update(buf)
                .digest('hex');

            if (signatureHash !== expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    /*
     * Authorization Event
     *
     * The value for 'optin.ref' is defined in the entry point. For the "Send to
     * Messenger" plugin, it is the 'data-ref' field. Read more at
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
     *
     */
    receivedAuthentication(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        var passThroughParam = event.optin.ref;

        console.log("Received authentication for user %d and page %d with pass " +
            "through param '%s' at %d", senderID, recipientID, passThroughParam,
            timeOfAuth);

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.sendTextMessage(senderID, "Authentication successful");
    }

    /*
     * Message Event
     *
     * This event is called when a message is sent to your page. The 'message'
     * object format can vary depending on the kind of message that was received.
     * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
     *
     * For this example, we're going to echo any text that we get. If we get some
     * special keywords ('button', 'generic', 'receipt'), then we'll send back
     * examples of those bubbles to illustrate the special message bubbles we've
     * created. If we receive a message with an attachment (image, video, audio),
     * then we'll simply confirm that we've received the attachment.
     *
     */
    receivedMessage(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfMessage = event.timestamp;
        var message = event.message;

        console.log(JSON.stringify(event));

        console.log("Received message for user %d and page %d at %d with message:",
            senderID, recipientID, timeOfMessage);

        // var isEcho = message.is_echo;
        var messageId = message.mid;
        var appId = message.app_id;
        var metadata = message.metadata;

        // You may get a text or attachment but not both
        var messageText = message.text;
        var messageAttachments = message.attachments;

        const handlers = [
            {
                // buy 100 Apple
                command: /^buy ([0-9]+) ([0-9a-zA-Z ]+)$/i,
                action: (numOfShares, stockName) => {
                    this.sendTextMessage(senderID, `Bought ${numOfShares} shares of ${stockName}`);
                }
            },
            {
                // buy $100 Apple
                command: /^buy \$([0-9]+) ([0-9a-zA-Z ]+)$/i,
                action: (dollars, stockName) => {
                    this.sendTextMessage(senderID, `Bought 20 shares of ${stockName} worth $${dollars}`);
                }
            },
            {
                // sell 100 Apple
                command: /^sell ([0-9]+) ([0-9a-zA-Z ]+)$/i,
                action: (numOfShares, stockName) => {
                    this.sendTextMessage(senderID, `Sold ${numOfShares} shares of ${stockName}`);
                }
            },
            {
                // buy $100 Apple
                command: /^sell \$([0-9]+) ([0-9a-zA-Z ]+)$/i,
                action: (dollars, stockName) => {
                    this.sendTextMessage(senderID, `Sold 20 shares of ${stockName} worth $${dollars}`);
                }
            },
            {
                //list orders
                command : /^list orders$/i,
                action: () => {
                    this.sendTextMessage(senderID, `List all orders`);
                }
            },
            {
                //get stock price
                command : /^get ([0-9a-zA-Z ]+)$/i,
                action: (stockName) => {
                    this.sendTextMessage(senderID, `${stockName} : $127.65`);
                }
            },
            {
                //cancel orders
                command : /^cancel order/i,
                action: () => {
                    this.sendTextMessage(senderID, `cancel current order`);
                }
            }
        ];

        for (let handler of handlers) {
            let results = messageText.match(handler.command);
            if (results) {
                let params = results.slice(1);
                console.log(results);
                handler.action.apply(this, params);
                return;
            }
        }

        this.sendTextMessage(senderID, messageText);
    }


    /*
     * Delivery Confirmation Event
     *
     * This event is sent to confirm the delivery of a message. Read more about
     * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
     *
     */
    receivedDeliveryConfirmation(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var delivery = event.delivery;
        var messageIDs = delivery.mids;
        var watermark = delivery.watermark;
        var sequenceNumber = delivery.seq;

        if (messageIDs) {
            messageIDs.forEach((messageID) => {
                    console.log("Received delivery confirmation for message ID: %s",
                        messageID);
                }
            );
        }

        console.log("All message before %d were delivered.", watermark);
    }


    /*
     * Postback Event
     *
     * This event is called when a postback is tapped on a Structured Message.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
     *
     */
    receivedPostback(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;
        var timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        var payload = event.postback.payload;

        console.log("Received postback for user %d and page %d with payload '%s' " +
            "at %d", senderID, recipientID, payload, timeOfPostback);

        // When a postback is called, we'll send a message back to the sender to
        // let them know it was successful
        this.sendTextMessage(senderID, "Postback called");
    }

    /*
     * Message Read Event
     *
     * This event is called when a previously-sent message has been read.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
     *
     */
    receivedMessageRead(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        var watermark = event.read.watermark;
        var sequenceNumber = event.read.seq;

        console.log("Received message read event for watermark %d and sequence " +
            "number %d", watermark, sequenceNumber);
    }

    /*
     * Account Link Event
     *
     * This event is called when the Link Account or UnLink Account action has been
     * tapped.
     * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
     *
     */
    receivedAccountLink(event) {
        var senderID = event.sender.id;
        var recipientID = event.recipient.id;

        var status = event.account_linking.status;
        var authCode = event.account_linking.authorization_code;

        console.log("Received account link event with for user %d with status %s " +
            "and auth code %s ", senderID, status, authCode);
    }

    /*
     * Send an image using the Send API.
     *
     */
    sendImageMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: this.SERVER_URL + "/assets/rift.png"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a Gif using the Send API.
     *
     */
    sendGifMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        url: this.SERVER_URL + "/assets/instagram_logo.gif"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send audio using the Send API.
     *
     */
    sendAudioMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "audio",
                    payload: {
                        url: this.SERVER_URL + "/assets/sample.mp3"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a video using the Send API.
     *
     */
    sendVideoMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "video",
                    payload: {
                        url: this.SERVER_URL + "/assets/allofus480.mov"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a file using the Send API.
     *
     */
    sendFileMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "file",
                    payload: {
                        url: this.SERVER_URL + "/assets/test.txt"
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a text message using the Send API.
     *
     */
    sendTextMessage(recipientId, messageText) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: messageText,
                metadata: "DEVELOPER_DEFINED_METADATA"
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a button message using the Send API.
     *
     */
    sendButtonMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "This is test text",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Trigger Postback",
                            payload: "DEVELOPER_DEFINED_PAYLOAD"
                        }, {
                            type: "phone_number",
                            title: "Call Phone Number",
                            payload: "+16505551234"
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a Structured Message (Generic Message type) using the Send API.
     *
     */
    sendGenericMessage(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [{
                            title: "rift",
                            subtitle: "Next-generation virtual reality",
                            item_url: "https://www.oculus.com/en-us/rift/",
                            image_url: this.SERVER_URL + "/assets/rift.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/rift/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for first bubble",
                            }],
                        }, {
                            title: "touch",
                            subtitle: "Your Hands, Now in VR",
                            item_url: "https://www.oculus.com/en-us/touch/",
                            image_url: this.SERVER_URL + "/assets/touch.png",
                            buttons: [{
                                type: "web_url",
                                url: "https://www.oculus.com/en-us/touch/",
                                title: "Open Web URL"
                            }, {
                                type: "postback",
                                title: "Call Postback",
                                payload: "Payload for second bubble",
                            }]
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a receipt message using the Send API.
     *
     */
    sendReceiptMessage(recipientId) {
        // Generate a random receipt ID as the API requires a unique ID
        var receiptId = "order" + Math.floor(Math.random() * 1000);

        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "receipt",
                        recipient_name: "Peter Chang",
                        order_number: receiptId,
                        currency: "USD",
                        payment_method: "Visa 1234",
                        timestamp: "1428444852",
                        elements: [{
                            title: "Oculus Rift",
                            subtitle: "Includes: headset, sensor, remote",
                            quantity: 1,
                            price: 599.00,
                            currency: "USD",
                            image_url: this.SERVER_URL + "/assets/riftsq.png"
                        }, {
                            title: "Samsung Gear VR",
                            subtitle: "Frost White",
                            quantity: 1,
                            price: 99.99,
                            currency: "USD",
                            image_url: this.SERVER_URL + "/assets/gearvrsq.png"
                        }],
                        address: {
                            street_1: "1 Hacker Way",
                            street_2: "",
                            city: "Menlo Park",
                            postal_code: "94025",
                            state: "CA",
                            country: "US"
                        },
                        summary: {
                            subtotal: 698.99,
                            shipping_cost: 20.00,
                            total_tax: 57.67,
                            total_cost: 626.66
                        },
                        adjustments: [{
                            name: "New Customer Discount",
                            amount: -50
                        }, {
                            name: "$100 Off Coupon",
                            amount: -100
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a message with Quick Reply buttons.
     *
     */
    sendQuickReply(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: "What's your favorite movie genre?",
                quick_replies: [
                    {
                        "content_type": "text",
                        "title": "Action",
                        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
                    },
                    {
                        "content_type": "text",
                        "title": "Comedy",
                        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
                    },
                    {
                        "content_type": "text",
                        "title": "Drama",
                        "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
                    }
                ]
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a read receipt to indicate the message has been read
     *
     */
    sendReadReceipt(recipientId) {
        console.log("Sending a read receipt to mark message as seen");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "mark_seen"
        };

        this.callSendAPI(messageData);
    }

    /*
     * Turn typing indicator on
     *
     */
    sendTypingOn(recipientId) {
        console.log("Turning typing indicator on");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_on"
        };

        this.callSendAPI(messageData);
    }

    /*
     * Turn typing indicator off
     *
     */

    sendTypingOff(recipientId) {
        console.log("Turning typing indicator off");

        var messageData = {
            recipient: {
                id: recipientId
            },
            sender_action: "typing_off"
        };

        this.callSendAPI(messageData);
    }

    /*
     * Send a message with the account linking call-to-action
     *
     */
    sendAccountLinking(recipientId) {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: "Welcome. Link your account.",
                        buttons: [{
                            type: "account_link",
                            url: this.SERVER_URL + "/authorize"
                        }]
                    }
                }
            }
        };

        this.callSendAPI(messageData);
    }

    /*
     * Call the Send API. The message data goes in the body. If successful, we'll
     * get the message id in a response
     *
     */
    callSendAPI(messageData) {
        console.log(JSON.stringify({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: this.PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: messageData

        }));
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: this.PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: messageData

        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                }
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
    }
};
