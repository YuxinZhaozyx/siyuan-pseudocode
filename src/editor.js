let resolveEditorReady = null;
let editorReadyPromise = new Promise(resolve => {
    resolveEditorReady = resolve;
});

require.config({ paths: { 'vs': 'libs/monaco/min/vs' } });
require(['vs/editor/editor.main'], function () {
    fetch('src/latex.json')
        .then(response => response.json())
        .then(latexSyntax => {
            // 注册LaTeX语言定义
            monaco.languages.register({
                id: latexSyntax.name,
                displayName: latexSyntax.displayName,
                extensions: latexSyntax.fileExtensions,
                mimeTypes: latexSyntax.mimeTypes
            });

            // 定义LaTeX关键字
            monaco.languages.setLanguageConfiguration(latexSyntax.name, {
                wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
                brackets: [
                    ['{', '}']
                ],
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' }
                ],
                comments: {
                    lineComment: latexSyntax.lineComment
                }
            });

            monaco.languages.registerCompletionItemProvider(latexSyntax.name, {
                provideCompletionItems: function (model, position) {
                    const wordUntilPosition = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: wordUntilPosition.startColumn,
                        endColumn: wordUntilPosition.endColumn
                    };

                    // 辅助函数：创建 snippet 建议
                    function createSnippet(label, insertText, documentation = '') {
                        return {
                            label: label,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            documentation: documentation,
                            insertText: insertText,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: range,
                            filterText: label, // 控制补全触发词
                            preselect: true,
                            additionalTextEdits: [{
                                range: range,
                                text: '' // 清除原始输入内容，避免重复插入
                            }]
                        };
                    }

                    // 辅助函数：创建 关键字 建议
                    function createKeyword(label, documentation = '') {
                        return {
                            label: label,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            documentation: documentation,
                            insertText: label,
                            range: range,
                            filterText: label,
                            preselect: true,
                            additionalTextEdits: [{
                                range: range,
                                text: ''
                            }]
                        };
                    }

                    const suggestions = [
                        // Blocks
                        createSnippet('\\begin', '\\begin{${1:env}}\n\t$0\n\\end{${1:env}}'),
                        createSnippet('\\caption', '\\caption{${1:<text>}}'),
                        createSnippet('\\begin{algorithm}', '\\begin{algorithm}\n\t$0\n\\end{algorithm}'),
                        createSnippet('\\begin{algorithmic}', '\\begin{algorithmic}\n\t$0\n\\end{algorithmic}'),

                        // Inputs & Outputs
                        createSnippet('\\REQUIRE', '\\REQUIRE ${1:<text>}'),
                        createSnippet('\\ENSURE', '\\ENSURE ${1:<text>}'),
                        createSnippet('\\INPUT', '\\INPUT ${1:<text>}'),
                        createSnippet('\\OUTPUT', '\\OUTPUT ${1:<text>}'),

                        // Statements
                        createSnippet('\\STATE', '\\STATE ${1:<text>}'),
                        createSnippet('\\RETURN', '\\RETURN ${1:<text>}'),
                        createSnippet('\\PRINT', '\\PRINT ${1:<text>}'),

                        // Conditionals
                        createSnippet('\\IF', '\\IF{${1:<condition>}}\n    ${0:<block>}\n\\ENDIF'),
                        createSnippet('\\ELIF', '\\ELIF{${1:<condition>}}\n    ${0:<block>}'),
                        createSnippet('\\ELSE', '\\ELSE\n    ${0:<block>}'),

                        // Loops
                        createSnippet('\\WHILE', '\\WHILE{${1:<condition>}}\n    ${0:<block>}\n\\ENDWHILE'),
                        createSnippet('\\FOR', '\\FOR{${1:<condition>}}\n    ${0:<block>}\n\\ENDFOR'),
                        createSnippet('\\FORALL', '\\FORALL{${1:<condition>}}\n    ${0:<block>}\n\\ENDFOR'),

                        // Repeat Until
                        createSnippet('\\REPEAT', '\\REPEAT\n    ${0:<block>}\n\\UNTIL{${1:<cond>}'),

                        // Functions / Procedures
                        createSnippet('\\FUNCTION', '\\FUNCTION{${1:<name>}}{${2:<params>}}\n    ${0:<block>}\n\\ENDFUNCTION'),
                        createSnippet('\\PROCEDURE', '\\PROCEDURE{${1:<name>}}{${2:<params>}}\n    ${0:<block>}\n\\ENDPROCEDURE'),
                        createSnippet('\\CALL', '\\CALL{${1:<name>}}{${2:<params>}}'),

                        // Comments
                        createSnippet('\\COMMENT', '\\COMMENT{${1:<text>}}'),

                        // Logic Keywords
                        createKeyword('\\AND'),
                        createKeyword('\\OR'),
                        createKeyword('\\XOR'),
                        createKeyword('\\NOT'),
                        createKeyword('\\TO'),
                        createKeyword('\\DOWNTO'),
                        createKeyword('\\TRUE'),
                        createKeyword('\\FALSE'),
                        createKeyword('\\BREAK'),
                        createKeyword('\\CONTINUE'),

                        // Font Size Commands
                        createKeyword('\\tiny'),
                        createKeyword('\\scriptsize'),
                        createKeyword('\\footnotesize'),
                        createKeyword('\\small'),
                        createKeyword('\\normalsize'),
                        createKeyword('\\large'),
                        createKeyword('\\Large'),
                        createKeyword('\\LARGE'),
                        createKeyword('\\huge'),
                        createKeyword('\\HUGE'),

                        // Font Family & Shape Declarations
                        createKeyword('\\rmfamily'),
                        createKeyword('\\sffamily'),
                        createKeyword('\\ttfamily'),
                        createKeyword('\\upshape'),
                        createKeyword('\\itshape'),
                        createKeyword('\\slshape'),
                        createKeyword('\\scshape'),
                        createKeyword('\\bfseries'),
                        createKeyword('\\mdseries'),
                        createKeyword('\\lfseries'),
                        
                        // Font Commands with Arguments
                        createSnippet('\\textnormal', '\\textnormal{${1:text}}'),
                        createSnippet('\\textrm',     '\\textrm{${1:text}}'),
                        createSnippet('\\textsf',     '\\textsf{${1:text}}'),
                        createSnippet('\\texttt',     '\\texttt{${1:text}}'),
                        createSnippet('\\textup',     '\\textup{${1:text}}'),
                        createSnippet('\\textit',     '\\textit{${1:text}}'),
                        createSnippet('\\textsl',     '\\textsl{${1:text}}'),
                        createSnippet('\\textsc',     '\\textsc{${1:text}}'),
                        createSnippet('\\uppercase',  '\\uppercase{${1:text}}'),
                        createSnippet('\\lowercase',  '\\lowercase{${1:text}}'),
                        createSnippet('\\textbf',     '\\textbf{${1:text}}'),
                        createSnippet('\\textmd',     '\\textmd{${1:text}}'),
                        createSnippet('\\textlf',     '\\textlf{${1:text}}')
                    ];

                    return { suggestions };
                }
            });

            // 定义LaTeX关键字颜色
            const tokenizer = latexSyntax.tokenizer;
            monaco.languages.setMonarchTokensProvider(latexSyntax.name, {
                tokenizer: tokenizer
            });

            const placeholder = [
                "\\begin{algorithm}",
                "\\caption{Quicksort}",
                "\\begin{algorithmic}",
                "\\PROCEDURE{Quicksort}{$A, p, r$}",
                "    \\IF{$p < r$} ",
                "        \\STATE $q = $ \\CALL{Partition}{$A, p, r$}",
                "        \\STATE \\CALL{Quicksort}{$A, p, q - 1$}",
                "        \\STATE \\CALL{Quicksort}{$A, q + 1, r$}",
                "    \\ENDIF",
                "\\ENDPROCEDURE",
                "\\end{algorithmic}",
                "\\end{algorithm}"
            ].join('\n');

            const editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: '', // 初始内容
                language: latexSyntax.name, // 设置语言为LaTeX
                lineNumbers: 'on', // 开启行号显示
                theme: 'vs-light', // 编辑器主题
                minimap: {
                    enabled: false // 去掉代码缩略图
                },
                automaticLayout: true, // 自动根据容器大小调整布局
                autoIndent: "full",
                tabSize: 4,
                // trimAutoWhitespace: true,
                semanticHighlighting: {
                    enabled: true,
                },
                placeholder: placeholder,
            });

            resolveEditorReady(editor);
        })
        .catch(error => console.error('Error loading LaTeX syntax:', error));
});

// 获取editor的唯一方法
async function getEditor() {
    return editorReadyPromise;
}

export async function getValue() {
    const editor = await getEditor();
    return editor.getValue();
}

export async function setValue(value) {
    const editor = await getEditor();
    editor.setValue(value);
}
