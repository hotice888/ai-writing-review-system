const pool = require('../config/database');

// 获取用户模型列表（包含关联的模型配置）
const getUserModels = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const result = await pool.query('SELECT * FROM user_models WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    
    const models = await Promise.all(
      result.rows.map(async (model) => {
        const configs = await pool.query(
          'SELECT * FROM user_model_configs WHERE user_model_id = $1 ORDER BY created_at',
          [model.id]
        );
        return {
          ...model,
          configs: configs.rows
        };
      })
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: models
    });
  } catch (error) {
    console.error('Error getting user models:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户模型列表失败',
      data: null
    });
  }
};

// 获取单个用户模型（包含关联的模型配置）
const getUserModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const result = await pool.query('SELECT * FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    const configs = await pool.query(
      'SELECT * FROM user_model_configs WHERE user_model_id = $1 ORDER BY created_at',
      [id]
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...result.rows[0],
        configs: configs.rows
      }
    });
  } catch (error) {
    console.error('Error getting user model:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户模型失败',
      data: null
    });
  }
};

// 创建用户模型
const createUserModel = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Request user:', req.user);
    const user_id = req.user?.id;
    console.log('User ID:', user_id);
    const { name, model_provider_id, api_key, openai_api_url, anthropic_api_url, anthropic_api_flag, openai_api_flag, description, status, configs } = req.body;
    
    if (!user_id) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        code: 401,
        message: '用户未认证',
        data: null
      });
    }
    
    // 如果 model_provider_id 为空字符串，转换为 null
    let final_model_provider_id = model_provider_id === '' ? null : model_provider_id;
    if (!final_model_provider_id && anthropic_api_url) {
      const providerResult = await client.query(
        'SELECT id FROM model_providers WHERE anthropic_base_url = $1 OR openai_base_url = $1  LIMIT 1',
        [anthropic_api_url]
      );
      if (providerResult.rows.length > 0) {
        final_model_provider_id = providerResult.rows[0].id;
      }
    }
    
    const result = await client.query(
      `INSERT INTO user_models (user_id, model_provider_id, name, api_key, openai_api_url, anthropic_api_url, anthropic_api_flag, openai_api_flag, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [user_id, final_model_provider_id, name, api_key, openai_api_url, anthropic_api_url, anthropic_api_flag || false, openai_api_flag || false, description, status || 'enabled']
    );
    
    const userModelId = result.rows[0].id;
    
    // 创建模型配置
    if (configs && Array.isArray(configs)) {
      for (const config of configs) {
        await client.query(
          `INSERT INTO user_model_configs (user_model_id, model_identifier, status) 
           VALUES ($1, $2, $3)`,
          [userModelId, config.model_identifier, config.status || 'untested']
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      code: 200,
      message: '用户模型创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user model:', error);
    res.status(500).json({
      code: 500,
      message: '创建用户模型失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 更新用户模型
const updateUserModel = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { id: user_id } = req.user;
    const { name, model_provider_id, api_key, openai_api_url, anthropic_api_url, anthropic_api_flag, openai_api_flag, description, status, configs } = req.body;
    
    // 检查用户模型是否存在
    const existingModel = await client.query('SELECT * FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (existingModel.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    // 如果 model_provider_id 为空字符串，转换为 null
    let final_model_provider_id = model_provider_id === '' ? null : model_provider_id;
    if (!final_model_provider_id && anthropic_api_url) {
      const providerResult = await client.query(
        'SELECT id FROM model_providers WHERE anthropic_base_url = $1 OR openai_base_url = $1  LIMIT 1',
        [anthropic_api_url]
      );
      if (providerResult.rows.length > 0) {
        final_model_provider_id = providerResult.rows[0].id;
      }
    }
    
    const result = await client.query(
      `UPDATE user_models 
       SET model_provider_id = $1, name = $2, api_key = $3, openai_api_url = $4, anthropic_api_url = $5, anthropic_api_flag = $6, openai_api_flag = $7, description = $8, status = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 AND user_id = $11 
       RETURNING *`,
      [final_model_provider_id, name, api_key, openai_api_url, anthropic_api_url, anthropic_api_flag || false, openai_api_flag || false, description, status, id, user_id]
    );
    
    // 更新模型配置：增量更新策略
    if (configs && Array.isArray(configs)) {
      const existingConfigsResult = await client.query(
        'SELECT * FROM user_model_configs WHERE user_model_id = $1',
        [id]
      );
      const existingConfigs = existingConfigsResult.rows;
      const existingByIdentifier = new Map(existingConfigs.map(c => [c.model_identifier, c]));
      const newIdentifiers = new Set(configs.map(c => c.model_identifier));
      
      // 1. 删除不再需要的配置
      const toDelete = existingConfigs.filter(c => !newIdentifiers.has(c.model_identifier));
      for (const config of toDelete) {
        await client.query('DELETE FROM user_model_configs WHERE id = $1', [config.id]);
      }
      
      // 2. 处理新配置（更新或插入）
      for (const config of configs) {
        const existing = existingByIdentifier.get(config.model_identifier);
        if (existing) {
          // 更新已存在的配置
          await client.query(
            `UPDATE user_model_configs 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [config.status || 'untested', existing.id]
          );
        } else {
          // 插入新增的配置
          await client.query(
            `INSERT INTO user_model_configs (user_model_id, model_identifier, status) 
             VALUES ($1, $2, $3)`,
            [id, config.model_identifier, config.status || 'untested']
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      code: 200,
      message: '用户模型更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user model:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户模型失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 删除用户模型
const deleteUserModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    
    // 检查用户模型是否存在
    const existingModel = await pool.query('SELECT * FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    await pool.query('DELETE FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    res.json({
      code: 200,
      message: '用户模型删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting user model:', error);
    res.status(500).json({
      code: 500,
      message: '删除用户模型失败',
      data: null
    });
  }
};

// 获取模型配置列表
const getModelConfigs = async (req, res) => {
  try {
    const { user_model_id } = req.params;
    const { id: user_id } = req.user;
    
    // 验证用户模型归属
    const modelCheck = await pool.query(
      'SELECT id FROM user_models WHERE id = $1 AND user_id = $2',
      [user_model_id, user_id]
    );
    
    if (modelCheck.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM user_model_configs WHERE user_model_id = $1 ORDER BY created_at',
      [user_model_id]
    );
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting model configs:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型配置列表失败',
      data: null
    });
  }
};

