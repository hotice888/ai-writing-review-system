# 模型设置与智能体管理需求分析

## 一、需求概述

### 1.1 背景说明
为了支持AI写作系统的智能功能，需要引入大模型调用能力。不同用户可能需要使用不同的大模型配置，不同的智能体可能需要使用不同的大模型。因此需要建立模型配置管理和智能体管理功能。

### 1.2 核心目标
- 平台提供预置模型配置模板（不含API Key），用户只需配置API Key即可使用
- 用户可以完全自定义自己的模型配置
- 平台维护智能体，用户可以为每个智能体指定使用的大模型配置
- 调用API时，根据用户的智能体设置自动选择对应的大模型
- 记录调用成本（token使用量），为后续计费做准备

---

## 二、功能模块设计

### 2.1 模型配置管理

#### 2.1.1 功能描述

**平台模型预设**：
- 平台提供预置的模型配置模板，包含常用模型的基础配置信息
- 预设配置不包含API Key，用户需要自行配置
- 平台提供获取API Key的帮助文档链接
- 用户可以基于预设快速配置自己的模型

**用户模型配置**：
- 用户可以管理自己的模型配置
- 支持基于平台预设快速配置（只需填写API Key）
- 支持完全自定义配置

#### 2.1.2 数据模型

**平台模型预设表 (platform_model_presets)** - 平台维护

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键ID | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | 预设名称 | NOT NULL |
| provider | VARCHAR(50) | 提供商 (openai/anthropic/bailian/siliconflow/azure/custom) | NOT NULL |
| model_name | VARCHAR(100) | 模型名称 | NOT NULL |
| api_endpoint | VARCHAR(500) | API端点地址 | NOT NULL |
| api_version | VARCHAR(50) | API版本 | 可选 |
| max_tokens | INT | 最大token数 | 默认4096 |
| temperature | DECIMAL(3,2) | 温度参数 (0.0-2.0) | 默认0.7 |
| top_p | DECIMAL(3,2) | Top-p参数 (0.0-1.0) | 默认1.0 |
| description | TEXT | 预设描述 | 可选 |
| key_guide_url | VARCHAR(500) | 获取API Key的帮助文档链接 | 可选 |
| icon | VARCHAR(200) | 图标URL | 可选 |
| sort_order | INT | 排序顺序 | 默认0 |
| status | VARCHAR(20) | 状态 (enabled/disabled) | 默认enabled |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

**用户模型配置表 (user_model_configs)**

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键ID | PK, AUTO_INCREMENT |
| user_id | BIGINT | 所属用户ID | FK -> users.id |
| preset_id | BIGINT | 平台预设ID | FK -> platform_model_presets.id, 可选 |
| name | VARCHAR(100) | 配置名称 | NOT NULL |
| provider | VARCHAR(50) | 提供商 | NOT NULL |
| model_name | VARCHAR(100) | 模型名称 | NOT NULL |
| api_key | TEXT | API密钥 | NOT NULL, ENCRYPTED |
| api_endpoint | VARCHAR(500) | API端点地址 | NOT NULL |
| api_version | VARCHAR(50) | API版本 | 可选 |
| max_tokens | INT | 最大token数 | 默认4096 |
| temperature | DECIMAL(3,2) | 温度参数 (0.0-2.0) | 默认0.7 |
| top_p | DECIMAL(3,2) | Top-p参数 (0.0-1.0) | 默认1.0 |
| description | TEXT | 配置描述 | 可选 |
| is_default | BOOLEAN | 是否为默认配置 | 默认false |
| status | VARCHAR(20) | 状态 (enabled/disabled) | 默认enabled |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

#### 2.1.3 平台预设模型列表

**模型场景适配说明**：

| 场景分类 | 说明 | 推荐模型特点 |
|---------|------|------------|
| 卷/系列规划 | 整体架构、世界观设定 | 超长上下文、强逻辑推理 |
| 大纲规划 | 章节结构、情节脉络 | 长上下文、结构化思维 |
| 章节规划 | 章节内容、场景安排 | 中长上下文、连贯性好 |
| 剧情设计 | 情节发展、冲突设置 | 创意强、想象力丰富 |
| 人物设定 | 角色性格、背景故事 | 细节描述、一致性 |
| 章节编写 | 正文创作、场景描写 | 长文本生成、风格一致 |
| 内容润色 | 文字打磨、优化提升 | 语言优美、细节把控 |
| 对话生成 | 角色对话、互动交流 | 自然流畅、角色特色 |
| 场景描写 | 环境渲染、氛围营造 | 画面感强、细节丰富 |
| 情节转折 | 剧情反转、意外发展 | 创意新颖、逻辑自洽 |
| 伏笔埋设 | 线索布置、细节呼应 | 长远规划、细节把控 |
| 结局设计 | 收尾总结、情感共鸣 | 整体把控、情感深度 |

