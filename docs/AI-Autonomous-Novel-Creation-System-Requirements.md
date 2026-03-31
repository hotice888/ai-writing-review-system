# AI自主长篇小说创作管理系统需求

## 一、系统概述与目标

### 1.1 系统定位

一套让大模型自主完成长篇小说从规划、设计、编写、评审到优化全流程的管理系统。用户仅作为"发起者"在关键节点提供参考意见，系统通过多智能体协作实现阶段性自主推进，最终产出高质量长篇小说。

### 1.2 核心目标

- 支持百万字级长篇（200万字，700章左右）
- 题材聚焦玄幻修仙重生，兼容其他类型
- 输出文风优美、幽默、爽点密集、有伏笔有感情的作品
- 提供全程可视化跟踪与管理
- 成本控制在千元级别（API费用）

### 1.3 核心价值

- **效率**：数天完成百万字初稿，极大缩短创作周期
- **质量**：多轮评审确保逻辑、伏笔、文风一致性
- **成本**：API费用约1000~2000元，远低于人工稿酬
- **可复用**：系统可反复用于多部作品

---

## 二、系统架构与多智能体协作

### 2.1 总体架构

系统采用多智能体（Multi-Agent）架构，每个智能体负责特定创作环节，通过一个中心调度器管理流程、状态和用户交互。

```
用户（发起者）
    ↓（提供初始创意/参考意见）
中心调度器（Orchestrator）
    ↓（调度）
┌───────────────────────────────────────────────────┐
│ 规划智能体 │ 编写智能体 │ 评审智能体群 │ 优化智能体 │ 摘要智能体 │
└───────────────────────────────────────────────────┘
    ↓（持久化）
结构化知识库（SQLite + JSON文件 + Git版本控制）
```

### 2.2 智能体职责

| 智能体 | 核心职责 |
|---------|---------|
| 规划智能体 | 生成、迭代、管理所有设定与结构（世界观、人物、等级、卷章大纲、伏笔表、成长路线等） |
| 编写智能体 | 按锁定的规划逐章生成正文，融入爽点、笑点、激情等要素 |
| 评审智能体群 | 多角色（逻辑、文风、剧情、读者、复杂度、成长体系）对章节进行评分和问题定位 |
| 优化智能体 | 根据评审意见修改章节，支持局部重写和联动回溯 |
| 摘要智能体 | 为每章生成简洁摘要，供后续上下文使用 |
| 中心调度器 | 状态机控制流程，组织智能体输入/输出，数据库读写，用户交互 |

### 2.3 多智能体协作流程（含迭代）

```
1. 用户输入种子设定 → 规划智能体生成初始设定
2. 评审智能体群对规划进行初步评审 → 规划智能体自动修改
3. 用户确认规划 → 规划锁定
4. 中心调度器循环：
   - 编写智能体按规划生成章节正文
   - 评审智能体群打分（逻辑、文风、剧情、读者、复杂度、成长）
   - 若所有评分≥阈值 → 保存正文，生成摘要，进入下一章
   - 否则调用优化智能体修改，最多重试3次
   - 若3次仍不通过，且问题根源在规划 → 触发规划回溯
5. 每10章、每卷结束、发现重大问题等节点，调度器暂停，向用户报告，等待指令
6. 全部章节完成后，生成整体报告
```

---

## 三、数据表结构（SQLite）

### 3.1 项目与核心设定

