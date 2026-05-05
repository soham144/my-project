-- ===========================================
-- AI Chat Platform - Database Initialization
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------
-- Conversations table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------
-- Messages table
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- -------------------------------------------
-- Sample Data: Products table (for DB tools demo)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------
-- Sample Data: Sales table (for DB tools demo)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    customer_region VARCHAR(100) NOT NULL,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- -------------------------------------------
-- Seed sample products
-- -------------------------------------------
INSERT INTO products (name, category, price, stock_quantity, rating) VALUES
    ('Wireless Headphones Pro', 'Electronics', 129.99, 250, 4.5),
    ('Mechanical Keyboard RGB', 'Electronics', 89.99, 180, 4.7),
    ('Ultra HD Monitor 27"', 'Electronics', 349.99, 75, 4.3),
    ('Ergonomic Office Chair', 'Furniture', 299.99, 120, 4.6),
    ('Standing Desk Converter', 'Furniture', 199.99, 95, 4.2),
    ('Bamboo Desk Organizer', 'Furniture', 34.99, 400, 4.1),
    ('Running Shoes Elite', 'Sports', 159.99, 200, 4.8),
    ('Yoga Mat Premium', 'Sports', 49.99, 350, 4.4),
    ('Protein Powder 2kg', 'Health', 54.99, 500, 4.3),
    ('Vitamin D3 Supplement', 'Health', 19.99, 800, 4.6),
    ('Noise Cancelling Earbuds', 'Electronics', 79.99, 300, 4.4),
    ('Webcam 4K', 'Electronics', 119.99, 150, 4.5),
    ('Laptop Stand Aluminum', 'Furniture', 59.99, 220, 4.3),
    ('Resistance Bands Set', 'Sports', 29.99, 600, 4.2),
    ('Multivitamin Gummies', 'Health', 24.99, 700, 4.5),
    ('Smart Water Bottle', 'Health', 39.99, 180, 3.9),
    ('USB-C Hub 7-in-1', 'Electronics', 45.99, 400, 4.6),
    ('Memory Foam Pillow', 'Furniture', 44.99, 300, 4.4),
    ('Fitness Tracker Band', 'Sports', 69.99, 250, 4.1),
    ('Organic Green Tea 100pk', 'Health', 15.99, 900, 4.7);

-- -------------------------------------------
-- Seed sample sales
-- -------------------------------------------
INSERT INTO sales (product_id, quantity, total_amount, customer_region, sale_date) VALUES
    (1, 3, 389.97, 'North America', '2025-01-15'),
    (2, 2, 179.98, 'Europe', '2025-01-18'),
    (3, 1, 349.99, 'North America', '2025-01-20'),
    (4, 1, 299.99, 'Asia', '2025-02-01'),
    (5, 2, 399.98, 'North America', '2025-02-05'),
    (7, 4, 639.96, 'Europe', '2025-02-10'),
    (8, 5, 249.95, 'Asia', '2025-02-14'),
    (9, 3, 164.97, 'North America', '2025-02-20'),
    (10, 10, 199.90, 'Europe', '2025-03-01'),
    (11, 2, 159.98, 'Asia', '2025-03-05'),
    (1, 5, 649.95, 'Europe', '2025-03-10'),
    (12, 3, 359.97, 'North America', '2025-03-15'),
    (13, 4, 239.96, 'Asia', '2025-03-20'),
    (6, 8, 279.92, 'North America', '2025-04-01'),
    (14, 6, 179.94, 'Europe', '2025-04-05'),
    (15, 7, 174.93, 'Asia', '2025-04-10'),
    (17, 3, 137.97, 'North America', '2025-04-15'),
    (18, 2, 89.98, 'Europe', '2025-04-20'),
    (19, 4, 279.96, 'Asia', '2025-04-25'),
    (20, 15, 239.85, 'North America', '2025-05-01'),
    (2, 3, 269.97, 'Asia', '2025-05-03'),
    (7, 2, 319.98, 'North America', '2025-05-05'),
    (4, 2, 599.98, 'Europe', '2025-05-07'),
    (16, 5, 199.95, 'Asia', '2025-05-09'),
    (3, 2, 699.98, 'North America', '2025-05-10');
