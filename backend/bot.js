console.log('Bot script started...');
console.log('Loaded token:', process.env.DISCORD_TOKEN);
const { Client, GatewayIntentBits, Partials, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const db = require('./database');
const dayjs = require('dayjs');
const crypto = require('crypto');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const RATE_LIMIT_MS = 1000 * 60 * 3; // 3 minutes
const recentOpens = new Map();

function genTicketId() {
  return crypto.randomBytes(3).toString('hex');
}

async function findStaffRole(guild) {
  const name = process.env.STAFF_ROLE_NAME || 'Staff';
  return guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase()) || guild.roles.cache.find(r => /mod|staff|admin/i.test(r.name));
}

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
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'announce-train') {
        const type = interaction.options.getString('type');
        const host = interaction.options.getString('host');
        const cohost = interaction.options.getString('cohost');
        const attendees = interaction.options.getString('attendees');
        const startTime = interaction.options.getString('starttime');

        const log = `📋 **${type} Training**\n**Host:** ${host}\n**Co-Host:** ${cohost}\n**Attendees:** ${attendees}\n**Start Time:** ${startTime}`;

        await interaction.reply({ content: log, ephemeral: false });
        return;
      }

      if (interaction.commandName === 'train-conclusion') {
        const attendees = interaction.options.getString('attendees');
        const endTime = interaction.options.getString('endtime');
        const passed = interaction.options.getString('passed');

        const message = `**Training Conclusion**\nAttendees: ${attendees}\nEnd Time: ${endTime}\nPassed: ${passed}`;
        await interaction.reply({ content: message, ephemeral: false });
        return;
      }

      if (interaction.commandName === 'ticket') {
        const sub = interaction.options.getSubcommand();
        
        if (sub === 'open') {
          const type = interaction.options.getString('type');
          const description = interaction.options.getString('description');

          const last = recentOpens.get(interaction.user.id);
          if (last && Date.now() - last < RATE_LIMIT_MS) {
            return interaction.reply({ content: `Please wait before opening another ticket.`, ephemeral: true });
          }

          await interaction.deferReply({ ephemeral: true });

          const ticketId = genTicketId();
          const guild = interaction.guild;
          const everyone = guild.roles.everyone;
          const staffRole = await findStaffRole(guild);

          const overwrites = [
            { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
          ];
          if (staffRole) overwrites.push({ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

          const channel = await guild.channels.create({
            name: `ticket-${ticketId}`,
            type: ChannelType.GuildText,
            topic: `Ticket ${ticketId} • ${type} • ${interaction.user.tag}`,
            permissionOverwrites: overwrites
          });

          db.createTicket({ id: ticketId, channelId: channel.id, userId: interaction.user.id, type, description, status: 'open', createdAt: Date.now() });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`claim_${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`close_${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Danger)
          );

          const embed = new EmbedBuilder()
            .setTitle(`Ticket ${ticketId}`)
            .addFields(
              { name: 'User', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Type', value: type, inline: true },
              { name: 'Description', value: description || 'No description' }
            )
            .setTimestamp();

          try { await channel.send({ content: staffRole ? `<@&${staffRole.id}>` : undefined, embeds: [embed], components: [row] }); } catch (e) { /* ignore send errors */ }

          await interaction.editReply({ content: `Your ticket has been created: ${channel}`, ephemeral: true });

          recentOpens.set(interaction.user.id, Date.now());
          setTimeout(() => recentOpens.delete(interaction.user.id), RATE_LIMIT_MS);
          return;
        }

        if (sub === 'close') {
          await interaction.deferReply({ ephemeral: true });
          const provided = interaction.options.getString('ticket_id');
          let ticket = null;
          if (provided) {
            ticket = db.getTicketById(provided) || db.getTicketByChannel(provided.replace(/[^0-9]/g, ''));
          } else {
            ticket = db.getTicketByChannel(interaction.channelId);
          }

          if (!ticket) return interaction.editReply({ content: 'Ticket not found in DB.' });
          if (ticket.status === 'closed') return interaction.editReply({ content: 'Ticket is already closed.' });

          const channel = interaction.guild.channels.cache.get(ticket.channelId);
          if (channel) {
            const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
            const transcript = messages ? Array.from(messages.values()).reverse().map(m => `[${dayjs(m.createdTimestamp).format('YYYY-MM-DD HH:mm')}] ${m.author.tag}: ${m.content}`).join('\n') : 'No messages';
            const modLog = process.env.MOD_LOG_CHANNEL_ID ? await interaction.guild.channels.fetch(process.env.MOD_LOG_CHANNEL_ID).catch(() => null) : null;
            if (modLog) {
              await modLog.send({ content: `Transcript for ticket ${ticket.id} (partial):\n${transcript.slice(0, 1800)}` }).catch(() => null);
            }
            await channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: false }).catch(() => null);
            await channel.setName(`closed-${ticket.id}`).catch(() => null);
          }

          db.closeTicket(ticket.id, Date.now(), interaction.user.id);
          await interaction.editReply({ content: `Ticket ${ticket.id} closed.` });
          return;
        }

        if (sub === 'list') {
          const staffRole = await findStaffRole(interaction.guild);
          if (staffRole && !interaction.member.roles.cache.has(staffRole.id)) return interaction.reply({ content: 'You do not have permission to run this.', ephemeral: true });
          const open = db.listOpen();
          if (!open.length) return interaction.reply({ content: 'No open tickets.', ephemeral: true });
          const lines = open.slice(0, 10).map(t => `${t.id} • <@${t.userId}> • <#${t.channelId}> • ${t.type}`).join('\n');
          return interaction.reply({ content: `Open tickets:\n${lines}`, ephemeral: true });
        }
      }
    }

    if (interaction.isButton()) {
      const [action, ticketId] = interaction.customId.split('_');
      const ticket = db.getTicketById(ticketId);
      if (!ticket) return interaction.reply({ content: 'Ticket not found.', ephemeral: true });

      if (action === 'claim') {
        db.closeTicket(ticketId, ticket.closedAt || null, interaction.user.id);
        const t = db.getTicketById(ticketId);
        if (t && t.status === 'closed' && !t.closedAt) {
          const Database = require('better-sqlite3');
          const conn = new Database('./tickets.db');
          conn.prepare(`UPDATE tickets SET status='open' WHERE id = ?`).run(ticketId);
          conn.close();
        }
        await interaction.update({ content: `Claimed by <@${interaction.user.id}>`, components: [] });
        return;
      }

      if (action === 'close') {
        const channel = interaction.channel;
        const transcripts = await channel.messages.fetch({ limit: 100 }).catch(() => null);
        const transcript = transcripts ? Array.from(transcripts.values()).reverse().map(m => `[${dayjs(m.createdTimestamp).format('YYYY-MM-DD HH:mm')}] ${m.author.tag}: ${m.content}`).join('\n') : 'No messages';
        const modLog = process.env.MOD_LOG_CHANNEL_ID ? await interaction.guild.channels.fetch(process.env.MOD_LOG_CHANNEL_ID).catch(() => null) : null;
        if (modLog) await modLog.send({ content: `Transcript for ticket ${ticketId} (partial):\n${transcript.slice(0, 1800)}` }).catch(() => null);
        await channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: false }).catch(() => null);
        await channel.setName(`closed-${ticketId}`).catch(() => null);
        db.closeTicket(ticketId, Date.now(), interaction.user.id);
        await interaction.update({ content: `Closed by <@${interaction.user.id}>`, components: [] });
        return;
      }
    }
  } catch (err) {
    console.error('Interaction error', err);
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp({ content: 'An error occurred.', ephemeral: true });
      else await interaction.reply({ content: 'An error occurred.', ephemeral: true });
    } catch (e) { /* ignore reply errors */ }
  }
});
