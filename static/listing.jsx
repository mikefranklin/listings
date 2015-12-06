"use babel";
/*
sq ft math: String(1000+Math.floor(list price/sq ft)).substr(1)
the tasting room: 39.415732,-77.410943
https://www.google.com/maps/dir/39.415674,-77.410997/39.429216,-77.421175
*/

class ListingApp {
    constructor() {
        _.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem".split(","),
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
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api)
                ReactDOM.render(
                  <App {...content}/>,
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
    render() {
        var items = _.map(this.props.headers, (header) => {
                        var values =  _.chain(this.props.listings)
                                        .pluck(header._id)
                                        .uniq().value() // unique values for bucketing
                        return (<HeaderItem
                                showUK={this.props.showUK}
                                save={this.props.save}
                                hide={this.props.hide}
                                canMove={this.props.canMove}
                                key={header._id}
                                values={values}
                                header={header}/>)})
        return (<Row className="header">{items}</Row>);
    }
}

class HeaderItem extends React.Component {
    constructor(props) {
        super(props)
        this.state = _.clone(props)
    }
    updateState(updater, save) {
        var state = _.clone(this.state);
        updater(state)
        this.setState(state)
        if (save) save()
        return state
    }
    openFieldEditor() {
        this.updateState(s => s.showModal = true)
    }
    closeFieldEditor(header) {
        this.updateState(s => _.extend(s, header || {}, {showModal: false}))
        if (header) {
            this.props.save(_.omit(this.state.header, "showModal", "updateRanking"), this.state.updateRanking)
        }
    }
    render() {
        var header = this.props.header,
            move = (<div className="btn-xsmall move" bsSize="xsmall">
                        <i className="fa fa-bars"></i>
                    </div>)
        return (
            <Col md={1} data-id={header._id} className="item">
                {this.props.canMove ? move : null}
                <div className="edit" onClick={_.bind(this.openFieldEditor, this)}>
                    {this.props.showUK && header.ukText ? header.ukText : header.text}
                </div>
                <div className="togglevis" onClick={_.bind(this.props.hide, null, header._id)}>
                    <i className="fa fa-bolt"/>
                </div>
                <FieldEditor
                    values={this.props.values}
                    showModal={this.state.showModal}
                    header={this.state.header}
                    update={_.bind(this.updateState, this)}
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
        var opts = ["default", "success"],
            moveStyle = opts[+!!this.props.canMove],
            curStyle = opts[+!!this.props.currentActivesOnly],
            rankStyle = opts[+!!this.props.canRank],
            ukStyle = opts[+!!this.props.showUK],
            hidden = _.map(this.props.hidden, (header) => {
                return (<MenuItem
                            key={header._id}
                            onSelect={_.bind(this.props.showHeader, null, header._id)}>
                            {header.text}
                        </MenuItem>)
            });
        return (
            <Row className="control" style={{top: this.props.canMove * 20 + 34}}>
                <Col md={12}>
                    <span className="pull-right">
                        <Button
                            bsStyle={ukStyle}
                            onClick={this.props.toggleUK}>
                            UK
                        </Button>
                        <Button
                            bsStyle={rankStyle}
                            onClick={this.props.toggleRank}>
                            Rank
                        </Button>
                        <Button
                            bsStyle="info"
                            onClick={_.bind(this.signal, this, "newField")}>
                            New Field
                        </Button>
                        <Button
                            bsStyle={curStyle}
                            onClick={this.props.toggleCurrentActives}>
                            Current Actives
                        </Button>
                        <Button
                            bsStyle={moveStyle}
                            onClick={this.props.toggleMove}>
                            Toggle move
                        </Button>
                        <DropdownButton
                            pullRight
                            title="Unhide"
                            id="unhide">
                        {hidden}
                        </DropdownButton>
                    </span>
                </Col>
            </Row>)
    }
}

class Listing extends React.Component {
    render() {
        if (!this.props) return false
        var items = _.map(this.props.headers, header => (
                <ListingItem
                    showUK={this.props.showUK}
                    canRank={this.props.canRank}
                    api={this.props.api}
                    key={header._id}
                    keys={this.props.keys}
                    redfin={header.redfin}
                    listing={this.props.listing}
                    header={header}/>))
        return (<Row className="house">{items}</Row>);
    }
}

class ListingItem extends React.Component {
    formatter_undef() { return "~undefined~"}
    formatter_date(obj) { return new Date(obj.$date).toLocaleString('en-US')}
    formatter_string(value, listing, keys, header, apikey, showUK) {
        return showUK && header.ukMultiplier ? Math.floor(value * header.ukMultiplier) : value
    }
    formatter_number(value, listing, keys, header, apikey, showUK) {
        return showUK && header.ukMultiplier ? Math.floor(value * header.ukMultiplier) : value
    }
    formatter_object(obj) {
        var f = _.find([["$date", "date"]], (pair) => {return obj[pair[0]] !== undefined})
        return f ? this["formatter_" + f[1]](obj) : this.formatter_undef()
    }
    formatter_url(url) {
        return <a href={url} target="_blank">Redfin</a>
    }
    formatter_new_35(value, listing, keys, header, apikey, showUK) {
        var url = "https://www.google.com/maps"
                    + "?saddr=" + listing[keys.latitude] + "," + listing[keys.longitude]
                    + "&daddr=" + header.distanceTo + "&output=embed"
        return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">
                {showUK && header.ukMultiplier ? Math.floor(value * header.ukMultiplier) : value}
                </a>
    }
    formatter_address(value, listing, keys, header, apikey, showUK) {
        var url = "https://www.google.com/maps"
                    + "?q=" + listing[keys.latitude] + "," + listing[keys.longitude]
                    + "&output=embed";
        return <a href={url} className="fancybox-media fancybox.iframe" target="_blank">{value}</a>
    }
    formatter(value, listing, keys, header, showUK) {
        return (this["formatter_" + header.redfin.replace(/\s/g,"_")]
                || this["formatter_" + (typeof value)]
                || this.formatter_undef)(value, listing, keys, header, this.props.api, showUK)
    }
    render() {
        if (!this.props) return false
        var p = this.props,
            h = p.header,
            value = p.listing[h._id],
            style = {overflow: "hidden", height: 20, whiteSpace: "nowrap"},
            bucket;
            if (p.canRank && h.bucketSize && h.buckets) {
                bucket = h.buckets[Math.floor(value / h.bucketSize) * h.bucketSize]
                if (bucket) _.extend(style, {backgroundColor: bucket[1]})
            }
        return (
            <Col md={1} style={style}>
                {this.formatter(value, p.listing, p.keys, p.header, p.showUK)}
            </Col>
        )
    }
}

class App extends React.Component {
    constructor(props) {  //headers, listings, keys
        super(props)
        var cao = true,
            keys = props.keys,
            dt = keys.last_loaded,
            maxDate = _.chain(props.listings).map(l => l[dt].$date).max().value(),
            [displayable, hidden] = _.partition(props.headers, h => h.show),
            listings = this.updateMath(_.clone(props))

        this.state = {currentActivesOnly: true, canMove: false, canRank: false,
                        headers: displayable, hidden: hidden,
                        maxDate: maxDate, allListings: listings,
                        apikey: props.api}
        this.state.listings =  _.chain(listings)
                                .filter(l => !cao || l[dt].$date == maxDate
                                                && l[keys.status].toLowerCase() == "active")
                                .sortBy(l => this.getListingSortValue(l, this.state.headers, this.state.canRank))
                                .value()
        app.signaller.headersSorted.add(_.bind(this.reorderHeaders, this))
        app.signaller.headerUpdated.add((id, redfin, value) =>
            this.updateState(s => s.headers[id][redfin] = value,
                            () => this.saveHeaderValue(null, redfin, id, value)))
        _.delay(_.bind(this.updateDistances, this), 1000); // wait for google to load?
    }
    toggleRank(force) {
        var state = _.clone(this.state),
            canRank = !state.canRank
        state.canRank = canRank
        state.listings = _.sortBy(state.listings, l => this.getListingSortValue(l, state.headers, canRank))
        this.setState(state)
    }
    toggleUK() {
        this.updateState(s => s.showUK = !s.showUK)
    }
    getListingSortValue(listing, headers, canRank) {
        var res;
        if (!canRank) return _.chain(headers)
                        .first(6)
                        .map(h => listing[h._id])
                        .map(value => /^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value)
                        .value()
                        .join("$")
        res = _.chain(headers)
                .filter(h => h.bucketSize && h.buckets)
                .reduce((ranking, h) => ranking - (parseInt(h.buckets[Math.floor(listing[h._id] / h.bucketSize)
                                            * h.bucketSize] || 0) * parseInt(h.bucketMultiplier || 1)), 0)
                .value()
        console.log("rank", res);
        return res
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

        var [index, listing_id, lat, long, id, distanceTo, headerName] = opts.map.pop()
        if (!index) return

        var request = _.clone(opts.base);
        _.extend(request, {origin: lat + "," + long, destination: distanceTo})
        opts.directionsService.route(request, (response, status) => {
            var duration;
            try {
                duration = parseInt(response.routes[0].legs[0].duration.text) // distance.text, duration.text
           } catch (e) {
                console.log("error getting directions for", listing, e)
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
                console.log("worked!", content)
            }.bind(this))
            .fail(function() {
                console.log("failed", arguments)
            }.bind(this))
    }
    updateMath(content) {
        _.chain(content.headers)
            .filter(f => f.math !== undefined)
            .each(f => {
                var math = f.math,
                    id = f._id
                _.each(content.headers, f => {math = math.replace(new RegExp(f.redfin), "l[" + f._id + "]")})
                _.each(content.listings, l => {
                    try {
                        eval("l[" + id + "]=" + math)
                    } catch (e) {
                        l[id] = "***"
                    }
                })
            })
        return content.listings
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
        this.updateState(s => s.canMove = !s.canMove)
    }
    showHeader(id) {
        this.updateState(s => this.toggleHeaderVisibility(s.hidden, s.headers, id, true),
                () => this.saveHeaderValue(null, "show", id, true))
    }
    hideHeader(id) {
        this.updateState(s => this.toggleHeaderVisibility(s.headers, s.hidden, id, true),
                        () => this.saveHeaderValue(null, "show", id, false))
    }
    saveHeader(header) {
        this.updateState(s => s.headers[_.findIndex(s.headers, h => h._id == header._id)] = header,
                        () => this.saveHeader(header))
    }
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
            state = _.clone(this.state)

        ids.forEach((id, index) => {
            _.find(state.headers, (item) => {return item._id == id}).sequence = index;
        })
        state.headers = _.sortBy(state.headers, "sequence")
        sortNode.sortable("cancel");
        state.listings = _.sortBy(state.listings, l => this.getListingSortValue(l, state.headers, state.canRank))
        this.setState(state);
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
                    data: headers ? _.map(headers, header => [header._id, header[redfin]])
                            : [[id, value]]}
        app.retryAjax(JSON.stringify(data), {api: "/saveheadervalue", type: "post"})
            .done(function(content){
                console.log("saving worked!", data, arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    addNewField() {
        var len = this.state.headers.length,
            state = _.clone(this.state),
            header =  _.extend(_.clone(state.fields[0]), {
                _id: len,
                redfin: "new_" + len,
                sequence: len,
                show: true,
                text: "new_" + len})

        state.headers.push(header)
        _.each(state.listings, l => l.push(""))
        this.setState(newState)

        retryAjax(JSON.stringify(header), {api: "/savenewfield", type: "post"})
            .done(function(content){
                console.log("worked!", arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    }
    render() {
        var listings = _.map(this.state.listings, listing => (
                <Listing
                    canRank={this.state.canRank}
                    showUK={this.state.showUK}
                    api={this.props.api}
                    key={listing[0]}
                    keys={this.props.keys}
                    listing={listing}
                    headers={this.state.headers}/>))
        return (
            <Grid fluid={true}>
                <Header
                    headers={this.state.headers}
                    canMove={this.state.canMove}
                    listings={this.state.listings}
                    showUK={this.state.showUK}
                    save={_.bind(this.saveHeader, this)}
                    hide={_.bind(this.hideHeader, this)}/>
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
                    toggleCurrentActives={_.bind(this.toggleCurrentActives, this)}/>
                <div style={{paddingTop: this.state.canMove * 20 + 68}}/>
                {listings}
            </Grid>
        )
    }
}

class FieldEditor extends React.Component {
    constructor(props) {
        super(props)
        this.state = _.clone(props)
    }
    componentWillReceiveProps(nextProps) {
        this.setState(_.clone(nextProps))
    }
    updateFieldValue(name, event) {
        var buckets = {},
            value = event.target.value;

        if (/^bucket/.test(name)) this.props.update(s => {s.header[name] = value; s.updateRanking = true})
        else this.props.update(s => s.header[name] = value)
        if (name != "bucketSize") return
        if (value == "*") _.each(this.props.values, v => buckets[v] = [0, ""])
        else if (value != "") _.chain(this.props.values)
                                    .map(v => Math.floor(v / value)).uniq()
                                    .map(v => v * value).sortBy()
                                    .each(v => buckets[v] = [0, ""])
        this.props.update(s => s.header["buckets"] = buckets)
    }
    updateBuckets(bucket, event) {
        this.props.update(s => {
            s.header["buckets"][bucket] = [event.target.value, ""]
            var buckets = s.header.buckets,
                min = !buckets ? 0 : _.min(buckets, wc => +wc[0])[0],
                max = !buckets ? 0 : _.max(buckets, wc => +wc[0])[0],
                mult = !max ? 0 : (app.colors.length - 2) / (max - min);
            s.header.buckets = _.mapObject(buckets, data => {
                var wc = typeof data == "number" ? [data, ""] : data,
                color = wc[0] == min ? app.colors[0] :
                    wc[0] && wc[0] == max ? app.colors[app.colors.length-1]
                        : app.colors[Math.floor((wc[0] - min + 1) * mult)]
                return [wc[0], color]
            })
        })
    }
    render() {
        var header = this.state.header,
            id = header._id,
            props = {update: _.bind(this.updateFieldValue, this), header: header};
        return (
            <Modal show={this.state.showModal} onHide={_.bind(this.props.close, this, null)}>
                <Modal.Header closeButton>
                    <Modal.Title>{header.text}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid={true}>
                        <Field title="Text" {...props}/>
                        <Field title="UK multiplier" name="ukMultiplier" {...props}/>
                        <Field title="UK Text" name="ukText" {...props}/>
                        <Field title="Bucket Size" {...props} text="* = use distinct values"/>
                        <Field title="Bucket Multiplier" {...props}/>
                        <Buckets
                            buckets={this.state.header.buckets}
                            updateBuckets={_.bind(this.updateBuckets, this)}/>
                        <Field title="&raquo; Math" name="math" {...props}/>
                        <Field title="&raquo; Distance To" name="distanceTo" {...props}/>
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={_.bind(this.props.close, this, this.state.header)}>
                        Save & Close
                    </Button>
                    <Button onClick={_.bind(this.props.close, this, null)}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

class Buckets extends React.Component {
    render() {
        if (!this.props.buckets) return false
        var buckets = [];
        _.each(this.props.buckets, (wc, bucket) => { // bucket = [weight, color]
            buckets.push(<Col
                            key={"b" + bucket}
                            md={2}
                            style={{backgroundColor: wc[1], height: 26, paddingTop: 3}}>
                            {bucket}
                            </Col>)
            buckets.push(<Col
                            key={"v" + bucket}
                            md={2}>
                            <input
                                type="text"
                                defaultValue={wc[0]}
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

class Field extends React.Component {
    render() {
        if (!this.props) return false;
        var fieldname = this.props.name || (this.props.title.substr(0, 1).toLowerCase()
                        + this.props.title.substr(1).replace(/\s+/g, "")),
            desc = (this.props.text ? <div>{this.props.text}</div> : null)
        return (
            <Row>
                <Col md={3} className="title">{this.props.title}</Col>
                <Col md={9} className="values">
                    <input type="text" defaultValue={this.props.header[fieldname]}
                            onChange={_.bind(this.props.update, null, fieldname)}/>
                    {desc}
                </Col>
            </Row>
        )
    }
}
