-- blogdb schema
-- Run automatically by the app on startup (src/config/db.js).
-- You can also run it by hand: mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS blogdb;
USE blogdb;

CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  firstname  VARCHAR(50)   NOT NULL,
  lastname   VARCHAR(50)   NOT NULL,
  email      VARCHAR(100)  NOT NULL,
  password   VARCHAR(255)  NOT NULL,            -- bcrypt hash, never plain text
  isActive   BOOLEAN       NOT NULL DEFAULT TRUE,
  role       ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  createAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updateAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;

-- One user -> many blogs. Deleting a user also deletes that user's blogs.
CREATE TABLE IF NOT EXISTS blogs (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  userId     INT UNSIGNED  NOT NULL,
  blogTitle  VARCHAR(200)  NOT NULL,
  blog       TEXT          NOT NULL,
  category   VARCHAR(50)   NOT NULL,
  createAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updateAt   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_blogs_userId (userId),
  CONSTRAINT fk_blogs_user
    FOREIGN KEY (userId) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;
