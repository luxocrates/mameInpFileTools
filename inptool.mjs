#!/usr/bin/env node

// Extract header information to .txt file and each frame as CSV information to .csv file.
// Caution!! Overwrites previous files without question.

import { readFileSync, writeFileSync } from "fs";

import { RECSPEEDMODIFER } from "./header.mjs";
import { decodeFromInpBuffer } from "./decode.mjs";
import { encodeToInpBuffer } from "./encode.mjs";

const DEFAULT_OUT_FILENAME = "inptool.csv";

function main(inFilename, outFilename) {
	const file = readFileSync(inFilename);
	const parsed = decodeFromInpBuffer(file);

	const frames = [];
	let frameCount = 1;
	let txt = outFilename + ".txt";
	let csv = outFilename + ".csv";

	let header ='Examining file ' + inFilename;
	header += '\nFrame Payload Len.: ' + parsed.meta.numPorts;
	header += '\nINP Magic         : ' + parsed.header.magic.toString();
	const dateObject = new Date(Number(parsed.header.basetime * 1000n));
	header += '\nBase Time         : ' + dateObject.toString();
	header += '\nINP Major Version : ' + parsed.header.majVersion;
	header += '\nINP Minor Version : ' + parsed.header.minVersion;
	header += '\nReserved          : ' + parsed.header.reserved;
	header += '\nSystem/ROM Set    : ' + parsed.header.sysName;
	header += '\nApplication Descr.: ' + parsed.header.appDesc;
	header += '\nNumber of Frames  : ' + parsed.frames.length;
 	writeFileSync(txt,header);
	console.log(header);

	let ports="Frame,Second,Timestamp,RecordedSpeed,";
	for (let port = 0; port < parsed.meta.numPorts; port++) {
		ports+="Byte"+port+",";
	}
	ports = ports.substr(0, ports.length-1);
 	writeFileSync(csv,ports+'\n');

	let minSpeed = undefined;
	let minSpeedFrame = -1;
	let maxSpeed = 0;
	let maxSpeedFrame = -1;
	for (const frame of parsed.frames) {
		ports="";
		// Decode each frame in turn to CSV format
		for (const port of frame.ports) {
			ports+=port.value.toString()+",";
		}
		ports = ports.substr(0, ports.length-1);
		ports = frameCount + "," + Number(frame.timestamp / 1000000000000000000n) + "," + frame.timestamp + "," + frame.speed / RECSPEEDMODIFER + "," + ports;
//		console.log(ports);
		ports += "\n";
	 	writeFileSync(csv,ports, { flag: 'a+'});
	 	frames.push({ frame: frameCount,
	 		speed: frame.speed});
	 	if ((minSpeed == undefined || minSpeed > frame.speed)) {
	 		minSpeed = frame.speed;
	 		minSpeedFrame = frameCount;
	 	}
	 	if (maxSpeed < frame.speed) {
	 		maxSpeed = frame.speed;
	 		maxSpeedFrame = frameCount;
	 	}
		frameCount++;
	}
	header = '\nLowest Speed      : ' + (minSpeed / RECSPEEDMODIFER) + ' (frame ' + minSpeedFrame + ')';
	header += '\nMax Speed         : ' + (maxSpeed / RECSPEEDMODIFER) + ' (frame ' + maxSpeedFrame + ')';
	header += '\n';
 	writeFileSync(txt,header, {flag: 'a+'});
	console.log(header);

	// Count the frames at each speed.
	frames.sort( (a, b) => a.speed - b.speed );
	let count = 0;
	let curValue = -1;
	header = 'Frame counts per speed';
 	writeFileSync(txt,'\n'+header, {flag: 'a+'});
	for (const frame of frames) {
		if (frame.speed !== curValue) {
			if (count > 0) {
				header = curValue / RECSPEEDMODIFER + ': ' + count;
			 	writeFileSync(txt,'\n'+header, {flag: 'a+'});
				count = 1;
			}
			count = 1;
			curValue = frame.speed;
		} else {
			count ++;
		}
	}
	header = curValue / RECSPEEDMODIFER + ': ' + count;
 	writeFileSync(txt,'\n'+header, {flag: 'a+'});

	console.log("Success! Reported " + (--frameCount) +" frames to", outFilename, "(csv/txt)");
}

if (process.argv.length < 3 || process.argv.length > 4) {
  console.error("Error: need input filename (output filename is optional)");
  process.exit(1);
}

main(process.argv[2], process.argv[3] || process.argv[2]);
