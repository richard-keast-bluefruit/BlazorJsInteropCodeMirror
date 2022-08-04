export function createCodeMirrorFromTextArea(textArea, text) {
    var widgets = [];
    var timeoutId;
    var codeMirror = CodeMirror.fromTextArea(textArea, {
        lineNumbers: true,
        tabSize: 2,
        gutter: true,
        lineWrapping: true
    });
    codeMirror.mode = { name: "gherkin", json: true };
    codeMirror.setValue(text);
    codeMirror.setSize("100%", "100%");
    codeMirror.on('change', (editor, changeObj) => {
        if (changeObj.origin !== "setValue") {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => updateErrorWidgets(editor, widgets), 500);
        }
    });
    textArea.codeMirror = codeMirror;
}

export function getEditorText(textArea) {
    return textArea.codeMirror.doc.getValue();
}

export function setEditorText(textArea, text) {
    var cursor = textArea.codeMirror.doc.getCursor();
    textArea.codeMirror.doc.setValue(text);
    textArea.codeMirror.doc.setCursor(cursor);
}

function updateErrorWidgets(editor, widgets) {
    checkFeatureFileForErrorsOnServer(editor.getValue())
        .then((errors) => processErrors(errors, editor, widgets));
}

function processErrors(errors, editor, widgets) {
    var lineNumbers = [];
    var errorMessages = [];
    var errorLines = errors.split('\n');
    for (var i = 0; i < errorLines.length; i++) {
        var [lineNumber, message] = errorLines[i].split(":::");
        lineNumbers.push(lineNumber);
        errorMessages.push(message);
    }
    editor.operation(function () {
        removeExistingWidgets(editor, widgets);
        for (var i = 0; i < lineNumbers.length; ++i) {
            if (lineNumbers[i] == "") {
                continue;
            }
            var widget = createWidget(errorMessages[i]);
            widgets.push(
                editor.addLineWidget(lineNumbers[i] - 1, widget, { coverGutter: false, noHScroll: true }));
        }
    });
}

function removeExistingWidgets(editor, widgets) {
    for (var i = 0; i < widgets.length; ++i) {
        editor.removeLineWidget(widgets[i]);
    }
    widgets.length = 0;
}

function checkFeatureFileForErrorsOnServer(text) {
    return DotNet.invokeMethodAsync("BlazorJsInteropCodeMirror", "CheckFeatureFileForErrors", text);
}

function createWidget(message) {
    var widget = document.createElement("div");
    var icon = widget.appendChild(document.createElement("span"));
    icon.innerHTML = "!";
    icon.className = "error-icon";
    widget.appendChild(document.createTextNode(message));
    widget.className = "error";

    return widget;
}