**平台预设模型列表**：

| 提供商 | 模型名称 | 上下文长度 | 适用场景 | 说明 |
|--------|---------|-----------|---------|------|
| **OpenAI** | | | | |
| OpenAI | gpt-4-turbo | 128K | 卷规划、大纲规划、人物设定、章节编写 | GPT-4 Turbo，平衡性能与成本，适合大多数创作场景 |
| OpenAI | gpt-4 | 8K | 大纲规划、人物设定、章节编写 | GPT-4 标准版，质量最高，适合重要场景 |
| OpenAI | gpt-3.5-turbo | 16K | 对话生成、内容润色、场景描写 | GPT-3.5 Turbo，速度快、成本低，适合快速迭代 |
| **Anthropic** | | | | |
| Anthropic | claude-3-opus | 200K | 卷规划、大纲规划、章节编写、伏笔埋设 | Claude 3 Opus，超长上下文，适合长篇小说整体规划 |
| Anthropic | claude-3-sonnet | 200K | 大纲规划、章节规划、剧情设计、人物设定 | Claude 3 Sonnet，长上下文、高性价比，适合核心创作 |
| Anthropic | claude-3-haiku | 200K | 对话生成、内容润色、场景描写 | Claude 3 Haiku，快速响应、低成本，适合辅助场景 |
| **百炼云** | | | | |
| 百炼云 | qwen-max | 32K | 大纲规划、章节规划、剧情设计、人物设定 | 通义千问 Max，中文理解强，适合中文小说创作 |
| 百炼云 | qwen-plus | 32K | 章节编写、内容润色、对话生成 | 通义千问 Plus，平衡性能与成本 |
| 百炼云 | qwen-turbo | 8K | 对话生成、内容润色、场景描写 | 通义千问 Turbo，快速响应、低成本 |
| **硅基流动** | | | | |
| 硅基流动 | deepseek-chat | 32K | 大纲规划、章节规划、剧情设计、人物设定 | DeepSeek Chat，性价比高，适合中文创作 |
| 硅基流动 | yi-34b-chat | 200K | 卷规划、大纲规划、章节编写、伏笔埋设 | 零一万物 Yi-34B，超长上下文，适合长篇规划 |
| 硅基流动 | deepseek-coder | 16K | 内容润色、对话生成 | DeepSeek Coder，适合技术性内容辅助 |

**场景推荐模型**：

| 场景 | 首选模型 | 备选模型 |
|------|----------|---------|
| 卷/系列规划 | claude-3-opus, yi-34b-chat | gpt-4-turbo, claude-3-sonnet |
| 大纲规划 | claude-3-sonnet, qwen-max | gpt-4-turbo, deepseek-chat |
| 章节规划 | claude-3-sonnet, gpt-4-turbo | qwen-max, deepseek-chat |
| 剧情设计 | claude-3-opus, gpt-4 | claude-3-sonnet, qwen-max |
| 人物设定 | claude-3-sonnet, gpt-4 | gpt-4-turbo, qwen-max |
| 章节编写 | claude-3-opus, gpt-4-turbo | claude-3-sonnet, qwen-max |
| 内容润色 | gpt-4, claude-3-sonnet | gpt-3.5-turbo, claude-3-haiku |
| 对话生成 | gpt-3.5-turbo, claude-3-haiku | qwen-turbo, deepseek-coder |
| 场景描写 | claude-3-sonnet, gpt-4 | gpt-3.5-turbo, claude-3-haiku |
| 情节转折 | claude-3-opus, gpt-4 | claude-3-sonnet, qwen-max |
| 伏笔埋设 | claude-3-opus, yi-34b-chat | claude-3-sonnet, gpt-4-turbo |
| 结局设计 | claude-3-opus, gpt-4 | claude-3-sonnet, qwen-max |

#### 2.1.4 功能清单

