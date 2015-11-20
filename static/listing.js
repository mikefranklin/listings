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
        return { headers: {} };
    },
    componentDidMount: function componentDidMount() {
        this.props.createSortable(this, "data");
    },
    render: function render() {
        var items = _.map(this.props.data, function (header) {
            return React.createElement(HeaderItem, { key: header._id, data: header });
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
        return { data: {} };
    },
    handleClick: function handleClick() {
        console.log(this);
    },
    render: function render() {
        //data-position={data.position}
        var data = this.props.data;
        return React.createElement(
            Col,
            { md: 2, "data-position": data.sequence, "data-id": data._id, className: "item" },
            React.createElement(
                "div",
                { className: "btn-xsmall move", bsSize: "xsmall" },
                React.createElement("i", { className: "fa fa-bars" })
            ),
            React.createElement(FieldEditor, { data: data })
        );
    }
});

var House = React.createClass({
    displayName: "House",
    getInitialState: function getInitialState() {
        return { data: {}, row: 0 };
    },
    render: function render() {
        var items = _.map(this.props.data, function (header, index) {
            var value = header.data[index];
            return React.createElement(HouseItem, { key: header._id + ":" + index, name: header.fieldname, value: value, header: header });
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
        return { name: "", value: "", header: {} };
    },
    render: function render() {
        return React.createElement(
            Col,
            { md: 2, className: this.props.name, style: { overflow: "hidden", height: 20 } },
            this.formatter(this.props.value, this.header)
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
        return { showOverlay: false, data: {} };
    },
    toggle: function toggle() {
        this.setState({ showOverlay: !this.state.showOverlay });
    },
    render: function render() {
        var _this = this;

        var data = this.props.data;
        return React.createElement(
            "div",
            { style: { position: 'relative', float: 'left' } },
            React.createElement(
                Button,
                { ref: "target", onClick: this.toggle, bsSize: "xsmall" },
                data.text
            ),
            React.createElement(
                Overlay,
                { show: this.state.showOverlay, onHide: function onHide() {
                        return _this.toggle;
                    },
                    placement: "bottom", container: this, className: "field-editor",
                    target: function target() {
                        return ReactDOM.findDOMNode(_this.refs.target);
                    } },
                React.createElement(
                    "div",
                    { className: "field-editor" },
                    React.createElement(
                        ButtonGroup,
                        null,
                        React.createElement(StyleButton, { on: data.hide, text: "Hide", onStyle: "danger" }),
                        React.createElement(StyleButton, { on: !data.hide, text: "Show", onStyle: "success" })
                    )
                )
            )
        );
    }
});

var App = React.createClass({
    displayName: "App",
    createSortable: function createSortable(ref, dataName) {
        var sortNode = $(ReactDOM.findDOMNode(ref));
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: '.item',
            handle: ".move",
            update: _.bind(this.handleSortableUpdate, null, sortNode, dataName)
        });
    },
    handleSortableUpdate: function handleSortableUpdate(sortNode, dataName) {
        var ids = sortNode.sortable("toArray", { attribute: "data-id" }),
            newItems = _.clone(this.state[dataName], true),
            newState = {};

        ids.forEach(function (id, index) {
            _.find(newItems, function (item) {
                return item._id == id;
            }).sequence = index;
        });

        newState[dataName] = _.sortBy(newItems, "sequence");
        sortNode.sortable("cancel");
        this.setState(newState);
    },
    loadData: function loadData() {
        retryAjax({}, { api: "/getalldata", type: "get" }).done((function (content) {
            this.setState(content); // {data: [headers]}
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    getInitialState: function getInitialState() {
        return { data: {} };
    },
    componentDidMount: function componentDidMount() {
        this.loadData();
    },
    render: function render() {
        var houseIds = _.find(this.state.data, function (h) {
            return h.redfin = "_id";
        }),
            houses = "";

        if (houseIds) {
            houses = houseIds.data.map((function (id, row) {
                return React.createElement(House, { key: id, data: this.state.data, row: row });
            }).bind(this));
        }

        return React.createElement(
            Grid,
            { fluid: true },
            React.createElement(Header, { data: this.state.data, createSortable: this.createSortable }),
            houses
        );
    }
});

_.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay".split(","), function (m) {
    window[m] = ReactBootstrap[m];
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map