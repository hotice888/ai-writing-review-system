const pool = require('../config/database');

// 获取智能体列表
const getAgents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents ORDER BY created_at DESC');
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('获取智能体列表错误:', error);
    res.json({
      code: 500,
      message: '获取智能体列表失败',
    });
  }
};

// 获取单个智能体
const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM agents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.json({
        code: 404,
        message: '智能体不存在',
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取智能体详情错误:', error);
    res.json({
      code: 500,
      message: '获取智能体详情失败',
    });
  }
};

// 创建智能体
const createAgent = async (req, res) => {
  try {
    const { name, code, description, role, instructions, status } = req.body;
    
    // 检查代码是否已存在
    const existingAgent = await pool.query('SELECT id FROM agents WHERE code = $1', [code]);
    if (existingAgent.rows.length > 0) {
      return res.json({
        code: 400,
        message: '智能体代码已存在',
      });
    }
    
    const result = await pool.query(
      'INSERT INTO agents (name, code, description, role, instructions, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, code, description, role, instructions, status || 'enabled']
    );
    
    res.json({
      code: 200,
      message: '创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建智能体错误:', error);
    res.json({
      code: 500,
      message: '创建智能体失败',
    });
  }
};

// 更新智能体
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, role, instructions, status } = req.body;
    
    // 检查智能体是否存在
    const existingAgent = await pool.query('SELECT id FROM agents WHERE id = $1', [id]);
    if (existingAgent.rows.length === 0) {
      return res.json({
        code: 404,
        message: '智能体不存在',
      });
    }
    
    // 检查代码是否与其他智能体重复
    if (code) {
      const codeCheck = await pool.query('SELECT id FROM agents WHERE code = $1 AND id != $2', [code, id]);
      if (codeCheck.rows.length > 0) {
        return res.json({
          code: 400,
          message: '智能体代码已存在',
        });
      }
    }
    
    const result = await pool.query(
      'UPDATE agents SET name = $1, code = $2, description = $3, role = $4, instructions = $5, status = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, code, description, role, instructions, status, id]
    );
    
    res.json({
      code: 200,
      message: '更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新智能体错误:', error);
    res.json({
      code: 500,
      message: '更新智能体失败',
    });
  }
};

// 删除智能体
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM agents WHERE id = $1', [id]);
    
    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除智能体错误:', error);
    res.json({
      code: 500,
      message: '删除智能体失败',
    });
  }
};

module.exports = {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent
};