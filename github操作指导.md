# 西华vibeCoding团队 — GitHub 操作指导

> **适用对象**：GitHub 入门级用户
> **操作系统**：Windows

---

## 一、准备工作

### 1.1 安装 Git

1. 访问 Git 官网：https://git-scm.com/downloads/win
2. 下载 Windows 版本的 Git 安装包
3. 双击安装，**一路默认选项即可**
4. 安装完成后，打开 **命令提示符（cmd）** 或 **PowerShell**，输入以下命令验证：

```bash
git --version
```

如果显示版本号（如 `git version 2.40.0`），说明安装成功。

### 1.2 配置 Git 用户信息

打开 **命令提示符**，执行以下两条命令（替换为自己的信息）：

```bash
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的GitHub邮箱"
```

示例：

```bash
git config --global user.name "zhangsan"
git config --global user.email "zhangsan@example.com"
```

### 1.3 注册 GitHub 账号

1. 访问 https://github.com
2. 点击右上角 **Sign up** 注册
3. 使用学校邮箱或常用邮箱注册
4. 注册完成后，通过邮箱验证

---

## 二、创建与克隆仓库

### 2.1 在 GitHub 上创建仓库（组长操作）

1. 登录 GitHub，点击右上角 **"+"** → **"New repository"**

```
   ┌─────────────────────────────────────┐
   │  +  ← 点击这里                       │
   │  ├─ New repository                  │
   │  ├─ New organization                │
   │  └─ New project                     │
   └─────────────────────────────────────┘
```

2. 填写仓库信息

| 字段 | 填写内容 |
|------|----------|
| Repository name | `XHAgentOS` |
| Description | `基于AI的智能瞭望与智能问数系统 - 西华vibeCoding团队` |
| Public / Private | 选 **Private**（私有仓库，避免代码泄露） |
| Initialize with README | **勾选** |

3. 点击 **"Create repository"** 完成创建

### 2.2 添加团队成员（组长操作）

1. 进入仓库页面，点击 **Settings**
2. 左侧菜单选择 **Collaborators and teams**
3. 点击 **"Add people"**
4. 输入成员的 **GitHub 用户名** 或 **注册邮箱**
5. 将权限设置为 **Write**（写入权限，可推送代码）
6. 点击 **"Add to this repository"**

> 成员会收到邀请邮件或 GitHub 通知，需要在通知中点击 **"Accept invitation"** 确认加入。

### 2.3 克隆仓库到本地（所有成员操作）

#### 方式一：HTTPS 克隆（推荐）

1. 进入仓库主页，点击绿色的 **"Code"** 按钮
2. 选择 **HTTPS** 标签
3. 复制仓库地址（如 `https://github.com/zhangsan/XHAgentOS.git`）
4. 在本地打开命令提示符，执行：

```bash
# 进入桌面目录
cd C:\Users\Chen\Desktop

# 克隆仓库
git clone https://github.com/zhangsan/XHAgentOS.git
```

5. 输入 GitHub 用户名和密码（注意：密码使用 **Personal Access Token**，见下文）

#### 方式二：使用 SSH（免密码，需额外配置）

如果需要配置 SSH 免密码访问，参考 GitHub 官方文档：
https://docs.github.com/zh/authentication/connecting-to-github-with-ssh

#### 关于 Personal Access Token（HTTPS 克隆必读）

> GitHub 自 2021 年起不再支持使用账号密码进行 Git 操作，需要使用 Token。

**生成 Token 步骤：**

1. 登录 GitHub，点击右上角头像 → **Settings**
2. 左侧菜单拉到最底部 → **Developer settings**
3. 点击 **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. 设置 Token 名称（如 `XHAgentOS-token`）
5. 过期时间选择 **30 days**（或 Custom 设置为考核结束后）
6. **Repository access** 选择 **Only select repositories** → 选择 `XHAgentOS`
7. **Permissions** → **Contents** 设置为 **Read and write**
8. 点击 **Generate token**
9. **立即复制并保存 Token！** 关闭页面后将无法再次查看

克隆时输入密码框粘贴 Token 即可。

---

## 三、分支管理策略

### 3.1 分支结构

```
main（主分支）
  └── develop（开发分支）
        ├── feature/chat-li（功能分支-李同学的对话模块）
        ├── feature/digital-employee-wang（王同学的模块）
        ├── feature/deep-collection-zhao（赵同学的模块）
        └── feature/website-liu（刘同学的模块）
```

