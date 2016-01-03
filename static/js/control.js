"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Control = (function (_React$Component) {
    _inherits(Control, _React$Component);

    // signal(name) {
    //     app.signaller[name].dispatch(..._.toArray(arguments).slice(1))
    // }

    function Control(props) {
        _classCallCheck(this, Control);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Control).call(this, props));

        app.on.headersUpdated.add(_this.updateHeaders, _this);
        app.on.rankUpdated.add(_this.updateRank, _this);
        return _this;
    }

    _createClass(Control, [{
        key: "updateRank",
        value: function updateRank(newRank) {
            this.setState({ canRank: newRank });
        }
    }, {
        key: "updateHeaders",
        value: function updateHeaders(s) {
            this.setState({ hidden: s.get("hheaders"),
                canRank: s.get("canRank"),
                canMove: s.get("canMove"),
                showUk: s.get("showUk"),
                currentActivesOnly: s.get("currentActivesOnly") });
        }
    }, {
        key: "render",
        value: function render() {
            if (!this.state) return false;
            var offOn = ["fa fa-circle-o", "fa fa-check"],
                hidden = this.state.hidden.map(function (header) {
                return React.createElement(
                    MenuItem,
                    {
                        key: header.get("_id") },
                    header.get("text")
                );
            });
            /*
            onSelect={_.bind(this.props.showHeader, null, header.get("_id"))}>
            onClick={this.props.toggleRank}>
            onClick={this.props.toggleUK}>
            onClick={this.props.toggleMove}>
            onClick={this.props.toggleCurrentActives}>
            onClick={this.props.addNewField}>
            
            */
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
                            onClick: app.on.canRankClicked.dispatch,
                            eventKey: 1 },
                        React.createElement("i", { className: offOn[+this.state.canRank] }),
                        " Rank"
                    ),
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 2 },
                        React.createElement("i", { className: offOn[+this.state.showUK] }),
                        " UK units"
                    ),
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 3 },
                        React.createElement("i", { className: offOn[+!!this.state.canMove] }),
                        " Change Order"
                    ),
                    React.createElement(
                        NavItem,
                        {
                            eventKey: 4 },
                        React.createElement("i", { className: offOn[+this.state.currentActivesOnly] }),
                        "Actives only"
                    ),
                    !hidden.size ? null : React.createElement(
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
                            eventKey: 5 },
                        "Add new field"
                    )
                )
            );
        }
    }]);

    return Control;
})(React.Component);
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/js/control.js.map