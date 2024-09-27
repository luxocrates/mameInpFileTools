import { unzipSync } from "node:zlib";

import {
  OFFS_MAGIC,
  OFFS_BASETIME,
  OFFS_MAJVERSION,
  OFFS_MINVERSION,
  OFFS_APPDESC,
  OFFS_RESERVED,
  OFFS_SYSNAME,
  OFFS_END,
} from "./header.mjs";

function decompressFrames(fileBuffer) {
  return unzipSync(fileBuffer.subarray(OFFS_END));
}

function frameSizeForPorts(ports) {
  // Each frame structure has a 16-byte header, then two u32's for each port
  return 16 + (ports * 8);
}

function timestampFromFrameBuffer(buffer) {
  const secs = buffer.readUInt32LE(0);
  const attos = buffer.readBigUInt64LE(4);
  return BigInt(secs) * 1000000000000000000n + attos;
}

/**
 * MAME's file format for a captured input sequence doesn't reference how many
 * input ports exist for each frame. MAME itself doesn't need it (it should be
 * constant for the game), but we can't do any manipulation without knowing it.
 * 
 * This routine guesses what that number was by interpreting the timestamps
 * that would result from different candidate values, and returning the lowest
 * number under which the first five frames would show monotonically ascending
 * timestamps.
 * 
 * Given that the timestamps are 12 bytes long, it's not that likely to happen
 * by accident. 
 */
function guessNumPorts(framesBuffer) {
  for (let guess = 1;; guess++) {
    const portSize = frameSizeForPorts(guess);
    let lastTimestamp = -1n;
    let fail = false;

    for (let frame = 0; frame < 5; frame++) {
      const frameBuffer = framesBuffer.subarray(
        frame * portSize,
        ((frame + 1) * portSize)
      );

      const timestamp = timestampFromFrameBuffer(frameBuffer);

      // We could do better than this, for example checking that there's a
      // constant delta between frames, and we could check that the default
      // values of the ports remains constant (why are they even there?)
      if (timestamp <= lastTimestamp) {
        fail = true;
        break;
      }

      lastTimestamp = timestamp;
    }

    if (!fail) return guess;
  }
}

function decodeFrameBuffer(frameBuffer, numPorts) {
  const portsBuffer = frameBuffer.subarray(16);

  return {
    timestamp: timestampFromFrameBuffer(frameBuffer),
    speed: frameBuffer.readUInt32LE(12),
    ports: new Array(numPorts).fill(0).map(
      (_, i) => ({
        default: portsBuffer.readUInt32LE((i * 8) + 0),
        value: portsBuffer.readUInt32LE((i * 8) + 4),
      })
    ),
  }
}

/**
 * Decodes a Buffer contatining a MAME captured inputs sequence .inp file,
 * storing it in an abstract representation suitable for manipulation.
 */
export function decodeFromInpBuffer(fileBuffer) {
  const framesBuffer = decompressFrames(fileBuffer);
  const numPorts = guessNumPorts(framesBuffer);
  const frameSize = frameSizeForPorts(numPorts);

  const res = {
    meta: {
      numPorts,
    },
    header: {
      magic: fileBuffer.subarray(OFFS_MAGIC, OFFS_BASETIME),
      basetime: fileBuffer.readBigUInt64LE(OFFS_BASETIME),
      majVersion: fileBuffer.readUInt8(OFFS_MAJVERSION),
      minVersion: fileBuffer.readUInt8(OFFS_MINVERSION),
      reserved: fileBuffer.readUInt16LE(OFFS_RESERVED),
      sysName: fileBuffer.subarray(OFFS_SYSNAME, OFFS_APPDESC).toString(),
      appDesc: fileBuffer.subarray(OFFS_APPDESC, OFFS_END).toString(),
    },
    frames: [],
  };

  if (res.header.majVersion !== 3) {
    console.warn("Input file major version isn't 3. All bets are off.");
  }

  for (
    let frameStartOffset = 0;
    (frameStartOffset + frameSize) <= framesBuffer.length;
    frameStartOffset += frameSize
  ) {    
    res.frames.push(
      decodeFrameBuffer(
        framesBuffer.subarray(
          frameStartOffset,
          frameStartOffset + frameSize,
        ),
        numPorts
      )
    );
  }
  return res;
}
