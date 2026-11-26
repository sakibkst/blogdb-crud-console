const LINE = '-'.repeat(70);

/** Short list: one row per blog (ID + title). */
function printBlogTitles(blogs) {
  console.table(
    blogs.map((b) => ({
      'Blog ID': b.id,
      Title: b.blogTitle,
      Category: b.category,
      'Created At': b.createAt,
    })),
  );
}

/** Full view of a single blog, including its content. */
function printBlog(blog) {
  console.log(LINE);
  console.log(`[#${blog.id}] ${blog.blogTitle}`);
  const meta = [`Category: ${blog.category}`];
  if (blog.author) meta.push(`Author: ${blog.author}`);
  if (blog.authorEmail) meta.push(`Email: ${blog.authorEmail}`);
  console.log(meta.join(' | '));
  console.log(`Created: ${blog.createAt} | Updated: ${blog.updateAt}`);
  console.log(LINE);
  console.log(blog.blog);
  console.log(LINE);
}

function printBlogs(blogs) {
  blogs.forEach((blog) => {
    console.log();
    printBlog(blog);
  });
}

function formatStatus(isActive) {
  return isActive ? 'Active' : 'Deactivated';
}

function printUsers(users) {
  console.table(
    users.map((u) => ({
      'User ID': u.id,
      Name: `${u.firstname} ${u.lastname}`,
      Email: u.email,
      Role: u.role,
      Status: formatStatus(u.isActive),
      'Created At': u.createAt,
    })),
  );
}

module.exports = { printBlogTitles, printBlog, printBlogs, printUsers, formatStatus };
