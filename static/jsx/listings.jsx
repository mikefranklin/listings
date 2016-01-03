class Listings extends React.Component {
    constructor(props) {
        super(props)
        app.on.headersUpdated.add(this.updateListings, this)
        app.on.rankUpdated.add(this.updateRank, this)
    }
    updateRank(newRank) {
        this.setState({canRank: newRank})
    }
    updateListings(s) {
        this.setState({ headers: s.get("vheaders"),
                        listings: s.get("listings"),
                        rankings: s.get("rankings"),
                        showUk: s.get("showUk"),
                        canRank: s.get("canRank")
                    })
    }
    render() {
        if (!this.state) return false
        var sortPos = +this.state.canRank,
            headers = this.state.headers,
            listings = this.state.listings
                        .sortBy((_, index) => this.state.rankings.get(index)[sortPos])
                        .map((l, lIndex) => (
                            <Row key={l.key}>
                            {l.data.reduce((cols, item, index) => cols.push(
                                <ListingItem
                                    key={headers.getIn([index, "_id"])}
                                    ranking={!this.state.canRank ? null : this.state.rankings.get(lIndex)[2][index]}
                                    data={item}
                                    header={headers.get(lIndex)}
                                />), Immutable.List())}
                            </Row>
                        ))
                        .toList()
        return <span>{listings}</span>
    }
}

class ListingItem extends React.Component {
    render() {
        var cls = this.props.ranking === null ? {} : {className: "rank" + this.props.ranking}
        return (
            <Col md={1} {...cls}>
            {this.props.data}
            </Col>
        )
    }
}

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
