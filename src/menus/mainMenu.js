const userService = require('../services/userService');
const blogService = require('../services/blogService');
const { askRequired, askHidden, closePrompt, printSection } = require('../utils/prompt');
const { printBlogs } = require('../utils/display');
const { runMenu, LEAVE_MENU } = require('./menuRunner');
const { userMenu } = require('./userMenu');
const { adminMenu } = require('./adminMenu');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/** Reader journey: anyone can view every blog without logging in. */
async function viewAllBlogs() {
  const blogs = await blogService.allBlog();
  if (blogs.length === 0) {
    console.log('\n  No blogs are found');
    return;
  }
  console.log(`\n  All Blogs (${blogs.length})`);
  printBlogs(blogs);
}

async function login() {
  printSection('Login');
  const email = await askRequired('Email: ');
  const password = await askHidden('Password: ');

  const user = await userService.login(email, password);
  console.log(`\n  Login successful. Welcome, ${user.firstname} ${user.lastname}!`);

  if (user.role === 'admin') {
    await adminMenu(user);
  } else {
    await userMenu(user);
  }
  console.log('\n  You have been logged out.');
}

async function askEmail() {
  for (;;) {
    const email = await askRequired('Email: ', { maxLength: 100 });
    if (EMAIL_PATTERN.test(email)) return email;
    console.log('  Please enter a valid email address (e.g. name@example.com).');
  }
}

async function askNewPassword() {
  for (;;) {
    const password = await askHidden(`Password (min ${MIN_PASSWORD_LENGTH} characters): `);
    if (password.length < MIN_PASSWORD_LENGTH) {
      console.log(`  Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      continue;
    }
    const confirm = await askHidden('Confirm password: ');
    if (password === confirm) return password;
    console.log('  Passwords do not match. Please try again.');
  }
}

async function register() {
  printSection('Register');
  const firstname = await askRequired('First name: ', { maxLength: 50 });
  const lastname = await askRequired('Last name: ', { maxLength: 50 });
  const email = await askEmail();
  const password = await askNewPassword();

  const id = await userService.register({ firstname, lastname, email, password });
  console.log(`\n  Registration successful (user ID ${id}). You can now log in.`);
}

async function mainMenu() {
  await runMenu('Blog Console - Main Menu', [
    { label: 'View All Blogs', action: viewAllBlogs },
    { label: 'Login', action: login },
    { label: 'Register', action: register },
    {
      label: 'Exit',
      action: () => {
        console.log('\n  Goodbye!');
        return LEAVE_MENU;
      },
    },
  ]);
  closePrompt();
}

module.exports = { mainMenu };
