const pool = require('../backend/src/config/database');

async function runMigration() {
  try {
    console.log('Running migration: create_llm_request_records...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS llm_request_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        model_id UUID NOT NULL REFERENCES user_models(id) ON DELETE CASCADE,
        
        request_id VARCHAR(100) NOT NULL,
        business_type VARCHAR(50) NOT NULL,
        request_url VARCHAR(255) NOT NULL,
        request_method VARCHAR(10) DEFAULT 'POST',
        request_params JSONB NOT NULL,
        request_messages JSONB NOT NULL,
        
        response_status_code INTEGER NOT NULL,
        response_success BOOLEAN NOT NULL,
        response_data JSONB,
        error_message TEXT,
        
        token_usage JSONB,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        duration_ms INTEGER
      )
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_records_user ON llm_request_records(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_records_model ON llm_request_records(model_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_records_type ON llm_request_records(business_type)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_records_time ON llm_request_records(created_at)
    `);
    
    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
