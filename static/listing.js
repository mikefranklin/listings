"use strict";
"use babel";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var signaller = {
    headerUpdated: new signals.Signal(),
    moveToggled: new signals.Signal()
};

function retryAjax(params, options) {
    var opts = _.extend({ base: "", api: "*required*", dataType: "json",
        init: "", delay: 0, type: "post" }, options),
        url = opts.base + opts.api,
        tries = opts.tries > 0 ? +opts.tries : 3,
        def = $.Deferred();

    (function makeRequest() {
        $.ajax({ url: url, dataType: opts.dataType, data: params, type: opts.type }).done(function () {
            def.resolveWith(this, arguments);
        }).fail(function () {
            if (tries--) {
                console.log("failed ", params);
                return _.delay(makeRequest, opts.delay, this);
            }
            def.rejectWith(this, arguments);
        });
    })();
    return def.promise();
} // function retryAjax

var Header = React.createClass({
    displayName: "Header",
    getInitialState: function getInitialState() {
        return { fields: {}, canMove: false };
    },
    componentDidMount: function componentDidMount() {
        this.props.createSortable(this);
    },
    render: function render() {
        var _this = this;

        var items = _.map(this.props.fields, function (field) {
            return React.createElement(HeaderItem, { key: field._id, field: field, canMove: _this.props.canMove });
        });
        return React.createElement(
            Row,
            { className: "header" },
            items
        );
    }
});

var HeaderItem = React.createClass({
    displayName: "HeaderItem",
    getInitialState: function getInitialState() {
        return { field: {} };
    },
    render: function render() {
        var field = this.props.field,
            cols = this.props.field.columns ? this.props.field.columns : 2,
            move = !this.props.canMove ? "" : React.createElement(
            "div",
            { className: "btn-xsmall move", bsSize: "xsmall" },
            React.createElement("i", { className: "fa fa-bars" })
        );

        return React.createElement(
            Col,
            { md: cols, "data-position": field.sequence, "data-id": field._id, className: "item" },
            move,
            React.createElement(FieldEditor, { field: field })
        );
    }
});

var House = React.createClass({
    displayName: "House",
    getInitialState: function getInitialState() {
        return { listing: {}, fields: {} };
    },
    render: function render() {
        var _this2 = this;

        var items = _.map(this.props.fields, function (field) {
            return React.createElement(HouseItem, { key: field._id, name: field.fieldname,
                value: _this2.props.listing[field._id], field: field });
        });
        return React.createElement(
            Row,
            { className: "house" },
            items
        );
    }
});

var HouseItem = React.createClass({
    displayName: "HouseItem",
    formatter_undef: function formatter_undef() {
        return "~undefined~";
    },
    formatter_date: function formatter_date(obj) {
        return new Date(obj.$date).toLocaleString('en-US');
    },
    formatter_string: function formatter_string(s) {
        return s;
    },
    formatter_object: function formatter_object(obj) {
        var f = _.find([["$date", "date"]], function (pair) {
            return obj[pair[0]] !== undefined;
        });
        return f ? this["formatter_" + f[1]](obj) : this.formatter_undef();
    },
    formatter: function formatter(value, header) {
        return (this["formatter_" + (typeof value === "undefined" ? "undefined" : _typeof(value))] || this.formatter_undef)(value);
    },
    getInitialState: function getInitialState() {
        return { name: "", value: "", field: {} };
    },
    render: function render() {
        var cols = this.props.field.columns ? this.props.field.columns : 2;
        return React.createElement(
            Col,
            { md: cols, className: this.props.name, style: { overflow: "hidden", height: 20 } },
            this.formatter(this.props.value, this.props.field)
        );
    }
});

