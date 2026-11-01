#!/usr/bin/env node
'use strict';
// State-machine and package checks only. This does not claim browser or child usability validation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const starter = path.resolve(__dirname, '../assets');
const Controller = require(path.join(starter, 'controller.js'));

class Clock {
  constructor() { this.now = 0; this.sequence = 0; this.tasks = new Map(); }
  setTimeout = (fn, delay) => { const id = ++this.sequence; this.tasks.set(id, { at: this.now + delay, fn }); return id; };
  clearTimeout = id => { this.tasks.delete(id); };
  tick(amount) {
    const end = this.now + amount;
    while (true) {
      const next = [...this.tasks].filter(([, task]) => task.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      this.now = next[1].at; this.tasks.delete(next[0]); next[1].fn();
    }
    this.now = end;
  }
}

const answers = [1, 0, 2, 1, 2];
function setup() {
  const clock = new Clock(), entered = [];
  let hidden = false;
  const controller = new Controller(answers.map(answer => ({ answer, optionCount: 4 })), {
    lessonCount: 3, delay: 600, clock,
    onEnter: index => entered.push(index), isHidden: () => hidden
  });
  return { controller, clock, entered, hide: value => { hidden = value; } };
}

// Browser timer functions may require their Window receiver. Node's permissive
// timers do not expose this bug, so exercise the non-injected default clock.
{
  const clock = new Clock(), entered = [], browserWindow = {};
  browserWindow.setTimeout = function (fn, delay) {
    assert.equal(this, browserWindow, 'Native setTimeout must retain its Window receiver.');
    return clock.setTimeout(fn, delay);
  };
  browserWindow.clearTimeout = function (id) {
    assert.equal(this, browserWindow, 'Native clearTimeout must retain its Window receiver.');
    return clock.clearTimeout(id);
  };
  const sandbox = { window: browserWindow, setTimeout: browserWindow.setTimeout, clearTimeout: browserWindow.clearTimeout };
  vm.runInNewContext(fs.readFileSync(path.join(starter, 'controller.js'), 'utf8'), sandbox);
  const BrowserController = browserWindow.CoursewareController;
  const c = new BrowserController([{ answer: 1, optionCount: 4 }, { answer: 0, optionCount: 4 }], { onEnter: index => entered.push(index) });
  c.choose(0, 1); clock.tick(200); c.choose(0, 1);
  clock.tick(599); assert.deepEqual(entered, []);
  clock.tick(1); assert.deepEqual(entered, [1]);
  c.choose(1, 0); c.cancel(); clock.tick(1000);
  assert.equal(c.snapshot().complete, false, 'Default clearTimeout also uses the correct receiver.');
}

{
  const { controller: c, clock, entered } = setup();
  assert.equal(c.go(1), false, 'Future lesson is locked.');
  c.choose(0, 0); clock.tick(900); assert.equal(c.snapshot().active, 0); assert.equal(c.snapshot().pending, false);
  c.choose(0, 1); clock.tick(599); assert.equal(c.snapshot().active, 0); clock.tick(1); assert.equal(c.snapshot().active, 1);
  for (let i = 1; i < answers.length; i++) { c.choose(i, answers[i]); clock.tick(600); }
  assert.deepEqual(entered, [1, 2, 3, 4]);
  assert.equal(c.snapshot().complete, true); assert.equal(c.snapshot().active, 4);
  clock.tick(3000); assert.deepEqual(entered, [1, 2, 3, 4], 'Final question does not advance.');
}

{
  const { controller: c, clock, entered } = setup();
  c.choose(0, 1); clock.tick(200); c.choose(0, 1); clock.tick(599); assert.deepEqual(entered, []); clock.tick(1); assert.deepEqual(entered, [1]);
  clock.tick(2000); assert.deepEqual(entered, [1], 'Repeated clicks do not skip a step.');
}

for (const action of ['wrong', 'cancel', 'back', 'reset', 'hidden', 'destroy']) {
  const { controller: c, clock, entered, hide } = setup();
  c.choose(0, 1); clock.tick(200);
  if (action === 'wrong') c.choose(0, 0);
  if (action === 'cancel') c.cancel(); // Replay, detail opening, and new clicks call this API.
  if (action === 'back') c.go(0);
  if (action === 'reset') c.reset();
  if (action === 'hidden') hide(true);
  if (action === 'destroy') c.destroy();
  const count = entered.length;
  clock.tick(3000);
  assert.equal(entered.length, count, `${action} cancels the old delayed advance.`);
  assert.equal(c.snapshot().pending, false);
}

{
  const { controller: c, clock } = setup();
  c.choose(3, 1); clock.tick(600);
  assert.equal(c.snapshot().unlocked, 0, 'Early practice must not unlock unseen lesson steps.');
  c.choose(4, 2); clock.tick(600); assert.equal(c.snapshot().complete, false, 'Do not claim the whole lesson is completed.');
  c.reset(); assert.deepEqual(c.snapshot().selected, [null, null, null, null, null]); assert.equal(c.snapshot().active, 0);
  assert.equal(c.choose(0, 99), false); assert.equal(c.snapshot().pending, false);
}

{
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(starter, 'lesson.js'), 'utf8'), sandbox);
  const lesson = sandbox.window.CoursewareLesson;
  assert.equal(lesson.steps.length, 3); assert.equal(lesson.practice.length, 2);
  const all = [...lesson.steps, ...lesson.practice];
  all.forEach(item => { assert.equal(item.options.length, 4); assert.equal(item.feedback.length, 4); });
  assert.deepEqual(Array.from(all, item => item.answer), answers);
  const first = 120 / 3, increase = first / 4;
  assert.equal(lesson.steps[0].options[lesson.steps[0].answer], `${first}页`);
  assert.equal(lesson.steps[2].options[lesson.steps[2].answer], `${first + increase}页`);
  assert.equal(lesson.practice[0].options[lesson.practice[0].answer], `${first - increase}页`);
  assert.equal(lesson.practice[1].options[lesson.practice[1].answer], `${first + first + increase}页`);
}

for (const name of ['shell.html', 'style.css', 'controller.js', 'lesson.js', 'engine.js', 'download.js', 'build.py']) {
  const content = fs.readFileSync(path.join(starter, name), 'utf8');
  assert.ok(!/\/workspace\/|\/root\/|https?:\/\//.test(content), `${name} must not depend on local paths or network resources.`);
  if (name.endsWith('.js')) assert.ok(!/<\s*\/\s*(?:script|head|body|html)\b/i.test(content), `${name} has a literal ending tag vulnerable to embedding or host rewriting.`);
}
const htmlPath = path.join(starter, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.equal((html.match(/<script data-offline="script">/g) || []).length, 4);
  assert.equal((html.match(/<input\b/gi) || []).length, 0);
  assert.ok(html.includes('id="download-html"'));
  assert.ok(!/\{\{CSS\}\}|\{\{SCRIPTS\}\}/.test(html));
}
console.log('COURSEWARE ENGINE PASS: delayed advance, wrong answers, cancellation, practice flow, reset, arithmetic and portability.');
console.log('Browser layout, event propagation, animations and downloaded-file reopening still require browser QA.');
