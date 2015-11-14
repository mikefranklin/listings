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
            "ul",
            { className: "listings" },
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
            if (key != "_id") {
                return React.createElement(Item, { key: key, name: key, value: value });
            }
        });
        return React.createElement(
            "li",
            { className: "house" },
            houseItems
        );
    }
});

var Item = React.createClass({
    displayName: "Item",

    getInitialState: function getInitialState() {
        return { name: "", value: "" };
    },
    render: function render() {
        var name = this.props.name,
            value = this.props.value;

        if ((typeof value === "undefined" ? "undefined" : _typeof(value)) == "object" && value["$date"]) value = value["$date"];

        return React.createElement(
            "div",
            { className: name },
            value
        );
    }
});

var data = [{ _id: 1, price: "200000", state: "MD" }, { _id: 2, price: "175000", state: "MD" }];

ReactDOM.render(React.createElement(Listings, { listings: data }), document.getElementById('content'));
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map