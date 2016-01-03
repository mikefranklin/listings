"use babel";
/*
$('.fancybox-media').fancybox({
  openEffect  : 'none',
  closeEffect : 'none',
  helpers : { media : {}}
*/
class App {
    constructor() {
        ("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem,Navbar,Nav,NavItem,NavDropdown"
        ).split(",").forEach(m => window[m] = ReactBootstrap[m]) // pollute global namespace for convenience
        this.on = {}
        this.store = Immutable.Map()
        var list = Immutable.List(`
            headersUpdated          # after content is updated
            canRankClicked:toggleCanRank
            rankUpdated
            `.split("\n"))
                .filter(e => e)
                .map(e => e.split("#")[0].replace(/\s/g, "").split(":")) // signal:function
        list.forEach(pair => this.on[pair[0]] = new signals.Signal())
        list.filter(pair => pair[1])
            .forEach(pair => this.on[pair[0]].add(this[pair[1]].bind(this)))
    }
    display() {
        ReactDOM.render((
            <Grid fluid={true}>
                <Control/>
                <Header/>
                <Listings/>
            </Grid>),
            document.getElementById("content"),
            this.loadData.bind(this))
    }
    loadData() {
        this.retryAjax({}, {api: "/getalldata", type: "get"})
            .done(function(content) { // headers, listings, keys, api
                console.log(content)
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api)
                this.processRawData(content)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    toggleCanRank() {
        var newRank = !this.store.get("canRank")
        this.store = this.store.set("canRank", newRank)
        this.on.rankUpdated.dispatch(newRank)
    }
    processRawData(data) {
        var headers = Immutable.fromJS(data.headers).groupBy(h => h.get("show")),
            canRank = true;

        this.listings = Immutable.fromJS(data.listings)
        this.keys = Object.assign({}, data.keys)
        this.dtRef = [data.keys.last_loaded, "$date"]
        this.maxDate = this.listings.maxBy(l => l.getIn(this.dtRef)).getIn(this.dtRef)

        this.store = this.store.set("vheaders", headers.get(true).sortBy(h => h.get("sequence")))
                        .set("hheaders", headers.get(false).sortBy(h => h.get("text")))
                        .set("canRank", canRank)
                        .set("currentActivesOnly", true)
                        .set("showUk", false)
        this.store = this.store.set("listings", this.getDisplableListingData())
        this.store = this.store.set("rankings", this.getRankingInfo())

        this.on.headersUpdated.dispatch(this.store, this.keys)
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

    getRankingInfo() {
        var sortVal = value => /^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value,
            alphaSort = l => l.take(6).reduce((s, v) => s + "$" + sortVal(v), ""),
            headers = this.store.get("vheaders")
                            .map(h => {
                                var buckets = (h.get("buckets") || Immutable.List()).map(wc => wc.get(0)),
                                    min = buckets.min(),
                                    max = buckets.max(),
                                    mult = !max ? 0 : 8 / (max - min);
                                return [min, max, mult, buckets.toJS(), h.get("bucketSize"),
                                    parseInt(h.get("bucketMultiplier") || 1)]
                            })
                            .toList()
        return this.store.get("listings").map(l => l.data.reduce((r, item, index) => {
                var [min, max, mult, buckets, size, multiplier] = headers.get(index)
                if (!size) return r
                var bucket = Math.floor(item / size) * size,
                    weight = parseInt(buckets[bucket] || 0),
                    scaled = weight == min ? 0 : weight && weight == max ? 9
                                : Math.floor((weight - min + 1) * mult)
                r[1] = r[1] - (weight * multiplier)
                r[2][index] = scaled
                return r
        }, [alphaSort(l.data), 0, []]) // rank score + [0-9, ...] for each field
        )
    }
    getDisplableListingData() {
        var indices = this.store.get("vheaders")
                            .sortBy(h => h.get("sequence"))
                            .map(h => h.get("_id"))
        return this.listings
                    .filter(l => !this.store.get("currentActivesOnly") || (l.getIn(this.dtRef) == this.maxDate
                                    && l.get(this.keys.status).toLowerCase() == "active"))
                    .map(l => ({key: l.get(0), data: indices.map(index => l.get(index))}))
    }
}

class AppX extends React.Component { // props is js array of Immutable objects
    constructor(props) {
        super(props)
        var keys = props.keys.toJS(), // no need for them to be immutable
            dtRef = [keys.last_loaded, "$date"],
            showable = props.headers.groupBy(h => h.get("show")),
            listings = this.updateMath(props),
            uniques = Immutable.Map(props.headers // faster to convert the end result than use intermediate Set()
                .filter(h => h.get("show"))
                .map(h => [h.get("_id"),
                            Immutable.Map(listings.reduce((set, l) => {set[l.get(h.get("_id"))] = true; return set}, {}))]
                ))

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