**用户端功能**：
- ✅ 查看平台预设模型列表
- ✅ 基于预设快速配置模型（只需填写API Key）
- ✅ 完全自定义配置模型
- ✅ 查看我的模型配置列表（分页、搜索）
- ✅ 编辑模型配置
- ✅ 删除模型配置（需确认，检查是否被智能体使用）
- ✅ 设置默认模型配置
- ✅ 启用/禁用模型配置
- ✅ 测试模型配置连接（验证API Key有效性）

**管理端功能**：
- ✅ 管理平台预设模型（新增、编辑、删除）
- ✅ 查看所有用户的模型配置（分页、搜索、按用户筛选）
- ✅ 查看模型配置使用统计
- ✅ 禁用违规的模型配置

#### 2.1.5 API接口设计

```
# 平台预设
GET    /api/model-presets              - 获取平台预设模型列表
GET    /api/model-presets/:id          - 获取预设详情

# 用户模型配置
GET    /api/models                     - 获取当前用户的模型配置列表
POST   /api/models                     - 新增模型配置
GET    /api/models/:id                 - 获取模型配置详情
PUT    /api/models/:id                 - 更新模型配置
DELETE /api/models/:id                 - 删除模型配置
POST   /api/models/:id/test            - 测试模型配置连接
PUT    /api/models/:id/default         - 设置为默认配置
```

---

### 2.2 智能体管理

#### 2.2.1 功能描述
- 智能体由平台统一维护，用户不能创建智能体
- 用户可以为每个智能体设置使用的大模型配置
- 智能体包含系统提示词、工作流程配置、能力配置等

#### 2.2.2 数据模型

**智能体表 (agents)** - 平台维护

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键ID | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | 智能体名称 | NOT NULL |
| code | VARCHAR(50) | 智能体代码 (唯一标识) | NOT NULL, UNIQUE |
| category | VARCHAR(50) | 分类 | NOT NULL |
| description | TEXT | 智能体描述 | 可选 |
| system_prompt | TEXT | 系统提示词 | NOT NULL |
| user_prompt_template | TEXT | 用户提示词模板 (支持变量) | 可选 |
| workflow_config | JSON | 工作流程配置 | 可选 |
| capabilities | JSON | 能力配置 | 可选 |
| icon | VARCHAR(200) | 图标URL | 可选 |
| sort_order | INT | 排序顺序 | 默认0 |
| status | VARCHAR(20) | 状态 (enabled/disabled) | 默认enabled |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

**用户智能体设置表 (user_agent_settings)** - 用户为智能体配置模型

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键ID | PK, AUTO_INCREMENT |
| user_id | BIGINT | 所属用户ID | FK -> users.id |
| agent_id | BIGINT | 智能体ID | FK -> agents.id |
| model_config_id | BIGINT | 使用的模型配置ID | FK -> user_model_configs.id |
| is_favorite | BOOLEAN | 是否收藏 | 默认false |
| custom_settings | JSON | 自定义设置 | 可选 |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT CURRENT_TIMESTAMP |

**唯一约束**: (user_id, agent_id) - 每个用户对每个智能体只有一条设置记录

#### 2.2.3 平台智能体列表

| 智能体名称 | 代码 | 分类 | 说明 |
|-----------|------|------|------|
| 规划智能体 | planner | writing | 帮助用户规划小说大纲、章节结构、人物设定等 |
| 编写智能体 | writer | writing | 帮助用户进行小说创作、章节编写、内容润色等 |
| 评审智能体 | reviewer | review | 以多角度评审作品：作家角度、文评角度等专业视角 |
| 读者代理人 | reader-proxy | review | 模拟读者视角：评论书籍、小说的专业人士视角 |
| 摘要智能体 | summarizer | analysis | 以多角度对已有小说、章节进行概述、归纳、分析出多种特色 |

#### 2.2.4 功能清单

**用户端功能**：
- ✅ 查看智能体列表（分类筛选、搜索）
- ✅ 查看智能体详情（系统提示词、工作流程、能力说明等）
- ✅ 为智能体设置使用的模型配置
- ✅ 收藏/取消收藏智能体
- ✅ 使用智能体进行对话

**管理端功能**：
- ✅ 管理智能体（新增、编辑、删除）
- ✅ 查看智能体使用统计
- ✅ 查看用户智能体设置
- ✅ 禁用智能体

