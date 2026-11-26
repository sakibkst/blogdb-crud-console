const { initDatabase, closeDatabase, DB_NAME } = require('./src/config/db');
const { mainMenu } = require('./src/menus/mainMenu');
const { onPromptClose, closePrompt } = require('./src/utils/prompt');

// Once connected, every way of leaving the app (Exit option, Ctrl+C, Ctrl+D)
// closes the console prompt, which ends up here.
function exitWhenPromptCloses() {
  let shuttingDown = false;
  onPromptClose(async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    try {
      await closeDatabase();
    } finally {
      process.exit(process.exitCode ?? 0);
    }
  });
}

async function main() {
  console.log('==============================================');
  console.log('        Blog CRUD Console (Node + MySQL)      ');
  console.log('==============================================');

  try {
    await initDatabase();
  } catch (err) {
    console.error(`\nCould not connect to MySQL: ${err.message || err.code}`);
    console.error('Check DB_HOST, DB_PORT, DB_USER and DB_PASSWORD in your .env file.');
    process.exitCode = 1;
    await closeDatabase();
    closePrompt();
    return;
  }

  console.log(`Connected to MySQL database "${DB_NAME}".`);
  exitWhenPromptCloses();
  await mainMenu();
}

main();
