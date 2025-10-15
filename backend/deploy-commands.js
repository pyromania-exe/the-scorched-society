const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config({ path: './backend/.env' });

const commands = [
  new SlashCommandBuilder()
    .setName('announce-train')
    .setDescription('Create a formatted training log')
    .addStringOption(opt =>
      opt.setName('type').setDescription('Type of training').setRequired(true))
    .addStringOption(opt =>
      opt.setName('host').setDescription('Mention the host').setRequired(true))
    .addStringOption(opt =>
      opt.setName('cohost').setDescription('Mention the co-host or type "none"').setRequired(true))
    .addStringOption(opt =>
      opt.setName('attendees').setDescription('List all attendees').setRequired(true))
    .addStringOption(opt =>
      opt.setName('starttime').setDescription('Start time with time zone').setRequired(true))
  ,
  new SlashCommandBuilder()
    .setName('train-conclusion')
    .setDescription('Announce the conclusion of a training session')
    .addStringOption(opt =>
      opt.setName('attendees')
        .setDescription('List all attendees')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('endtime')
        .setDescription('End time with time zone')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('passed')
        .setDescription('Who passed (Combat / Knowledge / Both / None)')
        .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body: commands }
)
.then(() => console.log('✅ Slash command registered for guild!'))
.catch(console.error);
