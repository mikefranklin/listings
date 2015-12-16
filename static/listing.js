"use strict";
"use babel"
/*

todo: field editor changes don't persist between openings, however save & close saves the data (reload is fine)

*/

/*
sq ft math: String(1000+Math.floor(list price/sq ft)).substr(1)
the tasting room: 39.415732,-77.410943
https://www.google.com/maps/dir/39.415674,-77.410997/39.429216,-77.421175
*/

;

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
        return this;
    }

    _createClass(ListingApp, [{
        key: "loadAndRenderData",
        value: function loadAndRenderData() {
            this.retryAjax({}, { api: "/getalldata", type: "get" }).done((function (content) {
                // headers, listings, keys, api
                console.log(content);
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api);
                ReactDOM.render(React.createElement(App, _.mapObject(content, function (e) {
                    return Immutable.fromJS(e);
                })), document.getElementById('content'), function () {
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
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            this.setState(nextProps);
        }
    }, {
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props.headers !== nextProps.headers || this.props.canMove !== nextProps.canMove || this.props.showUK !== nextProps.showUK;
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            var items = this.props.headers.map(function (header) {
                return React.createElement(HeaderItem, {
                    showUK: _this2.props.showUK,
                    save: _this2.props.save,
                    hide: _this2.props.hide,
                    canMove: _this2.props.canMove,
                    key: header.get("_id"),
                    uniques: _this2.props.uniques.get(header.get("_id")),
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

        _this3.state = props;
        return _this3;
    }

    _createClass(HeaderItem, [{
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props !== nextProps || this.state !== nextState;
        }
    }, {
        key: "openFieldEditor",
        value: function openFieldEditor() {
            this.setState({ showModal: true });
        }
    }, {
        key: "closeFieldEditor",
        value: function closeFieldEditor(header, isNewNotes) {
            var omit = Immutable.Set(["showModal", "updateRanking", "showType"]);

            this.setState({ showModal: false, showType: isNewNotes ? "notes" : null });
            if (header) {
                if (isNewNotes) header = header.set("notes", true);
                this.props.save(header.filter(function (v, key) {
                    return !omit.has(key);
                }), this.state.updateRanking);
            }
        }
    }, {
        key: "render",
        value: function render() {
            var header = this.state.header,
                move = React.createElement(
                "div",
                { className: "btn-xsmall move", bsSize: "xsmall" },
                React.createElement("i", { className: "fa fa-bars" })
            );
            return React.createElement(
                Col,
                { md: 1, "data-id": header.get("_id"), className: "item" },
                this.props.canMove ? move : null,
                React.createElement(
                    "div",
                    { className: "edit", onClick: _.bind(this.openFieldEditor, this) },
                    this.props.showUK && header.get("ukText") ? header.get("ukText") : header.get("text")
                ),
                React.createElement(
                    "div",
                    { className: "togglevis", onClick: _.bind(this.props.hide, null, header.get("_id")) },
                    React.createElement("i", { className: "fa fa-bolt" })
                ),
                React.createElement(FieldEditor, {
                    uniques: this.props.uniques,
                    showModal: this.state.showModal,
                    header: this.state.header,
                    setState: _.bind(this.setState, this),
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
                hidden = this.props.hidden.map(function (header) {
                return React.createElement(
                    MenuItem,
                    {
                        key: header.get("_id"),
                        onSelect: _.bind(_this5.props.showHeader, null, header.get("_id")) },
                    header.get("text")
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
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props.canRank != nextProps.canRank || this.props.showUK != nextProps.showUK || this.props.listing !== nextProps.listing || this.props.headers !== nextProps.headers;
        }
    }, {
        key: "render",
        value: function render() {
            var _this7 = this;

            if (!this.props) return false;
            var items = this.props.headers.map(function (header) {
                return React.createElement(ListingItem, {
                    toggleIcon: _this7.props.toggleIcon,
                    listing: _this7.props.listing,
                    canRank: _this7.props.canRank,
                    showUK: _this7.props.showUK,
                    notes: _this7.props.notes,
                    key: header.get("_id"),
                    keys: _this7.props.keys,
                    api: _this7.props.api,
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

    function ListingItem(props) {
        _classCallCheck(this, ListingItem);

        var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(ListingItem).call(this, props));

        _this8.state = props;
        return _this8;
    }

    _createClass(ListingItem, [{
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props.canRank != nextProps.canRank || this.props.showUK != nextProps.showUK || this.props.listing !== nextProps.listing;
        }
    }, {
        key: "formatter_undef",
        value: function formatter_undef() {
            return "~undefined~";
        }
    }, {
        key: "formatter_string",
        value: function formatter_string(value, listing, keys, header, apikey, showUK) {
            return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value;
        }
    }, {
        key: "formatter_number",
        value: function formatter_number(value, listing, keys, header, apikey, showUK) {
            return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value;
        }
    }, {
        key: "formatter_last_loaded",
        value: function formatter_last_loaded(value, listing, keys, header, apikey, showUK) {
            return new Date(value.get("$date").toLocaleString('en-US'));
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
            var url = "https://www.google.com/maps" + "?saddr=" + listing.get("keys.latitude") + "," + listing.get("keys.longitude") + "&daddr=" + header.get("distanceTo") + "&output=embed";
            return React.createElement(
                "a",
                { href: url, className: "fancybox-media fancybox.iframe", target: "_blank" },
                showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
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
            var url = "https://www.google.com/maps" + "?q=" + listing.get(keys.latitude) + "," + listing.get("keys.longitude") + "&output=embed";
            return React.createElement(
                "a",
                { href: url, className: "fancybox-media fancybox.iframe", target: "_blank" },
                value
            );
        }
    }, {
        key: "formatter",
        value: function formatter(value, listing, keys, header, showUK) {
            return (this["formatter_" + header.get("redfin").replace(/\s/g, "_")] || this["formatter_" + (typeof value === "undefined" ? "undefined" : _typeof(value))] || this.formatter_undef)(value, listing, keys, header, this.props.api, showUK);
        }
    }, {
        key: "openNoteWriter",
        value: function openNoteWriter() {
            this.setState({ showModal: true });
        }
    }, {
        key: "closeNoteWriter",
        value: function closeNoteWriter(id, redfin, event) {
            this.setState({ showModal: false });
        }
    }, {
        key: "render",
        value: function render() {
            // notes = [date, redfin_field, content]
            if (!this.props) return false;
            var p = this.props,
                h = p.header,
                n = p.notes,
                value = p.listing.get(h.get("_id")),
                style = { overflow: "hidden", height: 20, whiteSpace: "nowrap" },
                toggle = !h.get("toggleIcons") ? null : {
                onClick: _.bind(this.props.toggleIcon, null, p.listing, h.get("_id")),
                className: "toggleicons" },
                noteIcon = !h.notes ? null : React.createElement("i", { onClick: _.bind(this.openNoteWriter, this),
                className: "pull-right fa fa-pencil notes " + ["off", "on"][+!!n.size()] }),
                bucketColor,
                bucket;
            if (p.canRank && h.get("bucketSize") && h.get("buckets")) {
                bucket = Math.floor(value / h.get("bucketSize")) * h.get("bucketSize");
                bucketColor = h.getIn(["buckets", String(bucket), 1]);
                if (bucketColor) _.extend(style, { backgroundColor: bucketColor });
            }
            return React.createElement(
                Col,
                _extends({ md: 1, style: style }, toggle),
                this.formatter(value, p.listing, p.keys, p.header, p.showUK),
                noteIcon,
                React.createElement(NoteWriter, {
                    close: _.bind(this.closeNoteWriter, this),
                    showModal: this.state.showModal })
            );
            // header={this.state.header}
            //
        }
    }]);

    return ListingItem;
})(React.Component);

var App = (function (_React$Component6) {
    _inherits(App, _React$Component6);

    // props is js array of Immutable objects

    function App(props) {
        _classCallCheck(this, App);

        var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(App).call(this, props));

        var keys = props.keys.toJS(),
            // no need for them to be immutable
        dtRef = [keys.last_loaded, "$date"],
            showable = props.headers.groupBy(function (h) {
            return h.get("show");
        }),
            listings = _this9.updateMath(props),
            uniques = props.headers.filter(function (h) {
            return h.get("show");
        }).map(function (h) {
            return listings.reduce(function (set, l) {
                set[l.get(h.get("_id"))] = true;return set;
            }, {});
        }).map(function (entry, key) {
            return Immutable.Map(entry).keySeq();
        }); // map rather than in reduce(), to avoid slowness/∞ loop

        _this9.state = { maxDate: listings.maxBy(function (l) {
                return l.getIn(dtRef);
            }).getIn(dtRef),
            headers: showable.get(true),
            hidden: showable.get(false),
            currentActivesOnly: true,
            notes: _this9.props.notes, // [listing_id][redfin] = [{dt: xx, text: xx, …}, …]
            allListings: listings,
            apikey: props.api,
            uniques: uniques, // unique values by field
            canMove: false,
            canRank: false,
            showUK: false,
            dtRef: dtRef,
            keys: keys };

        _this9.state.listings = _this9.getSortedVisibleListings(_this9.state, false);
        app.signaller.headersSorted.add(_.bind(_this9.reorderHeaders, _this9));
        _this9.updateDistances();
        return _this9;
    }

    _createClass(App, [{
        key: "getSortedVisibleListings",
        value: function getSortedVisibleListings(s, shouldRank) {
            var headers = shouldRank ? s.headers.filter(function (h) {
                return h.get("bucketSize") && h.get("buckets");
            }) : s.headers.take(6).map(function (h) {
                return h.get("_id");
            }),
                fn = shouldRank ? function (listing, headers) {
                return headers.reduce(function (ranking, h) {
                    var bucket = Math.floor(listing.get(h.get("_id")) / h.get("bucketSize")) * h.get("bucketSize"),
                        weight = parseInt(h.getIn(["buckets", String(bucket), 0]) || 0),
                        // bucket is [weight, color]
                    mult = parseInt(h.get("bucketMultiplier") || 1);
                    return ranking - weight * mult;
                }, 0);
            } : function (listing, headers) {
                return headers.map(function (id) {
                    return listing.get(id);
                }) // id of data in listing
                .map(function (value) {
                    return (/^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value
                    );
                }).toJS().join("$");
            };

            return s.allListings.filter(function (l) {
                return !s.currentActivesOnly || l.getIn(s.dtRef) == s.maxDate && l.get(s.keys.status).toLowerCase() == "active";
            }).sortBy(function (l) {
                return fn(l, headers);
            });
        }
    }, {
        key: "toggleRank",
        value: function toggleRank(force) {
            // 1st param may be (ignored) mouse event or boolean
            var isForce = typeof force == "boolean" && force,
                state = !isForce ? { canRank: !this.state.canRank } : {};
            state.listings = this.getSortedVisibleListings(this.state, isForce || state.canRank);
            this.setState(state);
        }
    }, {
        key: "toggleUK",
        value: function toggleUK() {
            this.setState({ showUK: !this.state.showUK });
        }
    }, {
        key: "getDistanceOpts",
        value: function getDistanceOpts() {
            var headers = this.state.headers.filter(function (h) {
                return h.get("distanceTo");
            }),
                lat = this.props.keys.get("latitude"),
                long = this.props.keys.get("longitude"),
                opts = { map: [],
                wait: 1000,
                directionsService: new google.maps.DirectionsService() };
            this.state.listings.forEach(function (l, index) {
                headers.filter(function (h) {
                    return !l.get(h.get("_id"));
                }).forEach(function (h) {
                    return opts.map.push([index, l.get(0), l.get(lat), l.get(long), h.get("_id"), h.get("distanceTo"), h.get("redfin")]);
                });
            });
            return opts;
        }
    }, {
        key: "updateDistances",
        value: function updateDistances(opts) {
            var _this10 = this;

            var index, listing_id, lat, long, id, distanceTo, headerName, request, duration;
            if ((typeof google === "undefined" ? "undefined" : _typeof(google)) != "object") {
                console.log("waiting 250ms for google");
                _.delay(_.bind(this.updateDistances, this), 250);
                return;
            }
            if (!opts) opts = this.getDistanceOpts();

            if (!opts.map.length) return;

            var _opts$map$pop = opts.map.pop();

            var _opts$map$pop2 = _slicedToArray(_opts$map$pop, 7);

            index = _opts$map$pop2[0];
            listing_id = _opts$map$pop2[1];
            lat = _opts$map$pop2[2];
            long = _opts$map$pop2[3];
            id = _opts$map$pop2[4];
            distanceTo = _opts$map$pop2[5];
            headerName = _opts$map$pop2[6];

            request = { travelMode: google.maps.TravelMode.WALKING,
                origin: lat + "," + long, destination: distanceTo };

            opts.directionsService.route(request, function (response, status) {
                try {
                    duration = parseInt(response.routes[0].legs[0].duration.text); // distance.text, duration.text
                } catch (e) {
                    console.log("error getting directions for", request, e);
                    duration = 0;
                }
                _this10.setState({ listings: _this10.state.listings.setIn([index, id], duration) });
                _this10.updateListingDB(listing_id, headerName, duration);
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
        value: function updateMath(props) {
            var listings = props.listings,
                name2id = function name2id(t, h) {
                t = t.replace(new RegExp(h.get("redfin")), 'l.get(' + h.get("_id") + ')');return t;
            },
                entries = props.headers.filter(function (h) {
                return h.get("math");
            }).map(function (h) {
                return [h.get("_id"), props.headers.reduce(name2id, h.get("math"))];
            });
            return listings.map(function (l) {
                entries.forEach(function (entry) {
                    var _entry = _slicedToArray(entry, 2);

                    var id = _entry[0];
                    var math = _entry[1];
                    var value = "**";
                    try {
                        value = eval(math);
                    } catch (e) {}
                    l = l.set(id, value);
                });
                return l;
            });
        }
    }, {
        key: "toggleCurrentActives",
        value: function toggleCurrentActives() {
            var state = this.state.set("currentActivesOnly", !this.state.get("currentActivesOnly"));
            state.listings = this.getSortedVisibleListings(state, state.get("canRank"));
            this.setState(state);
        }
    }, {
        key: "toggleMove",
        value: function toggleMove() {
            this.setState({ canMove: !this.state.canMove });
        }
    }, {
        key: "showHeader",
        value: function showHeader(id) {
            this.toggleHeaderVisibility("hidden", "headers", id, true);
        }
    }, {
        key: "hideHeader",
        value: function hideHeader(id) {
            this.toggleHeaderVisibility("headers", "hidden", id, false);
        }
    }, {
        key: "toggleHeaderVisibility",
        value: function toggleHeaderVisibility(source, target, id, show) {
            var _setState;

            var index = this.state[source].findIndex(function (h) {
                return h.get("_id") == id;
            }),
                // one to show
            entry = this.state[source].get(index).set("show", true);
            this.setState((_setState = {}, _defineProperty(_setState, target, this.state[target].push(entry).sortBy(function (h) {
                return h.get("sequence");
            })), _defineProperty(_setState, source, this.state[source].splice(index, 1)), _setState));
            this.saveHeaderValue(null, "show", id, show);
        }
    }, {
        key: "reorderHeaders",
        value: function reorderHeaders(sortNode) {
            var ids = sortNode.sortable("toArray", { attribute: "data-id" }),
                state = this.state,
                headers = state.headers;

            ids.forEach(function (id, newSequence) {
                var _headers$findEntry = headers.findEntry(function (h) {
                    return h.get("_id") == id;
                });

                var _headers$findEntry2 = _slicedToArray(_headers$findEntry, 2);

                var index = _headers$findEntry2[0];
                var entry = _headers$findEntry2[1];

                headers = headers.setIn([index, "sequence"], newSequence);
            });
            state.headers = headers.sortBy(function (h) {
                return h.get("sequence");
            });

            sortNode.sortable("cancel");
            this.setState({ headers: state.headers,
                listings: this.getSortedVisibleListings(this.state) });
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
                data: headers !== null ? headers.map(function (h) {
                    return [h.get("_id"), h.get(redfin)];
                }).toJS() : [[id, value]] };
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
            var value = listing.get(hId),
                header = this.state.headers.find(function (h) {
                return h.get("_id") == hId;
            }),
                icons = header.get("toggleIcons").split(","),
                icon = icons[value == "" ? 0 : (_.indexOf(icons, value) + 1) % icons.length],
                pos = this.state.listings.findIndex(function (l) {
                return l.get(0) == listing.get(0);
            });

            this.setState({ listings: this.state.listings.setIn([pos, hId], icon) });
            this.updateListingDB(listing.get(0), header.get("redfin"), icon);
        }
    }, {
        key: "render",
        value: function render() {
            var _this11 = this;

            // in listing:                     notes={this.state.notes[listing[0]]}
            var listings = this.state.listings.map(function (listing) {
                return React.createElement(Listing, {
                    toggleIcon: _.bind(_this11.toggleIcon, _this11),
                    canRank: _this11.state.canRank,
                    showUK: _this11.state.showUK,
                    api: _this11.props.api,
                    key: listing.get(0),
                    keys: _this11.props.keys,
                    listing: listing,
                    headers: _this11.state.headers });
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
                    uniques: this.state.uniques,
                    showUK: this.state.showUK,
                    save: _.bind(this.saveHeader, this),
                    hide: _.bind(this.hideHeader, this) }),
                listings
            );
        }
    }]);

    return App;
})(React.Component);

var NoteWriter = (function (_React$Component7) {
    _inherits(NoteWriter, _React$Component7);

    function NoteWriter(props) {
        _classCallCheck(this, NoteWriter);

        var _this12 = _possibleConstructorReturn(this, Object.getPrototypeOf(NoteWriter).call(this, props));

        _this12.state = _.clone(props);
        return _this12;
    }

    _createClass(NoteWriter, [{
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            this.setState(_.clone(nextProps));
        }
    }, {
        key: "updateFieldValue",
        value: function updateFieldValue(name, event) {
            var value = event.target.value;

            //this.props.update(s => s.header[name] = value)
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                Modal,
                { show: this.state.showModal, onHide: _.bind(this.props.close, this, null) },
                React.createElement(
                    Modal.Header,
                    { closeButton: true },
                    React.createElement(
                        Modal.Title,
                        null,
                        "Notes for "
                    )
                ),
                React.createElement(
                    Modal.Body,
                    null,
                    React.createElement(
                        Grid,
                        { fluid: true },
                        React.createElement(
                            Row,
                            null,
                            React.createElement(
                                Col,
                                { md: 3, className: "title" },
                                "today"
                            ),
                            React.createElement(
                                Col,
                                { md: 9, className: "values" },
                                React.createElement("textarea", { style: { width: "100%" }, rows: 5 })
                            )
                        ),
                        React.createElement(
                            Row,
                            null,
                            React.createElement(
                                Col,
                                { md: 3, className: "title" },
                                "date"
                            ),
                            React.createElement(
                                Col,
                                { md: 9, className: "values" },
                                "old note content"
                            )
                        )
                    )
                ),
                React.createElement(
                    Modal.Footer,
                    null,
                    React.createElement(
                        Button,
                        null,
                        "Save & Close"
                    ),
                    React.createElement(
                        Button,
                        null,
                        "Close"
                    )
                )
            );

            //onClick={_.bind(this.props.close, this, null)}
            //onClick={_.bind(this.props.close, this, null)}
        }
    }]);

    return NoteWriter;
})(React.Component);

var FieldEditor = (function (_React$Component8) {
    _inherits(FieldEditor, _React$Component8);

    function FieldEditor(props) {
        _classCallCheck(this, FieldEditor);

        var _this13 = _possibleConstructorReturn(this, Object.getPrototypeOf(FieldEditor).call(this, props));

        _this13.state = props;
        return _this13;
    }

    _createClass(FieldEditor, [{
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props.showModal != nextProps.showModal || this.props.header !== nextProps.header;
        }
    }, {
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            this.setState(nextProps);
        }
    }, {
        key: "updateFieldValue",
        value: function updateFieldValue(name, event) {
            var buckets = {},
                value = event.target.value;
            if (/^bucket/.test(name)) this.props.setState({ header: this.state.header.set(name, value), updateRanking: true });else this.props.setState({ header: this.state.header.set(name, value) });
            if (name != "bucketSize") return;
            if (value == "*") this.props.uniques.map(function (v) {
                return buckets[v] = [0, ""];
            });else if (value != "") this.props.uniques.map(function (v) {
                return Math.floor(v / value);
            }).toSet() // make unique
            .map(function (v) {
                return v * value;
            }).sort().forEach(function (v) {
                return buckets[v] = [0, ""];
            });
            this.props.setState({ header: this.state.header.set("buckets", Immutable.fromJS(buckets)) });
        }
    }, {
        key: "updateBuckets",
        value: function updateBuckets(bucket, event) {
            var buckets = this.state.header.get("buckets").set(bucket, Immutable.List([event.target.value, ""])),
                min = !buckets.size ? 0 : buckets.minBy(function (wc) {
                return +wc.get(0);
            }).get(0),
                max = !buckets.size ? 0 : buckets.maxBy(function (wc) {
                return +wc.get(0);
            }).get(0),
                mult = !max ? 0 : (app.colors.length - 2) / (max - min);

            buckets = buckets.map(function (wc) {
                var color = wc.get(0) == min ? app.colors[0] : wc.get(0) && wc.get(0) == max ? app.colors[app.colors.length - 1] : app.colors[Math.floor((wc.get(0) - min + 1) * mult)];
                console.log(wc.set(1, color).toJS());
                return wc.set(1, color);
            });
            this.setState({ header: this.state.header.set("buckets", buckets) });
        }
    }, {
        key: "showType",
        value: function showType(type) {
            this.setState({ showType: type });
        }
    }, {
        key: "render",
        value: function render() {
            var _this14 = this;

            var header = this.state.header,
                id = header.get("_id"),
                props = { update: _.bind(this.updateFieldValue, this), header: header },
                text = Immutable.List("Math,Distance to,Toggle icons,Notes".split(",")),
                fields = text.map(function (t) {
                return t.substr(0, 1).toLowerCase() + t.substr(1).replace(/ (.)/g, function ($0, $1) {
                    return $1.toUpperCase();
                });
            }),
                type = fields.find(function (n) {
                return header.get(n);
            }),
                isType = function isType(t) {
                return type == t || _this14.state.showType == t;
            };
            return React.createElement(
                Modal,
                { show: this.state.showModal, onHide: _.bind(this.props.close, this, null) },
                React.createElement(
                    Modal.Header,
                    { closeButton: true },
                    React.createElement(
                        Modal.Title,
                        null,
                        header.get("text")
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
                            buckets: this.state.header.get("buckets"),
                            updateBuckets: _.bind(this.updateBuckets, this) }),
                        React.createElement(FieldType, {
                            showType: _.bind(this.showType, this),
                            header: header,
                            text: text,
                            fields: fields,
                            type: type }),
                        !isType("math") ? "" : React.createElement(Field, _extends({ title: "» Math", name: "math" }, props)),
                        !isType("distanceTo") ? "" : React.createElement(Field, _extends({ title: "» Distance To", name: "distanceTo" }, props)),
                        !isType("toggleIcons") ? "" : React.createElement(Field, _extends({ title: "» Toggle icons", name: "toggleIcons" }, props, { text: "FA icons, without 'fa-'" }))
                    )
                ),
                React.createElement(
                    Modal.Footer,
                    null,
                    React.createElement(
                        Button,
                        { onClick: _.bind(this.props.close, this, this.state.header, this.state.showType == "notes") },
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

var Buckets = (function (_React$Component9) {
    _inherits(Buckets, _React$Component9);

    function Buckets() {
        _classCallCheck(this, Buckets);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Buckets).apply(this, arguments));
    }

    _createClass(Buckets, [{
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props.buckets !== nextProps.buckets;
        }
    }, {
        key: "render",
        value: function render() {
            var _this16 = this;

            if (!this.props) return false;
            var buckets = [];
            Immutable.Map(this.props.buckets) // handles for undefined buckets
            .map(function (wc, bucket) {
                return [bucket, wc.get(0), wc.get(1)];
            }).sortBy(function (e) {
                return +e[0];
            }).forEach(function (bwc) {
                var _bwc = _slicedToArray(bwc, 3);

                var bucket = _bwc[0];
                var weight = _bwc[1];
                var color = _bwc[2];

                buckets.push(React.createElement(
                    Col,
                    {
                        key: "b" + bucket,
                        md: 2,
                        style: { backgroundColor: color, height: 26, paddingTop: 3 } },
                    bucket
                ));
                buckets.push(React.createElement(
                    Col,
                    {
                        key: "v" + bucket,
                        md: 2 },
                    React.createElement("input", {
                        type: "text",
                        defaultValue: weight,
                        onChange: _.bind(_this16.props.updateBuckets, null, bucket) })
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

var FieldType = (function (_React$Component10) {
    _inherits(FieldType, _React$Component10);

    function FieldType() {
        _classCallCheck(this, FieldType);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(FieldType).apply(this, arguments));
    }

    _createClass(FieldType, [{
        key: "shouldComponentUpdate",
        //check, fa-circle-o
        value: function shouldComponentUpdate(nextProps, nextState) {
            return this.props.type != nextProps.type;
        }
    }, {
        key: "render",
        value: function render() {
            var _this18 = this;

            var h = this.props.header,
                type = this.props.type,
                text = this.props.text,
                fields = this.props.fields,
                offOn = ["fa fa-circle-o", "fa fa-check"],
                btns = text.map(function (t, i) {
                return React.createElement(
                    Button,
                    {
                        key: i,
                        bsSize: "xsmall",
                        style: { marginRight: 5 },
                        onClick: _.bind(_this18.props.showType, null, fields.get(i)) },
                    t
                );
            });
            return React.createElement(
                Row,
                null,
                React.createElement(
                    Col,
                    { md: 3, className: "title" },
                    "Type"
                ),
                React.createElement(
                    Col,
                    { md: 9, className: "values", style: { marginTop: 5 } },
                    type ? text.get(fields.findIndex(function (f) {
                        return f == type;
                    })) : btns
                )
            );
        }
    }]);

    return FieldType;
})(React.Component);

var Field = (function (_React$Component11) {
    _inherits(Field, _React$Component11);

    function Field() {
        _classCallCheck(this, Field);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Field).apply(this, arguments));
    }

    _createClass(Field, [{
        key: "shouldComponentUpdate",
        value: function shouldComponentUpdate(nextProps, nextState) {
            var fn = this.props.name || this.props.title.substr(0, 1).toLowerCase() + this.props.title.substr(1).replace(/\s+/g, "");
            return this.props.title != nextProps.title || this.props.header.get(fn) !== nextProps.header.get(fn);
        }
    }, {
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
                    React.createElement("input", { type: "text", defaultValue: this.props.header.get(fieldname),
                        onChange: _.bind(this.props.update, null, fieldname) }),
                    desc
                )
            );
        }
    }]);

    return Field;
})(React.Component);
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map