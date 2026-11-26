# Blog CRUD Console

A console-based blog application built with **Node.js** and **MySQL**. Anyone can read blogs, registered users can create and manage their own blogs, and admins can manage every user and blog. Everything runs in the terminal through numbered menus.

## 🎥 Demo Video

**Watch the full project demonstration (with voice explanation):** [VIDEO LINK HERE](https://drive.google.com/file/d/1ELXHrj9vjj1YjKKLkm_EH65cofcOATI1/view?usp=sharing)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Information](#database-information)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Creating an Admin](#creating-an-admin)
- [Usage](#usage)

---

## Features

### Reader (no login needed)
- **View All Blogs** with the `allBlog()` function. It shows every blog with its title, category, author, dates and content.

### User
- **Register** with first name, last name, email and password. The email must be unique, the password needs at least 6 characters, and it is typed hidden and confirmed.
- **Login.** Right after login, the user's blog titles are shown. A user with no blogs sees `No blogs are found`.
- **View Your Blogs** lists the ID and title of each blog the user created.
- **Search Blog by ID/Title.** Search by exact blog ID or by part of the title (case-insensitive), within the user's own blogs.
- **Create Blog** with a title, category and multi-line content. A user can create any number of blogs.
- **Update Blog** by blog ID. The current values are shown, and pressing Enter keeps a field unchanged.
- **Delete Blog** by blog ID, after a confirmation.
- Users can only update or delete **their own** blogs.

### Admin
- **View All Users** with the `allUsers()` function.
- **View All Blogs** from all users with the `allUsersBlog()` function.
- **Search Blog by ID/Title** across all users.
- **Update User** sets a user's `isActive` status to Active or Deactivated. A deactivated user cannot log in and sees **`User is deactivated`**.
- **Delete User.** The user's blogs are deleted with them.
- **Delete Blog** removes any blog.
- An admin cannot deactivate or delete their own account, so the system never loses its only admin by accident.

### Other details
- Passwords are stored as **bcrypt hashes**, never as plain text.
- All SQL uses **parameterized queries**, which protects against SQL injection.
- The `blogdb` database and both tables are **created automatically** on first run.
- Input is validated: required fields, maximum lengths, email format, numeric IDs and y/n confirmations.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js (v18+) | Runtime |
| JavaScript (CommonJS) | Language |
| MySQL (5.7+ / 8.x) | Database |
| [mysql2](https://www.npmjs.com/package/mysql2) | MySQL driver (promise API, prepared statements) |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Password hashing |
| [dotenv](https://www.npmjs.com/package/dotenv) | Loads DB credentials from `.env` |
| `node:readline` | Console input and menus |

---

## Database Information

**Database name:** `blogdb`. The full schema is in [`db/schema.sql`](db/schema.sql).

### `users` table

| Column | Type | Notes |
|---|---|---|
| `id` | INT UNSIGNED | Primary key, auto increment |
| `firstname` | VARCHAR(50) | Required |
| `lastname` | VARCHAR(50) | Required |
| `email` | VARCHAR(100) | Required, **unique** |
| `password` | VARCHAR(255) | bcrypt hash |
| `isActive` | BOOLEAN | **Default `true`** |
| `role` | ENUM('user','admin') | **Default `user`**. Set to `admin` manually for an admin |
| `createAt` | TIMESTAMP | Set when the row is created |
| `updateAt` | TIMESTAMP | Updated automatically on every change |

### `blogs` table

| Column | Type | Notes |
|---|---|---|
| `id` | INT UNSIGNED | Primary key, auto increment |
| `userId` | INT UNSIGNED | **Foreign key → `users.id`** |
| `blogTitle` | VARCHAR(200) | Required |
| `blog` | TEXT | Blog content |
| `category` | VARCHAR(50) | Required |
| `createAt` | TIMESTAMP | Set when the row is created |
| `updateAt` | TIMESTAMP | Updated automatically on every change |

### Relationship: one-to-many

```
users (1) ───────< blogs (many)
  id  ◄────────────  userId
```

- One user can create many blogs.
- Each blog belongs to exactly one user (`blogs.userId` references `users.id`).
- `ON DELETE CASCADE`: deleting a user also deletes that user's blogs.

---

## Project Structure

```
blogdb-crud-console/
├── index.js                  # Entry point: connects to the DB, starts the main menu
├── db/
│   └── schema.sql            # CREATE DATABASE blogdb + users & blogs tables
├── scripts/
│   └── make-admin.js         # Promote a registered user to admin
├── src/
│   ├── config/
│   │   └── db.js             # MySQL connection pool, auto-creates the schema
│   ├── services/             # Database logic (SQL lives here)
│   │   ├── userService.js    # register, login, allUsers, updateUserStatus, deleteUser
│   │   └── blogService.js    # allBlog, allUsersBlog, searchBlogs, create/update/deleteBlog
│   ├── menus/                # Console menus (user journeys)
│   │   ├── mainMenu.js       # View All Blogs / Login / Register / Exit
│   │   ├── userMenu.js       # User console menu
│   │   ├── adminMenu.js      # Admin console menu
│   │   ├── blogActions.js    # Search Blog by ID/Title (shared)
│   │   └── menuRunner.js     # Generic menu loop + error handling
│   └── utils/
│       ├── prompt.js         # Input helpers (hidden password, IDs, y/n, multi-line)
│       ├── display.js        # Tables and blog formatting
│       └── errors.js         # AppError for user-facing messages
├── .env.example              # Template for your DB credentials
├── .gitignore                # node_modules and .env are not committed
└── package.json
```

---

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer
- A running [MySQL](https://dev.mysql.com/downloads/) server (local install, XAMPP or Docker all work)

### 2. Clone and install

```bash
git clone https://github.com/<your-username>/blogdb-crud-console.git
cd blogdb-crud-console
npm install
```

### 3. Configure the database connection

Copy the example env file and put in your MySQL credentials:

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
```

> `.env` is listed in `.gitignore`, so your password is never pushed to GitHub.

### 4. Run the app

```bash
npm start
```

On first run, the app creates the `blogdb` database and the `users` and `blogs` tables automatically. You don't need to run any SQL by hand. If you want to, you can still run it yourself with `mysql -u root -p < db/schema.sql`.

### 5. (Optional) Load demo data

```bash
npm run seed
```

This adds demo users and blogs. Running it again does not create duplicates.

| Email | Password | Role | Status | Blogs |
|---|---|---|---|---|
| `admin@example.com` | `admin123` | admin | Active | 0 |
| `rahim@example.com` | `123456` | user | Active | 3 |
| `karim@example.com` | `123456` | user | Active | 2 |
| `nusrat@example.com` | `123456` | user | Active | 0 (shows "No blogs are found") |
| `fahim@example.com` | `123456` | user | Deactivated | 1 (login shows "User is deactivated") |

---

## Creating an Admin

Every new account gets the role `user`. To make an admin:

1. Register a normal account through the app (**Main Menu → Register**).
2. Change its role to `admin` in one of these two ways:

   **Option A: helper script**
   ```bash
   npm run make-admin -- admin@example.com
   ```

   **Option B: SQL, by hand (MySQL Workbench / CLI)**
   ```sql
   UPDATE blogdb.users SET role = 'admin' WHERE email = 'admin@example.com';
   ```
3. Log in with that account to get the **Admin Menu**.

---

## Usage

### Main Menu (on start)

```
========== Blog Console - Main Menu ==========
  1. View All Blogs
  2. Login
  3. Register
  4. Exit
Select an option:
```

Type an option number and press **Enter**.

> **Going back:** type **`0`** and press Enter at any prompt (blog ID, title, email, password and so on) to cancel the current action and return to the menu. Sub-menus such as *Search Blog* also show a `0. Back` option.

### User Menu (after a normal user logs in)

```
  Login successful. Welcome, John Doe!

  No blogs are found            <- or a table of your blog titles

========== User Menu (John) ==========
  1. View Your Blogs
  2. Search Blog by ID/Title
  3. Create Blog
  4. Update Blog
  5. Delete Blog
  6. Logout
```

- **Create Blog:** enter a title and a category, then type the content. The content can span several lines. Type `END` on its own line to finish.
- **Update Blog:** enter the blog ID. Each prompt shows the current value. Press Enter to keep it, or type a new value.
- **Delete Blog:** enter the blog ID and confirm with `y`.

### Admin Menu (after an admin logs in)

```
========== Admin Menu ==========
  1. View All Users
  2. View All Blogs
  3. Search Blog by ID/Title
  4. Update User
  5. Delete User
  6. Delete Blog
  7. Logout
```

- **Update User:** enter a user ID, then choose `Active` or `Deactivated`.
- When a deactivated user tries to log in, the app shows:
  ```
  User is deactivated
  ```

### Example walkthrough (good for a demo)

1. **Register** two users, for example `alice@example.com` and `bob@example.com`.
2. Promote Alice to admin: `npm run make-admin -- alice@example.com`.
3. Log in as **Bob**. `No blogs are found` is shown. Create two blogs, then view, search, update and delete one of them.
4. Log out and pick **View All Blogs** from the main menu to see the reader view.
5. Log in as **Alice** (admin). View all users and all blogs, then search a blog.
6. **Update User** to set Bob to *Deactivated*. Log out and try to log in as Bob. The app shows `User is deactivated`.
7. As admin, reactivate Bob, delete a blog, and delete a user.

Press **Ctrl+C**, or choose **Exit**, to quit at any time.
