// From MAME sources:
export const OFFS_MAGIC       = 0x00;    // 0x08 bytes
export const OFFS_BASETIME    = 0x08;    // 0x08 bytes (little-endian binary integer)
export const OFFS_MAJVERSION  = 0x10;    // 0x01 bytes (binary integer)
export const OFFS_MINVERSION  = 0x11;    // 0x01 bytes (binary integer)
export const OFFS_RESERVED    = 0x12;    // 0x02 bytes reserved
export const OFFS_SYSNAME     = 0x14;    // 0x0c bytes (ASCII)
export const OFFS_APPDESC     = 0x20;    // 0x20 bytes (ASCII)
export const OFFS_END         = 0x40;

// See ioport.cpp in the MAME sources for the C++ encoding algorithm

// Human-readable speed recorded in the file is 100 * the curspeed calculated.  This is stored in the INP file as curspeed / 1048576:
// 		rec_speed = curspeed / double(1 << 20);
// So the human-readable speed in the file is divided by (1048576 / 100).
export const RECSPEEDMODIFER = 1048576 / 100;
