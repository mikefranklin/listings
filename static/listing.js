"use strict";
"use babel"
/*
sq ft math: String(1000+Math.floor(list price/sq ft)).substr(1)
the tasting room: 39.415732,-77.410943
https://www.google.com/maps/dir/39.415674,-77.410997/39.429216,-77.421175
*/

;

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ListingApp = (function () {
    function ListingApp() {
        _classCallCheck(this, ListingApp);

        _.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem,Navbar,Nav,NavItem,NavDropdown".split(","), function (m) {
            window[m] = ReactBootstrap[m];
        }); // pollute global namespace for convenience
        this.loadAndRenderData();
        this.signaller = {
            headersSorted: new signals.Signal(),
            headerUpdated: new signals.Signal()
        };
        this.colors = ["#CBEAF6", "#B9E3F3", "#A8DCF0", "#96D5ED", "#87CEEB", "#73C7E7", "#62BFE4", "#51B8E1", "#3FB1DE", "#2EAADC"];
        console.log(this.colors);
        return this;
    }

    _createClass(ListingApp, [{
        key: "loadAndRenderData",
        value: function loadAndRenderData() {
            this.retryAjax({}, { api: "/getalldata", type: "get" }).done((function (content) {
                // headers, listings, keys, api
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api);
                ReactDOM.render(React.createElement(App, content), document.getElementById('content'), function () {
                    $('.fancybox-media').fancybox({
                        openEffect: 'none',
                        closeEffect: 'none',
                        helpers: { media: {} }
                    });
                });
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "retryAjax",
        value: function retryAjax(params, options) {
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

    }]);

    return ListingApp;
})();

var app = new ListingApp();

var Header = (function (_React$Component) {
    _inherits(Header, _React$Component);

    function Header() {
        _classCallCheck(this, Header);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Header).apply(this, arguments));
    }

    _createClass(Header, [{
        key: "componentDidUpdate",
        value: function componentDidUpdate() {
            var sortNode = $(ReactDOM.findDOMNode(this));
            sortNode = sortNode.sortable({
                cursor: "move",
                items: ".item",
                handle: ".move",
                update: _.bind(app.signaller.headersSorted.dispatch, null, sortNode)
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            var items = _.map(this.props.headers, function (header) {
                var values = _.chain(_this2.props.listings).pluck(header._id).uniq().value(); // unique values for bucketing
                return React.createElement(HeaderItem, {
                    showUK: _this2.props.showUK,
                    save: _this2.props.save,
                    hide: _this2.props.hide,
                    canMove: _this2.props.canMove,
                    key: header._id,
                    values: values,
                    header: header });
            });
            return React.createElement(
                Row,
                { className: "header" },
                items
            );
        }
    }]);

    return Header;
})(React.Component);

var HeaderItem = (function (_React$Component2) {
    _inherits(HeaderItem, _React$Component2);

    function HeaderItem(props) {
        _classCallCheck(this, HeaderItem);

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(HeaderItem).call(this, props));

        _this3.state = _.clone(props);
        return _this3;
    }

    _createClass(HeaderItem, [{
        key: "updateState",
        value: function updateState(updater, save) {
            var state = _.clone(this.state);
            updater(state);
            this.setState(state);
            if (save) save();
            return state;
        }
    }, {
        key: "openFieldEditor",
        value: function openFieldEditor() {
            this.updateState(function (s) {
                return s.showModal = true;
            });
        }
    }, {
        key: "closeFieldEditor",
        value: function closeFieldEditor(header) {
            this.updateState(function (s) {
                return _.extend(s, header || {}, { showModal: false });
            });
            if (header) {
                this.props.save(_.omit(this.state.header, "showModal", "updateRanking"), this.state.updateRanking);
            }
        }
    }, {
        key: "render",
        value: function render() {
            var header = this.props.header,
                move = React.createElement(
                "div",
                { className: "btn-xsmall move", bsSize: "xsmall" },
                React.createElement("i", { className: "fa fa-bars" })
            );
            return React.createElement(
                Col,
                { md: 1, "data-id": header._id, className: "item" },
                this.props.canMove ? move : null,
                React.createElement(
                    "div",
                    { className: "edit", onClick: _.bind(this.openFieldEditor, this) },
                    this.props.showUK && header.ukText ? header.ukText : header.text
                ),
                React.createElement(
                    "div",
                    { className: "togglevis", onClick: _.bind(this.props.hide, null, header._id) },
                    React.createElement("i", { className: "fa fa-bolt" })
                ),
                React.createElement(FieldEditor, {
                    values: this.props.values,
                    showModal: this.state.showModal,
                    header: this.state.header,
                    update: _.bind(this.updateState, this),
                    close: _.bind(this.closeFieldEditor, this) })
            );
        }
    }]);

    return HeaderItem;
})(React.Component);

var Control = (function (_React$Component3) {
    _inherits(Control, _React$Component3);

    function Control() {
        _classCallCheck(this, Control);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Control).apply(this, arguments));
    }

    _createClass(Control, [{
        key: "signal",
        value: function signal(name) {
            var _app$signaller$name;

            (_app$signaller$name = app.signaller[name]).dispatch.apply(_app$signaller$name, _toConsumableArray(_.toArray(arguments).slice(1)));
        }
    }, {
        key: "render",
        value: function render() {
            var _this5 = this;

            if (!this.props) return false;
            var offOn = ["fa fa-circle-o", "fa fa-check"],
                hidden = _.map(this.props.hidden, function (header) {
                return React.createElement(
                    MenuItem,
                    {
                        key: header._id,
                        onSelect: _.bind(_this5.props.showHeader, null, header._id) },
                    header.text
                );
            });
            return React.createElement(
                Navbar,
                { fixedTop: true },
                React.createElement(
                    Navbar.Header,
                    null,
                    React.createElement(
                        Navbar.Brand,
                        null,
                        "Listings"
                    )
                ),
                React.createElement(
                    Nav,
                    null,
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 1,
                            onClick: this.props.toggleRank },
                        React.createElement("i", { className: offOn[+!!this.props.canRank] }),
                        " Rank"
                    ),
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 2,
                            onClick: this.props.toggleUK },
                        React.createElement("i", { className: offOn[+!!this.props.showUK] }),
                        " UK units"
                    ),
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 3,
                            onClick: this.props.toggleMove },
                        React.createElement("i", { className: offOn[+!!this.props.canMove] }),
                        " Resequence"
                    ),
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 4,
                            onClick: this.props.toggleCurrentActives },
                        React.createElement("i", { className: offOn[+!!this.props.currentActivesOnly] }),
                        "Actives only"
                    ),
                    React.createElement(
                        NavDropdown,
                        { eventKey: 5, title: "Unhide", id: "basic-nav-dropdown" },
                        hidden
                    )
                ),
                React.createElement(
                    Nav,
                    { pullRight: true },
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 5,
                            onClick: this.props.addNewField },
                        "Add new field"
                    )
                )
            );
        }
    }]);

    return Control;
})(React.Component);

