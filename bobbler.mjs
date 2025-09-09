#!/usr/bin/env node

/**
 * This tool converts a MAME input capture for 'bublbobl' and converts it for
 * use in 'boblbobl', which has a different number of ports, and remapped
 * inputs.
 * 
 * Nobody else is ever likely to need to do that, but this shows how the .inp
 * file format can be loaded, modified, and output.
 */

import { readFileSync, writeFileSync } from "fs";

import { decodeFromInpBuffer } from "./decode.mjs";
import { encodeToInpBuffer } from "./encode.mjs";

function bublToBobl(frame) {
  // It's not a comprehensive set, but it does what I need it to...
  // 2025-06-14: Original code expected 32-bit words but current implementation works on 8-bits.
  //   so quickly hacked the possibles but haven't checked anything. - Barthax.
  const left   = Boolean(frame.ports[3*4].value &  1);
  const right  = Boolean(frame.ports[3*4].value &  2);
  const coin1  = Boolean(frame.ports[2*4].value &  4);
  const jump   = Boolean(frame.ports[3*4].value & 16);
  const bubble = Boolean(frame.ports[3*4].value & 32);
  const start1 = Boolean(frame.ports[3*4].value & 64);

  return {
    ...frame,
    ports: [
    	// 2025-06-14: Change the original .default to .value & add the other 24-bits. - Barthax.
      { value: 254},{ value: 0 },{ value: 0 },{ value: 0 },
      { value:  63},{ value: 0 },{ value: 0 },{ value: 0 },
      { value: 243},{ value: 0 },{ value: 0 },{ value: 0 },
        | (left   ?  1 : 0)
        | (right  ?  2 : 0)
        | (coin1  ?  8 : 0)
        | (bubble ? 32 : 0)
        | (jump   ? 16 : 0)
        | (start1 ? 64 : 0)
      },
      { default: 255, value: 0 },
    ]
  };
}

if (process.argv.length !== 4) {
  console.error("Use with two arguments:");
  console.error(" - a filename for a bublbobl .inp");
  console.error(" - an output filename for a boblbobl .inp");
  process.exit(-1);
}

const [,, inFilename, outFilename] = process.argv;

console.log(`Converting ${inFilename}...`);
const bubl = decodeFromInpBuffer(readFileSync(inFilename));

writeFileSync(
  outFilename,
  encodeToInpBuffer({
    header: {
      magic: Buffer.from([0x4d, 0x41, 0x4d, 0x45, 0x49, 0x4e, 0x50, 0x00]),
      basetime: 1725841038n,
      majVersion: 3,
      minVersion: 0,
      reserved: 28029,
      sysName: 'boblbobl\x00\x00\x00\x00',
      appDesc: 'MAME 0.269 (mame0269-dirty)\x00\x00\x00\x00\x00',
    },    
    frames: bubl.frames.map(bublToBobl),
  })
);

console.log("Success: created", outFilename);
