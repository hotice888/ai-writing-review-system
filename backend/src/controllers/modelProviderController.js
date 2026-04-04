const pool = require('../config/database');

// 辅助函数：获取模型平台的模型列表
const getProviderModels = async (providerId) => {
  const result = await pool.query(
    'SELECT * FROM model_provider_models WHERE provider_id = $1 ORDER BY created_at',
    [providerId]
  );
  return result.rows.map(row => ({
    modelId: row.model_code,
    capability: row.memo
  }));
};

// 获取所有模型平台
const getAllProviders = async (req, res) => {
  try {
    // 获取模型平台基本信息
    const result = await pool.query(`
      SELECT * FROM model_providers
      ORDER BY updated_at DESC
    `);
    
    // 为每个平台获取对应的模型列表
    const providersWithModels = [];
    for (const provider of result.rows) {
      const models = await getProviderModels(provider.id);
      providersWithModels.push({
        ...provider,
        models: models
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: providersWithModels
    });
  } catch (error) {
    console.error('Error getting model providers:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型平台列表失败',
      data: null
    });
  }
};

// 获取单个模型平台
const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型平台不存在',
        data: null
      });
    }
    
    const provider = result.rows[0];
    const models = await getProviderModels(id);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...provider,
        models: models
      }
    });
  } catch (error) {
    console.error('Error getting model provider:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型平台失败',
      data: null
    });
  }
};

// 辅助函数：创建模型列表
const createProviderModels = async (providerId, models, client = pool) => {
  if (!models || models.length === 0) {
    console.log('No models to create for provider:', providerId);
    return;
  }
  
  console.log('Creating models for provider:', providerId);
  console.log('Models data:', models);
  
  for (const model of models) {
    try {
      const name = (model && model.modelId) || 'unknown';
      const modelCode = (model && model.modelId) || '';
      const memo = (model && model.capability) || '';
      
      console.log('Inserting model:', { providerId, name, modelCode, memo });
      
      await client.query(
        `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
         VALUES ($1, $2, $3, $4)`,
        [providerId, name, modelCode, memo]
      );
    } catch (error) {
      console.error('Error inserting model:', error);
      throw error;
    }
  }
};

// 辅助函数：更新模型列表（先删除后创建）
const updateProviderModels = async (providerId, models, client = pool) => {
  try {
    console.log('Updating models for provider:', providerId);
    console.log('Models data:', models);
    
    // 先删除所有与该提供商相关的模型
    const deleteResult = await client.query('DELETE FROM model_provider_models WHERE provider_id = $1', [providerId]);
    console.log('Deleted', deleteResult.rowCount, 'models');
    
    // 检查models是否为数组
    if (models && Array.isArray(models)) {
      console.log('Creating', models.length, 'new models');
      await createProviderModels(providerId, models, client);
    } else {
      console.log('No models to create (models is not an array)');
    }
  } catch (error) {
    console.error('Error updating provider models:', error);
    throw error;
  }
};

