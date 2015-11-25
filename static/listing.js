"use strict";
"use babel";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var signaller = {
    headerUpdated: new signals.Signal(),
    moveToggled: new signals.Signal(),
    currentsSelected: new signals.Signal()
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
    componentDidUpdate: function componentDidUpdate() {
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
        return { field: {}, showModal: false };
    },
    openFieldEditor: function openFieldEditor() {
        this.setState({ showModal: true });
    },
    render: function render() {
        // <FieldEditor field={field}/>
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
            React.createElement(
                "div",
                { className: "edit", onClick: this.openFieldEditor },
                field.text
            ),
            React.createElement(FieldEditor, { showModal: this.state.showModal, field: this.props.field })
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
    formatter_url: function formatter_url(url) {
        return React.createElement(
            "a",
            { href: url, target: "_blank" },
            "Redfin"
        );
    },
    formatter: function formatter(value, header) {
        return (this["formatter_" + header.text] || this["formatter_" + (typeof value === "undefined" ? "undefined" : _typeof(value))] || this.formatter_undef)(value);
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

var Control = React.createClass({
    displayName: "Control",
    getInitialState: function getInitialState() {
        return { hidden: {} };
    },
    signal: function signal(name) {
        var _signaller$name;

        (_signaller$name = signaller[name]).dispatch.apply(_signaller$name, _toConsumableArray(_.toArray(arguments).slice(1)));
    },
    render: function render() {
        var _this3 = this;

        var hidden = _.map(this.props.hidden, function (field, index) {
            var click = _.bind(_this3.signal, _this3, "headerUpdated", field._id, "show", true);
            return React.createElement(
                MenuItem,
                { key: field._id, onClick: click },
                field.text
            );
        }),
            moveStyle = this.props.canMove ? "success" : "default",
            curStyle = this.props.currentsOnly ? "success" : "default";
        return React.createElement(
            Row,
            { className: "control" },
            React.createElement(
                Col,
                { md: 1, mdOffset: 9 },
                React.createElement(
                    Button,
                    { bsStyle: curStyle, onClick: _.bind(this.signal, this, "currentsSelected") },
                    "Current Active"
                )
            ),
            React.createElement(
                Col,
                { md: 1 },
                React.createElement(
                    Button,
                    { bsStyle: moveStyle, onClick: _.bind(this.signal, this, "moveToggled") },
                    "Toggle move"
                )
            ),
            React.createElement(
                Col,
                { md: 1 },
                React.createElement(
                    DropdownButton,
                    { title: "Unhide", id: "unhide" },
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
        signaller.currentsSelected.add(this.currentsSelected);
        return { fields: {}, listings: [], redfin: null, canMove: false, currentsOnly: false };
    },
    moveToggled: function moveToggled() {
        this.setState({ canMove: !this.state.canMove });
    },
    currentsSelected: function currentsSelected() {
        this.setState({ currentsOnly: !this.state.currentsOnly });
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
        var dtPos = (_.find(this.state.fields, function (f) {
            return f.text == 'last_loaded';
        }) || {})._id;
        var stPos = (_.find(this.state.fields, function (f) {
            return f.text == 'status';
        }) || {})._id;
        var maxDate = _.chain(this.state.listings).map(function (l) {
            return l[dtPos].$date;
        }).max().value();
        var listings;

        if (displayable.length) {
            listings = //this.state.listings
            !this.state.currentsOnly ? this.state.listings : _.filter(this.state.listings, function (l) {
                return l[dtPos].$date == maxDate && l[stPos].toLowerCase() == "active";
            });
            houses = _.map(listings, (function (listing) {
                return React.createElement(House, { key: listing[redfinId], listing: listing, fields: displayable });
            }).bind(this));
        }
        return React.createElement(
            Grid,
            { fluid: true },
            React.createElement(Header, { fields: displayable, createSortable: this.createSortable, canMove: this.state.canMove }),
            React.createElement(Control, { hidden: hidden, canMove: this.state.canMove, currentsOnly: this.state.currentsOnly }),
            houses
        );
    }
});

var FieldEditor = React.createClass({
    displayName: "FieldEditor",
    getInitialState: function getInitialState() {
        return { showModal: false, field: {} };
    },
    close: function close() {
        this.setState({ showModal: false });
    },
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        this.setState(nextProps);
    },
    updateText: function updateText(event) {
        this.setState({ text: event.target.value });
    },
    updateBS: function updateBS(event) {
        this.setState({ bucketSize: event.target.value });
    },
    signal: function signal(name, close) {
        var _signaller$name2;

        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
        }

        (_signaller$name2 = signaller[name]).dispatch.apply(_signaller$name2, args);
        if (close) this.close();
    },
    render: function render() {
        var _ref, _ref2, _ref3, _ref4, _ref5;

        var field = this.state.field,
            fieldId = field._id,
            updateClose = [this.signal, this, "headerUpdated", true, fieldId];
        return React.createElement(
            Modal,
            { show: this.state.showModal, onHide: this.close },
            React.createElement(
                Modal.Header,
                { closeButton: true },
                React.createElement(
                    Modal.Title,
                    null,
                    field.text
                )
            ),
            React.createElement(
                Modal.Body,
                null,
                React.createElement(
                    "table",
                    null,
                    React.createElement(
                        "tbody",
                        null,
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "td",
                                { className: "title" },
                                "Visibility"
                            ),
                            React.createElement(
                                "td",
                                { className: "values" },
                                React.createElement(
                                    Button,
                                    { bsSize: "small", onClick: (_ref = _).bind.apply(_ref, updateClose.concat(['show', false])) },
                                    "Hide"
                                )
                            )
                        ),
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "td",
                                { className: "title" },
                                "Columns"
                            ),
                            React.createElement(
                                "td",
                                { className: "values" },
                                React.createElement(
                                    Button,
                                    { bsSize: "small",
                                        bsStyle: field.columns == 1 ? "success" : "default",
                                        onClick: (_ref2 = _).bind.apply(_ref2, updateClose.concat(["columns", 1])) },
                                    "One"
                                ),
                                React.createElement(
                                    Button,
                                    { bsSize: "small",
                                        bsStyle: field.columns == 1 ? "default" : "success",
                                        onClick: (_ref3 = _).bind.apply(_ref3, updateClose.concat(["columns", 2])) },
                                    "Two"
                                )
                            )
                        ),
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "td",
                                { className: "title" },
                                "Text"
                            ),
                            React.createElement(
                                "td",
                                { className: "values" },
                                React.createElement("input", { type: "text", defaultValue: field.text,
                                    onChange: this.updateText }),
                                React.createElement(
                                    Button,
                                    { bsSize: "small", bsStyle: "primary",
                                        onClick: (_ref4 = _).bind.apply(_ref4, updateClose.concat(["text", this.state.text])) },
                                    "Save"
                                )
                            )
                        ),
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "td",
                                { className: "title" },
                                "bucket size"
                            ),
                            React.createElement(
                                "td",
                                { className: "values" },
                                React.createElement("input", { type: "text", defaultValue: field.bucketSize || 0,
                                    onChange: this.updateBS }),
                                React.createElement(
                                    Button,
                                    { bsSize: "small", bsStyle: "primary",
                                        onClick: (_ref5 = _).bind.apply(_ref5, updateClose.concat(["bucketSize", this.state.bucketSize])) },
                                    "Save"
                                ),
                                React.createElement("br", null),
                                "* = distinct"
                            )
                        )
                    )
                )
            ),
            React.createElement(
                Modal.Footer,
                null,
                React.createElement(
                    Button,
                    { onClick: this.close },
                    "Close"
                )
            )
        );
    }
});

_.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem".split(","), function (m) {
    window[m] = ReactBootstrap[m];
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));

ReactDOM.render(React.createElement(FieldEditor, null), document.getElementById("fieldeditor"));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map