"use babel";

function retryAjax(params, options) {
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

var Header = React.createClass({
    getInitialState() {
        return {fields: {}, hideField: {}}
    },
    componentDidMount() {
        this.props.createSortable(this)
    },
    render() {
        var items = _.map(this.props.fields, (field) => {
                            return (<HeaderItem key={field._id} field={field} hideField={this.props.hideField}/>)
                        })
        return (<Row className="header">{items}</Row>);
    }
})

var HeaderItem = React.createClass({
    getInitialState() {
        return {field: {}, hideField: {}}
    },
    render() {
        var field = this.props.field,
            hf = this.props.hideField ? _.bind(this.props.hideField, this, field._id) : {}
        return (
            <Col md={2} data-position={field.sequence} data-id={field._id} className="item">
                <div className="btn-xsmall move" bsSize="xsmall">
                    <i className="fa fa-bars"></i>
                </div>
                <FieldEditor field={field} hideField={hf}/>
            </Col>
        )
    }
})

var House = React.createClass({
    getInitialState() {
        return {listing: {}, fields: {}};
    },
    render() {
        var items = _.map(this.props.fields, (field) => {
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
    formatter_object(obj) {
        var f = _.find([["$date", "date"]], (pair) => {return obj[pair[0]] !== undefined})
        return f ? this["formatter_" + f[1]](obj) : this.formatter_undef()
    },
    formatter(value, header) {
        return (this["formatter_" + (typeof value)] || this.formatter_undef)(value)
    },
    getInitialState() {
        return {name: "", value: "", field: {}};
    },
    render() {
        return (
            <Col md={2} className={this.props.name} style={{overflow: "hidden", height: 20}} >
                {this.formatter(this.props.value, this.props.field)}
            </Col>
        );
    }
});

var FieldEditor = React.createClass({
    getInitialState() {
        return { showOverlay: false, field: {}, hideField: {}};
    },
    toggle() {
        this.setState({ showOverlay: !this.state.showOverlay });
    },
    render() {
        var field = this.props.field;
        return (
            <div className="field-editor-container">
                <Button ref="target" onClick={this.toggle} bsSize="xsmall">
                    {field.text}
                </Button>
                <Overlay show={this.state.showOverlay}  onHide={() => this.toggle}
                    placement="bottom" container={this} className="field-editor"
                    target={() => ReactDOM.findDOMNode(this.refs.target)}>
                    <div className="field-editor">
                        <Button bsSize="xsmall" onClick={this.props.hideField}>Hide</Button>
                    </div>
                </Overlay>
          </div>
        );
    }
});

var App = React.createClass({
    createSortable(ref) {
        var sortNode = $(ReactDOM.findDOMNode(ref))
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: '.item',
            handle: ".move",
            update: _.bind(this.handleSortableUpdate, null, sortNode)
        });
    },
    handleSortableUpdate(sortNode) {
        var ids = sortNode.sortable("toArray", {attribute: "data-id"}),
            fields = _.clone(this.state.fields, true);

        ids.forEach((id, index) => {
            _.find(fields, (item) => {return item._id == id}).sequence = index;
        });

        sortNode.sortable("cancel");
        this.setState({fields: _.sortBy(fields, "sequence")});
        this.updateDB("sequence")
    },
    updateDB(fieldname, field) {
        var data = {"fieldname": fieldname}

        if (field) data.data = [[field._id, field[fieldname]]]
        else {
            data.data = _.map(this.state.fields, (field) => {
                return [field._id, field[fieldname]]
                })
        }

        retryAjax(JSON.stringify(data), {api: "/saveheaderdata", type: "post"})
            .done(function(content){
                console.log("worked!", arguments)
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },
    loadData() {
        retryAjax({}, {api: "/getalldata", type: "get"})
            .done(function(content) {
                content.redfin = _.find(content.fields, (f) => {return f.redfin == "_id"})._id;
                this.setState(content) // {fields: [{field info}], listsings: [[data, ...], ...]}
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },
    getInitialState() {
        return {fields: {}, listings: [], redfin: null}
    },
    componentDidMount() {
        this.loadData()
    },
    hideField(fieldId) {
        var fields = _.clone(this.state.fields),
            index = _.findIndex(fields, (f) => {return f._id == fieldId});

        fields[index].show = false;
        this.updateDB("show", fields[index])
        this.setState(fields)
    },
    render() {
        var houses = "",
            redfinId = this.state.redfin,
            displayable = _.filter(this.state.fields, (field) => {return field.show})
        if (displayable.length) {
            houses = _.map(this.state.listings, function(listing) {
                return (<House key={listing[redfinId]} listing={listing} fields={displayable}/> )
            }.bind(this));
        }
        return (
            <Grid fluid={true}>
                <Header fields={displayable} createSortable={this.createSortable} hideField={this.hideField}/>
                {houses}
            </Grid>
        )
    }
})

_.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay".split(","),
    function(m) {window[m] = ReactBootstrap[m]})

ReactDOM.render(
  <App />,
  document.getElementById('content')
);
