const pool = require('../config/database');
const ExcelJS = require('exceljs');

// 递归更新子字段的层级
const updateChildFieldLevels = async (client, parentId, levelDiff) => {
  const childResult = await client.query('SELECT id FROM field_options WHERE parent_field_id = $1', [parentId]);
  
  for (const child of childResult.rows) {
    await client.query(`
      UPDATE field_options 
      SET field_level = field_level + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [levelDiff, child.id]);
    
    await updateChildFieldLevels(client, child.id, levelDiff);
  }
};

// 获取字段列表
const getFieldOptions = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (status) {
      conditions.push(`fo.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const queryParams = [...params, parseInt(pageSize), offset];
    const query = `
      SELECT 
        fo.*,
        pfo.field_name as parent_field_name
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
      ORDER BY fo.updated_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Error getting field options:', error);
    res.status(500).json({ code: 500, message: '获取字段列表失败', data: null });
  }
};

// 获取字段详情
const getFieldOptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        fo.*,
        pfo.field_name as parent_field_name
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      WHERE fo.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    res.json({ code: 200, message: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('Error getting field option:', error);
    res.status(500).json({ code: 500, message: '获取字段详情失败', data: null });
  }
};

// 创建字段
const createFieldOption = async (req, res) => {
  try {
    const { field_name, field_code, status = 'enabled', parent_field_id, field_level = 1, description } = req.body;
    
    if (!field_name || !field_code) {
      return res.status(400).json({ code: 400, message: '字段名称和字段标识必填', data: null });
    }
    
    const existingResult = await pool.query(
      'SELECT id FROM field_options WHERE field_code = $1', 
      [field_code]
    );
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ code: 400, message: '字段标识已存在', data: null });
    }
    
    let finalFieldLevel = field_level;
    if (parent_field_id) {
      const parentResult = await pool.query('SELECT field_level FROM field_options WHERE id = $1', [parent_field_id]);
      if (parentResult.rows.length > 0) {
        finalFieldLevel = parentResult.rows[0].field_level + 1;
      }
    }
    
    const result = await pool.query(`
      INSERT INTO field_options (field_name, field_code, status, parent_field_id, field_level, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [field_name, field_code, status, parent_field_id || null, finalFieldLevel, description]);
    
    res.json({ code: 200, message: '创建成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating field option:', error);
    res.status(500).json({ code: 500, message: '创建字段失败', data: null });
  }
};

// 更新字段
const updateFieldOption = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { field_name, field_code, status, parent_field_id, field_level, description } = req.body;
    
    const existingResult = await client.query('SELECT * FROM field_options WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    const oldField = existingResult.rows[0];
    const oldParentFieldId = oldField.parent_field_id;
    const oldFieldLevel = oldField.field_level;
    
    if (field_code) {
      const checkResult = await client.query(
        'SELECT id FROM field_options WHERE field_code = $1 AND id != $2', 
        [field_code, id]
      );
      if (checkResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ code: 400, message: '字段标识已存在', data: null });
      }
    }
    
    let finalFieldLevel;
    let levelDiff = 0;
    
    // 检查上级字段是否发生变化
    const parentChanged = oldParentFieldId !== parent_field_id;
    
    // 无论前端是否传递 field_level，只要 parent_field_id 发生变化，我们都重新计算层级
    if (parentChanged) {
      if (parent_field_id) {
        // 有上级字段，获取上级字段的层级 + 1
        const parentResult = await client.query('SELECT field_level FROM field_options WHERE id = $1', [parent_field_id]);
        if (parentResult.rows.length > 0) {
          finalFieldLevel = parentResult.rows[0].field_level + 1;
        }
      } else {
        // 没有上级字段，层级设为 1
        finalFieldLevel = 1;
      }
      
      // 计算层级变化
      levelDiff = finalFieldLevel - oldFieldLevel;
    } else if (parent_field_id && !field_level) {
      // 上级字段没有变化，但需要根据上级字段计算层级
      const parentResult = await client.query('SELECT field_level FROM field_options WHERE id = $1', [parent_field_id]);
      if (parentResult.rows.length > 0) {
        finalFieldLevel = parentResult.rows[0].field_level + 1;
      }
    } else {
      // 上级字段没有变化，使用传入的 field_level 或保持原值
      finalFieldLevel = field_level !== undefined ? field_level : oldFieldLevel;
    }
    
    // 更新当前字段
    const result = await client.query(`
      UPDATE field_options 
      SET field_name = COALESCE($1, field_name),
          field_code = COALESCE($2, field_code),
          status = COALESCE($3, status),
          parent_field_id = $4,
          field_level = $5,
          description = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [field_name, field_code, status, parent_field_id || null, finalFieldLevel, description, id]);
    
    // 如果上级字段发生变化且层级有变化，递归更新子字段的层级
    if (parentChanged && levelDiff !== 0) {
      await updateChildFieldLevels(client, id, levelDiff);
    }
    
    await client.query('COMMIT');
    
    res.json({ code: 200, message: '更新成功', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating field option:', error);
    res.status(500).json({ code: 500, message: '更新字段失败', data: null });
  } finally {
    client.release();
  }
};

// 删除字段
const deleteFieldOption = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // 1. 获取要删除的字段信息
    const fieldResult = await client.query('SELECT field_level FROM field_options WHERE id = $1', [id]);
    if (fieldResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    const deletedFieldLevel = fieldResult.rows[0].field_level;
    
    // 2. 查找该字段的所有子字段
    const childFieldsResult = await client.query('SELECT id, field_level FROM field_options WHERE parent_field_id = $1', [id]);
    
    // 3. 处理每个子字段
    for (const childField of childFieldsResult.rows) {
      const childFieldId = childField.id;
      const oldChildFieldLevel = childField.field_level;
      
      // 计算新的层级：当子字段的上级字段被清空时，它成为顶级字段，层级为 1
      // 所以层级变化为：1 - oldChildFieldLevel
      const levelDiff = 1 - oldChildFieldLevel;
      
      // 3.1 清空子字段的上级字段并更新层级
      await client.query(`
        UPDATE field_options 
        SET parent_field_id = NULL, 
            field_level = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [childFieldId]);
      
      // 3.2 递归更新该子字段的子字段的层级
      await updateChildFieldLevels(client, childFieldId, levelDiff);
      
      // 3.3 查找并清空该子字段的选项的上级选项
      await client.query(`
        UPDATE field_option_items 
        SET parent_option_id = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE field_id = $1 AND parent_option_id IS NOT NULL
      `, [childFieldId]);
    }
    
    // 4. 查找其他字段的选项中，上级选项属于该字段选项的记录，清空它们的上级选项
    // 首先获取该字段的所有选项ID
    const optionsResult = await client.query('SELECT id FROM field_option_items WHERE field_id = $1', [id]);
    const optionIds = optionsResult.rows.map(row => row.id);
    
    if (optionIds.length > 0) {
      await client.query(`
        UPDATE field_option_items 
        SET parent_option_id = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE parent_option_id = ANY($1)
      `, [optionIds]);
    }
    
    // 5. 删除该字段的所有选项
    await client.query('DELETE FROM field_option_items WHERE field_id = $1', [id]);
    
    // 6. 删除该字段本身
    await client.query('DELETE FROM field_options WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting field option:', error);
    res.status(500).json({ code: 500, message: '删除字段失败', data: null });
  } finally {
    client.release();
  }
};

