require("dotenv").config();
const Discord = require('discord.js')
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
    console.log(message);
    // If the message is '!rip'
    if (message.content === '!rip') {
        // Create the attachment using MessageAttachment
        const attachment = new Discord.MessageAttachment('https://i.imgur.com/w3duR07.png');
        // Send the attachment in the message channel
        message.channel.send(attachment);
    }
    if (message.content === 'what is my avatar') {
        // Send the user's avatar URL
        message.reply(message.author.displayAvatarURL());
    }
});

client.login(process.env.BOT_TOKEN)