# mameInpFileTools

This repository contains tools for manipulating [MAME](https://www.mamedev.org/)
`.inp` captured-input files, generated using the `-record` command-line option.

The tools are implemented in JavaScript, for use under [Node.js](https://nodejs.org/).
They require no external dependencies.


## Unwrinkler

If, while playing a game in MAME with input recording enabled, you perform a
save-state restore (F7), the resulting `.inp` file will choke on playback, with
MAME reporting `Playback Ended`, `Reason: Out of sync` at the moment the first
restore takes place.

The `unwrinkle.mjs` script is a tool that fixes such files by removing input log
entries rendered moot by the restore, creating an `.inp` file that can continuously
play back.

To use, install Node.js on a Unix-like environment, and run:

    ./unwrinkle.mjs (input filename) [optional output filename]


## Decoding, manipulating, and encoding

If you want to create your own tools for manipulating `.inp` files, you might
find these source files useful:

* `decode.mjs` exports a function that parses a `Buffer` into an abstract
  representation.
* `encode.mjs` exports a function that creates a `Buffer`, using the same
  abstract representation as the decoder.

There’s also `bobbler.mjs` which shows how the encoder/decoder can be used to
convert inputs specific to one game into ones usable by an otherwise
incompatible game.


## Compatibility

* `.inp` files tested on MAME v0.269, under macOS
* JavaScript tested on Node.js v18.15.0


## License

The files in this repository are in the public domain.
