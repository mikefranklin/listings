"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Header = (function (_React$Component) {
    _inherits(Header, _React$Component);

    function Header(props) {
        _classCallCheck(this, Header);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Header).call(this, props));

        _this.state = { showUk: false, canMove: false };
        app.on.headersUpdated.add(_this.updateHeaders, _this);
        return _this;
    }

    _createClass(Header, [{
        key: "updateHeaders",
        value: function updateHeaders(visible, hidden) {
            this.setState({ headers: visible.sortBy(function (h) {
                    return h.sequence;
                }) });
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            if (!this.state.headers) return false;
            var text = function text(h) {
                return h.get(_this2.state.showUk && h.get("ukText") ? "ukText" : "text");
            },
                items = this.state.headers.map(function (header) {
                return React.createElement(HeaderItem, {
                    text: text(header),
                    canMove: _this2.state.canMove,
                    key: header.get("_id"),
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
        key: "render",
        value: function render() {
            var header = this.props.header,
                move = React.createElement(
                "div",
                { className: "btn-xsmall move", bsSize: "xsmall" },
                React.createElement("i", { className: "fa fa-bars" })
            );
            //onClick={_.bind(this.openFieldEditor, this)}
            //onClick={_.bind(this.props.hide, null, header.get("_id"))}
            // <FieldEditor
            //     uniques={this.props.uniques}
            //     showModal={this.state.showModal}
            //     header={this.state.header}
            //     setState={_.bind(this.setState, this)}
            //     close={_.bind(this.closeFieldEditor, this)}/>
            return React.createElement(
                Col,
                { md: 1, "data-id": header.get("_id"), className: "item" },
                this.props.canMove ? move : null,
                React.createElement(
                    "div",
                    { className: "edit" },
                    this.props.text
                ),
                React.createElement(
                    "div",
                    { className: "togglevis" },
                    React.createElement("i", { className: "fa fa-bolt" })
                )
            );
        }
    }]);

    return HeaderItem;
})(React.Component);

//
// class Header extends React.Component {
//     componentDidUpdate() {
//         var sortNode = $(ReactDOM.findDOMNode(this))
//         sortNode = sortNode.sortable({
//             cursor: "move",
//             items: ".item",
//             handle: ".move",
//             update:_.bind(app.signaller.headersSorted.dispatch, null, sortNode)
//         })
//     }
//     componentWillReceiveProps(nextProps) {
//         this.setState(nextProps)
//     }
//     render() {
//         var items = this.props.headers.map(header =>
//                 (<HeaderItem
//                     showUK={this.props.showUK}
//                     save={this.props.save}
//                     hide={this.props.hide}
//                     canMove={this.props.canMove}
//                     key={header.get("_id")}
//                     uniques={this.props.uniques.get(header.get("_id"))}
//                     header={header}/>))
//         return (<Row className="header">{items}</Row>);
//     }
// }
//
// class HeaderItem extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = props
//     }
//     componentWillReceiveProps(nextProps) {
//         this.setState(nextProps)
//     }
//     openFieldEditor() {
//         this.setState({showModal: true})
//     }
//     closeFieldEditor(header, isNewNotes) {
//         var omit = Immutable.Set(["showModal", "updateRanking", "showType"])
//
//         this.setState({showModal: false, showType: isNewNotes ? "notes" : null})
//         if (header) {
//             if (isNewNotes) header = header.set("notes", true);
//             this.props.save(header.filter((v, key) => !omit.has(key)), this.state.updateRanking)
//         }
//     }
//     render() {
//         var header = this.state.header,
//             move = (<div className="btn-xsmall move" bsSize="xsmall">
//                         <i className="fa fa-bars"></i>
//                     </div>)
//         return (
//             <Col md={1} data-id={header.get("_id")} className="item">
//                 {this.props.canMove ? move : null}
//                 <div className="edit" onClick={_.bind(this.openFieldEditor, this)}>
//                     {this.props.showUK && header.get("ukText") ? header.get("ukText") : header.get("text")}
//                 </div>
//                 <div className="togglevis" onClick={_.bind(this.props.hide, null, header.get("_id"))}>
//                     <i className="fa fa-bolt"/>
//                 </div>
//                 <FieldEditor
//                     uniques={this.props.uniques}
//                     showModal={this.state.showModal}
//                     header={this.state.header}
//                     setState={_.bind(this.setState, this)}
//                     close={_.bind(this.closeFieldEditor, this)}/>
//             </Col>
//         )
//     }
// }
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/js/header.js.map