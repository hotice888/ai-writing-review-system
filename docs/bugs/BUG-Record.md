# BUG记录文档

## 2026年4月

### BUG-001: 模型测试API返回500错误

**发现日期**: 2026-04-02

**严重程度**: P1

**问题描述**:
用户在前端"我的模型"页面进行模型测试时，API返回500错误，错误信息为 "Unexpected end of JSON input"

**复现步骤**:
1. 登录用户端
2. 进入"我的模型"页面
3. 点击某个模型的"测试"按钮
4. 发送测试请求
5. 返回500错误

**根因分析**:
1. **API URL不完整**: 模型配置中的API URL是 `https://coding.dashscope.aliyuncs.com/v1`，但阿里云百炼实际需要完整路径 `/chat/completions`
2. **请求体格式错误**: 代码中使用了 `{"input":{"messages":[...]}}` 格式，但阿里云百炼API期望直接使用 `{"messages":[...]}` 格式

**修复方案**:
1. 在 `backend/src/controllers/llmController.js` 中添加URL自动补全逻辑，将 `/v1` 自动补全为 `/v1/chat/completions`
2. 修改 `buildRequestParams` 函数中 `custom` 和 `aliyun` provider 的请求体格式，使用直接的 `messages` 字段

**修复文件**:
- `backend/src/controllers/llmController.js`

**修复代码**:
```javascript
// URL补全逻辑
if (!apiUrl.includes('/chat/completions') && !apiUrl.includes('/v1/')) {
  apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
} else if (!apiUrl.includes('/chat/completions')) {
  apiUrl = apiUrl.replace('/v1', '/v1/chat/completions');
}

// 请求体格式修复
case 'aliyun':
case 'custom':
  return {
    model: model,
    messages: messages,
    temperature: params.temperature || 0.7,
    max_tokens: params.max_tokens || 2000,
    top_p: params.top_p || 1
  };
```

**验证结果**:
- API返回200成功
- Token日志正确保存（包含request_url, response_status_code, prompt_tokens, completion_tokens, total_tokens, duration_ms）
- 错误信息也会正确保存到日志中

**处理时间**: 约2小时

---

### BUG-002: 更新用户模型时500错误 - 字段不存在

**发现日期**: 2026-04-02

**严重程度**: P1

**问题描述**:
用户在前端"我的模型"页面更新模型配置时，API返回500错误，错误信息为 "关系 'user_models' 的 'openai_api_url' 字段不存在"

**复现步骤**:
1. 登录管理端或用户端
2. 进入"我的模型"页面
3. 点击某个模型的编辑按钮
4. 修改模型配置并保存
5. 返回500错误

**根因分析**:
前端表单提交时包含了 `openai_api_url` 和 `anthropic_api_url` 字段，但数据库表 `user_models` 中不存在这些字段

**修复方案**:
在数据库表 `user_models` 中添加 `openai_api_url` 和 `anthropic_api_url` 字段

**修复文件**:
- 数据库迁移脚本: `scripts/migrations/20260402000000_add_openai_api_url_to_user_models.js`

**修复SQL**:
```sql
ALTER TABLE user_models 
ADD COLUMN IF NOT EXISTS openai_api_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS anthropic_api_url VARCHAR(500)
```

**验证结果**:
- 更新模型API返回200成功
- 字段正确保存到数据库

**处理时间**: 约10分钟
