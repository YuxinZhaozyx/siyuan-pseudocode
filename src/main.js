import * as editor from './editor.js'
import { getBlockAttrsAPI, setBlockAttrsAPI } from './api.js';

window.frameElement.style = 'border: 0;';

let latex_code_loaded = '';
async function load(no_editor_mode = false) {
    const attrs = await getBlockAttrsAPI();
    if (!attrs['custom-latex-code']) {
        attrs['custom-latex-code'] = '';
    }
    if (no_editor_mode) {
        latex_code_loaded = attrs['custom-latex-code'];
    } else {
        await editor.setValue(attrs['custom-latex-code']);
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
    if (attrs['custom-caption-count']) {
        document.getElementById('caption-count').value = attrs['custom-caption-count'];
    }
}

async function save() {
    const attrs = {}
    attrs['custom-latex-code'] = await editor.getValue();
    attrs['custom-line-number'] = document.getElementById('line-number').value;
    attrs['custom-block-ending'] = document.getElementById('block-ending').value;
    attrs['custom-scope-line'] = document.getElementById('scope-line').value;
    attrs['custom-title-prefix'] = document.getElementById('title-prefix').value;
    attrs['custom-caption-count'] = document.getElementById('caption-count').value;

    setBlockAttrsAPI(attrs);
}

let editor_loaded = false;
async function showPanel(panel) {
    for (const panel_name of ['edit-panel', 'display-panel']) {
        document.getElementById(panel_name).style.display = (panel_name == panel ? 'flex' : 'none');
    }
    if (panel == 'edit-panel' && !editor_loaded) {
        editor_loaded = true;
        await load();
    }
}

function getAutoCaptionCount() {
    try {
        let count = 0;
        let block = window.frameElement.parentElement.parentElement;
        while (block.previousElementSibling) {
            block = block.previousElementSibling;
            if (block.getAttribute('data-subtype') == 'widget' && block.querySelector('iframe').getAttribute('src') == '/widgets/siyuan-pseudocode/') {
                count++;
            }
        }
        return count;
    } catch (err) {
        console.warn("getAutoCaptionCount 失效");
    }
    return undefined;
}

async function display(show_error_message = true, no_editor_mode = false) {
    const pseudocode_element = document.createElement('pre');
    pseudocode_element.textContent = no_editor_mode ? latex_code_loaded : await editor.getValue();
    document.getElementById('pseudocode-container').replaceChildren(pseudocode_element)
    const render_options = {
        indentSize: '1.2em',
        commentDelimiter: '//',
        lineNumber: document.getElementById('line-number').value == 'true',
        lineNumberPunc: ':',
        noEnd: document.getElementById('block-ending').value == 'false',
        scopeLines: document.getElementById('scope-line').value == 'true',
        titlePrefix: document.getElementById('title-prefix').value,
        captionCount: (document.getElementById('caption-count').value == '' ? getAutoCaptionCount() : document.getElementById('caption-count').value - 1),
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
        return false;
    }
    showPanel('display-panel');
    return true;
}

window.onload = async function () {
    await load(true);
    const success_display = await display(false, true);
    if (!success_display) {
        await showPanel('edit-panel');
    }
}

document.getElementById('display').onclick = async function () {
    save();
    display();
}

document.getElementById('edit').onclick = async function () {
    showPanel('edit-panel');
}