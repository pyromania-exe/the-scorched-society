
const path = require('path');
const express = require('express');
const cors = require('cors');
const client = require('./bot');

// Register guild slash commands at startup (deploy-commands uses backend/.env)
try { require('./deploy-commands'); } catch (e) { console.warn('deploy-commands not executed:', e.message); }

const app = express();
app.use(cors());

// Serve static files from the public folder (frontend build/served files)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serve assets (images, etc.) from the repo-level assets folder at /assets
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

let isBotReady = false;

client.once('ready', () => {
  console.log(`Bot is ready in server.js`);
  isBotReady = true;
});

app.get('/members', async (req, res) => {
  if (!isBotReady) {
    return res.status(503).send('Bot not ready yet');
  }

  try {
    const guild = client.guilds.cache.get('1425690822841466902'); // Replace with your actual server ID
    if (!guild) {
      return res.status(404).send('Guild not found');
    }

    await guild.members.fetch();

    const filtered = guild.members.cache.filter(member =>
      !member.roles.cache.some(role => role.name.toLowerCase() === 'bot')
    );
    
    const members = filtered.map(member => ({
      displayName: member.displayName,
      role: member.roles.highest.name,
      rolePosition: member.roles.highest.position,
      avatar: member.user.displayAvatarURL({ size: 64, dynamic: true })
    }));

    // Sort by role position descending (highest role first)
    members.sort((a, b) => b.rolePosition - a.rolePosition);

    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).send('Internal server error');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
