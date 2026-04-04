const pool = require('../../backend/src/config/database');

const up = async () => {
  try {
    // 字段表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS field_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_name VARCHAR(100) NOT NULL,
        field_code VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'enabled',
        parent_field_id UUID REFERENCES field_options(id) ON DELETE SET NULL,
        field_level INT DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created field_options table');

    // 选项表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS field_option_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_id UUID NOT NULL REFERENCES field_options(id) ON DELETE CASCADE,
        option_text VARCHAR(200) NOT NULL,
        option_value VARCHAR(200) NOT NULL,
        status VARCHAR(20) DEFAULT 'enabled',
        display_order INT DEFAULT 0,
        parent_option_id UUID REFERENCES field_option_items(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created field_option_items table');

    console.log('Migration up completed successfully');
  } catch (error) {
    console.error('Error executing migration up:', error);
    throw error;
  }
};

const down = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS field_option_items');
    console.log('Dropped field_option_items table');

    await pool.query('DROP TABLE IF EXISTS field_options');
    console.log('Dropped field_options table');

    console.log('Migration down completed successfully');
  } catch (error) {
    console.error('Error executing migration down:', error);
    throw error;
  }
};

module.exports = { up, down };
