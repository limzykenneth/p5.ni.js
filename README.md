# p5.js New Instance Mode (WIP)

[![pkg.pr.new](https://pkg.pr.new/badge/limzykenneth/p5.ni.js)](https://pkg.pr.new/~/limzykenneth/p5.ni.js)

This is a work in progress experiment on a new instance mode syntax of p5.js. **This is still in the early experiment and proposal stage and does not represent a definite future inclusion as part of core p5.js.**

## Usage

The main goal for this library is to enable use of global mode code in any environment such as ESM, JSX, Vue SFC, and others where namespace pollution is not desired, with minimal addition and no change to global mode code.

If you are using regular `<script>` tags, include the library after including p5.js in the `<head>` tag:

```html
<script src="./p5.js"></script>
<script src="./p5.ni.min.js"></script>
```

If you are using ESM, import the library and register is as an addon library:

```js
import p5 from "./p5.esm.js";
import { p5NewInstance } from "./p5.ni.esm.js";

p5.registerAddon(p5NewInstance);
```

After including the library in either methods above, you can write your p5 sketch as you would write global mode code, the main additions are that for each p5 functions or variables that you use, you need to import them through destructuring from `p5.globals` and you need to call `p5.create()` and passing an object of the p5 global functions you have defined (`setup`, `draw`, `mouseClicked`, etc):

```js
const { createCanvas, stroke, frameRate, rect, width, height } = p5.globals;

function setup() {
  createCanvas(720, 400);
  stroke(255);
  frameRate(30);
  fill("black");
  rect(width / 4, height / 4, width / 2, height / 2);
}

p5.create({ setup });
```

For more usage example, have a look at the examples in the `examples` folder. Detailed documentation will come after the API is tested and stable.

## Motivation

I chanced upon Anthony Fu's idea from a couple years ago: [p5i](https://github.com/antfu/p5i) _"p5.js, but with more friendly instance mode APIs"_, I would highly encourage you to start there in terms of the problems, ideas, and goals. In essence, the current way instance mode is defined in p5.js has a very different API as compared to global mode.

p5i's solution is quite elegant and crucially does not unncessarily pollutes the global namespace, because if it did, it would defeat the whole point of instance mode. There are however a few crucial areas that would be nice to address.

### 1. Keeping the global mode semantics

This essentially means that if at all possible, it would be great to avoid function parameter destructuring in p5.js user defined functions such as `setup()` and `draw()`.

```js
// p5i example (❌ does not work with this library)
// We want to avoid this
function setup({ createCanvas, stroke, frameRate }) {
  createCanvas(720, 400);
  stroke(255);
  frameRate(30);
}
```

While p5i has a way to address this:

```js
// p5i example (❌ does not work with this library)
const { mount, createCanvas, stroke, frameRate, background, line } = p5i();

function setup() {
  createCanvas(720, 400);
  stroke(255);
  frameRate(30);
}
```

This only works for functions and does not work for p5 variables such as `width` and `height`, which still needs to be destructured in function parameter. This also means that unless a p5 user defined function pass the values of these variables along, other custom functions will not have access to a reference of the variables.

@SableRaf puts it quite nicely on Discord when we discussed this idea:

> To me, the appeal of the approach would be to able to mostly keep my global mode code unchanged and add stuff above and below to use instance mode

### 2. Multiple instances

Unless we use function parameter destructuring, creating multiple instances with p5i can be tricky because the destructuring operation on `p5i()` is itself creating an instance, meaning that to have multiple instances, `p5i()` needs to be called multiple times with multiple copied of `createCanvas` etc, that needs to be renamed for each instance.

## Proposed solution

```js
const { createCanvas, stroke, frameRate, rect, width, height } = p5.globals;

function setup() {
  createCanvas(720, 400);
  stroke(255);
  frameRate(30);
  fill("black");
  rect(width / 4, height / 4, width / 2, height / 2);
}

p5.create({ setup });
```

The above example fulfills the requirement that it can use any existing global mode code and by adding code to the beginning and end, turns it into an instance mode sketch.

The `p5.globals` object can be destructured to get any members, both functions and variables including those added by other addons, to be used in any function in scope. The `p5.create` functions accepts an object with keys that correspond to any p5 user defined functions, including those defined by addons. In addition, `p5.create` can be called multiple times to create multiple instances, with either the same functions or different functions.

```js
const { createCanvas, stroke, frameRate, rect, width, height } = p5.globals;

function setup() {
  createCanvas(720, 400);
  stroke(255);
  frameRate(30);
  fill("black");
  rect(width / 4, height / 4, width / 2, height / 2);
}

function initialize() {
  createCanvas(200, 200);
  fill("grey");
  rect(0, 0, 100, 100);
}

p5.create({ setup }); // Instance 1
p5.create({ setup }); // Instance 2
p5.create({ setup: initialize }); // Instance 3 with different setup function
```

For detail technical explanation about how the library works, more documentation is to come, for now do checkout the source at `src/main.js`, it is quite short (less than 100 lines of effective code) although it does use some tricks which can be a bit confusing.

## Future work

Currently this implementation is quite early stage but it has been tested with many example sketches to prove that it works without issue, although some edge cases may still remain so more testing is required.

Another area of work is some quality of life issues such as attaching the created sketch to specific DOM nodes and some API namings.

Finally a further stretch goal is that as a sketch gets more and more complicated, the number of things that needs to be destructured from `p5.globals` can get unwieldy and a user need to remember to add entries to the destructuring list as they use additional p5 functions and variables. To alleviate this a bit, an LSP can be written for users to install that provides autocomplete suggestions that when chosen also adds the p5 member to the destructuring list automatically.

## Name?

The name of the library is WIP, `p5.ni.js` where `ni` simply stand for "**n**ew **i**nstance". It's not a good name but I'm not too bothered about it at this point.
