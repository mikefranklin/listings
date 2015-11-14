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
    loadHeaders: function loadHeaders() {
        retryAjax({}, { api: "/getheaders", type: "get" }).done((function (data) {
            this.setState({ headerItems: data });
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    handleSortableUpdate: function handleSortableUpdate() {
        var newItems = _.clone(this.state.headerItems, true),
            node = $(ReactDOM.findDOMNode(this)),
            ids = node.sortable("toArray", { attribute: "data-id" });

        ids.forEach(function (id, index) {
            _.find(newItems, function (item) {
                return item.id == id;
            }).position = index;
        });

        node.sortable("cancel");
        this.setState({ headerItems: newItems });
    },
    getInitialState: function getInitialState() {
        return { headerItems: {} };
    },
    componentDidMount: function componentDidMount() {
        this.loadHeaders();
        $(ReactDOM.findDOMNode(this)).sortable({
            cursor: "move",
            items: 'div',
            update: this.handleSortableUpdate
            // placeholder: "" - classNames
            // handle .sorthandle
        });
    },
    render: function render() {
        var items = _.chain(this.state.headerItems) //  {fld: {position:, key: fld, ...}, ...}
        .sortBy(function (data) {
            return data.position;
        }) // returns array
        .map(function (data) {
            return React.createElement(HeaderItem, { key: data.key, data: data });
        }).value();
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
            { "data-position": data.position, "data-id": data.id, className: "col-md-2" },
            data.key
        );
    }
});

var Listings = React.createClass({
    displayName: "Listings",
    loadListings: function loadListings() {
        retryAjax({}, { api: "/getlistings", type: "get" }).done((function (data) {
            this.setState({ listings: data });
        }).bind(this)).fail((function () {
            console.log(arguments);
        }).bind(this));
    },
    getInitialState: function getInitialState() {
        return { listings: [{}] };
    },
    componentDidMount: function componentDidMount() {
        this.loadListings();
    },
    render: function render() {
        var houses = this.state.listings.map(function (listing) {
            return React.createElement(House, { key: listing._id, items: listing });
        });
        return React.createElement(
            "div",
            { id: "houses" },
            houses
        );
    }
});

var House = React.createClass({
    displayName: "House",

    getInitialState: function getInitialState() {
        return { items: {} };
    },
    render: function render() {
        var houseItems = _.map(this.props.items, function (value, key) {
            return React.createElement(HouseItem, { key: key, name: key, value: value });
        });
        return React.createElement(
            "div",
            { className: "row" },
            houseItems
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

    render: function render() {
        return React.createElement(
            "div",
            { className: "container-fluid" },
            React.createElement(Header, { key: "0", header: [] }),
            React.createElement(Listings, { key: "1", listing: [{}] })
        );
    }
});

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map