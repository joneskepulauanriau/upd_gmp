const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { get } = require('https');

// Daftarkan font Arial biasa
registerFont('./src/fonts/arial.ttf', { family: 'Arial' });

// Daftarkan font italic jika ada
registerFont('./src/fonts/ariali.ttf', { family: 'Arial', style: 'italic' });



const handleFile = async (sock, m) => {
    const modul = 'handleFile';
    try {
    if (!m.message || !m.message.documentMessage) {
      console.log('Pesan tidak mengandung file.');
      return;
    }

    const fileName = m.message.documentMessage.fileName;
    const fileMimeType = m.message.documentMessage.mimetype;

    if (fileMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      console.log('📂 File .xlsx diterima:', fileName);

      const fPath = path.join(__dirname, '..', 'data', fileName);
      if (fs.existsSync(fPath)){
        fs.unlinkSync(fPath);
        console.log(`🗑️ File ${fileName} berhasil dihapus.`);
      }

      // Pastikan folder 'data' ada
      const dirPath = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Simpan file sebagai "import.xlsx"
      const filePath = path.join(dirPath, fileName);

      // Unduh file dalam bentuk buffer
      const buffer = await downloadMediaMessage(m, "buffer");

      // Simpan file ke dalam sistem
      fs.writeFileSync(filePath, buffer);
      console.log('✅ File disimpan di:', filePath);

      // Membaca file Excel yang baru disimpan
      const workbook = xlsx.readFile(filePath);
      const sheet_name_list = workbook.SheetNames;

      // Mengambil data dari sheet pertama
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
      //console.log('📊 Data dari file .xlsx:', data);

      // Kirim balasan ke pengirim
      const senderJid = m.key.remoteJid;
      await sock.sendMessage(senderJid, { text: `✅ File *${fileName}* berhasil diterima!` });

      let status = data.length?true:false;
  
      return {
        'module': modul,  
        'success': status, 
        'message': 'Data berhasil disimpan.',
        'data': data,
        'filename': fileName,
      }

    } else {
        return {
            'module': modul,  
            'success': false, 
            'message': 'Data Gagal disimpan...',
            'data': {},
            'filename':'',
          }        
      console.log('⛔ Format file bukan .xlsx');
    }
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat memproses file:', error);
  }
};

const readFileExcel = async (filename) => {
    const modul = 'handleFile';

    try {

        // Baca file Excel
        const filePath = path.join(__dirname, '..', 'data', filename);
        console.log(filePath);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let status = sheet.length?true:false;
  
        return {
            'module': modul,  
            'success': status, 
            'message': 'Data berhasil dibaca.',
            'data': sheet,
        }

    } catch (error) {
        console.error('Gagal Membaca Data:', error);
        return {
            'module': modul,  
            'success': false, 
            'message': 'Data tidak berhasil dibaca.',
            'data': {},
        }
    }
}

// Fungsi untuk mendapatkan nama bulan dalam bahasa Indonesia
function getIndonesianMonthName(date) {
  const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[date.getMonth()];
}

// Fungsi untuk mengonversi Date ke format Indonesia (DD/MM/YYYY)
const DateToWIB = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  //const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
  const year = date.getFullYear();
  const monthName = getIndonesianMonthName(date);
  return `${day} ${monthName} ${year}`;
}

// Fungsi untuk mengonversi Date ke format Indonesia (DD/MM/YYYY)
const DateToStr = (date) => {
  if (date===null) return `N/A`;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
  const year = date.getFullYear();
  //const monthName = getIndonesianMonthName(date);
  return `${day}-${month}-${year}`;
}