#### 2.2.5 API接口设计

```
# 智能体（用户端）
GET    /api/agents                     - 获取智能体列表
GET    /api/agents/:id                 - 获取智能体详情
PUT    /api/agents/:id/settings        - 设置智能体使用的模型配置
PUT    /api/agents/:id/favorite        - 收藏/取消收藏

# 智能体（管理端）
GET    /api/admin/agents               - 获取智能体列表
POST   /api/admin/agents               - 新增智能体
GET    /api/admin/agents/:id           - 获取智能体详情
PUT    /api/admin/agents/:id           - 更新智能体
DELETE /api/admin/agents/:id           - 删除智能体
```

---

### 2.3 智能体调用

#### 2.3.1 功能描述
用户调用智能体时，系统根据用户的智能体设置自动选择对应的大模型配置进行调用。

#### 2.3.2 调用流程

```
1. 用户选择智能体并发送请求
   ↓
2. 系统查询用户智能体设置
   ↓
3. 获取智能体关联的模型配置ID
   ↓
4. 查询模型配置详情（API Key、Endpoint等）
   ↓
5. 根据提供商调用对应的大模型API
   ↓
6. 记录调用日志（token使用量等）
   ↓
7. 返回结果给用户
```

#### 2.3.3 API接口设计

```
POST   /api/agents/:id/chat            - 调用智能体进行对话
POST   /api/agents/:id/completion      - 调用智能体进行文本补全
POST   /api/agents/:id/review          - 调用智能体进行文本审查
```

#### 2.3.4 请求参数示例

```json
{
  "message": "请帮我润色这段文字",
  "context": {
    "text": "待润色的文字内容",
    "options": {
      "style": "正式",
      "length": "保持原长度"
    }
  },
  "stream": false
}
```

---

### 2.4 调用日志与统计

#### 2.4.1 数据模型

**调用日志表 (api_call_logs)**

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGINT | 主键ID | PK, AUTO_INCREMENT |
| user_id | BIGINT | 用户ID | FK -> users.id |
| agent_id | BIGINT | 智能体ID | FK -> agents.id |
| model_config_id | BIGINT | 模型配置ID | FK -> user_model_configs.id |
| request_type | VARCHAR(50) | 请求类型 (chat/completion/review) | NOT NULL |
| input_tokens | INT | 输入token数 | 默认0 |
| output_tokens | INT | 输出token数 | 默认0 |
| total_tokens | INT | 总token数 | 默认0 |
| duration_ms | INT | 调用耗时（毫秒） | 默认0 |
| status | VARCHAR(20) | 状态 (success/failed) | NOT NULL |
| error_message | TEXT | 错误信息 | 可选 |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

#### 2.4.2 功能清单

**用户端功能**：
- ✅ 查看我的调用日志（分页、按智能体筛选）
- ✅ 查看我的token使用统计（按日/周/月）

**管理端功能**：
- ✅ 查看所有调用日志（分页、按用户/智能体筛选）
- ✅ 查看全局token使用统计
- ✅ 导出调用日志

---

## 三、权限控制设计

### 3.1 模型配置权限
- 用户只能查看和管理自己的模型配置
- 用户可以查看平台预设模型
- 管理员可以管理平台预设模型
- 管理员可以查看所有用户的模型配置
- 管理员可以禁用任何模型配置

### 3.2 智能体权限
- 普通用户只能查看和使用启用的智能体
- 用户可以为智能体设置模型配置
- 管理员可以管理智能体
- 管理员可以查看所有用户的智能体设置

### 3.3 菜单权限
需要在RBAC系统中新增以下菜单：

| 菜单名称 | 菜单代码 | 路由 | 客户端 |
|---------|---------|------|--------|
| 模型预设 | model-presets | /model-presets | admin |
| 用户模型配置 | user-models | /user-models | admin |
| 智能体管理 | agent-management | /agent-management | admin |
| 调用日志 | api-logs | /api-logs | admin |
| 我的模型 | my-models | /my-models | home |
| 智能体 | agents | /agents | home |

---

## 四、界面设计

### 4.1 平台模型预设页面（管理端）

#### 4.1.1 列表页面
- 顶部：搜索框 + 新增按钮
- 列表：预设名称、提供商、模型名称、状态、排序、操作列
- 操作：编辑、删除、启用/禁用