var Listing = (function (_React$Component4) {
    _inherits(Listing, _React$Component4);

    function Listing() {
        _classCallCheck(this, Listing);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Listing).apply(this, arguments));
    }

    _createClass(Listing, [{
        key: "render",
        value: function render() {
            var _this7 = this;

            if (!this.props) return false;
            var items = _.map(this.props.headers, function (header) {
                return React.createElement(ListingItem, {
                    toggleIcon: _this7.props.toggleIcon,
                    updateState: _this7.props.updateState,
                    showUK: _this7.props.showUK,
                    canRank: _this7.props.canRank,
                    api: _this7.props.api,
                    key: header._id,
                    keys: _this7.props.keys,
                    redfin: header.redfin,
                    listing: _this7.props.listing,
                    header: header });
            });
            return React.createElement(
                Row,
                { className: "house" },
                items
            );
        }
    }]);

    return Listing;
})(React.Component);

var ListingItem = (function (_React$Component5) {
    _inherits(ListingItem, _React$Component5);

    function ListingItem() {
        _classCallCheck(this, ListingItem);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ListingItem).apply(this, arguments));
    }

    _createClass(ListingItem, [{
        key: "formatter_undef",
        value: function formatter_undef() {
            return "~undefined~";
        }
    }, {
        key: "formatter_date",
        value: function formatter_date(obj) {
            return new Date(obj.$date).toLocaleString('en-US');
        }
    }, {
        key: "formatter_string",
        value: function formatter_string(value, listing, keys, header, apikey, showUK) {
            return showUK && header.ukMultiplier ? Math.floor(value * header.ukMultiplier) : value;
        }
    }, {
        key: "formatter_number",
        value: function formatter_number(value, listing, keys, header, apikey, showUK) {
            return showUK && header.ukMultiplier ? Math.floor(value * header.ukMultiplier) : value;
        }
    }, {
        key: "formatter_object",
        value: function formatter_object(obj) {
            var f = _.find([["$date", "date"]], function (pair) {
                return obj[pair[0]] !== undefined;
            });
            return f ? this["formatter_" + f[1]](obj) : this.formatter_undef();
        }
    }, {
        key: "formatter_url",
        value: function formatter_url(url) {
            return React.createElement(
                "a",
                { href: url, target: "_blank" },
                "Redfin"
            );
        }
    }, {
        key: "formatter_new_35",
        value: function formatter_new_35(value, listing, keys, header, apikey, showUK) {
            var url = "https://www.google.com/maps" + "?saddr=" + listing[keys.latitude] + "," + listing[keys.longitude] + "&daddr=" + header.distanceTo + "&output=embed";
            return React.createElement(
                "a",
                { href: url, className: "fancybox-media fancybox.iframe", target: "_blank" },
                showUK && header.ukMultiplier ? Math.floor(value * header.ukMultiplier) : value
            );
        }
    }, {
        key: "formatter_new_36",
        value: function formatter_new_36(value, listing, keys, header, apikey, showUK) {
            return React.createElement("i", { className: "fa fa-" + (value == "" ? "dot-circle-o no-selection" : value) });
        }
    }, {
        key: "formatter_address",
        value: function formatter_address(value, listing, keys, header, apikey, showUK) {
            var url = "https://www.google.com/maps" + "?q=" + listing[keys.latitude] + "," + listing[keys.longitude] + "&output=embed";
            return React.createElement(
                "a",
                { href: url, className: "fancybox-media fancybox.iframe", target: "_blank" },
                value
            );
        }
    }, {
        key: "formatter",
        value: function formatter(value, listing, keys, header, showUK) {
            return (this["formatter_" + header.redfin.replace(/\s/g, "_")] || this["formatter_" + (typeof value === "undefined" ? "undefined" : _typeof(value))] || this.formatter_undef)(value, listing, keys, header, this.props.api, showUK);
        }
    }, {
        key: "render",
        value: function render() {
            if (!this.props) return false;
            var p = this.props,
                h = p.header,
                value = p.listing[h._id],
                style = { overflow: "hidden", height: 20, whiteSpace: "nowrap" },
                toggle = !h.toggleIcons ? null : {
                onClick: _.bind(this.props.toggleIcon, null, p.listing, h._id),
                className: "toggleicons" },
                bucket;
            if (p.canRank && h.bucketSize && h.buckets) {
                bucket = h.buckets[Math.floor(value / h.bucketSize) * h.bucketSize];
                if (bucket) _.extend(style, { backgroundColor: bucket[1] });
            }
            return React.createElement(
                Col,
                _extends({ md: 1, style: style }, toggle),
                this.formatter(value, p.listing, p.keys, p.header, p.showUK)
            );
        }
    }]);

    return ListingItem;
})(React.Component);

