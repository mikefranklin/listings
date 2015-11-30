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
            moveToggled: new signals.Signal(),
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
                ReactDOM.render(React.createElement(App, content), document.getElementById('content'));
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
                return React.createElement(HeaderItem, {
                    save: _this2.props.save,
                    hide: _this2.props.hide,
                    canMove: _this2.props.canMove,
                    key: header._id,
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
            var moveStyle = this.props.canMove ? "success" : "default",
                curStyle = this.props.currentActivesOnly ? "success" : "default",
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
                { className: "control" },
                React.createElement(
                    Col,
                    { md: 1, mdOffset: 8 },
                    React.createElement(
                        Button,
                        { bsStyle: "info", onClick: _.bind(this.signal, this, "newField") },
                        "New Field"
                    )
                ),
                React.createElement(
                    Col,
                    { md: 1 },
                    React.createElement(
                        Button,
                        { bsStyle: curStyle, onClick: _.bind(this.signal, this, "currentActivesSelected") },
                        "Current Active"
                    )
                ),
                React.createElement(
                    Col,
                    { md: 1 },
                    React.createElement(
                        Button,
                        { bsStyle: moveStyle, onClick: _.bind(this.signal, this, "moveToggled") },
                        "Toggle move"
                    )
                ),
                React.createElement(
                    Col,
                    { md: 1 },
                    React.createElement(
                        DropdownButton,
                        { pullRight: true, title: "Unhide", id: "unhide" },
                        hidden
                    )
                )
            );
        }
    }]);

    return Control;
})(React.Component);

