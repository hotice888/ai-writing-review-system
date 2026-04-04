const pool = require('../../backend/src/config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('开始迁移：更新 user_models 表结构...');
    
    await client.query('BEGIN');
    
    // 检查是否需要添加 model_provider_id 字段
    const checkProviderId = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_models' 
      AND column_name = 'model_provider_id'
    `);
    
    if (checkProviderId.rows.length === 0) {
      await client.query(`
        ALTER TABLE user_models 
        ADD COLUMN model_provider_id UUID REFERENCES model_providers(id) ON DELETE SET NULL
      `);
      console.log('✓ 已添加 model_provider_id 字段');
    } else {
      console.log('- model_provider_id 字段已存在，跳过');
    }
    
    // 检查是否需要删除 code 字段
    const checkCode = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_models' 
      AND column_name = 'code'
    `);
    
    if (checkCode.rows.length > 0) {
      await client.query(`
        ALTER TABLE user_models DROP COLUMN code
      `);
      console.log('✓ 已删除 code 字段');
    } else {
      console.log('- code 字段不存在，跳过');
    }
    
    // 检查是否需要删除 api_url 字段
    const checkApiUrl = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_models' 
      AND column_name = 'api_url'
    `);
    
    if (checkApiUrl.rows.length > 0) {
      await client.query(`
        ALTER TABLE user_models DROP COLUMN api_url
      `);
      console.log('✓ 已删除 api_url 字段');
    } else {
      console.log('- api_url 字段不存在，跳过');
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
