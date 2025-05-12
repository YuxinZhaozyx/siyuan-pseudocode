import * as editor from './editor.js'
import { getBlockAttrsAPI, setBlockAttrsAPI } from './api.js';

async function load() {
    const attrs = await getBlockAttrsAPI();
    if (attrs['custom-latex-code']) {
        editor.setValue(attrs['custom-latex-code']);
    }
    if (attrs['custom-line-number']) {
        document.getElementById('line-number').value = attrs['custom-line-number'];
    }
    if (attrs['custom-block-ending']) {
        document.getElementById('block-ending').value = attrs['custom-block-ending'];
    }
    if (attrs['custom-scope-line']) {
        document.getElementById('scope-line').value = attrs['custom-scope-line'];
    }
    if (attrs['custom-title-prefix']) {
        document.getElementById('title-prefix').value = attrs['custom-title-prefix'];
    }
}

async function save() {
    const attrs = {}
    attrs['custom-latex-code'] = await editor.getValue();
    attrs['custom-line-number'] = document.getElementById('line-number').value;
    attrs['custom-block-ending'] = document.getElementById('block-ending').value;
    attrs['custom-scope-line'] = document.getElementById('scope-line').value;
    attrs['custom-title-prefix'] = document.getElementById('title-prefix').value;

    setBlockAttrsAPI(attrs);
}

function showPanel(panel){
    for (const panel_name of ['edit-panel', 'display-panel']) {
        document.getElementById(panel_name).style.display = (panel_name == panel ? 'flex' : 'none');
    }
}

async function display(show_error_message=true) {
    const pseudocode_element = document.createElement('pre');
    pseudocode_element.textContent = await editor.getValue();
    document.getElementById('pseudocode-container').replaceChildren(pseudocode_element)
    const render_options = {
        indentSize: '1.2em',
        commentDelimiter: '%',
        lineNumber: document.getElementById('line-number').value == 'true',
        lineNumberPunc: ':',
        noEnd: document.getElementById('block-ending').value == 'false',
        scopeLines: document.getElementById('scope-line').value == 'true',
        titlePrefix: document.getElementById('title-prefix').value,
    }
    try {
        if (pseudocode_element.textContent.trim().length == 0) {
            throw new Error("伪代码为空")
        }
        pseudocode.renderElement(pseudocode_element, render_options);
    } catch (error) {
        if (show_error_message) {
            document.getElementById("error-message").innerText = error.message;
            document.getElementById("error-modal").style.display = "block";
        }
        return;
    }
    showPanel('display-panel');
}

window.onload = async function () {
    await load();
    await display(false);
}

document.getElementById('display').onclick = async function () {
    save();
    display();
}

document.getElementById('edit').onclick = async function () {
    showPanel('edit-panel');
}