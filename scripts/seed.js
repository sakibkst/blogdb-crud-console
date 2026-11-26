// Seeds blogdb with demo users (including one admin and one deactivated user) and blogs.
// Usage: npm run seed
//
// Safe to run more than once: existing users (matched by email) are left alone,
// and blogs are only added for a user who has none yet.
const bcrypt = require('bcryptjs');
const { initDatabase, getPool, closeDatabase } = require('../src/config/db');

const USERS = [
  {
    firstname: 'Admin',
    lastname: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    blogs: [],
  },
  {
    firstname: 'Rahim',
    lastname: 'Uddin',
    email: 'rahim@example.com',
    password: '123456',
    role: 'user',
    isActive: true,
    blogs: [
      {
        blogTitle: 'Getting Started with Node.js',
        category: 'Programming',
        blog:
          'Node.js lets you run JavaScript outside the browser.\n' +
          'In this post I set up a project with npm init, install a package and write my first script.\n' +
          'The event loop is what makes Node fast for I/O-heavy apps.',
      },
      {
        blogTitle: 'MySQL Joins Explained',
        category: 'Database',
        blog:
          'INNER JOIN returns rows that match in both tables.\n' +
          'LEFT JOIN keeps every row from the left table, even without a match.\n' +
          'Our blog app joins blogs with users to show the author name.',
      },
      {
        blogTitle: 'A Weekend in Sylhet',
        category: 'Travel',
        blog:
          'Tea gardens, Ratargul swamp forest and the clear water of Bholaganj.\n' +
          'Two days were not enough, but the trip was worth every minute.',
      },
    ],
  },
  {
    firstname: 'Karim',
    lastname: 'Hasan',
    email: 'karim@example.com',
    password: '123456',
    role: 'user',
    isActive: true,
    blogs: [
      {
        blogTitle: 'Best Street Food in Old Dhaka',
        category: 'Food',
        blog:
          'From kacchi biryani to bakarkhani, Old Dhaka is a paradise for food lovers.\n' +
          'Go early in the evening, the lanes get crowded fast.',
      },
      {
        blogTitle: 'Why Every Tester Should Learn SQL',
        category: 'Testing',
        blog:
          'Checking the database directly lets a QA engineer verify what the UI cannot show.\n' +
          'SELECT, JOIN and GROUP BY cover most day-to-day testing needs.',
      },
    ],
  },
  {
    // No blogs: log in as this user to see "No blogs are found".
    firstname: 'Nusrat',
    lastname: 'Jahan',
    email: 'nusrat@example.com',
    password: '123456',
    role: 'user',
    isActive: true,
    blogs: [],
  },
  {
    // Deactivated: logging in as this user shows "User is deactivated".
    firstname: 'Fahim',
    lastname: 'Ahmed',
    email: 'fahim@example.com',
    password: '123456',
    role: 'user',
    isActive: false,
    blogs: [
      {
        blogTitle: 'My First Blog Post',
        category: 'Lifestyle',
        blog: 'Hello world! This is my very first blog post on this platform.',
      },
    ],
  },
];

async function seedUser(pool, user) {
  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [user.email]);
  let userId;
  let status;

  if (existing.length) {
    userId = existing[0].id;
    status = 'already exists';
  } else {
    const hash = await bcrypt.hash(user.password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (firstname, lastname, email, password, role, isActive) VALUES (?, ?, ?, ?, ?, ?)',
      [user.firstname, user.lastname, user.email, hash, user.role, user.isActive ? 1 : 0],
    );
    userId = result.insertId;
    status = 'created';
  }

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM blogs WHERE userId = ?',
    [userId],
  );
  let added = 0;
  if (total === 0) {
    for (const blog of user.blogs) {
      await pool.execute(
        'INSERT INTO blogs (userId, blogTitle, blog, category) VALUES (?, ?, ?, ?)',
        [userId, blog.blogTitle, blog.blog, blog.category],
      );
      added += 1;
    }
  }

  console.log(
    `  ${user.email.padEnd(22)} id=${String(userId).padEnd(4)} ${status}, ${added} blog(s) added`,
  );
}

async function seed() {
  await initDatabase();
  try {
    const pool = getPool();
    console.log('Seeding blogdb...');
    for (const user of USERS) {
      await seedUser(pool, user);
    }

    console.log('\nLogin accounts:');
    console.table(
      USERS.map((u) => ({
        Email: u.email,
        Password: u.password,
        Role: u.role,
        Status: u.isActive ? 'Active' : 'Deactivated',
        Blogs: u.blogs.length,
      })),
    );
  } finally {
    await closeDatabase();
  }
}

seed().catch((err) => {
  console.error(`Seeding failed: ${err.message || err.code}`);
  process.exitCode = 1;
});