// 创建模型配置
const createModelConfig = async (req, res) => {
  try {
    const { user_model_id } = req.params;
    const { id: user_id } = req.user;
    const { model_identifier } = req.body;
    
    // 验证用户模型归属
    const modelCheck = await pool.query(
      'SELECT id FROM user_models WHERE id = $1 AND user_id = $2',
      [user_model_id, user_id]
    );
    
    if (modelCheck.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    const result = await pool.query(
      `INSERT INTO user_model_configs (user_model_id, model_identifier, status) 
       VALUES ($1, $2, 'untested') 
       RETURNING *`,
      [user_model_id, model_identifier]
    );
    
    res.status(201).json({
      code: 200,
      message: '模型配置创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating model config:', error);
    if (error.code === '23505') { // 唯一约束冲突
      res.status(400).json({
        code: 400,
        message: '该模型标识已存在',
        data: null
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '创建模型配置失败',
        data: null
      });
    }
  }
};

// 更新模型配置
const updateModelConfig = async (req, res) => {
  try {
    const { user_model_id, config_id } = req.params;
    const { id: user_id } = req.user;
    const { status } = req.body;
    
    // 验证用户模型归属
    const modelCheck = await pool.query(
      'SELECT id FROM user_models WHERE id = $1 AND user_id = $2',
      [user_model_id, user_id]
    );
    
    if (modelCheck.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    const result = await pool.query(
      `UPDATE user_model_configs 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_model_id = $3 
       RETURNING *`,
      [status, config_id, user_model_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型配置不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '模型配置更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating model config:', error);
    res.status(500).json({
      code: 500,
      message: '更新模型配置失败',
      data: null
    });
  }
};

// 删除模型配置
const deleteModelConfig = async (req, res) => {
  try {
    const { user_model_id, config_id } = req.params;
    const { id: user_id } = req.user;
    
    // 验证用户模型归属
    const modelCheck = await pool.query(
      'SELECT id FROM user_models WHERE id = $1 AND user_id = $2',
      [user_model_id, user_id]
    );
    
    if (modelCheck.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    await pool.query(
      'DELETE FROM user_model_configs WHERE id = $1 AND user_model_id = $2',
      [config_id, user_model_id]
    );
    
    res.json({
      code: 200,
      message: '模型配置删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting model config:', error);
    res.status(500).json({
      code: 500,
      message: '删除模型配置失败',
      data: null
    });
  }
};

// 获取平台支持的模型列表
const getPlatformModels = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM models WHERE status = $1 ORDER BY created_at DESC', ['enabled']);
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting platform models:', error);
    res.status(500).json({
      code: 500,
      message: '获取平台模型列表失败',
      data: null
    });
  }
};

module.exports = {
  getUserModels,
  getUserModelById,
  createUserModel,
  updateUserModel,
  deleteUserModel,
  getPlatformModels,
  getModelConfigs,
  createModelConfig,
  updateModelConfig,
  deleteModelConfig
};
