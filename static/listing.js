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
            "div",
            { className: "row header" },
            items
        );
    }
});

var HeaderItem = React.createClass({
    displayName: "HeaderItem",
    getInitialState: function getInitialState() {
        return { data: {} };
    },
    render: function render() {
        //data-position={data.position}
        var data = this.props.data;
        return React.createElement(
            "div",
            { "data-position": data.sequence, "data-id": data._id, className: "col-md-2" },
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
            return React.createElement(HouseItem, { key: header._id, name: header.fieldname, value: value });
        });
        return React.createElement(
            "div",
            { className: "row house" },
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
    formatter: function formatter(value) {
        return (this["formatter_" + (typeof value === "undefined" ? "undefined" : _typeof(value))] || this.formatter_undef)(value);
    },
    getInitialState: function getInitialState() {
        return { name: "", value: "" };
    },
    render: function render() {
        return React.createElement(
            "div",
            { className: this.props.name + " col-md-2" },
            this.formatter(this.props.value)
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
            "div",
            { className: "container-fluid" },
            React.createElement(Header, { data: this.state.data, createSortable: this.createSortable }),
            houses
        );
    }
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map