// 切换字段状态
const toggleFieldStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['enabled', 'disabled', 'archived'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效', data: null });
    }
    
    const result = await pool.query(`
      UPDATE field_options 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    res.json({ code: 200, message: '状态更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error toggling field status:', error);
    res.status(500).json({ code: 500, message: '更新字段状态失败', data: null });
  }
};

// 获取选项列表
const getFieldOptionItems = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { page = 1, pageSize = 100, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conditions = [`foi.field_id = $${1}`];
    const params = [fieldId];
    
    if (keyword) {
      conditions.push(`(foi.option_text ILIKE $${params.length + 1} OR foi.option_value ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (status) {
      conditions.push(`foi.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM field_option_items foi
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const queryParams = [...params, parseInt(pageSize), offset];
    const query = `
      SELECT 
        foi.*,
        pfoi.option_text as parent_option_text
      FROM field_option_items foi
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      ${whereClause}
      ORDER BY foi.display_order ASC, foi.created_at ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total
      }
    });
  } catch (error) {
    console.error('Error getting field option items:', error);
    res.status(500).json({ code: 500, message: '获取选项列表失败', data: null });
  }
};

// 获取所有选项列表
const getAllOptionItems = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, field_id, keyword, field_keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conditions = [];
    const params = [];
    
    if (field_id) {
      conditions.push(`foi.field_id = $${params.length + 1}`);
      params.push(field_id);
    }
    
    if (keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1} OR foi.option_text ILIKE $${params.length + 1} OR foi.option_value ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (field_keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1})`);
      params.push(`%${field_keyword}%`);
    }
    
    if (status) {
      conditions.push(`foi.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM field_option_items foi
      JOIN field_options fo ON foi.field_id = fo.id
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    const queryParams = [...params, parseInt(pageSize), offset];
    const query = `
      SELECT 
        foi.*,
        fo.field_name,
        fo.field_code,
        fo.status as field_status,
        fo.field_level,
        pfo.field_name as parent_field_name,
        pfoi.option_text as parent_option_text
      FROM field_option_items foi
      JOIN field_options fo ON foi.field_id = fo.id
      LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
      ORDER BY fo.updated_at DESC, foi.display_order ASC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: result.rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Error getting all option items:', error);
    res.status(500).json({ code: 500, message: '获取选项列表失败', data: null });
  }
};

// 创建选项
const createFieldOptionItem = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { option_text, option_value, status = 'enabled', display_order = 0, parent_option_id } = req.body;
    
    console.log('=== 调试信息: 创建选项 ===');
    console.log('fieldId:', fieldId);
    console.log('请求数据:', { option_text, option_value, status, display_order, parent_option_id });
    
    if (!option_text) {
      console.log('错误: 选项名称必填');
      return res.status(400).json({ code: 400, message: '选项名称必填', data: null });
    }
    
    const fieldCheckResult = await pool.query('SELECT id FROM field_options WHERE id = $1', [fieldId]);
    if (fieldCheckResult.rows.length === 0) {
      console.log('错误: 字段不存在');
      return res.status(404).json({ code: 404, message: '字段不存在', data: null });
    }
    
    const tempOptionValue = option_value !== undefined && option_value !== null ? option_value : '';
    
    console.log('准备插入数据库:', [fieldId, option_text, tempOptionValue, status, display_order, parent_option_id || null]);
    
    const result = await pool.query(`
      INSERT INTO field_option_items (field_id, option_text, option_value, status, display_order, parent_option_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [fieldId, option_text, tempOptionValue, status, display_order, parent_option_id || null]);
    
    console.log('创建成功:', result.rows[0]);
    res.json({ code: 200, message: '创建成功', data: result.rows[0] });
  } catch (error) {
    console.error('=== 创建选项错误详情 ===');
    console.error('Error creating field option item:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ code: 500, message: '创建选项失败', data: null, error: error.message });
  }
};

