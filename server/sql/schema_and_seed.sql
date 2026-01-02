DROP DATABASE IF EXISTS sport_shop;
CREATE DATABASE sport_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sport_shop;

-- USERS
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEPARTMENTS
CREATE TABLE departments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL
);

-- CATEGORIES
CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  department_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- PRODUCTS
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  name VARCHAR(160) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  color VARCHAR(60) NOT NULL,
  size_label VARCHAR(30) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- CART ITEMS
CREATE TABLE cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ORDERS
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  status ENUM('CREATED','STOCK_CONFIRMED','PAYMENT_AUTHORIZED','SHIPPING_IN_PROGRESS','COMPLETED','FAILED_NO_STOCK','PAYMENT_FAILED') NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  name_snapshot VARCHAR(160) NOT NULL,
  price_snapshot DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- PAYMENTS (transaction history)
CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  provider ENUM('STRIPE') NOT NULL,
  provider_ref VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status ENUM('AUTHORIZED','FAILED') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- EMAIL LOG (demo for "sending e-mail")
CREATE TABLE email_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  to_email VARCHAR(190) NOT NULL,
  subject VARCHAR(190) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ---------- SEED DATA ----------
INSERT INTO departments(name) VALUES
('Sport Shoes'),
('Sport Clothing'),
('Fitness & Accessories');

INSERT INTO categories(department_id, name) VALUES
(1,'Running Shoes'),
(1,'Football Shoes'),
(2,'T-Shirts'),
(2,'Tracksuits'),
(3,'Dumbbells'),
(3,'Yoga Mats');

-- 8 products per category (минимум)
-- Running Shoes (category_id=1)
INSERT INTO products(category_id,name,brand,color,size_label,price,stock) VALUES
(1,'Nike Air Zoom','Nike','Black','42',220,10),
(1,'Adidas Ultraboost','Adidas','White','43',240,10),
(1,'Asics Gel Nimbus','Asics','Blue','42',210,10),
(1,'Puma Velocity','Puma','Gray','41',180,10),
(1,'Nike Pegasus','Nike','Black','44',200,10),
(1,'Reebok Floatride','Reebok','Red','43',190,10),
(1,'Adidas Solarboost','Adidas','Yellow','42',230,10),
(1,'New Balance 1080','NB','Green','44',250,10);

-- Football Shoes (category_id=2)
INSERT INTO products(category_id,name,brand,color,size_label,price,stock) VALUES
(2,'Nike Mercurial','Nike','Red','44',260,10),
(2,'Adidas Predator','Adidas','Black','43',240,10),
(2,'Puma Future','Puma','Blue','42',200,10),
(2,'Nike Phantom','Nike','Green','45',270,10),
(2,'Adidas X Speed','Adidas','White','44',230,10),
(2,'Puma Ultra','Puma','Pink','42',210,10),
(2,'Nike Tiempo','Nike','Brown','43',220,10),
(2,'Mizuno Morelia','Mizuno','Black','44',260,10);

-- T-Shirts (category_id=3)
INSERT INTO products(category_id,name,brand,color,size_label,price,stock) VALUES
(3,'Adidas Training Tee','Adidas','Black','M',45,25),
(3,'Nike Dri-FIT','Nike','Gray','L',55,25),
(3,'Puma Active Shirt','Puma','Blue','M',39,25),
(3,'Under Armour HeatGear','UA','Black','L',59,25),
(3,'Reebok Sport Tee','Reebok','White','S',35,25),
(3,'NB Essential Tee','NB','Green','M',42,25),
(3,'Asics Run Tee','Asics','Yellow','L',49,25),
(3,'Nike Pro Top','Nike','Red','M',65,25);

-- Tracksuits (category_id=4)
INSERT INTO products(category_id,name,brand,color,size_label,price,stock) VALUES
(4,'Puma Sport Suit','Puma','Blue','M',130,15),
(4,'Nike Tech Fleece','Nike','Black','L',190,15),
(4,'Adidas Essentials Suit','Adidas','Gray','M',150,15),
(4,'UA Tracksuit Pro','UA','Black','L',210,15),
(4,'Reebok Classic Suit','Reebok','Navy','M',140,15),
(4,'NB Warm Set','NB','Green','L',160,15),
(4,'Asics Training Suit','Asics','Black','M',170,15),
(4,'Nike Academy Suit','Nike','Red','M',155,15);

-- Dumbbells (category_id=5)
INSERT INTO products(category_id,name,brand,color,size_label,price,stock) VALUES
(5,'Dumbbell 5kg','SportMax','Black','-',25,30),
(5,'Dumbbell 10kg','SportMax','Black','-',45,30),
(5,'Dumbbell 12.5kg','SportMax','Black','-',55,30),
(5,'Dumbbell 15kg','SportMax','Black','-',65,30),
(5,'Hex Dumbbell 7.5kg','Reebok','Black','-',35,30),
(5,'Hex Dumbbell 20kg','Reebok','Black','-',85,30),
(5,'Adjustable Dumbbell Set','Nike','Black','-',120,10),
(5,'Kettlebell 12kg','Adidas','Black','-',75,20);

-- Yoga Mats (category_id=6)
INSERT INTO products(category_id,name,brand,color,size_label,price,stock) VALUES
(6,'Yoga Mat Pro','Reebok','Purple','-',60,20),
(6,'Yoga Mat Basic','Nike','Green','-',40,20),
(6,'Eco Yoga Mat','Adidas','Blue','-',50,20),
(6,'Grip Yoga Mat','Puma','Black','-',55,20),
(6,'Travel Yoga Mat','NB','Gray','-',45,20),
(6,'Thick Yoga Mat','Asics','Pink','-',65,20),
(6,'Yoga Mat Premium','UA','Black','-',70,20),
(6,'Yoga Mat Kids','Nike','Yellow','-',35,20);
