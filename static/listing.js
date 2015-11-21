"use strict";
"use babel";

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

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
        return { fields: {} };
    },
    componentDidMount: function componentDidMount() {
        this.props.createSortable(this);
    },
    render: function render() {
        var items = _.map(this.props.fields, function (field) {
            return React.createElement(HeaderItem, { key: field._id, field: field });
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
    handleClick: function handleClick() {},
    render: function render() {
        var field = this.props.field;
        return React.createElement(
            Col,
            { md: 2, "data-position": field.sequence, "data-id": field._id, className: "item" },
            React.createElement(
                "div",
                { className: "btn-xsmall move", bsSize: "xsmall" },
                React.createElement("i", { className: "fa fa-bars" })
            ),
            React.createElement(FieldEditor, { field: field })
        );
    }
});

var House = React.createClass({
    displayName: "House",
    getInitialState: function getInitialState() {
        return { data: {}, fields: {} };
    },
    render: function render() {
        var _this = this;

        var items = _.map(this.props.fields, function (field, index) {
            return React.createElement(HouseItem, { key: field._id, name: field.fieldname,
                value: _this.props.data[index], field: field });
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
        return React.createElement(
            Col,
            { md: 2, className: this.props.name, style: { overflow: "hidden", height: 20 } },
            this.formatter(this.props.value, this.props.field)
        );
    }
});

var StyleButton = React.createClass({
    displayName: "StyleButton",
    getInitialState: function getInitialState() {
        return { on: false, text: "", onStyle: "default" };
    },
    render: function render() {
        return this.props.on ? React.createElement(
            Button,
            { bsStyle: this.props.onStyle, bsSize: "xsmall", active: true },
            this.props.text
        ) : React.createElement(
            Button,
            { bsStyle: "default", bsSize: "xsmall" },
            this.props.text
        );
    }
});

var FieldEditor = React.createClass({
    displayName: "FieldEditor",
    getInitialState: function getInitialState() {
        return { showOverlay: false, field: {} };
    },
    toggle: function toggle() {
        this.setState({ showOverlay: !this.state.showOverlay });
    },
    render: function render() {
        var _this2 = this;

        var field = this.props.field;
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
                        return _this2.toggle;
                    },
                    placement: "bottom", container: this, className: "field-editor",
                    target: function target() {
                        return ReactDOM.findDOMNode(_this2.refs.target);
                    } },
                React.createElement(
                    "div",
                    { className: "field-editor" },
                    React.createElement(
                        ButtonGroup,
                        null,
                        React.createElement(StyleButton, { on: field.hide, text: "Hide", onStyle: "danger" }),
                        React.createElement(StyleButton, { on: !field.hide, text: "Show", onStyle: "success" })
                    )
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
    updateDB: function updateDB(fieldname) {
        var data = { "fieldname": fieldname };

        data.data = _.map(this.state.fields, function (field) {
            return [field._id, field[fieldname]];
        });

        retryAjax(JSON.stringify(data), { api: "/saveheaderdata", type: "post" }).done((function (content) {
            console.log("worked!", arguments);
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    loadData: function loadData() {
        retryAjax({}, { api: "/getalldata", type: "get" }).done((function (content) {
            content.redfin = _.find(content.fields, function (f) {
                return f.redfin == "_id";
            })._id;
            this.setState(content); // {fields: [{field info}]}
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    getInitialState: function getInitialState() {
        return { fields: {}, redfin: null };
    },
    componentDidMount: function componentDidMount() {
        this.loadData();
    },
    render: function render() {
        var houses = "",
            fields;

        if (this.state.redfin !== null) {
            fields = this.state.fields;
            houses = _.map(fields[this.state.redfin].data, (function (redfinId, seqNo) {
                // for each house
                var data = _.map(fields, function (field) {
                    return field.data[seqNo];
                });
                return React.createElement(House, { key: redfinId, data: data, fields: fields });
            }).bind(this));
        }

        return React.createElement(
            Grid,
            { fluid: true },
            React.createElement(Header, { fields: this.state.fields, createSortable: this.createSortable }),
            houses
        );
    }
});

_.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay".split(","), function (m) {
    window[m] = ReactBootstrap[m];
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map