// 更新选项
const updateFieldOptionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { option_text, option_value, status, display_order, parent_option_id } = req.body;
    
    console.log('=== 调试信息: 更新选项 ===');
    console.log('选项ID:', id);
    console.log('请求数据:', { option_text, option_value, status, display_order, parent_option_id });
    
    const existingResult = await pool.query('SELECT id FROM field_option_items WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      console.log('错误: 选项不存在');
      return res.status(404).json({ code: 404, message: '选项不存在', data: null });
    }
    
    const finalOptionValue = option_value !== undefined && option_value !== null ? option_value : '';
    
    console.log('准备更新数据库:', [option_text, finalOptionValue, status, display_order, parent_option_id || null, id]);
    
    const result = await pool.query(`
      UPDATE field_option_items 
      SET option_text = COALESCE($1, option_text),
          option_value = $2,
          status = COALESCE($3, status),
          display_order = COALESCE($4, display_order),
          parent_option_id = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [option_text, finalOptionValue, status, display_order, parent_option_id || null, id]);
    
    console.log('更新成功:', result.rows[0]);
    res.json({ code: 200, message: '更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('=== 更新选项错误详情 ===');
    console.error('Error updating field option item:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ code: 500, message: '更新选项失败', data: null, error: error.message });
  }
};

// 删除选项
const deleteFieldOptionItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const childCheckResult = await pool.query('SELECT id FROM field_option_items WHERE parent_option_id = $1', [id]);
    if (childCheckResult.rows.length > 0) {
      return res.status(400).json({ code: 400, message: '存在子选项，无法删除', data: null });
    }
    
    await pool.query('DELETE FROM field_option_items WHERE id = $1', [id]);
    
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Error deleting field option item:', error);
    res.status(500).json({ code: 500, message: '删除选项失败', data: null });
  }
};

// 批量删除选项
const batchDeleteOptionItems = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要删除的选项', data: null });
    }
    
    await pool.query('DELETE FROM field_option_items WHERE id = ANY($1)', [ids]);
    
    res.json({ code: 200, message: '批量删除成功', data: null });
  } catch (error) {
    console.error('Error batch deleting option items:', error);
    res.status(500).json({ code: 500, message: '批量删除失败', data: null });
  }
};

// 切换选项状态
const toggleOptionItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['enabled', 'disabled', 'archived'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态值无效', data: null });
    }
    
    const result = await pool.query(`
      UPDATE field_option_items 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 404, message: '选项不存在', data: null });
    }
    
    res.json({ code: 200, message: '状态更新成功', data: result.rows[0] });
  } catch (error) {
    console.error('Error toggling option item status:', error);
    res.status(500).json({ code: 500, message: '更新选项状态失败', data: null });
  }
};

