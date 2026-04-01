const pool = require('./src/config/database');

const checkDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('=== 检查数据库状态 ===\n');
    
    // 检查model_providers表
    console.log('1. 检查 model_providers 表:');
    const providersResult = await client.query('SELECT id, name, code, models FROM model_providers');
    console.log(`   找到 ${providersResult.rows.length} 个模型提供商`);
    
    for (const provider of providersResult.rows) {
      console.log(`   - ${provider.name} (${provider.code}):`);
      console.log(`     models字段类型: ${typeof provider.models}`);
      console.log(`     models字段内容:`, provider.models);
    }
    
    console.log('\n2. 检查 model_provider_models 表:');
    const modelsResult = await client.query('SELECT * FROM model_provider_models');
    console.log(`   找到 ${modelsResult.rows.length} 条模型记录`);
    
    for (const model of modelsResult.rows) {
      console.log(`   - ${model.name}: ${model.model_code}`);
    }
    
    console.log('\n=== 检查完成 ===');
  } catch (error) {
    console.error('检查数据库失败:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

checkDatabase();
