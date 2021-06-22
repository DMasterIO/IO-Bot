require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();

const initGamerPower = require("./gamer_power");

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  initGamerPower(client, process.env.GAMER_POWER_CHANNEL_ID);
});

client.login(process.env.BOT_TOKEN);
