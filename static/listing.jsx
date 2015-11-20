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
        return {headers: {}}
    },
    componentDidMount() {
        this.props.createSortable(this, "data")
    },
    render() {
        var items = _.map(this.props.data, (header) => {
                            return (
                                <HeaderItem key={header._id} data={header}/>
                            )
                        })
        return (
            <Row className="header">
                {items}
            </Row>
        );
    }
})

var HeaderItem = React.createClass({
    getInitialState() {
        return {data: {}}
    },
    handleClick() {
        console.log(this)
    },
    render() { //data-position={data.position}
        var data = this.props.data
        return (
            <Col md={2} data-position={data.sequence} data-id={data._id} className="item">
                <div className="btn-xsmall move" bsSize="xsmall">
                    <i className="fa fa-bars"></i>
                </div>
                <FieldEditor data={data}/>
            </Col>
        )
    }
})

var House = React.createClass({
    getInitialState() {
        return {data: {}, row: 0};
    },
    render() {
        var items = _.map(this.props.data, (header, index) => {
            var value = header.data[index]
            return (<HouseItem key={header._id + ":" + index} name={header.fieldname} value={value} header = {header}/>)
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
        return {name: "", value: "", header: {}};
    },
    render() {
        return (
            <Col md={2} className={this.props.name} style={{overflow: "hidden", height: 20}} >
                {this.formatter(this.props.value, this.header)}
            </Col>
        );
    }
});

var StyleButton = React.createClass({
    getInitialState() {
        return {on: false, text: "", onStyle: "default"}
    },
    render() {
        return (this.props.on
            ? <Button bsStyle={this.props.onStyle} bsSize="xsmall" active>{this.props.text}</Button>
            : <Button bsStyle="default" bsSize="xsmall">{this.props.text}</Button>
        )
    }
})

var FieldEditor = React.createClass({
    getInitialState() {
        return { showOverlay: false, data: {}};
    },
    toggle() {
        this.setState({ showOverlay: !this.state.showOverlay });
    },
    render() {
        var data = this.props.data;
        return (
            <div style={{ position: 'relative', float: 'left'}}>
                <Button ref="target" onClick={this.toggle} bsSize="xsmall">
                    {data.text}
                </Button>

                <Overlay show={this.state.showOverlay}  onHide={() => this.toggle}
                    placement="bottom" container={this} className="field-editor"
                    target={() => ReactDOM.findDOMNode(this.refs.target)}>
                    <div className="field-editor">
                        <ButtonGroup>
                            <StyleButton on={data.hide} text="Hide" onStyle="danger" />
                            <StyleButton on={!data.hide} text="Show" onStyle="success" />
                        </ButtonGroup>
                    </div>
                </Overlay>
          </div>
        );
    }
});

var App = React.createClass({
    createSortable(ref, dataName) {
        var sortNode = $(ReactDOM.findDOMNode(ref))
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: '.item',
            handle: ".move",
            update: _.bind(this.handleSortableUpdate, null, sortNode, dataName)
        });
    },
    handleSortableUpdate(sortNode, dataName) {
        var ids = sortNode.sortable("toArray", {attribute: "data-id"}),
            newItems = _.clone(this.state[dataName], true),
            newState ={};

        ids.forEach((id, index) => {
            _.find(newItems, (item) => {return item._id == id}).sequence = index;
        });

        newState[dataName] = _.sortBy(newItems, "sequence")
        sortNode.sortable("cancel");
        this.setState(newState);
    },
    loadData() {
        retryAjax({}, {api: "/getalldata", type: "get"})
            .done(function(content){
                this.setState(content) // {data: [headers]}
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },
    getInitialState() {
        return {data: {}}
    },
    componentDidMount() {
        this.loadData()
    },
    render() {
        var houseIds = _.find(this.state.data, function(h) {return h.redfin = "_id"}),
            houses = "";

        if (houseIds) {
            houses = houseIds.data.map(function(id, row) {
                    return (<House key={id} data={this.state.data} row={row} />)
                }.bind(this));
        }

        return (
            <Grid fluid={true}>
                <Header data={this.state.data} createSortable={this.createSortable}/>
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
