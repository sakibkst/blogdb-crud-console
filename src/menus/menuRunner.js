const { chooseOption } = require('../utils/prompt');
const { AppError, GoBack } = require('../utils/errors');

/** Returned by a menu action to leave the current menu (logout / exit). */
const LEAVE_MENU = Symbol('LEAVE_MENU');

/**
 * Shows a menu in a loop until an action returns LEAVE_MENU.
 * If the user types 0 (back) anywhere inside an action, the action is
 * cancelled and this menu is shown again.
 * @param {string} title
 * @param {{ label: string, action: () => Promise<any> | any }[]} items
 */
async function runMenu(title, items) {
  for (;;) {
    const choice = await chooseOption(
      title,
      items.map((item) => item.label),
    );
    try {
      const result = await items[choice - 1].action();
      if (result === LEAVE_MENU) return;
    } catch (err) {
      if (err instanceof GoBack) {
        console.log(`\n  Cancelled. Back to ${title}.`);
      } else if (err instanceof AppError) {
        console.log(`\n  ${err.message}`);
      } else {
        console.log(`\n  Something went wrong: ${err.message}`);
      }
    }
  }
}

module.exports = { runMenu, LEAVE_MENU };
