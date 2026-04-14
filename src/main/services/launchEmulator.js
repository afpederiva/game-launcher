'use strict';

const { spawn } = require('child_process');

function splitArgs(argString) {
  if (!argString) return [];

  const args = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < argString.length; i++) {
    const ch = argString[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && /\s/.test(ch)) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) args.push(current);
  return args;
}

function launchEmulator({ executablePath, launchArguments, romPath }) {
  const path = require('path');
  if (!executablePath) {
    // If there is no emulator, run the ROM directly (for example, PC ports).
    const cwd = path.dirname(romPath);
    const child = spawn(romPath, [], {
      windowsHide: false,
      detached: true,
      stdio: 'ignore',
      cwd,
    });
    child.unref();
    return;
  }
  const extra = splitArgs(launchArguments);
  const args = [...extra, romPath];
  const cwd = path.dirname(executablePath);
  const child = spawn(executablePath, args, {
    windowsHide: false,
    detached: true,
    stdio: 'ignore',
    cwd,
  });
  child.unref();
}

module.exports = {
  launchEmulator,
  splitArgs,
};