// Fungsi untuk mengonversi Date ke format lengkap Indonesia (Hari, DD Bulan YYYY HH:mm:ss)
const DateTimeIndonesia = (date, timezone = 'WIB') => {
  //const dayName = getIndonesianDayName(date);
  const day = String(date.getDate()).padStart(2, '0');
  //const monthName = getIndonesianMonthName(date);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0  
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${timezone}`;
}

async function generateImage(recParam, senderNumber) {
  const rowHeight = 25;
  const rowHeightHeader = 220;
  const canvasWidth = 600;
  const canvasHeight = 1000; // dinaikkan agar muat banyak data

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  //const recPeringkat = await getPeringkat(id_turnamen_param);

  // Load background
  const backgroundPath = `./src/images/${recParam.turnamen[0].id_turnamen}.png`;
  const background = await loadImage(backgroundPath);
  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

  // Load logo
  const logoPath = './src/images/logo.png';
  if (fs.existsSync(logoPath)) {
    const logo = await loadImage(logoPath);
    ctx.drawImage(logo, 20, 20, 100, 100);
  } else {
    console.warn('⚠️ Logo tidak ditemukan di:', logoPath);
  }

  // Header - Institusi
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PTM GEDUNG MERAH PUTIH', 150, 60);
  ctx.font = '20px Arial';
  ctx.fillText('Jln. Pemuda (SMAN 4 Tanjungpinang)', 150, 90);

  // Turnamen
  ctx.fillStyle = '#760000';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('RANKING PEMAIN PTM GMP', 100, 150);
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  const turnamen = recParam.turnamen[0].nama_turnamen;
  ctx.fillText(turnamen, 100, 170);
  const tgl = 'Tanggal ' + DateToWIB(recParam.turnamen[0].tgl_turnamen);
  ctx.fillText(tgl, 100, 190);

  // Kolom Header
  ctx.font = 'bold 16px Arial';
  ctx.fillText('#', 100, rowHeightHeader);
  ctx.fillText('ID', 130, rowHeightHeader);
  ctx.fillText('NAMA PEMAIN', 230, rowHeightHeader);
  ctx.fillText('POIN', 500, rowHeightHeader);

  // Data Ranking
  ctx.font = '16px Arial';
  recParam.data.forEach((pemain, index) => {
    let y = rowHeightHeader + (index + 1) * rowHeight;
    ctx.fillText(index + 1, 100, y);
    ctx.fillText(pemain.id_pemain, 130, y);
    ctx.font = 'italic 16px Arial'; // Nama miring
    ctx.fillText(pemain.nama_pemain, 230, y);
    ctx.font = '16px Arial'; // Normal kembali
    ctx.fillText(pemain.total_poin.toString(), 500, y);
  });

  // Tanggal Cetak
  ctx.font = 'italic 16px Arial';
  const tglCetak = 'Dicetak pada: ' + DateTimeIndonesia(new Date());
  ctx.fillText(tglCetak, 100, canvasHeight - 30);

  // Simpan ke file
  const outputPath = './src/images/turnamen_'+ recParam.turnamen[0].id_turnamen +'_'+senderNumber+'.png';
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ Gambar ranking berhasil dibuat:', outputPath);
}

async function generateImage2(recParam, senderNumber) {
  const rowHeight = 25;
  const rowHeightHeader = 220;
  const canvasWidth = 794;
  const canvasHeight = 1300;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  const backgroundPath = `./src/images/${recParam.turnamen[0].id_turnamen}info.png`;
  const background = await loadImage(backgroundPath);
  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

  const logoPath = './src/images/logo.png';
  if (fs.existsSync(logoPath)) {
    const logo = await loadImage(logoPath);
    ctx.drawImage(logo, 20, 20, 100, 100);
  } else {
    console.warn('⚠️ Logo tidak ditemukan di:', logoPath);
  }

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PTM GEDUNG MERAH PUTIH', 150, 60);
  ctx.font = '20px Arial';
  ctx.fillText('Jln. Pemuda (SMAN 4 Tanjungpinang)', 150, 90);

  ctx.fillStyle = '#FF0000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('RANKING PEMAIN PTM GMP', 200, 150);
  ctx.fillStyle = '#000000';
  ctx.font = '20px Arial';
  const turnamen = recParam.turnamen[0].nama_turnamen;
  ctx.fillText(turnamen, 200, 175);
  const tgl = 'Tanggal ' + DateToWIB(recParam.turnamen[0].tgl_turnamen);
  ctx.fillText(tgl, 200, 195);

  const startY = rowHeightHeader + 30;
  const fotoSize = 100;
  let j=0;
  for (let i = 0; i < recParam.data.length; i++) {
    const pemain = recParam.data[i];
    const y = startY + j * (fotoSize+20) //rowHeight;

    let yy = (i+1)%3;
    if (yy===0) {
        j++;
        yy=2;
    } else {
      yy--;
    }
      
    ctx.font = 'Bold 24px Arial';
    ctx.fillText(`#${i + 1}`, 40 + yy*250 + fotoSize , y+10);
    ctx.font = '16px Arial';
    ctx.fillText(pemain.id_pemain, 40 + yy*250 + fotoSize, y+10+rowHeight);
    ctx.fillText(pemain.nama_pemain, 40 + yy*250 + fotoSize, y+10+rowHeight*2);
    ctx.fillText(pemain.total_poin, 40 + yy*250 + fotoSize, y+10+rowHeight*3);

    let fotoPath = `./src/images/${pemain.id_pemain}.png`;
    if (fs.existsSync(fotoPath)) {
      const foto = await loadImage(fotoPath);
      ctx.drawImage(foto, 30 + yy*250, y - fotoSize + 90, fotoSize, fotoSize);
    } else {
      console.warn('⚠️ Foto pemain tidak ditemukan:', fotoPath);
    }
  }

  ctx.font = 'italic 16px Arial';
  const tglCetak = 'Dicetak pada: ' + DateTimeIndonesia(new Date());
  ctx.fillText(tglCetak, 100, canvasHeight - 30);

  const outputPath = './src/images/infoturnamen_' + recParam.turnamen[0].id_turnamen + '_' + senderNumber + '.png';
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ Gambar ranking berhasil dibuat:', outputPath);
}

