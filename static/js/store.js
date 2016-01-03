"use strict";
"use babel";
/*
$('.fancybox-media').fancybox({
  openEffect  : 'none',
  closeEffect : 'none',
  helpers : { media : {}}
*/

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var App = (function () {
    function App() {
        var _this = this;

        _classCallCheck(this, App);

        "Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem,Navbar,Nav,NavItem,NavDropdown".split(",").forEach(function (m) {
            return window[m] = ReactBootstrap[m];
        }); // pollute global namespace for convenience
        this.on = {};
        this.store = Immutable.Map();
        var list = Immutable.List("\n            headersUpdated          # after content is updated\n            canRankClicked:toggleCanRank\n            rankUpdated\n            ".split("\n")).filter(function (e) {
            return e;
        }).map(function (e) {
            return e.split("#")[0].replace(/\s/g, "").split(":");
        }); // signal:function
        list.forEach(function (pair) {
            return _this.on[pair[0]] = new signals.Signal();
        });
        list.filter(function (pair) {
            return pair[1];
        }).forEach(function (pair) {
            return _this.on[pair[0]].add(_this[pair[1]].bind(_this));
        });
    }

    _createClass(App, [{
        key: "display",
        value: function display() {
            ReactDOM.render(React.createElement(
                Grid,
                { fluid: true },
                React.createElement(Control, null),
                React.createElement(Header, null),
                React.createElement(Listings, null)
            ), document.getElementById("content"), this.loadData.bind(this));
        }
    }, {
        key: "loadData",
        value: function loadData() {
            this.retryAjax({}, { api: "/getalldata", type: "get" }).done((function (content) {
                // headers, listings, keys, api
                console.log(content);
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api);
                this.processRawData(content);
            }).bind(this)).fail((function () {
                console.log(arguments);
            }).bind(this));
        }
    }, {
        key: "toggleCanRank",
        value: function toggleCanRank() {
            var newRank = !this.store.get("canRank");
            this.store = this.store.set("canRank", newRank);
            this.on.rankUpdated.dispatch(newRank);
        }
    }, {
        key: "processRawData",
        value: function processRawData(data) {
            var _this2 = this;

            var headers = Immutable.fromJS(data.headers).groupBy(function (h) {
                return h.get("show");
            }),
                canRank = true;

            this.listings = Immutable.fromJS(data.listings);
            this.keys = Object.assign({}, data.keys);
            this.dtRef = [data.keys.last_loaded, "$date"];
            this.maxDate = this.listings.maxBy(function (l) {
                return l.getIn(_this2.dtRef);
            }).getIn(this.dtRef);

            this.store = this.store.set("vheaders", headers.get(true).sortBy(function (h) {
                return h.get("sequence");
            })).set("hheaders", headers.get(false).sortBy(function (h) {
                return h.get("text");
            })).set("canRank", canRank).set("currentActivesOnly", true).set("showUk", false);
            this.store = this.store.set("listings", this.getDisplableListingData());
            this.store = this.store.set("rankings", this.getRankingInfo());

            this.on.headersUpdated.dispatch(this.store, this.keys);
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

    }, {
        key: "getRankingInfo",
        value: function getRankingInfo() {
            var sortVal = function sortVal(value) {
                return (/^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value
                );
            },
                alphaSort = function alphaSort(l) {
                return l.take(6).reduce(function (s, v) {
                    return s + "$" + sortVal(v);
                }, "");
            },
                headers = this.store.get("vheaders").map(function (h) {
                var buckets = (h.get("buckets") || Immutable.List()).map(function (wc) {
                    return wc.get(0);
                }),
                    min = buckets.min(),
                    max = buckets.max(),
                    mult = !max ? 0 : 8 / (max - min);
                return [min, max, mult, buckets.toJS(), h.get("bucketSize"), parseInt(h.get("bucketMultiplier") || 1)];
            }).toList();
            return this.store.get("listings").map(function (l) {
                return l.data.reduce(function (r, item, index) {
                    var _headers$get = headers.get(index);

                    var _headers$get2 = _slicedToArray(_headers$get, 6);

                    var min = _headers$get2[0];
                    var max = _headers$get2[1];
                    var mult = _headers$get2[2];
                    var buckets = _headers$get2[3];
                    var size = _headers$get2[4];
                    var multiplier = _headers$get2[5];

                    if (!size) return r;
                    var bucket = Math.floor(item / size) * size,
                        weight = parseInt(buckets[bucket] || 0),
                        scaled = weight == min ? 0 : weight && weight == max ? 9 : Math.floor((weight - min + 1) * mult);
                    r[1] = r[1] - weight * multiplier;
                    r[2][index] = scaled;
                    return r;
                }, [alphaSort(l.data), 0, []]);
            } // rank score + [0-9, ...] for each field
            );
        }
    }, {
        key: "getDisplableListingData",
        value: function getDisplableListingData() {
            var _this3 = this;

            var indices = this.store.get("vheaders").sortBy(function (h) {
                return h.get("sequence");
            }).map(function (h) {
                return h.get("_id");
            });
            return this.listings.filter(function (l) {
                return !_this3.store.get("currentActivesOnly") || l.getIn(_this3.dtRef) == _this3.maxDate && l.get(_this3.keys.status).toLowerCase() == "active";
            }).map(function (l) {
                return { key: l.get(0), data: indices.map(function (index) {
                        return l.get(index);
                    }) };
            });
        }
    }]);

    return App;
})();

