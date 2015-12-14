"use babel";
/*

todo: field editor changes don't persist between openings, however save & close saves the data (reload is fine)

*/


/*
sq ft math: String(1000+Math.floor(list price/sq ft)).substr(1)
the tasting room: 39.415732,-77.410943
https://www.google.com/maps/dir/39.415674,-77.410997/39.429216,-77.421175
*/

class ListingApp {
    constructor() {
        _.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem,Navbar,Nav,NavItem,NavDropdown".split(","),
            function(m) {window[m] = ReactBootstrap[m]}) // pollute global namespace for convenience
        this.loadAndRenderData()
        this.signaller = {
            headersSorted: new signals.Signal(),
            headerUpdated: new signals.Signal()
        }
        this.colors = ["#CBEAF6","#B9E3F3","#A8DCF0","#96D5ED","#87CEEB","#73C7E7","#62BFE4","#51B8E1","#3FB1DE","#2EAADC"]
        return this
    }
    loadAndRenderData() {
        this.retryAjax({}, {api: "/getalldata", type: "get"})
            .done(function(content) { // headers, listings, keys, api
                console.log(content)
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api)
                ReactDOM.render(
                  <App {..._.mapObject(content, e => Immutable.fromJS(e))}/>,
                  document.getElementById('content'),
                  () => {
                      $('.fancybox-media').fancybox({
                  		openEffect  : 'none',
                  		closeEffect : 'none',
                  		helpers : { media : {}}
                  	});
                  }
                );
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    retryAjax(params, options) {
        var opts = _.extend({base: "", api: "*required*", dataType: "json",
                            init: "", delay: 0, type: "post"}, options),
            url = opts.base + opts.api,
            tries = opts.tries > 0 ? +opts.tries : 3,
            def = $.Deferred();

        (function makeRequest() {
            $.ajax({url: url, dataType: opts.dataType, data: params, type: opts.type})
                .done(function() {def.resolveWith(this, arguments);})
                .fail(function() {
                    if (tries--) {
                        console.log("failed ", params)
                        return _.delay(makeRequest, opts.delay, this)
                    }
                    def.rejectWith(this, arguments);
                })
        }())
        return def.promise()
    } // function retryAjax
}

var app = new ListingApp()

class Header extends React.Component {
    componentDidUpdate() {
        var sortNode = $(ReactDOM.findDOMNode(this))
        sortNode = sortNode.sortable({
            cursor: "move",
            items: ".item",
            handle: ".move",
            update:_.bind(app.signaller.headersSorted.dispatch, null, sortNode)
        })
    }
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.headers !== nextProps.headers
            || this.props.canMove !== nextProps.canMove
            || this.props.showUK !== nextProps.showUK
    }
    render() {
        var items = this.props.headers.map(header =>
                (<HeaderItem
                    showUK={this.props.showUK}
                    save={this.props.save}
                    hide={this.props.hide}
                    canMove={this.props.canMove}
                    key={header.get("_id")}
                    uniques={this.props.uniques.get(header.get("_id"))}
                    header={header}/>))
        return (<Row className="header">{items}</Row>);
    }
}

class HeaderItem extends React.Component {
    constructor(props) {
        super(props)
        this.state = props
    }
    shouldComponentUpdate(nextProps, nextState) {
        return this.props !== nextProps || this.state !== nextState
    }
    openFieldEditor() {
        this.setState({showModal: true})
    }
    closeFieldEditor(header, isNewNotes) {
        var omit = Immutable.Set(["showModal", "updateRanking", "showType"])

        this.setState({showModal: false, showType: isNewNotes ? "notes" : null})
        if (header) {
            if (isNewNotes) header = header.set("notes", true);
            this.props.save(header.filter((v, key) => !omit.has(key)), this.state.updateRanking)
        }
    }
    render() {
        var header = this.state.header,
            move = (<div className="btn-xsmall move" bsSize="xsmall">
                        <i className="fa fa-bars"></i>
                    </div>)
        return (
            <Col md={1} data-id={header.get("_id")} className="item">
                {this.props.canMove ? move : null}
                <div className="edit" onClick={_.bind(this.openFieldEditor, this)}>
                    {this.props.showUK && header.ukText ? header.get("ukText") : header.get("text")}
                </div>
                <div className="togglevis" onClick={_.bind(this.props.hide, null, header.get("_id"))}>
                    <i className="fa fa-bolt"/>
                </div>
                <FieldEditor
                    uniques={this.props.uniques}
                    showModal={this.state.showModal}
                    header={this.state.header}
                    setState={_.bind(this.setState, this)}
                    close={_.bind(this.closeFieldEditor, this)}/>
            </Col>
        )
    }
}

