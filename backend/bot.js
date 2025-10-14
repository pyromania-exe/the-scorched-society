console.log('Bot script started...');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ✅ Properly chained .catch
client.login(process.env.DISCORD_TOKEN)
  .catch(err => console.error('Login error:', err));

module.exports = client;