#### 4.1.2 新增/编辑弹窗
- 预设名称（必填）
- 提供商选择（下拉：OpenAI、Anthropic、百炼云、硅基流动、Azure、自定义）
- 模型名称（必填）
- API Endpoint（必填）
- API版本（可选）
- 最大Token数（数字输入，默认4096）
- 温度参数（滑块，0.0-2.0，默认0.7）
- Top-p参数（滑块，0.0-1.0，默认1.0）
- 描述（文本域）
- 获取API Key帮助文档链接（可选）
- 图标URL（可选）
- 排序顺序（数字输入）
- 状态（启用/禁用）

### 4.2 我的模型配置页面（用户端）

#### 4.2.1 列表页面
- 顶部：搜索框 + 新增按钮（下拉：从预设创建、自定义创建）
- 列表：配置名称、提供商、模型名称、状态、默认标识、操作列
- 操作：编辑、删除、设为默认、测试连接、启用/禁用

#### 4.2.2 从预设创建弹窗
- 选择预设（卡片或下拉选择）
- 配置名称（自动填充，可修改）
- API Key（必填，密码输入框，显示获取Key的帮助链接）
- 描述（可选）
- 状态（启用/禁用）

#### 4.2.3 自定义创建弹窗
- 配置名称（必填）
- 提供商选择（下拉）
- 模型名称（必填）
- API Key（必填，密码输入框）
- API Endpoint（必填）
- API版本（可选）
- 最大Token数
- 温度参数
- Top-p参数
- 描述
- 状态

### 4.3 智能体管理页面（管理端）

#### 4.3.1 列表页面
- 顶部：分类筛选 + 搜索框 + 新增按钮
- 列表：智能体名称、代码、分类、状态、排序、操作列
- 操作：编辑、删除、查看详情、启用/禁用

#### 4.3.2 新增/编辑弹窗
- 智能体名称（必填）
- 智能体代码（必填，唯一）
- 分类（下拉选择）
- 描述（文本域）
- 系统提示词（必填，代码编辑器）
- 用户提示词模板（可选，代码编辑器，支持变量）
- 工作流程配置（JSON编辑器）
- 能力配置（JSON编辑器）
- 图标URL（可选）
- 排序顺序
- 状态（启用/禁用）

### 4.4 智能体页面（用户端）

#### 4.4.1 列表页面
- 顶部：分类筛选 + 搜索框
- 列表：智能体名称、分类、使用的模型、收藏标识、操作列
- 操作：设置模型、收藏、使用

#### 4.4.2 设置模型弹窗
- 智能体信息展示（名称、描述）
- 选择模型配置（下拉，显示用户的模型配置列表）
- 自定义设置（可选，JSON编辑器）

#### 4.4.3 智能体使用页面
- 左侧：智能体列表（筛选、搜索）
- 右侧：对话区域
  - 顶部：当前智能体信息（名称、使用的模型）
  - 中间：对话历史
  - 底部：输入框 + 发送按钮

### 4.5 调用日志页面

#### 4.5.1 用户端
- 顶部：时间范围筛选 + 智能体筛选
- 统计卡片：总调用次数、总token使用量
- 图表：token使用趋势（按日/周/月）
- 列表：智能体名称、请求类型、token数、耗时、状态、时间

#### 4.5.2 管理端
- 顶部：时间范围筛选 + 用户筛选 + 智能体筛选
- 统计卡片：总调用次数、总token使用量、活跃用户数
- 图表：token使用趋势、用户调用排行
- 列表：用户名、智能体名称、请求类型、token数、耗时、状态、时间
- 导出按钮

---

## 五、技术实现要点

### 5.1 数据安全
- API Key需要加密存储（使用AES-256-GCM加密）
- 敏感信息传输使用HTTPS
- 模型配置详情返回时需要脱敏（API Key只显示前4位和后4位）

### 5.2 模型调用
- 支持多种大模型提供商（OpenAI、Anthropic、百炼云、硅基流动等）
- 实现统一的调用接口，屏蔽不同提供商的差异
- 支持流式响应
- 实现调用重试机制
- 记录调用日志和统计

### 5.3 缓存策略
- 智能体缓存（减少数据库查询）
- 平台预设模型缓存
- 模型配置缓存（用户级别的缓存）