async function generateImageReport({ data, columns, title, subtitle = '', periode = '', output = 'laporan.png' }) {
    var rowHeightHeader = 220;
    const rowHeight = 25;
  const canvasWidth = 794;
  const canvasHeight = 1123;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Background
  const backgroundPath = './src/images/background.png';
  if (fs.existsSync(backgroundPath)) {
    const background = await loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
  }

  // Logo
  const logoPath = './src/images/logo.png';
  if (fs.existsSync(logoPath)) {
    const logo = await loadImage(logoPath);
    ctx.drawImage(logo, 20, 20, 100, 100);
  }

  // Header Institusi
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PTM GEDUNG MERAH PUTIH', 150, 60);
  ctx.font = '20px Arial';
  ctx.fillText('Jln. Pemuda (SMAN 4 Tanjungpinang)', 150, 90);

  // Judul & Tahun
    let rowPos =125+rowHeight;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#760000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(title, canvasWidth / 2, rowPos);

    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    if (subtitle) {
        rowPos += rowHeight;
        ctx.fillText(subtitle, canvasWidth / 2, rowPos);
    }
    if (periode) {
        rowPos += rowHeight;
        ctx.fillText(`Tahun : ${periode}`, canvasWidth / 2, rowPos);
    }

    rowHeightHeader = rowPos + rowHeight*2;    
  ctx.textAlign='left';
  // Header Kolom
  ctx.font = 'bold 18px Arial';
  columns.forEach((col, i) => {
    ctx.fillText(col.label, col.x, rowHeightHeader);
  });

  // Data Rows
  ctx.font = '16px Arial';
  data.forEach((item, idx) => {
    const y = rowHeightHeader + (idx + 1) * rowHeight;
    columns.forEach((col) => {
      const value = typeof col.format === 'function' ? col.format(item[col.key]) : item[col.key] || '-';
      ctx.fillText(value, col.x, y);
    });
  });

  // Footer Tanggal Cetak
  ctx.font = 'italic 16px Arial';
  ctx.fillText('Dicetak pada: ' + DateTimeIndonesia(new Date()), 50, canvasHeight - 30);

  // Simpan Gambar
  const outputPath = path.resolve(output);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);

  console.log('✅ Laporan gambar berhasil dibuat:', outputPath);
}