class Control extends React.Component {
    signal(name) {
        app.signaller[name].dispatch(..._.toArray(arguments).slice(1))
    }
    render() {
        if (!this.props) return false
        var offOn = ["fa fa-circle-o", "fa fa-check"],
            hidden = this.props.hidden.map(header => {
                return (<MenuItem
                            key={header.get("_id")}
                            onSelect={_.bind(this.props.showHeader, null, header.get("_id"))}>
                            {header.get("text")}
                        </MenuItem>)
            });
            return (
                <Navbar fixedTop>
                    <Navbar.Header>
                        <Navbar.Brand>Listings</Navbar.Brand>
                    </Navbar.Header>
                    <Nav>
                        <NavItem
                            eventKey={1}
                            onClick={this.props.toggleRank}>
                            <i className={offOn[+!!this.props.canRank]}></i> Rank
                        </NavItem>
                        <NavItem
                            eventKey={2}
                            onClick={this.props.toggleUK}>
                            <i className={offOn[+!!this.props.showUK]}></i> UK units
                        </NavItem>
                        <NavItem
                            eventKey={3}
                            onClick={this.props.toggleMove}>
                            <i className={offOn[+!!this.props.canMove]}></i> Resequence
                        </NavItem>
                        <NavItem
                            eventKey={4}
                            onClick={this.props.toggleCurrentActives}>
                            <i className={offOn[+!!this.props.currentActivesOnly]}></i>Actives only
                        </NavItem>
                        <NavDropdown eventKey={5} title="Unhide" id="basic-nav-dropdown">
                            {hidden}
                        </NavDropdown>
                    </Nav>
                    <Nav pullRight>
                        <NavItem
                            eventKey={5}
                            onClick={this.props.addNewField}>
                            Add new field
                        </NavItem>
                    </Nav>
                </Navbar>
            )
    }
}

class Listing extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.canRank != nextProps.canRank
                || this.props.showUK != nextProps.canRank
                || this.props.listing !== nextProps.listing
                || this.props.headers !== nextProps.headers
    }
    render() {
        if (!this.props) return false
        var items = this.props.headers.map(header => (
                <ListingItem
                    updateState={this.props.updateState}
                    toggleIcon={this.props.toggleIcon}
                    listing={this.props.listing}
                    canRank={this.props.canRank}
                    showUK={this.props.showUK}
                    notes={this.props.notes}
                    key={header.get("_id")}
                    keys={this.props.keys}
                    api={this.props.api}
                    header={header}/>))
        return (<Row className="house">{items}</Row>);
    }
}

