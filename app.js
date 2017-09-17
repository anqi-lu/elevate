const MessengerController = require('./controllers/messenger.controller');

const express = require('express');

const bodyParser = require('body-parser');
const showdown = require('showdown');
const converter = new showdown.Converter();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = fs.existsSync('./config.json') ? require('./config') : {}
Object.assign(process.env, config);


var app = express();
module.exports = app;

// mongoose.connect(process.env.MONGO_URI, {
//     user: process.env.MONGO_USER,
//     pass: process.env.MONGO_PASS,
//     promiseLibrary: bluebird,
//     useMongoClient: true
// });

app.set('port', process.env.PORT);
app.use(bodyParser.json());

app.get('/*.md', function (req, res) {
    const filename_parts = req.url.split('/');
    console.log('filename_partrs', filename_parts);
    const path_parts = [__dirname, 'public'].concat(filename_parts);

    fs.readFile(path.join.apply(this, path_parts), 'utf-8', function (err, data) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(converter.makeHtml(data));
    });
});

app.use(express.static('public'));

const messengerController = new MessengerController(app);

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), () => {
    console.log('Node app is running on port', app.get('port'));
});