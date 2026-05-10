import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const localPool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '123456',
  database: 'salon',
  port: 5432,
});

async function exportSchema() {
  let output = "-- FINAL SUPABASE MIGRATION\n-- Generated on " + new Date().toISOString() + "\nBEGIN;\n";
  try {
    const tablesRes = await localPool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
    );
    const tables = tablesRes.rows.map(r => r.table_name);

    for (const table of tables) {
      const colsRes = await localPool.query(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = $1 AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [table]
      );

      let createSql = `CREATE TABLE IF NOT EXISTS ${table} (\n`;
      const colDefs = colsRes.rows.map(c => {
        let type = c.data_type;
        let colName = c.column_name;
        if (type === 'ARRAY') {
          type = c.udt_name.startsWith('_') ? c.udt_name.substring(1) + '[]' : c.udt_name + '[]';
        }
        if (c.column_default && c.column_default.includes('nextval')) {
          return `  ${colName} SERIAL PRIMARY KEY`;
        }
        let def = `  ${colName} ${type}`;
        if (c.is_nullable === 'NO') def += ' NOT NULL';
        if (c.column_default && !c.column_default.includes('nextval')) {
          def += ` DEFAULT ${c.column_default}`;
        }
        return def;
      });
      createSql += colDefs.join(',\n') + '\n);\n\n';
      output += createSql;
    }

    for (const table of tables) {
      const rowsRes = await localPool.query(`SELECT * FROM ${table}`);
      if (rowsRes.rows.length === 0) continue;
      output += `-- Data for ${table}\n`;
      const columns = Object.keys(rowsRes.rows[0]).join(', ');
      for (const row of rowsRes.rows) {
        const values = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (Array.isArray(v)) return `ARRAY['${v.map(item => item.toString().replace(/'/g, "''")).join("','")}']`;
          if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
          if (v instanceof Date) return `'${v.toISOString()}'`;
          if (typeof v === 'object') return `'${JSON.stringify(v)}'`;
          return v;
        }).join(', ');
        output += `INSERT INTO ${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
      }
    }
    output += "\nCOMMIT;";
    fs.writeFileSync('scratch/migration_final.sql', output);
    console.log("✅ migration_final.sql generated successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await localPool.end();
  }
}

exportSchema();
