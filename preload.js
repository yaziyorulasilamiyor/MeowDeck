//  ileride güvenli API köprüsü eklemek için
const { contextBridge, ipcRenderer } = require('electron');
//preload.js

console.log('[preload] loaded');


contextBridge.exposeInMainWorld('db', {
    upsertCat: (payload) => ipcRenderer.invoke('cat.upsert', payload),
    getCat: () => ipcRenderer.invoke('cat.getOne'),
    getById:   (id) => ipcRenderer.invoke(`cat.getById`, id),
    list:      () => ipcRenderer.invoke(`cat.list`),
    getLatest: () => ipcRenderer.invoke(`cat.getLatest`),
    reset: () => ipcRenderer.invoke('cat.reset'),
});