var App = (function (_React$Component6) {
    _inherits(App, _React$Component6);

    function App(props) {
        _classCallCheck(this, App);

        var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(App).call(this, props)); //headers, listings, keys

        var cao = true;
        var keys = props.keys;
        var dt = keys.last_loaded;
        var maxDate = _.chain(props.listings).map(function (l) {
            return l[dt].$date;
        }).max().value();

        var _$partition = _.partition(props.headers, function (h) {
            return h.show;
        });

        var _$partition2 = _slicedToArray(_$partition, 2);

        var displayable = _$partition2[0];
        var hidden = _$partition2[1];
        var listings = _this9.updateMath(_.clone(props));

        _this9.state = { currentActivesOnly: true, canMove: false, canRank: false,
            headers: displayable, hidden: hidden,
            maxDate: maxDate, allListings: listings,
            apikey: props.api };
        _this9.state.listings = _.chain(listings).filter(function (l) {
            return !cao || l[dt].$date == maxDate && l[keys.status].toLowerCase() == "active";
        }).sortBy(function (l) {
            return _this9.getListingSortValue(l, _this9.state.headers, _this9.state.canRank);
        }).value();
        app.signaller.headersSorted.add(_.bind(_this9.reorderHeaders, _this9));
        app.signaller.headerUpdated.add(function (id, redfin, value) {
            return _this9.updateState(function (s) {
                return s.headers[id][redfin] = value;
            }, function () {
                return _this9.saveHeaderValue(null, redfin, id, value);
            });
        });
        _.delay(_.bind(_this9.updateDistances, _this9), 1000); // wait for google to load?
        return _this9;
    }

    _createClass(App, [{
        key: "toggleRank",
        value: function toggleRank(force) {
            var _this10 = this;

            // 1st param may be (ignored) mouse event or boolean
            var state = _.clone(this.state),
                shouldRank = typeof force == "boolean" && force ? true : state.canRank = !state.canRank;

            state.listings = _.sortBy(state.listings, function (l) {
                return _this10.getListingSortValue(l, state.headers, shouldRank);
            });
            this.setState(state);
        }
    }, {
        key: "toggleUK",
        value: function toggleUK() {
            this.updateState(function (s) {
                return s.showUK = !s.showUK;
            });
        }
    }, {
        key: "getListingSortValue",
        value: function getListingSortValue(listing, headers, canRank) {
            var res;
            if (!canRank) return _.chain(headers).first(6).map(function (h) {
                return listing[h._id];
            }).map(function (value) {
                return (/^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value
                );
            }).value().join("$");
            res = _.chain(headers).filter(function (h) {
                return h.bucketSize && h.buckets;
            }).reduce(function (ranking, h) {
                return ranking - parseInt(h.buckets[Math.floor(listing[h._id] / h.bucketSize) * h.bucketSize] || 0) * parseInt(h.bucketMultiplier || 1);
            }, 0).value();
            return res;
        }
    }, {
        key: "updateDistances",
        value: function updateDistances(opts) {
            var _this11 = this;

            if (!opts) {
                var lat = this.props.keys.latitude,
                    long = this.props.keys.longitude,
                    headers = _.filter(this.state.headers, function (h) {
                    return !_.isEmpty(h.distanceTo);
                });
                if (!headers.length) return;
                opts = { map: [], wait: 1000,
                    base: { travelMode: google.maps.TravelMode.WALKING },
                    directionsService: new google.maps.DirectionsService() };
                _.each(this.state.listings, function (l, index) {
                    _.each(headers, function (h) {
                        if (!l[h._id]) opts.map.push([index, l[0], l[lat], l[long], h._id, h.distanceTo, h.redfin]);
                    });
                });
                if (!opts.map.length) return;
            }

            if (!opts.map.length) return;
            var index, listing_id, lat, long, id, distanceTo, headerName;

            var _opts$map$pop = opts.map.pop();

            var _opts$map$pop2 = _slicedToArray(_opts$map$pop, 7);

            index = _opts$map$pop2[0];
            listing_id = _opts$map$pop2[1];
            lat = _opts$map$pop2[2];
            long = _opts$map$pop2[3];
            id = _opts$map$pop2[4];
            distanceTo = _opts$map$pop2[5];
            headerName = _opts$map$pop2[6];

            var request = _.clone(opts.base);
            _.extend(request, { origin: lat + "," + long, destination: distanceTo });
            opts.directionsService.route(request, function (response, status) {
                var duration;
                try {
                    duration = parseInt(response.routes[0].legs[0].duration.text); // distance.text, duration.text
                } catch (e) {
                    console.log("error getting directions for", request, e);
                    duration = 0;
                }
                var state = _.clone(_this11.state);
                state.listings[index][id] = duration;
                _this11.setState(state);
                _this11.updateListingDB(listing_id, headerName, duration);
            });

            _.delay(_.bind(this.updateDistances, this), opts.wait, opts);
        }
    }, {
        key: "updateListingDB",
        value: function updateListingDB(id, headerName, value) {
            var data = { id: id, headername: headerName, value: value };
            app.retryAjax(JSON.stringify(data), { api: "savelistingdata", type: "post" }).done((function (content) {
                console.log("saving listing value worked!", content);
            }).bind(this)).fail((function () {
                console.log("failed", arguments);
            }).bind(this));
        }
    }, {
        key: "updateMath",
        value: function updateMath(content) {
            _.chain(content.headers).filter(function (f) {
                return f.math !== undefined;
            }).each(function (f) {
                var math = f.math,
                    id = f._id;
                _.each(content.headers, function (f) {
                    math = math.replace(new RegExp(f.redfin), "l[" + f._id + "]");
                });
                _.each(content.listings, function (l) {
                    try {
                        eval("l[" + id + "]=" + math);
                    } catch (e) {
                        l[id] = "***";
                    }
                });
            });
            return content.listings;
        }
    }, {
        key: "toggleCurrentActives",
        value: function toggleCurrentActives() {
            var _this12 = this;

            var state = _.clone(this.state),
                keys = this.props.keys,
                dt = keys.last_loaded;

            state.currentActivesOnly = !state.currentActivesOnly;
            state.listings = _.chain(state.allListings).filter(function (l) {
                return !state.currentActivesOnly || l[dt].$date == state.maxDate && l[keys.status].toLowerCase() == "active";
            }).sortBy(function (l) {
                return _this12.getListingSortValue(l, state.headers, state.canRank);
            }).value();

            this.setState(state);
        }
    }, {
        key: "toggleMove",
        value: function toggleMove() {
            this.updateState(function (s) {
                return s.canMove = !s.canMove;
            });
        }
    }, {
        key: "showHeader",
        value: function showHeader(id) {
            var _this13 = this;

            this.updateState(function (s) {
                return _this13.toggleHeaderVisibility(s.hidden, s.headers, id, true);
            }, function () {
                return _this13.saveHeaderValue(null, "show", id, true);
            });
        }
    }, {
        key: "hideHeader",
        value: function hideHeader(id) {
            var _this14 = this;

            this.updateState(function (s) {
                return _this14.toggleHeaderVisibility(s.headers, s.hidden, id, true);
            }, function () {
                return _this14.saveHeaderValue(null, "show", id, false);
            });
        }
        // saveHeader(header) {
        //     this.updateState(s => s.headers[_.findIndex(s.headers, h => h._id == header._id)] = header,
        //                     () => this.saveHeader(header))
        // }

    }, {
        key: "updateState",
        value: function updateState(updater, save) {
            var state = _.clone(this.state);
            updater(state);
            this.setState(state);
            if (save) save();
            return state;
        }
    }, {
        key: "toggleHeaderVisibility",
        value: function toggleHeaderVisibility(source, target, id, show) {
            return _.sortBy(target.push(_.extend(source.splice(_.findIndex(source, function (h) {
                return h._id == id;
            }), 1)[0], { show: show })), "sequence");
        }
    }, {
        key: "reorderHeaders",
        value: function reorderHeaders(sortNode) {
            var _this15 = this;

            var ids = sortNode.sortable("toArray", { attribute: "data-id" }),
                state = _.clone(this.state);

            ids.forEach(function (id, index) {
                _.find(state.headers, function (item) {
                    return item._id == id;
                }).sequence = index;
            });
            state.headers = _.sortBy(state.headers, "sequence");
            sortNode.sortable("cancel");
            state.listings = _.sortBy(state.listings, function (l) {
                return _this15.getListingSortValue(l, state.headers, state.canRank);
            });
            this.setState(state);
            this.saveHeaderValue(state.headers, "sequence");
        }
    }, {
        key: "saveHeader",
        value: function saveHeader(header, updateRanking) {
            app.retryAjax(JSON.stringify(header), { api: "/saveheader", type: "post" }).done((function (content) {
                console.log("saving header worked!", header, arguments);
                if (updateRanking && this.state.canRank) this.toggleRank(true);
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "saveHeaderValue",
        value: function saveHeaderValue(headers, redfin, id, value) {
            var data = { redfin: redfin,
                data: headers ? _.map(headers, function (header) {
                    return [header._id, header[redfin]];
                }) : [[id, value]] };
            app.retryAjax(JSON.stringify(data), { api: "/saveheadervalue", type: "post" }).done((function (content) {
                console.log("saving header value worked!", data, arguments);
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "addNewField",
        value: function addNewField() {
            var maxShownId = _.max(this.state.headers, "_id"),
                maxHiddenId = _.max(this.state.hidden, "_id"),
                newId = 1 + (maxShownId._id > maxHiddenId._id ? maxShownId._id : maxHiddenId_.id),
                state = _.clone(this.state),
                header = _.extend(_.clone(state.headers[0]), {
                _id: newId,
                redfin: "new_" + newId,
                sequence: newId,
                show: true,
                text: "new_" + newId });

            state.headers.push(header);
            _.each(state.listings, function (l) {
                return l.push("");
            });
            this.setState(state);

            app.retryAjax(JSON.stringify(header), { api: "/savenewfield", type: "post" }).done((function (content) {
                console.log("added new field!", arguments);
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "toggleIcon",
        value: function toggleIcon(listing, hId, event) {
            var _this16 = this;

            var value = listing[hId],
                header = _.find(this.state.headers, function (h) {
                return h._id == hId;
            }),
                icons = header.toggleIcons.split(","),
                icon = icons[value == "" ? 0 : (_.indexOf(icons, value) + 1) % icons.length];
            this.updateState(function (s) {
                return _.find(s.listings, function (l) {
                    return l[0] == listing[0];
                })[hId] = icon;
            }, function (s) {
                return _this16.updateListingDB(listing[0], header.redfin, icon);
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this17 = this;

            var listings = _.map(this.state.listings, function (listing) {
                return React.createElement(Listing, {
                    toggleIcon: _.bind(_this17.toggleIcon, _this17),
                    updateState: _.bind(_this17.updateState, _this17),
                    canRank: _this17.state.canRank,
                    showUK: _this17.state.showUK,
                    api: _this17.props.api,
                    key: listing[0],
                    keys: _this17.props.keys,
                    listing: listing,
                    headers: _this17.state.headers });
            });
            return React.createElement(
                Grid,
                { fluid: true },
                React.createElement(Control, {
                    hidden: this.state.hidden,
                    canRank: this.state.canRank,
                    canMove: this.state.canMove,
                    showUK: this.state.showUK,
                    showHeader: _.bind(this.showHeader, this),
                    currentActivesOnly: this.state.currentActivesOnly,
                    toggleUK: _.bind(this.toggleUK, this),
                    toggleMove: _.bind(this.toggleMove, this),
                    toggleRank: _.bind(this.toggleRank, this),
                    addNewField: _.bind(this.addNewField, this),
                    toggleCurrentActives: _.bind(this.toggleCurrentActives, this) }),
                React.createElement(Header, {
                    headers: this.state.headers,
                    canMove: this.state.canMove,
                    listings: this.state.listings,
                    showUK: this.state.showUK,
                    save: _.bind(this.saveHeader, this),
                    hide: _.bind(this.hideHeader, this) }),
                listings
            );
        }
    }]);

    return App;
})(React.Component);

var FieldEditor = (function (_React$Component7) {
    _inherits(FieldEditor, _React$Component7);

    function FieldEditor(props) {
        _classCallCheck(this, FieldEditor);

        var _this18 = _possibleConstructorReturn(this, Object.getPrototypeOf(FieldEditor).call(this, props));

        _this18.state = _.clone(props);
        return _this18;
    }

    _createClass(FieldEditor, [{
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            this.setState(_.clone(nextProps));
        }
    }, {
        key: "updateFieldValue",
        value: function updateFieldValue(name, event) {
            var buckets = {},
                value = event.target.value;

            if (/^bucket/.test(name)) this.props.update(function (s) {
                s.header[name] = value;s.updateRanking = true;
            });else this.props.update(function (s) {
                return s.header[name] = value;
            });
            if (name != "bucketSize") return;
            if (value == "*") _.each(this.props.values, function (v) {
                return buckets[v] = [0, ""];
            });else if (value != "") _.chain(this.props.values).map(function (v) {
                return Math.floor(v / value);
            }).uniq().map(function (v) {
                return v * value;
            }).sortBy().each(function (v) {
                return buckets[v] = [0, ""];
            });
            this.props.update(function (s) {
                return s.header["buckets"] = buckets;
            });
        }
    }, {
        key: "updateBuckets",
        value: function updateBuckets(bucket, event) {
            this.props.update(function (s) {
                s.header["buckets"][bucket] = [event.target.value, ""];
                console.log(app.colors);
                var buckets = s.header.buckets,
                    min = !buckets ? 0 : _.min(buckets, function (wc) {
                    return +wc[0];
                })[0],
                    max = !buckets ? 0 : _.max(buckets, function (wc) {
                    return +wc[0];
                })[0],
                    mult = !max ? 0 : (app.colors.length - 2) / (max - min);
                s.header.buckets = _.mapObject(buckets, function (data) {
                    var wc = typeof data == "number" ? [data, ""] : data,
                        color = wc[0] == min ? app.colors[0] : wc[0] && wc[0] == max ? app.colors[app.colors.length - 1] : app.colors[Math.floor((wc[0] - min + 1) * mult)];
                    return [wc[0], color];
                });
            });
        }
    }, {
        key: "render",
        value: function render() {
            var header = this.state.header,
                id = header._id,
                props = { update: _.bind(this.updateFieldValue, this), header: header };
            return React.createElement(
                Modal,
                { show: this.state.showModal, onHide: _.bind(this.props.close, this, null) },
                React.createElement(
                    Modal.Header,
                    { closeButton: true },
                    React.createElement(
                        Modal.Title,
                        null,
                        header.text
                    )
                ),
                React.createElement(
                    Modal.Body,
                    null,
                    React.createElement(
                        Grid,
                        { fluid: true },
                        React.createElement(Field, _extends({ title: "Text" }, props)),
                        React.createElement(Field, _extends({ title: "UK multiplier", name: "ukMultiplier" }, props)),
                        React.createElement(Field, _extends({ title: "UK Text", name: "ukText" }, props)),
                        React.createElement(Field, _extends({ title: "Bucket Size" }, props, { text: "* = use distinct values" })),
                        React.createElement(Field, _extends({ title: "Bucket Multiplier" }, props)),
                        React.createElement(Buckets, {
                            buckets: this.state.header.buckets,
                            updateBuckets: _.bind(this.updateBuckets, this) }),
                        React.createElement(Field, _extends({ title: "» Math", name: "math" }, props)),
                        React.createElement(Field, _extends({ title: "» Distance To", name: "distanceTo" }, props)),
                        React.createElement(Field, _extends({ title: "» Toggle icons", name: "toggleIcons" }, props, { text: "FA icons, without 'fa-'" }))
                    )
                ),
                React.createElement(
                    Modal.Footer,
                    null,
                    React.createElement(
                        Button,
                        { onClick: _.bind(this.props.close, this, this.state.header) },
                        "Save & Close"
                    ),
                    React.createElement(
                        Button,
                        { onClick: _.bind(this.props.close, this, null) },
                        "Close"
                    )
                )
            );
        }
    }]);

    return FieldEditor;
})(React.Component);

var Buckets = (function (_React$Component8) {
    _inherits(Buckets, _React$Component8);

    function Buckets() {
        _classCallCheck(this, Buckets);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Buckets).apply(this, arguments));
    }

    _createClass(Buckets, [{
        key: "render",
        value: function render() {
            var _this20 = this;

            if (!this.props.buckets) return false;
            var buckets = [];
            _.each(this.props.buckets, function (wc, bucket) {
                // bucket = [weight, color]
                buckets.push(React.createElement(
                    Col,
                    {
                        key: "b" + bucket,
                        md: 2,
                        style: { backgroundColor: wc[1], height: 26, paddingTop: 3 } },
                    bucket
                ));
                buckets.push(React.createElement(
                    Col,
                    {
                        key: "v" + bucket,
                        md: 2 },
                    React.createElement("input", {
                        type: "text",
                        defaultValue: wc[0],
                        onChange: _.bind(_this20.props.updateBuckets, null, bucket) })
                ));
            });
            return React.createElement(
                Row,
                null,
                React.createElement(
                    Col,
                    { md: 3, className: "title" },
                    "Bucket values"
                ),
                React.createElement(
                    Col,
                    { md: 9, className: "values" },
                    React.createElement(
                        Grid,
                        { fluid: true },
                        buckets
                    )
                )
            );
        }
    }]);

    return Buckets;
})(React.Component);

var Field = (function (_React$Component9) {
    _inherits(Field, _React$Component9);

    function Field() {
        _classCallCheck(this, Field);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Field).apply(this, arguments));
    }

    _createClass(Field, [{
        key: "render",
        value: function render() {
            if (!this.props) return false;
            var fieldname = this.props.name || this.props.title.substr(0, 1).toLowerCase() + this.props.title.substr(1).replace(/\s+/g, ""),
                desc = this.props.text ? React.createElement(
                "div",
                null,
                this.props.text
            ) : null;
            return React.createElement(
                Row,
                null,
                React.createElement(
                    Col,
                    { md: 3, className: "title" },
                    this.props.title
                ),
                React.createElement(
                    Col,
                    { md: 9, className: "values" },
                    React.createElement("input", { type: "text", defaultValue: this.props.header[fieldname],
                        onChange: _.bind(this.props.update, null, fieldname) }),
                    desc
                )
            );
        }
    }]);

    return Field;
})(React.Component);
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map