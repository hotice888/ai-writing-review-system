module.exports = {
  version: '1.0.0',
  data: [
    {
      name: 'OpenAI',
      code: 'openai',
      base_url: 'https://api.openai.com/v1',
      anthropic_base_url: null,
      common_links: 'https://platform.openai.com/docs/introduction,https://platform.openai.com/account/api-keys'
    },
    {
      name: 'Anthropic',
      code: 'anthropic',
      base_url: null,
      anthropic_base_url: 'https://api.anthropic.com/v1',
      common_links: 'https://docs.anthropic.com/claude/docs/intro-to-claude,https://console.anthropic.com/settings/keys'
    },
    {
      name: 'GLM',
      code: 'glm',
      base_url: 'https://open.bigmodel.cn/api/mt',
      anthropic_base_url: null,
      common_links: 'https://open.bigmodel.cn/docs/introduction,https://open.bigmodel.cn/usercenter/apikeys'
    },
    {
      name: 'Azure OpenAI',
      code: 'azure',
      base_url: 'https://example.openai.azure.com/openai/deployments/{deployment-id}/chat/completions',
      anthropic_base_url: null,
      common_links: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/overview,https://portal.azure.com/'
    }
  ]
};