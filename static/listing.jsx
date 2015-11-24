"use babel";

var signaller = {
  headerUpdated: new signals.Signal(),
  moveToggled: new signals.Signal(),
};

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
        return {fields: {}, canMove: false}
    },
    componentDidUpdate() {
        this.props.createSortable(this)
    },
    render() {
        var items = _.map(this.props.fields, (field) => {
                            return (<HeaderItem key={field._id} field={field} canMove={this.props.canMove}/>)
                        })
        return (<Row className="header">{items}</Row>);
    }
})

var HeaderItem = React.createClass({
    getInitialState() {
        return {field: {}, showModal: false}
    },
    openFieldEditor() {
        this.setState({showModal: true})
    },
    render() { // <FieldEditor field={field}/>
        var field = this.props.field,
            cols = this.props.field.columns ? this.props.field.columns : 2,
            move = !this.props.canMove
                ? ""
                : (<div className="btn-xsmall move" bsSize="xsmall">
                        <i className="fa fa-bars"></i>
                    </div>);

        return (
            <Col md={cols} data-position={field.sequence} data-id={field._id} className="item">
                {move}
                <div className="edit" onClick={this.openFieldEditor}>{field.text}</div>
                <FieldEditor showModal={this.state.showModal} field={this.props.field}/>
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
        var cols = this.props.field.columns ? this.props.field.columns : 2;
        return (
            <Col md={cols} className={this.props.name} style={{overflow: "hidden", height: 20}} >
                {this.formatter(this.props.value, this.props.field)}
            </Col>
        );
    }
});

var Control = React.createClass({
    getInitialState() {
        return {hidden: {}}
    },
    signal(name) {
        signaller[name].dispatch(..._.toArray(arguments).slice(1))
    },
    render() {
        var hidden = _.map(this.props.hidden, (field, index) => {
                var click = _.bind(this.signal, this, "headerUpdated", field._id, "show", true)
                return <MenuItem key={field._id} onClick={click}>{field.text}</MenuItem>
            }),
            style = this.props.canMove ? "success" : "default"
        return (
            <Row className="control">
                <Col md={1} mdOffset={10}>
                    <Button bsStyle={style} onClick={_.bind(this.signal, this, "moveToggled")}>
                        Toggle move
                    </Button>
                </Col>
                <Col md={1}>
                    <DropdownButton title="Unhide" id="unhide" pullRight>
                    {hidden}
                    </DropdownButton>
                </Col>
            </Row>);
    }
})

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
                console.log("worked!", data, arguments)
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
    headerUpdated(fieldId, headerName, value, ...args) { // hideField, setWidth
        var fields = _.clone(this.state.fields),
            index = _.findIndex(fields, (f) => {return f._id == fieldId});

        fields[index][headerName] = value
        this.updateDB(headerName, fields[index])
        this.setState(fields)
    },
    getInitialState() {
        signaller.headerUpdated.add(this.headerUpdated);
        signaller.moveToggled.add(this.moveToggled)
        return {fields: {}, listings: [], redfin: null, canMove: false}
    },
    moveToggled() {
        this.setState({canMove: !this.state.canMove })
    },
    componentDidMount() {
        this.loadData()
    },
    render() {
        var houses = "",
            redfinId = this.state.redfin,
            [displayable, hidden] = _.partition(this.state.fields, (field) => {return field.show})
        if (displayable.length) {
            houses = _.map(this.state.listings, function(listing) {
                return (<House key={listing[redfinId]} listing={listing} fields={displayable}/> )
            }.bind(this));
        }
        return (
            <Grid fluid={true}>
                <Header fields={displayable} createSortable={this.createSortable} canMove={this.state.canMove}/>
                <Control hidden={hidden} canMove={this.state.canMove}/>
                {houses}
            </Grid>
        )
    }
})

var FieldEditor = React.createClass ({
    getInitialState() {
        return {showModal: false, field: {}}
    },
    close() {
        this.setState({showModal: false});
    },
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
    },
    signal(name, close, ...args) {
        if (close) this.close()
        console.log(name, close, ...args)
        //signaller[name].dispatch(...args)
    },
    render() {
        var field = this.state.field,
            fieldId = field._id,
            updateClose = [this.signal, this, "headerUpdated", true, fieldId];
        return (
            <Modal show={this.state.showModal} onHide={this.close}>
              <Modal.Header closeButton>
                <Modal.Title>{field.text}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <table>
                      <tbody>
                          <tr>
                              <td className="title">Visibility</td>
                              <td className="values">
                                  <Button bsSize="small" onClick={_.bind(...updateClose, 'show', false)}>
                                      Hide
                                  </Button>
                              </td>
                          </tr>
                          <tr>
                              <td className="title">Columns</td>
                              <td className="values">
                                  <Button bsSize="small" onClick={_.bind(...updateClose, "columns", 1)}>One</Button>
                                  <Button bsSize="small" onClick={_.bind(...updateClose, "columns", 2)}>Two</Button>
                              </td>
                          </tr>
                          <tr>
                            <td className="title">Text</td>
                            <td className="values">
                                <input type="text" style={{width: "100%"}}
                                    onBlur={_.bind(...updateClose, "text", this.value)}/>
                            </td>
                          </tr>
                      </tbody>
                  </table>
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={this.close}>Close</Button>
              </Modal.Footer>
            </Modal>
        )
    }
})

_.each("Grid,Row,Col,Modal,ButtonGroup,Button,Overlay,DropdownButton,MenuItem".split(","),
    function(m) {window[m] = ReactBootstrap[m]})

ReactDOM.render(
  <App />,
  document.getElementById('content')
);

ReactDOM.render(
    <FieldEditor/>,
    document.getElementById("fieldeditor")
);
