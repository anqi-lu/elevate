'use strict';

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
module.exports = (event) => new Promise((resolve, reject) => {
    return resolve();
    //const senderID = event.sender.id;
    //const recipientID = event.recipient.id;
    //const delivery = event.delivery;
    //const messageIDs = delivery.mids;
    //const watermark = delivery.watermark;
    //const sequenceNumber = delivery.seq;

    //if (messageIDs) {
    //    for (const messageID of messageIDs) {
    //        console.log("Received delivery confirmation for message ID: %s",
    //            messageID);
    //    });
    //}

    //console.log("All message before %d were delivered.", watermark);
});


///*
// * Message Read Event
// *
// * This event is called when a previously-sent message has been read.
// * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
// * 
// */
//function receivedMessageRead(event) {
//    const senderID = event.sender.id;
//    const recipientID = event.recipient.id;

//    // All messages before watermark (a timestamp) or sequence have been seen.
//    const watermark = event.read.watermark;
//    const sequenceNumber = event.read.seq;

//    console.log("Received message read event for watermark %d and sequence " +
//        "number %d", watermark, sequenceNumber);
//}