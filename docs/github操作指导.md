# 西华vibeCoding团队 — GitHub 操作指导

> **适用对象**：GitHub 入门级用户
> **操作系统**：Windows / Linux

---

## 一、准备工作

### 1.1 安装 Git

- **Windows**：访问 https://git-scm.com/downloads/win 下载安装
- **Linux**：`sudo apt install git` 或 `sudo yum install git`

安装后验证：
```bash
git --version
```

### 1.2 配置 Git 用户信息

```bash
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

### 1.3 注册 GitHub 账号

1. 访问 https://github.com
2. 点击右上角 **Sign up** 注册
3. 使用邮箱注册并验证

---

## 二、仓库操作

### 2.1 克隆仓库

```bash
cd C:\Users\Chen\Desktop
git clone https://github.com/XiaoleC05/XHAgentOS.git
```

### 2.2 关于 Personal Access Token

GitHub 不再支持账号密码进行 Git 操作，需要使用 Token。

**生成 Token 步骤：**

1. 登录 GitHub → 头像 → **Settings**
2. 左侧底部 → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. 设置名称和过期时间
5. **Repository access** 选择 **Only select repositories**
6. **Permissions** → **Contents** 设置为 **Read and write**
7. 生成后立即复制 Token

---

## 三、分支管理策略

### 3.1 分支结构

```
main（主分支，稳定版本）
  └── develop（开发分支，日常集成）
        ├── feature/xxx（功能分支）
        └── fix/xxx（修复分支）
```

| 分支名称 | 说明 | 谁可以操作 |
|----------|------|-----------|
| `main` | 主分支，存放稳定版本 | 组长合并 |
| `develop` | 开发分支，日常集成分支 | 全员 |
| `feature/xxx` | 个人功能开发分支 | 本人 |

### 3.2 创建功能分支

```bash
git checkout develop
git pull
git checkout -b feature/xxx
```

---

## 四、日常开发流程

### 4.1 每日开始工作

```bash
git checkout feature/xxx
git checkout develop
git pull
git checkout feature/xxx
git merge develop
```

### 4.2 开发过程中保存进度

```bash
git status          # 查看修改
git add .           # 添加所有修改
git commit -m "feat(xxx): 描述"  # 提交
```

### 4.3 推送代码

```bash
# 首次推送（建立关联）
git push -u origin feature/xxx

# 后续推送
git push
```

### 4.4 提交 Pull Request

1. 推送功能分支到远程
2. 打开 GitHub 仓库页面
3. 点击 **"Compare & pull request"**
4. 填写 PR 信息（base: develop, compare: feature/xxx）
5. 点击 **"Create pull request"**
6. @组长 审查后合并

### 4.5 删除功能分支

```bash
git branch -d feature/xxx
git push origin --delete feature/xxx
```

---

## 五、代码提交规范

### 5.1 Commit Message 模板

```
<类型>(<范围>): <描述>
```

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug修复 |
| `docs` | 文档更新 |
| `refactor` | 代码重构 |
| `style` | 代码格式调整 |
| `chore` | 构建/工具/杂项 |

### 5.2 禁止提交的文件

已在 `.gitignore` 中配置，禁止提交：

```
venv/
__pycache__/
*.pyc
*.db
.env
*.zip
.DS_Store
```

---

## 六、冲突解决

### 6.1 解决冲突步骤

```bash
# 查看冲突文件
git status

# 打开冲突文件，手动编辑解决
# 删除 <<<<<<< HEAD、=======、>>>>>>> develop 标记

# 提交解决后的代码
git add 冲突文件
git commit
```

### 6.2 避免冲突的建议

1. 每日开始工作前先 `git pull`
2. 分工明确，避免多人修改同一文件
3. 功能分支尽量独立
4. 及时提交并推送

---

## 七、常见问题

### 问题 1：git push 提示 "failed to push some refs"

```bash
git pull --rebase
git push
```

### 问题 2：git pull 提示 "Your local changes would be overwritten"

```bash
# 方式一：提交后再拉取
git add .
git commit -m "chore: 暂存"
git pull

# 方式二：暂存后拉取
git stash
git pull
git stash pop
```

### 问题 3：网络无法连接 GitHub

```bash
# 配置代理（需先安装 VPN 客户端）
git config --global http.proxy http://127.0.0.1:7890

# 取消代理
git config --global --unset http.proxy
```

### 问题 4：查看提交历史

```bash
git log --oneline           # 简洁历史
git log --oneline -5        # 最近5条
git log --oneline --graph   # 图形化分支历史
```

---

## 八、Git 命令速查表

| 操作 | 命令 |
|------|------|
| 查看当前分支 | `git branch` |
| 查看文件变更 | `git status` |
| 查看具体修改 | `git diff` |
| 添加文件到暂存区 | `git add <文件名>` |
| 提交 | `git commit -m "消息"` |
| 推送到远程 | `git push` |
| 拉取远程更新 | `git pull` |
| 创建分支 | `git checkout -b <分支名>` |
| 切换分支 | `git checkout <分支名>` |
| 合并分支 | `git merge <分支名>` |
| 查看提交历史 | `git log --oneline` |
| 撤销工作区修改 | `git checkout -- <文件名>` |

---

## 九、团队协作流程图

```
┌─────────────────────────────────────────────────────┐
│              每日工作流程                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  开始工作                                            │
│     │                                                │
│     ▼                                                │
│  git pull（拉取最新代码）                               │
│     │                                                │
│     ▼                                                │
│  在自己的功能分支上开发                                 │
│     │                                                │
│     ▼                                                │
│  功能完成 → git add + git commit                      │
│     │                                                │
│     ▼                                                │
│  git push（推送到远程）                                 │
│     │                                                │
│     ▼                                                │
│  在 GitHub 创建 Pull Request 到 develop 分支           │
│     │                                                │
│     ▼                                                │
│  组长代码审查 → 通过 → 合并                             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

> **遇到问题时**：
> 1. 先尝试 Google 搜索错误信息
> 2. 在团队群内提问（截图 + 错误信息）
> 3. 联系组长协助解决
