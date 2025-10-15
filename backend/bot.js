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
client.on('messageCreate', async (message) => {
  if (message.content === '!logtraining') {
    const filter = (m) => m.author.id === message.author.id;
    const channel = message.channel;

    const ask = async (prompt) => {
      await channel.send(prompt);
      const collected = await channel.awaitMessages({ filter, max: 1, time: 60000 });
      return collected.first()?.content || 'N/A';
    };

    const type = await ask('📌 What type of training? (Combat / Knowledge / Combat and Knowledge). Add “Advanced” if needed.');
    const host = await ask('👤 Who is the host? (mention them)');
    const cohost = await ask('🧍 Who is the co-host? (mention or type “none”)');
    const attendees = await ask('👥 List all attendees (mention them or type names)');
    const startTime = await ask('⏰ What time did it start? Include your time zone (e.g. 16:00 EDT)');
    const passed = await ask('✅ Who passed? (ALL / NONE / Combat / Knowledge)');

    const log = `📋 **Training Log**
**Type:** ${type}
**Host:** ${host}
**Co-Host:** ${cohost}
**Attendees:** ${attendees}
**Start Time:** ${startTime}
**Passed:** ${passed}`;

    channel.send(log);
  }
});
