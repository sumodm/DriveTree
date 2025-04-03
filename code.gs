function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Drive Tree')
    .addItem('Generate Tree', 'showForm')
    .addToUi();
}

function showForm() {
  var html = HtmlService.createHtmlOutputFromFile('form')
    .setWidth(600)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Drive Tree');
}

function generateDriveTreeFromForm(folderId, level, skipExtensions, skipFolders, showFiles) {
  var maxLevel = parseInt(level);
  if (isNaN(maxLevel)) {
    maxLevel = -1;
  }

  var extensions = skipExtensions.split(',').map(ext => ext.trim());
  var folders = skipFolders.split(',').map(folder => folder.trim());
  var showFilesBoolean = showFiles.toLowerCase() === 'true';

  generateDriveTree(folderId, maxLevel, extensions, folders, showFilesBoolean);
}

function generateDriveTree(rootFolderId, maxLevel, extensions, skipFolders, showFiles) {
  var folder;
  if(rootFolderId){
    try{
      folder = DriveApp.getFolderById(rootFolderId);
    } catch(e) {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getActiveSheet();
        sheet.clearContents();
        sheet.appendRow(["Invalid Folder ID"]);
        return;
    }

  } else {
    folder = DriveApp.getRootFolder();
  }

  var tree = getFolderTree(folder, "", maxLevel, 0, extensions, skipFolders, showFiles);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.clearContents();

  var header = "Drive Tree";
  if (maxLevel >= 0) {
    header += " (Level " + maxLevel + ")";
  }
  sheet.appendRow([header]);

  var treeLines = tree.split("\n");
  for (var i = 0; i < treeLines.length; i++) {
    sheet.appendRow([treeLines[i]]);
  }
}

function getFolderTree(folder, indent, maxLevel, currentLevel, extensions, skipFolders, showFiles) {
  if (maxLevel >= 0 && currentLevel > maxLevel) {
    return "";
  }

  var tree = "";
  var folders = folder.getFolders();
  var files = folder.getFiles();

  var folderArray = [];
  while (folders.hasNext()) {
    folderArray.push(folders.next());
  }

  var fileArray = [];
  while (files.hasNext()) {
    fileArray.push(files.next());
  }

  var totalItems = folderArray.length + fileArray.length;
  var currentItem = 0;

  for (var i = 0; i < folderArray.length; i++) {
    currentItem++;
    var subFolder = folderArray[i];
    var folderName = subFolder.getName();
    var valid_folder = true;
    for (var j = 0; j < skipFolders.length; j++) {
      if (folderName === skipFolders[j]) {
        valid_folder = false;
        break;
      }
    }

    if (valid_folder) {
      var isLastItem = (currentItem === totalItems);
      var branchChar = isLastItem ? "└──" : "├──";
      var nextIndent = indent + (isLastItem ? "│   " : "│   ");
      tree += indent + branchChar + "📂 " + folderName + " \n";
      tree += getFolderTree(subFolder, nextIndent, maxLevel, currentLevel + 1, extensions, skipFolders, showFiles);
    }
  }

  if(showFiles){
    for (var j = 0; j < fileArray.length; j++) {
      currentItem++;
      var file = fileArray[j];
      var valid_extension = true;
      for (var k = 0; k < extensions.length; k++) {
        if (file.getName().toLowerCase().endsWith(extensions[k].toLowerCase())) {
          valid_extension = false;
          break;
        }
      }
      if (valid_extension) {
        var isLastItem = (currentItem === totalItems);
        var branchChar = isLastItem ? "└──" : "├──";
        tree += indent + branchChar + "📄 " + file.getName() + " \n";
      }
    }
  }
  return tree;
}
