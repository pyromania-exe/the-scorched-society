const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('logtraining')
    .setDescription('Create a formatted training log')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Type of training')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('host')
        .setDescription('Mention the host')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('cohost')
        .setDescription('Mention the co-host or type "none"')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('attendees')
        .setDescription('List all attendees')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('starttime')
        .setDescription('Start time with time zone')
        .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Use this for global commands (may take up to 1 hour to appear)
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })

// Or use this for instant guild commands (replace GUILD_ID)
  // rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })

  .then(() => console.log('✅ Slash command registered!'))
  .catch(console.error);
