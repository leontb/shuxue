(function (scope) {
  'use strict';

  // Pure state machine: no DOM access. The UI and tests provide the clock/hooks.
  class CoursewareController {
    constructor(items, options = {}) {
      if (!Array.isArray(items) || !items.length) throw new Error('At least one item is required.');
      this.items = items.map(item => {
        if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.optionCount) {
          throw new Error('Each item needs a valid answer and optionCount.');
        }
        return { ...item };
      });
      this.delay = options.delay ?? 600;
      this.lessonCount = options.lessonCount ?? this.items.length;
      if (!Number.isInteger(this.lessonCount) || this.lessonCount < 1 || this.lessonCount > this.items.length) throw new Error('Invalid lessonCount.');
      this.clock = options.clock || {
        setTimeout: (...args) => scope.setTimeout(...args),
        clearTimeout: (...args) => scope.clearTimeout(...args)
      };
      this.isHidden = options.isHidden || (() => false);
      this.onChange = options.onChange || (() => {});
      this.onEnter = options.onEnter || (() => {});
      this.timer = null;
      this.generation = 0;
      this.state = this.initial();
    }

    initial() {
      return { active: 0, unlocked: 0, selected: this.items.map(() => null), solved: this.items.map(() => false), complete: false };
    }

    snapshot() {
      return { ...this.state, selected: [...this.state.selected], solved: [...this.state.solved], pending: this.timer !== null };
    }

    emit(reason) { this.onChange(this.snapshot(), reason); }

    cancel(notify = true) {
      this.generation += 1;
      if (this.timer !== null) this.clock.clearTimeout(this.timer);
      this.timer = null;
      if (notify) this.emit('cancel');
    }

    choose(index, option) {
      const item = this.items[index];
      if (!item || !Number.isInteger(option) || option < 0 || option >= item.optionCount) return false;
      this.cancel(false);
      this.state.active = index;
      this.state.selected[index] = option;
      this.state.complete = false;
      const correct = option === item.answer;
      if (correct) {
        this.state.solved[index] = true;
        if (index < this.lessonCount) this.state.unlocked = Math.max(this.state.unlocked, Math.min(index + 1, this.lessonCount - 1));
        const generation = this.generation;
        this.timer = this.clock.setTimeout(() => {
          this.timer = null;
          if (generation !== this.generation || this.isHidden() || this.state.active !== index || this.state.selected[index] !== item.answer) return;
          if (index === this.items.length - 1) {
            this.state.complete = this.state.solved.every(Boolean);
            this.emit('complete');
          } else {
            this.state.active = index + 1;
            this.emit('advance');
            this.onEnter(index + 1, 'advance');
          }
        }, this.delay);
      }
      this.emit('answer');
      return correct;
    }

    go(index) {
      if (!Number.isInteger(index) || index < 0 || index > this.state.unlocked || index >= this.lessonCount) return false;
      this.cancel(false);
      this.state.active = index;
      this.emit('navigate');
      this.onEnter(index, 'navigate');
      return true;
    }

    reset() {
      this.cancel(false);
      this.state = this.initial();
      this.emit('reset');
      this.onEnter(0, 'reset');
    }

    destroy() { this.cancel(false); this.onChange = () => {}; this.onEnter = () => {}; }
  }

  scope.CoursewareController = CoursewareController;
  if (typeof module !== 'undefined' && module.exports) module.exports = CoursewareController;
})(typeof window !== 'undefined' ? window : globalThis);
