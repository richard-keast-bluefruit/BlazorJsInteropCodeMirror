using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Gherkin;

namespace BlazorJsInteropCodeMirror.Components
{
    public class EditFeatureFileBase : ComponentBase, IAsyncDisposable
    {
        [Inject] public IJSRuntime JSRuntime { get; set; }
        [Parameter] public string FeatureFileText { get; set; } = "";
        [Parameter] public EventCallback<string> OnSave { get; set; }
        private IJSObjectReference _editFeatureFileJsModule;
        protected ElementReference _codeMirrorTextArea;
        
        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                _editFeatureFileJsModule = 
                    await JSRuntime.InvokeAsync<IJSObjectReference>("import", 
                        "./Components/EditFeatureFile.razor.js");

                await _editFeatureFileJsModule.InvokeVoidAsync("createCodeMirrorFromTextArea", _codeMirrorTextArea, FeatureFileText);
            }
            else
            {
                await _editFeatureFileJsModule.InvokeVoidAsync("setEditorText", _codeMirrorTextArea, FeatureFileText);
            }
        }


        public async void SaveFeatureFile()
        {
            var featureFileToSave = await _editFeatureFileJsModule.InvokeAsync<string>("getEditorText", _codeMirrorTextArea);
            await OnSave.InvokeAsync(featureFileToSave);
        }

        [JSInvokable]
        public static string CheckFeatureFileForErrors(string updatedFeature)
        {
            var gherkinParsingErrors = "";
            var parser = new Gherkin.Parser();
            try
            {
                var textReader = new StringReader(updatedFeature);
                var gherkinDocument = parser.Parse(textReader);
            }
            catch (CompositeParserException e)
            {
                gherkinParsingErrors = FormatErrors(e.Message);
            }

            return gherkinParsingErrors;
        }

        private static string FormatErrors(string parserErrors)
        {
            var formattedErrors = "";

            var errorLines = parserErrors
                .ReplaceLineEndings()
                .Split(Environment.NewLine, StringSplitOptions.None);

            foreach (var line in errorLines.Skip(1))
            {
                var firstIndexOfColon = line.IndexOf(':');
                var firstIndexOfSpace = line.IndexOf(' ');
                var lineNumber = line.Substring(1, firstIndexOfColon - 1);
                var position = $"Position {line.Substring(firstIndexOfColon + 1, firstIndexOfSpace - firstIndexOfColon - 3)}";
                var message = line.Substring(firstIndexOfSpace + 1);
                formattedErrors += $"{lineNumber}:::{position}: {message}{Environment.NewLine}";
            }

            return formattedErrors;
        }

        public async ValueTask DisposeAsync()
        {
            if (_editFeatureFileJsModule is not null)
            {
                await _editFeatureFileJsModule.DisposeAsync();
            }
        }
    }
}
