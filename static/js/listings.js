"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Listings = function (_React$Component) {
    _inherits(Listings, _React$Component);

    function Listings(props) {
        _classCallCheck(this, Listings);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Listings).call(this, props));

        app.on.headersUpdated.add(_this.updateListings, _this);
        app.on.rankUpdated.add(_this.updateRank, _this);
        return _this;
    }

    _createClass(Listings, [{
        key: "updateRank",
        value: function updateRank(newRank) {
            this.setState({ canRank: newRank });
        }
    }, {
        key: "updateListings",
        value: function updateListings(s) {
            this.setState({ headers: s.get("vheaders"),
                listings: s.get("listings"),
                rankings: s.get("rankings"),
                showUk: s.get("showUk"),
                canRank: s.get("canRank")
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            if (!this.state) return false;
            var sortPos = +this.state.canRank,
                headers = this.state.headers,
                listings = this.state.listings.sortBy(function (l) {
                return l.ranking[sortPos];
            }).map(function (l) {
                return React.createElement(
                    Row,
                    { key: l.key },
                    l.data.reduce(function (cols, item, index) {
                        return cols.push(React.createElement(ListingItem, {
                            key: headers.getIn([index, "_id"]),
                            ranking: !_this2.state.canRank ? null : l.ranking[2][index],
                            data: item,
                            header: headers.get(index)
                        }));
                    }, Immutable.List())
                );
            }).toList();
            return React.createElement(
                "span",
                null,
                listings
            );
        }
    }]);

    return Listings;
}(React.Component);

var ListingItem = function (_React$Component2) {
    _inherits(ListingItem, _React$Component2);

    function ListingItem() {
        _classCallCheck(this, ListingItem);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ListingItem).apply(this, arguments));
    }

    _createClass(ListingItem, [{
        key: "render",
        value: function render() {
            var style = { whiteSpace: "nowrap", overflow: "hidden",
                backgroundColor: this.props.ranking === null ? "white" : app.getGradientColor(this.props.ranking / app.maxRank) },
                text = this.props.header.get("text") == "url" ? React.createElement(
                "a",
                { href: this.props.data },
                "Redfin"
            ) : this.props.data;
            // cls = this.props.ranking === null ? {} : {className: "rank" + this.props.ranking},
            return React.createElement(
                Col,
                { md: 1, style: style, title: this.props.ranking + "/" + app.maxRank },
                text
            );
        }
    }]);

    return ListingItem;
}(React.Component);

// class Listing extends React.Component {
//     shouldComponentUpdate(nextProps, nextState) {
//         return this.props !== nextProps
//     }
//     render() {
//         if (!this.props) return false
//         var items = this.props.headers.map(header => (
//                 <ListingItem
//                     toggleIcon={this.props.toggleIcon}
//                     listing={this.props.listing}
//                     canRank={this.props.canRank}
//                     showUK={this.props.showUK}
//                     notes={this.props.notes}
//                     key={header.get("_id")}
//                     keys={this.props.keys}
//                     api={this.props.api}
//                     header={header}/>))
//         return (<Row className="house">{items}</Row>);
//     }
// }
//
// class ListingItem extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = props
//     }
//     shouldComponentUpdate(nextProps, nextState) {
//         return this.props.canRank != nextProps.canRank
//                 || this.props.showUK != nextProps.showUK
//                 || this.props.listing !== nextProps.listing
//     }
//     formatter_undef() { return "~undefined~"}
//     formatter_string(value, listing, keys, header, apikey, showUK) {
//         return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
//     }
//     formatter_number(value, listing, keys, header, apikey, showUK) {
//         return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
//     }
//     formatter_last_loaded(value, listing, keys, header, apikey, showUK) {
//         return new Date(value.get("$date").toLocaleString('en-US'))
//     }
//     formatter_url(url) {
//         return <a href={url} target="_blank">Redfin</a>
//     }
//     formatter_distanceTo(value, listing, keys, header, apikey, showUK) {
//         var url = "https://www.google.com/maps"
//                     + "?saddr=" + listing.get(keys.get("latitude")) + "," + listing.get(keys.get("longitude"))
//                     + "&daddr=" + header.get("distanceTo") + "&output=embed"
//         return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">
//                 {showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value}
//                 </a>
//     }
//     formatter_new_36(value, listing, keys, header, apikey, showUK) {
//         return <i className={"fa fa-" + (value == "" ? "dot-circle-o no-selection" : value)}></i>
//     }
//     formatter_address(value, listing, keys, header, apikey, showUK) {
//         var url = "https://www.google.com/maps"
//                     + "?q=" + listing.get(keys.get("latitude")) + "," + listing.get(keys.get("longitude"))
//                     + "&output=embed";
//         return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">{value}</a>
//     }
//     formatter(value, listing, keys, header, showUK) {
//         var type = Immutable.List(["distanceTo"]).find(e => header.get(e)) || ""
//         return (this["formatter_" + type]
//                 || this["formatter_" + header.get("redfin").replace(/\s/g,"_")]
//                 || this["formatter_" + (typeof value)]
//                 || this.formatter_undef)(value, listing, keys, header, this.props.api, showUK)
//     }
//     openNoteWriter() {
//         this.setState({showModal: true})
//     }
//     closeNoteWriter(id, redfin, event) {
//         this.setState({showModal: false})
//     }
//     render() { // notes = [date, redfin_field, content]
//         if (!this.props) return false
//         var p = this.props,
//             h = p.header,
//             showNotes = h.get("notes"),
//             notes = p.notes || Immutable.Map(),
//             value = p.listing.get(h.get("_id")),
//             style = {overflow: "hidden", height: 20, whiteSpace: "nowrap"},
//             toggle = !h.get("toggleIcons") ? null : {
//                         onClick: _.bind(this.props.toggleIcon, null, p.listing, h.get("_id")),
//                         className: "toggleicons"},
//             noteIcon = !showNotes ? null
//                 : (<i   onClick={_.bind(this.openNoteWriter, this)}
//                         className={"pull-right fa fa-pencil notes " + ["off", "on"][+!!notes.size]}></i>),
//             bucketColor,
//             bucket;
//         if (p.canRank && h.get("bucketSize") && h.get("buckets")) {
//             bucket = Math.floor(value / h.get("bucketSize")) * h.get("bucketSize")
//             bucketColor = h.getIn(["buckets", String(bucket), 1])
//             if (bucketColor) _.extend(style, {backgroundColor: bucketColor})
//         }
//         return (
//             <Col md={1} style={style} {...toggle}>
//                 {this.formatter(value, p.listing, p.keys, p.header, p.showUK)}
//                 {noteIcon}
//                 {!showNotes ? null
//                     : (<NoteWriter
//                         close={_.bind(this.closeNoteWriter, this)}
//                         showModal={this.state.showModal}/>)}
//             </Col>
//         )
//         // header={this.state.header}
//         //
//
//     }
// }
//# sourceMappingURL=/Users/michaelfranklin/Developer/personal/python/house/static/js/listings.js.map