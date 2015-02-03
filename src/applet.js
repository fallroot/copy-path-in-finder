ObjC.import('Cocoa');

var PathType = ['UNIX', 'Windows', 'Terminal', 'URL'];

var Finder;
var window;
var label;
var matrix;
var button;
var finalPath;
var appDelegate;

function run() {
    initFinder();
    createWindow();
    createMatrix();
    createLabel();
    createButton();
    delegateEvents();
    activateWindow();
}

function initFinder() {
    Finder = Application('com.apple.finder');
    Finder.includeStandardAdditions = true;
}

function createWindow() {
    window = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
        $.NSMakeRect(0, 0, 300, 200),
        $.NSTitledWindowMask,
        $.NSBackingStoreBuffered,
        false
    );

    window.title = 'Copy Path in Finder';
    window.center;
}

function createMatrix() {
    var prototype = $.NSButtonCell.alloc.init;

    prototype.title = 'Copy Path';
    prototype.buttonType = $.NSRadioButton;

    matrix = $.NSMatrix.alloc.initWithFrameModePrototypeNumberOfRowsNumberOfColumns(
        $.NSMakeRect(20, 100, 260, 80),
        $.NSRadioModeMatrix,
        prototype,
        PathType.length,
        1
    );

    window.contentView.addSubview(matrix);

    var cells = matrix.cells;

    for (var i = 0, length = matrix.numberOfRows; i < length; ++i) {
        var cell = cells.objectAtIndex(i);
        cell.title = PathType[i];
        cell.tag = i;
    }

    prototype.release;
    matrix.release;
}

function createLabel() {
    label = $.NSTextField.alloc.initWithFrame(
        $.NSMakeRect(20, 60, 260, 40)
    );

    label.bezeled = false;
    label.drawsBackground = false;
    label.editable = false;

    window.contentView.addSubview(label);
}

function createButton() {
    button = $.NSButton.alloc.initWithFrame(
        $.NSMakeRect(20, 20, 260, 32)
    );

    button.bezelStyle = $.NSRoundedBezelStyle;
    button.buttonType = $.NSMomentaryLightButton;
    button.title = 'Copy Path';

    window.contentView.addSubview(button);
}

function delegateEvents() {
    ObjC.registerSubclass({
        name: 'AppDelegate',
        methods: {
            'findSelected': {
                types: ['void', ['id']],
                implementation: function(sender) {
                    makePath(sender.selectedCell.tag);
                }
            },

            'copyPath': {
                types: ['void', ['id']],
                implementation: function(sender) {
                    Finder.setTheClipboardTo(finalPath);
                    Application.currentApplication().quit();
                }
            }
        }
    });

    appDelegate = $.AppDelegate.alloc.init;

    matrix.target = appDelegate;
    matrix.action = 'findSelected';

    button.target = appDelegate;
    button.action = 'copyPath';
}

function activateWindow() {
    window.makeKeyAndOrderFront(window);
    makePath(0);
}

function makePath(type) {
    var selection = Finder.selection();
    var path;

    if (selection.length) {
        var urls = selection.map(function(file) {
            return file.url();
        });

        path = urls.join('\r');
    } else {
        try {
            path = Finder.windows.at(0).target().url();
        } catch(e) {
            Finder.displayAlert('Invalid Path', {
                as: 'critical',
                message: 'Select valid folder(s) or file(s)'
            });

            Application.currentApplication().quit();
        }
    }

    switch (parseInt(type)) {
        case 0:
            path = decodeURI(path);
            path = removeFileHost(path);
            break;

        case 1:
            path = decodeURI(path);
            path = removeFileHost(path);
            path = replaceSeparator(path, '\\');
            break;

        case 2:
            path = decodeURI(path);
            path = removeFileHost(path);
            path = replaceSpace(path, '\\ ');
            path = escapeSpecialCharacters(path);

            break;

        case 3:
            break;
    }

    label.stringValue = finalPath = path;
}

function removeFileHost(url) {
    return url.replace(/^file:\/\//gm, '');
}

function replaceSeparator(path, separator) {
    return path.replace(/\//g, separator);
}

function replaceSpace(path, character) {
    return path.replace(/ /g, character || ' ');
}

function escapeSpecialCharacters(path) {
    return path.replace(/!/g, '\\!')
               .replace(/\$/g, '\\$')
               .replace(/&/g, '\\&')
               .replace(/\*/g, '\\*')
               .replace(/\(/g, '\\(')
               .replace(/\)/g, '\\)');
}
