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
            moveToggled: new signals.Signal(),
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
                <Col md={1} mdOffset={8}>
                    <Button bsStyle="info" onClick={_.bind(this.signal, this, "newField")}>
                        New Field
                    </Button>
                </Col>
                <Col md={1}>
                    <Button bsStyle={curStyle} onClick={_.bind(this.signal, this, "currentActivesSelected")}>
                        Current Active
                    </Button>
                </Col>
                <Col md={1}>
                    <Button bsStyle={moveStyle} onClick={_.bind(this.signal, this, "moveToggled")}>
                        Toggle move
                    </Button>
                </Col>
                <Col md={1}>
                    <DropdownButton pullRight title="Unhide" id="unhide">
                    {hidden}
                    </DropdownButton>
                </Col>
            </Row>)
    }
}

class App extends React.Component {
    constructor(props) {  //headers, listings, keys
        super(props)
        var cao = true,
            keys = props.keys,
            dt = keys.last_loaded,
            maxDate = _.chain(props.listings).map(l => l[dt].$date).max().value(),
            [displayable, hidden] = _.partition(props.headers, h => h.show);

        this.state = {currentActivesOnly: cao, canMove: false,
                        headers: displayable, hidden: hidden}
        this.state.listings = _.chain(props.listings)
                                .filter(l => !cao || l[dt].$date == maxDate
                                                && l[keys.status].toLowerCase() == "active")
                                .sortBy(l => _.map(this.state.headers, h => l[h._id]).join("$"))
                                .value()
        app.signaller.moveToggled.add(() => this.updateState(s => s.canMove = !s.canMove))
        app.signaller.headersSorted.add(_.bind(this.reorderHeaders, this))
        app.signaller.headerUpdated.add((id, redfin, value) =>
            this.updateState(s => s.headers[id][redfin] = value,
                            () => this.saveHeaderValue(null, redfin, id, value)))

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
    render() {
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
                    currentActivesOnly={this.state.currentActivesOnly}/>
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
                        <Field title="&raquo; Math" {...props}/>
                        <Field title="&raquo; Distance To" {...props}/>
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
        var fieldname = (this.props.title.substr(0, 1).toLowerCase()
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
var signaller = {
  headerUpdated: new signals.Signal(),
  moveToggled: new signals.Signal(),
  currentsSelected: new signals.Signal(),
  newField: new signals.Signal()
};





var House = React.createClass({
    getInitialState() {
        return {listing: {}, fields: {}};
    },
    render() {
        var items = _.map(this.props.fields, field => {
            return (
                <HouseItem key={field._id} name={field.fieldname}
                    value={this.props.listing[field._id]} field = {field}/>
            )
        })
        return (<Row className="house">{items}</Row>);
    }
});

var HouseItem = React.createClass({
    formatter_undef() { return "~undefined~"},
    formatter_date(obj) { return new Date(obj.$date).toLocaleString('en-US')},
    formatter_string(s) { return s },
    formatter_number(s) { return String(s)},
    formatter_object(obj) {
        var f = _.find([["$date", "date"]], (pair) => {return obj[pair[0]] !== undefined})
        return f ? this["formatter_" + f[1]](obj) : this.formatter_undef()
    },
    formatter_url(url) {
        return <a href={url} target="_blank">Redfin</a>
    },
    formatter(value, header) {
        return (this["formatter_" + header.text]
                || this["formatter_" + (typeof value)]
                || this.formatter_undef)(value)
    },
    getInitialState() {
        return {name: "", value: "", field: {}};
    },
    render() {
        var cols = this.props.field.columns ? this.props.field.columns : 2;
        return (
            <Col md={cols} className={this.props.name} style={{overflow: "hidden", height: 20}} >
                {this.formatter(this.props.value, this.props.field)}
            </Col>
        );
    }
});



var App = React.createClass({
    updateListingDB(id, fieldname, value) {
        var data = {id: id, fieldname: fieldname, value: value}
        retryAjax(JSON.stringify(data), {api: "savelistingdata", type: "post"})
            .done(function(content) {
                console.log("worked!", content)
            }.bind(this))
            .fail(function() {
                console.log("failed", arguments)
            }.bind(this))
    },
    updateSomeDistances(opts) {
        var listings = _.chain(opts.listings)
                        .filter(l => !l[opts.fieldId])
                        .first(opts.count)
                        .value();
        if (!listings.length) return

       _.each(listings, listing => {
            var request = _.clone(opts.base);
            request.origin = listing[opts.lat] + "," + listing[opts.long]
            opts.directionsService.route(request, (response, status) => {
                try {
                    var duration = response.routes[0].legs[0].duration // distance.text, duration.text
                    listing[opts.fieldId] = parseInt(duration.text)
                    this.setState(opts.state)
                    //this.updateListingDB(listing[opts.state.redfin], headerName, parseInt(duration.text))
               } catch (e) {
                    console.log("error getting directions for", listing, e)
                    listing[opts.fieldId] = "00"

                }
                console.log(listing[opts.fieldId])
            })
        })

        _.delay(this.updateSomeDistances, opts.wait, opts)
    },

    updateDistanceTo(fieldId, location) {
        var state = _.clone(this.state)

        this.updateSomeDistances({
            base: {destination: location, travelMode: google.maps.TravelMode.WALKING},
            directionsService: new google.maps.DirectionsService(),
            fieldId: fieldId,
            state: state,
            field: state.fields[fieldId],
            lat: this.getFieldPos("latitude"),
            long: this.getFieldPos("longitude"),
            listings: state.listings,
            count: 2,
            wait: 1500})
        console.log(state) // should defer updating state/db for a second?)

    },
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
    updateMath(content) {
        _.chain(content.fields)
            .filter(f => f.math !== undefined)
            .each(f => {
                var math = f.math,
                    id = f._id
                _.each(content.fields, f => {math = math.replace(new RegExp(f.redfin), "l[" + f._id + "]")})
                _.each(content.listings, l => {
                    try {
                        eval("l[" + id + "]=" + math)
                    } catch (e) {
                        l[id] = "***"
                    }
                })
            })
        console.log(content)
    },
    headerUpdated(fieldId, headerName, value, ...args) { // hideField, setWidth
        var fields = _.clone(this.state.fields),
            index = _.findIndex(fields, (f) => {return f._id == fieldId});

        fields[index][headerName] = value
        this.updateDB(headerName, fields[index])
        this.setState(fields)
        if (typeof args[0] == "function") args[0]()
    },
    addNewField() {
        var len = this.state.fields.length,
            newState = _.clone(this.state),
            field =  _.extend(_.clone(this.state.fields[0]), {
                _id: len,
                redfin: "new_" + len,
                fieldname: "new_" + len,
                sequence: len,
                show: true,
                text: "new_" + len})

        newState.fields.push(field)
        _.each(newState.listings, l => l.push(""))
        this.setState(newState)

        retryAjax(JSON.stringify(field), {api: "/savenewfield", type: "post"})
            .done(function(content){
                console.log("worked!", arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))

    },
    getInitialState() {
        signaller.headerUpdated.add(this.headerUpdated);
        signaller.moveToggled.add(this.moveToggled)
        signaller.currentsSelected.add(this.currentsSelected)
        signaller.newField.add(this.addNewField)
        return {fields: {}, listings: [], redfin: null, canMove: false, currentsOnly: false}
    },
    moveToggled() {
        this.setState({canMove: !this.state.canMove })
    },
    currentsSelected() {
        this.setState({currentsOnly: !this.state.currentsOnly})
    },
    getFieldPos(name) {
        return _.find(this.state.fields, f => f.text== name)._id
    },
    render() {
        if (!this.state.listings.length) return false
        var redfinId = this.state.redfin,
            [displayable, hidden] = _.partition(this.state.fields, field => field.show),
            dtPos = this.getFieldPos("last_loaded"),
            stPos = this.getFieldPos("status"),
            maxDate = _.chain(this.state.listings).map(l => l[dtPos].$date).max().value(),
            houses = _.chain(this.state.listings)
                        .filter(l => !this.state.currentsOnly || l[dtPos].$date == maxDate && l[stPos].toLowerCase() == "active")
                        .sortBy(l => _.map(displayable,  f => l[f._id]).join("$"))
                        .map(function(l) {
                            return (<House key={l[redfinId]} listing={l} fields={displayable}/> )
                            }.bind(this))
                        .value();

        return (
            <Grid fluid={true}>
                <Header
                    fields={displayable}
                    createSortable={this.createSortable}
                    canMove={this.state.canMove}
                    updateDT={this.updateDistanceTo}/>
                <Control hidden={hidden} canMove={this.state.canMove} currentsOnly={this.state.currentsOnly}/>
                {houses}
            </Grid>
        )
    }
})


*/
