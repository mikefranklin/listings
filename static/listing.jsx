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
        return this
    }
    loadAndRenderData() {
        this.retryAjax({}, {api: "/getalldata", type: "get"})
            .done(function(content) { // headers, listings, keys, api
                $.getScript("https://maps.googleapis.com/maps/api/js?key=" + content.api)
                ReactDOM.render(
                  <App {...content}/>,
                  document.getElementById('content')
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
                            return (<HeaderItem
                                        save={this.props.save}
                                        hide={this.props.hide}
                                        canMove={this.props.canMove}
                                        key={header._id}
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
        if (header) this.props.save(_.omit(this.state.header, "showModal"))
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
                    {header.text}
                </div>
                <div className="togglevis" onClick={_.bind(this.props.hide, null, header._id)}>
                    <i className="fa fa-bolt"/>
                </div>
                <FieldEditor
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
        var moveStyle = this.props.canMove ? "success" : "default",
            curStyle = this.props.currentActivesOnly ? "success" : "default",
            hidden = _.map(this.props.hidden, (header) => {
                return (<MenuItem
                            key={header._id}
                            onSelect={_.bind(this.props.showHeader, null, header._id)}>
                            {header.text}
                        </MenuItem>)
            });
        return (
            <Row className="control">
                <Col md={5} mdOffset={7}>
                    <span className="pull-right">
                        <Button bsStyle="info" onClick={_.bind(this.signal, this, "newField")}>
                            New Field
                        </Button>
                        <Button bsStyle={curStyle} onClick={this.props.toggleCurrentActives}>
                            Current Actives
                        </Button>
                        <Button bsStyle={moveStyle} onClick={this.props.toggleMove}>
                            Toggle move
                        </Button>
                        <DropdownButton pullRight title="Unhide" id="unhide">
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
    formatter_string(s) { return s }
    formatter_number(s) { return String(s)}
    formatter_object(obj) {
        var f = _.find([["$date", "date"]], (pair) => {return obj[pair[0]] !== undefined})
        return f ? this["formatter_" + f[1]](obj) : this.formatter_undef()
    }
    formatter_url(url) {
        return <a href={url} target="_blank">Redfin</a>
    }
    // formatter_lot_size(value) {return String(100000 + parseInt(value || 0)).substr(1) }
    formatter_new_35(value, listing, keys, header) {
        var url = "https://www.google.com/maps/dir/"
                    + listing[keys.latitude] + "," + listing[keys.longitude] + "/"
                    + header.distanceTo;
        return <a href={url} target="_blank">{value}</a>
    }
    formatter(value, listing, keys, header) {
        return (this["formatter_" + header.redfin.replace(/\s/g,"_")]
                || this["formatter_" + (typeof value)]
                || this.formatter_undef)(value, listing, keys, header)
    }
    render() {
        if (!this.props) return false
        var value = this.props.listing[this.props.header._id]

        return (
            <Col md={1} style={{overflow: "hidden", height: 20, whiteSpace: "nowrap"}} >
                {this.formatter(value, this.props.listing, this.props.keys, this.props.header)}
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

        this.state = {currentActivesOnly: true, canMove: false,
                        headers: displayable, hidden: hidden,
                        maxDate: maxDate, allListings: listings}
        this.state.listings =  _.chain(listings)
                                .filter(l => !cao || l[dt].$date == maxDate
                                                && l[keys.status].toLowerCase() == "active")
                                .sortBy(l => this.getListingSortValue(l, this.state.headers))
                                .value()
        app.signaller.headersSorted.add(_.bind(this.reorderHeaders, this))
        app.signaller.headerUpdated.add((id, redfin, value) =>
            this.updateState(s => s.headers[id][redfin] = value,
                            () => this.saveHeaderValue(null, redfin, id, value)))
        _.delay(_.bind(this.updateDistances, this), 1000); // wait for google to load?
    }
    getListingSortValue(listing, headers) {
        return _.chain(headers)
                .first(6)
                .map(h => listing[h._id])
                .map(value => /^\d+$/.test(value) ? String(1000000 + parseInt(value)).substr(1) : value)
                .value()
                .join("$")
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
                            .sortBy(l => this.getListingSortValue(l, state.headers))
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
        state.listings = _.sortBy(state.listings, l => this.getListingSortValue(l, state.headers))
        this.setState(state);
        this.saveHeaderValue(state.headers, "sequence")
    }
    saveHeader(header) {
        app.retryAjax(JSON.stringify(header), {api: "/saveheader", type: "post"})
            .done(function(content) {
                console.log("saving header worked!", header, arguments)
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
                    key={listing[0]}
                    keys={this.props.keys}
                    listing={listing}
                    headers={this.state.headers}/>))
        return (
            <Grid fluid={true}>
                <Header
                    headers={this.state.headers}
                    canMove={this.state.canMove}
                    save={_.bind(this.saveHeader, this)}
                    hide={_.bind(this.hideHeader, this)}/>
                <Control
                    hidden={this.state.hidden}
                    canMove={this.state.canMove}
                    showHeader={_.bind(this.showHeader, this)}
                    currentActivesOnly={this.state.currentActivesOnly}
                    toggleMove={_.bind(this.toggleMove, this)}
                    toggleCurrentActives={_.bind(this.toggleCurrentActives, this)}/>
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
        this.props.update(s => s.header[name] = event.target.value)
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
                        <Field title="Bucket Size" {...props} text="* = use distinct values"/>
                        <Field title="&raquo; Math" name="math" {...props}/>
                        <Field title="&raquo; Distance To" name="distanceTo" {...props}/>
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={_.bind(this.props.close, this, this.state.header)}>Save & Close</Button>
                    <Button onClick={_.bind(this.props.close, this, null)}>Close</Button>
                </Modal.Footer>
            </Modal>
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
                <Col md={8} className="values">
                    <input type="text" defaultValue={this.props.header[fieldname]}
                            onChange={_.bind(this.props.update, null, fieldname)}/>
                    {desc}
                </Col>
            </Row>
        )
    }
}


/*

var App = React.createClass({


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
,
*/
