'use strict';

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can consty depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
module.exports = (event) => new Promise((resolve, reject) => {
    const senderID = event.sender.id; //facebook user id
    const recipientID = event.recipient.id; //page id, always constant
    const timeOfMessage = event.timestamp;
    const message = event.message;

    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    const isEcho = message.is_echo;
    const messageId = message.mid;
    const appId = message.app_id;
    const metadata = message.metadata;

    // You may get a text or attachment but not both
    const messageText = message.text;
    const messageAttachments = message.attachments;
    const quickReply = message.quick_reply;

    // get the state of the user
    const user = 

    if (isEcho) {
        // Just logging message echoes to console
        console.log("Received echo for message %s and app %d with metadata %s",
            messageId, appId, metadata);
        return;
    } else if (quickReply) {
        const quickReplyPayload = quickReply.payload;
        console.log("Quick reply for message %s with payload %s",
            messageId, quickReplyPayload);

        sendTextMessage(senderID, "Quick reply tapped");
        return;
    }

    if (messageText)
        const handlers = [
            {
                command: /^buy ([0-9a-zA-Z ]+)$/i,
                action: (stockName) => {
                    sendTextMessage(senderID, `Ha ha ha ${stockName}`);
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

    {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
            case 'image':
                sendImageMessage(senderID);
                break;

            case 'gif':
                sendGifMessage(senderID);
                break;

            case 'audio':
                sendAudioMessage(senderID);
                break;

            case 'video':
                sendVideoMessage(senderID);
                break;

            case 'file':
                sendFileMessage(senderID);
                break;

            case 'button':
                sendButtonMessage(senderID);
                break;

            case 'generic':
                sendGenericMessage(senderID);
                break;

            case 'receipt':
                sendReceiptMessage(senderID);
                break;

            case 'quick reply':
                sendQuickReply(senderID);
                break;

            case 'read receipt':
                sendReadReceipt(senderID);
                break;

            case 'typing on':
                sendTypingOn(senderID);
                break;

            case 'typing off':
                sendTypingOff(senderID);
                break;

            case 'account linking':
                sendAccountLinking(senderID);
                break;

            default:
                sendTextMessage(senderID, messageText);
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
});