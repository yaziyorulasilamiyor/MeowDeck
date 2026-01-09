const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');


let win;      
function createWindow() {
    win = new BrowserWindow({
        width: 1132,
        height: 962,
        resizable: false,
        backgroundColor: '#0f0a1e',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadFile('index.html');
}
let db, dbPath;     

function initDB() {
    dbPath = path.join(app.getPath('userData'), 'kedi.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = wal');

    db.exec(`
    CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name   TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

   
    const hasPersonality = db.prepare(
        `SELECT 1 FROM pragma_table_info('cats') WHERE name='personality'`
    ).get();

    if (!hasPersonality) {
        db.exec(`ALTER TABLE cats ADD COLUMN personality TEXT;`);
    }
    function ensureColumn(colName, colDefSql) {
        const has = db.prepare(
            `SELECT 1 FROM pragma_table_info('cats') WHERE name=?`
        ).get(colName);
        if (!has) db.exec(`ALTER TABLE cats ADD COLUMN ${colDefSql};`);
    }

    ensureColumn("adopted_at", "adopted_at INTEGER");   
    ensureColumn("happiness", "happiness INTEGER DEFAULT 2");
    ensureColumn("cleanliness", "cleanliness INTEGER DEFAULT 2");
    ensureColumn("hunger", "hunger INTEGER DEFAULT 2");
    ensureColumn("energy", "energy INTEGER DEFAULT 2");

    console.log('DB ready at:', dbPath);
}
function registerIpc() {
    console.log('[main] registering IPC...');

    ipcMain.handle('cat.upsert', (e, payload) => {
        const { id, name, avatar, personality, adopted_at, happiness, cleanliness, hunger, energy } = payload;


        if (id) {
            db.prepare(`
      UPDATE cats
    SET name        = COALESCE(?, name),
    avatar      = COALESCE(?, avatar),
    personality = COALESCE(?, personality),
    adopted_at  = COALESCE(?, adopted_at),
    happiness   = COALESCE(?, happiness),
    cleanliness = COALESCE(?, cleanliness),
    hunger      = COALESCE(?, hunger),
    energy      = COALESCE(?, energy)
    WHERE id = ?

    `).run(
        name ?? null,
        avatar ?? null,
        personality ?? null,
        adopted_at ?? null,
        happiness ?? null,
        cleanliness ?? null,
        hunger ?? null,
        energy ?? null,
        id
    );

            return id;
        } else {
            const info = db.prepare(`
      INSERT INTO cats (name, avatar, personality, adopted_at, happiness, cleanliness, hunger, energy)
        VALUES (?,?,?,?,?,?,?,?)

    `).run(
        name ?? "Pofuduk",
        avatar ?? "white",
        personality ?? null,
        adopted_at ?? Date.now(),
        happiness ?? 2,
        cleanliness ?? 2,
        hunger ?? 2,
        energy ?? 2
    );
        }
    });
    ipcMain.handle('cat.getById', (e, id) => {
        return db.prepare(`SELECT * from cats where id = ?`).get(id);
    });
    ipcMain.handle(`cat.list`, () => {
        return db.prepare(`SELECT * from cats ORDER BY id ASC`).all();
    });
    ipcMain.handle(`cat.getLatest`, () => {
        return db.prepare(`select * from cats order by id DESC LIMIT 1`).get();
    });
    ipcMain.handle('cat.getOne', () => {
        return db.prepare(`SELECT * FROM cats ORDER BY id LIMIT 1`).get();
    });
    ipcMain.handle('cat.reset', () => {
        db.exec(`DELETE FROM cats;`); 
        return true;
    });
    console.log('[main] IPC registered:', ipcMain.eventNames());
}

app.whenReady().then(() => {
    initDB(); 
    registerIpc(); 
    createWindow(); 
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
