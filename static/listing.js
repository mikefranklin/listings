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
        this.props.createSortable(this);
    },
    render: function render() {
        var items = _.chain(this.props.headers) //  [{position:, key: fld, ...}, ...]
        .map(function (data) {
            return React.createElement(HeaderItem, { key: data.key, data: data });
        }).value();
        return React.createElement(
            "div",
            { ref: "header", className: "row header" },
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
            { "data-position": data.position, "data-id": data.id, className: "col-md-2" },
            data.key
        );
    }
});

var House = React.createClass({
    displayName: "House",
    getInitialState: function getInitialState() {
        return { items: {}, headers: {} }; // { fld: {id, position, key, ... etc}, ... }
    },
    render: function render() {
        var _this = this;

        var items = _.map(this.props.headers, function (item) {
            var value = _this.props.items[item.key] || "";
            return React.createElement(HouseItem, { key: item.key, name: item.key, value: value });
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
        return f ? this["formatter_" + f[1]](obj) : this.formatter.undef();
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

var App = React.createClass({
    displayName: "App",
    createSortable: function createSortable(ref) {
        var sortNode = $(ReactDOM.findDOMNode(ref));
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: 'div',
            update: _.bind(this.handleSortableUpdate, null, sortNode)
        });
    },
    handleSortableUpdate: function handleSortableUpdate(sortNode) {
        var newItems = _.clone(this.state.headers, true),
            ids = sortNode.sortable("toArray", { attribute: "data-id" });

        ids.forEach(function (id, index) {
            _.find(newItems, function (item) {
                return item.id == id;
            }).position = index;
        });

        sortNode.sortable("cancel");
        this.setState({ headers: _.sortBy(newItems, "position") });
    },
    loadData: function loadData() {
        retryAjax({}, { api: "/getalldata", type: "get" }).done((function (data) {
            this.setState({ listings: data.listings, headers: data.headers });
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    getInitialState: function getInitialState() {
        return { listings: [], headers: [] };
    },
    componentDidMount: function componentDidMount() {
        this.loadData();
    },
    render: function render() {
        var houses = this.state.listings.map((function (listing) {
            return React.createElement(House, { key: listing._id, items: listing, headers: this.state.headers });
        }).bind(this));
        return React.createElement(
            "div",
            { className: "container-fluid" },
            React.createElement(Header, { headers: this.state.headers, createSortable: this.createSortable }),
            houses
        );
    }
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map