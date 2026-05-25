import pkg from 'pg';
const { Pool } = pkg;

const passwords = [
  'admin', 'postgres', '123456', 'root', '', '12345', 'password', 'jaker',
  'andrei', 'andrei123', 'nagba', 'nagba123', 'admin123', 'postgres123',
  '12345678', '123456789', '1234', '123', 'rootroot', 'password123',
  'jaker123', 'jaker12345'
];
const databases = ['salon', 'salon_db', 'postgres'];

async function testAll() {
  for (const db of databases) {
    for (const pw of passwords) {
      const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: db,
        password: pw,
        port: 5432,
      });
      try {
        const res = await pool.query('SELECT NOW()');
        console.log(`SUCCESS: db=${db}, user=postgres, password=${pw}`);
        await pool.end();
        return;
      } catch (err) {
        if (!err.message.includes('password authentication failed')) {
          console.log(`DB/USER OK, but error: db=${db}, password=${pw}: ${err.message}`);
        }
        await pool.end();
      }
    }
  }
  console.log("All combinations failed.");
}

testAll();