function parsePerintah(text) {
  // << Tambahan di sini
  const rencanaTurnamenMatch = text.match(/tampilkan\s+rencana\s+turnamen\s+tahun\s+(\d{4})/i);
  if (rencanaTurnamenMatch) {
    const tahun = rencanaTurnamenMatch[1];
    return [{
      perintah: 'buat rencana turnamen',
      parameter: [tahun]
    }];
  }

  // Cek pola khusus: tambah|perbaiki|hapus tabel {param1, param2, ...}
  const tableCommandMatch = text.match(/^(tambah|perbaiki|hapus)\s+tabel\s*\{([^}]+)\}/i);
  if (tableCommandMatch) {
    const perintah = tableCommandMatch[1].toLowerCase();
    const rawParams = tableCommandMatch[2];
    const parameters = ['tabel', ...rawParams.split(',').map(p => p.trim()).filter(p => p)];
    return [{
      perintah: perintah,
      parameter: parameters
    }];
  }

  // Normalisasi awal
  text = text
    .replace(/\s+/g, ' ')
    .replace(/;/g, ',')
    .replace(/tampilkan/gi, 'buat')
    .replace(/h2h/gi, 'head to head')
    .replace(/pertemuan langsung/gi, 'head to head')
    .replace(/rangking|peringkat/gi, 'ranking')
    .replace(/\butnuk\b|\buntk\b|\bntuk\b|\btuk\b/gi, 'untuk')
    .trim();

  // Kata pemisah umum
  const separators = ['antara', 'dengan', 'untuk', 'pada', 'turnamen', 'dan'];

  // Temukan pemisah pertama untuk potong perintah
  let firstSeparatorIndex = -1;
  for (let word of separators) {
    const index = text.toLowerCase().indexOf(' ' + word + ' ');
    if (index !== -1 && (firstSeparatorIndex === -1 || index < firstSeparatorIndex)) {
      firstSeparatorIndex = index;
    }
  }

  const perintah = firstSeparatorIndex !== -1 ? text.substring(0, firstSeparatorIndex).trim() : text;
  const paramText = firstSeparatorIndex !== -1 ? text.substring(firstSeparatorIndex).trim() : '';

  // Ambil angka 6 digit atau lebih
  let numbers = paramText.match(/\d{6,}/g) || [];

  // Ambil frasa dengan memecah berdasarkan pemisah
  const phrases = paramText
    .replace(/\b(antara|dengan|untuk|pada|turnamen|dan)\b/gi, '|') // ganti penghubung jadi pemisah
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^\d{6,}$/.test(s)); // Hanya ambil frasa non-angka

  // Gabungkan parameter
  const parameters = [...numbers, ...phrases];

  return [{
    perintah: perintah,
    parameter: parameters
  }];
}