| 分支名称 | 说明 | 谁可以操作 |
|----------|------|-----------|
| `main` | 主分支，存放稳定版本，保护分支 | 组长合并 |
| `develop` | 开发分支，日常集成分支 | 全员 |
| `feature/xxx-姓名拼音` | 个人功能开发分支 | 本人 |

### 3.2 创建功能分支

每次开始开发新功能前，先创建自己的功能分支：

```bash
# 确保在 main 分支上
git checkout main

# 拉取最新代码
git pull

# 切换到 develop 分支
git checkout develop

# 基于 develop 创建自己的功能分支
git checkout -b feature/chat-li

# 查看当前分支（确认切换成功）
git branch
# 输出中 * 号所在的行为当前分支
```

---

## 四、日常开发流程

### 4.1 每日开始工作前：拉取最新代码

```bash
# 1. 先切换到自己的功能分支
git checkout feature/chat-li

# 2. 提交本地修改（如果有未提交的修改）
git add .
git commit -m "chore: 暂存当日工作"

# 3. 切换到 develop 分支
git checkout develop

# 4. 拉取最新代码
git pull

# 5. 切回自己的功能分支
git checkout feature/chat-li

# 6. 将 develop 的最新代码合并到自己的分支
git merge develop

# 如果有冲突，解决冲突（参见第六部分）
```

### 4.2 开发过程中：保存进度

建议每完成一个小功能就提交一次：

```bash
# 1. 查看当前修改了哪些文件
git status

# 2. 添加要提交的文件（逐个添加，不要用 git add -A）
git add app/controllers/chat.py
git add app/templates/chat.html

# 3. 或者一次性添加所有修改（确保没有敏感文件）
git add .

# 4. 提交修改
git commit -m "feat(chat): 实现用户对话功能"
```

### 4.3 推送代码到远程仓库

```bash
# 第一次推送到远程（建立关联）
git push -u origin feature/chat-li

# 之后推送（无需再指定远程分支）
git push
```

### 4.4 提交 Pull Request（合并代码到 develop）

当功能开发完成并自测通过后，需要将代码合并到 `develop` 分支：

#### 方式一：命令行操作

```bash
# 1. 切换到 develop 分支
git checkout develop

# 2. 拉取最新代码
git pull

# 3. 切回自己的功能分支
git checkout feature/chat-li

# 4. 将 develop 合并到自己的分支（先解决可能的冲突）
git merge develop

# 5. 推送最终版本
git push

# 6. 在 GitHub 网页上创建 Pull Request
```

#### 方式二：GitHub 网页操作（推荐）

1. 推送功能分支到远程后，打开 GitHub 仓库页面
2. 页面顶部会出现提示："feature/chat-li had recent pushes"
3. 点击 **"Compare & pull request"**
4. 填写 PR 信息：

| 字段 | 填写内容 |
|------|----------|
| base branch | `develop` |
| compare branch | `feature/chat-li` |
| Title | `feat(chat): 实现用户对话功能` |
| Description | 简要描述做了哪些修改 |

5. 点击 **"Create pull request"**
6. 在群内 @组长 进行代码审查
7. 组长审查通过后，点击 **"Merge pull request"** → **"Confirm merge"**

### 4.5 删除功能分支

合并到 `develop` 后，可以删除本地的功能分支：

```bash
# 删除本地分支
git branch -d feature/chat-li

# 删除远程分支
git push origin --delete feature/chat-li
```

---

## 五、代码提交规范

### 5.1 Commit Message 模板

```
<类型>(<范围>): <描述>
```

**常见类型：**

```
feat:     新功能
fix:      Bug修复
docs:     文档更新
refactor: 代码重构
style:    代码格式调整
chore:    构建/工具/杂项
```

**示例：**

```
feat(chat): 完成用户对话消息发送与接收
fix(auth): 修复登录后页面跳转错误
docs(readme): 更新项目说明文档
refactor(model): 重构模型引擎调用逻辑
```

### 5.2 提交频率建议

| 场景 | 建议 |
|------|------|
| 完成一个完整功能 | ✅ 提交一次 |
| 修复一个 Bug | ✅ 提交一次 |
| 修改了一个文件 | ❌ 不建议单独提交，等完成功能再提交 |
| 代码还没写完，要回家了 | ✅ 提交暂存，注明 "WIP"（Work In Progress） |

### 5.3 禁止提交的文件

以下文件禁止提交到 Git 仓库（已经在 `.gitignore` 中配置）：

