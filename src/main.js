export function p5NewInstance(p5, fn, lifecycles) {
  function wrapP5Promise(result, instance) {
    if (result && result.then) {
      return result.then((val) => {
        // If someone `await`ed the original promise and
        // another instance did some work first, the active
        // instance variable may have been reset. Put it back
        // before running any more code.
        p5.create.instance = instance;
        return val;
      });
    } else {
      return result;
    }
  }

  p5.globals = {};

  p5.create = function (funcs, el) {
    p5.instance = true;
    new p5(function (p) {
      for (const k in funcs) {
        p[k] = function () {
          p5.create.instance = p;
          let result = funcs[k]();
          return wrapP5Promise(result, p);
        };
      }
    }, el);
  };

  class Placeholder {
    constructor(label) {
      this.label = label;
    }

    valueOf() {
      return p5.create.instance[this.label];
    }

    // Duplicate valueOf with a different name to avoid violating invariant
    get value() {
      return p5.create.instance[this.label];
    }
  }

  for (const k in p5.prototype) {
    // Skip internals
    if (k.startsWith("_")) continue;

    if (typeof p5.prototype[k] === "function") {
      p5.globals[k] = function (...args) {
        args = args.map((arg) => {
          if (arg instanceof Placeholder) {
            return arg.value;
          } else {
            return arg;
          }
        });
        const instance = p5.create.instance;
        const result = Reflect.apply(p5.prototype[k], p5.create.instance, args);
        return wrapP5Promise(result, instance);
      };
    } else if (k === "mouseButton" || k === "touches") {
      p5.globals[k] = new Proxy(new Placeholder(k), {
        get(target, prop) {
          if (prop === "value") {
            return Reflect.get(target, prop);
          } else {
            return Reflect.get(p5.create.instance.pixels, prop);
          }
        },
      });
    } else {
      p5.globals[k] = new Placeholder(k);
    }
  }

  // This is manually attached because class getters are not attached
  // to the prototype and so won't be available on iteration
  p5.globals.pixels = new Proxy(new Placeholder("pixels"), {
    get(target, prop) {
      if (prop === "value") {
        return Reflect.get(target, prop);
      } else {
        return Reflect.get(p5.create.instance.pixels, prop);
      }
    },
    set(target, prop, value) {
      Reflect.set(p5.create.instance.pixels, prop, value);
    },
  });
}

if (typeof p5 !== "undefined") {
  p5.registerAddon(p5NewInstance);
}