function parseCommand(text) {
    
  // Tangani format registrasi ulang dengan ID pemain
  const matchRegUlang = text.match(/^registrasi\s+ulang(?:\s+id\s+pemain)?\s+(\d{6,})/i);
  if (matchRegUlang) {
    return {
      perintah: 'registrasi ulang',
      parameter: [matchRegUlang[1]]
    };
  }

  // Tangani format khusus: tambah, hapus, perbaiki { ... }
  const regexData = /^(tambah|hapus|perbaiki)\s+(\w+)\s*\{([^}]+)\}$/i;
  const matchData = text.match(regexData);
  if (matchData) {
    const command = matchData[1].toLowerCase();
    const table = matchData[2];
    const values = matchData[3].split(',').map(val => val.trim());
    return {
      perintah: command,
      parameter: [table, ...values]
    };
  }

  // Tangani format: tampilkan rencana turnamen tahun XXXX
  const matchRencana = text.match(/tampilkan\s+rencana\s+turnamen\s+tahun\s+(\d{4})/i);
  if (matchRencana) {
    return {
      perintah: 'buat rencana turnamen',
      parameter: [matchRencana[1]]
    };
  }

  // Normalisasi dan penyamaan istilah
    text = text
    .replace(/\s+/g, ' ')                        // Normalisasi spasi ganda
    .replace(/[;,\.]/g, ' ')                     // Ganti ; , . jadi spasi
    .replace(/h2h|pertemuan langsung/gi, 'head to head')
    .replace(/\btampilkan\b/gi, 'buat')
    .replace(/\brangking\b|\bperingkat\b/gi, 'ranking')
    .replace(/\btahap\b|\bperiode\b|\bpriode\b|\bperbaikan peringkat\b/gi, '')
    .replace(/\butnuk\b|\buntk\b|\bntuk\b|\btuk\b|\butk\b/gi, 'untuk')

    // Normalisasi urutan ke-n
    .replace(/\b(ke[-\s]?1|ke1|ke[-\s]?satu|kesatu|satu|pertama)\b/gi, 'pertama')
    .replace(/\b(ke[-\s]?2|ke2|ke[-\s]?dua|kedua|dua)\b/gi, 'kedua')
    .replace(/\b(ke[-\s]?3|ke3|ke[-\s]?tiga|ketiga|tiga)\b/gi, 'ketiga')
    .replace(/\b(ke[-\s]?4|ke4|ke[-\s]?empat|keempat|empat)\b/gi, 'keempat')
    .replace(/\b(ke[-\s]?5|ke5|ke[-\s]?lima|kelima|lima)\b/gi, 'kelima')
    .replace(/\b(ke[-\s]?6|ke6|ke[-\s]?enam|keenam|enam)\b/gi, 'keenam')
    .replace(/\b(ke[-\s]?7|ke7|ke[-\s]?tujuh|ketujuh|tujuh)\b/gi, 'ketujuh')
    .replace(/\b(ke[-\s]?8|ke8|ke[-\s]?delapan|kedelapan|delapan)\b/gi, 'kedelapan')
    .replace(/\b(ke[-\s]?9|ke9|ke[-\s]?sembilan|kesembilan|sembilan)\b/gi, 'kesembilan')
    .replace(/\b(ke[-\s]?10|ke10|ke[-\s]?sepuluh|kesepuluh|sepuluh)\b/gi, 'kesepuluh')
    .replace(/\b(ke[-\s]?11|ke11|ke[-\s]?sebelas|kesebelas|ke sebelas|sebelas)\b/gi, 'kesebelas')
    .replace(/\b(ke[-\s]?12|ke12|ke[-\s]?dua belas|ke dua belas|kedua belas|dua belas)\b/gi, 'keduabelas')

    .trim();

  // Format khusus untuk pembuatan profil
  const profilMatch = text.match(/^buat profil (.+)$/i);
  if (profilMatch) {
    return {
      perintah: 'buat profil',
      parameter: [profilMatch[1].trim()]
    };
  }

  // Format pembuatan pool
  const poolMatch = text.match(/^buat pool .*turnamen (.+)$/i);
  if (poolMatch) {
    return {
      perintah: 'buat pool',
      parameter: [poolMatch[1].trim()]
    };
  }

  // Format daftarkan saya
  const daftarSaya = text.match(/^daftarkan saya .*turnamen (.+)$/i);
  if (daftarSaya) {
    return {
      perintah: 'daftarkan saya',
      parameter: [daftarSaya[1].trim()]
    };
  }

  // Format daftarkan orang lain
  const daftarOrang = text.match(/^daftarkan ([^\s]+) .*turnamen (.+)$/i);
  if (daftarOrang) {
    return {
      perintah: 'daftarkan',
      parameter: [daftarOrang[1].trim(), daftarOrang[2].trim()]
    };
  }

  // Tangani perintah umum dengan pemisah kata
  const separators = ['antara', 'dengan', 'untuk', 'pada', 'turnamen', 'dan'];
  let firstSeparatorIndex = -1;
  for (let word of separators) {
    const index = text.toLowerCase().indexOf(' ' + word + ' ');
    if (index !== -1 && (firstSeparatorIndex === -1 || index < firstSeparatorIndex)) {
      firstSeparatorIndex = index;
    }
  }

  const perintah = firstSeparatorIndex !== -1 ? text.substring(0, firstSeparatorIndex).trim() : text.trim();
  const paramText = firstSeparatorIndex !== -1 ? text.substring(firstSeparatorIndex).trim() : '';

  // Ambil angka panjang (6 digit ke atas)
  const numbers = paramText.match(/\d{6,}/g) || [];

  // Pisahkan frasa berdasarkan kata penghubung
  const phrases = paramText
    .replace(/\b(antara|dengan|untuk|pada|turnamen|dan)\b/gi, '|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^\d{6,}$/.test(s));

  // Gabungkan parameter
  const parameters = [...numbers, ...phrases];

  return {
    perintah: perintah.toLowerCase(),
    parameter: parameters
  };
}

function isNumber(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

function getDayNameFromDate(dateString) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const date = new Date(dateString); // Format: "YYYY-MM-DD"
  if (isNaN(date)) return "Tanggal tidak valid";
  return days[date.getDay()];
}

async function posisiLanjutan(jumlah_grup) {
  const huruf = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const juara = [];
  const runnerUp = [];

  for (let i = 0; i < jumlah_grup; i++) {
    juara.push(huruf[i] + '1');
    runnerUp.push(huruf[i] + '2');
  }

  const posisi = new Array(jumlah_grup * 2);

  // Isi posisi ganjil: 1, 3, 5, ...
  for (let i = 0; i < jumlah_grup; i++) {
    posisi[i * 2] = juara[i];
  }

  // Isi posisi genap: 10, 8, 6, ... (dari belakang)
  for (let i = 0; i < jumlah_grup; i++) {
    posisi[(jumlah_grup * 2 - 1) - i * 2] = runnerUp[i];
  }

  return posisi;
}

module.exports = {
  handleFile, readFileExcel, DateToWIB, DateToStr, DateTimeIndonesia, generateImage, generateImage2, generateImageReport, parseCommand, parsePerintah, 
  isNumber, getDayNameFromDate, posisiLanjutan
};