var AppX = (function (_React$Component) {
    _inherits(AppX, _React$Component);

    // props is js array of Immutable objects

    function AppX(props) {
        _classCallCheck(this, AppX);

        var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(AppX).call(this, props));

        var keys = props.keys.toJS(),
            // no need for them to be immutable
        dtRef = [keys.last_loaded, "$date"],
            showable = props.headers.groupBy(function (h) {
            return h.get("show");
        }),
            listings = _this4.updateMath(props),
            uniques = Immutable.Map(props.headers // faster to convert the end result than use intermediate Set()
        .filter(function (h) {
            return h.get("show");
        }).map(function (h) {
            return [h.get("_id"), Immutable.Map(listings.reduce(function (set, l) {
                set[l.get(h.get("_id"))] = true;return set;
            }, {}))];
        }));

        _this4.state = { maxDate: listings.maxBy(function (l) {
                return l.getIn(dtRef);
            }).getIn(dtRef),
            headers: showable.get(true),
            hidden: showable.get(false),
            currentActivesOnly: true,
            notes: _this4.props.notes, // [listing_id][redfin] = [{dt: xx, text: xx, …}, …]
            allListings: Immutable.Map(listings.map(function (l) {
                return [l.get(0), l];
            })), // map by id
            apikey: props.api,
            uniques: uniques, // unique values by field
            canMove: false,
            canRank: false,
            showUK: false,
            dtRef: dtRef,
            keys: keys };

        _this4.state.listings = _this4.getSortedVisibleListings(_this4.state, false);
        app.signaller.headersSorted.add(_.bind(_this4.reorderHeaders, _this4));
        _this4.updateDistances();
        return _this4;
    }

    _createClass(AppX, [{
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
            }).toList();
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
                if (l.get(lat) && l.get(long)) {
                    headers.filter(function (h) {
                        return !l.get(h.get("_id"));
                    }).forEach(function (h) {
                        return opts.map.push([index, l.get(0), l.get(lat), l.get(long), h.get("_id"), h.get("distanceTo"), h.get("redfin")]);
                    });
                }
            });
            return opts;
        }
    }, {
        key: "updateDistances",
        value: function updateDistances(opts) {
            var _this5 = this;

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
                _this5.setState({
                    listings: _this5.state.listings.setIn([index, id], duration),
                    allListings: _this5.state.allListings.setIn([listing_id, id], duration)
                });
                _this5.updateListingDB(listing_id, headerName, duration);
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
            var index = this.state.headers.findIndex(function (h) {
                return h.get("_id") == header.get("_id");
            });
            this.setState({ headers: this.state.headers.set(index, header) });
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
            var newId = 1 + this.state.headers.merge(this.state.hidden).maxBy(function (h) {
                return h.get("_id");
            }).get("_id"),
                header = this.state.headers.get(0).merge({
                _id: newId,
                redfin: "new_" + newId,
                sequence: newId,
                buckets: {},
                bucketSize: null,
                bucketMultiplier: null,
                show: true,
                text: "new_" + newId });
            this.setState({ headers: this.state.headers.push(header),
                listings: this.state.listings.map(function (l) {
                    return l.push("");
                }),
                allListings: this.state.allListings.map(function (l) {
                    return l.push("");
                })
            });

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

            this.setState({
                listings: this.state.listings.setIn([pos, hId], icon),
                allListings: this.state.allListings.setIn([listing.get(0), hId], icon)
            });
            this.updateListingDB(listing.get(0), header.get("redfin"), icon);
        }
    }, {
        key: "render",
        value: function render() {
            var _this6 = this;

            // in listing:                     notes={this.state.notes[listing[0]]}
            var listings = this.state.listings.map(function (listing) {
                return React.createElement(Listing, {
                    toggleIcon: _.bind(_this6.toggleIcon, _this6),
                    canRank: _this6.state.canRank,
                    showUK: _this6.state.showUK,
                    api: _this6.props.api,
                    key: listing.get(0),
                    keys: _this6.props.keys,
                    listing: listing,
                    headers: _this6.state.headers });
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

    return AppX;
})(React.Component);
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/js/store.js.map