class ListingItem extends React.Component {
    constructor(props) {
        super(props)
        this.state = props
    }
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.canRank != nextProps.canRank
                || this.props.showUK != nextProps.showUK
                || this.props.listing !== nextProps.listing
    }
    // updateState(updater, save) {
    //     var state = _.clone(this.state);
    //     updater(state)
    //     this.setState(state)
    //     if (save) save()
    //     return state
    // }
    formatter_undef() { return "~undefined~"}
    // formatter_date(obj) { return new Date(obj.$date).toLocaleString('en-US')}
    formatter_string(value, listing, keys, header, apikey, showUK) {
        return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
    }
    formatter_number(value, listing, keys, header, apikey, showUK) {
        return showUK && header("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
    }
    // formatter_object(obj) {
    //     var f = _.find([["$date", "date"]], (pair) => {return obj[pair[0]] !== undefined})
    //     return f ? this["formatter_" + f[1]](obj) : this.formatter_undef()
    // }
    formatter_last_loaded(value, listing, keys, header, apikey, showUK) {
        return new Date(value.get("$date").toLocaleString('en-US'))
    }
    formatter_url(url) {
        return <a href={url} target="_blank">Redfin</a>
    }
    formatter_new_35(value, listing, keys, header, apikey, showUK) {
        var url = "https://www.google.com/maps"
                    + "?saddr=" + listing.get("keys.latitude") + "," + listing.get("keys.longitude")
                    + "&daddr=" + header.get("distanceTo") + "&output=embed"
        return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">
                {showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value}
                </a>
    }
    formatter_new_36(value, listing, keys, header, apikey, showUK) {
        return <i className={"fa fa-" + (value == "" ? "dot-circle-o no-selection" : value)}></i>
    }
    formatter_address(value, listing, keys, header, apikey, showUK) {
        var url = "https://www.google.com/maps"
                    + "?q=" + listing.get(keys.latitude) + "," + listing.get("keys.longitude")
                    + "&output=embed";
        return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">{value}</a>
    }
    formatter(value, listing, keys, header, showUK) {
        return (this["formatter_" + header.get("redfin").replace(/\s/g,"_")]
                || this["formatter_" + (typeof value)]
                || this.formatter_undef)(value, listing, keys, header, this.props.api, showUK)
    }
    openNoteWriter() {
        this.setState({showModal: true})
    }
    closeNoteWriter(id, redfin, event) {
        this.setState({showModal: false})
    }

    render() { // notes = [date, redfin_field, content]
        if (!this.props) return false
        var p = this.props,
            h = p.header,
            n = p.notes,
            value = p.listing.get(h.get("_id")),
            style = {overflow: "hidden", height: 20, whiteSpace: "nowrap"},
            toggle = !h.toggleIcons ? null : {
                        onClick: _.bind(this.props.toggleIcon, null, p.listing, h.get("_id")),
                        className: "toggleicons"},
            noteIcon = !h.notes ? null
                : (<i   onClick={_.bind(this.openNoteWriter, this)}
                        className={"pull-right fa fa-pencil notes " + ["off", "on"][+!!n.size()]}></i>),
            bucket;
        if (p.canRank && h.get("bucketSize") && h.get("buckets")) {
            bucket = h.get("buckets").get([Math.floor(value / h.get("bucketSize")) * h.get("bucketSize")])
            if (bucket) _.extend(style, {backgroundColor: bucket.get(1)})
        }
        return (
            <Col md={1} style={style} {...toggle}>
                {this.formatter(value, p.listing, p.keys, p.header, p.showUK)}
                {noteIcon}
                <NoteWriter
                    close={_.bind(this.closeNoteWriter, this)}
                    showModal={this.state.showModal}/>
            </Col>
        )
        // header={this.state.header}
        // update={_.bind(this.updateState, this)}
        //

    }
}

class App extends React.Component { // props is js array of Immutable objects
    constructor(props) {
        super(props)
        var keys = props.keys.toJS(), // no need for them to be immutable
            dtRef = [keys.last_loaded, "$date"],
            showable = props.headers.groupBy(h => h.get("show")), // sorted by sequence on server
            listings = this.updateMath(props),
            uniques = props.headers.map(h => listings.map(l => l.get(h.get("_id"))).toSet());

        this.state = {  maxDate: listings.maxBy(l => l.getIn(dtRef)).getIn(dtRef),
                        headers: showable.get(true),
                        hidden: showable.get(false),
                        currentActivesOnly: true,
                        notes: this.props.notes, // [listing_id][redfin] = [{dt: xx, text: xx, …}, …]
                        allListings: listings,
                        apikey: props.api,
                        uniques: uniques, // unique values by field
                        canMove: false,
                        canRank: false,
                        dtRef: dtRef,
                        keys: keys}

        this.state.listings =  this.getSortedVisibleListings(this.state)
        app.signaller.headersSorted.add(_.bind(this.reorderHeaders, this))
        // app.signaller.headerUpdated.add((id, redfin, value) =>
        //     this.updateState(s => s.headers[id][redfin] = value,
        //                     () => this.saveHeaderValue(null, redfin, id, value)))
        // _.delay(_.bind(this.updateDistances, this), 1000); // wait for google to load?
    }
    getSortedVisibleListings(s) {
        return s.allListings
                .filter(l => !s.currentActivesOnly || l.getIn(s.dtRef) == s.maxDate
                                && l.get(s.keys.status).toLowerCase() == "active")
                .sortBy(l => this.getListingSortbyValue(l, s))
    }
    getListingSortbyValue(listing, state) {
        return state.canRank ? this.getListingRankedValue(listing, state) : this.getListingSortValue(listing, state)
    }
    getListingSortValue(listing, s) {
        return s.headers
                .take(6)
                .map(h => listing.get(h.get("id"))) // id of data in listing
                .map(value => /^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value)
                .toJS()
                .join("$")
    }
    getListingRankedValue(listing, s) {
        return s.headers
                .filter(h => h.get("bucketSize") && h.get("buckets"))
                .reduce((ranking, h) => {
                    var bucket = Math.floor(listing.get(h.get("_id") / h.get("bucketSize")) * h.get("bucketSize")),
                        value = parseInt(h.get("buckets")[bucket] || 0),
                        mult = parseInt(h.bucketMultiplier || 1);
                    return ranking - (value * mult)}, 0)
    }

