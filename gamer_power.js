const _ = require("lodash");
const fetch = require("node-fetch");
const { MessageEmbed } = require("discord.js");

async function sendGameToChannel(client, channel_name, game) {
  const channel = await client.channels.fetch(channel_name);

  const gameEmbed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(game.title)
    .setURL(game.open_giveaway_url)
    .setDescription(game.description)
    .setThumbnail(game.thumbnail)
    .addField("Plataformas", game.platforms, true)
    .addField("Tipo", game.type, true)
    .setImage(game.thumbnail)
    .setTimestamp();

  channel.send(gameEmbed);
}

async function checkNewPublishedGames(client, channel, last_time_check) {
  api_endpoint = "https://www.gamerpower.com/api/giveaways";

  const response = await fetch(api_endpoint).then((res) => res.json());

  new_games = _.filter(response, function filter_already_notified_games(game) {
    published_date = new Date(game.published_date + " GMT +2").getTime();
    return published_date > last_time_check;
  });
  /** 
   * We need to filter PC games since the api has an error where some PC
   * games aren't shown while using the platform filter on the giveaways endpoint
   * https://www.gamerpower.com/api/giveaways?platform=pc
  */
  new_games = _.filter(new_games, function filter_pc_games(game) {
    return game.platforms.includes('PC');
  });
  new_games.forEach((game) => {
    sendGameToChannel(client, channel, game);
  });
}

module.exports = function initGamerPower(client, channel) {
  //the first last_time_check should come from some memory storage instead of
  //being created in the runtime in case bot is restarted
  let last_time_check = new Date().getTime();
  const five_minutes = 5 * 60 * 1000;

  checkNewPublishedGames(client, channel, last_time_check);
  last_time_check = new Date().getTime();
  setInterval(() => {
    checkNewPublishedGames(client, channel, last_time_check);
    last_time_check = new Date().getTime();
  }, five_minutes);
};
