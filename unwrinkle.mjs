#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";

import { decodeFromInpBuffer } from "./decode.mjs";
import { encodeToInpBuffer } from "./encode.mjs";

const DEFAULT_OUT_FILENAME = "unwrinkled.inp";

function main(inFilename, outFilename) {
  const file = readFileSync(inFilename);
  const parsed = decodeFromInpBuffer(file);

  let lastFrameTimestamp = 0n;
  const frames = [];
  let patches = 0;

  for (const frame of parsed.frames) {
    if (frame.timestamp < lastFrameTimestamp) {
      // The new frame is going back in time. Start popping frames off the 
      // stack, and don't stop until its top frame is earlier than the one we're
      // trying to push.
      while (frame.timestamp <= frames[frames.length - 1].timestamp) {
        frames.pop();
      }
      patches++;
    }

    frames.push(frame);
    lastFrameTimestamp = frame.timestamp;
  }

  writeFileSync(
    outFilename,
    encodeToInpBuffer({
      ...parsed,
      frames,
    })
  );

  console.log("Success! Wrote to", outFilename, "with", patches, "patches");
}

if (process.argv.length < 3 || process.argv.length > 4) {
  console.error("Error: need input filename (output filename is optional)");
  process.exit(1);
}

main(process.argv[2], process.argv[3] || DEFAULT_OUT_FILENAME);
