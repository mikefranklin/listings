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
            { md: 2, "data-position": data.sequence, "data-id": data._id },
            React.createElement("i", { className: "fa fa-bars move" }),
            React.createElement("i", { className: "fa fa-bolt opts", onClick: this.handleClick }),
            data.text
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
            { md: 2, className: this.props.name },
            this.formatter(this.props.value, this.header)
        );
    }
});

var FieldModal = React.createClass({
    displayName: "FieldModal",
    getInitialState: function getInitialState() {
        return { title: "", hide: "0" };
    },
    render: function render() {
        return React.createElement(
            "div",
            { className: "fade fieldModel" },
            React.createElement(
                Modal.Dialog,
                null,
                React.createElement(
                    Modal.Header,
                    null,
                    React.createElement(
                        Modal.Title,
                        null,
                        this.state.title
                    )
                ),
                React.createElement(
                    Modal.Body,
                    null,
                    React.createElement(
                        ButtonGroup,
                        null,
                        React.createElement(
                            Button,
                            null,
                            "Left"
                        ),
                        React.createElement(
                            Button,
                            null,
                            "Middle"
                        ),
                        React.createElement(
                            Button,
                            null,
                            "Right"
                        )
                    )
                ),
                React.createElement(
                    Modal.Footer,
                    null,
                    React.createElement(
                        Button,
                        { "data-dismiss": "modal" },
                        "Close"
                    ),
                    React.createElement(
                        Button,
                        { bsStyle: "primary" },
                        "Save"
                    )
                )
            )
        );

        return React.createElement(
            "div",
            { className: "btn-group", "data-toggle": "buttons" },
            React.createElement(
                "label",
                { className: "btn " + this.props.hide ? "active btn-danger" : "btn-default" },
                React.createElement("input", { type: "radio", name: "show", value: "0" }),
                "Hide"
            ),
            React.createElement(
                "label",
                { className: "btn " + this.props.hide ? "btn-default" : "btn-success active" },
                React.createElement("input", { type: "radio", name: "show", value: "1" }),
                "Show"
            )
        );
    }
});

/*
headers = [{ data = [1, 2, ...], "_id": 0, "redfin": "_id", sequence": 0, "fieldname": "field0",
        "text": "_id","show": true} ...]
*/
var App = React.createClass({
    displayName: "App",
    createSortable: function createSortable(ref, dataName) {
        var sortNode = $(ReactDOM.findDOMNode(ref));
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: 'div',
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
            houses,
            React.createElement(FieldModal, null)
        );
    }
});

_.each("Grid,Row,Col,Modal".split(","), function (m) {
    window[m] = ReactBootstrap[m];
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map