```sql
-- 项目总表
CREATE TABLE projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT,
    target_words INTEGER,
    current_chapter INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'planning'
);

-- 设定表（世界观、势力、历史、地图等）
CREATE TABLE settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    category TEXT NOT NULL,   -- world, factions, history, map, style
    name TEXT,
    content JSON,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.2 人物与关系

```sql
CREATE TABLE characters (
    character_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,   -- protagonist, antagonist, supporting
    description TEXT,
    attributes JSON,        -- 境界、技能、外貌等
    relationships JSON,     -- 关系矩阵 [{target, type, value}]
    arc_plan JSON,          -- 每卷人物弧光
    current_realm TEXT,
    current_location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.3 卷与章节规划

```sql
CREATE TABLE volumes (
    volume_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    volume_number INTEGER,
    title TEXT,
    summary TEXT,
    start_chapter INTEGER,
    end_chapter INTEGER,
    core_events JSON,
    character_arcs JSON,
    foreshadowing_in JSON,
    foreshadowing_out JSON,
    status TEXT DEFAULT 'planned',
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE chapter_plans (
    plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    volume_id INTEGER NOT NULL,
    chapter_number INTEGER,
    title TEXT,
    word_count_target INTEGER,
    summary TEXT,
    scene_list JSON,               -- 场景列表
    required_beats JSON,           -- 爽点、笑点、情感点等
    foreshadowing_new JSON,
    foreshadowing_progress JSON,
    lines_involved JSON,           -- 涉及的故事线
    fun_points JSON,               -- 爽点具体设计
    humor_points JSON,             -- 幽默点具体设计
    excitement_points JSON,        -- 激情点具体设计
    status TEXT DEFAULT 'planned',
    FOREIGN KEY (volume_id) REFERENCES volumes(volume_id)
);
```

### 3.4 章节内容（版本控制）

```sql
CREATE TABLE chapter_contents (
    content_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    version INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    word_count INTEGER,
    review_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT 1,
    FOREIGN KEY (plan_id) REFERENCES chapter_plans(plan_id)
);
```

### 3.5 摘要存储

```sql
CREATE TABLE chapter_summaries (
    summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_number INTEGER NOT NULL,
    summary TEXT NOT NULL,
    key_events JSON,
    characters_changed JSON,
    foreshadowing_planted JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volume_summaries (
    summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
    volume_id INTEGER NOT NULL,
    summary TEXT,
    key_events JSON,
    FOREIGN KEY (volume_id) REFERENCES volumes(volume_id)
);
```

### 3.6 伏笔表

```sql
CREATE TABLE foreshadowings (
    foreshadowing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    description TEXT,
    planted_chapter INTEGER,
    planned_reveal_chapter INTEGER,
    actual_reveal_chapter INTEGER,
    status TEXT DEFAULT 'planted', -- planted, revealed, abandoned
    importance INTEGER DEFAULT 5,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.7 故事线表

```sql
CREATE TABLE storylines (
    storyline_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    description TEXT,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.8 成长体系表

```sql
-- 境界体系
CREATE TABLE realms (
    realm_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    realm_name TEXT,
    stage INTEGER,
    description TEXT,
    breakthrough_items JSON,
    breakthrough_risk TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 法宝品级
CREATE TABLE equipment_grades (
    grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    grade_name TEXT,
    rank INTEGER,
    typical_realm TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 法宝详情
CREATE TABLE artifacts (
    artifact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    grade_id INTEGER,
    type TEXT,                    -- 武器、防具、饰品、特殊
    description TEXT,
    abilities JSON,               -- 能力列表
    requirements JSON,            -- 使用要求（境界、属性等）
    current_owner TEXT,           -- 当前持有者
    acquired_chapter INTEGER,     -- 获得章节
    upgrade_plan JSON,            -- 升级计划
    story_importance INTEGER DEFAULT 5,  -- 剧情重要性（1-10）
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (grade_id) REFERENCES equipment_grades(grade_id)
);

-- 丹药品级
CREATE TABLE pill_grades (
    pill_grade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    grade_name TEXT,
    rank INTEGER,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 丹药详情
CREATE TABLE pills (
    pill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    pill_grade_id INTEGER,
    effect TEXT,                  -- 功效描述
    ingredients JSON,             -- 配方材料
    required_alchemy_level TEXT,   -- 炼制要求
    market_price TEXT,             -- 市场价格
    rarity TEXT,                  -- 稀有度
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (pill_grade_id) REFERENCES pill_grades(pill_grade_id)
);

-- 货币体系
CREATE TABLE currencies (
    currency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,                    -- 灵石、金币、贡献点等
    base_unit TEXT,               -- 基本单位
    conversion_rates JSON,        -- 汇率
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 材料/天材地宝
CREATE TABLE materials (
    material_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    category TEXT,                -- 灵草、矿石、妖兽材料等
    rarity TEXT,                 -- 稀有度
    effect TEXT,                  -- 功效
    usage TEXT,                   -- 用途
    typical_value TEXT,           -- 典型价值
    acquisition_plan JSON,        -- 获取计划
    actual_acquired BOOLEAN DEFAULT 0,  -- 是否已获取
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 资源变动记录
CREATE TABLE resource_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    chapter INTEGER,
    character_name TEXT,
    resource_type TEXT,           -- artifact, pill, material, currency
    resource_id INTEGER,
    action TEXT,                  -- acquire, consume, trade, lose
    quantity INTEGER DEFAULT 1,
    details TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 技能表
CREATE TABLE skills (
    skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    description TEXT,
    realm_requirement TEXT,       -- 境界要求
    mastery_level INTEGER DEFAULT 0, -- 0-100 熟练度
    learned_chapter INTEGER,       -- 学习章节
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 人物技能关联表
CREATE TABLE character_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    mastery_level INTEGER DEFAULT 0,
    learned_chapter INTEGER,
    FOREIGN KEY (character_id) REFERENCES characters(character_id),
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);

-- 智能体调用记录表
CREATE TABLE agent_calls (
    call_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    agent_type TEXT NOT NULL, -- planning, writing, review, optimization, summary
    agent_name TEXT,          -- 具体智能体名称（如LogicReviewer）
    chapter_number INTEGER,
    input_text TEXT,          -- 智能体输入（JSON格式）
    output_text TEXT,         -- 智能体输出（JSON格式）
    tokens_used INTEGER,
    cost REAL,
    model_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 章节摘要表
CREATE TABLE chapter_summaries (
    summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    summary TEXT,                   -- 章节摘要
    key_points JSON,                -- 关键信息（人物、事件、宝物等）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);

-- 评审记录表
CREATE TABLE reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    reviewer_type TEXT,           -- logic, style, plot, reader, complexity, growth
    score INTEGER,                -- 评分（1-10）
    issues JSON,                 -- 问题列表含位置和建议
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES chapter_contents(content_id)
);

-- 成长路线规划表
CREATE TABLE growth_paths (
    path_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    character_name TEXT,
    volume INTEGER,
    target_realm TEXT,           -- 目标境界
    key_skills JSON,             -- 关键技能
    key_equipment JSON,           -- 关键装备
    required_items JSON,          -- 必需物品
    storyline_event TEXT,         -- 剧情事件
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 优化记录表
CREATE TABLE optimization_records (
    optimization_id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    chapter_number INTEGER,
    iteration INTEGER,
    issues_addressed JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES chapter_contents(content_id)
);

-- 用户交互记录表
CREATE TABLE user_interactions (
    interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL, -- seed_input, planning_confirm, modification, backtrack, pause, resume
    content TEXT,
    chapter_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.9 系统配置表

```sql
-- 系统配置表
CREATE TABLE system_config (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 智能体配置表
CREATE TABLE agent_config (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT UNIQUE NOT NULL, -- planning, writing, review_logic, review_style, etc.
    model_config_id INTEGER,
    system_prompt TEXT,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    enabled BOOLEAN DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 四、智能体详细设计

### 4.1 规划智能体

#### 核心职责
- 生成初始世界观设定
- 创建人物档案和关系网络
- 设计成长体系（境界、技能、法宝）
- 规划卷章结构
- 管理伏笔埋设与回收计划
- 维护故事线进度

#### 输入输出
- **输入**：用户种子设定、评审反馈、上下文摘要
- **输出**：完整规划文档（JSON格式）

#### 工作流程
1. 分析用户种子设定
2. 生成世界观框架
3. 创建人物关系网络
4. 设计成长体系
5. 规划卷章结构
6. 生成伏笔计划
7. 输出规划JSON

### 4.2 编写智能体

#### 核心职责
- 按章节规划生成正文
- 融入爽点、笑点、激情点
- 保持文风一致性
- 遵循伏笔计划
- 维护人物性格一致性

#### 输入输出
- **输入**：章节规划、上下文摘要、人物状态、伏笔进度
- **输出**：章节正文（Markdown格式）

#### 工作流程
1. 读取章节规划
2. 获取上下文摘要
3. 查询人物当前状态
4. 查询伏笔进度
5. 生成场景大纲
6. 填充正文内容
7. 融入爽点设计
8. 融入幽默点设计
9. 融入激情点设计
10. 输出章节正文

### 4.3 评审智能体群

#### 4.3.1 逻辑评审智能体

**核心职责**：
- 检查剧情逻辑一致性
- 验证时间线合理性
- 检查因果关系
- 识别逻辑漏洞

**评审维度**：
- 时间线逻辑
- 因果关系
- 人物行为合理性
- 事件顺序

**输出格式**：
```json
{
  "score": 0.85,
  "issues": [
    {
      "type": "logic",
      "severity": "medium",
      "description": "第15章时间线矛盾",
      "suggestion": "调整事件顺序"
    }
  ]
}
```

#### 4.3.2 文风评审智能体

**核心职责**：
- 评估文风一致性
- 检查语言风格
- 评价描写质量
- 识别文风突变

**评审维度**：
- 语言风格统一性
- 描写生动性
- 对话自然度
- 节奏流畅度

#### 4.3.3 剧情评审智能体

**核心职责**：
- 评估剧情吸引力
- 检查爽点密度
- 评价悬念设置
- 识别剧情拖沓

**评审维度**：
- 爽点密度
- 悬念设置
- 情节推进速度
- 高潮设计

#### 4.3.4 读者评审智能体

**核心职责**：
- 模拟读者视角
- 评估代入感
- 检查情感共鸣
- 识别读者疲劳点

**评审维度**：
- 代入感强度
- 情感共鸣度
- 阅读流畅度
- 期待管理

#### 4.3.5 复杂度评审智能体

**核心职责**：
- 评估章节复杂度
- 检查信息密度
- 识别理解难度
- 建议简化方案

**评审维度**：
- 信息密度
- 概念复杂度
- 关系复杂度
- 理解难度

#### 4.3.6 成长体系评审智能体

**核心职责**：
- 检查成长合理性
- 验证能力平衡
- 识别战力崩坏
- 评估成长曲线

**评审维度**：
- 能力成长曲线
- 战力平衡性
- 成长合理性
- 体系完整性

### 4.4 优化智能体

#### 核心职责
- 根据评审意见修改章节
- 支持局部重写
- 实现联动回溯
- 保持文风一致性

#### 输入输出
- **输入**：章节正文、评审意见、修改指令
- **输出**：修改后的章节正文

#### 工作流程
1. 分析评审意见
2. 识别问题类型
3. 制定修改策略
4. 执行局部修改
5. 必要时触发联动回溯
6. 保持文风一致性
7. 输出修改后正文

### 4.5 摘要智能体

#### 核心职责
- 生成章节简洁摘要
- 提取关键事件
- 记录人物变化
- 标注伏笔埋设

#### 输入输出
- **输入**：章节正文、人物状态、伏笔进度
- **输出**：章节摘要（JSON格式）

#### 工作流程
1. 读取章节正文
2. 提取关键事件
3. 记录人物状态变化
4. 记录伏笔埋设
5. 生成简洁摘要
6. 输出摘要JSON

### 4.6 中心调度器

#### 核心职责
- 状态机控制流程
- 组织智能体输入输出
- 数据库读写管理
- 用户交互协调
- 错误处理与重试

#### 状态机设计

```
[规划阶段]
    ↓ 用户输入种子
    ↓ 规划智能体生成
    ↓ 评审智能体群评审
    ↓ 规划智能体修改
    ↓ 用户确认
[编写阶段]
    ↓ 编写智能体生成章节
    ↓ 评审智能体群评审
    ↓ 评分≥阈值？
    ├─ 是 → 保存，生成摘要，进入下一章
    └─ 否 → 优化智能体修改（最多3次）
              ↓ 3次仍不通过
              ↓ 问题根源在规划？
              ├─ 是 → 触发规划回溯
              └─ 否 → 报告用户，等待指令
[完成阶段]
    ↓ 生成整体报告
    ↓ 等待用户指令
```

---

## 五、提示词模板库

### 5.1 规划智能体：生成卷大纲

```
【系统指令】你是一位玄幻小说资深编辑，擅长按"卷"规划长篇故事。请根据以下项目信息，生成第一卷的详细大纲。

项目信息：
- 书名：{title}
- 题材：{genre}
- 总卷数：{total_volumes}
- 目标字数：{target_words}，第一卷约占{first_volume_ratio}%

第一卷核心要求：
- 主题：{volume_theme}
- 需包含元素：爽点密度、情感铺垫、伏笔埋设、人物登场
- 必须埋设的伏笔：{mandatory_foreshadowing}

请输出JSON格式，包含：
{
  "volume_title": "",
  "summary": "",
  "start_chapter": 1,
  "end_chapter": 30,
  "core_events": ["事件1", "事件2", ...],
  "character_arcs": {"角色名": "弧光描述"},
  "foreshadowing_in": ["伏笔1", "伏笔2"],
  "foreshadowing_out": ["本卷回收的伏笔"],
  "chapter_plans": [
    {
      "chapter_number": 1,
      "title": "",
      "summary": "",
      "scene_list": [{"location": "", "characters": [], "event": "", "emotional_tone": ""}],
      "required_beats": ["爽点", "笑点", "情感点", "伏笔"],
      "foreshadowing_new": [],
      "foreshadowing_progress": [],
      "lines_involved": ["主线"]
    }
  ]
}
```

### 5.2 编写智能体：生成章节正文

```
【系统指令】你是顶级网文作家，擅长玄幻爽文。请严格按照以下章节规划，创作正文。

【章节规划】
{chapter_plan_json}

【风格要求】
- 语言优美但简洁，多用短句，避免拖沓。
- 每500字内必须出现一个小爽点，每800字释放一个爽点。
- 每章至少一个笑点（反差萌、吐槽、情景喜剧）。
- 激情场面用短句、排比、内心独白增强感染力。
- 本章结尾必须留下强烈悬念。
- 对话要体现角色性格，增加幽默互动。
- 融入情感点：亲情、友情、爱情、仇恨等均可。

【人物状态】
{characters_status}

【未回收伏笔】
{foreshadowing_list}

【前文摘要】
{previous_summaries}

【最近三章全文】
{recent_chapters}

请直接输出章节正文，字数约{target_words}字。
```

### 5.3 评审智能体：读者模拟

```
【系统指令】你是一位资深网络小说读者，每天阅读大量玄幻小说。请以真实读者的身份，评价下面这一章。

【章节正文】
{chapter_content}

请回答以下问题（用1~10分评分，并给出理由）：
1. 开头是否吸引我继续读？（开头吸引力）
2. 本章有没有让我"爽"到？（爽点密度）
3. 有没有让我笑出来？（幽默感）
4. 人物有没有让我喜欢或讨厌？（人物魅力）
5. 结尾是否让我想看下一章？（悬念钩子）
6. 整体我会推荐给别人看吗？（推荐度）

最后用一句话总结你的真实感受。

输出JSON格式：
{
  "opening_score": 8,
  "fun_score": 7,
  "humor_score": 6,
  "character_score": 9,
  "hook_score": 8,
  "recommend_score": 7,
  "summary": "爽点还行，但开头铺垫过长，希望加快节奏。"
}
```

### 5.4 优化智能体：针对性修改

```
【系统指令】你是资深编辑，需要根据以下评审意见修改本章。

【原章节】
{original_chapter}

【评审意见】
{review_json}

请针对以下问题进行修改：
{list_of_issues}

特别要求：
- 如果"开头吸引力"<7，请重写前500字，直接进入冲突或悬念。
- 如果"爽点密度"<7，请插入一个打脸或获得机缘的桥段。
- 如果"幽默感"<6，请增加一段主角与配角的搞笑对话。
- 如果"悬念钩子"<7，请改写最后一段，制造更强悬念。

输出修改后的完整章节。
```

### 5.5 摘要智能体：生成章节摘要

```
【系统指令】你是一位资深编辑，请为以下玄幻小说章节生成简洁摘要。

【章节号】{chapter_number}
【标题】{title}
【核心事件（来自规划）】{core_events}
【正文】{content}

要求：
- 摘要控制在200字以内。
- 包含：主要情节、人物状态变化、埋下的伏笔、本章爽点/笑点。
- 输出纯文本，不添加额外说明。
```

### 5.6 规划智能体：根据用户反馈调整规划

```
【系统指令】你是资深编辑，需要根据用户的反馈调整后续的章节规划。

【当前规划】
{current_plan_json}

【用户反馈】
{user_feedback}

【已完成章节摘要】
{completed_chapters_summary}

请分析用户反馈，调整后续章节规划，输出JSON格式：
{
  "adjusted_plan": {
    "volume_title": "",
    "summary": "",
    "start_chapter": 1,
    "end_chapter": 30,
    "core_events": ["调整后的事件"],
    "character_arcs": {"角色名": "调整后的弧光描述"},
    "foreshadowing_in": ["需要埋设的伏笔"],
    "foreshadowing_out": ["本卷回收的伏笔"],
    "chapter_plans": [
      {
        "chapter_number": 1,
        "title": "",
        "summary": "",
        "scene_list": [{"location": "", "characters": [], "event": "", "emotional_tone": ""}],
        "required_beats": ["爽点", "笑点", "情感点", "伏笔"],
        "foreshadowing_new": [],
        "foreshadowing_progress": [],
        "lines_involved": ["主线"]
      }
    ]
  },
  "adjustment_notes": "说明调整的原因和重点"
}
```

---

## 六、上下文管理与智能体输入输出

### 6.1 上下文传递策略

由于大模型API无状态，每次调用必须显式传入相关历史信息。系统采用以下策略：

| 智能体 | 上下文内容 | 获取方式 |
|---------|-----------|---------|
| 规划智能体 | 用户种子设定、用户反馈、评审报告、历史规划版本 | 数据库 + 用户输入 |
| 编写智能体 | 当前章规划、人物状态表、伏笔状态表、最近3章全文、更早章节摘要、时间线快照 | 数据库查询 + 滑动窗口 + 向量检索（可选） |
| 评审智能体 | 当前章正文 + 人物/伏笔/时间线状态 + 相关前文片段（可选） | 数据库查询 + 向量检索 |
| 优化智能体 | 原章节正文 + 评审报告 + 相关规划 + 人物/伏笔状态 | 数据库查询 |
| 摘要智能体 | 章节全文 + 元数据 | 数据库查询 |

### 6.2 编写智能体的上下文组织示例

```json
{
  "plan": {
    "chapter_number": 15,
    "title": "剑冢试炼",
    "required_beats": [
      {"type": "爽点", "description": "击败守剑灵兽，获得灵器"},
      {"type": "笑点", "description": "守剑灵兽吐槽主角像它以前的主人"},
      {"type": "情感点", "description": "想起前世为保护师妹而死，决心变强"}
    ],
    "foreshadowing_new": ["青冥剑中隐藏剑灵"]
  },
  "characters": {
    "林逸": {"realm": "炼气巅峰", "location": "天剑宗", "equipment": "普通铁剑"},
    "苏瑶": {"realm": "筑基中期", "location": "天剑宗", "relationship": "对林逸有好感"}
  },
  "foreshadowings": [
    {"name": "神秘黑手", "description": "主角前世被暗算的幕后黑手", "status": "planted", "planned_reveal": 50},
    {"name": "天剑宗内奸", "description": "宗门内有人勾结魔道", "status": "planted", "planned_reveal": 30}
  ],
  "recent_chapters": ["第13章全文...", "第14章全文..."],
  "summaries": ["第1-12章摘要：林逸重生，化解家族危机，通过天剑宗考核..."]
}
```

### 6.3 摘要智能体工作流程

1. **触发时机**：每章编写完成并存储后，调度器调用摘要智能体。
2. **输入**：章节全文、章节号、标题、核心事件（从规划获取）。
3. **输出**：200字以内的文本摘要。
4. **存储**：存入chapter_summaries表。
5. **卷摘要生成**：每卷完成后，系统可将该卷所有章节摘要拼接，再调用摘要智能体生成卷摘要，存入volume_summaries。

### 6.4 各智能体输入输出参数

| 智能体 | 输入（调度器组织） | 输出（调度器解析） |
|---------|------------------|------------------|
| 规划智能体 | 用户种子设定 / 用户反馈 / 评审报告 / 历史规划版本 | 结构化JSON（世界观、人物、等级、卷章大纲等） |
| 编写智能体 | 上下文对象（含规划、人物状态、伏笔状态、前文） | 章节正文（字符串） |
| 评审智能体 | 当前章正文 + 结构化状态 | 评审报告JSON（含各维度评分、问题列表） |
| 优化智能体 | 原章节正文 + 评审报告 + 相关规划 | 优化后的章节正文（字符串） |
| 摘要智能体 | 章节全文 + 元数据 | 200字摘要（字符串） |

---

## 七、中心调度器的职责与实现

### 7.1 调度器核心职责

- **状态管理**：维护全局状态机（规划中、编写中、评审中…）。
- **数据编排**：根据当前状态和要调用的智能体，从数据库查询必要数据，组装成智能体的输入参数。
- **智能体调用**：将输入传递给智能体，并接收输出结果。
- **结果持久化**：解析智能体输出，将结果写入相应数据库表，并更新项目状态。
- **用户交互**：在关键节点暂停，等待用户反馈。

### 7.2 调度器状态机

| 状态 | 描述 | 触发条件 |
|------|------|---------|
| INIT | 初始状态，等待用户输入种子设定 | 用户创建项目 |
| PLANNING | 规划生成中 | 用户确认种子设定后 |
| PLANNING_REVIEW | 规划生成完成，等待用户确认 | 规划智能体完成初版 |
| PLANNING_REVISION | 根据用户反馈修改规划 | 用户提出修改意见 |
| PLANNING_LOCKED | 规划已锁定，进入编写 | 用户确认规划 |
| WRITING | 编写一章 | 调度器按序触发 |
| REVIEW | 评审当前章节 | 编写完成 |
| OPTIMIZING | 优化当前章节 | 评审未通过 |
| PLANNING_BACKTRACK | 回溯调整后续规划 | 评审/优化发现规划问题 |
| VOLUME_COMPLETE | 一卷完成，等待用户审阅 | 卷内所有章完成 |
| PROJECT_COMPLETE | 全书完成 | 所有卷完成 |

### 7.3 调度器伪代码（Python）

```python
class Orchestrator:
    def __init__(self, project_id):
        self.project_id = project_id
        self.state = self.load_state()
        self.current_chapter = self.load_current_chapter()
        self.context_manager = ContextManager(project_id)  # 上下文管理器
        self.agent_recorder = AgentRecorder(project_id)  # 智能体输入输出记录器

    def run(self):
        while self.state != 'PROJECT_COMPLETE':
            if self.state == 'PLANNING':
                self.do_planning()
            elif self.state == 'PLANNING_REVIEW':
                self.pause_for_user("规划已生成，请确认或提出修改意见")
            elif self.state == 'PLANNING_REVISION':
                user_feedback = self.get_user_feedback()
                self.modify_plan(user_feedback)
            elif self.state == 'PLANNING_LOCKED':
                self.state = 'WRITING'
            elif self.state == 'WRITING':
                self.do_writing()
            elif self.state == 'REVIEW':
                self.do_review()
            elif self.state == 'OPTIMIZING':
                self.do_optimize()
            elif self.state == 'PLANNING_BACKTRACK':
                self.do_backtrack()
            elif self.state == 'VOLUME_COMPLETE':
                self.pause_for_user("一卷完成，请审阅")
            # 保存状态
            self.update_state()

    def do_planning(self):
        # 1. 获取用户初始创意
        initial_idea = self.get_user_initial_idea()
        # 2. 组织规划上下文
        context = self.context_manager.build_planner_context(initial_idea)
        # 3. 调用规划智能体
        planner = PlanningAgent()
        # 记录智能体输入
        self.agent_recorder.record_input('PlanningAgent', context)
        plan = planner.generate_plan(context)
        # 记录智能体输出
        self.agent_recorder.record_output('PlanningAgent', plan)
        # 4. 存储规划
        self.save_plan(plan)
        # 5. 更新状态
        self.state = 'PLANNING_REVIEW'
        self.update_state()

    def do_writing(self):
        # 1. 获取当前章规划
        plan = self.get_chapter_plan(self.current_chapter)
        # 2. 组织上下文
        context = self.context_manager.build_writer_context(plan, self.current_chapter)
        # 3. 调用编写智能体
        writer = WritingAgent()
        # 记录智能体输入
        self.agent_recorder.record_input('WritingAgent', context)
        content = writer.run(context)
        # 记录智能体输出
        self.agent_recorder.record_output('WritingAgent', content)
        # 4. 存储章节内容
        content_id = self.save_chapter_content(plan['plan_id'], content)
        # 5. 生成摘要（异步）
        self.queue_summary_task(content_id, content, plan)
        # 6. 更新资源变动（如获得装备）
        self.update_resources_from_content(content, self.current_chapter)
        # 7. 更新状态
        self.state = 'REVIEW'
        self.update_state()

    def do_review(self):
        # 1. 获取当前章内容
        content = self.get_current_chapter_content()
        # 2. 获取人物/伏笔状态
        characters = self.get_characters_status()
        foreshadowings = self.get_foreshadowings()
        # 3. 组织评审上下文
        context = self.context_manager.build_review_context(content, characters, foreshadowings)
        # 4. 调用评审智能体群
        reviewers = [LogicReviewer(), StyleReviewer(), PlotReviewer(), ReaderSimulator()]
        reviews = []
        for reviewer in reviewers:
            # 记录智能体输入
            self.agent_recorder.record_input(reviewer.__class__.__name__, context)
            review = reviewer.review(content, characters, foreshadowings)
            # 记录智能体输出
            self.agent_recorder.record_output(reviewer.__class__.__name__, review)
            reviews.append(review)
        # 5. 存储评审记录
        self.save_reviews(reviews)
        # 6. 判断是否通过
        if all(r['score'] >= 7 for r in reviews):
            self.state = 'WRITING'
            self.current_chapter += 1
        else:
            self.state = 'OPTIMIZING'
        self.update_state()

    def do_optimize(self):
        # 1. 获取当前章内容及评审意见
        content = self.get_current_chapter_content()
        reviews = self.get_last_reviews()
        # 2. 组织优化上下文
        context = self.context_manager.build_optimizer_context(content, reviews)
        # 3. 调用优化智能体
        optimizer = OptimizationAgent()
        # 记录智能体输入
        self.agent_recorder.record_input('OptimizationAgent', context)
        new_content = optimizer.optimize(content, reviews)
        # 记录智能体输出
        self.agent_recorder.record_output('OptimizationAgent', new_content)
        # 4. 存储新版本
        self.save_chapter_version(new_content)
        # 5. 检查优化次数，若超过3次则触发回溯
        if self.get_optimize_count() >= 3:
            self.state = 'PLANNING_BACKTRACK'
        else:
            self.state = 'REVIEW'
        self.update_state()

    def do_backtrack(self):
        # 1. 收集问题描述
        issues = self.collect_backtrack_issues()
        # 2. 组织回溯上下文
        context = self.context_manager.build_backtrack_context(issues, self.current_chapter)
        # 3. 调用规划智能体调整后续章节规划
        planner = PlanningAgent()
        # 记录智能体输入
        self.agent_recorder.record_input('PlanningAgent', context)
        new_plan = planner.backtrack_plan(self.project_id, issues, self.current_chapter)
        # 记录智能体输出
        self.agent_recorder.record_output('PlanningAgent', new_plan)
        # 4. 存储新规划（新版本）
        self.save_new_plan_version(new_plan)
        # 5. 等待用户确认
        self.state = 'PLANNING_REVIEW'
        self.update_state()

    # 用户交互方法
    def handle_user_request(self, request_type, request_data):
        """处理用户的各种请求"""
        if request_type == 'UPDATE_VOLUME_SETTING':
            # 完善某卷的设定
            volume_id = request_data['volume_id']
            new_settings = request_data['settings']
            self.update_volume_settings(volume_id, new_settings)
            self.state = 'PLANNING_REVISION'
        elif request_type == 'UPDATE_OUTLINE':
            # 完善大纲
            outline_id = request_data['outline_id']
            new_outline = request_data['outline']
            self.update_outline(outline_id, new_outline)
            self.state = 'PLANNING_REVISION'
        elif request_type == 'REDESIGN_CHAPTER':
            # 重新设计章节的剧情
            chapter_id = request_data['chapter_id']
            new_plot = request_data['plot']
            self.redesign_chapter(chapter_id, new_plot)
            self.state = 'WRITING'
        elif request_type == 'START_WRITING':
            # 开始编写第几章
            chapter_number = request_data['chapter_number']
            self.current_chapter = chapter_number
            self.state = 'WRITING'
        # 保存状态
        self.update_state()

    # 上下文管理相关方法
    def build_context_for_agent(self, agent_type, data):
        """为不同智能体构建上下文"""
        return self.context_manager.build_context(agent_type, data)

    # 智能体记录相关方法
    def record_agent_interaction(self, agent_name, input_data, output_data):
        """记录智能体的输入输出"""
        self.agent_recorder.record_interaction(agent_name, input_data, output_data)

# 上下文管理器
class ContextManager:
    def __init__(self, project_id):
        self.project_id = project_id
        self.summary_store = SummaryStore(project_id)  # 摘要存储
        self.vector_store = VectorStore(project_id)  # 向量存储用于检索

    def build_planner_context(self, initial_idea):
        """构建规划智能体的上下文"""
        # 1. 获取项目基本信息
        project_info = self.get_project_info()
        # 2. 获取参考小说要素
        reference_elements = self.get_reference_elements()
        # 3. 构建上下文
        context = {
            'initial_idea': initial_idea,
            'project_info': project_info,
            'reference_elements': reference_elements,
            'timestamp': self.get_timestamp()
        }
        return context

    def build_writer_context(self, chapter_plan, chapter_number):
        """构建编写智能体的上下文"""
        # 1. 获取前章内容摘要
        previous_summaries = self.summary_store.get_previous_chapter_summaries(chapter_number, limit=5)
        # 2. 获取当前章规划
        # 3. 获取人物状态
        character_status = self.get_character_status()
        # 4. 获取伏笔信息
        foreshadowings = self.get_foreshadowings()
        # 5. 获取风格参考
        style_reference = self.get_style_reference()
        # 6. 构建上下文
        context = {
            'chapter_plan': chapter_plan,
            'previous_summaries': previous_summaries,
            'character_status': character_status,
            'foreshadowings': foreshadowings,
            'style_reference': style_reference,
            'chapter_number': chapter_number,
            'timestamp': self.get_timestamp()
        }
        return context

    def build_review_context(self, content, characters, foreshadowings):
        """构建评审智能体的上下文"""
        context = {
            'content': content,
            'characters': characters,
            'foreshadowings': foreshadowings,
            'evaluation_criteria': self.get_evaluation_criteria(),
            'timestamp': self.get_timestamp()
        }
        return context

    def build_optimizer_context(self, content, reviews):
        """构建优化智能体的上下文"""
        context = {
            'content': content,
            'reviews': reviews,
            'optimization_guidelines': self.get_optimization_guidelines(),
            'timestamp': self.get_timestamp()
        }
        return context

    def build_backtrack_context(self, issues, current_chapter):
        """构建回溯规划的上下文"""
        # 1. 获取当前规划
        current_plan = self.get_current_plan()
        # 2. 获取已完成章节的摘要
        completed_summaries = self.summary_store.get_completed_chapter_summaries(current_chapter)
        # 3. 构建上下文
        context = {
            'issues': issues,
            'current_plan': current_plan,
            'completed_summaries': completed_summaries,
            'current_chapter': current_chapter,
            'timestamp': self.get_timestamp()
        }
        return context

# 智能体记录器
class AgentRecorder:
    def __init__(self, project_id):
        self.project_id = project_id
        self.db = DatabaseConnection()

    def record_input(self, agent_name, input_data):
        """记录智能体的输入"""
        self.db.insert_agent_interaction(
            project_id=self.project_id,
            agent_name=agent_name,
            interaction_type='input',
            content=input_data,
            timestamp=self.get_timestamp()
        )

    def record_output(self, agent_name, output_data):
        """记录智能体的输出"""
        self.db.insert_agent_interaction(
            project_id=self.project_id,
            agent_name=agent_name,
            interaction_type='output',
            content=output_data,
            timestamp=self.get_timestamp()
        )

    def record_interaction(self, agent_name, input_data, output_data):
        """记录完整的智能体交互"""
        self.record_input(agent_name, input_data)
        self.record_output(agent_name, output_data)
```

---

## 八、评审评分系统

### 8.1 评分阈值设计

| 维度 | 权重 | 阈值 | 说明 |
|------|------|------|------|
| 逻辑 | 0.25 | 0.80 | 逻辑必须严密 |
| 文风 | 0.20 | 0.75 | 文风需要一致 |
| 剧情 | 0.25 | 0.80 | 剧情需要吸引人 |
| 读者 | 0.15 | 0.70 | 代入感要强 |
| 复杂度 | 0.10 | 0.60 | 不能过于复杂 |
| 成长体系 | 0.05 | 0.75 | 成长要合理 |

**综合评分** = Σ(维度评分 × 权重)

**通过标准**：综合评分 ≥ 0.75

### 8.2 评分反馈格式

```json
{
  "chapter": 15,
  "overall_score": 0.82,
  "dimensions": {
    "logic": 0.85,
    "style": 0.78,
    "plot": 0.83,
    "reader": 0.76,
    "complexity": 0.68,
    "growth": 0.80
  },
  "status": "passed",
  "issues": [
    {
      "dimension": "style",
      "type": "inconsistency",
      "severity": "low",
      "description": "第3段描写风格略有不同",
      "suggestion": "统一描写风格"
    }
  ]
}
```

---

## 九、成本控制与优化

### 9.1 API成本估算

| 环节 | 单次成本 | 次数 | 总成本 |
|------|---------|------|-------|
| 规划生成 | 0.5元 | 10次 | 5元 |
| 章节编写 | 1.0元 | 700次 | 700元 |
| 评审打分 | 0.3元 | 2100次 | 630元 |
| 优化修改 | 0.5元 | 700次 | 350元 |
| 摘要生成 | 0.1元 | 700次 | 70元 |
| **总计** | — | — | **1755元** |

### 9.2 成本优化策略

1. **缓存复用**：相同类型章节复用模板
2. **批量处理**：减少API调用次数
3. **智能降级**：简单章节使用小模型
4. **版本控制**：避免重复生成
5. **增量更新**：只修改有问题的部分

### 9.3 成本监控

- 实时记录每次API调用
- 按章节统计成本
- 按卷统计成本
- 总成本预警（超过2000元时提醒）

---

## 十、用户交互设计

### 10.1 关键节点交互

| 节点 | 用户操作 | 系统响应 |
|------|---------|---------|
| 项目初始化 | 提供种子设定 | 生成初始规划 |
| 规划确认 | 审查规划 | 锁定规划，开始编写 |
| 章节检查 | 查看章节内容 | 显示章节和评审结果 |
| 修改指令 | 提供修改意见 | 调用优化智能体 |
| 规划回溯 | 触发回溯 | 重新生成规划 |
| 暂停/继续 | 控制流程 | 暂停/恢复生成 |
| 整体报告 | 查看报告 | 显示完成统计 |

### 10.2 可视化界面需求

- **项目仪表板**：显示项目进度、成本统计
- **规划可视化**：卷章结构图、人物关系图、伏笔时间线
- **章节编辑器**：显示章节内容、评审结果、修改历史
- **统计报表**：字数统计、成本分析、质量趋势

---

## 十一、系统化需求总结

### 11.1 核心功能需求
- 多智能体协作架构
- 规划智能体
- 编写智能体
- 评审智能体群（6个维度）
- 优化智能体
- 摘要智能体
- 中心调度器

### 11.2 数据管理需求
- SQLite数据库设计
- 项目管理
- 设定管理
- 人物与关系管理
- 卷与章节规划管理
- 章节内容版本控制
- 摘要存储
- 伏笔管理
- 故事线管理
- 成长体系管理

### 11.3 评审系统需求
- 多维度评分系统
- 评分阈值设计
- 问题定位与建议
- 评分反馈格式

### 11.4 成本控制需求
- API成本估算
- 成本优化策略
- 成本监控与预警

### 11.5 用户交互需求
- 关键节点交互设计
- 可视化界面需求
- 项目仪表板
- 规划可视化
- 章节编辑器
- 统计报表

---

## 十二、与现有系统的结合

### 12.1 与模型设置系统的结合

- 使用模型设置系统配置的大模型
- 不同智能体使用不同模型配置
- 根据任务复杂度选择模型

### 12.2 与智能体管理系统的结合

- 使用智能体管理系统的智能体模板
- 平台维护基础智能体配置
- 用户可自定义智能体参数

### 12.3 与规划管理系统的结合

- 复用规划管理系统的表格和方法论
- 时间线规划、伏笔管理、人物状态等
- 技能装备管理

---

## 十三、相关文档

- [长篇小说规划与管理方法论](./Novel-Planning-Management-Requirements.md)
- [模型设置与智能体管理需求分析](./Model-Agent-Requirements.md)
- [RBAC设计文档](./RBAC-Design.md)
- [开发待办事项](./TODO.md)

---

## 十四、成本估算与性价比

以200万字、700章，采用混合模型（编写用Claude 3.5 Sonnet，评审优化用GPT-4o mini/GLM-4-Flash）为例：

| 环节 | 费用（美元） |
|------|------------|
| 规划（免费模型） | 0 |
| 编写（Claude） | 130 |
| 评审（混合） | 3.5 |
| 优化（混合） | 3 |
| 回溯修改 | 9 |
| 合计 | ≈145.5美元 ≈ 1050元人民币 |

若全部使用Claude，约280美元（2000元）。性价比远高于人工创作（稿费数万至数十万）。

---

## 十五、风险控制与质量保障

### 15.1 核心风险："写了没人看"

**应对措施**：
- **量化吸引力**：将爽点密度（每章≥2个）、笑点密度（每章≥1个）等作为硬性指标，嵌入规划与评审。
- **多维度评审**：引入"读者模拟"智能体，从真实读者角度评分。
- **节奏控制**：每章结尾强制悬念，每3章一个小高潮，每卷一个中高潮。
- **人工关键把控**：每卷结束后人工审阅，调整方向。

### 15.2 逻辑一致性风险

- **伏笔跟踪表**：自动检查伏笔埋设与回收，确保回收率>80%。
- **时间线检查**：记录关键事件章节，扫描矛盾点。
- **人物状态表**：维护每个角色的境界、位置、关系，避免前后矛盾。

### 15.3 技术风险

- **API调用失败**：重试机制 + 本地缓存。
- **上下文溢出**：采用滑动窗口+摘要压缩策略，确保每次输入不超过模型上下文限制。
- **模型随机性**：多次生成取最优，或人工介入关键章节。

---

## 十六、实施路线图

| 阶段 | 任务 | 周期 | 产出 |
|------|------|------|------|
| 1 | 搭建基础框架，实现规划智能体 | 2周 | 设定生成、用户交互界面 |
| 2 | 实现编写智能体，单章生成与自检 | 3周 | 章节正文生成，基础一致性 |
| 3 | 实现评审智能体群与优化模块 | 3周 | 多维度评审、自动修改闭环 |
| 4 | 实现摘要智能体与上下文管理 | 1周 | 摘要生成、滑动窗口机制 |
| 5 | 集成跟踪模块与可视化看板 | 2周 | 伏笔表、进度图、人物关系网 |
| 6 | 端到端测试（生成前3卷） | 1周 | 完整测试报告，调优参数 |
| 7 | 正式生成200万字小说 | 持续 | 完成全书，人工润色 |

---

## 十七、总结

本系统通过多智能体协作、结构化数据管理、量化质量指标和精细的上下文控制，使AI能够稳定产出百万字级别的长篇小说，且成本极低。用户在关键节点把控方向，即可获得一部逻辑严密、爽点密集、富有幽默与情感的作品，极大提升创作效率。系统设计兼顾了自主性、可控性和可扩展性，可作为个人创作者或小型工作室的高效创作工具。

---

## 十八、借鉴与融合其他小说思路的方案设计

在长篇玄幻修仙小说的创作中，借鉴经典作品的优秀设定、文风、结构，并进行创造性融合，是提升作品质量的有效手段。本系统设计一套小说分析与要素提取模块，以及融合生成机制，使AI能够从已有作品中学习，并将其精华融入当前创作。

### 18.1 小说分析维度

系统需要从多个维度对参考小说进行结构化归纳，形成可复用的知识库。以下是核心分析维度：

| 维度 | 子项 | 说明 |
|------|------|------|
| 世界观 | 世界层级、力量体系、势力格局、历史背景 | 如"凡界→修真界→仙界"三层结构 |
| 力量体系 | 境界名称、突破条件、寿命、能力特征 | 如"炼气→筑基→金丹→元婴…" |
| 法宝体系 | 法宝类型、品级、功能、获取方式、升级路径 | 如"本命飞剑、空间法宝、攻击法宝" |
| 功法体系 | 功法类型、修炼方式、特殊效果、副作用 | 如"剑修功法、炼丹术、体修功法" |
| 丹药体系 | 丹药类型、品级、效果、材料、炼制难度 | 如"筑基丹、破障丹、疗伤丹" |
| 货币体系 | 货币种类、兑换比例、购买力 | 如"灵石、仙玉、贡献点" |
| 人物设定 | 主角性格、成长弧光、配角类型、反派动机 | 如"废柴逆袭、天才陨落、腹黑主角" |
| 剧情结构 | 故事节奏、高潮分布、伏笔密度、爽点类型 | 如"每三章一个小高潮，每卷一个中高潮" |
| 文风特征 | 语言风格、句式特点、幽默手法、情感表达 | 如"多用短句、吐槽式幽默、打斗描写细腻" |
| 常见套路 | 经典桥段、反转模式、爽点套路 | 如"打脸装逼、越级反杀、秘境夺宝" |

### 18.2 小说分析方法

系统采用人工标注 + AI辅助提取相结合的方式，构建参考小说知识库。

#### 18.2.1 数据准备

收集经典玄幻小说（如《斗破苍穹》《凡人修仙传》《遮天》等）的全文或关键章节，作为分析样本。

#### 18.2.2 AI辅助提取（使用大模型）

对每部小说，调用分析智能体进行结构化提取。提示词模板如下：

```plaintext
你是一位专业的小说分析师，请对以下小说进行系统性分析，输出JSON格式。

小说名称：{title}
小说正文（或节选）：{content}

请按以下维度输出：
{
  "worldview": {
    "levels": ["凡界", "修真界", ...],
    "power_system": [{"realm": "炼气", "features": "..."}],
    "factions": [{"name": "...", "description": "..."}]
  },
  "artifacts": [
    {"name": "玄重尺", "type": "武器", "grade": "灵器", "function": "压制修为锻炼肉体", "acquisition": "拍卖会"}
  ],
  "skills": [
    {"name": "八极崩", "type": "武技", "level_system": ["入门", "大成", "圆满"], "effect": "暗劲叠加"}
  ],
  "pills": [
    {"name": "筑基丹", "grade": "三品", "effect": "提升筑基成功率"}
  ],
  "characters": {
    "protagonist": {"name": "萧炎", "personality": "坚韧、腹黑", "arc": "从废柴到强者"},
    "supporting": [...]
  },
  "plot_structure": {
    "volume_count": 5,
    "climax_distribution": "每卷末尾有大高潮",
    "fun_point_types": ["打脸", "越级反杀", "获得奇遇"]
  },
  "writing_style": {
    "sentence_length": "短句为主",
    "humor_techniques": ["吐槽", "反差萌"],
    "emotion_expression": "内敛深沉"
  }
}
```

分析结果存入数据库的reference_novels表。

#### 18.2.3 人工标注补充

对于AI难以捕捉的微妙特征（如"爽点节奏"），可由人工在分析结果中添加标签。

### 18.3 融合与借鉴机制

将提取的要素作为参考模板，在规划智能体生成新设定时，进行组合、变体和创新。

#### 18.3.1 数据表设计

```sql
-- 参考小说库
CREATE TABLE reference_novels (
    novel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    analysis JSON,           -- 完整分析结果
    tags TEXT               -- 标签，如"玄幻""废柴流"
);

-- 要素库（可选，将分析结果拆解为独立表便于检索）
CREATE TABLE reference_artifacts (
    artifact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER,
    name TEXT,
    type TEXT,
    grade TEXT,
    function TEXT,
    acquisition TEXT,
    FOREIGN KEY (novel_id) REFERENCES reference_novels(novel_id)
);

-- 类似可建 reference_skills, reference_pills 等
```

#### 18.3.2 融合生成策略

在规划智能体生成设定时，系统从参考库中检索相似要素，并提示模型进行融合。

示例：生成法宝时，提示词中加入：

```plaintext
【参考法宝】
1. 玄重尺（灵器）：可压制修为锻炼肉体，通过拍卖会获得。
2. 青莲地心火（异火）：天地灵火，可炼化万物，主角在秘境中获得。

请为当前小说创造一个新法宝，可以融合以上法宝的特点，但要有新意。
要求：品级、功能、获取方式、与主角的绑定关系。
```

模型输出融合后的新法宝，例如：

```json
{
  "name": "玄冰寒铁尺",
  "grade": "灵器",
  "function": "压制修为的同时附加冰冻效果，适合主角越级战斗",
  "acquisition": "在秘境中击败守护兽后获得",
  "bond": "滴血认主"
}
```

#### 18.3.3 文风借鉴

编写智能体可参考分析出的文风特征，通过风格指令控制输出。例如，在编写智能体的提示词中加入：

```plaintext
【参考文风】参考小说《斗破苍穹》风格：多用短句，节奏明快，打斗描写注重细节和力量对比，幽默主要体现在主角内心吐槽和配角反差萌。

请采用类似风格写作本章。
```

系统会提取参考小说的风格向量（如句式长度、幽默频率、情感强度），并将其转化为具体指令。

#### 18.3.4 套路融合

对于剧情结构，系统可以学习经典小说的"套路"模式，并在规划中应用。例如：

- **打脸套路**：先描写对手嚣张（200字），主角隐忍（100字），然后瞬间爆发（150字），对手震惊（50字）。
- **奇遇套路**：主角在险境中意外发现遗迹，经历考验获得宝物，同时埋下伏笔。

这些套路被存储为剧情模板，规划智能体可根据需要调用并调整。

### 18.4 实现流程

1. **构建参考库**：选择若干经典小说，使用AI分析并人工审核，存入数据库。
2. **融合生成**：在规划阶段，规划智能体根据用户需求，从参考库中检索相关要素（如"需要一种攻击型法宝"），获得参考列表。
3. **提示词增强**：在生成提示词中注入参考要素，要求模型借鉴并创新。
4. **风格控制**：编写智能体时，将参考小说的文风特征转化为风格指令，动态调整写作风格。
5. **持续迭代**：系统可记录用户对生成结果的偏好（如"这个法宝太像XX小说，缺乏新意"），反馈给模型进行调优。

### 18.5 示例：融合生成一套法宝体系

用户需求：希望主角拥有一个可成长的本命法宝，类似于《凡人修仙传》的青竹蜂云剑，但要有新意。

系统检索参考库：
- 《凡人修仙传》青竹蜂云剑：可分裂、可组合、通过吞噬材料升级。
- 《斗破苍穹》玄重尺：压制修为锻炼肉体。
- 《遮天》万物母气鼎：可炼化万物，防御强大。

规划智能体提示词：

```plaintext
请为当前小说主角设计一个本命法宝。要求：
- 可成长，从凡器可升级到仙器。
- 具有独特功能，融合以上参考法宝的特点，但避免完全雷同。
- 升级方式与主角境界提升或关键剧情绑定。
```

输出：

```json
{
  "name": "九幽噬魂剑",
  "initial_grade": "法器",
  "max_grade": "神器",
  "functions": {
    "基础": "可分裂为九柄子剑，组成剑阵",
    "成长1": "吞噬妖兽魂魄可提升品级",
    "成长2": "在主角突破大境界时自动觉醒新能力（如：剑灵觉醒、空间封锁）",
    "终级": "剑阵可自成小世界"
  },
  "acquisition": "主角在家族宝库中意外发现剑胚，滴血认主",
  "bond": "灵魂绑定，剑在人在"
}
```

### 18.6 总结

通过构建参考小说分析库和融合生成机制，系统能够从经典作品中学习优秀设定和写作手法，并在新创作中进行创造性组合与创新。这不仅提升了作品的丰富性和吸引力，也避免了简单抄袭的风险，真正实现了"站在巨人的肩膀上"创作。
