const blogService = require('../services/blogService');
const {
  askRequired,
  askWithDefault,
  askId,
  askYesNo,
  askMultiline,
  printSection,
} = require('../utils/prompt');
const { printBlogTitles, printBlog } = require('../utils/display');
const { AppError } = require('../utils/errors');
const { runMenu, LEAVE_MENU } = require('./menuRunner');
const { searchBlogFlow } = require('./blogActions');

/** Lists the titles of the logged-in user's blogs, or "No blogs are found". */
async function viewYourBlogs(user) {
  const blogs = await blogService.getBlogsByUser(user.id);
  if (blogs.length === 0) {
    console.log('\n  No blogs are found');
    return;
  }
  console.log(`\n  Your Blogs (${blogs.length})`);
  printBlogTitles(blogs);
}

async function askBlogContent(intro) {
  for (;;) {
    const content = await askMultiline(intro);
    if (content) return content;
    console.log('  Blog content cannot be empty.');
  }
}

async function createBlog(user) {
  printSection('Create Blog');
  const blogTitle = await askRequired('Blog title: ', { maxLength: 200 });
  const category = await askRequired('Category: ', { maxLength: 50 });
  const blog = await askBlogContent('Write your blog:');

  const id = await blogService.createBlog(user.id, { blogTitle, blog, category });
  console.log(`\n  Blog created successfully (blog ID ${id}).`);
}

/** Fetches a blog by ID and makes sure it belongs to the logged-in user. */
async function getOwnBlog(user, id) {
  const blog = await blogService.getBlogById(id);
  if (!blog || blog.userId !== user.id) {
    throw new AppError(`No blog with ID ${id} was found in your blogs.`);
  }
  return blog;
}

async function updateBlog(user) {
  printSection('Update Blog');
  const id = await askId('Enter the ID of the blog to update: ');
  const current = await getOwnBlog(user, id);

  console.log('\nCurrent blog:');
  printBlog(current);

  const blogTitle = await askWithDefault('New title', current.blogTitle, { maxLength: 200 });
  const category = await askWithDefault('New category', current.category, { maxLength: 50 });
  const newContent = await askMultiline(
    'New content (type END straight away to keep the current content):',
  );
  const blog = newContent || current.blog;

  await blogService.updateBlog(id, user.id, { blogTitle, blog, category });
  console.log(`\n  Blog ${id} updated successfully.`);
}

async function deleteBlog(user) {
  printSection('Delete Blog');
  const id = await askId('Enter the ID of the blog to delete: ');
  const blog = await getOwnBlog(user, id);

  if (!(await askYesNo(`Delete blog #${id} "${blog.blogTitle}"?`))) {
    console.log('\n  Delete cancelled.');
    return;
  }
  await blogService.deleteBlog(id, user.id);
  console.log(`\n  Blog ${id} deleted successfully.`);
}

async function userMenu(user) {
  // Right after login, show the user's blog titles (or "No blogs are found").
  await viewYourBlogs(user);

  await runMenu(`User Menu (${user.firstname})`, [
    { label: 'View Your Blogs', action: () => viewYourBlogs(user) },
    { label: 'Search Blog by ID/Title', action: () => searchBlogFlow({ userId: user.id }) },
    { label: 'Create Blog', action: () => createBlog(user) },
    { label: 'Update Blog', action: () => updateBlog(user) },
    { label: 'Delete Blog', action: () => deleteBlog(user) },
    { label: 'Logout', action: () => LEAVE_MENU },
  ]);
}

module.exports = { userMenu };
