var https = require('https');
var colors = require('colors');
var bot = require('./bot.js');
var post = require('./post.js');

var stream = {};
stream.start = function()
{
    var params =
    {
        'hostname': 'stream.gitter.im',
        'port': 443,
        'path': '/v1/rooms/' + bot.config.room + '/chatMessages',
        'method': 'GET',
        'headers':
        {
            'Authorization': 'Bearer ' + bot.config.token
        },
    };

    var req = https.request(params, res =>
    {
        var resdata = '';

        res.on('data', chunk =>
        {
            resdata += chunk.toString();
            try
            {
                var data = JSON.parse(resdata);

                console.log(`${data.fromUser.username.green} ${data.text.red}`);

                try
                {
                    post.command(data);
                }
                catch(err)
                {
                    throw err;
                }
                resdata = '';
            }
            catch(err)
            {

            }
        });

        req.on('error', function(e)
        {
            console.log('ERROR '.red + e.message);
        });
    });
    req.end();
}

module.exports = stream;
