const pool = require('../../backend/src/config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('开始迁移：添加 API 连通标识字段...');
    
    await client.query('BEGIN');
    
    // 检查字段是否已存在
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_models' 
      AND column_name IN ('anthropic_api_flag', 'openai_api_flag')
    `);
    
    const existingColumns = checkColumns.rows.map(r => r.column_name);
    
    // 添加 anthropic_api_flag 字段（如果不存在）
    if (!existingColumns.includes('anthropic_api_flag')) {
      await client.query(`
        ALTER TABLE user_models 
        ADD COLUMN anthropic_api_flag BOOLEAN DEFAULT false
      `);
      console.log('✓ 已添加 anthropic_api_flag 字段');
    } else {
      console.log('- anthropic_api_flag 字段已存在，跳过');
    }
    
    // 添加 openai_api_flag 字段（如果不存在）
    if (!existingColumns.includes('openai_api_flag')) {
      await client.query(`
        ALTER TABLE user_models 
        ADD COLUMN openai_api_flag BOOLEAN DEFAULT false
      `);
      console.log('✓ 已添加 openai_api_flag 字段');
    } else {
      console.log('- openai_api_flag 字段已存在，跳过');
    }
    
    await client.query('COMMIT');
    console.log('迁移完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('迁移脚本执行失败:', error);
  process.exit(1);
});
