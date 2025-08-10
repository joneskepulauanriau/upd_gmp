const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, isJidGroup } = require("@whiskeysockets/baileys");
const { Session } = require("inspector/promises");
const fs = require("fs");
const { error } = require("console");
const {getDataRow, getDataRowQuery, insertData, updateData, deleteData, getPeringkat, findHeadToHead, resetAutoincrement, getIDPlayer, getPosisiTerbaik } = require('./src/model/gmp_service');
const { handleFile, readFileExcel, generateImage, generateImage2, DateToWIB, parseCommand, parsePerintah, isNumber, generateImageReport, DateTimeIndonesia, getDayNameFromDate} = require('./src/model/gmp_function');
const { isPointInPolygon} = require('geolib');
const locations = require('./locations.json');
const { sign } = require("crypto");
require("dotenv").config();
const qrcode = require('qrcode-terminal');

const path = 'parameters.json';
const IDAPPSTART = '1';;
const SETAPP_ON = 'set appgmp on';
const SETAPP_OFF ='set appgmp off';
const STATUSAPP = 'status appgmp';
const SETON = 'ON';
const SETOFF = 'OFF';
const GROUP = true;
const NONGROUP = false;

// Execute Data
const TABLE_TURNAMEN = 'turnamen';
const TABLE_PENGGUNA = 'pengguna';
const TABLE_DAFTAR = 'daftar';

// Definisi Perintah 
const GMP_RANGKING_PEMAIN = `buat ranking pemain`;
const GMP_INFOGRAFIS_RANGKING_PEMAIN = `buat infografis ranking pemain`;
const GMP_HEAD_TO_HEAD = 'buat head to head pemain';
const GMP_HEAD_TO_HEAD2 = 'buat head to head';
const GMP_DISP_TURNAMEN = 'buat data turnamen';
const GMP_RENCANA_TURNAMEN = 'buat rencana turnamen';
const GMP_DISP_PEMAIN = 'buat data pemain';
const GMP_POSISI_TERBAIK = `buat posisi terbaik`;
const GMP_DAFTARKAN_SAYA = `daftarkan saya`;
const GMP_DAFTARKAN = `daftarkan`;
const GMP_PROFIL_PEMAIN = `buat profil pemain`;
const GMP_TENTUKAN_POOL = `buat pool`;
const GMP_REKAP_PRESENSI = `buat rekap presensi`;
const GMP_REGISTRASI = `registrasi ulang`;

const perintahAll = [GMP_REKAP_PRESENSI, GMP_INFOGRAFIS_RANGKING_PEMAIN, GMP_RANGKING_PEMAIN, GMP_HEAD_TO_HEAD, GMP_HEAD_TO_HEAD2, GMP_DISP_TURNAMEN, GMP_DISP_PEMAIN, GMP_POSISI_TERBAIK, GMP_DAFTARKAN, GMP_DAFTARKAN_SAYA, GMP_PROFIL_PEMAIN, GMP_RENCANA_TURNAMEN, GMP_TENTUKAN_POOL, GMP_REGISTRASI, 'tambah', 'hapus', 'perbaiki', 'perbaiki status', 'perbaiki realisasi'];

const GMP_MULAI_IMPORT_DATA = `mulai import data`; 
const GMP_RESET_PERTANDINGAN = `reset pertandingan`;
const GMP_EXECUTE_SQL_ON = `mode sql on`;
const GMP_EXECUTE_SQL_OFF = `mode sql off`;

// Definisi Step Import Data
const IMPORTDATA_MULAI = 10;
const IMPORTDATA_PROSES = 11;

const INPUT_SQL = 20;

const masterPool = [
  {},
  {
    A: [1, 2, 3]
  },
  {
    A: [1, 3, 5],
    B: [2, 4, 6]
  },
  {
    A: [1, 4, 7],
    B: [3, 6, 9],
    C: [2, 5, 8]
  },
  {
    A: [1, 5, 9],
    B: [4, 8, 12],
    C: [3, 7, 11],
    D: [2, 6, 10]
  },
  {
    A: [1, 6, 11],
    B: [4, 9, 14],
    C: [5, 10, 15],
    D: [3, 8, 13],
    E: [2, 7, 12]
  },
  {
    A: [1, 7, 13],
    B: [5, 11, 17],
    C: [4, 10, 16],
    D: [3, 9, 15],
    E: [6, 12, 18],
    F: [2, 8, 14]
  },  
  {
    A: [1, 8, 15],
    B: [5, 12, 19],
    C: [6, 13, 20],
    D: [4, 11, 18],
    E: [3, 10, 17],
    F: [7, 14, 21],
    G: [2, 9, 16]
  },
  {
    A: [1, 9, 17],
    B: [5, 13, 21],
    C: [6, 14, 22],
    D: [4, 12, 20],
    E: [3, 11, 19],
    F: [7, 15, 23],
    G: [8, 16, 24],
    H: [2, 10, 18]
  }
  ];

function getPool(grup, nomor) {
  const poolData = masterPool[grup];
  //console.log(poolData);
  for (const key in poolData) {
    if (poolData[key].includes(nomor)) {
      return key; // return huruf grup (misal: 'A', 'B', dll.)
    }
  }
  return null; // jika tidak ditemukan
}
  
// Babak
const babak = ['PG', '8B', 'SF', 'F' ];

// Simpan sesi percakapan pengguna
let userSessions = {};
const authorizingUser = process.env.AUTHORIZING_USER;

// Fungsi untuk membaca data dari file JSON
function readData() {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, JSON.stringify([], null, 2));
    }
    const data = fs.readFileSync(path);
    return JSON.parse(data);
}

