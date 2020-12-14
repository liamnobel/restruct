"use strict";

class Marker {
    constructor(_offset, _type, _name, _size) {
        this.offset = _offset;
        this.type = _type;
        this.name = _name;
        this.size = 0;
    }
}

let data = {
    name: "EnActor",
    size: 10,
    markers: [],
    option: {
        member_show_sizes: false
    }
};

const type_map = {
    char: 1,
    u8: 1,
    s8: 1,
    u16: 2,
    s16: 2,
    s32: 4,
    f32: 4,
    SkelAnime: 0x44,
    Actor: 0x14C
}

function data_update_name(_value) {
    data.name = _value;
    update();
}

function data_update_size(_value) {
    if (_value != "") {
        data.size = parseInt(_value, 16);
    } else {
        data.size = 0;
    }
    update();
}

function data_update_option_member_show_sizes(_checked) {
    data.option.member_show_sizes = _checked;
    update();
}

function update() {

    // assert an ordering
    data.markers = data.markers.sort((_a, _b) => (_a.offset > _b.offset) ? -1 : 1);

    // fill marker remover html in ascending order
    let _marker_html = "";
    data.markers.slice().reverse().forEach((_marker, _index) => {
        _marker_html += `
        <div class="row">
            <div class="col">
                0x${hexFmt(_marker.offset, 4)}
            </div>
            <div class="col">
                ${_marker.type}
            </div>
            <div class="col">
                ${_marker.name}
            </div>
            <div class="col">
                <div class="d-grid gap-2">
                <button type="button" class="btn btn-secondary" onclick="remMarker(${_index});">Remove</button>
                </div>
            </div>
        </div>
        `
    });
    document.getElementById("marker_edit").innerHTML = _marker_html;

    // fill marker output text in descending order
    let _marker_text = "";
    let _current_end = data.size;
    data.markers.forEach((_marker, _index) => {
        _marker.size = _current_end - _marker.offset;
        let _marker_type_size = type_map[_marker.type];
        if (_marker_type_size === undefined) {
            _marker_type_size = 1;
        }
        let _values = _marker.size / _marker_type_size;
        let _size_info = data.option.member_show_sizes ? ` // size = 0x${hexFmt(_marker.size, 4)}` : '';
        let _array_info = (_values == 1) ? '' : `[0x${hexFmt(_values)}]`;
        _marker_text = `\t/* 0x${hexFmt(_marker.offset, 4)} */ ${_marker.type} ${_marker.name}${_array_info};${_size_info}\n` + _marker_text;
        _current_end -= _marker.size;
    });
    document.getElementById("output").innerText = `typedef struct ${data.name} {
    ${_marker_text}} ${data.name}; // size = 0x${hexFmt(data.size, 4)}`;

    // clear so nobody is confused
    document.getElementById("input_data_json").value = "";
}

function hexFmt(_decimal, _length = null) {
    var _str = _decimal.toString(16).toLocaleUpperCase();
    if (_length !== null) {
        let _missing = Math.max(_length - _str.length, 0);
        return "0".repeat(_missing) + _str;
    }
    return _str;
}

function addMarker() {
    let _position = parseInt(document.getElementById("input_marker_position").value, 16);
    if (!isNaN(_position)) {
        let _type = document.getElementById("input_marker_type").value;
        let _name = document.getElementById("input_marker_name").value;
        let _marker = new Marker(_position, _type, _name);
        data.markers.push(_marker);
        console.log("Added marker: ", _marker);
        if (1) {
            document.getElementById("input_marker_position").value = "";
            document.getElementById("input_marker_type").value = "";
            document.getElementById("input_marker_name").value = "";
            document.getElementById("input_marker_position").focus();
            document.getElementById("input_marker_position").select();
        }
        update();
    }
}

function remMarker(_index) {
    delete data.markers[_index];
    data.markers.splice(_index, 1);
    console.log("Removed marker: ", _index);
    update();
}

function marker_new_update_name(_value) {
    if (document.getElementById("input_marker_type").value == "") {
        document.getElementById("input_marker_type").value = "char";
    }
    
    document.getElementById("input_marker_name").value = `unk_${hexFmt(parseInt(_value, 16))}`;
}

// https://stackoverflow.com/a/51261023
function copy(_id) {
    if (window.getSelection) {
        if (window.getSelection().empty) { // Chrome
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) { // Firefox
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) { // IE?
        document.selection.empty();
    }

    if (document.selection) {
        var range = document.body.createTextRange();
        range.moveToElementText(document.getElementById(_id));
        range.select().createTextRange();
        document.execCommand("copy");
    } else if (window.getSelection) {
        var range = document.createRange();
        range.selectNode(document.getElementById(_id));
        window.getSelection().addRange(range);
        document.execCommand("copy");
    }
}

function set_window_padding(_bool) {
    var element = document.getElementById("container");
    if (!_bool) {
        element.classList.remove("container-fluid");
        element.classList.add("container");
    } else {
        element.classList.remove("container");
        element.classList.add("container-fluid");
    }
}

function set_window_labels(_bool) {
    document.querySelectorAll('.extra-info').forEach((_element) => {
        _element.style.display = !_bool ? 'block' : 'none';
    });
}

// clear or load values on restart
window.onload = function () {
    data_update_name(document.getElementById("input_struct_name").value);
    data_update_size(document.getElementById("input_struct_size").value);
    data_update_option_member_show_sizes(document.getElementById("input_show_member_sizes").checked);
    set_window_padding(document.getElementById("input_window_padding").checked);
    set_window_labels(document.getElementById("input_window_labels").checked);
    document.getElementById("input_data_json").value = "";
    update();
};

function data_json_import() {
    let _string = document.getElementById("input_data_json").value;
    if (_string !== "") {
        let _json = JSON.parse(_string);
        if (_json !== undefined) {
            data = _json;
            console.log("JSON Imported.");
            console.log(data);
            update();
            document.getElementById("input_data_json").value = "";
            return true;
        }
    }
    return false;
}

function data_json_export() {
    document.getElementById("input_data_json").value = JSON.stringify(data);
}