// 刷新显示序号
const refreshOptionOrder = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { orders } = req.body;
    
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ code: 400, message: '参数无效', data: null });
    }
    
    for (const item of orders) {
      await pool.query(`
        UPDATE field_option_items 
        SET display_order = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND field_id = $3
      `, [item.display_order, item.id, fieldId]);
    }
    
    res.json({ code: 200, message: '序号刷新成功', data: null });
  } catch (error) {
    console.error('Error refreshing option order:', error);
    res.status(500).json({ code: 500, message: '刷新序号失败', data: null });
  }
};

// 导出字段和选项
const exportFieldOptions = async (req, res) => {
  try {
    const { keyword, status } = req.query;
    
    let params = [];
    let conditions = [];
    
    if (keyword) {
      conditions.push(`(fo.field_name ILIKE $${params.length + 1} OR fo.field_code ILIKE $${params.length + 1})`);
      params.push(`%${keyword}%`);
    }
    
    if (status) {
      conditions.push(`fo.status = $${params.length + 1}`);
      params.push(status);
    }
    
    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    const fieldsQuery = `
      SELECT fo.*, pfo.field_name as parent_field_name, pfo.field_code as parent_field_code, pfo.status as parent_field_status
      FROM field_options fo
      LEFT JOIN field_options pfo ON fo.parent_field_id = pfo.id
      ${whereClause}
      ORDER BY fo.created_at DESC
    `;
    
    const fieldsResult = await pool.query(fieldsQuery, params);
    const fields = fieldsResult.rows;
    console.log('找到字段数:', fields.length);
    
    const fieldIds = fields.map(f => f.id);
    
    let options = [];
    if (fieldIds.length > 0) {
      const optionsQuery = `
        SELECT foi.*, pfoi.option_text as parent_option_text
        FROM field_option_items foi
        LEFT JOIN field_option_items pfoi ON foi.parent_option_id = pfoi.id
        WHERE foi.field_id = ANY($1)
        ORDER BY foi.field_id, foi.display_order ASC
      `;
      const optionsResult = await pool.query(optionsQuery, [fieldIds]);
      options = optionsResult.rows;
      console.log('找到选项数:', options.length);
    }
    
    const workbook = new ExcelJS.Workbook();
    
    const detailSheet = workbook.addWorksheet('字段详情');
    const headers = [
      '字段ID', '字段名称', '字段标识', '字段状态', '字段描述',
      '选项ID', '选项名称', '选项Value', '选项状态', '显示序号',
      '上级选项名称', '上级字段名称', '上级字段标识', '上级字段状态'
    ];
    
    const headerRow = detailSheet.addRow(headers);
    
    const grayFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    const yellowFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB9C' }
    };
    
    const redFont = {
      color: { argb: 'FFFF0000' },
      bold: true
    };
    
    const normalFont = {
      color: { argb: 'FF000000' }
    };
    
    headerRow.eachCell((cell, colNumber) => {
      cell.font = normalFont;
      
      if (colNumber === 1 || colNumber === 6) {
        cell.fill = grayFill;
      }
      
      if (colNumber === 3 || colNumber === 7 || colNumber === 13 || colNumber === 11) {
        cell.fill = yellowFill;
      }
      
      if (colNumber === 2 || colNumber === 3) {
        cell.font = redFont;
      }
    });
    
    detailSheet.columns = [
      { width: 36 },
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 30 },
      { width: 36 },
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 10 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 12 }
    ];
    
    for (const field of fields) {
      const fieldOptions = options.filter(opt => opt.field_id === field.id);
      
      if (fieldOptions.length === 0) {
        detailSheet.addRow([
          field.id,
          field.field_name,
          field.field_code,
          field.status,
          field.description || '',
          '',
          '',
          '',
          '',
          '',
          '',
          field.parent_field_name || '',
          field.parent_field_code || '',
          field.parent_field_status || ''
        ]);
      } else {
        for (const opt of fieldOptions) {
          detailSheet.addRow([
            field.id,
            field.field_name,
            field.field_code,
            field.status,
            field.description || '',
            opt.id,
            opt.option_text,
            opt.option_value || '',
            opt.status,
            opt.display_order || '',
            opt.parent_option_text || '',
            field.parent_field_name || '',
            field.parent_field_code || '',
            field.parent_field_status || ''
          ]);
        }
      }
    }
    
    const instructionSheet = workbook.addWorksheet('字段说明');
    instructionSheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 10 },
      { width: 60 }
    ];
    
    const instructionHeaders = ['字段名称', '字段标识', '是否必填', '说明/处理逻辑'];
    const instructionHeaderRow = instructionSheet.addRow(instructionHeaders);
    instructionHeaderRow.font = { bold: true };
    
    const instructions = [
      ['字段ID', 'field_id', '否', '灰色背景，可不填；为空则新建，不为空则按ID更新已有数据'],
      ['字段名称', 'field_name', '是', '红色字体，必填；字段的显示名称'],
      ['字段标识', 'field_code', '是', '红色字体+黄色背景，必填；导入时按此字段标识判断字段是否存在；同一标识的字段会被认为是同一个字段'],
      ['字段状态', 'field_status', '否', '可选值：enabled（启用）、disabled（禁用）；默认为enabled'],
      ['字段描述', 'field_description', '否', '字段的描述信息'],
      ['选项ID', 'option_id', '否', '灰色背景，可不填；为空则新建，不为空则按ID更新已有数据'],
      ['选项名称', 'option_name', '否', '黄色背景；按选项名称在对应字段中检查选项是否存在；同一字段内同一名称的选项会被认为是同一个选项'],
      ['选项Value', 'option_value', '否', '选项的值'],
      ['选项状态', 'option_status', '否', '可选值：enabled（启用）、disabled（禁用）、archived（封存）；默认为enabled'],
      ['显示序号', 'display_order', '否', '选项的显示顺序，数字越大越靠后'],
      ['上级选项名称', 'parent_option_name', '否', '黄色背景；同一字段内的上级选项的名称；导入时按此名称查找上级选项，找不到则该选项的上级选项为空'],
      ['上级字段名称', 'parent_field_name', '否', '上级字段的显示名称，仅作参考'],
      ['上级字段标识', 'parent_field_code', '否', '黄色背景；导入时按上级字段的标识来判断上级字段是否存在；找不到则禁止导入该字段'],
      ['上级字段状态', 'parent_field_status', '否', '仅作参考']
    ];
    
    for (const instruction of instructions) {
      instructionSheet.addRow(instruction);
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=field_options_export.xlsx');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting field options:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null, error: error.message });
  }
};

