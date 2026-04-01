const pool = require('./src/config/database');

const renameColumns = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('开始重命名字段...');
    
    // 检查表是否存在
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'model_provider_models'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('model_provider_models 表不存在，无需重命名字段');
      await client.query('ROLLBACK');
      process.exit(0);
    }
    
    // 检查旧字段是否存在
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'model_provider_models'
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    
    // 重命名 brand -> name（如果brand存在且name不存在）
    if (existingColumns.includes('brand') && !existingColumns.includes('name')) {
      console.log('重命名字段 brand -> name...');
      await client.query('ALTER TABLE model_provider_models RENAME COLUMN brand TO name');
      console.log('成功重命名 brand -> name');
    } else if (existingColumns.includes('name')) {
      console.log('字段 name 已存在，跳过');
    }
    
    // 重命名 model_id -> model_code（如果model_id存在且model_code不存在）
    if (existingColumns.includes('model_id') && !existingColumns.includes('model_code')) {
      console.log('重命名字段 model_id -> model_code...');
      await client.query('ALTER TABLE model_provider_models RENAME COLUMN model_id TO model_code');
      console.log('成功重命名 model_id -> model_code');
    } else if (existingColumns.includes('model_code')) {
      console.log('字段 model_code 已存在，跳过');
    }
    
    // 重命名 capability -> memo（如果capability存在且memo不存在）
    if (existingColumns.includes('capability') && !existingColumns.includes('memo')) {
      console.log('重命名字段 capability -> memo...');
      await client.query('ALTER TABLE model_provider_models RENAME COLUMN capability TO memo');
      console.log('成功重命名 capability -> memo');
    } else if (existingColumns.includes('memo')) {
      console.log('字段 memo 已存在，跳过');
    }
    
    await client.query('COMMIT');
    
    console.log('字段重命名完成！');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('重命名字段失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

renameColumns()
  .then(() => {
    console.log('迁移脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });
