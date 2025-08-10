const { getConnection } = require('./gmp_db');
const path = require('path');
const fs = require('fs');
//const { connect } = require('http2');

/**
 * Menambah Data ke Table
 * @param {string} table - Tabel yang akan ditambahkan
 * @param {Array} data - Array data yang akan disimpan
 * @param {Array} result - Status proses menambah data  
 **/
async function insertData(table, data) {

  const modul='insertData';
  const connection = await getConnection();

  try {
      if (!table || typeof table !== 'string' || !data || typeof data !== 'object' || Object.keys(data).length === 0 ) {
        return {
          'module': modul,
          'success': false,
          'message': 'Table dan Data tidak Valid!.',
          'data': {},
        }
      }
      
      const keys = Object.keys(data).join(', ');
      const values = Object.values(data);
      const placeholders = values.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;
      const [result] = await connection.execute(query, values); 
      msg="✅ Proses menambah data berhasil."; 

      return {
      'module': modul,
      'success': true,
      'message': msg,
      'errnumber': 1,
      'data': result.affectedRows,
    }

  } catch (err) {
      switch (err.errno) {
        case 1062:
          msg= "_Data Tidak Dapat Ditambahkan, karena *Sudah Ada*..._" //"❌ Duplikat data (PRIMARY/UNIQUE)";
          break;
        case 1048:
          msg="❌ Gagal menambah. Data masih dipakai di tabel lain";
          break;
        case 1452:
          msg="❌ Gagal menambah. Referensi tidak ditemukan";
          break;
        default:
          msg=`✅ Proses menambah data berhasil. (${err.errno})`;
      }
    return {
      'module': modul,
      'success': false,
      'message': msg,
      'errnumber': err.errno,
      'data': {},
    }  
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Mengupdate Data ke Table
 * @param {string} table - Tabel yang akan diupdate
 * @param {Array} data - Array data yang akan diupdate
 * @param {Array} condition - Kondisi untuk menentukan baris yang akan diperbarui {kolom: nilai}
 * @param {Array} result - Status proses update data  
 **/
async function updateData(table, data, condition) {
  
  const modul='updateData';
  const connection = await getConnection();

  try {
      if (!table || typeof table !== 'string' || !data || typeof data !== 'object' || Object.keys(data).length === 0 || !condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
        return {
          'module': modul,
          'success': false,
          'message': 'Table, Data dan Kondisi tidak Valid!.',
          'data': {},
        } 
      }
      
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const conditionClause = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
      const values = [...Object.values(data), ...Object.values(condition)];
      
      const query = `UPDATE ${table} SET ${setClause} WHERE ${conditionClause}`;
      //console.log(query, values);
      const [result] = await connection.execute(query, values); 
          msg="✅ Proses memperbaiki data berhasil.";
 
      return {
        'module': modul,
        'success': true,
        'message': msg,
        'data': result,
      }      
  } catch (err) {

    switch (err.errno) {
      case 1062:
        msg="❌ Duplikat data (PRIMARY/UNIQUE)";
        break;
      case 1054:
        msg="❌ Gagal mempebaiki. Kolom tidak ada.";
        break;
      case 1366:
          msg="❌ Gagal memperbaiki. Format data tidak sesuai dengan tipe kolom.";
          break;
        case 1452:
        msg="❌ Gagal memperbaiki. Referensi tidak ditemukan.";
        break;
      default:
        msg="✅ Proses memperbaiki data berhasil.";
    } 

    return {
      'module': modul,
      'success': false,
      'message': msg,
      'data': {},
    }    
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Menghapus Data
 * @param {string} table - Tabel yang akan dihapus
 * @param {Array} conditions - Kondisi data yang akan dihapus
 * @param {Array} result - Status proses hapus data  
 */
async function deleteData(table, condition) {
  const modul='deleteData';
  const connection = await getConnection();

  try {  
      if (!table || typeof table !== 'string' || !condition || typeof condition !== 'object' || Object.keys(condition).length === 0) {
        return {
          'module': modul,
          'success': false,
          'message': 'Table dan Kondisi tidak Valid!.',
          'data': {},
        }
      }
      
      const conditionClause = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(condition);
      
      const query = `DELETE FROM ${table} WHERE ${conditionClause}`;
      const [result] = await connection.execute(query, values); 
          msg="✅ Proses menghapus data berhasil.";

      return {
        'module': modul,
        'success': true,
        'message': msg,
        'data': result,
      }      
  } catch (err) {

    switch (err.errno) {
      case 1451:
        msg="❌ Gagal menghapus. Data masih digunakan oleh tabel lain (terikat foreign key).";
        break;
      case 1064:
        msg="❌ Gagal menghapus. Kesalahan sintaks SQL.";
        break;
      case 1051:
        msg="❌ Gagal menghapus. Tabel yang ingin digunakan tidak ditemukan.";
        break;
      default:
        msg="✅ Proses menghapus data berhasil.";
    }

    return {
      'module': modul,
      'success': false,
      'message': msg,
      'data': {},
    }    
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Mengambil Data Record/Baris
 * @param {string} select - Data yang akan ditampilkan
 * @param {string} table - Tabel yang akan ditampilkan
 * @param {object} where - Kondisi data yang akan ditampilkan boleh null. 
 * @param {Array} row - Data nilai Mahasiswa
 */
async function getDataRow(select, table, where = null) {
    const modul = 'getDataRow';
    const connection = await getConnection();
  
    try {
          let query = `SELECT ${select} FROM ${table}`;
          let values = [];
  
          if (where && typeof where === 'object' && Object.keys(where).length > 0) {
              const whereClauses = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
              query += ` WHERE ${whereClauses}`;
              values = Object.values(where);
          }
  
          //console.log(query, values);

          const [rows] = await connection.execute(query, values);

          //console.log(rows);


          let status = rows.length?true:false;  

          const result={
            'module': modul,  
            'success': status, 
            'message': status?'Data berhasil dibaca...':'Data tidak ada...',
            'data': rows,
          }
          return result;
        } catch (error) {
            const result={
                'module': modul,  
                'success':false, 
                'message':error,
                'data':{},
              }
              return result;
        } finally {
          if (connection) await connection.end();
        }
  }

async function getDataRowQuery({
  columns = ['*'],
  from = '',
  joins = [],
  filters = {},
  groupBy = '',
  orderBy = '',
  limit = null
} = {}) {
  const modul = 'getDataRowQuery';
  const connection = await getConnection();

  try {
    if (!from) throw new Error("Parameter 'from' (tabel utama) wajib diisi!");

    // 1. Select Columns
    const columnClause = columns.length ? columns.join(', ') : '*';

    // 2. Join Clauses
    const joinClause = joins.map(j => {
      const type = j.type?.toUpperCase() || 'INNER';
      return `${type} JOIN ${j.table} ON (${j.on})`;
    }).join('\n');

    //console.log(filters);

    // 3. Where Filters
    const whereClause = Object.entries(filters).map(([key, value]) => {
      const match = key.match(/^(.+?)\s*(=|<>|!=|>|<|>=|<=|LIKE)$/i);
      if (!match) throw new Error(`Format filter tidak dikenali: '${key}'`);
      const [_, column, operator] = match;
      const safeVal = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
      return `${column} ${operator.toUpperCase()} ${safeVal}`;
    }).join(' AND ');

    console.log(whereClause);

    // 4. Optional GROUP BY, ORDER BY, LIMIT
    const groupClause = groupBy ? `GROUP BY ${groupBy}` : '';
    const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const limitClause = typeof limit === 'number' ? `LIMIT ${limit}` : '';

    // 5. Final Query
    const query = [
      `SELECT ${columnClause}`,
      `FROM ${from}`,
      joinClause,
      whereClause ? `WHERE ${whereClause}` : '',
      groupClause,
      orderClause,
      limitClause
    ].filter(Boolean).join(' ') + ';';

    console.log(query);

    const [rows] = await connection.execute(query);
    const status = rows.length > 0;

    return {
      module: modul,
      success: status,
      message: status ? 'Data berhasil dibaca...' : 'Data tidak ada...',
      data: rows,
    };

  } catch (error) {
    return {
      module: modul,
      success: false,
      message: error.message || error,
      data: {},
    };
  } finally {
    if (connection) await connection.end();
  }
}



/*  async function getDataRowQuery({ columns = ['*'], from = '', joins = [], filters = {}, orderBy = '', limit = null } = {}) {
    const modul = 'getDataRowQuery';
    const connection = await getConnection();
  
    
    try {
      if (!from) throw new Error("Parameter 'from' (tabel utama) wajib diisi!");
  
      // 1. Select Columns
      const columnClause = columns.length ? columns.join(', ') : '*';
  
      // 2. From & Joins
      const joinClause = joins.map(j => {
        const type = j.type?.toUpperCase() || 'INNER';
        return `${type} JOIN ${j.table} ON (${j.on})`;
      }).join('\n');

      //console.log(columnClause, joinClause);

      // 3. Where Filters (dukungan untuk kondisi seperti '=', '<>', 'LIKE', dll)
      const whereClause = Object.entries(filters).map(([key, value]) => {
        const match = key.match(/^(.+?)\s*(=|<>|!=|>|<|>=|<=|LIKE)$/i);
        if (!match) throw new Error(`Format filter tidak dikenali: '${key}'`);
        const [_, column, operator] = match;
        const safeVal = typeof value === 'string' ? `'${value}'` : value;
        return `${column} ${operator.toUpperCase()} ${safeVal}`;
      }).join(' AND ');
  
      //console.log('WHERE: ',whereClause);

      // 4. Order dan Limit
      const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
      const limitClause = typeof limit === 'number' ? `LIMIT ${limit}` : '';
  

      // 5. Final SQL
      const query = `SELECT ${columnClause} FROM ${from} ${joinClause} ${whereClause ? 'WHERE ' + whereClause : ''} ${orderClause} ${limitClause};`.trim();
  
      console.log(query);
  
      const [rows] = await connection.execute(query);
      const status = rows.length > 0;
  
      return {
        module: modul,
        success: status,
        message: status ? 'Data berhasil dibaca...' : 'Data tidak ada...',
        data: rows,
      };
  
    } catch (error) {
      return {
        module: modul,
        success: false,
        message: error.message || error,
        data: {},
      };
    } finally {
      if (connection) await connection.end();
    }
  }
*/  



  async function getDataRowQuery2({ columns = ['*'], from = '', joins = [], filters = {}, orderBy = '', limit = null} = {}) {
    const modul = 'getDataRowQuery';
    const connection = await getConnection();
  
    try {

      if (!from) throw new Error("Parameter 'from' (tabel utama) wajib diisi!");
  
      // 1. Select Columns
      const columnClause = columns.length ? columns.join(', ') : '*';
    
      // 2. From & Joins
      const joinClause = joins.map(j => {
        const type = j.type?.toUpperCase() || 'INNER';
        return `${type} JOIN ${j.table} ON (${j.on})`;
      }).join('\n');
    
      // 3. Where Filters
      const whereClause = Object.entries(filters)
        .map(([key, value]) => {
          const safeVal = typeof value === 'string' ? `'${value}'` : value;
          return `${key} = ${safeVal}`;
        }).join(' AND ');
    
      // 4. Tambahan Order dan Limit
      const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
      const limitClause = typeof limit === 'number' ? `LIMIT ${limit}` : '';
    
      // 5. Final SQL Build
      const query = `SELECT ${columnClause} FROM ${from} ${joinClause} ${whereClause ? 'WHERE ' + whereClause : ''} ${orderClause} ${limitClause};`.trim();

      console.log(query);

          const [rows] = await connection.execute(query);
          let status = rows.length?true:false;  

          const result={
            'module': modul,  
            'success': status, 
            'message': status?'Data berhasil dibaca...':'Data tidak ada...',
            'data': rows,
          }
          return result;
        } catch (error) {
            const result={
                'module': modul,  
                'success':false, 
                'message':error,
                'data':{},
              }
              return result;
        } finally {
          if (connection) await connection.end();
        }
  }
  


async function fetchDataWithConditions(selectColumns, tableName, whereConditions = {}) {
    const connection = await getConnection();

    try {
      // Validasi input
      if (!selectColumns || selectColumns.length === 0) {
        throw new Error('Kolom yang dipilih tidak boleh kosong.');
      }
      if (!tableName || tableName.length === 0) {
        throw new Error('Nama tabel tidak boleh kosong.');
      }
      //if (Object.keys(whereConditions).length === 0) {
      //  throw new Error('Kondisi WHERE tidak boleh kosong.');
      //}
  
      // Susun query SELECT
      let query = `SELECT ${selectColumns.join(', ')} FROM ${tableName} WHERE 1=1`;
      const params = [];


      if (Object.keys(whereConditions).length) {
        // Tambahkan kondisi WHERE
        for (const [column, value] of Object.entries(whereConditions)) {
          query += ` AND ${column} = ?`;
          params.push(value);
      }
    }
  
      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      if (connection) await connection.end();
    }
  }
  
/*
// Contoh penggunaan
const data = [
    { nim: '2103030033', kodemtk: 'AMS', makalah: 85, kehadiran: 100, diskusi: 85, uts: 85 },
    { nim: '2203030001', kodemtk: 'AMS', makalah: 85, kehadiran: 100, diskusi: 85, uts: 89 }
];

insertData('nilaimtk', data, ['nim', 'kodemtk']);

const updatedData = [
    { nim: '2103030033', kodemtk: 'AMS', makalah: 90, kehadiran: 100, diskusi: 90, uts: 90 }
];
updateData('nilaimtk', updatedData, ['nim', 'kodemtk']);

deleteData('nilaimtk', { nim: '2203030001', kodemtk: 'AMS' });
*/

async function getQuery({ select = "*", table, where = "", group = "", order = "" }) {
  
  const connection = await getConnection();

  if (connection===null){
    console.log("MySQL Server Belum Aktif...");
    return;
  }
  try {
 
    let query = `SELECT ${select} FROM ${table}`;
    if (where) query += ` WHERE ${where}`;
    if (group) query += ` GROUP BY ${group}`;
    if (order) query += ` ORDER BY ${order}`;

    const [rows] = await connection.execute(query);
    return rows;
  } finally {
    if (connection) await connection.end();
  }

}

async function executeSQL(sql) {
  
  const connection = await getConnection();

  if (connection===null){
    console.log("MySQL Server Belum Aktif...");
    return [];
  } 
  try {
    const [rows] = await connection.execute(sql);
    return rows;
  } finally {
    if (connection) await connection.end();
  }

}

async function resetAutoincrement(settings) {
  const modul='resetAutoincrement';
  const connection = await getConnection();

  try {  
      if (!settings || typeof settings !== 'string') {
        return {
          'module': modul,
          'success': false,
          'message': 'Settings tidak Valid!.',
          'data': {},
        }
      }
      
      const [result] = await connection.execute(settings, null);
      let status = true;  

      return {
        'module': modul,
        'success': status,
        'message': 'Settings Berhasil.',
        'data': result,
      }      
  } catch (error) {
    return {
      'module': modul,
      'success': false,
      'message': 'Settings Gagal.',
      'data': {},
    }    
  } finally {
    if (connection) await connection.end();
  }
}

async function getPeringkat(idTurnamen) {
  const modul = 'getPeringkat';
  const connection = await getConnection();

  try {
    // Ambil daftar turnamen yang lebih kecil atau sama dengan idTurnamen
    const [turnamen] = await connection.execute(
      `SELECT DISTINCT id_turnamen FROM peringkat WHERE id_turnamen <= ? ORDER BY id_turnamen`,
      [idTurnamen]
    );
    const daftarTurnamen = turnamen.map((t) => t.id_turnamen);

    //console.log("Daftar Turnamen yang Diambil:", daftarTurnamen);

    if (daftarTurnamen.length === 0) {
      console.log("Tidak ada data turnamen yang ditemukan.");
      return;
    }

    const [dataTurnamen] = await connection.execute(
      `SELECT id_turnamen, nama_turnamen, tgl_turnamen FROM turnamen WHERE id_turnamen = ?`,
      [idTurnamen]
    );

    const [peringkat] = await connection.execute(
      `SELECT p.id_pemain, pm.nama_pemain, SUM(p.total_poin) AS total_poin, 
              COUNT(DISTINCT p.id_turnamen) AS jumlah_turnamen 
       FROM peringkat p
       JOIN pemain pm ON p.id_pemain = pm.id_pemain
       WHERE p.id_turnamen IN (${daftarTurnamen.map(() => "?").join(",")}) 
       GROUP BY p.id_pemain, pm.nama_pemain`,
      daftarTurnamen
    );
    
    //console.log("Data Peringkat:", peringkat);

    if (peringkat.length === 0) {
      console.log("Tidak ada peringkat pemain ditemukan.");
      return;
    }

    
    
    // Ambil poin poin
    const [poinTurnamen] = await connection.execute(
      `SELECT id_pemain, poin_terbaik  
       FROM best_poin 
       WHERE id_turnamen = ${idTurnamen} 
       GROUP BY id_pemain`
    );

    //console.log(poinTurnamen);
 
    
    let poinTurnamenMap = {};
    poinTurnamen.forEach((p) => {
      poinTurnamenMap[p.id_pemain] = parseInt(p.poin_terbaik);
    });

    //console.log(poinTurnamenMap);

    // Ambil poin terbaik dari semua turnamen
    const [bestPoin] = await connection.execute(
      `SELECT id_pemain, MAX(poin_terbaik) AS poin_terbaik 
       FROM best_poin WHERE id_turnamen IN (${daftarTurnamen.map(() => "?").join(",")}) 
       GROUP BY id_pemain`,
      daftarTurnamen
    );

    //console.log("Data Poin Terbaik:", bestPoin);

    // Ambil data head-to-head
    const [headToHead] = await connection.execute(
      `SELECT id_pemain, id_lawan, SUM(jumlah_menang) as jumlah_menang, SUM(jumlah_kalah) as jumlah_kalah 
       FROM head_to_head WHERE id_turnamen IN (${daftarTurnamen.map(() => "?").join(",")})
       GROUP BY id_pemain, id_lawan`,
      daftarTurnamen
    );

    //console.log("Data Head-to-Head:", headToHead);
    
    // Ambil daftar pemain
    const [pemain] = await connection.execute(`SELECT id_pemain, nama_pemain FROM pemain`);

    // Ambil peringkat sebelumnya jika bukan turnamen pertama
    let peringkatSebelumnya = {};
    if (daftarTurnamen.length > 1) {
      const [prevRanking] = await connection.execute(
        `SELECT id_pemain, SUM(total_poin) AS total_poin 
         FROM peringkat WHERE id_turnamen IN (${daftarTurnamen
           .slice(0, -1)
           .map(() => "?")
           .join(",")}) 
         GROUP BY id_pemain`,
        daftarTurnamen.slice(0, -1)
      );

      prevRanking.forEach((p) => {
        peringkatSebelumnya[p.id_pemain] = p.total_poin;
      });

      //console.log("Data Peringkat Sebelumnya:", peringkatSebelumnya);
    }

    // Konversi data ke objek untuk akses cepat
    let poinTerbaikMap = {};
    bestPoin.forEach((b) => (poinTerbaikMap[b.id_pemain] = b.poin_terbaik));

    //console.log(poinTerbaikMap);

    let namaPemainMap = {};
    pemain.forEach((p) => (namaPemainMap[p.id_pemain] = p.nama_pemain));

    let headToHeadMap = {};
    headToHead.forEach((h) => {
      const key = `${h.id_pemain}-${h.id_lawan}`;
      headToHeadMap[key] = h.jumlah_menang - h.jumlah_kalah;
    });

    //console.log(headToHeadMap);

    // Konversi angka ke bilangan bulat
    peringkat.forEach((p) => {
      p.poin = poinTurnamenMap[p.id_pemain] || 0;
      p.total_poin = Math.round(parseFloat(p.total_poin)) || 0;
      p.jumlah_turnamen = parseInt(p.jumlah_turnamen, 10) || 0;
      poinTerbaikMap[p.id_pemain] = Math.round(parseFloat(poinTerbaikMap[p.id_pemain] || 0));
      peringkatSebelumnya[p.id_pemain] = Math.round(parseFloat(peringkatSebelumnya[p.id_pemain] || 0));
    });

    //console.log('---------------------', peringkatSebelumnya);

    peringkat.sort((a, b) => {
        if (b.total_poin !== a.total_poin) return b.total_poin - a.total_poin; // Urutkan berdasarkan Total Poin DESC
        if (a.jumlah_turnamen !== b.jumlah_turnamen) return a.jumlah_turnamen - b.jumlah_turnamen; // Urutkan berdasarkan Jumlah Turnamen ASC
    
        // 🔥 Gunakan total poin dari peringkat sebelumnya sebagai faktor utama dalam tiebreaker
        if ((peringkatSebelumnya[b.id_pemain] || 0) !== (peringkatSebelumnya[a.id_pemain] || 0)) 
            return (peringkatSebelumnya[b.id_pemain] || 0) - (peringkatSebelumnya[a.id_pemain] || 0);
    
        // Jika tetap sama, gunakan poin terbaik DESC
        if ((poinTerbaikMap[b.id_pemain] || 0) !== (poinTerbaikMap[a.id_pemain] || 0))
            return (poinTerbaikMap[b.id_pemain] || 0) - (poinTerbaikMap[a.id_pemain] || 0);
    
        // Gunakan head-to-head sebagai tiebreaker terakhir
        const h2hKey = `${a.id_pemain}-${b.id_pemain}`;
        const h2hReverseKey = `${b.id_pemain}-${a.id_pemain}`;
        if (headToHeadMap[h2hKey] || headToHeadMap[h2hReverseKey]) {
            return (headToHeadMap[h2hReverseKey] || 0) - (headToHeadMap[h2hKey] || 0);
        }
    
        return 0; // Jika semua tiebreaker gagal, tetap di posisi yang sama
    });
     

    // Susun Peringkat Pemain
    peringkat.forEach((p, index) => {
      p.ranking_now = index + 1 || 0;
      p.id_turnamen = idTurnamen;
    });


    /*    
    peringkat.forEach((p, index) => {
      console.log(
        `| ${index + 1}  | ${p.id_pemain}    | ${namaPemainMap[p.id_pemain]} | ${p.total_poin} | ${
          poinTerbaikMap[p.id_pemain] || 0
        } | ${p.jumlah_turnamen} |`
      );
    });
    */

    let status = peringkat?true:false;  

    return {
        'module': modul,
        'success': status,
        'message': 'Proses Membuat Peringkat Pemain Berhasil.',
        'turnamen': dataTurnamen,
        'data': peringkat,
        //peringkat,
    }
  } catch (error) {
    return {
      'module': modul,
      'success': false,
      'message': `Proses Membuat Peringkat Pemain Gagal.`,
      'turnamen': {},
      'data': {},
  }
} finally {
    if (connection) await connection.end();
  }
}

async function getPeringkatAll(idTurnamen) {
  const modul = 'getPeringkat';
  const connection = await getConnection();

  try {
    // Ambil daftar id_turnamen <= idTurnamen
    const [turnamen] = await connection.execute(
      `SELECT DISTINCT id_turnamen FROM peringkat WHERE id_turnamen <= ? ORDER BY id_turnamen`,
      [idTurnamen]
    );
    const daftarTurnamen = turnamen.map((t) => t.id_turnamen);
    if (daftarTurnamen.length === 0) {
      return { module: modul, success: false, message: 'Tidak ada turnamen ditemukan.', turnamen: {}, data: [] };
    }

    const [dataTurnamen] = await connection.execute(
      `SELECT id_turnamen, nama_turnamen, tgl_turnamen FROM turnamen WHERE id_turnamen = ?`,
      [idTurnamen]
    );

    const [peringkat] = await connection.execute(
      `SELECT p.id_pemain, pm.nama_pemain, SUM(p.total_poin) AS total_poin, 
              COUNT(DISTINCT p.id_turnamen) AS jumlah_turnamen 
       FROM peringkat p
       JOIN pemain pm ON p.id_pemain = pm.id_pemain
       WHERE p.id_turnamen IN (${daftarTurnamen.map(() => "?").join(",")}) 
       GROUP BY p.id_pemain, pm.nama_pemain`,
      daftarTurnamen
    );

    if (peringkat.length === 0) {
      return { module: modul, success: false, message: 'Tidak ada data peringkat.', turnamen: dataTurnamen, data: [] };
    }

    // Ambil data poin terbaik dan head-to-head (opsional untuk tiebreaker)
    const [bestPoin] = await connection.execute(
      `SELECT id_pemain, MAX(poin_terbaik) AS poin_terbaik 
       FROM best_poin WHERE id_turnamen IN (${daftarTurnamen.map(() => "?").join(",")}) 
       GROUP BY id_pemain`,
      daftarTurnamen
    );

    const [headToHead] = await connection.execute(
      `SELECT id_pemain, id_lawan, SUM(jumlah_menang) as jumlah_menang, SUM(jumlah_kalah) as jumlah_kalah 
       FROM head_to_head WHERE id_turnamen IN (${daftarTurnamen.map(() => "?").join(",")})
       GROUP BY id_pemain, id_lawan`,
      daftarTurnamen
    );

    // Ambil peringkat sebelumnya jika ada turnamen sebelum ini
    let peringkatSebelumnyaMap = {};
    let urutanPeringkatSebelumnya = {};
    if (daftarTurnamen.length > 1) {
      const prevTurnamenId = daftarTurnamen[daftarTurnamen.length - 2];

      const [prevPoin] = await connection.execute(
        `SELECT p.id_pemain, pm.nama_pemain, SUM(p.total_poin) AS total_poin 
         FROM peringkat p
         JOIN pemain pm ON p.id_pemain = pm.id_pemain
         WHERE p.id_turnamen <= ?
         GROUP BY p.id_pemain
         ORDER BY total_poin DESC`,
        [prevTurnamenId]
      );

      prevPoin.forEach((p, index) => {
        peringkatSebelumnyaMap[p.id_pemain] = Math.round(p.total_poin);
        urutanPeringkatSebelumnya[p.id_pemain] = index + 1;
      });
    }

    // Mapping dan pemrosesan data
    let poinTerbaikMap = {};
    bestPoin.forEach((b) => (poinTerbaikMap[b.id_pemain] = Math.round(b.poin_terbaik || 0)));

    let headToHeadMap = {};
    headToHead.forEach((h) => {
      const key = `${h.id_pemain}-${h.id_lawan}`;
      headToHeadMap[key] = h.jumlah_menang - h.jumlah_kalah;
    });

    // Normalisasi nilai dan isi peringkat sebelumnya
    peringkat.forEach((p) => {
      p.total_poin = Math.round(parseFloat(p.total_poin));
      p.jumlah_turnamen = parseInt(p.jumlah_turnamen);
      p.ranking_prev = urutanPeringkatSebelumnya[p.id_pemain] || 0;
    });

    // Urutkan peringkat saat ini
    peringkat.sort((a, b) => {
      if (b.total_poin !== a.total_poin) return b.total_poin - a.total_poin;
      if (a.jumlah_turnamen !== b.jumlah_turnamen) return a.jumlah_turnamen - b.jumlah_turnamen;
      if ((peringkatSebelumnyaMap[b.id_pemain] || 0) !== (peringkatSebelumnyaMap[a.id_pemain] || 0))
        return (peringkatSebelumnyaMap[b.id_pemain] || 0) - (peringkatSebelumnyaMap[a.id_pemain] || 0);
      if ((poinTerbaikMap[b.id_pemain] || 0) !== (poinTerbaikMap[a.id_pemain] || 0))
        return (poinTerbaikMap[b.id_pemain] || 0) - (poinTerbaikMap[a.id_pemain] || 0);
      const h2hKey = `${a.id_pemain}-${b.id_pemain}`;
      const h2hReverseKey = `${b.id_pemain}-${a.id_pemain}`;
      return (headToHeadMap[h2hReverseKey] || 0) - (headToHeadMap[h2hKey] || 0);
    });

    peringkat.forEach((p,index) => {
      p.ranking_now = index+1;
    });

    return {
      module: modul,
      success: true,
      message: 'Proses Membuat Peringkat Pemain Berhasil.',
      turnamen: dataTurnamen,
      data: peringkat.map(p => ({
        id_pemain: p.id_pemain,
        nama_pemain: p.nama_pemain,
        total_poin: p.total_poin,
        jumlah_turnamen: p.jumlah_turnamen,
        ranking_now: p.ranking_now,
        ranking_prev: p.ranking_prev,
      }))
    };
  } catch (error) {
    console.error("❌ ERROR:", error);
    return {
      module: modul,
      success: false,
      message: 'Proses Membuat Peringkat Pemain Gagal.',
      turnamen: {},
      data: [],
    };
  } finally {
    if (connection) await connection.end();
  }
}



/*
* Fungsi Head To Head
*/

async function findHeadToHead(id_pemain, id_lawan, id_turnamen) {
  const modul='findHeadToHead';
  const connection = await getConnection();

    try {
        // Ambil daftar turnamen yang <= id_turnamen
        const [turnamen] = await connection.execute(
            `SELECT id_turnamen FROM turnamen WHERE id_turnamen <= ? ORDER BY id_turnamen`,
            [id_turnamen]
        );
        const daftarTurnamen = turnamen.map((t) => t.id_turnamen);

        if (daftarTurnamen.length === 0) {
            return [];
        }

        // Query lengkap dengan join ke pemain, pertandingan, dan turnamen
        const [result] = await connection.execute(
          `SELECT 
              h.id_pemain,
              p1.nama_pemain,
              h.id_lawan,
              p2.nama_pemain AS nama_lawan,
              h.jumlah_menang,
              h.jumlah_kalah,
              t.nama_turnamen,
              t.tgl_turnamen
          FROM head_to_head h
          JOIN pemain p1 ON h.id_pemain = p1.id_pemain
          JOIN pemain p2 ON h.id_lawan = p2.id_pemain
          JOIN turnamen t ON t.id_turnamen = h.id_turnamen
          WHERE h.id_turnamen IN (${daftarTurnamen.map(() => '?').join(',')})
            AND h.id_pemain = ?
            AND h.id_lawan = ?
          ORDER BY h.id_turnamen`,
          [...daftarTurnamen, id_pemain, id_lawan]
      );

      const [pertandingan] = await connection.execute(
        `SELECT 
          pertandingan.babak,
          pertandingan.pool,
          pertandingan.skor_pemain,
          pertandingan.skor_lawan,
          pertandingan.poin,
          master_poin.keterangan_babak
          FROM
            pertandingan
            INNER JOIN master_poin ON (pertandingan.babak = master_poin.babak)
          WHERE
            id_turnamen IN (${daftarTurnamen.map(() => '?').join(',')})  
            AND id_pemain = ? 
            AND id_lawan = ?
            ORDER BY id_turnamen, id_turnamen`,
        [...daftarTurnamen, id_pemain, id_lawan]
      );
      
        return {
            'modul': modul,
            'success': true,
            'message': 'Data Berhasil Ditemukan.',
            'data': result.map((row) => ({
                id_pemain: row.id_pemain,
                nama_pemain: row.nama_pemain,
                id_lawan: row.id_lawan,
                nama_lawan: row.nama_lawan,
                jumlah_menang: parseInt(row.jumlah_menang),
                jumlah_kalah: parseInt(row.jumlah_kalah),
                nama_turnamen: row.nama_turnamen,
                tgl_turnamen: row.tgl_turnamen
            }             
            )),
            'pertandingan': pertandingan,
          }
     } catch (err) {
      return {
        'modul': modul,
        'success': false,
        'message': 'Terjadi Kesalahan: ${err}.',
        'data': {},
      }
    } finally {
        if (connection) await connection.end();
    }
}

/**
 * Fungsi untuk mencari id_pemain berdasarkan nama yang fleksibel
 * @param {string} inputNama - Nama yang diinput user (bisa tidak lengkap)
  */
async function getIDPlayer(param) {
  const modul='getIDPlayer';
  const connection = await getConnection();

  try {  
      // Pecah nama input menjadi kata-kata
      const keywords = param.replace(/\./g, '').trim().split(/\s+/);

      // Buat query WHERE dengan LIKE untuk tiap kata
      const likeConditions = keywords.map(() => `nama_pemain LIKE ?`).join(' AND ');
      const likeValues = keywords.map(word => `%${word}%`);

      const query = `SELECT id_pemain, nama_pemain FROM pemain WHERE ${likeConditions}`;

      //console.log(query, likeValues);

      const [result] = await connection.query(query, likeValues);
      const status = result.length? true: false;
      //console.log(result);

      return {
        'module': modul,
        'success': status,
        'message': 'ID Pemain Berhasil...',
        'data': result,
      }      
  } catch (error) {
    return {
      'module': modul,
      'success': false,
      'message': 'ID Pemain tidak ditemukan.',
      'data': {},
    }    
  } finally {
    if (connection) await connection.end();
  }
}

async function getPosisiTerbaik(idTurnamen, idPemain) {
  const modul = 'getPosisiTerbaik';
  const connection = await getConnection();

  try {
    const [posisi] = await connection.execute(
      `SELECT 
        pertandingan.id_turnamen,
        pertandingan.babak,
        pertandingan.pool,
        pertandingan.id_pemain,
        pertandingan.skor_pemain,
        pertandingan.id_lawan,
        pertandingan.skor_lawan,
        pertandingan.poin,
        pemain.nama_pemain,
        pemain1.nama_pemain AS nama_lawan,
        master_poin.keterangan_babak
      FROM
        pertandingan
        INNER JOIN pemain ON (pertandingan.id_pemain = pemain.id_pemain)
        INNER JOIN pemain pemain1 ON (pertandingan.id_lawan = pemain1.id_pemain)
        INNER JOIN master_poin ON (pertandingan.babak = master_poin.babak)
      WHERE
        pertandingan.id_turnamen = ? AND 
        pertandingan.id_pemain = ?
      ORDER BY
        pertandingan.id_pertandingan`,
      [idTurnamen, idPemain]
    );
    
    //console.log("Data Peringkat:", peringkat);

    if (posisi.length === 0) {
      console.log("Data pemain tidak ditemukan.");
      return;
    }

    let status = posisi?true:false;  

    return {
        'module': modul,
        'success': status,
        'message': 'Proses Posisi Pemain Berhasil.',
        'data': posisi,
    }
  } catch (error) {
    return {
      'module': modul,
      'success': false,
      'message': 'Proses Posisi Pemain Gagal.',
      'data': {},
  }
} finally {
    if (connection) await connection.end();
  }
}

async function findRanking(rowPeringkat, id_pemain) {
  const ranking = rowPeringkat.find(item => item.id_pemain === id_pemain);
  if (ranking) {
    return ranking;
  } else {
    return null; 
  }
}

async function updateRanking() {
  const modul = 'updateRanking';
  const connection = await getConnection();

  try {

    const recPemain = await getDataRow('id_pemain as id_peserta, nama_pemain', 'pemain');
    if (!recPemain.success) {
      console.log(`Data Tidak Ada...`);
      return;
    }
    
    const rowPemain = recPemain.data;
    //console.log(rowPemain);
    for (item_pemain of rowPemain) {
      const id_peserta = item_pemain.id_peserta;
      //console.log(id_peserta);

      const recTurnamen = await getDataRow('id_turnamen', 'turnamen', {'LOWER(status)': 'selesai' });
      if (!recTurnamen.success) {
        console.log('Data tidak ada');
        return;
      }
      
      const poinAwal = {};
      for (let i = 1; i <= 8; i++) {
        poinAwal[`poin${i}`] = 0;
        poinAwal[`poin_akumulasi${i}`] = 0;
        poinAwal[`ranking${i}`] = 0;
      }

      const rowTurnamen = recTurnamen.data;
      const tahun = rowTurnamen[0].id_turnamen.slice(0, 4);
      for (item_turnamen of rowTurnamen){
        // Buat Data Awal
        const id_turnamen = item_turnamen.id_turnamen.toString();
        const tahun = id_turnamen.slice(0, 4);
        const bulan = parseInt(id_turnamen.slice(4, 6), 10);
        //console.log(id_turnamen, tahun, bulan);


        const recPeringkat = await getPeringkat(id_turnamen);
        //if (recPeringkat.success) {
            const rowsPeringkat = recPeringkat.data;
            const rowPeringkat = await findRanking(rowsPeringkat, id_peserta);

            //console.log(rowPeringkat);
            if (rowPeringkat) {
              //console.log(rowPeringkat.poin)
              poinAwal[`poin${bulan}`] = rowPeringkat.poin;
              poinAwal[`poin_akumulasi${bulan}`] = rowPeringkat.total_poin;
              poinAwal[`ranking${bulan}`] = rowPeringkat.ranking_now;
              //console.log('Ada :', poinAwal);
            } else {
              if (bulan!==1) {
                poinAwal[`poin${bulan}`] = poinAwal[`poin${bulan-1}`];
                poinAwal[`poin_akumulasi${bulan}`] = poinAwal[`poin_akumulasi${bulan-1}`];
                poinAwal[`ranking${bulan}`] = poinAwal[`ranking${bulan}`];
                //console.log('Tidak Ada :', poinAwal);
              }
            //}
        }

      } // Akhir Turnamen

      // Hapus data ranking

      data = {'id_peserta': id_peserta, 'tahun': tahun, ...poinAwal}; 
      const row = await getDataRow('*', 'ranking', {'id_peserta': id_peserta, 'tahun': tahun});
      if (row.success) {
        await updateData('ranking', data, {'id_peserta': id_peserta, 'tahun': tahun});
        //console.log('Ketemu');
      } else {
        if (id_peserta !== '2023999') await insertData('ranking', data);
        //console.log('Tidak Ketemu'); 
      }

      //console.log(data);

    } // Akhir Pemain
    
    return {
        module: modul,
        success: true,
        message: `Proses selesai.`
      };
  
  } catch (error) {

    return {
      module: modul,
      success: false,
      message: `Proses gagal.`
    };

  } finally {
    if (connection) await connection.end();
  }
}



module.exports = {
    insertData, 
    updateData, 
    deleteData,
    getDataRow,
    getDataRowQuery,
    fetchDataWithConditions, 
    getQuery, 
    resetAutoincrement, 
    getPeringkat,
    getPeringkatAll,
    findHeadToHead, 
    executeSQL, 
    getIDPlayer, 
    getPosisiTerbaik,
    findRanking, 
    updateRanking
}