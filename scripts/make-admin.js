// Promotes an existing user to admin.
// Usage: npm run make-admin -- someone@example.com
//
// Same as running this SQL by hand:
//   UPDATE blogdb.users SET role = 'admin' WHERE email = 'someone@example.com';
const { initDatabase, getPool, closeDatabase } = require('../src/config/db');

async function makeAdmin() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -- <email>');
    process.exitCode = 1;
    return;
  }

  await initDatabase();
  try {
    const [result] = await getPool().execute("UPDATE users SET role = 'admin' WHERE email = ?", [
      email,
    ]);
    if (result.affectedRows === 0) {
      console.error(`No user found with email ${email}. Register the account first.`);
      process.exitCode = 1;
    } else {
      console.log(`${email} is now an admin.`);
    }
  } finally {
    await closeDatabase();
  }
}

makeAdmin().catch((err) => {
  console.error(`Failed: ${err.message}`);
  process.exitCode = 1;
});
