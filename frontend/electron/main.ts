import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  const preloadPath = isDev
    ? path.join(__dirname, "preload.js")
    : path.join(__dirname, "preload.js");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    titleBarStyle: "default",
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  if (!isDev) {
    autoUpdater.setFeedURL({
      provider: "github",
      owner: "your-username",
      repo: "fans-crm-test",
    });

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("checking-for-update", () => {
      console.log("Checking for update...");
    });

    autoUpdater.on("update-available", (info) => {
      console.log("Update available:", info.version);
      if (mainWindow) {
        mainWindow.webContents.send("update-available", info);
      }
    });

    autoUpdater.on("update-not-available", (info) => {
      console.log("Update not available:", info.version);
    });

    autoUpdater.on("error", (err) => {
      console.error("Error in auto-updater:", err);
    });

    autoUpdater.on("download-progress", (progressObj) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      console.log(logMessage);
      if (mainWindow) {
        mainWindow.webContents.send("download-progress", progressObj);
      }
    });

    autoUpdater.on("update-downloaded", (info) => {
      console.log("Update downloaded:", info.version);
      if (mainWindow) {
        mainWindow.webContents.send("update-downloaded", info);
      }
      setTimeout(() => {
        autoUpdater.quitAndInstall(false, true);
      }, 5000);
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
