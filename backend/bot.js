console.log('Bot script started...');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ✅ Properly chained .catch
client.login(process.env.DISCORD_TOKEN)
  .catch(err => console.error('Login error:', err));

module.exports = client;
client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // ignore bots
  if (message.content !== '!logtraining') return;

  // optional: restrict to a role or permissions (uncomment if needed)
  // if (!message.member.permissions.has('MANAGE_MESSAGES')) return;

  const filter = (m) => m.author.id === message.author.id;
  const channel = message.channel;
  const prompts = [];

  const ask = async (prompt) => {
    const sent = await channel.send(prompt);
    prompts.push(sent);
    const collected = await channel.awaitMessages({ filter, max: 1, time: 60000 });
    const reply = collected.first();
    if (reply) prompts.push(reply);
    return reply?.content || 'N/A';
  };

  try {
    const type = await ask('📌 What type of training? (Combat / Knowledge / Combat and Knowledge). Add “Advanced” if needed.');
    const host = await ask('👤 Who is the host? (mention them)');
    const cohost = await ask('🧍 Who is the co-host? (mention or type “none”)');
    const attendees = await ask('👥 List all attendees (mention them or type names)');
    const startTime = await ask('⏰ What time did it start? Include your time zone (e.g. 16:00 EDT)');

    // Delete all prompt and reply messages (best-effort)
    for (const msg of prompts) {
      try { await msg.delete(); } catch (e) { /* ignore */ }
    }

    const log = `📋 **${type} Training**\n**Host:** ${host}\n**Co-Host:** ${cohost}\n**Attendees:** ${attendees}\n**Start Time:** ${startTime}`;
    await channel.send({ content: log });
  } catch (err) {
    // If user didn't reply in time, inform and clean up
    for (const msg of prompts) {
      try { await msg.delete(); } catch (e) { /* ignore */ }
    }
    channel.send('⏱️ Training logging timed out. Please run `!logtraining` again when ready.');
  }
});
