const userService = require('../services/userService');
const blogService = require('../services/blogService');
const { askId, askYesNo, chooseOption, printSection } = require('../utils/prompt');
const { printUsers, printBlogs, formatStatus } = require('../utils/display');
const { AppError } = require('../utils/errors');
const { runMenu, LEAVE_MENU } = require('./menuRunner');
const { searchBlogFlow } = require('./blogActions');

async function viewAllUsers() {
  const users = await userService.allUsers();
  console.log(`\n  All Users (${users.length})`);
  printUsers(users);
}

async function viewAllBlogs() {
  const blogs = await blogService.allUsersBlog();
  if (blogs.length === 0) {
    console.log('\n  No blogs are found');
    return;
  }
  console.log(`\n  All Blogs From All Users (${blogs.length})`);
  printBlogs(blogs);
}

async function getUserOrFail(id) {
  const user = await userService.findUserById(id);
  if (!user) throw new AppError(`No user with ID ${id} was found.`);
  return user;
}

/** Update a user's isActive status. Deactivated users cannot log in. */
async function updateUser(admin) {
  printSection('Update User Status');
  const id = await askId('Enter the user ID: ');
  if (id === admin.id) throw new AppError('You cannot change the status of your own account.');

  const user = await getUserOrFail(id);
  printUsers([user]);

  const choice = await chooseOption(
    'Set isActive status',
    ['Active (isActive = true)', 'Deactivated (isActive = false)'],
    { allowBack: true },
  );
  const isActive = choice === 1;
  if (Boolean(user.isActive) === isActive) {
    console.log(`\n  User ${id} is already ${formatStatus(isActive)}.`);
    return;
  }

  await userService.updateUserStatus(id, isActive);
  console.log(`\n  User ${id} is now ${formatStatus(isActive)}.`);
}

async function deleteUser(admin) {
  printSection('Delete User');
  const id = await askId('Enter the ID of the user to delete: ');
  if (id === admin.id) throw new AppError('You cannot delete your own account.');

  const user = await getUserOrFail(id);
  printUsers([user]);

  const blogCount = await blogService.countBlogsByUser(id);
  const warning = blogCount > 0 ? ` This will also delete their ${blogCount} blog(s).` : '';
  if (!(await askYesNo(`Delete user ${user.email}?${warning}`))) {
    console.log('\n  Delete cancelled.');
    return;
  }
  await userService.deleteUser(id);
  console.log(`\n  User ${id} deleted successfully.`);
}

async function deleteAnyBlog() {
  printSection('Delete Blog');
  const id = await askId('Enter the ID of the blog to delete: ');
  const blog = await blogService.getBlogById(id);
  if (!blog) throw new AppError(`No blog with ID ${id} was found.`);

  if (!(await askYesNo(`Delete blog #${id} "${blog.blogTitle}" by ${blog.author}?`))) {
    console.log('\n  Delete cancelled.');
    return;
  }
  await blogService.deleteBlog(id);
  console.log(`\n  Blog ${id} deleted successfully.`);
}

async function adminMenu(admin) {
  await runMenu('Admin Menu', [
    { label: 'View All Users', action: viewAllUsers },
    { label: 'View All Blogs', action: viewAllBlogs },
    { label: 'Search Blog by ID/Title', action: () => searchBlogFlow() },
    { label: 'Update User', action: () => updateUser(admin) },
    { label: 'Delete User', action: () => deleteUser(admin) },
    { label: 'Delete Blog', action: deleteAnyBlog },
    { label: 'Logout', action: () => LEAVE_MENU },
  ]);
}

module.exports = { adminMenu };
