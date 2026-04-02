module.exports = {
  name: 'add_openai_api_url_to_user_models',
  
  async up(pool) {
    await pool.query(`
      ALTER TABLE user_models 
      ADD COLUMN IF NOT EXISTS openai_api_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS anthropic_api_url VARCHAR(500)
    `);
    console.log('Added openai_api_url and anthropic_api_url columns to user_models table');
  },
  
  async down(pool) {
    await pool.query(`
      ALTER TABLE user_models 
      DROP COLUMN IF EXISTS openai_api_url,
      DROP COLUMN IF EXISTS anthropic_api_url
    `);
    console.log('Dropped openai_api_url and anthropic_api_url columns from user_models table');
  }
};
