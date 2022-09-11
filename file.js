'use strict';
const fs = require('fs');

const renameFile = (path, newPath) => new Promise((res, rej) => {
  fs.rename(path, newPath, (err, data) => (err
    ? rej(err)
    : res(data)));
});

exports.renameFile = renameFile;

const copyFile = (path, newPath, flags) => new Promise((res, rej) => {
  const readStream = fs.createReadStream(path);
  const writeStream = fs.createWriteStream(newPath, { flags });

  readStream.on('error', rej);
  writeStream.on('error', rej);
  writeStream.on('finish', res);
  readStream.pipe(writeStream);
});

exports.copyFile = copyFile;

const unlinkFile = (path) => new Promise((res, rej) => {
  fs.unlink(path, (err, data) => (err
    ? rej(err)
    : res(data)));
});

exports.unlinkFile = unlinkFile;

const moveFile = (path, newPath, flags) => renameFile(path, newPath)
  .catch((e) => {
    if (e.code !== 'EXDEV') { throw new e(); } else {
      return copyFile(path, newPath, flags)
        .then(() => unlinkFile(path));
    }
  });

exports.moveFile = moveFile;

const accesssyncdir = function (dir, log) {
  try {
    fs.accessSync(dir, fs.constants.F_OK | fs.constants.W_OK);
  } catch (err) {
    try {
      fs.mkdirSync(dir);
    } catch (er) {
      if (log){
        log.error(er);
      }
    }
  }
};

exports.accesssyncdir = accesssyncdir;

exports.createReadStream = fs.createReadStream;
exports.readFileSync = fs.readFileSync;
