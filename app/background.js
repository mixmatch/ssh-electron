// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, BrowserWindow } from 'electron';
import devHelper from './vendor/electron_boilerplate/dev_helper';
import windowStateKeeper from './vendor/electron_boilerplate/window_state';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import busboy from 'connect-busboy';
import httpProxy from 'http-proxy';
import fs from 'fs';
import cp from 'child_process';
import sequest from 'sequest';
var settings = require(__dirname + "/settings.json");
var spawn = cp.spawn;
var exec = cp.exec;
var Writable = require('stream').Writable;

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';


//
var nodeServerIP = '127.0.0.1';
var oneSecond = 1000;
var oneMinute = 60 * oneSecond;
var oneHour = 60 * oneMinute;
var oneDay = 24 * oneHour;
//
// express && socket.io connection
var expressApp = express();
var server = require('http').Server(expressApp);
var io = require('socket.io')(server);
server.listen(3000, nodeServerIP);
expressApp.use(bodyParser.json());
expressApp.use(compression());
expressApp.use(busboy());
expressApp.use(express.static(__dirname + "/public", {maxAage: oneSecond}));
expressApp.use(express.static(__dirname + "/stylesheets", {maxAage: oneSecond}));
expressApp.use(express.static(__dirname + "/bower_components", {maxAage: oneSecond}));
expressApp.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});


io.on('connection', function (socket) {
  // ssh connection
  var sshOptions = {
    port: settings.port,
  };
  if (settings.privateKey){
    fs.access(settings.privateKey, fs.R_OK, (err) => {
      if (err) {
        
        return console.log(err);
      }
      sshOptions.privateKey = fs.readFileSync(settings.privateKey);
    });
  }
  var seq = sequest(settings.username + "@" + settings.host, sshOptions);
  var output = Writable();
  output._write = function (chunk, enc, next) {
    console.log(chunk.toString());
    socket.emit('output', chunk.toString());
    next();
  };
  // console.log(seq);
  seq.pipe(output);
  socket.emit('settings', settings);
  socket.on('command', function (data) {
    console.log(data);
    // console.log(seq);
    seq.write(data);
  });
  socket.on('settings', function (data) {
    console.log(data);
    // console.log(seq);
    settings = data;
    socket.emit('settings', settings);
    fs.writeFile(__dirname + "/settings.json", JSON.stringify(settings), function (err) {
      if (err) return console.log(err);
      // console.log(JSON.stringify(settings));
    });
  });
});

var mainWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

app.on('ready', function () {

    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height
    });

    if (mainWindowState.isMaximized) {
        mainWindow.maximize();
    }

    if (env.name === 'test') {
        mainWindow.loadURL('file://' + __dirname + '/spec.html');
    } else {
        mainWindow.loadURL('http://localhost:3000/');
    }

    if (env.name !== 'production') {
        devHelper.setDevMenu();
        mainWindow.openDevTools();
    }

    mainWindow.on('close', function () {
        mainWindowState.saveState(mainWindow);
    });
});

app.on('window-all-closed', function () {
    app.quit();
});
