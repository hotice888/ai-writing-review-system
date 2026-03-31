# PostgreSQL 数据库表结构设计

## 数据库：ai_writing_review

### 3.1 项目与核心设定

```sql
-- 项目总表
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT,
    target_words INTEGER,
    current_chapter INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'planning'
);

-- 设定表（世界观、势力、历史、地图等）
CREATE TABLE settings (
    setting_id SERIAL PRIMARY KEY,
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
    character_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT,   -- protagonist, antagonist, supporting
    description TEXT,
    attributes JSON,        -- 境界、技能、外貌等
    relationships JSON,     -- 关系矩阵 [{target, type, value}]
    arc_plan JSON,          -- 每卷人物弧光
    current_realm TEXT,
    current_location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.3 卷与章节规划

```sql
CREATE TABLE volumes (
    volume_id SERIAL PRIMARY KEY,
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
    plan_id SERIAL PRIMARY KEY,
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
    content_id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    version INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    word_count INTEGER,
    review_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (plan_id) REFERENCES chapter_plans(plan_id)
);
```

### 3.5 摘要存储

```sql
CREATE TABLE chapter_summaries (
    summary_id SERIAL PRIMARY KEY,
    chapter_number INTEGER NOT NULL,
    summary TEXT NOT NULL,
    key_events JSON,
    characters_changed JSON,
    foreshadowing_planted JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volume_summaries (
    summary_id SERIAL PRIMARY KEY,
    volume_id INTEGER NOT NULL,
    summary TEXT,
    key_events JSON,
    FOREIGN KEY (volume_id) REFERENCES volumes(volume_id)
);
```

### 3.6 伏笔表

```sql
CREATE TABLE foreshadowings (
    foreshadowing_id SERIAL PRIMARY KEY,
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
    storyline_id SERIAL PRIMARY KEY,
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
    realm_id SERIAL PRIMARY KEY,
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
    grade_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    grade_name TEXT,
    rank INTEGER,
    typical_realm TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 法宝详情
CREATE TABLE artifacts (
    artifact_id SERIAL PRIMARY KEY,
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
    pill_grade_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    grade_name TEXT,
    rank INTEGER,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 丹药详情
CREATE TABLE pills (
    pill_id SERIAL PRIMARY KEY,
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
    currency_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name TEXT,                    -- 灵石、金币、贡献点等
    base_unit TEXT,               -- 基本单位
    conversion_rates JSON,        -- 汇率
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 材料/天材地宝
CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name TEXT,
    category TEXT,                -- 灵草、矿石、妖兽材料等
    rarity TEXT,                 -- 稀有度
    effect TEXT,                  -- 功效
    usage TEXT,                   -- 用途
    typical_value TEXT,           -- 典型价值
    acquisition_plan JSON,        -- 获取计划
    actual_acquired BOOLEAN DEFAULT FALSE,  -- 是否已获取
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 资源变动记录
CREATE TABLE resource_events (
    event_id SERIAL PRIMARY KEY,
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
    skill_id SERIAL PRIMARY KEY,
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
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    mastery_level INTEGER DEFAULT 0,
    learned_chapter INTEGER,
    FOREIGN KEY (character_id) REFERENCES characters(character_id),
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);
```

### 3.9 智能体调用记录与章节摘要

```sql
-- 智能体调用记录表
CREATE TABLE agent_calls (
    call_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    agent_type TEXT NOT NULL, -- planning, writing, review, optimization, summary
    agent_name TEXT,          -- 具体智能体名称（如LogicReviewer）
    chapter_number INTEGER,
    input_text TEXT,          -- 智能体输入（JSON格式）
    output_text TEXT,         -- 智能体输出（JSON格式）
    tokens_used INTEGER,
    cost REAL,
    model_used TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- 章节摘要表
CREATE TABLE chapter_summaries (
    summary_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    summary TEXT,                   -- 章节摘要
    key_points JSON,                -- 关键信息（人物、事件、宝物等）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);
```

### 3.10 评审记录表

```sql
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    reviewer_type TEXT,           -- logic, style, plot, reader, complexity, growth
    score INTEGER,                -- 评分（1-10）
    issues JSON,                 -- 问题列表含位置和建议
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES chapter_contents(content_id)
);
```

### 3.11 成长路线规划表

```sql
CREATE TABLE growth_paths (
    path_id SERIAL PRIMARY KEY,
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
```

### 3.12 优化记录表

```sql
CREATE TABLE optimization_records (
    optimization_id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    chapter_number INTEGER,
    iteration INTEGER,
    issues_addressed JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES chapter_contents(content_id)
);
```

### 3.13 用户交互记录表

```sql
CREATE TABLE user_interactions (
    interaction_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    interaction_type TEXT NOT NULL, -- seed_input, planning_confirm, modification, backtrack, pause, resume
    content TEXT,
    chapter_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);
```

### 3.14 系统配置表

```sql
-- 系统配置表
CREATE TABLE system_config (
    config_id SERIAL PRIMARY KEY,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 智能体配置表
CREATE TABLE agent_config (
    config_id SERIAL PRIMARY KEY,
    agent_type TEXT UNIQUE NOT NULL, -- planning, writing, review_logic, review_style, etc.
    model_config_id INTEGER,
    system_prompt TEXT,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.15 参考小说库

```sql
-- 参考小说库
CREATE TABLE reference_novels (
    novel_id SERIAL PRIMARY KEY,
    title TEXT,
    author TEXT,
    analysis JSON,           -- 完整分析结果
    tags TEXT               -- 标签，如"玄幻""废柴流"
);

-- 参考法宝库
CREATE TABLE reference_artifacts (
    artifact_id SERIAL PRIMARY KEY,
    novel_id INTEGER,
    name TEXT,
    type TEXT,
    grade TEXT,
    function TEXT,
    acquisition TEXT,
    FOREIGN KEY (novel_id) REFERENCES reference_novels(novel_id)
);

-- 参考技能库
CREATE TABLE reference_skills (
    skill_id SERIAL PRIMARY KEY,
    novel_id INTEGER,
    name TEXT,
    type TEXT,
    level_system TEXT,
    effect TEXT,
    FOREIGN KEY (novel_id) REFERENCES reference_novels(novel_id)
);

-- 参考丹药库
CREATE TABLE reference_pills (
    pill_id SERIAL PRIMARY KEY,
    novel_id INTEGER,
    name TEXT,
    grade TEXT,
    effect TEXT,
    FOREIGN KEY (novel_id) REFERENCES reference_novels(novel_id)
);
```

## 注意事项

1. **数据类型转换**：
   - `AUTOINCREMENT` → `SERIAL`（PostgreSQL的自增类型）
   - `DATETIME` → `TIMESTAMP`（PostgreSQL的时间戳类型）
   - `BOOLEAN DEFAULT 0` → `BOOLEAN DEFAULT FALSE`（PostgreSQL的布尔值）

2. **JSON支持**：
   - PostgreSQL原生支持JSON类型，无需修改

3. **外键约束**：
   - 保持所有外键约束不变

4. **默认值**：
   - 保持所有默认值设置不变

5. **表结构**：
   - 保持所有表结构和字段不变，仅修改数据类型和语法

6. **索引**：
   - 建议在生产环境中为常用查询字段添加索引，如：
     - `projects(project_id, status)`
     - `chapter_plans(volume_id, chapter_number)`
     - `chapter_contents(plan_id, is_current)`
     - `reviews(content_id, reviewer_type)`

7. **权限**：
   - 建议为应用创建专用数据库用户，并授予适当的权限

## 初始化脚本

```sql
-- 创建数据库
CREATE DATABASE ai_writing_review;

-- 连接到数据库
\c ai_writing_review;

-- 执行上述所有CREATE TABLE语句

-- 插入初始系统配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('default_model', 'gpt-4o-mini', '默认使用的AI模型'),
('review_threshold', '7', '评审通过的最低分数'),
('max_optimization_attempts', '3', '最大优化尝试次数'),
('chapter_word_count_target', '3000', '每章目标字数'),
('summary_max_length', '500', '章节摘要最大长度');

-- 插入初始智能体配置
INSERT INTO agent_config (agent_type, system_prompt, temperature, max_tokens) VALUES
('planning', '你是一位专业的小说策划师...', 0.7, 2000),
('writing', '你是一位优秀的小说作家...', 0.8, 4000),
('review_logic', '你是一位逻辑严谨的小说评审...', 0.5, 1000),
('review_style', '你是一位注重文风的小说评审...', 0.5, 1000),
('review_plot', '你是一位擅长剧情分析的小说评审...', 0.5, 1000),
('review_reader', '你是一位模拟读者的小说评审...', 0.6, 1000),
('optimization', '你是一位专业的小说编辑...', 0.7, 3000),
('summary', '你是一位擅长总结的小说分析师...', 0.5, 1000);
```