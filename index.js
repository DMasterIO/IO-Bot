require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();

const initGamerPower = require("./gamer_power");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  initGamerPower(client, process.env.GAMER_POWER_CHANNEL_ID);
});

client.on("message", (message) => {
  // If the message is '!rip'
  if (message.content === "!rip") {
    // Create the attachment using MessageAttachment
    const attachment = new Discord.MessageAttachment(
      "https://i.imgur.com/w3duR07.png"
    );
    // Send the attachment in the message channel
    message.channel.send(attachment);
  }
  if (message.content === "what is my avatar") {
    // Send the user's avatar URL
    message.reply(message.author.displayAvatarURL());
  }
});

client.login(process.env.BOT_TOKEN);
