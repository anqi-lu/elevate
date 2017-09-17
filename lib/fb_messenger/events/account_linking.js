'use strict';

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
module.exports = (event) => {
    const senderID = event.sender.id;
    const recipientID = event.recipient.id;

    const status = event.account_linking.status;
    const authCode = event.account_linking.authorization_code;

    console.log("Received account link event with for user %d with status %s " +
        "and auth code %s ", senderID, status, authCode);
});