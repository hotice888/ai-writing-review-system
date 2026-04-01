// 阿里云百炼CodingPlan模型配置
module.exports = {
  provider: {
    name: '阿里云百炼CodingPlan',
    code: 'aliyun_bailian',
    url: 'https://bailian.console.aliyun.com/cn-beijing/?tab=coding-plan#/efm/coding-plan-index',
    openai_base_url: 'https://coding.dashscope.aliyuncs.com/v1',
    anthropic_base_url: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
    protocol_base_url: 'https://coding.dashscope.aliyuncs.com/v1',
    description: '阿里云百炼CodingPlan模型提供商',
    status: 'enabled'
  },
  models: [
    { brand: '千问', modelId: 'qwen3.5-plus', capability: '文本生成、深度思考、视觉理解' },
    { brand: '千问', modelId: 'qwen3-max-2026-01-23', capability: '文本生成、深度思考' },
    { brand: '千问', modelId: 'qwen3-coder-next', capability: '文本生成' },
    { brand: '千问', modelId: 'qwen3-coder-plus', capability: '文本生成' },
    { brand: '智谱', modelId: 'glm-5', capability: '文本生成、深度思考' },
    { brand: '智谱', modelId: 'glm-4.7', capability: '文本生成、深度思考' },
    { brand: 'Kimi', modelId: 'kimi-k2.5', capability: '文本生成、深度思考、视觉理解' },
    { brand: 'MiniMax', modelId: 'MiniMax-M2.5', capability: '文本生成、深度思考' }
  ]
};