// Fungsi untuk menulis data ke file JSON
function writeData(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// Fungsi untuk membaca keywords berdasarkan ID
function getKeywordsById(id) {
    //const id = parseInt(strId, 10);
    let data = readData();
    let item = data.find(item => item.id === id);
    return item ? item.keywords : null;
}

// Fungsi untuk memperbarui keyword tertentu pada ID tertentu
function updateKeywords(id, oldKeyword, newKeyword) {
    let data = readData();
    let index = data.findIndex(item => item.id === id);
    if (index !== -1) {
        let keywordIndex = data[index].keywords.indexOf(oldKeyword);
        if (keywordIndex !== -1) {
            data[index].keywords[keywordIndex] = newKeyword;
            writeData(data);
        } else {
            console.log('Keyword tidak ditemukan');
        }
    } else {
        console.log('Data tidak ditemukan');
    }
}

const getUser = (senderNumber, senderPartNumber, grup) => {
    let strwhere = '';
    if (grup) {
        strwhere = {'id_grup_pemain':senderPartNumber};
    } else {
        strwhere = {'no_hp':senderNumber};
    }
    return getDataRow ('*','pengguna', strwhere);
}

function isValidYT(yt) {
    const allowedInputs = ['Y', 'Y'];
    return allowedInputs.includes(yt);
}

function isValidPool(pool) {
    const allowedInputs = ['A', 'B', 'C', 'D'];
    return allowedInputs.includes(pool);
}

function isValidScore(score) {
    const allowedInputs = ['0', '1', '2', '3'];
    return allowedInputs.includes(score);
}

function parseData(input) {
    const regex = /^(tambah|hapus|perbaiki)\s+(\w+)\s+\{([^}]+)\}$/i;
  
    const match = input.match(regex);
    if (!match) {
      return 'Tidak Sesuai Format';
    }
  
    const command = match[1].toLowerCase();
    const table = match[2];
    const values = match[3].split(',').map(val => val.trim());
  
    return [command, table, ...values];
  }

  function DateToStr(date) {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getFullYear()}`;
  }

function scheduleValid(mulai, selesai, sekarang) {
    console.log(mulai, selesai, sekarang);
  //const startTime = parseTimeToDate(mulai);
  //const endTime = parseTimeToDate(selesai);
  //const currentTime = parseTimeToDate(sekarang);

  return sekarang >= mulai && sekarang <= selesai;
}

function Syarat(jumlah){
    if (jumlah>=3) {
        return "MS";
     } else 
     {
        return "TMS";
     }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_multi_device"); 

    const sock = makeWASocket({
        auth: state,
        //printQRInTerminal: true,
        syncFullHistory: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

     // ✅ Jika QR code muncul, tampilkan di terminal
    if (qr) {
      console.log('[📱] Silakan scan QR berikut ini dengan WhatsApp Anda:');
      qrcode.generate(qr, { small: true });
    }
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Koneksi terputus, mencoba menyambung ulang:", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("Bot WhatsApp terhubung!");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        if (!m.messages[0]?.message) return;

        const msg = m.messages[0];
        const senderJid = msg.key.remoteJid;
        const senderPart = msg.key.participant || 0; 
        const senderNumber = senderJid.replace(/[@].*/, ""); // Mengambil nomor HP
        
        const senderName = msg.pushName || "Tanpa Nama"; 
        const sender = senderName + senderNumber;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const messageType = Object.keys(msg.message)[0];
        const isGroup = msg.key.remoteJid.endsWith('@g.us') || NONGROUP;

        const senderPartNumber = isGroup ? (String(senderPart || '').split('@')[0] || '') : (String(msg.key?.remoteJid || '').split('@')[0] || '');

        console.log(`📩 Pesan dari senderJid: ${senderJid} senderPart: ${senderPart} senderName: ${senderName}  senderNumber: ${senderNumber} senderPartNumber: ${senderPartNumber} StatGroup: ${isGroup} Text: ${text}`);

        // Cek apakah pesan dari bot sendiri
        if (msg.key.fromMe) return;

        const statapp = getKeywordsById(IDAPPSTART);
        console.log(statapp);
        //return;



        if (senderNumber === authorizingUser) {
            
            if (text.toLocaleLowerCase()===SETAPP_OFF) {
                updateKeywords(IDAPPSTART, SETON, SETOFF);
                await sock.sendMessage(senderJid, { text: `Status Aplikasi *OFF*` });  
                return;
            } else if (text.toLocaleLowerCase()===SETAPP_ON) {
                updateKeywords(IDAPPSTART, SETOFF, SETON);
                await sock.sendMessage(senderJid, { text: `Status Aplikasi *ON*` });
                return;  
            } else if (text.toLocaleLowerCase()===STATUSAPP) {
                await sock.sendMessage(senderJid, { text: `Status Aplikasi *${statapp[0]}*` }); 
                return;
            } else if (text.toLocaleLowerCase()===GMP_RESET_PERTANDINGAN) {
                sock.sendPresenceUpdate("composing", senderJid);
                await resetAutoincrement('TRUNCATE TABLE pertandingan;');
                await sock.sendMessage(senderJid, { text: `Proeses reset pertandingan selesai.` });  
                return;
            } else if (text.toLocaleLowerCase()===GMP_EXECUTE_SQL_ON) {
                sock.sendPresenceUpdate("composing", senderJid);
                //onst result = await executeSQL('select * from pemain');
                userSessions[sender] = { step: INPUT_SQL } 
                await sock.sendMessage(senderJid, { text: `Masukkan Perintah SQL:` });  
                //await sock.sendMessage(senderJid, { text: `Proeses ${text} selesai.` });  
                return;
            } else if (text.toLocaleLowerCase()===GMP_EXECUTE_SQL_OFF) {
                delete userSessions[sender];
                return;
            }
        }

        if (statapp[0]===SETOFF) return;
        
        const command = parseCommand(text);
        //console.log(command);
        //const para1 = command.parameter[0];
        //const para2 = command.parameter[1];
        //const para3 = command.parameter[2];
        const menu = command.perintah.toLowerCase();
        //console.log(menu);
        //console.log('Command: ', command);

        /***********************************************
         * Mencegat hanya perintah yang sesuai saja
         ***********************************************/

        // Cek Apakah Sudah Melakukan Registrasi
        if (isGroup && (senderJid.includes('120363401358668785@g.us') || senderJid.includes('120363177930974800@g.us')) && menu===GMP_REGISTRASI) {
            console.log(`Text:----- ${senderPartNumber}`);
            const recPengguna = await getUser(senderNumber, senderPartNumber, isGroup);
            if (recPengguna.success) {
                console.log(recPengguna.data);
                await sock.sendMessage(senderJid, { text: `_*${recPengguna.data[0].nama_pengguna}* sudah melakukan *registrasi ulang*. Tks_` });
                return;
            }
            // Update Pengguna
            const id_pemain_var = command.parameter[0];
            const whereSQL = {'id_pemain': id_pemain_var};
            const data = {'id_grup_pemain': senderPartNumber};
            const recPengguna1 = await updateData(TABLE_PENGGUNA, data, whereSQL);
            
            // Tampilkan Pesan
            if (recPengguna1.success) {
                await sock.sendMessage(senderJid, { text: `_Registrasi ulang id ${id_pemain_var} pada WAG berhasil._` });
            }

            console.log(recPengguna1.message);
            return;
        }



        if (messageType==='conversation') {
            if (senderNumber !== authorizingUser) {   
                console.log(text);
                if (!perintahAll.includes(menu)) return;
            }
        }

        const recPengguna =await getUser(senderNumber, senderPartNumber, isGroup);
        
        console.log('Sender:', recPengguna['success']);
        
        if (recPengguna.success && (senderJid.includes('120363401358668785@g.us') || senderJid.includes('120363177930974800@g.us')) || senderNumber === authorizingUser) {
            //console.log(`📩 Pesan dari ${senderJid} ${senderName} (${senderNumber}): ${text}`);
            if (userSessions[sender]) {
                let session = userSessions[sender];
                if (session.step===INPUT_SQL) {
                    //const parseInput = parseData(text);
                    //console.log(text);
                    //console.log(parseInput);
                    //console.log('SQL:',menu);
                    //console.log(command.parameter.length);
                    //console.log(command.parameter[0]);
                    let data = '';
                    let whereSQL = '';
                    if (command.parameter.length){
                        if (command.parameter[0].toLowerCase()===TABLE_TURNAMEN) {
                            if (menu==='tambah') {
                                if (command.parameter[5]) {
                                    data = {'id_turnamen': command.parameter[1], 'nama_turnamen': command.parameter[2], 'alias': command.parameter[3], 'tgl_turnamen': command.parameter[4], 'tgl_realisasi': command.parameter[5], 'tahun': command.parameter[6], 'id': command.parameter[7]};
                                } else {
                                    data = {'id_turnamen': command.parameter[1], 'nama_turnamen': command.parameter[2], 'alias': command.parameter[3], 'tgl_turnamen': command.parameter[4], 'tahun': command.parameter[6], 'id': command.parameter[7]};
                                }
                                const recTur1 = await insertData(TABLE_TURNAMEN, data);
                                console.log(recTur1.data);
                                await sock.sendMessage(senderJid, { text: recTur1.message });
                            } else if (menu==='perbaiki') {
                                whereSQL = {'id_turnamen':command.parameter[1]};
                                data = {'nama_turnamen': command.parameter[2], 'alias': command.parameter[3], 'tgl_turnamen': command.parameter[4], 'tgl_realisasi': command.parameter[5], 'tahun': command.parameter[6], 'id': command.parameter[7]};                                
                                const recTur1 = await updateData(TABLE_TURNAMEN, data, whereSQL);
                                await sock.sendMessage(senderJid, { text: recTur1.message });

                            } else if (menu==='hapus') {
                                whereSQL = {'id_turnamen': command.parameter[1]};
                                const recTur1 = await deleteData(TABLE_TURNAMEN, whereSQL);
                                await sock.sendMessage(senderJid, { text: recTur1.message });
                            } else if (menu==='perbaiki status') {
                                whereSQL = {'id_turnamen':command.parameter[1]};
                                data = {'status': command.parameter[2]};                                
                                const recTur1 = await updateData(TABLE_TURNAMEN, data, whereSQL);
                                await sock.sendMessage(senderJid, { text: recTur1.message });                                
                            } else if (menu==='perbaiki realisasi') {
                                whereSQL = {'id_turnamen':command.parameter[1]};
                                data = {'tgl_realisasi': command.parameter[2], 'status': 'Buka'};                                
                                const recTur1 = await updateData(TABLE_TURNAMEN, data, whereSQL);
                                await sock.sendMessage(senderJid, { text: recTur1.message });                                
                            }
                        } if (command.parameter[0].toLowerCase()===TABLE_DAFTAR) {
                            if (menu==='hapus') {
                                whereSQL = {'id_pemain': command.parameter[1], 'id_turnamen': command.parameter[2]};
                                const recDaftar = await deleteData(TABLE_DAFTAR, whereSQL);
                                await sock.sendMessage(senderJid, { text: recDaftar.message });
                            } 
                        } else if (command.parameter[0].toLowerCase()===TABLE_PENGGUNA) {
                            if (menu==='tambah') {
                                data = {'no_hp': command.parameter[1], 'nama_pengguna': command.parameter[2], 'id_pemain': command.parameter[3]};
                                const recPengguna = await insertData(TABLE_PENGGUNA, data);
                                console.log(recPengguna.data);
                                await sock.sendMessage(senderJid, { text: recPengguna.message });
                            } else if (menu==='perbaiki') {
                                whereSQL = {'no_hp':command.parameter[1]};
                                data = {'nama_pengguna': command.parameter[2], 'id_pemain': command.parameter[3]};
                                const recPengguna = await updateData(TABLE_PENGGUNA, data, whereSQL);
                                await sock.sendMessage(senderJid, { text: recPengguna.message });
                            } else if (menu==='hapus') {
                                whereSQL = {'no_hp': command.parameter[1]};
                                const recPengguna = await deleteData(TABLE_PENGGUNA, whereSQL);
                                await sock.sendMessage(senderJid, { text: recPengguna.message });                           
                            }
                        }
                    }
                    return;
                    delete userSessions[sender];
                    
                } else if (session.step===IMPORTDATA_MULAI) {
                    //console.log(msg);
                    const rec = await handleFile(sock, msg);
                    
                    if (rec) {
                        //console.log(rec.data[0].id_turnamen);
                        session.id_turnamen = rec.data[0].id_turnamen;
                        session.filename = rec.filename;
                        session.step = IMPORTDATA_PROSES;
                        await sock.sendMessage(senderJid, { text: `Proses _Import Data_ (Y/T)?` });
                    } else {
                        await sock.sendMessage(senderJid, { text: `Proses Import Data Tidak Dapat Dilanjutkan.` });
                        delete userSessions[sender];
                    }
                } else if (session.step===IMPORTDATA_PROSES) {
                        
                    if (isValidYT(text.toUpperCase()) && text.toUpperCase()==='Y') {

                        sock.sendPresenceUpdate("composing", senderJid);
                        // Proses Import Data
                        const rows = await readFileExcel(session.filename);
                        
                        //console.log(rows.data);

                        for (const row of rows.data) {

                            const where_tanding = {'id_turnamen': row.id_turnamen,
                                'babak': row.babak,
                                'pool': row.pool,
                                'no_pertandingan': row.no_pertandingan,
                                'id_pemain': row.id_pemain
                            }
                            console.log(where_tanding);

                            let tanding = {
                                'id_turnamen': row.id_turnamen,
                                'babak': row.babak,
                                'pool': row.pool,
                                'no_pertandingan': row.no_pertandingan,
                                'id_pemain': row.id_pemain,
                                'skor_pemain': row.skor_pemain,
                                'id_lawan': row.id_lawan,
                                'skor_lawan': row.skor_lawan,
                                'kemenangan': row.kemenangan,
                                'jumlah_peserta': row.jumlah_peserta,
                                'poin': row.poin
                                }

                                const rec = await getDataRow('*', 'pertandingan', where_tanding);
                                //console.log(rec.success);

                            if (rec.success){
                                await updateData('pertandingan', tanding, where_tanding);
                            } else {
                                await insertData('pertandingan', tanding);
                            }
                            //return;
                        }    

                        //console.table(session.filename);
                        await sock.sendMessage(senderJid, { text: `Proses Import Data Selesai` });
                    } else {
                        await sock.sendMessage(senderJid, { text: `Proses Import Data Dibatalkan!` });
                    }
                    delete userSessions[sender];
                }

                ///// Keluar
                return;
            }

            /*************************  
             * Kirim Data Presensi
             *************************/

            if (msg.message.locationMessage||msg.message.liveLocationMessage){
                //sock.sendPresenceUpdate("composing", senderJid);
                let isForwarded = false;
                if (msg.message.locationMessage) isForwarded = msg.message.locationMessage.contextInfo?.isForwarded || false;

                // Baca Tabel Pengguna untuk mendapatkan id_pemain
                if (isGroup) {
                    const id_grup_pemain = senderPartNumber;
                    console.log(`📍 Lokasi diterima dari: ${id_grup_pemain}`);

                    const recPengguna = await getDataRowQuery({
                            columns: ['pengguna.no_hp', 'pengguna.id_grup_pemain', 'pengguna.id_pemain', 'pemain.nama_pemain'],
                            from: 'pengguna',
                            joins: [{ table: 'pemain', on: 'pengguna.id_pemain = pemain.id_pemain'}],
                            filters: {'pengguna.id_grup_pemain =': id_grup_pemain},
                            orderBy: 'pemain.nama_pemain DESC'
                    });

                } else {

                    const no_hp = senderNumber;
                    console.log(`📍 Lokasi diterima dari: ${no_hp}`);

                    const recPengguna = await getDataRowQuery({
                            columns: ['pengguna.no_hp', 'pengguna.id_pemain', 'pemain.nama_pemain'],
                            from: 'pengguna',
                            joins: [{ table: 'pemain', on: 'pengguna.id_pemain = pemain.id_pemain'}],
                            filters: {'pengguna.no_hp =': no_hp},
                            orderBy: 'pemain.nama_pemain DESC'
                    });

                }
                

                //console.log('Posisi Ini:',senderNumber, no_hp, recPengguna.data);  

                if (!recPengguna.success) return;
                 
                const id_pemain = recPengguna.data[0].id_pemain;
                const nama_pemain = recPengguna.data[0].nama_pemain;

                // Bila Pemain Melakukan forward
                if (isForwarded) {
                    await sock.sendMessage(senderJid, { text: `_Presensi *${nama_pemain}* tidak sah, karana berasal dari *forward.*_` });
                    return;
                }

                // Mengambil id_turnamen dengan status_presensi=1
                const recTurnamen = await getDataRow('*', 'turnamen', {'jadwal_presensi':1});

                if (!recTurnamen.success){
                    await sock.sendMessage(senderJid, { text: `_Presensi tidak dapat dilakukan, karana *jadwal latihan tidak tersedia.*_` });
                    return;
                }

                const id_turnamen = recTurnamen.data[0].id_turnamen;
                const tgl_sekarang = new Date();
                const hari = getDayNameFromDate(tgl_sekarang);
                const jam = tgl_sekarang.getHours();
                const menit = tgl_sekarang.getMinutes();
                const detik = tgl_sekarang.getSeconds();

                const loc = msg.message.locationMessage||msg.message.liveLocationMessage;
                const userPoint = {longitude: loc.degreesLongitude, latitude: loc.degreesLatitude};
                
                console.log(`Lokasi diterima dari ${senderJid}:`, userPoint);
                //await sock.sendMessage(senderJid, { text: `_Koordinat Presensi: ${loc.degreesLongitude}, ${loc.degreesLatitude}_` });

                let matchedArea = null;
                for (const area of locations) {
                    if (isPointInPolygon(userPoint, area.polygon)) {
                    matchedArea = area.name;
                    break;
                    }
                }

                let reply = '';
                
                if (matchedArea){
                    // Baca Jadwal
                    const recJadwal = await getDataRow('*', 'jadwal', {'hari':hari});
                    if (!recJadwal.success){
                       await sock.sendMessage(senderJid, { text: `_Presensi tidak dapat dilakukan, karena *bukan jadwal latihan*._` }); 
                       return;
                    }
                    console.log(recJadwal.data);
                    const waktu_sekarang = `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
                    const waktuValid =  scheduleValid(recJadwal.data[0].mulai, recJadwal.data[0].selesai, waktu_sekarang);
                    
                    if (waktuValid) {

                        // Proses Menyimpan Data
                        reply = `_Lokasi valid di area: *${matchedArea}*._`;

                        const dataPresensi = {
                            'id_pemain': id_pemain,
                            'id_turnamen': id_turnamen,
                            'tgl_presensi': `${tgl_sekarang.getFullYear()}-${(tgl_sekarang.getMonth() + 1).toString().padStart(2, '0')}-${(tgl_sekarang.getDate()).toString().padStart(2, '0')}`,
                            'waktu_presensi': tgl_sekarang,
                            'longitude': loc.degreesLongitude,
                            'latitude': loc.degreesLatitude,
                            'area': matchedArea
                        };
                        const recPresensi = await insertData('presensi', dataPresensi);

                        if (recPresensi.errnumber===1) {
                            reply = `_*${nama_pemain}* melakukan presensi di area *${matchedArea}* pada ${DateTimeIndonesia(tgl_sekarang)}_`;
                        } else {
                            const wherePresensi = { 'id_pemain': id_pemain,
                                                    'id_turnamen': id_turnamen,
                                                    'tgl_presensi': `${tgl_sekarang.getFullYear()}-${(tgl_sekarang.getMonth() + 1).toString().padStart(2, '0')}-${(tgl_sekarang.getDate()).toString().padStart(2, '0')}`
                                                };
                            const recPresensi1 = await getDataRow('*', 'presensi', wherePresensi);

                            reply = `_Presensi sudah dilakukan pada ${DateTimeIndonesia(recPresensi1.data[0].waktu_presensi)}._`;
                        }
                        //await sock.sendMessage(senderJid, { text: recPresensi.message });
                    } else {
                       await sock.sendMessage(senderJid, { text: 'Anda melakukan presensi diluar dari waktu yang telah ditetapkan.' }); 
                    } 

                } else {
                    reply = `_Lokasi presensi tidak valid, Kirim lagi lokasinya._`;
                }

                console.log(matchedArea);

                await sock.sendMessage(senderJid, { text: reply });
                
                return;
            }

            //const [command] = parsePerintah(text);
            console.log(command);
            //const para1 = command.parameter[0];
            //const para2 = command.parameter[1];
            //const para3 = command.parameter[2];
            const menu = command.perintah;
            //console.log(para1, para2, para3);

            if (menu.toLowerCase()===GMP_RANGKING_PEMAIN){
                if (command.parameter.length){
                    sock.sendPresenceUpdate("composing", senderJid);
                    let id_turnamen = command.parameter[0];
                    if (!isNumber(id_turnamen)) {
                        const recTur = await getDataRow('*', 'turnamen', {'alias': id_turnamen.toLowerCase()});
                        if (recTur.success) id_turnamen = recTur.data[0].id_turnamen;
                    } 

                    const recTurnamen = await getDataRow('*', 'turnamen', {'id_turnamen': id_turnamen});
                    if (recTurnamen.success){
                        // Buat Peringkat
                        const peringkat = await getPeringkat(id_turnamen);
                        await generateImage(peringkat, senderNumber);
                        // Kirim Hasilnya
                        await sock.sendMessage(senderJid, {image: {url: './src/images/turnamen_'+peringkat.turnamen[0].id_turnamen+'_'+senderNumber+'.png'}, caption: 'Peringkat '+peringkat.turnamen[0].nama_turnamen});
                    } else {
                        await sock.sendMessage(senderJid, { text: `Id Turnamen tidak temukan!` }); 
                    }
                } else {
                    await sock.sendMessage(senderJid, { text: `ID Turnamen belum dimasukkan.` }); 
                }
                delete userSessions[sender];
            } else if (menu.toLowerCase()===GMP_INFOGRAFIS_RANGKING_PEMAIN){
                if (command.parameter){
                    sock.sendPresenceUpdate("composing", senderJid);
                    let id_turnamen = command.parameter[0];
                    if (!isNumber(id_turnamen)) {
                        const recTur = await getDataRow('*', 'turnamen', {'alias': id_turnamen.toLowerCase()});
                        if (recTur.success) id_turnamen = recTur.data[0].id_turnamen;
                    } 

                    const recTurnamen = await getDataRow('*', 'turnamen', {'id_turnamen': id_turnamen});
                    if (recTurnamen.success){
                        console.log(recTurnamen.data[0].status.toLowerCase());
                        if (recTurnamen.data[0].status.toLowerCase()==='selesai') {
                            // Buat Peringkat
                            const peringkat = await getPeringkat(id_turnamen);
                            await generateImage2(peringkat, senderNumber);
                            // Kirim Hasilnya
                            await sock.sendMessage(senderJid, {image: {url: './src/images/infoturnamen_'+peringkat.turnamen[0].id_turnamen+'_'+senderNumber+'.png'}, caption: 'Informasi Grafis Peringkat '+peringkat.turnamen[0].nama_turnamen});
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data tidak ditemukan!` }); 
                        }
                    } else {
                        await sock.sendMessage(senderJid, { text: `Id Turnamen tidak ditemukan!` }); 
                    }
                } else {
                    await sock.sendMessage(senderJid, { text: `ID Turnamen belum dimasukkan.` }); 
                }
                delete userSessions[sender];
            } else if (menu.toLowerCase()===GMP_REKAP_PRESENSI){
                if (command.parameter){
                    sock.sendPresenceUpdate("composing", senderJid);

                    //console.log('Posisi ini')
                    let id_turnamen = '';
                    let nama_pemain = '';
                    let id_pemain ='';
                    let filter = {};
                    if (command.parameter.length===2) {
                        id_pemain = command.parameter[0];
                        id_turnamen = command.parameter[1];
                        
                        const recPemain1 = await getIDPlayer(id_pemain);
                        //console.log(recPemain1.success);
                        if (recPemain1.success) { 
                            id_pemain = recPemain1.data[0].id_pemain;
                            nama_pemain = recPemain1.data[0].nama_pemain;
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[0]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                        }
                    } else id_turnamen = command.parameter[0];
                    
                    //console.log(id_turnamen);

                    const recTur = await getDataRow('*', 'turnamen', {'alias': id_turnamen.toLowerCase()});
                    if (recTur.success) {
                        id_turnamen = recTur.data[0].id_turnamen;
                    } else {
                            await sock.sendMessage(senderJid, { text: `ID Turnamen tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                    }
                    
                    if (command.parameter.length===2) {
                        filter = {'presensi.id_pemain =': id_pemain, 'presensi.id_turnamen =': id_turnamen}; 
                    } else {
                        if (command.parameter.length===1) filter = {'presensi.id_turnamen =': id_turnamen};
                    }
                    
                    const recPresensi = await getDataRowQuery({
                    columns: [`presensi.id_pemain`, `presensi.id_turnamen`, `presensi.id_pemain`, `presensi.id_turnamen`,
                                    `presensi.tgl_presensi`, `presensi.waktu_presensi`, `presensi.longitude`, `presensi.latitude`,
                                    `presensi.area`, `pemain.nama_pemain`, `turnamen.nama_turnamen`, `turnamen.alias`, `turnamen.tgl_turnamen`,
                                    `turnamen.tgl_realisasi`, `turnamen.tahun`, `count(1) AS jumlah_hadir`, `turnamen.priode_jadwal_mulai`,
                                    `turnamen.priode_jadwal_selesai`, `turnamen.jadwal_presensi`],
                            from: 'presensi',
                            joins: [{ table: 'pemain', on: 'presensi.id_pemain = pemain.id_pemain'},
                                    { table: 'turnamen', on: 'presensi.id_turnamen = turnamen.id_turnamen'}],
                            filters: filter,
                            groupBy: 'presensi.id_pemain, presensi.id_turnamen, turnamen.tahun',
                            orderBy: 'jumlah_hadir DESC'
                        });

                    

                  console.log(recPresensi.data);

                  // Menampilkan Presensi
                  let strPresensi = `*REKAPITULASI PRESENSI*\n${recPresensi.data[0].nama_turnamen}\nPeriode: ${DateToWIB(recPresensi.data[0].priode_jadwal_mulai)} s.d. ${DateToWIB(recPresensi.data[0].priode_jadwal_selesai)}\n\n NO. NAMA PEMAIN          HADIR PERSYARATAN\n`;
                    recPresensi.data.forEach((item, index) => {
                    strPresensi += `${(index+1).toString().padStart(3, ' ')} ${item.nama_pemain.padEnd(20, ' ')} ${item.jumlah_hadir} ${Syarat(item.jumlah_hadir)}\n`;
                });
                strPresensi += `\nCatatan:\n_MS  = Memenuhi Syarat_\n_TMS =Tidak Memenuhi Syarat_`;
                await sock.sendMessage(senderJid, { text: strPresensi });
                //console.log(strPresensi);


                delete userSessions[sender];
                }
            } else if (menu.toLowerCase()===GMP_HEAD_TO_HEAD || menu.toLowerCase()===GMP_HEAD_TO_HEAD2){

                sock.sendPresenceUpdate("composing", senderJid);
                
                if (command.parameter.length===3){

                    let id_pemain = command.parameter[0];
                    //console.log('ID ----->', id_pemain);
                    let nama_pemain = '';
                    if (!isNumber(id_pemain)){
                        const recPemain1 = await getIDPlayer(id_pemain);
                        //console.log(recPemain1.success);
                        if (recPemain1.success) { 
                            id_pemain = recPemain1.data[0].id_pemain;
                            nama_pemain = recPemain1.data[0].nama_pemain;
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[0]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                        }
                    } else {
                        const recPemain2 = await getDataRow('*', 'pemain', {'id_pemain': id_pemain});
                        if (!recPemain2.success) {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[0]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return;
                        }
                        nama_pemain = recPemain2.data[0].nama_pemain;
                    }

                    let id_lawan = command.parameter[1];
                    nama_lawan = '';
                    if (!isNumber(id_lawan)){
                        const recPemain3 = await getIDPlayer(id_lawan);
                        //console.log(recPemain3);
                        if (recPemain3.success) { 
                            id_lawan = recPemain3.data[0].id_pemain;
                            nama_lawan = recPemain3.data[0].nama_pemain;
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[1]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                        }
                    } else {
                        const recPemain4 = await getDataRow('*', 'pemain', {'id_pemain': id_lawan});
                        if (!recPemain4.success) {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[1]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return;
                        }
                        nama_lawan = recPemain4.data[0].nama_pemain;
                    }
                    
                    let id_turnamen = command.parameter[2];
                    let nama_turnamen = '';
                    if (!isNumber(id_turnamen)){
                        const recTur1 = await getDataRow('*', 'turnamen', {'alias': id_turnamen.toLowerCase()});
                        if (recTur1.success) { 
                            id_turnamen = recTur1.data[0].id_turnamen;
                            nama_turnamen = recTur1.data[0].nama_turnamen;
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data Turnamen ${command.parameter[2]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                        }
                    } else {
                        const recTur2 = await getDataRow('*', 'turnamen', {'id_turnamen': id_turnamen});
                        if (recTur2.success) { 
                            id_turnamen = recTur2.data[0].id_turnamen;
                            nama_turnamen = recTur2.data[0].nama_turnamen;
                        } 

                    }                        

                    //console.log('Data --->', id_pemain, id_lawan, id_turnamen);
                    const recH2H = await findHeadToHead(id_pemain, id_lawan, id_turnamen);

                    //console.log(recH2H.data);
                    if (recH2H.data.length) {
                        let strH2H=`*_Head To Head_ antara ${nama_pemain} Vs ${nama_lawan}:*\n\n`;
                        let menang_pemain = 0;
                        let menang_lawan = 0;
                        recH2H.data.forEach( pemain => {
                            strH2H += `Nama Turnamen : ${pemain.nama_turnamen}\nTgl Turnamen : ${DateToWIB(pemain.tgl_turnamen)}\nKemenangan : ${pemain.jumlah_menang} - ${pemain.jumlah_kalah}\n\n`;
                        });
                        strH2H += `*Pertandingan:*\n`;
                        recH2H.pertandingan.forEach( pemain => {
                            let fixpoin = Math.ceil(pemain.poin);
                            strH2H += `Babak : _${pemain.keterangan_babak}_\nPool : ${pemain.pool}\nSkor Pertandingan : ${pemain.skor_pemain} / ${pemain.skor_lawan}\nPoin : ${fixpoin}\n\n`;
                        });

                        await sock.sendMessage(senderJid, { text: strH2H });
                    } else {
                        await sock.sendMessage(senderJid, { text: 'Data Tidak Ditemukan...' });                          
                    }
                } else {
                    await sock.sendMessage(senderJid, { text: `_Informasi belum lengkap!_. Seharusnya seperti contoh berikut:\nBuat head to head antara *M. Yunus* dengan *Utha* pada turnamen *Kedua*` }); 
                }
                delete userSessions[sender];
            
            } else if (menu.toLowerCase()===GMP_DISP_PEMAIN){
                sock.sendPresenceUpdate("composing", senderJid);
                const recPemain = await getDataRow('*', 'pemain');
                //console.log(recTurnamen.data);
                let strPemain = `*DAFTAR PEMAIN/PESERTA TURNAMEN*\n\n`;
                recPemain.data.forEach(item => {
                    if (item.id_pemain !== '2023999') strPemain += `${item.id_pemain} - ${item.nama_pemain}\n`; 
                });

                await sock.sendMessage(senderJid, { text: strPemain });
                delete userSessions[sender];

            } else if (menu.toLowerCase()===GMP_DISP_TURNAMEN){
                sock.sendPresenceUpdate("composing", senderJid);
                const recTurnamen = await getDataRow('*', 'turnamen');
                //console.log(recTurnamen.data);
                let strTurnamen = `*DAFTAR TURNAMEN*\n\n`;
                recTurnamen.data.forEach(item => {
                    strTurnamen += `${item.id_turnamen} - ${item.nama_turnamen}\n`;                
                });
                await sock.sendMessage(senderJid, { text: strTurnamen });
                delete userSessions[sender];

            } else if (menu.toLowerCase()===GMP_DAFTARKAN) {
                sock.sendPresenceUpdate("composing", senderJid);
                let strnama_pemain = command.parameter[0];
                let alias = command.parameter[1];
                const recPemain = await getIDPlayer(strnama_pemain);
                if (!recPemain.success) {
                    await sock.sendMessage(senderJid, { text: `*${strnama_pemain}* tidak ditemukan...` });
                    delete userSessions[sender];
                    return;
                }
                const id_pemain = recPemain.data[0].id_pemain;
                const nama_pemain = recPemain.data[0].nama_pemain;
                console.log(nama_pemain);

                const recTur = await getDataRow('*', 'turnamen', {'alias': alias});
                if (!recTur.success){
                    await sock.sendMessage(senderJid, { text: `ID Turnamen tidak ditemukan...` });
                    delete userSessions[sender];
                    return;
                }
                let statusTurnamen = recTur.data[0].status.toLowerCase(); 
                console.log(statusTurnamen);
                if (statusTurnamen==='tutup') {
                    await sock.sendMessage(senderJid, { text: `Status turnamen *${statusTurnamen.toUpperCase()}* dan akan dibuka tanggal *${DateToWIB(recTur.data[0].tgl_turnamen)}*.` });
                    delete userSessions[sender];
                    return;
                } else if (statusTurnamen==='selesai') {
                    await sock.sendMessage(senderJid, { text: `Status turnamen  *${statusTurnamen.toUpperCase()}* pada tanggal *${DateToWIB(recTur.data[0].tgl_realisasi)}*.` });
                    delete userSessions[sender];
                    return;
                } 
            
                let id_turnamen = recTur.data[0].id_turnamen;
                let id_turnamen_prev = id_turnamen - 1;
                //console.log(id_turnamen, id_turnamen_prev)
                // Temukan Ranking sebelumnya
                const recPeringkat = await getPeringkat(id_turnamen_prev);
                let ketemu = false;
                for (level=0; level<recPeringkat.data.length; level++) {
                     if (recPeringkat.data[level].id_pemain===id_pemain){
                        ketemu = true;
                        break;
                     } 
               }
               let peringkat = ketemu?level+1:99;
               
               // Simpan data
                const grp = Math.ceil(peringkat / 3);
                console.log('Jumlah Grup: ', grp, peringkat);

                // Tentukan Pool
               let pool = 'X';
               if (peringkat!==99) pool = getPool(grp, peringkat);

               let tgl_daftar = new Date;


                // Cek Apakah Presensi sudah 3x
                const filter = {'presensi.id_pemain =': id_pemain, 'presensi.id_turnamen =': id_turnamen};
                const recPresensi = await getDataRowQuery({
                    columns: [`presensi.id_pemain`, `presensi.id_turnamen`, `presensi.id_pemain`, `presensi.id_turnamen`,
                            `presensi.tgl_presensi`, `presensi.waktu_presensi`, `presensi.longitude`, `presensi.latitude`,
                            `presensi.area`, `pemain.nama_pemain`, `turnamen.nama_turnamen`, `turnamen.alias`, `turnamen.tgl_turnamen`,
                            `turnamen.tgl_realisasi`, `turnamen.tahun`, `count(1) AS jumlah_hadir`, `turnamen.priode_jadwal_mulai`,
                            `turnamen.priode_jadwal_selesai`, `turnamen.jadwal_presensi`],
                    from: 'presensi',
                    joins: [{ table: 'pemain', on: 'presensi.id_pemain = pemain.id_pemain'},
                            { table: 'turnamen', on: 'presensi.id_turnamen = turnamen.id_turnamen'}],
                    filters: filter,
                    groupBy: 'presensi.id_pemain, presensi.id_turnamen, turnamen.tahun',
                    orderBy: 'presensi.id_pemain'
                });

                if (!recPresensi.success){
                   await sock.sendMessage(senderJid, { text: `_Presensi *${nama_pemain}* tidak ditemukan._` }); 
                   return;
                }

                if (recPresensi.data[0].jumlah_hadir>=3) {
                    // Simpan
                    const data = {'id_pemain': id_pemain, 'id_turnamen': id_turnamen, 'ranking_sebelum': peringkat, 'pool': pool, 'tgl_daftar': tgl_daftar};
                    console.log(data);

                    const recDaftar = await insertData('daftar', data);
                    await sock.sendMessage(senderJid, { text: recDaftar.message });

                   // Tampilkan Data 
                    const recDaftar1 =  await getDataRowQuery({
                        columns: [
                        'daftar.id_pemain',
                        'pemain.nama_pemain',
                        'daftar.id_turnamen',
                        'turnamen.nama_turnamen',
                        'turnamen.alias',
                        'turnamen.tgl_turnamen',
                        'turnamen.tgl_realisasi',
                        'turnamen.status',
                        'daftar.ranking_sebelum',
                        'daftar.pool',
                        'daftar.tgl_daftar'
                        ],
                        from: 'daftar',
                        joins: [
                        { table: 'pemain', on: 'daftar.id_pemain = pemain.id_pemain' },
                        { table: 'turnamen', on: 'daftar.id_turnamen = turnamen.id_turnamen' }
                        ],
                        filters: {'turnamen.id_turnamen =': id_turnamen},
                        orderBy: 'daftar.ranking_sebelum'
                    });
                  
                    if (recDaftar1.success) {
                        const grup = Math.ceil(recDaftar1.data.length / 3);
                        let strDaftar = `DAFTAR PESERTA TURNAMEN\n${recDaftar1.data[0].nama_turnamen}\nTanggal : ${DateToStr(recDaftar1.data[0].tgl_realisasi)}\n\n*No. Nama Peserta  #B/L  Pool*\n`;
                        
                        // Proses Mengurutkan Data Pool
                        const dataPool = [];
                        recDaftar1.data.forEach ((item, index) => {
                            dataPool[index] = {'nu': (index+1), 'nama_pemain': item.nama_pemain, 'ranking_sebelum': item.ranking_sebelum, 'pool': getPool(grup, (index+1))}
                        });
                        

                        // Urutkan
                        const sortDaftar = [...dataPool].sort((a, b) => {
                            if (a.pool === b.pool) {
                              return a.ranking_sebelum - b.ranking_sebelum; // urut poin jika pool sama
                            }
                            return a.pool.localeCompare(b.pool); // urut pool
                          });

                          let ranking_prev = 0;
                          sortDaftar.forEach ((item, index) => {
                              if (item.ranking_sebelum===99) ranking_prev=0; else ranking_prev=item.ranking_sebelum;
                              strDaftar += `${String((index+1)).padStart(3, ' ')}. ${item.nama_pemain} #${String(item.nu)}/${String(ranking_prev)} *${item.pool}*\n`;
                          });
                          
                        //console.log(strDaftar);
                        await sock.sendMessage(senderJid, { text: strDaftar });
                        if (grup!==2) await sock.sendMessage(senderJid, {image: {url: `./src/grup/${grup}.jpg`}, caption: 'Babak Lanjutan'});
                    }
                } else {
                    await sock.sendMessage(senderJid, { text: `_Presensi *${recPresensi.data[0].nama_pemain}* berjumlah ${recPresensi.data[0].jumlah_hadir}, jadi *belum memenuhi syarat*._`});
                }    
               
              delete userSessions[sender];

            } else if (menu.toLowerCase()===GMP_DAFTARKAN_SAYA) {
                sock.sendPresenceUpdate("composing", senderJid);

                // Baca Tabel Pengguna untuk mendapatkan id_pemain
                if (isGroup) {
                    const id_grup_pemain = senderPartNumber;
                    console.log(`📍 Lokasi diterima dari: ${id_grup_pemain}`);

                    const recPengguna = await getDataRowQuery({
                            columns: ['pengguna.no_hp', 'pengguna.id_grup_pemain', 'pengguna.id_pemain', 'pemain.nama_pemain'],
                            from: 'pengguna',
                            joins: [{ table: 'pemain', on: 'pengguna.id_pemain = pemain.id_pemain'}],
                            filters: {'pengguna.id_grup_pemain =': id_grup_pemain},
                            orderBy: 'pemain.nama_pemain DESC'
                    });

                } else {

                    const no_hp = senderNumber;
                    console.log(`📍 Lokasi diterima dari: ${no_hp}`);

                    const recPengguna = await getDataRowQuery({
                            columns: ['pengguna.no_hp', 'pengguna.id_pemain', 'pemain.nama_pemain'],
                            from: 'pengguna',
                            joins: [{ table: 'pemain', on: 'pengguna.id_pemain = pemain.id_pemain'}],
                            filters: {'pengguna.no_hp =': no_hp},
                            orderBy: 'pemain.nama_pemain DESC'
                    });

                }

                console.log(recPengguna.data);

                if (recPengguna.success) {
                    let id_pemain = recPengguna.data[0].id_pemain;
                    let alias = command.parameter[0]; 
                    const nama_pemain = recPengguna.data[0].nama_pemain;

                    // Dapatkan id_turnamen pada tabel turnamen
                    const recTur = await getDataRow('*', 'turnamen', {'alias': alias});
                    if (!recTur.success){
                        await sock.sendMessage(senderJid, { text: `ID Turnamen tidak ditemukan...` });
                        delete userSessions[sender];
                        return;
                    }
                    let statusTurnamen = recTur.data[0].status.toLowerCase(); 
                    console.log(statusTurnamen);
                    if (statusTurnamen==='tutup') {
                        await sock.sendMessage(senderJid, { text: `Status turnamen *${statusTurnamen.toUpperCase()}* dan akan dibuka tanggal *${DateToWIB(recTur.data[0].tgl_turnamen)}*.` });
                        delete userSessions[sender];
                        return;
                    } else if (statusTurnamen==='selesai') {
                        await sock.sendMessage(senderJid, { text: `Status turnamen  *${statusTurnamen.toUpperCase()}* pada tanggal *${DateToWIB(recTur.data[0].tgl_realisasi)}*.` });
                        delete userSessions[sender];
                        return;
                    } 
                    
                    let id_turnamen = recTur.data[0].id_turnamen;
                    let id_turnamen_prev = id_turnamen - 1;

                    // Temukan Ranking sebelumnya
                    const recPeringkat = await getPeringkat(id_turnamen_prev);
                    let ketemu = false;
                    for (level=0; level<recPeringkat.data.length; level++) {
                         if (recPeringkat.data[level].id_pemain===id_pemain){
                            ketemu = true;
                            break;
                         } 
                    }
                    let peringkat = ketemu?level+1:99;

                    // Cari peserta saat ini mendaftar
                    //const recPooldaftar = await getDataRow('*', 'daftar', {'id_turnamen': id_turnamen});

                    const grp = Math.ceil(peringkat / 3);

                    //const convPeringkat = (peringkat % (grp*3))===0?grp*3:(peringkat % (grp*3));

                    console.log('Jumlah Grup: ', grp, peringkat);

                    // Tentukan Pool
                    let pool = 'X';
                    if (peringkat!==99) pool = getPool(grp, peringkat);
                    
                    // Simpan data
                    let tgl_daftar = new Date;

                    // Cek Apakah Presensi sudah 3x
                    const filter = {'presensi.id_pemain =': id_pemain, 'presensi.id_turnamen =': id_turnamen};
                    const recPresensi = await getDataRowQuery({
                        columns: [`presensi.id_pemain`, `presensi.id_turnamen`, `presensi.id_pemain`, `presensi.id_turnamen`,
                            `presensi.tgl_presensi`, `presensi.waktu_presensi`, `presensi.longitude`, `presensi.latitude`,
                            `presensi.area`, `pemain.nama_pemain`, `turnamen.nama_turnamen`, `turnamen.alias`, `turnamen.tgl_turnamen`,
                            `turnamen.tgl_realisasi`, `turnamen.tahun`, `count(1) AS jumlah_hadir`, `turnamen.priode_jadwal_mulai`,
                            `turnamen.priode_jadwal_selesai`, `turnamen.jadwal_presensi`],
                        from: 'presensi',
                        joins: [{ table: 'pemain', on: 'presensi.id_pemain = pemain.id_pemain'},
                                { table: 'turnamen', on: 'presensi.id_turnamen = turnamen.id_turnamen'}],
                        filters: filter,
                        groupBy: 'presensi.id_pemain, presensi.id_turnamen, turnamen.tahun',
                        orderBy: 'presensi.id_pemain'
                    });

                    if (!recPresensi.success){
                        await sock.sendMessage(senderJid, { text: `_Presensi *${nama_pemain}* tidak ditemukan._` }); 
                        return;
                    }
                
                    if (recPresensi.data[0].jumlah_hadir>=3) {
                        // Simpan
                        const data = {'id_pemain': id_pemain, 'id_turnamen': id_turnamen, 'ranking_sebelum': peringkat, 'pool': pool, 'tgl_daftar': tgl_daftar};
                        console.log(data);
                        const recDaftar = await insertData('daftar', data);
                        
                        await sock.sendMessage(senderJid, { text: recDaftar.message });

                        // Tampilkan Data 
                        const recDaftar1 =  await getDataRowQuery({
                            columns: [
                            'daftar.id_pemain',
                            'pemain.nama_pemain',
                            'daftar.id_turnamen',
                            'turnamen.nama_turnamen',
                            'turnamen.alias',
                            'turnamen.tgl_turnamen',
                            'turnamen.tgl_realisasi',
                            'turnamen.status',
                            'daftar.ranking_sebelum',
                            'daftar.pool',
                            'daftar.tgl_daftar'
                            ],
                            from: 'daftar',
                            joins: [
                            { table: 'pemain', on: 'daftar.id_pemain = pemain.id_pemain' },
                            { table: 'turnamen', on: 'daftar.id_turnamen = turnamen.id_turnamen' }
                            ],
                            filters: {'turnamen.id_turnamen =': id_turnamen},
                            orderBy: 'daftar.ranking_sebelum'
                        });
                   
                        if (recDaftar1.success) {
                            const grup = Math.ceil(recDaftar1.data.length / 3);
                            console.log(grup);

                            let strDaftar = `DAFTAR PESERTA TURNAMEN\n${recDaftar1.data[0].nama_turnamen}\nTanggal : ${DateToStr(recDaftar1.data[0].tgl_realisasi)}\n\n*No. Nama Peserta  #B/L  Pool*\n`;
                                
                                // Proses Mengurutkan Data Pool
                                const dataPool = [];
                                recDaftar1.data.forEach ((item, index) => {
                                    dataPool[index] = {'nu': (index+1), 'nama_pemain': item.nama_pemain, 'ranking_sebelum': item.ranking_sebelum, 'pool': getPool(grup, (index+1))}
                                });

                                // Urutkan
                                const sortDaftar = [...dataPool].sort((a, b) => {
                                    if (a.pool === b.pool) {
                                        return a.ranking_sebelum - b.ranking_sebelum; // urut poin jika pool sama
                                    }
                                    return a.pool.localeCompare(b.pool); // urut pool
                                });

                                let ranking_prev = 0;
                                sortDaftar.forEach ((item, index) => {
                                    if (item.ranking_sebelum===99) ranking_prev=0; else ranking_prev=item.ranking_sebelum;
                                    strDaftar += `${String((index+1)).padStart(3, ' ')}. ${item.nama_pemain} #${String(item.nu)}/${String(ranking_prev)} *${item.pool}*\n`;
                                });
                                
                                await sock.sendMessage(senderJid, { text: strDaftar });
                                if (grup!==2) await sock.sendMessage(senderJid, {image: {url: `./src/grup/${grup}.jpg`}, caption: 'Babak Lanjutan'});
                        }
                    } else {
                        await sock.sendMessage(senderJid, { text: `_Presensi *${recPresensi.data[0].nama_pemain}* berjumlah ${recPresensi.data[0].jumlah_hadir}, jadi *belum memenuhi syarat*._`});
                    }
                } else {
                    await sock.sendMessage(senderJid, { text: recPengguna.message });
                }
            
                delete userSessions[sender];

            } else if (menu.toLowerCase()===GMP_TENTUKAN_POOL) {
                sock.sendPresenceUpdate("composing", senderJid);

                // Cari id_turnamen
                let alias = command.parameter[0]; 
                // Dapatkan id_turnamen pada tabel turnamen
                const recTur = await getDataRow('*', 'turnamen', {'alias': alias});
                if (!recTur.success){
                    await sock.sendMessage(senderJid, { text: `ID Turnamen tidak ditemukan...` });
                    delete userSessions[sender];
                    return;
                }
                let statusTurnamen = recTur.data[0].status.toLowerCase(); 
                console.log(statusTurnamen);
                if (statusTurnamen==='tutup') {
                    await sock.sendMessage(senderJid, { text: `Status turnamen *${statusTurnamen.toUpperCase()}* dan akan dibuka tanggal *${DateToWIB(recTur.data[0].tgl_turnamen)}*.` });
                    delete userSessions[sender];
                    return;
                } else if (statusTurnamen==='selesai') {
                    await sock.sendMessage(senderJid, { text: `Status turnamen  *${statusTurnamen.toUpperCase()}* pada tanggal *${DateToWIB(recTur.data[0].tgl_realisasi)}*.` });
                    delete userSessions[sender];
                    return;
                } 
                let id_turnamen = recTur.data[0].id_turnamen;
                //console.log('Data :', id_turnamen);

                   const recDaftar1 =  await getDataRowQuery({
                    columns: [
                      'daftar.id_pemain',
                      'pemain.nama_pemain',
                      'daftar.id_turnamen',
                      'turnamen.nama_turnamen',
                      'turnamen.alias',
                      'turnamen.tgl_turnamen',
                      'turnamen.tgl_realisasi',
                      'turnamen.status',
                      'daftar.ranking_sebelum',
                      'daftar.pool',
                      'daftar.tgl_daftar'
                    ],
                    from: 'daftar',
                    joins: [
                      { table: 'pemain', on: 'daftar.id_pemain = pemain.id_pemain' },
                      { table: 'turnamen', on: 'daftar.id_turnamen = turnamen.id_turnamen' }
                    ],
                    filters: {'turnamen.id_turnamen =': id_turnamen},
                    orderBy: 'daftar.ranking_sebelum'
                  });
                  if (recDaftar1.success) {
                    const grup = Math.ceil(recDaftar1.data.length / 3);
                    let strDaftar = `DAFTAR PESERTA TURNAMEN\n${recDaftar1.data[0].nama_turnamen}\nTanggal : ${DateToStr(recDaftar1.data[0].tgl_realisasi)}\n\n*No. Nama Peserta  #B/L  Pool*\n`;
                        
                    // Proses Mengurutkan Data Pool
                    const dataPool = [];
                    recDaftar1.data.forEach ((item, index) => {
                        dataPool[index] = {'nu': (index+1), 'nama_pemain': item.nama_pemain, 'ranking_sebelum': item.ranking_sebelum, 'pool': getPool(grup, (index+1))}
                    });
                        

                    // Urutkan
                    const sortDaftar = [...dataPool].sort((a, b) => {
                        if (a.pool === b.pool) {
                            return a.ranking_sebelum - b.ranking_sebelum; // urut poin jika pool sama
                        }
                        return a.pool.localeCompare(b.pool); // urut pool
                    });

                    let ranking_prev = 0;
                    sortDaftar.forEach ((item, index) => {
                        if (item.ranking_sebelum===99) ranking_prev=0; else ranking_prev=item.ranking_sebelum;
                        strDaftar += `${String((index+1)).padStart(3, ' ')}. ${item.nama_pemain} #${String(item.nu)}/${String(ranking_prev)} *${item.pool}*\n`;
                    });
                          
                    //console.log(strDaftar);
                    await sock.sendMessage(senderJid, { text: strDaftar });
                    if (grup!==2) await sock.sendMessage(senderJid, {image: {url: `./src/grup/${grup}.jpg`}, caption: 'Babak Lanjutan'});
                } else {
                    await sock.sendMessage(senderJid, { text: `_Data tidak tersedia._` });
                }
                
                delete userSessions[sender];

            } else if (menu.toLowerCase()===GMP_RENCANA_TURNAMEN){
                sock.sendPresenceUpdate("composing", senderJid);
                const recTurnamen = await getDataRow('*', 'turnamen');
                console.log(command.parameter);

                if (recTurnamen.success){
                    let periode ='';
                    if (command.parameter.length) {
                        periode =  `Tahun : ${command.parameter[0]}`;
                        generateImageReport({
                            title: 'JADWAL RENCANA TURNAMEN INTERNAL',
                            subtitle: 'PTM GEDUNG MERAH PUTIH',
                            periode: periode,
                            output: `./src/images/laporan_turnamen_${senderNumber}.png`,
                            columns: [
                              { key: 'id', label: 'ID', x: 50 },
                              { key: 'nama_turnamen', label: 'NAMA TURNAMEN', x: 90 },
                              { key: 'tgl_turnamen', label: 'RENCANA', x: 450, format: DateToStr },
                              { key: 'tgl_realisasi', label: 'REALISASI', x: 550, format: DateToStr },
                              { key: 'status', label: 'STATUS', x: 650 },
                            ],
                            data: recTurnamen.data,
                          });
                    } else {
                        console.log('Semua Turnamen');
                        generateImageReport({
                            title: 'JADWAL RENCANA TURNAMEN INTERNAL',
                            subtitle: 'PTM GEDUNG MERAH PUTIH',
                            periode: periode,
                            output: `./src/images/laporan_turnamen_${senderNumber}.png`,
                            columns: [
                              { key: 'id', label: 'ID', x: 50 },
                              { key: 'nama_turnamen', label: 'NAMA TURNAMEN', x: 90 },
                              { key: 'tgl_turnamen', label: 'RENCANA', x: 450, format: DateToStr },
                              { key: 'tgl_realisasi', label: 'REALISASI', x: 550, format: DateToStr },
                              { key: 'tahun', label: 'TAHUN', x: 650 },
                            ],
                            data: recTurnamen.data,
                          });
                    }
                    await sock.sendMessage(senderJid, {image: {url: `./src/images/laporan_turnamen_${senderNumber}.png`}, caption: 'Jadwal Rencana Turnamen'});
                } else {
                    await sock.sendMessage(senderJid, { text: `Data Rencana Turnamen Tidak Ditemukan...` });
                }
                

                delete userSessions[sender];

            } else if (text.trim().toLowerCase()===GMP_MULAI_IMPORT_DATA) {
                await sock.sendMessage(senderJid, { text: `Masukkan _File Excel_ yang akan diimport :` });
                userSessions[sender] = { step: IMPORTDATA_MULAI } 
            } else if (menu.toLowerCase()===GMP_POSISI_TERBAIK){
                if (command.parameter.length!==2) {
                    await sock.sendMessage(senderJid, { text: `_Informasi tidak lengkap_.\n\nContoh:\nBuat posisi terbaik untuk *M. Yunus* pada turnamen *Pertama*` });
                    return;
                }
                if (command.parameter.length>1){
                    sock.sendPresenceUpdate("composing", senderJid);

                    let id_pemain = command.parameter[0];
                    let nama_pemain = '';
                    if (!isNumber(id_pemain)){
                        const recPemain1 = await getIDPlayer(id_pemain);

                        if (recPemain1.success) { 
                            id_pemain = recPemain1.data[0].id_pemain;
                            nama_pemain = recPemain1.data[0].nama_pemain;
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[0]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                        }
                    } else {
                        const recPemain2 = await getDataRow('*', 'pemain', {'id_pemain': id_pemain});
                        if (!recPemain2.success) {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[0]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return;
                        }
                        nama_pemain = recPemain2.data[0].nama_pemain;
                    }

                    let id_turnamen = command.parameter[1];
                    let nama_turnamen = '';
                    if (!isNumber(id_turnamen)){
                        const recTur1 = await getDataRow('*', 'turnamen', {'alias': id_turnamen.toLowerCase()});
                        if (recTur1.success) { 
                            id_turnamen = recTur1.data[0].id_turnamen;
                            nama_turnamen = recTur1.data[0].nama_turnamen;
                        } else {
                            await sock.sendMessage(senderJid, { text: `Data ${command.parameter[1]} tidak ditemukan.` });
                            delete userSessions[sender];
                            return; 
                        }
                    } else {
                        const recTur2 = await getDataRow('*', 'turnamen', {'id_turnamen': id_turnamen});
                        if (recTur2.success) { 
                            id_turnamen = recTur2.data[0].id_turnamen;
                            nama_turnamen = recTur2.data[0].nama_turnamen;
                        } 
                    }                    
                
                    // Menncetak Posisi
                    const recPosisi = await getPosisiTerbaik(id_turnamen, id_pemain);
                    console.log(recPosisi.data);
                    if (!recPosisi.success){
                        await sock.sendMessage(senderJid, { text: `Data tidak ditemukan.` });
                        delete userSessions[sender];
                        return;
                    }
                    
                    let strPosisi=`*Posisi Terbaik ${nama_pemain} Pada Turnamen ${nama_turnamen}:*\n\n`;
                    recPosisi.data.forEach(item => {
                        strPosisi += `Nama Lawan : ${item.nama_lawan}\nBabak : ${item.keterangan_babak}\nPool : ${item.pool}\nSkor : ${item.skor_pemain} / ${item.skor_lawan}\nPoin : ${item.poin}\n\n`;                
                    });
                    await sock.sendMessage(senderJid, { text: strPosisi });
                }

                delete userSessions[sender];
            }

            // Import Data

            return;
        }
        
    });
    return sock;
}

startBot();
