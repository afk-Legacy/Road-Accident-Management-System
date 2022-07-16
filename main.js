// import electron
const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog  } = electron;
const path = require('path');
const url = require('url');
const fs = require('fs');

// Create a window
let mainWindow;
let modal;
let dbConnection;

// function to create window
function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        resizable: false,
        fullscreenable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
}

// function to load the index.html file
function loadPage(window, fileName) {
    // Load the index.html file

    window.loadURL(url.format({
        pathname: path.join(__dirname, fileName),
        protocol: 'file:',
        slashes: true
    }));

    window.once('ready-to-show', () => {
        window.show()
      })
}

// Show the window when it is ready
app.on('ready', function () {
    createWindow();
    loadPage(mainWindow, 'html/home.html');
    mainWindow.webContents.send("init-db");
}
);

ipcMain.on('open-modal', function (event, elementID, table) 
{
    if (modal)
        BrowserWindow.getFocusedWindow().close();

    modal = new BrowserWindow({
        parent: mainWindow,
        center: true,
        modal: true,
        frame: false,
        show: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    switch (elementID)
    {
        case 'signup':
            modal.setSize(622, 450);
            loadPage(modal, 'html/signup_1.html');
            break;
        
        case 'signup-police':
            modal.setSize(497, 380);
            loadPage(modal, 'html/signup_police.html');
            break;
        
        case 'signup-res':
            modal.setSize(497, 380);
            loadPage(modal, "html/signup_res.html");
            break;

        case 'crud-query-init':
            modal.setSize(497, 700);
            loadPage(modal, "html/crud-" + table + ".html");
            break;

        case 'about':
            modal.setSize(497, 700);
            loadPage(modal, "html/about.html");
            break;

        case 'login':
            modal.setSize(497, 700);
            loadPage(modal, "html/login.html");
            break;

        default:
            break;
    }
    
    // set to null
    modal.on('close', () => {
        modal = null;
    });
    
    // set to null
    modal.on('closed', () => {
        modal = null;
    });

    modal.center();
}
);

ipcMain.on('login', function(event, element)
{
    loadPage(mainWindow, 'html/main.html');
});

ipcMain.on('query-failed', function(event, msg)
{
    dialog.showMessageBox(modal, {
        title: 'Query Failed',
        buttons: ['OK'],
        type: 'warning',
        message: msg,
       });
});

ipcMain.on('query-success', function(event, msg)
{
    dialog.showMessageBox(modal, {
        title: 'Query Success',
        type: 'info',
        buttons: ['OK'],
        message: msg,
       });
});

ipcMain.on('login', function(event, type)
{ 
    BrowserWindow.getFocusedWindow().close();
    if ((type + "").includes("Police"))
        loadPage(mainWindow, 'html/main.html');
    else 
        loadPage(mainWindow, 'html/main_res.html');
});