var FieldEditor = React.createClass({
    displayName: "FieldEditor",
    getInitialState: function getInitialState() {
        return { showOverlay: false, field: {}, hideField: {} };
    },
    toggle: function toggle() {
        this.setState({ showOverlay: !this.state.showOverlay });
    },
    signal: function signal(name) {
        var _signaller$name;

        (_signaller$name = signaller[name]).dispatch.apply(_signaller$name, _toConsumableArray(_.toArray(arguments).slice(1)));
    },
    render: function render() {
        var _this3 = this,
            _ref,
            _ref2,
            _ref3;

        var field = this.props.field,
            fieldId = field._id,
            click = [this.signal, this, "headerUpdated", fieldId];
        return React.createElement(
            "div",
            { className: "field-editor-container" },
            React.createElement(
                Button,
                { ref: "target", onClick: this.toggle, bsSize: "xsmall" },
                field.text
            ),
            React.createElement(
                Overlay,
                { show: this.state.showOverlay, onHide: function onHide() {
                        return _this3.toggle;
                    }, placement: "bottom", rootClose: true,
                    container: this, className: "field-editor", target: function target() {
                        return ReactDOM.findDOMNode(_this3.refs.target);
                    } },
                React.createElement(
                    "div",
                    { className: "field-editor" },
                    React.createElement(
                        "table",
                        null,
                        React.createElement(
                            "tbody",
                            null,
                            React.createElement(
                                "tr",
                                null,
                                React.createElement("td", null),
                                React.createElement(
                                    "td",
                                    null,
                                    React.createElement(
                                        Button,
                                        { bsSize: "small", onClick: (_ref = _).bind.apply(_ref, click.concat(['show', false])) },
                                        "Hide"
                                    )
                                )
                            ),
                            React.createElement(
                                "tr",
                                null,
                                React.createElement(
                                    "td",
                                    null,
                                    "Columns"
                                ),
                                React.createElement(
                                    "td",
                                    null,
                                    React.createElement(
                                        Button,
                                        { bsSize: "small", onClick: (_ref2 = _).bind.apply(_ref2, click.concat(["columns", 1])) },
                                        "One"
                                    ),
                                    React.createElement(
                                        Button,
                                        { bsSize: "small", onClick: (_ref3 = _).bind.apply(_ref3, click.concat(["columns", 2])) },
                                        "Two"
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    }
});

var Control = React.createClass({
    displayName: "Control",
    getInitialState: function getInitialState() {
        return { hidden: {} };
    },
    signal: function signal(name) {
        var _signaller$name2;

        (_signaller$name2 = signaller[name]).dispatch.apply(_signaller$name2, _toConsumableArray(_.toArray(arguments).slice(1)));
    },
    render: function render() {
        var _this4 = this;

        var hidden = _.map(this.props.hidden, function (field, index) {
            var click = _.bind(_this4.signal, _this4, "headerUpdated", field._id, "show", true);
            return React.createElement(
                MenuItem,
                { key: field._id, onClick: click },
                field.text
            );
        }),
            style = this.props.canMove ? "success" : "default";
        return React.createElement(
            Row,
            { className: "control" },
            React.createElement(
                Col,
                { md: 1, mdOffset: 10 },
                React.createElement(
                    Button,
                    { bsStyle: style, onClick: _.bind(this.signal, this, "moveToggled") },
                    "Toggle move"
                )
            ),
            React.createElement(
                Col,
                { md: 1 },
                React.createElement(
                    DropdownButton,
                    { title: "Unhide", id: "unhide", pullRight: true },
                    hidden
                )
            )
        );
    }
});

var App = React.createClass({
    displayName: "App",
    createSortable: function createSortable(ref) {
        var sortNode = $(ReactDOM.findDOMNode(ref));
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: '.item',
            handle: ".move",
            update: _.bind(this.handleSortableUpdate, null, sortNode)
        });
    },
    handleSortableUpdate: function handleSortableUpdate(sortNode) {
        var ids = sortNode.sortable("toArray", { attribute: "data-id" }),
            fields = _.clone(this.state.fields, true);

        ids.forEach(function (id, index) {
            _.find(fields, function (item) {
                return item._id == id;
            }).sequence = index;
        });

        sortNode.sortable("cancel");
        this.setState({ fields: _.sortBy(fields, "sequence") });
        this.updateDB("sequence");
    },
    updateDB: function updateDB(fieldname, field) {
        var data = { "fieldname": fieldname };

        if (field) data.data = [[field._id, field[fieldname]]];else {
            data.data = _.map(this.state.fields, function (field) {
                return [field._id, field[fieldname]];
            });
        }

        retryAjax(JSON.stringify(data), { api: "/saveheaderdata", type: "post" }).done((function (content) {
            console.log("worked!", data, arguments);
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    loadData: function loadData() {
        retryAjax({}, { api: "/getalldata", type: "get" }).done((function (content) {
            content.redfin = _.find(content.fields, function (f) {
                return f.redfin == "_id";
            })._id;
            this.setState(content); // {fields: [{field info}], listsings: [[data, ...], ...]}
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    headerUpdated: function headerUpdated(fieldId, headerName, value) {
        // hideField, setWidth
        var fields = _.clone(this.state.fields),
            index = _.findIndex(fields, function (f) {
            return f._id == fieldId;
        });

        fields[index][headerName] = value;
        this.updateDB(headerName, fields[index]);
        this.setState(fields);
    },
    getInitialState: function getInitialState() {
        signaller.headerUpdated.add(this.headerUpdated);
        signaller.moveToggled.add(this.moveToggled);
        return { fields: {}, listings: [], redfin: null, canMove: false };
    },
    moveToggled: function moveToggled() {
        this.setState({ canMove: !this.state.canMove });
    },
    componentDidMount: function componentDidMount() {
        this.loadData();
    },
    render: function render() {
        var houses = "";
        var redfinId = this.state.redfin;

        var _$partition = _.partition(this.state.fields, function (field) {
            return field.show;
        });

        var _$partition2 = _slicedToArray(_$partition, 2);

        var displayable = _$partition2[0];
        var hidden = _$partition2[1];

        if (displayable.length) {
            houses = _.map(this.state.listings, (function (listing) {
                return React.createElement(House, { key: listing[redfinId], listing: listing, fields: displayable });
            }).bind(this));
        }
        return React.createElement(
            Grid,
            { fluid: true },
            React.createElement(Header, { fields: displayable, createSortable: this.createSortable, canMove: this.state.canMove }),
            React.createElement(Control, { hidden: hidden, canMove: this.state.canMove }),
            houses
        );
    }
});

_.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem".split(","), function (m) {
    window[m] = ReactBootstrap[m];
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map