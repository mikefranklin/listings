"use strict";
"use babel"
/*
sq ft math: String(1000+Math.floor(list price/sq ft)).substr(1)
the tasting room: 39.415732,-77.410943
https://www.google.com/maps/dir/39.415674,-77.410997/39.429216,-77.421175
*/

;

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
            headerUpdated: new signals.Signal(),
            hideHeader: new signals.Signal(),
            showHeader: new signals.Signal()
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

            // updateDT={this.props.updateDT}/>)
            var items = _.map(this.props.headers, function (header) {
                return React.createElement(HeaderItem, {
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

    function HeaderItem() {
        _classCallCheck(this, HeaderItem);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(HeaderItem).apply(this, arguments));
    }

    _createClass(HeaderItem, [{
        key: "signal",
        value: function signal(name) {
            var _app$signaller$name;

            (_app$signaller$name = app.signaller[name]).dispatch.apply(_app$signaller$name, _toConsumableArray(_.toArray(arguments).slice(1)));
        }
        // openFieldEditor() {
        //     this.setState({showModal: true})
        // },

    }, {
        key: "render",
        value: function render() {
            // <FieldEditor field={field}/>
            var header = this.props.header,
                click = _.bind(this.signal, this, "hideHeader", header._id),
                move = !this.props.canMove ? null : React.createElement(
                "div",
                { className: "btn-xsmall move", bsSize: "xsmall" },
                React.createElement("i", { className: "fa fa-bars" })
            );

            //onClick={this.openFieldEditor}
            // <FieldEditor
            //     showModal={this.state.showModal}
            //     field={this.props.field}
            //     updateDT={this.props.updateDT}/>
            return React.createElement(
                Col,
                { md: 1, "data-id": header._id, className: "item" },
                move,
                React.createElement(
                    "div",
                    { className: "edit" },
                    header.text
                ),
                React.createElement(
                    "div",
                    { className: "togglevis", onClick: click },
                    React.createElement("i", { className: "fa fa-bolt" })
                )
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
            var _app$signaller$name2;

            (_app$signaller$name2 = app.signaller[name]).dispatch.apply(_app$signaller$name2, _toConsumableArray(_.toArray(arguments).slice(1)));
        }
    }, {
        key: "render",
        value: function render() {
            var _this5 = this;

            if (!this.props) return false;
            var moveStyle = this.props.canMove ? "success" : "default",
                curStyle = this.props.currentActivesOnly ? "success" : "default",
                hidden = _.map(this.props.hidden, function (header) {
                var select = _.bind(_this5.signal, _this5, "showHeader", header._id);
                return React.createElement(
                    MenuItem,
                    { key: header._id, onSelect: select },
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
                return _this6.saveHeaders(null, redfin, id, value);
            });
        });
        app.signaller.showHeader.add(function (id) {
            return _this6.updateState(function (s) {
                return _this6.toggleHeaderVisibility(s.hidden, s.headers, id, true);
            }, function () {
                return _this6.saveHeaders(null, "show", id, true);
            });
        });
        app.signaller.hideHeader.add(function (id) {
            return _this6.updateState(function (s) {
                return _this6.toggleHeaderVisibility(s.headers, s.hidden, id, false);
            }, function () {
                return _this6.saveHeaders(null, "show", id, false);
            });
        });
        return _this6;
    }

    _createClass(App, [{
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
            this.saveHeaders(state.headers, "sequence");
        }
    }, {
        key: "saveHeaders",
        value: function saveHeaders(headers, redfin, id, value) {
            var data = { redfin: redfin,
                data: headers ? _.map(headers, function (header) {
                    return [header._id, header[redfin]];
                }) : [[id, value]] };
            app.retryAjax(JSON.stringify(data), { api: "/saveheaderdata", type: "post" }).done((function (content) {
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
                    canMove: this.state.canMove }),
                React.createElement(Control, {
                    hidden: this.state.hidden,
                    canMove: this.state.canMove,
                    currentActivesOnly: this.state.currentActivesOnly })
            );
        }
    }]);

    return App;
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

var FieldEditor = React.createClass ({
    getInitialState() {
        return {showModal: false, text: "", bucketSize: "", math: "", distanceTo: "", field: {}}
    },
    close() {
        var state = _.clone(this.state)
        state.showModal = false
        this.setState(state);
    },
    componentWillReceiveProps(nextProps) {
        var state = _.clone(nextProps)
        this.setState(state)
    },
    update(name, event) {
        var s = _.clone(this.state)
        s[name] = event.target.value
        this.setState(s)
    },
    signal(name, close, ...args) {
        signaller[name].dispatch(...args)
        if (close) this.close()
    },
    render() {
        var field = this.state.field,
            fieldId = field._id,
            updateClose = [this.signal, this, "headerUpdated", true, fieldId],
            e = function() {};
            //updateDT = this.props.updateDT ? _.bind(this.props.updateDT, null, fieldId) : "";
        return (
            <Modal show={this.state.showModal} onHide={this.close}>
              <Modal.Header closeButton>
                <Modal.Title>{field.text}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <table>
                      <tbody>
                          <tr>
                            <td className="title">Text</td>
                            <td className="values">
                                <input type="text" defaultValue={field.text}
                                    onChange={_.bind(this.update, this, "text")}/>
                                <Button bsSize="small" bsStyle="primary"
                                    onClick={_.bind(...updateClose, "text", this.state.text)}>Save</Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="title">bucket size</td>
                            <td className="values">
                                <input type="text" defaultValue={field.bucketSize || 0}
                                    onChange={_.bind(this.update, this, "bucketSize")}/>
                                <Button bsSize="small" bsStyle="primary"
                                    onClick={_.bind(...updateClose, "bucketSize", this.state.bucketSize)}>Save</Button>
                                <br/>* = distinct
                            </td>
                          </tr>
                          <tr>
                            <td className="title">Math</td>
                            <td className="values">
                                <input type="text" defaultValue={field.math || ""}
                                    onChange={_.bind(this.update, this, "math")}/>
                                <Button bsSize="small" bsStyle="primary"
                                    onClick={_.bind(...updateClose, "math", this.state.math)}>Save</Button>
                            </td>
                          </tr>
                          <tr>
                            <td className="title">Distance to</td>
                            <td className="values">
                                <input type="text" defaultValue={field.distanceTo || ""}
                                    onChange={_.bind(this.update, this, "distanceTo")}/>
                                <Button bsSize="small" bsStyle="primary"
                                    onClick={_.bind(...updateClose, "distanceTo", this.state.distanceTo,
                                        _.bind(this.props.updateDT || e, null, fieldId, this.state.distanceTo))}>Save</Button>
                            </td>
                          </tr>
                      </tbody>
                  </table>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.close}>Close</Button>
              </Modal.Footer>
            </Modal>
        )
    }
})

*/
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/listing.js.map