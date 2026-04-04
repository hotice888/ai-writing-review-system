const pool = require('../../backend/src/config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('开始迁移：删除 model_providers 表的 url 和 protocol_base_url 字段...');
    
    await client.query('BEGIN');
    
    // 检查是否需要删除 url 字段
    const checkUrl = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'model_providers' 
      AND column_name = 'url'
    `);
    
    if (checkUrl.rows.length > 0) {
      await client.query(`
        ALTER TABLE model_providers DROP COLUMN url
      `);
      console.log('✓ 已删除 url 字段');
    } else {
      console.log('- url 字段不存在，跳过');
    }
    
    // 检查是否需要删除 protocol_base_url 字段
    const checkProtocolUrl = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'model_providers' 
      AND column_name = 'protocol_base_url'
    `);
    
    if (checkProtocolUrl.rows.length > 0) {
      await client.query(`
        ALTER TABLE model_providers DROP COLUMN protocol_base_url
      `);
      console.log('✓ 已删除 protocol_base_url 字段');
    } else {
      console.log('- protocol_base_url 字段不存在，跳过');
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
