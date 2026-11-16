# tads3js

A TypeScript implementation of the TADS 3 virtual machine. This runs compiled
TADS3 games (`.t3` files) in Node.js and in the browser.

## Requirements

- [Node.js](https://nodejs.org/)
- To compile a game: the TADS 3 author's kit `t3make` compiler

## Building

```
npm install
npx tsc
```

This compiles the VM into `build/`.

## Playing a game (terminal)

Any compiled TADS3 game should work. There is a small sample game in `/games/basic`. 
Compile it first to `.t3`:

```
t3make -f game.t3m
```

... then play it:

```
node build/Interpreter.js games/basic/game.t3
```

Options:

- `-i file` reads commands from a script file first. Each line must start with `>`
- `-norand` doesn't seed the random number generator, so that a game that uses random numbers behaves the same each time. That way, it can be fed a walkthrough for testing.
- `-html` presents the game as an HTML TADS interpreter (and you get TADS's ancient HTML support)

## Playing a game (browser)

```
npm run web
npm run serve
```

This builds the browser version and then starts a local web server at port 8080. 
Choose a `.t3` file, or open <http://localhost:8080/?game=games/basic/game.t3> to play the sample game.
you can suffix `&html` to the address to enable HTML TADS.

