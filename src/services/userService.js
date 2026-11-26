const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { AppError } = require('../utils/errors');

const SALT_ROUNDS = 10;
const PUBLIC_USER_COLUMNS = 'id, firstname, lastname, email, role, isActive, createAt, updateAt';

/** Registers a new user. role defaults to 'user' and isActive to true (see schema). */
async function register({ firstname, lastname, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const [result] = await getPool().execute(
      'INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)',
      [firstname, lastname, email.toLowerCase(), passwordHash],
    );
    return result.insertId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('An account with this email already exists.');
    }
    throw err;
  }
}

/** Verifies credentials and returns the logged-in user (without the password). */
async function login(email, password) {
  const [rows] = await getPool().execute('SELECT * FROM users WHERE email = ?', [
    email.toLowerCase(),
  ]);
  const user = rows[0];

  const passwordOk = user ? await bcrypt.compare(password, user.password) : false;
  if (!passwordOk) throw new AppError('Invalid email or password.');
  if (!user.isActive) throw new AppError('User is deactivated');

  const { password: _hash, ...publicUser } = user;
  return publicUser;
}

/** Admin: complete user list. */
async function allUsers() {
  const [rows] = await getPool().query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY id`);
  return rows;
}

async function findUserById(id) {
  const [rows] = await getPool().execute(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

/** Admin: activate / deactivate a user. Returns true if a row was changed. */
async function updateUserStatus(id, isActive) {
  const [result] = await getPool().execute('UPDATE users SET isActive = ? WHERE id = ?', [
    isActive ? 1 : 0,
    id,
  ]);
  return result.affectedRows > 0;
}

/** Admin: deletes a user. Their blogs are removed by ON DELETE CASCADE. */
async function deleteUser(id) {
  const [result] = await getPool().execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { register, login, allUsers, findUserById, updateUserStatus, deleteUser };
