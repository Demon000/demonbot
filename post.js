var https = require('https');
var bot = require('./bot.js');
var request = require('superagent');
var colors = require('colors');
var Sandbox = require('sandbox');
var s = new Sandbox();
var xkcd = require('xkcd-imgs');
var wolfram = require('wolfram-alpha')
    .createClient("T2Q98Y-WRT8A8XKQQ");
var post = {};

post.send = function(message, source)
{
    if(!message)
    {
        console.log('ERROR '.red + 'Message is empty.');
        return;
    }
    if(message.match(/thanks|thx|tanks|thank|thnx/gi))
    {
        message = `@${source.fromUser.username} Nice try.`;
    }
    request
        .post('https://api.gitter.im/v1/rooms/' + bot.config.room + '/chatMessages')
        .set(
        {
            'Authorization': 'Bearer ' + bot.config.token,
            'Content-Type': 'application/json'
        })
        .send(
        {
            'text': message
        })
        .end((err, res) =>
        {

            if(err)
            {
                console.log('ERROR '.red + err);
            }
            else
            {
                console.log('INFO'.yellow + ' Message sent succesfully.'.green);
            }
        });
};
post.command = function(msg)
{
    if(bot.config.bots.indexOf(msg.fromUser.username) != -1)
    {
        return;
    }
    msg.cleantext = post.sanitize(msg.text);

    msg.params = msg.cleantext.split(' ');

    msg.keyword = msg.params.shift();

    msg.command = msg.params.shift();

    msg.cleantext = msg.params.join(' ');

    msg.dirtytext = msg.text.replace(msg.keyword + ' ' + msg.command + ' ', '');

    if(post.commands[msg.keyword])
    {
      if(post.commands[msg.keyword][msg.command])
      {
        post.commands[msg.keyword][msg.command](msg);
      }
    }
};
post.sanitize = function(str)
{
    str = str.toLowerCase();
    str = str.replace(/\W|\_/g, ' ');
    str = str.replace(/\s+/g, ' ');
    return str;
};
post.random = function(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}
post.commands = {};
post.commands.hello = {
    world(msg)
    {
        var messages = [
            `Welcome to FCC, @${msg.fromUser.username}. Enjoy your stay.`,
            `Hi there, @${msg.fromUser.username}! Have a great time!`,
            `Enjoy your stay, but don't spend too much time on the chat, @${msg.fromUser.username}!`,
            `Welcome! *This is the warmest welcome message a bot can think of, @${msg.fromUser.username}.*`
        ];
        var data = messages[post.random(0, messages.length - 1)];
        setTimeout(() =>
        {
            post.send(data, msg);
        }, 5000);
    },
};
post.commands.dbot = {
    commands(msg)
        {
            var data = `* ${Object.keys(post.commands.dbot).join('\n* ')}`;
            post.send(data, msg);
        },
        status(msg)
        {
            var data = `All systems are online!\n${bot.config.version}`;
            post.send(data, msg);
        },
        eval(msg)
        {
            msg.dirtytext = msg.dirtytext.replace(/\`/g, '');
            console.log(msg.dirtytext);
            s.run(msg.dirtytext, output =>
            {
                var data = `@${msg.fromUser.username} \`${msg.dirtytext}\` is \`${output.result}\``;
                post.send(data, msg);
            });
        },
        wolfram(msg)
        {
            wolfram.query(msg.dirtytext, (err, results) =>
            {
                var data;

                if(results.length > 0)
                {
                    data = `@${msg.fromUser.username}`;
                    for(var i = 1; i < 5 && i < results.length; i++)
                    {
                        data += `\n* ${results[i].subpods[0].text || results[i].subpods[0].image}`;
                    }
                    post.send(data, msg);
                }
                else
                {
                    data = `@${msg.fromUser.username} The search returned no results.`;
                    post.send(data, msg);
                }
            });
        },
        mdn(msg)
        {
            request
                .get(`https://developer.mozilla.org/en-US/search.json?q=${encodeURIComponent(msg.cleantext)}`)
                .end((err, res) =>
                {
                    res = JSON.parse(res.text);
                    if(err)
                    {
                        console.log('ERROR '.red + err);
                    }
                    else
                    {
                        if(res.documents.length > 0)
                        {
                            var postdata = `@${msg.fromUser.username}\n`;

                            for(var i = 0; i < res.documents.length && i < 5; i++)
                            {
                                postdata += `* [${res.documents[i].title}](${res.documents[i].url})\n`;
                            }
                            post.send(postdata);
                        }
                        else
                        {
                            var postdata = `@${msg.fromUser.username} The search returned no results.`;
                            post.send(postdata);
                        }
                    }
                });
        },
        cat(msg)
        {
            var link = `http://thecatapi.com/api/images/get?format=src&type=jpg&randomdate=${new Date().getTime()}`;
            var data;
            request
            .get(link)
            .redirects(1)
            .end((err, res) =>
            {
              data = `![cat](${res.redirects[0]})`;
              post.send(data, msg);
            });
        },
        wiki(msg)
        {
            var link = `http://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=5
                &prop=pageimages|extracts&pilimit=max&exintro&explaintext&exsentences=1
                &exlimit=max&gsrsearch=${encodeURIComponent(msg.cleantext)}`;
            request.get(link)
                .end((err, res) =>
                {
                    if(err)
                    {
                        console.log('ERROR '.red + err);
                    }
                    else
                    {
                        var pages = JSON.parse(res.text)
                            .query.pages;
                        var postdata = `@${msg.fromUser.username}\n`;
                        console.log(pages);
                        for(var page in pages)
                        {
                            postdata += `* [${pages[page].title}](http://en.wikipedia.org/?curid=${pages[page].pageid})\n`;
                        }
                        post.send(postdata);
                    }
                });
        },
        xkcd(msg)
        {
            xkcd.img(function(err, res)
            {
                if(!err)
                {
                    var data = '![xkcd](' + res.url + ')';
                    post.send(data, msg);
                }
            });
        },
        urban(msg)
        {
          request
          .get(`api.urbandictionary.com/v0/define?term=${encodeURIComponent(msg.cleantext)}`)
          .end((err, res) =>
          {
            var result = JSON.parse(res.text).list;
            var data = `@${msg.fromUser.username}\n`;
            for(var i = 0; i < 2; i++)
            {
               data += `[${result[i].word}](${result[i].permalink})\n${result[i].definition}\n`;
            }
            post.send(data, msg);
          });
        }
};
module.exports = post;
