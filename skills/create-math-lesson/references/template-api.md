# 模板接口

## 修改范围

修改starter中的lesson.js，按新题需要重写数学模型和图形。controller.js负责通用状态，engine.js负责DOM与导航，download.js负责导出，build.py将文件内嵌成index.html。

## 内容配置

lesson.js设置window.CoursewareLesson：

| 字段 | 含义 |
|---|---|
| title、subtitle | 页面标题与一句学习目标 |
| downloadName | 下载文件名，以.html结尾 |
| problemHtml | 原题内容，经过作者核对的可信HTML |
| summaryTitle、summaryHtml | 一图总结 |
| steps | 有序的讲解步骤 |
| practice | 两道独立训练 |
| mountVisual(host, scene, context) | 挂载图形并返回控制接口 |

步骤字段：

```js
{
  id: 'unique-step-id',
  label: '导航短标题',
  title: '本步要理解的问题',
  lead: '一句观察任务',
  scene: 'your-scene-name',
  question: '选择题题干',
  options: ['选项A', '选项B', '选项C', '选项D'],
  answer: 1, // 从0开始的正确项索引
  feedback: ['A的提示', 'B的短确认', 'C的提示', 'D的提示'],
  explanationHtml: '<p>可回看的完整解析。</p>'
}
```

训练项采用同样的选项与答案字段，用title作为问题标题，lead补足条件。当前模板固定4个选项、恰好2道训练；明确需要其他数量时，连同验证一起修改引擎约束。

## 图形接口

context包含autoplay、reducedMotion和onPlayback(playing)。返回play、pause、replay、isPlaying、setFeedback(correct)、destroy方法。

- pause暂停，replay回到本段起点。
- setFeedback用于高亮本题关系，不改变数学事实。
- destroy必须取消动画、移除监听并释放引用。
- 新题需要关键时刻选择时，在图形内提供，不将它当作“下一步”。
- 动态图使用stateAt(t)之类的纯函数，图形和读数共用一个模型。

页面公开window.Courseware.reset()、getState()、destroy()。getState用于开发检查，不向学生显示内部状态。

## 构建与下载

运行python3 build.py，得到同目录index.html。路径以脚本所在目录为基准。

下载按钮只导出课件自身，保留data-offline标记的样式与脚本，清空动态区，由启动代码恢复初始状态。避免在内嵌脚本字符串中直接写文档结束标签；某些预览宿主会据此注入脚本。优先通过DOM构建后序列化。

## 换题后的检查

重新独立求解；核对answer索引和每条feedback；核对scene均有实现；检查旧题内容已替换；针对新模型做关键值和边界检查；再做构建、浏览器全流程与实际下载重开。旧题和模板测试通过不代表新题已验证。
