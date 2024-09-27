import { deflateSync } from "node:zlib";

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

/**
 * Encodes an abstract representation of a MAME captured inputs sequence to
 * a Buffer for an .inp file
 */
export function encodeToInpBuffer(obj) {
  const header = Buffer.from(new Array(OFFS_END).fill(0));

  for (let i = 0; i < OFFS_BASETIME; i++) header[OFFS_MAGIC + i] = obj.header.magic[i];
  header.writeBigInt64LE(BigInt(obj.header.basetime), OFFS_BASETIME);
  header.writeUInt8(obj.header.majVersion, OFFS_MAJVERSION);
  header.writeUInt8(obj.header.minVersion, OFFS_MINVERSION);
  header.writeUInt16LE(obj.header.reserved, OFFS_RESERVED);
  header.write(obj.header.sysName, OFFS_SYSNAME, OFFS_APPDESC - OFFS_SYSNAME);
  header.write(obj.header.appDesc, OFFS_APPDESC, OFFS_END - OFFS_APPDESC);
  
  const frames = obj.frames.map(
    ({timestamp, speed, ports}) => {
      const seconds = Number(timestamp / 1000000000000000000n);
      const attoseconds = timestamp % 1000000000000000000n;

      const frameHeaderBuffer = Buffer.alloc(16);

      frameHeaderBuffer.writeUInt32LE(seconds, 0);
      frameHeaderBuffer.writeBigInt64LE(attoseconds, 4);
      frameHeaderBuffer.writeUInt32LE(speed, 12);

      const portsBuffers = ports.map(
        (port) => {
          const portBuffer = Buffer.from(new Array(8).fill(0));
          portBuffer.writeUInt32LE(port.default, 0);
          portBuffer.writeUInt32LE(port.value, 4);
          return portBuffer;
        }
      );

      return Buffer.concat([frameHeaderBuffer, ...portsBuffers]);
    }
  );

  return Buffer.concat([
    header,
    deflateSync(Buffer.concat(frames))
  ]);
}
