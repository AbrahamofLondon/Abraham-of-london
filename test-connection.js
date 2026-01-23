const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require'
});
client.connect()
  .then(() => client.query('SELECT now()'))
  .then(res => console.log('Time:', res.rows[0].now))
  .catch(err => console.error('Error:', err))
  .finally(() => client.end());