    toggleRank(force) { // 1st param may be (ignored) mouse event or boolean
        var state = _.clone(this.state),
            shouldRank = typeof force == "boolean" && force ? true : state.canRank = !state.canRank;

        state.listings = _.sortBy(state.listings, l => this.getListingSortValue(l, state.headers, shouldRank))
        this.setState(state)
    }
    toggleUK() {
        this.updateState(s => s.showUK = !s.showUK)
    }
    updateDistances(opts) {
        if (!opts) {
            var lat = this.props.keys.latitude,
                long = this.props.keys.longitude,
                headers = _.filter(this.state.headers, h => !_.isEmpty(h.distanceTo))
            if (!headers.length) return
            opts = {map: [], wait: 1000,
                base: {travelMode: google.maps.TravelMode.WALKING},
                directionsService: new google.maps.DirectionsService()}
            _.each(this.state.listings, (l, index) => {
                _.each(headers, h => {
                    if (!l[h._id]) opts.map.push([index, l[0], l[lat], l[long],
                                                    h._id, h.distanceTo, h.redfin])
                })
            })
            if (!opts.map.length) return
        }

        if (!opts.map.length) return
        var index, listing_id, lat, long, id, distanceTo, headerName
        [index, listing_id, lat, long, id, distanceTo, headerName] = opts.map.pop()

        var request = _.clone(opts.base);
        _.extend(request, {origin: lat + "," + long, destination: distanceTo})
        opts.directionsService.route(request, (response, status) => {
            var duration;
            try {
                duration = parseInt(response.routes[0].legs[0].duration.text) // distance.text, duration.text
           } catch (e) {
                console.log("error getting directions for", request, e)
                duration=0
            }
            var state = _.clone(this.state)
            state.listings[index][id] = duration
            this.setState(state)
            this.updateListingDB(listing_id, headerName, duration)
        })

        _.delay(_.bind(this.updateDistances, this), opts.wait, opts)
    }
    updateListingDB(id, headerName, value) {
        var data = {id: id, headername: headerName, value: value}
        app.retryAjax(JSON.stringify(data), {api: "savelistingdata", type: "post"})
            .done(function(content) {
                console.log("saving listing value worked!", content)
            }.bind(this))
            .fail(function() {
                console.log("failed", arguments)
            }.bind(this))
    }
    updateMath(props) {
        var listings = props.listings;
        props.headers
            .filter(h => h.get("math"))
            .forEach(h => {
                var math = h.get("math"),
                    id = h.get("_id");
                props.headers.forEach(h2 => {math = math.replace(
                                                new RegExp(h2.get("redfin")), // replace name-of-field
                                                'l.get(' + h2.get("_id") + ')') // with reference-to-field
                                            })
                listings.forEach((l, index) => {
                    try {
                        eval("listings[" + index + "] = l.set(" + id + ", " + math + ")")
                    } catch(e) {
                        l.set(id, "***")
                    }
                })
            })
        return listings
    }
    toggleCurrentActives() {
        var state = _.clone(this.state),
            keys = this.props.keys,
            dt = keys.last_loaded;

        state.currentActivesOnly = !state.currentActivesOnly
        state.listings = _.chain(state.allListings)
                            .filter(l => !state.currentActivesOnly
                                            || l[dt].$date == state.maxDate
                                            && l[keys.status].toLowerCase() == "active")
                            .sortBy(l => this.getListingSortValue(l, state.headers, state.canRank))
                            .value()

        this.setState(state)
    }
    toggleMove() {
        this.setState({canMove: !this.state.canMove})
    }
    showHeader(id) {
        this.updateState(s => this.toggleHeaderVisibility(s.hidden, s.headers, id, true),
                () => this.saveHeaderValue(null, "show", id, true))
    }
    hideHeader(id) {
        this.updateState(s => this.toggleHeaderVisibility(s.headers, s.hidden, id, true),
                        () => this.saveHeaderValue(null, "show", id, false))
    }
    // saveHeader(header) {
    //     this.updateState(s => s.headers[_.findIndex(s.headers, h => h._id == header._id)] = header,
    //                     () => this.saveHeader(header))
    // }
    updateState(updater, save) {
        var state = _.clone(this.state);
        updater(state)
        this.setState(state)
        if (save) save()
        return state
    }
    toggleHeaderVisibility(source, target, id, show) {
        return  _.sortBy(target.push(
            _.extend(source.splice(_.findIndex(source, h => h._id == id), 1)[0], {show: show}
        )), "sequence")
    }
    reorderHeaders(sortNode) {
        var ids = sortNode.sortable("toArray", {attribute: "data-id"}),
            state = this.state,
            headers = state.headers;

        ids.forEach((id, newSequence) => {
            var [index, entry] = headers.findEntry(h => h.get("_id") == id)
            headers = headers.setIn([index, "sequence"], newSequence)
        })
        state.headers = headers.sortBy(h => h.get("sequence"))

        sortNode.sortable("cancel");
        this.setState({headers: state.headers,
                        listings: this.getSortedVisibleListings(this.state)})
        this.saveHeaderValue(state.headers, "sequence")
    }
    saveHeader(header, updateRanking) {
        app.retryAjax(JSON.stringify(header), {api: "/saveheader", type: "post"})
            .done(function(content) {
                console.log("saving header worked!", header, arguments)
                if (updateRanking && this.state.canRank) this.toggleRank(true)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    saveHeaderValue(headers, redfin, id, value) {
        var data = {redfin: redfin,
                    data: headers !== null ? headers.map(h => [h.get("_id"), h.get(redfin)]).toJS()
                            : [[id, value]]}
        app.retryAjax(JSON.stringify(data), {api: "/saveheadervalue", type: "post"})
            .done(function(content){
                console.log("saving header value worked!", data, arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    addNewField() {
        var maxShownId = _.max(this.state.headers, "_id"),
            maxHiddenId = _.max(this.state.hidden, "_id"),
            newId = 1 + (maxShownId._id > maxHiddenId._id ? maxShownId._id : maxHiddenId_.id),
            state = _.clone(this.state),
            header =  _.extend(_.clone(state.headers[0]), {
                _id: newId,
                redfin: "new_" + newId,
                sequence: newId,
                show: true,
                text: "new_" + newId})

        state.headers.push(header)
        _.each(state.listings, l => l.push(""))
        this.setState(state)

        app.retryAjax(JSON.stringify(header), {api: "/savenewfield", type: "post"})
            .done(function(content){
                console.log("added new field!", arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    toggleIcon(listing, hId, event) {
        var value = listing[hId],
            header = _.find(this.state.headers, h => h._id == hId),
            icons = header.toggleIcons.split(","),
            icon = icons[value == "" ? 0 : (_.indexOf(icons, value) + 1) % icons.length];
        this.updateState(s => _.find(s.listings, l => l[0] == listing[0])[hId] = icon,
                        s => this.updateListingDB(listing[0], header.redfin, icon))
    }
    render() {
        // in listing:                     notes={this.state.notes[listing[0]]}
        var listings = this.state.listings.map(listing => (
                <Listing
                    toggleIcon={_.bind(this.toggleIcon, this)}
                    updateState={_.bind(this.updateState, this)}
                    canRank={this.state.canRank}
                    showUK={this.state.showUK}
                    api={this.props.api}
                    key={listing.get(0)}
                    keys={this.props.keys}
                    listing={listing}
                    headers={this.state.headers}/>))
        console.log(this.state.listings)
        return (
            <Grid fluid={true}>
                <Control
                    hidden={this.state.hidden}
                    canRank={this.state.canRank}
                    canMove={this.state.canMove}
                    showUK={this.state.showUK}
                    showHeader={_.bind(this.showHeader, this)}
                    currentActivesOnly={this.state.currentActivesOnly}
                    toggleUK={_.bind(this.toggleUK, this)}
                    toggleMove={_.bind(this.toggleMove, this)}
                    toggleRank={_.bind(this.toggleRank, this)}
                    addNewField={_.bind(this.addNewField, this)}
                    toggleCurrentActives={_.bind(this.toggleCurrentActives, this)}/>
                <Header
                    headers={this.state.headers}
                    canMove={this.state.canMove}
                    listings={this.state.listings}
                    uniques={this.state.uniques}
                    showUK={this.state.showUK}
                    save={_.bind(this.saveHeader, this)}
                    hide={_.bind(this.hideHeader, this)}/>
                {listings}
            </Grid>
        )
    }
}

class NoteWriter extends React.Component {
    constructor(props) {
        super(props)
        this.state = _.clone(props)
    }
    componentWillReceiveProps(nextProps) {
        this.setState(_.clone(nextProps))
    }
    updateFieldValue(name, event) {
        var value = event.target.value;

        //this.props.update(s => s.header[name] = value)
    }
    render() {
        return (
            <Modal show={this.state.showModal} onHide={_.bind(this.props.close, this, null)}>
                <Modal.Header closeButton>
                    <Modal.Title>Notes for </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid={true}>
                        <Row>
                            <Col md={3} className="title">today</Col>
                            <Col md={9} className="values">
                                <textarea style={{width: "100%"}} rows={5}></textarea>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={3} className="title">date</Col>
                            <Col md={9} className="values">
                                old note content
                            </Col>
                        </Row>
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button >
                        Save & Close
                    </Button>
                    <Button >Close</Button>
                </Modal.Footer>
            </Modal>
        )

        //onClick={_.bind(this.props.close, this, null)}
        //onClick={_.bind(this.props.close, this, null)}
    }
}

class FieldEditor extends React.Component {
    constructor(props) {
        super(props)
        this.state = props
    }
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.showModal != nextProps.showModal ||
                this.props.header !== nextProps.header
    }
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
    }
    updateFieldValue(name, event) {
        var buckets = {},
            value = event.target.value;
        if (/^bucket/.test(name)) this.props.setState({header: this.state.header.set(name, value), updateRanking: true})
        else this.props.setState({header: this.state.header.set(name, value)})
        if (name != "bucketSize") return
        if (value == "*") this.props.uniques.map(v => buckets[v] = [0, ""])
        else if (value != "") this.props.uniques
                                    .map(v => Math.floor(v / value)).toSet() // make unique
                                    .map(v => v * value).sort()
                                    .forEach(v => buckets[v] = [0, ""])
        this.props.setState({header: this.state.header.set("buckets", Immutable.fromJS(buckets))})
    }
    updateBuckets(bucket, event) {
        var buckets = this.state.header.get("buckets").set(bucket, Immutable.List([event.target.value, ""])),
            min = !buckets.size ? 0 : buckets.minBy(wc => +wc.get(0)).get(0),
            max = !buckets.size ? 0 : buckets.maxBy(wc => +wc.get(0)).get(0),
            mult = !max ? 0 : (app.colors.length - 2) / (max - min);

        buckets = buckets.map(wc => {
            var color = wc.get(0) == min ? app.colors[0] :
                wc.get(0) && wc.get(0) == max ? app.colors[app.colors.length - 1]
                    : app.colors[Math.floor((wc.get(0) - min + 1) * mult)]
            console.log(wc.set(1, color).toJS())
            return wc.set(1, color)
        })
        this.setState({header: this.state.header.set("buckets", buckets)})
    }
    showType(type) {
        this.setState({showType: type})
    }
    render() {
        var header = this.state.header,
            id = header.get("_id"),
            props = {update: _.bind(this.updateFieldValue, this), header: header},
            text = Immutable.List("Math,Distance to,Toggle icons,Notes".split(",")),
            fields= text.map(t => t.substr(0,1).toLowerCase()
                                    + t.substr(1).replace(/ (.)/g, ($0, $1) => $1.toUpperCase())),
            type = fields.find(n => header.get(n)),
            isType = t => type == t || this.state.showType == t;
        return (
            <Modal show={this.state.showModal} onHide={_.bind(this.props.close, this, null)}>
                <Modal.Header closeButton>
                    <Modal.Title>{header.get("text")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid={true}>
                        <Field title="Text" {...props}/>
                        <Field title="UK multiplier" name="ukMultiplier" {...props}/>
                        <Field title="UK Text" name="ukText" {...props}/>
                        <Field title="Bucket Size" {...props} text="* = use distinct values"/>
                        <Field title="Bucket Multiplier" {...props}/>
                        <Buckets
                            buckets={this.state.header.get("buckets")}
                            updateBuckets={_.bind(this.updateBuckets, this)}/>
                        <FieldType
                            showType={_.bind(this.showType, this)}
                            header={header}
                            text={text}
                            fields={fields}
                            type={type}/>
                        {!isType("math") ? ""
                            : <Field title="&raquo; Math" name="math" {...props}/>}
                        {!isType("distanceTo") ? ""
                            : <Field title="&raquo; Distance To" name="distanceTo" {...props}/>}
                        {!isType("toggleIcons") ? ""
                            : <Field title="&raquo; Toggle icons" name="toggleIcons" {...props} text="FA icons, without 'fa-'"/>}
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={_.bind(this.props.close, this, this.state.header, this.state.showType=="notes")}>
                        Save & Close
                    </Button>
                    <Button onClick={_.bind(this.props.close, this, null)}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

class Buckets extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.buckets != nextProps.buckets
    }

    render() {
        if (!this.props) return false
        var buckets = [];
        this.props.buckets.forEach((wc, bucket) => { // bucket = [weight, color]
            buckets.push(<Col
                            key={"b" + bucket}
                            md={2}
                            style={{backgroundColor: wc.get(1), height: 26, paddingTop: 3}}>
                            {bucket}
                            </Col>)
            buckets.push(<Col
                            key={"v" + bucket}
                            md={2}>
                            <input
                                type="text"
                                defaultValue={wc.get(0)}
                                onChange={_.bind(this.props.updateBuckets, null, bucket)}/>
                        </Col>)})
        return (
            <Row>
                <Col md={3} className="title">Bucket values</Col>
                <Col md={9} className="values">
                    <Grid fluid={true}>
                        {buckets}
                    </Grid>
                </Col>
            </Row>
        )
    }
}

class FieldType extends React.Component { //check, fa-circle-o
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.type != nextProps.type
    }
    render() {
        var h = this.props.header,
            type = this.props.type,
            text = this.props.text,
            fields = this.props.fields,
            offOn = ["fa fa-circle-o", "fa fa-check"],
            btns = text.map((t, i) => (  <Button
                                            key={i}
                                            bsSize="xsmall"
                                            style={{marginRight: 5}}
                                            onClick={_.bind(this.props.showType, null, fields.get(i))}>
                                            {t}
                                        </Button>))
        return (
            <Row>
                <Col md={3} className="title">Type</Col>
                <Col md={9} className="values" style={{marginTop: 5}}>
                    {type ? text.get(fields.findIndex(f => f == type)) : btns}
                </Col>
            </Row>
        )
    }
}

class Field extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        var fn = this.props.name || (this.props.title.substr(0, 1).toLowerCase()
                        + this.props.title.substr(1).replace(/\s+/g, ""))
        return this.props.title != nextProps.title ||
                this.props.header.get(fn) !== nextProps.header.get(fn)
    }
    render() {
        if (!this.props) return false;
        var fieldname = this.props.name || (this.props.title.substr(0, 1).toLowerCase()
                        + this.props.title.substr(1).replace(/\s+/g, "")),
            desc = (this.props.text ? <div>{this.props.text}</div> : null)
        return (
            <Row>
                <Col md={3} className="title">{this.props.title}</Col>
                <Col md={9} className="values">
                    <input type="text" defaultValue={this.props.header.get(fieldname)}
                            onChange={_.bind(this.props.update, null, fieldname)}/>
                    {desc}
                </Col>
            </Row>
        )
    }
}