// 创建模型平台
const createProvider = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, code, openai_base_url, anthropic_base_url, description, status, common_links, models } = req.body;
  
  // 为必需字段提供默认值
  const providerName = name || '';
  const providerCode = code || '';
  
  // 检查code是否已存在
    const existingProvider = await client.query('SELECT * FROM model_providers WHERE code = $1', [providerCode]);
    if (existingProvider.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        code: 400,
        message: '模型平台编码已存在',
        data: null
      });
    }
    
    const result = await client.query(
      `INSERT INTO model_providers (name, code, openai_base_url, anthropic_base_url, description, status, common_links) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [providerName, providerCode, openai_base_url, anthropic_base_url, description, status || 'enabled', common_links]
    );
    
    const newProvider = result.rows[0];
    
    // 创建模型列表
    await createProviderModels(newProvider.id, models, client);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      code: 200,
      message: '模型平台创建成功',
      data: newProvider
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '创建模型平台失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 更新模型平台
const updateProvider = async (req, res) => {
  console.log('========== 更新模型平台请求开始 ==========');
  console.log('请求参数 id:', req.params.id);
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, code, openai_base_url, anthropic_base_url, description, status, common_links, models } = req.body;
    
    console.log('解析后的字段:');
    console.log('- name:', name);
    console.log('- code:', code);
    console.log('- status:', status);
    console.log('- models:', models);
    
    // 为必需字段提供默认值
    const providerName = name || '';
    const providerCode = code || '';
    
    console.log('检查模型平台是否存在, id:', id);
    // 检查模型平台是否存在
    const existingProvider = await client.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      console.log('模型平台不存在');
      await client.query('ROLLBACK');
      return res.status(404).json({
        code: 404,
        message: '模型平台不存在',
        data: null
      });
    }
    
    console.log('现有平台信息:', existingProvider.rows[0]);
    
    // 检查code是否与其他模型平台重复
    if (providerCode) {
      console.log('检查code是否重复:', providerCode);
      const codeCheck = await client.query('SELECT * FROM model_providers WHERE code = $1 AND id != $2', [providerCode, id]);
      console.log('重复检查结果数量:', codeCheck.rows.length);
      if (codeCheck.rows.length > 0) {
        console.log('模型平台编码已存在，返回400');
        await client.query('ROLLBACK');
        return res.status(400).json({
          code: 400,
          message: '模型平台编码已存在',
          data: null
        });
      }
    }
    
    console.log('准备更新数据库');
    const result = await client.query(
      `UPDATE model_providers 
       SET name = $1, code = $2, openai_base_url = $3, anthropic_base_url = $4, description = $5, status = $6, common_links = $7, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING *`,
      [providerName, providerCode, openai_base_url, anthropic_base_url, description, status || 'enabled', common_links, id]
    );
    
    console.log('数据库更新完成');
    
    const updatedProvider = result.rows[0];
    console.log('更新后的提供商:', updatedProvider);
    
    // 更新模型列表（使用事务连接）
    console.log('开始更新模型列表');
    await updateProviderModels(updatedProvider.id, models, client);
    
    console.log('提交事务');
    await client.query('COMMIT');
    
    console.log('========== 更新模型平台请求成功 ==========');
    res.json({
      code: 200,
      message: '模型平台更新成功',
      data: updatedProvider
    });
  } catch (error) {
    console.error('========== 更新模型平台请求失败 ==========');
    console.error('错误详情:', error);
    await client.query('ROLLBACK');
    res.status(500).json({
      code: 500,
      message: '更新模型平台失败: ' + error.message,
      data: null
    });
  } finally {
    client.release();
  }
};

// 删除模型平台
const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查模型平台是否存在
    const existingProvider = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型平台不存在',
        data: null
      });
    }
    
    // 模型会通过ON DELETE CASCADE自动删除
    await pool.query('DELETE FROM model_providers WHERE id = $1', [id]);
    
    res.json({
      code: 200,
      message: '模型平台删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting model provider:', error);
    res.status(500).json({
      code: 500,
      message: '删除模型平台失败',
      data: null
    });
  }
};

// 更新模型平台状态
const updateProviderStatus = async (req, res) => {
  console.log('========== 更新模型平台状态请求开始 ==========');
  console.log('请求参数 id:', req.params.id);
  console.log('请求体:', req.body);
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('新状态:', status);
    
    // 检查模型平台是否存在
    const existingProvider = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      console.log('模型平台不存在');
      return res.status(404).json({
        code: 404,
        message: '模型平台不存在',
        data: null
      });
    }
    
    // 更新状态
    const result = await pool.query(
      `UPDATE model_providers 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    
    const updatedProvider = result.rows[0];
    console.log('更新后的平台:', updatedProvider);
    console.log('========== 更新模型平台状态请求成功 ==========');
    
    res.json({
      code: 200,
      message: '模型平台状态更新成功',
      data: updatedProvider
    });
  } catch (error) {
    console.error('========== 更新模型平台状态请求失败 ==========');
    console.error('错误详情:', error);
    res.status(500).json({
      code: 500,
      message: '更新模型平台状态失败: ' + error.message,
      data: null
    });
  }
};

// 获取所有模型平台的可选模型
const getAllProviderModels = async (req, res) => {
  try {
    // 获取所有状态为enabled的模型平台
    const providersResult = await pool.query(`
      SELECT * FROM model_providers
      WHERE status = 'enabled'
      ORDER BY updated_at DESC
    `);
    
    const providers = providersResult.rows;
    const models = [];
    
    // 为每个提供商获取模型
    for (const provider of providers) {
      const modelsResult = await pool.query(
        'SELECT * FROM model_provider_models WHERE provider_id = $1 ORDER BY created_at',
        [provider.id]
      );
      
      modelsResult.rows.forEach(model => {
        models.push({
          providerId: provider.id,
          providerName: provider.name,
          brand: model.name,
          modelId: model.model_code,
          capability: model.memo,
          openaiBaseUrl: provider.openai_base_url || '',
          anthropicBaseUrl: provider.anthropic_base_url || ''
        });
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: models
    });
  } catch (error) {
    console.error('Error getting provider models:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型平台可选模型失败',
      data: null
    });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getAllProviderModels,
  updateProviderStatus
};
