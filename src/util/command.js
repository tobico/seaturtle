import { makeSortFn } from './make-sort-fn'
import { detectTouch } from './detect'

const _logging = !detectTouch() && typeof console !== 'undefined' && console.groupCollapsed

let _command
let _history = []

export const Command = {
  beginCommand(name) {
    if (_command) { throw "Tried to run more than one command at once"; }
    _command = {
      name,
      tally:        {},
      oneTimeTasks: {},
      log(method, time, args) {
        if (!this.tally[method]) { this.tally[method] = { method, count: 0, time: 0 }; }
        this.tally[method].count++;
        return this.tally[method].time += time;
      },
      runOneTimeTasks() {
        return (() => {
          const result = [];
          for (let key in this.oneTimeTasks) {
            const fn = this.oneTimeTasks[key];
            result.push(fn());
          }
          return result;
        })();
      },
      dump() {
        const counts = [];
        for (let id in this.tally) {
          const item = this.tally[id];
          counts.push(item);
        }
        counts.sort(makeSortFn('time', true));
        if (console.table) { return console.table(counts, ['method', 'count', 'time']); }
      }
    };
    if (_logging) {
      console.groupCollapsed(`Command: ${name}`);
      console.time('execute');
    } else if (typeof console !== 'undefined') {
      console.log(`Command: ${name}`);
    }
    return _command;
  },

  endCommand() {
    const command = _command;
    command.runOneTimeTasks();
    if (_logging) {
      console.timeEnd('execute');
      command.dump();
      console.groupEnd();
    }
    if (command.reverse) { _history.push(command); }
    _command = null;
    return command;
  },

  command(name, forward, reverse=null) {
    const command = this.beginCommand(name);
    const result = forward();
    command.reverse = reverse;
    this.endCommand();
    return result;
  },

  undo() {
    let command;
    if (command = _history.pop()) {
      if (_logging) { console.log(`Undo command: ${command.name}`); }
      return command.reverse();
    }
  },

  once(key, fn) {
    if (_command) {
      return _command.oneTimeTasks[key] || (_command.oneTimeTasks[key] = fn);
    } else {
      return fn();
    }
  },

  log(method, time, args) {
    if (_command) {
      _command.log(method, time, args)
    }
  }
};
