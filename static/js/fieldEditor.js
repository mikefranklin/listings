"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FieldEditor = (function (_React$Component) {
    _inherits(FieldEditor, _React$Component);

    function FieldEditor(props) {
        _classCallCheck(this, FieldEditor);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FieldEditor).call(this, props));

        _this.state = props;
        return _this;
    }

    _createClass(FieldEditor, [{
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
            if (value == "*") this.props.uniques.keySeq().map(function (v) {
                return buckets[v] = [0, ""];
            });else if (value != "") this.props.uniques.keySeq().map(function (v) {
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
            var buckets = this.state.header.get("buckets").set(String(bucket), Immutable.List([event.target.value, ""])),
                min = !buckets.size ? 0 : buckets.minBy(function (wc) {
                return +wc.get(0);
            }).get(0),
                max = !buckets.size ? 0 : buckets.maxBy(function (wc) {
                return +wc.get(0);
            }).get(0),
                mult = !max ? 0 : (app.colors.length - 2) / (max - min);
            buckets = buckets.map(function (wc) {
                var color = wc.get(0) == min ? app.colors[0] : wc.get(0) && wc.get(0) == max ? app.colors[app.colors.length - 1] : app.colors[Math.floor((wc.get(0) - min + 1) * mult)];
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
        key: "close",
        value: function close() {
            console.log("FE/Close", this.state.header.toJS());
            this.props.close(this.state.header, this.state.showTypes == "notes");
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

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
                return type == t || _this2.state.showType == t;
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
                        { onClick: _.bind(this.close, this) },
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

var Buckets = (function (_React$Component2) {
    _inherits(Buckets, _React$Component2);

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
            var _this4 = this;

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
                        onChange: _.bind(_this4.props.updateBuckets, null, bucket) })
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

var FieldType = (function (_React$Component3) {
    _inherits(FieldType, _React$Component3);

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
            var _this6 = this;

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
                        onClick: _.bind(_this6.props.showType, null, fields.get(i)) },
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

var Field = (function (_React$Component4) {
    _inherits(Field, _React$Component4);

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
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/js/fieldEditor.js.map