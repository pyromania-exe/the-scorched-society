// Register slash commands (run once or when you change commands)
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

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

(async () => {
  try {
    console.log('Registering slash commands...');
  // Register to a specific guild for faster updates during development
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, '1425690822841466902'), { body: commands });
    console.log('Slash command registered');
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
})();
