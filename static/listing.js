"use strict";
"use babel"
/*
sq ft math: String(1000+Math.floor(list price/sq ft)).substr(1)
the tasting room: 39.415732,-77.410943
https://www.google.com/maps/dir/39.415674,-77.410997/39.429216,-77.421175
*/

;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ListingApp = (function () {
    function ListingApp() {
        _classCallCheck(this, ListingApp);

        _.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem".split(","), function (m) {
            window[m] = ReactBootstrap[m];
        }); // pollute global namespace for convenience
        this.loadAndRenderData();
        this.signaller = {
            headersSorted: new signals.Signal(),
            headerUpdated: new signals.Signal()
        };
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
            if (header) this.props.save(_.omit(this.state.header, "showModal"));
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
                    header.text
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
            var opts = ["default", "success"],
                moveStyle = opts[+!!this.props.canMove],
                curStyle = opts[+!!this.props.currentActivesOnly],
                rankStyle = opts[+!!this.props.canRank],
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
                Row,
                { className: "control", style: { top: this.props.canMove * 20 + 34 } },
                React.createElement(
                    Col,
                    { md: 5, mdOffset: 7 },
                    React.createElement(
                        "span",
                        { className: "pull-right" },
                        React.createElement(
                            Button,
                            {
                                bsStyle: rankStyle,
                                onClick: _.bind(this.props.toggleRank) },
                            "Rank"
                        ),
                        React.createElement(
                            Button,
                            {
                                bsStyle: "info",
                                onClick: _.bind(this.signal, this, "newField") },
                            "New Field"
                        ),
                        React.createElement(
                            Button,
                            {
                                bsStyle: curStyle,
                                onClick: this.props.toggleCurrentActives },
                            "Current Actives"
                        ),
                        React.createElement(
                            Button,
                            {
                                bsStyle: moveStyle,
                                onClick: this.props.toggleMove },
                            "Toggle move"
                        ),
                        React.createElement(
                            DropdownButton,
                            {
                                pullRight: true,
                                title: "Unhide",
                                id: "unhide" },
                            hidden
                        )
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
        value: function formatter_string(s) {
            return s;
        }
    }, {
        key: "formatter_number",
        value: function formatter_number(s) {
            return String(s);
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
        // formatter_lot_size(value) {return String(100000 + parseInt(value || 0)).substr(1) }

    }, {
        key: "formatter_new_35",
        value: function formatter_new_35(value, listing, keys, header) {
            var url = "https://www.google.com/maps" + "?saddr=" + listing[keys.latitude] + "," + listing[keys.longitude] + "&daddr=" + header.distanceTo + "&output=embed";
            return React.createElement(
                "a",
                { href: url, className: "fancybox-media fancybox.iframe", target: "_blank" },
                value
            );
        }
    }, {
        key: "formatter_address",
        value: function formatter_address(value, listing, keys, header, apikey) {
            var url = "https://www.google.com/maps" + "?q=" + listing[keys.latitude] + "," + listing[keys.longitude] + "&output=embed";
            // var url = "http://maps.googleapis.com/maps/api/streetview?size=800x500"
            //             + "&location=" + listing[keys.latitude] + "," + listing[keys.longitude]
            //             + "&key=" + apikey
            return React.createElement(
                "a",
                { href: url, className: "fancybox-media fancybox.iframe", target: "_blank" },
                value
            );
        }
    }, {
        key: "formatter",
        value: function formatter(value, listing, keys, header) {
            return (this["formatter_" + header.redfin.replace(/\s/g, "_")] || this["formatter_" + (typeof value === "undefined" ? "undefined" : _typeof(value))] || this.formatter_undef)(value, listing, keys, header, this.props.api);
        }
    }, {
        key: "render",
        value: function render() {
            if (!this.props) return false;
            var value = this.props.listing[this.props.header._id];

            return React.createElement(
                Col,
                { md: 1, style: { overflow: "hidden", height: 20, whiteSpace: "nowrap" } },
                this.formatter(value, this.props.listing, this.props.keys, this.props.header)
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
            return _this9.getListingSortValue(l, _this9.state.headers);
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
        value: function toggleRank() {
            this.setState({ canRank: !this.state.canRank });
            this.updateState(function (s) {
                return s.canRank = !s.canRank;
            });
        }
    }, {
        key: "getListingSortValue",
        value: function getListingSortValue(listing, headers) {
            return _.chain(headers).first(6).map(function (h) {
                return listing[h._id];
            }).map(function (value) {
                return (/^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value
                );
            }).value().join("$");
        }
    }, {
        key: "updateDistances",
        value: function updateDistances(opts) {
            var _this10 = this;

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

            var _opts$map$pop = opts.map.pop();

            var _opts$map$pop2 = _slicedToArray(_opts$map$pop, 7);

            var index = _opts$map$pop2[0];
            var listing_id = _opts$map$pop2[1];
            var lat = _opts$map$pop2[2];
            var long = _opts$map$pop2[3];
            var id = _opts$map$pop2[4];
            var distanceTo = _opts$map$pop2[5];
            var headerName = _opts$map$pop2[6];

            if (!index) return;

            var request = _.clone(opts.base);
            _.extend(request, { origin: lat + "," + long, destination: distanceTo });
            opts.directionsService.route(request, function (response, status) {
                var duration;
                try {
                    duration = parseInt(response.routes[0].legs[0].duration.text); // distance.text, duration.text
                } catch (e) {
                    console.log("error getting directions for", listing, e);
                    duration = 0;
                }
                var state = _.clone(_this10.state);
                state.listings[index][id] = duration;
                _this10.setState(state);
                _this10.updateListingDB(listing_id, headerName, duration);
            });

            _.delay(_.bind(this.updateDistances, this), opts.wait, opts);
        }
    }, {
        key: "updateListingDB",
        value: function updateListingDB(id, headerName, value) {
            var data = { id: id, headername: headerName, value: value };
            app.retryAjax(JSON.stringify(data), { api: "savelistingdata", type: "post" }).done((function (content) {
                console.log("worked!", content);
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
            var _this11 = this;

            var state = _.clone(this.state),
                keys = this.props.keys,
                dt = keys.last_loaded;

            state.currentActivesOnly = !state.currentActivesOnly;
            state.listings = _.chain(state.allListings).filter(function (l) {
                return !state.currentActivesOnly || l[dt].$date == state.maxDate && l[keys.status].toLowerCase() == "active";
            }).sortBy(function (l) {
                return _this11.getListingSortValue(l, state.headers);
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
            var _this12 = this;

            this.updateState(function (s) {
                return _this12.toggleHeaderVisibility(s.hidden, s.headers, id, true);
            }, function () {
                return _this12.saveHeaderValue(null, "show", id, true);
            });
        }
    }, {
        key: "hideHeader",
        value: function hideHeader(id) {
            var _this13 = this;

            this.updateState(function (s) {
                return _this13.toggleHeaderVisibility(s.headers, s.hidden, id, true);
            }, function () {
                return _this13.saveHeaderValue(null, "show", id, false);
            });
        }
    }, {
        key: "saveHeader",
        value: function saveHeader(header) {
            var _this14 = this;

            this.updateState(function (s) {
                return s.headers[_.findIndex(s.headers, function (h) {
                    return h._id == header._id;
                })] = header;
            }, function () {
                return _this14.saveHeader(header);
            });
        }
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
                return _this15.getListingSortValue(l, state.headers);
            });
            this.setState(state);
            this.saveHeaderValue(state.headers, "sequence");
        }
    }, {
        key: "saveHeader",
        value: function saveHeader(header) {
            app.retryAjax(JSON.stringify(header), { api: "/saveheader", type: "post" }).done((function (content) {
                console.log("saving header worked!", header, arguments);
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
                console.log("saving worked!", data, arguments);
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "addNewField",
        value: function addNewField() {
            var len = this.state.headers.length,
                state = _.clone(this.state),
                header = _.extend(_.clone(state.fields[0]), {
                _id: len,
                redfin: "new_" + len,
                sequence: len,
                show: true,
                text: "new_" + len });

            state.headers.push(header);
            _.each(state.listings, function (l) {
                return l.push("");
            });
            this.setState(newState);

            retryAjax(JSON.stringify(header), { api: "/savenewfield", type: "post" }).done((function (content) {
                console.log("worked!", arguments);
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "render",
        value: function render() {
            var _this16 = this;

            var listings = _.map(this.state.listings, function (listing) {
                return React.createElement(Listing, {
                    api: _this16.props.api,
                    key: listing[0],
                    keys: _this16.props.keys,
                    listing: listing,
                    headers: _this16.state.headers });
            });
            return React.createElement(
                Grid,
                { fluid: true },
                React.createElement(Header, {
                    headers: this.state.headers,
                    canMove: this.state.canMove,
                    listings: this.state.listings,
                    save: _.bind(this.saveHeader, this),
                    hide: _.bind(this.hideHeader, this) }),
                React.createElement(Control, {
                    hidden: this.state.hidden,
                    canRank: this.state.canRank,
                    canMove: this.state.canMove,
                    showHeader: _.bind(this.showHeader, this),
                    currentActivesOnly: this.state.currentActivesOnly,
                    toggleMove: _.bind(this.toggleMove, this),
                    toggleRank: _.bind(this.toggleRank, this),
                    toggleCurrentActives: _.bind(this.toggleCurrentActives, this) }),
                React.createElement("div", { style: { paddingTop: this.state.canMove * 20 + 68 } }),
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

        var _this17 = _possibleConstructorReturn(this, Object.getPrototypeOf(FieldEditor).call(this, props));

        _this17.state = _.clone(props);
        return _this17;
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
            this.props.update(function (s) {
                return s.header[name] = value;
            });
            if (name != "bucketSize") return;
            if (value == "*") _.each(this.props.values, function (v) {
                return buckets[v] = 0;
            });else if (value != "") _.chain(this.props.values).map(function (v) {
                return Math.floor(v / value);
            }).uniq().map(function (v) {
                return v * value;
            }).sortBy().each(function (v) {
                return buckets[v] = 0;
            });
            this.props.update(function (s) {
                return s.header["buckets"] = buckets;
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
                        React.createElement(Field, _extends({ title: "Bucket Size" }, props, { text: "* = use distinct values" })),
                        React.createElement(Field, _extends({ title: "Bucket Multiplier" }, props)),
                        React.createElement(Buckets, { buckets: this.state.header.buckets }),
                        React.createElement(Field, _extends({ title: "» Math", name: "math" }, props)),
                        React.createElement(Field, _extends({ title: "» Distance To", name: "distanceTo" }, props))
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
        key: "update",
        value: function update() {}
    }, {
        key: "render",
        value: function render() {
            var _this19 = this;

            if (!this.props.buckets) return false;
            var buckets = [];
            _.chain(this.props.buckets).keys().first(12).each(function (bucket) {
                buckets.push(React.createElement(
                    Col,
                    { md: 2 },
                    bucket
                ));
                buckets.push(React.createElement(
                    Col,
                    { md: 2 },
                    React.createElement("input", { type: "text", defaultValue: _this19.props.buckets[bucket], onChange: _this19.update })
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