// 下载导入模板
const downloadImportTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    const detailSheet = workbook.addWorksheet('字段详情');
    const headers = [
      '字段ID', '字段名称', '字段标识', '字段状态', '字段描述',
      '选项ID', '选项名称', '选项Value', '选项状态', '显示序号',
      '上级选项名称', '上级字段名称', '上级字段标识', '上级字段状态'
    ];
    
    const headerRow = detailSheet.addRow(headers);
    
    const grayFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    const yellowFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB9C' }
    };
    
    const redFont = {
      color: { argb: 'FFFF0000' },
      bold: true
    };
    
    const normalFont = {
      color: { argb: 'FF000000' }
    };
    
    headerRow.eachCell((cell, colNumber) => {
      cell.font = normalFont;
      
      if (colNumber === 1 || colNumber === 6) {
        cell.fill = grayFill;
      }
      
      if (colNumber === 3 || colNumber === 7 || colNumber === 13 || colNumber === 11) {
        cell.fill = yellowFill;
      }
      
      if (colNumber === 2 || colNumber === 3) {
        cell.font = redFont;
      }
    });
    
    detailSheet.columns = [
      { width: 36 },
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 30 },
      { width: 36 },
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 10 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 12 }
    ];
    
    const instructionSheet = workbook.addWorksheet('字段说明');
    instructionSheet.columns = [
      { width: 20 },
      { width: 20 },
      { width: 10 },
      { width: 60 }
    ];
    
    const instructionHeaders = ['字段名称', '字段标识', '是否必填', '说明/处理逻辑'];
    const instructionHeaderRow = instructionSheet.addRow(instructionHeaders);
    instructionHeaderRow.font = { bold: true };
    
    const instructions = [
      ['字段ID', 'field_id', '否', '灰色背景，可不填；为空则新建，不为空则按ID更新已有数据'],
      ['字段名称', 'field_name', '是', '红色字体，必填；字段的显示名称'],
      ['字段标识', 'field_code', '是', '红色字体+黄色背景，必填；导入时按此字段标识判断字段是否存在；同一标识的字段会被认为是同一个字段'],
      ['字段状态', 'field_status', '否', '可选值：enabled（启用）、disabled（禁用）；默认为enabled'],
      ['字段描述', 'field_description', '否', '字段的描述信息'],
      ['选项ID', 'option_id', '否', '灰色背景，可不填；为空则新建，不为空则按ID更新已有数据'],
      ['选项名称', 'option_name', '否', '黄色背景；按选项名称在对应字段中检查选项是否存在；同一字段内同一名称的选项会被认为是同一个选项'],
      ['选项Value', 'option_value', '否', '选项的值'],
      ['选项状态', 'option_status', '否', '可选值：enabled（启用）、disabled（禁用）、archived（封存）；默认为enabled'],
      ['显示序号', 'display_order', '否', '选项的显示顺序，数字越大越靠后'],
      ['上级选项名称', 'parent_option_name', '否', '黄色背景；同一字段内的上级选项的名称；导入时按此名称查找上级选项，找不到则该选项的上级选项为空'],
      ['上级字段名称', 'parent_field_name', '否', '上级字段的显示名称，仅作参考'],
      ['上级字段标识', 'parent_field_code', '否', '黄色背景；导入时按上级字段的标识来判断上级字段是否存在；找不到则禁止导入该字段'],
      ['上级字段状态', 'parent_field_status', '否', '仅作参考']
    ];
    
    for (const instruction of instructions) {
      instructionSheet.addRow(instruction);
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=field_options_import_template.xlsx');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading import template:', error);
    res.status(500).json({ code: 500, message: '下载模板失败', data: null, error: error.message });
  }
};