### 5.4 性能优化
- 分页查询
- 索引优化（user_id、agent_id、model_config_id等）
- 异步处理（模型调用）
- 日志表分区（按时间分区）

---

## 六、已确认事项

### 6.1 功能相关
1. **模型配置共享**：❌ 不允许用户之间共享模型配置
2. **平台预设**：✅ 平台提供预设模型配置模板，用户只需配置API Key
3. **自定义配置**：✅ 允许用户完全自定义模型配置
4. **智能体创建**：❌ 不允许用户创建智能体，只能由平台维护
5. **智能体设置**：✅ 用户可以为智能体设置使用的模型配置
6. **调用计费**：✅ 记录token使用量，为后续计费做准备
7. **多模态支持**：❌ 不支持多模态输入

### 6.2 技术相关
1. **加密方案**：AES-256-GCM
2. **流式响应**：✅ 支持
3. **并发控制**：限制单个用户的并发调用数为5
4. **超时设置**：模型调用超时时间为60秒
5. **错误处理**：返回友好提示，记录错误日志

### 6.3 智能体列表
1. **规划智能体**：帮助用户规划小说大纲、章节结构、人物设定等
2. **编写智能体**：帮助用户进行小说创作、章节编写、内容润色等
3. **评审智能体**：以多角度评审作品（作家角度、文评角度等专业视角）
4. **读者代理人**：模拟读者视角（读者、评论书籍、小说的专业人士视角）
5. **摘要智能体**：以多角度对已有小说、章节进行概述、归纳、分析出多种特色

### 6.4 模型预设列表
- **OpenAI**: GPT-4 Turbo (128K), GPT-4 (8K), GPT-3.5 Turbo (16K)
- **Anthropic**: Claude 3 Opus (200K), Claude 3 Sonnet (200K), Claude 3 Haiku (200K)
- **百炼云**: 通义千问 Max (32K), Plus (32K), Turbo (8K)
- **硅基流动**: DeepSeek Chat (32K), Yi-34B (200K), DeepSeek Coder (16K)

**场景适配**：
- 卷/系列规划：Claude 3 Opus, Yi-34B（超长上下文）
- 大纲规划：Claude 3 Sonnet, 通义千问 Max（长上下文、中文理解）
- 章节规划：Claude 3 Sonnet, GPT-4 Turbo（连贯性好）
- 剧情设计：Claude 3 Opus, GPT-4（创意强）
- 人物设定：Claude 3 Sonnet, GPT-4（细节描述）
- 章节编写：Claude 3 Opus, GPT-4 Turbo（长文本生成）
- 内容润色：GPT-4, Claude 3 Sonnet（语言优美）
- 对话生成：GPT-3.5 Turbo, Claude 3 Haiku（自然流畅）
- 场景描写：Claude 3 Sonnet, GPT-4（画面感强）
- 情节转折：Claude 3 Opus, GPT-4（创意新颖）
- 伏笔埋设：Claude 3 Opus, Yi-34B（长远规划）
- 结局设计：Claude 3 Opus, GPT-4（情感深度）

---

## 七、开发计划

### 阶段一：数据库设计与后端API（预计2天）
1. ⏳ 设计数据库表结构
2. ⏳ 创建数据库迁移脚本
3. ⏳ 实现平台预设模型CRUD API
4. ⏳ 实现用户模型配置CRUD API
5. ⏳ 实现智能体CRUD API
6. ⏳ 实现用户智能体设置API
7. ⏳ 实现智能体调用API
8. ⏳ 实现模型配置测试接口
9. ⏳ 实现调用日志记录
10. ⏳ 添加权限控制

### 阶段二：管理端前端开发（预计2天）
1. ⏳ 平台模型预设管理页面
2. ⏳ 智能体管理页面
3. ⏳ 用户模型配置查看页面
4. ⏳ 调用日志页面
5. ⏳ 菜单权限配置

### 阶段三：用户端前端开发（预计2天）
1. ⏳ 我的模型配置页面
2. ⏳ 智能体列表页面
3. ⏳ 智能体使用页面（对话界面）
4. ⏳ 调用日志页面

### 阶段四：集成测试与优化（预计1天）
1. ⏳ 功能测试
2. ⏳ 性能测试
3. ⏳ 安全测试
4. ⏳ 用户体验优化

---

## 八、相关文档
- [RBAC设计文档](./RBAC-Design.md)
- [开发待办事项](./TODO.md)