var App = (function (_React$Component4) {
    _inherits(App, _React$Component4);

    function App(props) {
        _classCallCheck(this, App);

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(App).call(this, props)); //headers, listings, keys

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

        _this6.state = { currentActivesOnly: cao, canMove: false,
            headers: displayable, hidden: hidden };
        _this6.state.listings = _.chain(props.listings).filter(function (l) {
            return !cao || l[dt].$date == maxDate && l[keys.status].toLowerCase() == "active";
        }).sortBy(function (l) {
            return _.map(_this6.state.headers, function (h) {
                return l[h._id];
            }).join("$");
        }).value();
        app.signaller.moveToggled.add(function () {
            return _this6.updateState(function (s) {
                return s.canMove = !s.canMove;
            });
        });
        app.signaller.headersSorted.add(_.bind(_this6.reorderHeaders, _this6));
        app.signaller.headerUpdated.add(function (id, redfin, value) {
            return _this6.updateState(function (s) {
                return s.headers[id][redfin] = value;
            }, function () {
                return _this6.saveHeaderValue(null, redfin, id, value);
            });
        });

        return _this6;
    }

    _createClass(App, [{
        key: "showHeader",
        value: function showHeader(id) {
            var _this7 = this;

            this.updateState(function (s) {
                return _this7.toggleHeaderVisibility(s.hidden, s.headers, id, true);
            }, function () {
                return _this7.saveHeaderValue(null, "show", id, true);
            });
        }
    }, {
        key: "hideHeader",
        value: function hideHeader(id) {
            var _this8 = this;

            this.updateState(function (s) {
                return _this8.toggleHeaderVisibility(s.headers, s.hidden, id, true);
            }, function () {
                return _this8.saveHeaderValue(null, "show", id, false);
            });
        }
    }, {
        key: "saveHeader",
        value: function saveHeader(header) {
            var _this9 = this;

            this.updateState(function (s) {
                return s.headers[_.findIndex(s.headers, function (h) {
                    return h._id == header._id;
                })] = header;
            }, function () {
                return _this9.saveHeader(header);
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
            var ids = sortNode.sortable("toArray", { attribute: "data-id" }),
                state = _.clone(this.state);

            ids.forEach(function (id, index) {
                _.find(state.headers, function (item) {
                    return item._id == id;
                }).sequence = index;
            });
            state.headers = _.sortBy(state.headers, "sequence");
            sortNode.sortable("cancel");
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
        key: "render",
        value: function render() {
            return React.createElement(
                Grid,
                { fluid: true },
                React.createElement(Header, {
                    headers: this.state.headers,
                    canMove: this.state.canMove,
                    save: _.bind(this.saveHeader, this),
                    hide: _.bind(this.hideHeader, this) }),
                React.createElement(Control, {
                    hidden: this.state.hidden,
                    canMove: this.state.canMove,
                    showHeader: _.bind(this.showHeader, this),
                    currentActivesOnly: this.state.currentActivesOnly })
            );
        }
    }]);

    return App;
})(React.Component);

var FieldEditor = (function (_React$Component5) {
    _inherits(FieldEditor, _React$Component5);

    function FieldEditor(props) {
        _classCallCheck(this, FieldEditor);

        var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(FieldEditor).call(this, props));

        _this10.state = _.clone(props);
        return _this10;
    }

    _createClass(FieldEditor, [{
        key: "componentWillReceiveProps",
        value: function componentWillReceiveProps(nextProps) {
            this.setState(_.clone(nextProps));
        }
    }, {
        key: "updateFieldValue",
        value: function updateFieldValue(name, event) {
            this.props.update(function (s) {
                return s.header[name] = event.target.value;
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
                        React.createElement(Field, _extends({ title: "» Math" }, props)),
                        React.createElement(Field, _extends({ title: "» Distance To" }, props))
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

var Field = (function (_React$Component6) {
    _inherits(Field, _React$Component6);

    function Field() {
        _classCallCheck(this, Field);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Field).apply(this, arguments));
    }

    _createClass(Field, [{
        key: "render",
        value: function render() {
            if (!this.props) return false;
            var fieldname = this.props.title.substr(0, 1).toLowerCase() + this.props.title.substr(1).replace(/\s+/g, ""),
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
                    { md: 8, className: "values" },
                    React.createElement("input", { type: "text", defaultValue: this.props.header[fieldname],
                        onChange: _.bind(this.props.update, null, fieldname) }),
                    desc
                )
            );
        }
    }]);

    return Field;
})(React.Component);

/*
var signaller = {
  headerUpdated: new signals.Signal(),
  moveToggled: new signals.Signal(),
  currentsSelected: new signals.Signal(),
  newField: new signals.Signal()
};





var House = React.createClass({
    getInitialState() {
        return {listing: {}, fields: {}};
    },
    render() {
        var items = _.map(this.props.fields, field => {
            return (
                <HouseItem key={field._id} name={field.fieldname}
                    value={this.props.listing[field._id]} field = {field}/>
            )
        })
        return (<Row className="house">{items}</Row>);
    }
});

var HouseItem = React.createClass({
    formatter_undef() { return "~undefined~"},
    formatter_date(obj) { return new Date(obj.$date).toLocaleString('en-US')},
    formatter_string(s) { return s },
    formatter_number(s) { return String(s)},
    formatter_object(obj) {
        var f = _.find([["$date", "date"]], (pair) => {return obj[pair[0]] !== undefined})
        return f ? this["formatter_" + f[1]](obj) : this.formatter_undef()
    },
    formatter_url(url) {
        return <a href={url} target="_blank">Redfin</a>
    },
    formatter(value, header) {
        return (this["formatter_" + header.text]
                || this["formatter_" + (typeof value)]
                || this.formatter_undef)(value)
    },
    getInitialState() {
        return {name: "", value: "", field: {}};
    },
    render() {
        var cols = this.props.field.columns ? this.props.field.columns : 2;
        return (
            <Col md={cols} className={this.props.name} style={{overflow: "hidden", height: 20}} >
                {this.formatter(this.props.value, this.props.field)}
            </Col>
        );
    }
});



var App = React.createClass({
    updateListingDB(id, fieldname, value) {
        var data = {id: id, fieldname: fieldname, value: value}
        retryAjax(JSON.stringify(data), {api: "savelistingdata", type: "post"})
            .done(function(content) {
                console.log("worked!", content)
            }.bind(this))
            .fail(function() {
                console.log("failed", arguments)
            }.bind(this))
    },
    updateSomeDistances(opts) {
        var listings = _.chain(opts.listings)
                        .filter(l => !l[opts.fieldId])
                        .first(opts.count)
                        .value();
        if (!listings.length) return

       _.each(listings, listing => {
            var request = _.clone(opts.base);
            request.origin = listing[opts.lat] + "," + listing[opts.long]
            opts.directionsService.route(request, (response, status) => {
                try {
                    var duration = response.routes[0].legs[0].duration // distance.text, duration.text
                    listing[opts.fieldId] = parseInt(duration.text)
                    this.setState(opts.state)
                    //this.updateListingDB(listing[opts.state.redfin], headerName, parseInt(duration.text))
               } catch (e) {
                    console.log("error getting directions for", listing, e)
                    listing[opts.fieldId] = "00"

                }
                console.log(listing[opts.fieldId])
            })
        })

        _.delay(this.updateSomeDistances, opts.wait, opts)
    },

    updateDistanceTo(fieldId, location) {
        var state = _.clone(this.state)

        this.updateSomeDistances({
            base: {destination: location, travelMode: google.maps.TravelMode.WALKING},
            directionsService: new google.maps.DirectionsService(),
            fieldId: fieldId,
            state: state,
            field: state.fields[fieldId],
            lat: this.getFieldPos("latitude"),
            long: this.getFieldPos("longitude"),
            listings: state.listings,
            count: 2,
            wait: 1500})
        console.log(state) // should defer updating state/db for a second?)

    },
    updateBuckets(content) {
        _.chain(content.fields)
            .filter(f => f.bucketSize !== undefined)
            .each(f => {
                var id = f._id,
                    buckets = f.buckets || {}, // [bucket] = weighting value
                    size = f.bucketSize,
                    vals = _.chain(content.listings)
                            .pluck(id)
                            .uniq()
                            .value()
                if (size == "*") {
                    _.each(vals, v => buckets[v] = buckets[v] === undefined ? 0 : buckets[v])
                } else {
                    _.chain(content.listings).pluck(id).uniq()
                        .map(v => Math.floor(v / size)).uniq()
                        .map(v => v * size).sortBy()
                        .each(v => buckets[v] = buckets[v] === undefined ? 0 : buckets[v])
                }
            })
    },
    updateMath(content) {
        _.chain(content.fields)
            .filter(f => f.math !== undefined)
            .each(f => {
                var math = f.math,
                    id = f._id
                _.each(content.fields, f => {math = math.replace(new RegExp(f.redfin), "l[" + f._id + "]")})
                _.each(content.listings, l => {
                    try {
                        eval("l[" + id + "]=" + math)
                    } catch (e) {
                        l[id] = "***"
                    }
                })
            })
        console.log(content)
    },
    headerUpdated(fieldId, headerName, value, ...args) { // hideField, setWidth
        var fields = _.clone(this.state.fields),
            index = _.findIndex(fields, (f) => {return f._id == fieldId});

        fields[index][headerName] = value
        this.updateDB(headerName, fields[index])
        this.setState(fields)
        if (typeof args[0] == "function") args[0]()
    },
    addNewField() {
        var len = this.state.fields.length,
            newState = _.clone(this.state),
            field =  _.extend(_.clone(this.state.fields[0]), {
                _id: len,
                redfin: "new_" + len,
                fieldname: "new_" + len,
                sequence: len,
                show: true,
                text: "new_" + len})

        newState.fields.push(field)
        _.each(newState.listings, l => l.push(""))
        this.setState(newState)

        retryAjax(JSON.stringify(field), {api: "/savenewfield", type: "post"})
            .done(function(content){
                console.log("worked!", arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))

    },
    getInitialState() {
        signaller.headerUpdated.add(this.headerUpdated);
        signaller.moveToggled.add(this.moveToggled)
        signaller.currentsSelected.add(this.currentsSelected)
        signaller.newField.add(this.addNewField)
        return {fields: {}, listings: [], redfin: null, canMove: false, currentsOnly: false}
    },
    moveToggled() {
        this.setState({canMove: !this.state.canMove })
    },
    currentsSelected() {
        this.setState({currentsOnly: !this.state.currentsOnly})
    },
    getFieldPos(name) {
        return _.find(this.state.fields, f => f.text== name)._id
    },
    render() {
        if (!this.state.listings.length) return false
        var redfinId = this.state.redfin,
            [displayable, hidden] = _.partition(this.state.fields, field => field.show),
            dtPos = this.getFieldPos("last_loaded"),
            stPos = this.getFieldPos("status"),
            maxDate = _.chain(this.state.listings).map(l => l[dtPos].$date).max().value(),
            houses = _.chain(this.state.listings)
                        .filter(l => !this.state.currentsOnly || l[dtPos].$date == maxDate && l[stPos].toLowerCase() == "active")
                        .sortBy(l => _.map(displayable,  f => l[f._id]).join("$"))
                        .map(function(l) {
                            return (<House key={l[redfinId]} listing={l} fields={displayable}/> )
                            }.bind(this))
                        .value();

        return (
            <Grid fluid={true}>
                <Header
                    fields={displayable}
                    createSortable={this.createSortable}
                    canMove={this.state.canMove}
                    updateDT={this.updateDistanceTo}/>
                <Control hidden={hidden} canMove={this.state.canMove} currentsOnly={this.state.currentsOnly}/>
                {houses}
            </Grid>
        )
    }
})


*/
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map