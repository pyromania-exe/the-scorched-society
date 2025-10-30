const Database = require('better-sqlite3');
const db = new Database('./tickets.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  channelId TEXT NOT NULL,
  userId TEXT NOT NULL,
  type TEXT,
  description TEXT,
  status TEXT NOT NULL,
  claimerId TEXT,
  createdAt INTEGER NOT NULL,
  closedAt INTEGER
)`).run();

module.exports = {
  createTicket: (ticket) => db.prepare(`INSERT INTO tickets (id,channelId,userId,type,description,status,createdAt) VALUES (@id,@channelId,@userId,@type,@description,@status,@createdAt)`).run(ticket),
  getTicketById: (id) => db.prepare(`SELECT * FROM tickets WHERE id = ?`).get(id),
  getTicketByChannel: (channelId) => db.prepare(`SELECT * FROM tickets WHERE channelId = ?`).get(channelId),
  listOpen: () => db.prepare(`SELECT * FROM tickets WHERE status = 'open' ORDER BY createdAt DESC`).all(),
  closeTicket: (id, closedAt, claimerId) => db.prepare(`UPDATE tickets SET status='closed', closedAt=@closedAt, claimerId=@claimerId WHERE id=@id`).run({ id, closedAt, claimerId }),
};
