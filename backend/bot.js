console.log('Bot script started...');
console.log('Loaded token:', process.env.DISCORD_TOKEN);
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{
      name: 'clensing the corrupt minded',
      type: 0
    }],
    status: 'dnd'
  });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.patch('/users/@me', {
      body: {
        bio: 'the scorched shall rise from the ashes'
      }
    });
    console.log('Bot bio updated successfully.');
  } catch (error) {
    console.error('Failed to update bot bio:', error);
  }
});

client.login(process.env.DISCORD_TOKEN)
  .catch(err => console.error('Login error:', err));

module.exports = client;
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content !== '!announce-train') return;

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

    for (const msg of prompts) {
      try { await msg.delete(); } catch (e) { }
    }

    const log = `📋 **${type} Training**\n**Host:** ${host}\n**Co-Host:** ${cohost}\n**Attendees:** ${attendees}\n**Start Time:** ${startTime}`;
    await channel.send({ content: log });
  } catch (err) {
      for (const msg of prompts) {
        try { await msg.delete(); } catch (e) { }
      }
    channel.send('⏱️ Training logging timed out. Please run `!announce-train` again when ready.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'announce-train') {
    const type = interaction.options.getString('type');
    const host = interaction.options.getString('host');
    const cohost = interaction.options.getString('cohost');
    const attendees = interaction.options.getString('attendees');
    const startTime = interaction.options.getString('starttime');

    const log = `📋 **${type} Training**\n**Host:** ${host}\n**Co-Host:** ${cohost}\n**Attendees:** ${attendees}\n**Start Time:** ${startTime}`;

    await interaction.reply({ content: log, ephemeral: false });
  }
  if (interaction.commandName === 'train-conclusion') {
    const attendees = interaction.options.getString('attendees');
    const endTime = interaction.options.getString('endtime');
    const passed = interaction.options.getString('passed');

    const message = `**Training Conclusion**\nAttendees: ${attendees}\nEnd Time: ${endTime}\nPassed: ${passed}`;
    await interaction.reply({ content: message, ephemeral: false });
  }
});