```
venv/                    # 虚拟环境
__pycache__/             # Python 缓存
*.pyc                    # 编译文件
*.db                     # 数据库文件（已有数据可单独分享）
.env                     # 环境变量
*.zip                    # 压缩包
.DS_Store                # macOS 系统文件
```

> 如果某个文件在 `.gitignore` 中但仍然被提交了，联系组长处理。

---

## 六、冲突解决

### 6.1 什么是冲突？

当两个人修改了同一个文件的同一段代码时，Git 无法自动合并，就会产生冲突。

### 6.2 解决冲突步骤

#### 场景：执行 `git merge develop` 时提示冲突

```
Auto-merging app/controllers/admin.py
CONFLICT (content): Merge conflict in app/controllers/admin.py
Automatic merge failed; fix conflicts and then commit the result.
```

#### 解决方法：

**Step 1：查看冲突文件**

```bash
# 查看哪些文件有冲突
git status
```

会显示类似：

```
both modified:   app/controllers/admin.py
```

**Step 2：打开冲突文件**

使用 VS Code 或其他编辑器打开有冲突的文件，会看到类似以下内容：

```python
<<<<<<< HEAD
# 当前分支的代码
def get_user_list(self):
    return UserRepository.get_all()
=======
# develop 分支的代码
def get_user_list(self):
    return UserRepository.get_paginated(page=1, page_size=20)
>>>>>>> develop
```

**Step 3：手动解决冲突**

```
<<<<<<< HEAD 和 ======= 之间 → 你自己的代码
======= 和 >>>>>>> develop 之间 → 远程拉下来的代码
```

需要决定保留哪一部分，或者结合两者：

```python
# 解决后的代码（将两部分合并）
def get_user_list(self):
    return UserRepository.get_paginated(page=1, page_size=20)
```

删除 `<<<<<<< HEAD`、`=======`、`>>>>>>> develop` 这三行标记。

**Step 4：提交解决后的代码**

```bash
# 添加解决冲突后的文件
git add app/controllers/admin.py

# 提交（不需要修改提交信息，使用默认的 merge 信息）
git commit
```

### 6.3 避免冲突的建议

1. **每日开始工作前先 `git pull`**，确保本地代码最新
2. **分工明确**，尽量避免多人修改同一个文件
3. **功能分支尽量独立**，每个人的代码放在不同文件中
4. **及时提交并推送**，避免本地积压大量修改

---

## 七、常见问题与解决方法

### 问题 1：git push 时提示 "failed to push some refs"

**原因**：远程仓库有新的提交，本地不是最新的

**解决**：

```bash
git pull --rebase
git push
```

### 问题 2：不小心把代码提交到了 main 分支

**解决**：

```bash
# 1. 在当前 main 分支创建一个新分支保留修改
git checkout -b feature/temp-branch

# 2. 切换到 main 分支并回退到上一次提交
git checkout main
git reset --hard HEAD~1

# 3. 切换到正确的分支继续开发
git checkout feature/chat-li
```

### 问题 3：提交时输入了错误的 commit message

**解决**：

```bash
# 修改最近一次提交的 commit message
git commit --amend -m "修正后的提交信息"
```

### 问题 4：git pull 时提示 "Your local changes would be overwritten"

**原因**：本地有未提交的修改，与远程冲突

**解决（两种方式）**：

```bash
# 方式一：提交本地修改后再拉取（推荐）
git add .
git commit -m "chore: 暂存本地修改"
git pull

# 方式二：暂存本地修改，拉取后再恢复
git stash
git pull
git stash pop
```

### 问题 5：如何查看提交历史

```bash
# 查看简洁的提交历史
git log --oneline

# 查看最近的 5 条提交
git log --oneline -5

# 查看图形化的分支历史
git log --oneline --graph --all
```

---

## 八、团队协作流程图

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
│  在自己的功能分支上开发（feature/xxx-姓名）                  │
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

### 每日操作速查

```bash
# 早上到教室
git checkout feature/chat-li           # 切换到自己的分支
git checkout develop                   # 切换到开发分支
git pull                               # 拉取最新代码
git checkout feature/chat-li           # 切回自己的分支
git merge develop                      # 合并最新代码

# 开发过程中...
git add 文件名                          # 添加修改的文件
git commit -m "feat(xxx): 描述"        # 提交
git push                               # 推送到远程

# 开发完成
# → 在 GitHub 网页创建 Pull Request
```

---

## 九、Git 命令速查表

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

> **遇到问题时**：
> 1. 先尝试 Google 搜索错误信息
> 2. 在团队群内提问（截图 + 错误信息）
> 3. 联系组长协助解决
