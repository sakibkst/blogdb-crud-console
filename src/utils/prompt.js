const readline = require('node:readline/promises');
const { Writable } = require('node:stream');
const { stdin, stdout } = require('node:process');
const { GoBack } = require('./errors');

/** Typing this at any prompt inside a menu action goes back to the menu. */
const BACK_KEY = '0';
const BACK_HINT = `(Type ${BACK_KEY} and press Enter at any prompt to go back)`;

// readline echoes typed characters through its output stream. Routing that
// output through this proxy lets us mute the echo while a password is typed.
let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) stdout.write(chunk, encoding);
    callback();
  },
});
// Let readline see the real terminal width so long input lines wrap correctly.
Object.defineProperty(output, 'columns', { get: () => stdout.columns });
stdout.on('resize', () => output.emit('resize'));

const rl = readline.createInterface({ input: stdin, output, terminal: Boolean(stdin.isTTY) });

let closed = false;
rl.on('close', () => {
  closed = true;
});
// Ctrl+C closes the app instead of leaving the prompt paused.
rl.on('SIGINT', () => rl.close());

// Once the console is closed the app is shutting down: park the caller
// forever rather than letting menu loops spin on a dead interface.
const never = () => new Promise(() => {});

async function askRaw(question) {
  if (closed) return never();
  try {
    return await rl.question(question);
  } catch (err) {
    if (closed) return never();
    throw err;
  }
}

/** Plain question. Does NOT treat 0 as "back". */
async function ask(question) {
  return (await askRaw(question)).trim();
}

/** Question where typing 0 goes back to the menu. */
async function askOrBack(question) {
  const answer = await ask(question);
  if (answer === BACK_KEY) throw new GoBack();
  return answer;
}

/** Prints a section title and reminds the user how to go back. */
function printSection(title) {
  console.log(`\n---------- ${title} ----------`);
  console.log(BACK_HINT);
}

async function askRequired(question, { maxLength } = {}) {
  for (;;) {
    const answer = await askOrBack(question);
    if (!answer) {
      console.log('  This field is required.');
    } else if (maxLength && answer.length > maxLength) {
      console.log(`  Must be at most ${maxLength} characters.`);
    } else {
      return answer;
    }
  }
}

/** Asks for a new value; pressing Enter keeps the current one. */
async function askWithDefault(question, current, { maxLength } = {}) {
  for (;;) {
    const answer = await askOrBack(`${question} [${current}] (press Enter to keep): `);
    if (!answer) return current;
    if (!maxLength || answer.length <= maxLength) return answer;
    console.log(`  Must be at most ${maxLength} characters.`);
  }
}

/** Like askOrBack(), but typed characters are not shown. */
async function askHidden(question) {
  if (closed) return never();
  stdout.write(question);
  muted = true;
  let answer;
  try {
    answer = await ask('');
  } finally {
    muted = false;
    stdout.write('\n');
  }
  if (answer === BACK_KEY) throw new GoBack();
  return answer;
}

/** Asks until the user types a positive whole number (0 goes back). */
async function askId(question) {
  for (;;) {
    const answer = await askOrBack(question);
    if (/^[1-9]\d*$/.test(answer)) return Number(answer);
    console.log(`  Please enter a valid ID (a positive whole number), or ${BACK_KEY} to go back.`);
  }
}

async function askYesNo(question) {
  for (;;) {
    const answer = (await askOrBack(`${question} (y/n): `)).toLowerCase();
    if (answer === 'y' || answer === 'yes') return true;
    if (answer === 'n' || answer === 'no') return false;
    console.log(`  Please answer 'y' or 'n' (or ${BACK_KEY} to go back).`);
  }
}

/**
 * Reads several lines of text until the user types END on its own line.
 * Typing 0 as the first line goes back. Returns '' when nothing was entered.
 */
async function askMultiline(intro) {
  console.log(intro);
  console.log(`  (Type END on a new line when you are finished, or ${BACK_KEY} on the first line to go back.)`);
  const lines = [];
  for (;;) {
    const line = await askRaw('> ');
    if (lines.length === 0 && line.trim() === BACK_KEY) throw new GoBack();
    if (line.trim() === 'END') break;
    lines.push(line);
  }
  return lines.join('\n').trim();
}

/**
 * Prints a numbered menu and returns the chosen option number (1-based).
 * With allowBack, a "0. Back" option is shown and choosing it throws GoBack.
 */
async function chooseOption(title, labels, { allowBack = false } = {}) {
  console.log(`\n========== ${title} ==========`);
  labels.forEach((label, i) => console.log(`  ${i + 1}. ${label}`));
  if (allowBack) console.log(`  ${BACK_KEY}. Back`);

  const range = allowBack ? `${BACK_KEY} and ${labels.length}` : `1 and ${labels.length}`;
  for (;;) {
    const answer = await ask('Select an option: ');
    if (allowBack && answer === BACK_KEY) throw new GoBack();
    const choice = Number(answer);
    if (/^\d+$/.test(answer) && choice >= 1 && choice <= labels.length) return choice;
    console.log(`  Please enter a number between ${range}.`);
  }
}

function onPromptClose(listener) {
  rl.on('close', listener);
}

function closePrompt() {
  rl.close();
}

module.exports = {
  ask,
  askRequired,
  askWithDefault,
  askHidden,
  askId,
  askYesNo,
  askMultiline,
  chooseOption,
  printSection,
  onPromptClose,
  closePrompt,
};
