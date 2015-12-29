require('dotenv').load();
var stream = require('./stream.js');

this.config = {
    'name': 'demonbot',
    'version': 'v0.0.5',
    'room': process.env.ROOM,
    'token': process.env.TOKEN,
    'keyword': 'dbot',
    'bots': ['camperbot'],
};

stream.start();