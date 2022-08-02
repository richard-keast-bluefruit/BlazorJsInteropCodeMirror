
window.codemirror = {
    create: function (textArea, code) {

        var cm = CodeMirror.fromTextArea(textArea, {
            lineNumbers: true,
            tabSize: 2,
            gutter: true,
            lineWrapping: true
        });
        cm.mode = { name: "gherkin", json: true };
        cm.setValue(code);
        cm.setSize("100%", "100%");
        cm.on('change', (editor, changeObj) => {
            console.log("origin: " + changeObj.origin);
            console.log("from: line " + changeObj.from.line + " ch " + changeObj.from.ch);
            console.log("to: line " + changeObj.to.line + " ch " + changeObj.to.ch);
            if (changeObj.origin !== "setValue") {
                var errors = this.saveTextFromJs(editor.getValue()).then(message => {
                    console.log(message);
                    return message;
                });
            }
        });

        textArea.cm = cm;
        return new Promise(() => { });
    },

    saveTextFromJs: function (text) {
        return DotNet.invokeMethodAsync("BlazorJsInteropCodeMirror", "UpdateFeatureFile", text);
    },

    updateCodeMirror: function (textArea, code) {
        var cursor = textArea.cm.doc.getCursor();
        textArea.cm.doc.setValue(code);
        textArea.cm.doc.setCursor(cursor);
    },

    getValue: function (textArea) {
        return textArea.cm.doc.getValue();
    }
};

