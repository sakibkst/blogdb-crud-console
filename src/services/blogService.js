const { getPool } = require('../config/db');

const BLOG_WITH_AUTHOR = `
  SELECT b.id, b.userId, b.blogTitle, b.blog, b.category, b.createAt, b.updateAt,
         CONCAT(u.firstname, ' ', u.lastname) AS author,
         u.email AS authorEmail
  FROM blogs b
  JOIN users u ON u.id = b.userId`;

/** Reader: every blog in the system, newest first (no login needed). */
async function allBlog() {
  const [rows] = await getPool().query(
    `SELECT b.id, b.blogTitle, b.blog, b.category, b.createAt, b.updateAt,
            CONCAT(u.firstname, ' ', u.lastname) AS author
     FROM blogs b
     JOIN users u ON u.id = b.userId
     ORDER BY b.createAt DESC, b.id DESC`,
  );
  return rows;
}

/** Admin: every blog from every user, including the author's email and user ID. */
async function allUsersBlog() {
  const [rows] = await getPool().query(`${BLOG_WITH_AUTHOR} ORDER BY b.userId, b.id`);
  return rows;
}

/** Logged-in user: blogs created by that user. */
async function getBlogsByUser(userId) {
  const [rows] = await getPool().execute(
    'SELECT id, blogTitle, category, createAt, updateAt FROM blogs WHERE userId = ? ORDER BY id',
    [userId],
  );
  return rows;
}

async function getBlogById(id) {
  const [rows] = await getPool().execute(`${BLOG_WITH_AUTHOR} WHERE b.id = ?`, [id]);
  return rows[0] || null;
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Search by blog ID (exact) or by title (partial, case-insensitive).
 * Pass userId to limit the search to one user's blogs.
 */
async function searchBlogs({ id, title, userId }) {
  const conditions = [];
  const params = [];

  if (id !== undefined) {
    conditions.push('b.id = ?');
    params.push(id);
  } else {
    conditions.push('b.blogTitle LIKE ?');
    params.push(`%${escapeLike(title)}%`);
  }
  if (userId !== undefined) {
    conditions.push('b.userId = ?');
    params.push(userId);
  }

  const [rows] = await getPool().execute(
    `${BLOG_WITH_AUTHOR} WHERE ${conditions.join(' AND ')} ORDER BY b.id`,
    params,
  );
  return rows;
}

async function createBlog(userId, { blogTitle, blog, category }) {
  const [result] = await getPool().execute(
    'INSERT INTO blogs (userId, blogTitle, blog, category) VALUES (?, ?, ?, ?)',
    [userId, blogTitle, blog, category],
  );
  return result.insertId;
}

/** Updates a blog only if it belongs to the given user. Returns true on success. */
async function updateBlog(id, userId, { blogTitle, blog, category }) {
  const [result] = await getPool().execute(
    'UPDATE blogs SET blogTitle = ?, blog = ?, category = ? WHERE id = ? AND userId = ?',
    [blogTitle, blog, category, id, userId],
  );
  return result.affectedRows > 0;
}

/**
 * Deletes a blog. With userId, only that user's blog can be deleted;
 * without it (admin), any blog can be deleted. Returns true on success.
 */
async function deleteBlog(id, userId) {
  const [result] =
    userId === undefined
      ? await getPool().execute('DELETE FROM blogs WHERE id = ?', [id])
      : await getPool().execute('DELETE FROM blogs WHERE id = ? AND userId = ?', [id, userId]);
  return result.affectedRows > 0;
}

async function countBlogsByUser(userId) {
  const [rows] = await getPool().execute('SELECT COUNT(*) AS total FROM blogs WHERE userId = ?', [
    userId,
  ]);
  return rows[0].total;
}

module.exports = {
  allBlog,
  allUsersBlog,
  getBlogsByUser,
  getBlogById,
  searchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  countBlogsByUser,
};
