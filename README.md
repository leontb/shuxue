# shuxue · 数学动画互动课件制作包

版本：0.2.1 · 2026-11-01

把一道数学题制作成围绕原理的图示、选择题引导与动画互动。默认面向六年级，答对约600毫秒后自动继续，答错留题解释，支持回看与离线下载。

## 这是什么

一套供 WorkBuddy、Codex、Claude Code 等 Agent 读取和复用的数学课件制作包。把题目文字或图片交给 Agent，让它依据包内说明，完成数学求解、教学分镜、图示动画、选择题互动和离线 HTML 交付。适合希望制作数学讲解材料的老师、家长和课程开发者；默认面向六年级，也可指定其他年级与已学知识。

包内提供制作说明、可移植 Skill、单文件 HTML 模板、动点折返完整案例与验证脚本。它需要配合具备文件读取和代码执行能力的 Agent 使用；各宿主的 Skill 导入方法不同，也可以直接让 Agent 阅读文件执行。

## 复制给 WorkBuddy 等 Agent

将下面整段指令复制到 Agent 的对话框，再附上题目图片或文字。已下载本仓库时，可将仓库地址替换为本地目录。

```text
请使用 https://github.com/leontb/shuxue 的 v0.2 版本，把我提供的数学题制作成可直接打开、可下载的动画互动课件。

题目：[粘贴完整题目，或见所附图片]
学生年级与已学知识：[默认六年级，可修改]
额外要求：[没有可留空]

1. 将仓库 v0.2 下载或克隆到新的本地目录；如果我已提供本地仓库，直接读取。先阅读 README.md、AGENT_GUIDE.md、COPY_PROMPT.md 和 skills/create-math-lesson/SKILL.md，并按需读取该 Skill 引用的文件。不必先安装 Skill；如果无法访问仓库或附件，请明确说明缺少什么，不要假装已经读取。
2. 核对题目条件，独立求解并验证答案、边界和全部情况，再设计分步教学。图示和动画必须帮助解释推导，说明份数、比例与比较基准从哪里来；新题不能只替换模板标题或数字。
3. 使用包内 starter 制作：每一步包含图示、简短解释和一道选择题。答对约 600 毫秒后自动推进；答错停留并提示，允许重选。提供回看、暂停、重播和重置，并在讲解后加入数学思维关系图和两道有实际变化的选择题训练。
4. 交付无需联网、无需外部依赖的独立 HTML，以及可编辑源码和构建方法。页面需有可用下载按钮，下载文件重开后从第一步开始；兼顾手机和桌面。未经我要求，不必发布网站。
5. 运行相关数学和软件检查；环境允许时实际验证浏览器互动、下载文件重开和小屏布局。区分通过、失败及未验证的项目，不把技术检查通过写成学生学习效果已证实。完成后直接提供成品的真实文件入口、简要解析和验证结果。

请按以上要求完成制作，不只给方案。如果当前环境无法读取文件或执行代码，请先说明能力限制。
```

更详细的制作指令见 [COPY_PROMPT.md](COPY_PROMPT.md)。先看成品可下载仓库后打开 [动点折返示例](examples/bouncing-segment/index.html)；GitHub 文件页展示的是源码。

## 先选一个入口

| 你的目的 | 打开什么 |
|---|---|
| 交给其他Agent直接做题 | COPY_PROMPT.md，并让它读取AGENT_GUIDE.md |
| 复用为Skill | skills/create-math-lesson/SKILL.md |
| 先看完整课件长什么样 | examples/bouncing-segment/index.html |
| 开发新课件 | 使用Skill中的scripts/new_lesson.py复制starter |
| 看本包检查到什么程度 | VALIDATION.md |

## 最快交接方式

1. 把整个解压目录交给Agent。
2. 复制COPY_PROMPT.md中的指令，附上题目图片或文字。
3. 说明学生基础和是否需要在线演示；没有特别要求就沿用默认。
4. 让Agent先独立求解，写分镜，再实现HTML。
5. 按AGENT_GUIDE.md的交付要求接收结果。

不支持Skill机制的Agent也可以直接阅读SKILL.md。读取文件不等于安装；不同宿主的导入入口和技能目录不同，按宿主支持的方法导入即可。

## 开发者快速开始

在本包根目录执行：

```bash
python3 skills/create-math-lesson/scripts/new_lesson.py --out ./my-lesson
python3 my-lesson/build.py
python3 skills/create-math-lesson/scripts/check_delivery.py my-lesson/index.html
```

打开my-lesson/index.html即可使用。浏览器无需联网，也不需要安装npm依赖。

模板内置的是一个完整的“阅读页数与比较基准”小样例。正式制作新题时，替换题目、图示、解释、选项、总结和两道训练；不能只改标题或数字。

模板控制器的独立检查（需要Node）：

```bash
node skills/create-math-lesson/scripts/check_engine.cjs
```

完整折返参考案例可以重新构建：

```bash
python3 examples/bouncing-segment/src/build.py
node examples/bouncing-segment/src/check_math.js
```

## 包内结构

- AGENT_GUIDE.md：其他Agent可执行的制作说明。
- COPY_PROMPT.md：含输入位置的复制指令。
- skills/create-math-lesson/：独立Skill，含核心流程、分镜模板、教学方法、实现约定、验证清单、脚本与starter。
- examples/bouncing-segment/：完整动点折返示例、可编辑源码和该题数学检查。
- examples/water-storyboard.md：另一位Agent仅依靠本Skill完成的新题分镜，展示分数比较基准改变时如何设计图示。
- VALIDATION.md：本包实际做过的验证及限制。
- MANIFEST.json：版本与文件校验值，便于核对包内容。

## 已固定的设计决策

图示必须解释推导；份数必须说明来源；主讲解和训练都用选择题；答对自动推进；关键推导保留；数学思维用关系图；两道训练有真实变化；下载后完整离线运行。

“600毫秒”只用于正确反馈和转场，不要求学生在600毫秒内读完讲解。

## 完整案例与模板的分工

完整案例展示复杂题如何分段、处理边界和检查漏解。starter提供较轻的页面骨架与交互控制器。两者都可复用，但新题的数学模型和图形必须重新设计。

本包没有把某个在线平台、账号、站点标识或本机路径写成必需配置。是否发布以及发布到哪里，由具体任务和宿主能力决定。

## 验证说明

数学核验、软件验证与学生理解分别记录。已经运行的检查见VALIDATION.md；没有真实学生试用的数据，因此不把“检查通过”写成“教学效果已证实”。


## 开源协议

本项目采用 [MIT License](LICENSE)，允许使用、修改、分发和商业使用；分发时请保留版权声明与许可文本。
