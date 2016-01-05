"use babel";

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
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
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
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
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
                    {this.props.showUK && header.get("ukText") ? header.get("ukText") : header.get("text")}
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
        return this.props !== nextProps
    }
    render() {
        if (!this.props) return false
        var items = this.props.headers.map(header => (
                <ListingItem
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
    formatter_undef() { return "~undefined~"}
    formatter_string(value, listing, keys, header, apikey, showUK) {
        return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
    }
    formatter_number(value, listing, keys, header, apikey, showUK) {
        return showUK && header.get("ukMultiplier") ? Math.floor(value * header.get("ukMultiplier")) : value
    }
    formatter_last_loaded(value, listing, keys, header, apikey, showUK) {
        return new Date(value.get("$date").toLocaleString('en-US'))
    }
    formatter_url(url) {
        return <a href={url} target="_blank">Redfin</a>
    }
    formatter_distanceTo(value, listing, keys, header, apikey, showUK) {
        var url = "https://www.google.com/maps"
                    + "?saddr=" + listing.get(keys.get("latitude")) + "," + listing.get(keys.get("longitude"))
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
                    + "?q=" + listing.get(keys.get("latitude")) + "," + listing.get(keys.get("longitude"))
                    + "&output=embed";
        return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">{value}</a>
    }
    formatter(value, listing, keys, header, showUK) {
        var type = Immutable.List(["distanceTo"]).find(e => header.get(e)) || ""
        return (this["formatter_" + type]
                || this["formatter_" + header.get("redfin").replace(/\s/g,"_")]
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
            showNotes = h.get("notes"),
            notes = p.notes || Immutable.Map(),
            value = p.listing.get(h.get("_id")),
            style = {overflow: "hidden", height: 20, whiteSpace: "nowrap"},
            toggle = !h.get("toggleIcons") ? null : {
                        onClick: _.bind(this.props.toggleIcon, null, p.listing, h.get("_id")),
                        className: "toggleicons"},
            noteIcon = !showNotes ? null
                : (<i   onClick={_.bind(this.openNoteWriter, this)}
                        className={"pull-right fa fa-pencil notes " + ["off", "on"][+!!notes.size]}></i>),
            bucketColor,
            bucket;
        if (p.canRank && h.get("bucketSize") && h.get("buckets")) {
            bucket = Math.floor(value / h.get("bucketSize")) * h.get("bucketSize")
            bucketColor = h.getIn(["buckets", String(bucket), 1])
            if (bucketColor) _.extend(style, {backgroundColor: bucketColor})
        }
        return (
            <Col md={1} style={style} {...toggle}>
                {this.formatter(value, p.listing, p.keys, p.header, p.showUK)}
                {noteIcon}
                {!showNotes ? null
                    : (<NoteWriter
                        close={_.bind(this.closeNoteWriter, this)}
                        showModal={this.state.showModal}/>)}
            </Col>
        )
        // header={this.state.header}
        //

    }
}

class App extends React.Component { // props is js array of Immutable objects
    constructor(props) {
        super(props)
        var keys = props.keys.toJS(), // no need for them to be immutable
            dtRef = [keys.last_loaded, "$date"],
            showable = props.headers.groupBy(h => h.get("show")),
            listings = this.updateMath(props),
            uniques = Immutable.Map(showable.get(true)
                        .map(h => [h.get("_id"),
                            listings.map(l => l.get(h.get("_id")))
                                .filter(v => v !== Infinity) // seems to be problematic in sets?
                                .reduce((set, v) => set.add(v), Immutable.Set())]))
        this.state = {  maxDate: listings.maxBy(l => l.getIn(dtRef)).getIn(dtRef),
                        headers: showable.get(true),
                        hidden: showable.get(false),
                        currentActivesOnly: true,
                        notes: this.props.notes, // [listing_id][redfin] = [{dt: xx, text: xx, …}, …]
                        allListings: Immutable.Map(listings.map(l => [l.get(0), l])), // map by id
                        apikey: props.api,
                        uniques: uniques, // unique values by field
                        canMove: false,
                        canRank: false,
                        showUK: false,
                        dtRef: dtRef,
                        keys: keys}

        this.state.listings =  this.getSortedVisibleListings(this.state, false)
        app.signaller.headersSorted.add(_.bind(this.reorderHeaders, this))
        this.updateDistances()
    }
    getSortedVisibleListings(s, shouldRank) {
        var headers = shouldRank
                ? s.headers.filter(h => h.get("bucketSize") && h.get("buckets"))
                : s.headers.take(6).map(h => h.get("_id")),
            fn = shouldRank
                ? (listing, headers) => headers.reduce((ranking, h) => {
                        var bucket = Math.floor(listing.get(h.get("_id")) / h.get("bucketSize")) * h.get("bucketSize"),
                            weight = parseInt(h.getIn(["buckets", String(bucket), 0])|| 0), // bucket is [weight, color]
                            mult = parseInt(h.get("bucketMultiplier") || 1);
                        return ranking - (weight * mult)}, 0)
                : (listing, headers) => headers
                        .map(id => listing.get(id)) // id of data in listing
                        .map(value => /^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value)
                        .toJS()
                        .join("$")

        return s.allListings
                .filter(l => !s.currentActivesOnly || l.getIn(s.dtRef) == s.maxDate
                                && l.get(s.keys.status).toLowerCase() == "active")
                .sortBy(l => fn(l, headers))
                .toList()
    }
    toggleRank(force) { // 1st param may be (ignored) mouse event or boolean
        var isForce = typeof force == "boolean" && force,
            state = !isForce ? {canRank: !this.state.canRank} : {};
        state.listings = this.getSortedVisibleListings(this.state, isForce || state.canRank)
        this.setState(state)
    }
    toggleUK() {
        this.setState({showUK: !this.state.showUK})
    }
    getDistanceOpts() {
        var headers = this.state.headers.filter(h => h.get("distanceTo")),
            lat = this.props.keys.get("latitude"),
            long = this.props.keys.get("longitude"),
            opts = {map: [],
                    wait: 1000,
                    directionsService: new google.maps.DirectionsService()};
        this.state.listings
            .forEach((l, index) => {
                if (l.get(lat) && l.get(long)) {
                    headers
                        .filter(h => !l.get(h.get("_id")))
                        .forEach(h => opts.map.push(
                            [index, l.get(0), l.get(lat),l.get(long),
                             h.get("_id"), h.get("distanceTo"),h.get("redfin")
                            ]))
                }
            })
        return opts
    }
    updateDistances(opts) {
        var index, listing_id, lat, long, id, distanceTo, headerName, request, duration
        if (typeof google != "object") {
            console.log("waiting 250ms for google");
            _.delay(_.bind(this.updateDistances, this), 250)
            return
        }
        if (!opts) opts = this.getDistanceOpts()

        if (!opts.map.length) return

        [index, listing_id, lat, long, id, distanceTo, headerName] = opts.map.pop()

        request = {travelMode: google.maps.TravelMode.WALKING,
                    origin: lat + "," + long, destination: distanceTo}

        opts.directionsService.route(request, (response, status) => {
            try {
                duration = parseInt(response.routes[0].legs[0].duration.text) // distance.text, duration.text
           } catch (e) {
                console.log("error getting directions for", request, e)
                duration=0
            }
            this.setState({
                listings: this.state.listings.setIn([index, id], duration),
                allListings: this.state.allListings.setIn([listing_id, id], duration)
            })
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
        var listings = props.listings,
            name2id = (t, h) => { t = t.replace(new RegExp(h.get("redfin")), 'l.get(' + h.get("_id") + ')'); return t},
            entries = props.headers
                        .filter(h => h.get("math"))
                        .map(h => [h.get("_id"), props.headers.reduce(name2id, h.get("math"))])
        return listings.map(l => {
                    entries.forEach(entry => {
                        var [id, math] = entry,
                            value = "**";
                        try { value = eval(math) } catch(e) {}
                        l = l.set(id, value)
                    })
                    return l
                })
    }
    toggleCurrentActives() {
        var state = this.state.set("currentActivesOnly", !this.state.get("currentActivesOnly"));
        state.listings = this.getSortedVisibleListings(state, state.get("canRank"))
        this.setState(state)
    }
    toggleMove() {
        this.setState({canMove: !this.state.canMove})
    }
    showHeader(id) {
        this.toggleHeaderVisibility("hidden", "headers", id, true)
    }
    hideHeader(id) {
        this.toggleHeaderVisibility("headers", "hidden", id, false)
    }
    toggleHeaderVisibility(source, target, id, show) {
        var index = this.state[source].findIndex(h => h.get("_id") == id), // one to show
            entry = this.state[source].get(index).set("show", true)
        this.setState({[target]: this.state[target].push(entry).sortBy(h => h.get("sequence")),
                        [source]: this.state[source].splice(index, 1)})
        this.saveHeaderValue(null, "show", id, show)
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
        var index = this.state.headers.findIndex(h => h.get("_id") == header.get("_id"))
        this.setState({headers: this.state.headers.set(index, header)})
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
        var newId = (1 + this.state.headers.merge(this.state.hidden).maxBy(h => h.get("_id")).get("_id")),
            header = this.state.headers.get(0).merge({
                _id: newId,
                redfin: "new_" + newId,
                sequence: newId,
                buckets: {},
                bucketSize: null,
                bucketMultiplier: null,
                show: true,
                text: "new_" + newId})
        this.setState({headers: this.state.headers.push(header),
                       listings: this.state.listings.map(l => l.push("")),
                       allListings: this.state.allListings.map(l => l.push(""))
                    })

        app.retryAjax(JSON.stringify(header), {api: "/savenewfield", type: "post"})
            .done(function(content){
                console.log("added new field!", arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    toggleIcon(listing, hId, event) {
        var value = listing.get(hId),
            header = this.state.headers.find(h => h.get("_id") == hId),
            icons = header.get("toggleIcons").split(","),
            icon = icons[value == "" ? 0 : (_.indexOf(icons, value) + 1) % icons.length],
            pos = this.state.listings.findIndex(l => l.get(0) == listing.get(0));

        this.setState({
            listings: this.state.listings.setIn([pos, hId], icon),
            allListings: this.state.allListings.setIn([listing.get(0), hId], icon)
        })
        this.updateListingDB(listing.get(0), header.get("redfin"), icon)
    }
    render() {
        // in listing:                     notes={this.state.notes[listing[0]]}
        var listings = this.state.listings.map(listing => (
                <Listing
                    toggleIcon={_.bind(this.toggleIcon, this)}
                    canRank={this.state.canRank}
                    showUK={this.state.showUK}
                    api={this.props.api}
                    key={listing.get(0)}
                    keys={this.props.keys}
                    listing={listing}
                    headers={this.state.headers}/>))
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
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
    }
    updateFieldValue(name, event) {
        var value = event.target.value,
            buckets = {}
        if (/^bucket/.test(name)) this.props.setState({header: this.state.header.set(name, value), updateRanking: true})
        else this.props.setState({header: this.state.header.set(name, value)})
        if (name != "bucketSize") return
        if (value == "*") buckets = this.props.uniques.reduce((m, v) => {m[v] = [0, ""]; return m}, {})
        else if (value != "") buckets = this.props.uniques
                                            .map(v => Math.floor(v / value) * value)
                                            .toSet()
                                            .reduce((m, v) => {m[v] = [0, ""]; return m}, {})
        this.props.setState({header: this.state.header.set("buckets", Immutable.fromJS(buckets))})
    }
    updateBuckets(bucket, event) {
        var buckets = this.state.header.get("buckets").set(String(bucket), Immutable.List([event.target.value, ""])),
            min = !buckets.size ? 0 : buckets.minBy(wc => +wc.get(0)).get(0),
            max = !buckets.size ? 0 : buckets.maxBy(wc => +wc.get(0)).get(0),
            mult = !max ? 0 : (app.colors.length - 2) / (max - min);
        buckets = buckets.map(wc => {
            var color = wc.get(0) == min ? app.colors[0] :
                wc.get(0) && wc.get(0) == max ? app.colors[app.colors.length - 1]
                    : app.colors[Math.floor((wc.get(0) - min + 1) * mult)]
            return wc.set(1, color)
        })
        this.setState({header: this.state.header.set("buckets", buckets)})
    }
    showType(type) {
        this.setState({showType: type})
    }
    close() {
        console.log("FE/Close", this.state.header.toJS());
        this.props.close(this.state.header, this.state.showTypes == "notes")
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
                    <Button onClick={_.bind(this.close, this)}>
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
        return this.props.buckets !== nextProps.buckets
    }
    render() {
        if (!this.props) return false
        var buckets = [];
        Immutable.Map(this.props.buckets) // handles for undefined buckets
            .map((wc, bucket) => [bucket, wc.get(0), wc.get(1)])
            .sortBy(e => +e[0])
            .forEach(bwc => {
                var [bucket, weight, color] = bwc
                buckets.push(<Col
                            key={"b" + bucket}
                            md={2}
                            style={{backgroundColor: color, height: 26, paddingTop: 3}}>
                            {bucket}
                            </Col>)
                buckets.push(<Col
                            key={"v" + bucket}
                            md={2}>
                            <input
                                type="text"
                                defaultValue={weight}
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