// 导入字段和选项
const importFieldOptions = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    if (!req.files || !req.files.file) {
      await client.query('ROLLBACK');
      return res.status(400).json({ code: 400, message: '请上传文件', data: null });
    }
    
    const file = req.files.file;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.data);
    
    const detailSheet = workbook.getWorksheet('字段详情');
    if (!detailSheet) {
      await client.query('ROLLBACK');
      return res.status(400).json({ code: 400, message: '缺少【字段详情】页签', data: null });
    }
    
    const rows = [];
    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values;
      if (values.length > 0 && values[2]) {
        rows.push({
          field_id: values[1] || '',
          field_name: values[2] || '',
          field_code: values[3] || '',
          field_status: values[4] || 'enabled',
          field_description: values[5] || '',
          option_id: values[6] || '',
          option_name: values[7] || '',
          option_value: values[8] || '',
          option_status: values[9] || 'enabled',
          display_order: values[10] || 0,
          parent_option_name: values[11] || '',
          parent_field_name: values[12] || '',
          parent_field_code: values[13] || '',
          parent_field_status: values[14] || ''
        });
      }
    });
    
    const processedFields = new Map();
    const processedOptions = [];
    
    for (const row of rows) {
      const fieldKey = row.field_code;
      if (!fieldKey) continue;
      
      if (!processedFields.has(fieldKey)) {
        let parentFieldId = null;
        if (row.parent_field_code) {
          const parentResult = await client.query('SELECT id FROM field_options WHERE field_code = $1', [row.parent_field_code]);
          if (parentResult.rows.length > 0) {
            parentFieldId = parentResult.rows[0].id;
          }
        }
        
        let fieldId = row.field_id;
        let field;
        
        if (fieldId) {
          const existingResult = await client.query('SELECT * FROM field_options WHERE id = $1', [fieldId]);
          if (existingResult.rows.length > 0) {
            field = existingResult.rows[0];
            let finalParentFieldId = parentFieldId;
            let finalFieldLevel;
            
            if (parentFieldId !== field.parent_field_id) {
              if (parentFieldId) {
                const parentResult = await client.query('SELECT field_level FROM field_options WHERE id = $1', [parentFieldId]);
                if (parentResult.rows.length > 0) {
                  finalFieldLevel = parentResult.rows[0].field_level + 1;
                }
              } else {
                finalFieldLevel = 1;
              }
            }
            
            const updateResult = await client.query(`
              UPDATE field_options 
              SET field_name = COALESCE($1, field_name),
                  status = COALESCE($2, status),
                  description = $3,
                  parent_field_id = $4,
                  field_level = COALESCE($5, field_level),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $6
              RETURNING *
            `, [row.field_name, row.field_status, row.field_description, parentFieldId || null, finalFieldLevel, fieldId]);
            
            field = updateResult.rows[0];
          } else {
            fieldId = null;
          }
        }
        
        if (!fieldId) {
          const existingByCode = await client.query('SELECT * FROM field_options WHERE field_code = $1', [fieldKey]);
          if (existingByCode.rows.length > 0) {
            field = existingByCode.rows[0];
            let finalParentFieldId = parentFieldId;
            let finalFieldLevel;
            
            if (parentFieldId !== field.parent_field_id) {
              if (parentFieldId) {
                const parentResult = await client.query('SELECT field_level FROM field_options WHERE id = $1', [parentFieldId]);
                if (parentResult.rows.length > 0) {
                  finalFieldLevel = parentResult.rows[0].field_level + 1;
                }
              } else {
                finalFieldLevel = 1;
              }
            }
            
            const updateResult = await client.query(`
              UPDATE field_options 
              SET field_name = COALESCE($1, field_name),
                  status = COALESCE($2, status),
                  description = $3,
                  parent_field_id = $4,
                  field_level = COALESCE($5, field_level),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $6
              RETURNING *
            `, [row.field_name, row.field_status, row.field_description, parentFieldId || null, finalFieldLevel, field.id]);
            
            field = updateResult.rows[0];
          } else {
            let finalFieldLevel = 1;
            if (parentFieldId) {
              const parentResult = await client.query('SELECT field_level FROM field_options WHERE id = $1', [parentFieldId]);
              if (parentResult.rows.length > 0) {
                finalFieldLevel = parentResult.rows[0].field_level + 1;
              }
            }
            
            const createResult = await client.query(`
              INSERT INTO field_options (field_name, field_code, status, description, parent_field_id, field_level)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `, [row.field_name, fieldKey, row.field_status, row.field_description, parentFieldId || null, finalFieldLevel]);
            
            field = createResult.rows[0];
          }
        }
        
        processedFields.set(fieldKey, field);
      }
      
      if (row.option_name) {
        processedOptions.push({
          ...row,
          field: processedFields.get(fieldKey)
        });
      }
    }
    
    for (const item of processedOptions) {
      const field = item.field;
      if (!field) continue;
      
      let optionId = item.option_id;
      let parentOptionId = null;
      
      if (item.parent_option_name) {
        const parentOptResult = await client.query(
          'SELECT id FROM field_option_items WHERE field_id = $1 AND option_text = $2',
          [field.id, item.parent_option_name]
        );
        if (parentOptResult.rows.length > 0) {
          parentOptionId = parentOptResult.rows[0].id;
        }
      }
      
      if (optionId) {
        const existingOptResult = await client.query('SELECT * FROM field_option_items WHERE id = $1', [optionId]);
        if (existingOptResult.rows.length > 0) {
          await client.query(`
            UPDATE field_option_items 
            SET option_text = COALESCE($1, option_text),
                option_value = COALESCE($2, option_value),
                status = COALESCE($3, status),
                display_order = COALESCE($4, display_order),
                parent_option_id = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
          `, [item.option_name, item.option_value, item.option_status, item.display_order, parentOptionId || null, optionId]);
        } else {
          optionId = null;
        }
      }
      
      if (!optionId) {
        const existingOptByText = await client.query(
          'SELECT * FROM field_option_items WHERE field_id = $1 AND option_text = $2',
          [field.id, item.option_name]
        );
        if (existingOptByText.rows.length > 0) {
          await client.query(`
            UPDATE field_option_items 
            SET option_value = COALESCE($1, option_value),
                status = COALESCE($2, status),
                display_order = COALESCE($3, display_order),
                parent_option_id = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [item.option_value, item.option_status, item.display_order, parentOptionId || null, existingOptByText.rows[0].id]);
        } else {
          await client.query(`
            INSERT INTO field_option_items (field_id, option_text, option_value, status, display_order, parent_option_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [field.id, item.option_name, item.option_value, item.option_status, item.display_order, parentOptionId || null]);
        }
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      code: 200, 
      message: '导入成功', 
      data: { 
        fieldCount: processedFields.size, 
        optionCount: processedOptions.length 
      } 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing field options:', error);
    res.status(500).json({ code: 500, message: '导入失败', data: null, error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getFieldOptions,
  getFieldOptionById,
  createFieldOption,
  updateFieldOption,
  deleteFieldOption,
  toggleFieldStatus,
  getFieldOptionItems,
  getAllOptionItems,
  createFieldOptionItem,
  updateFieldOptionItem,
  deleteFieldOptionItem,
  batchDeleteOptionItems,
  toggleOptionItemStatus,
  refreshOptionOrder,
  exportFieldOptions,
  downloadImportTemplate,
  importFieldOptions
};
