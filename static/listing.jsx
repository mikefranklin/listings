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
        return (<Row className="header">{items}</Row>);
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
            <Col md={2} data-position={data.sequence} data-id={data._id}>
                <i className="fa fa-bars move"></i>
                <i className="fa fa-bolt opts" onClick={this.handleClick}></i>
                {data.text}
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
            <Col md={2} className={this.props.name} >
                {this.formatter(this.props.value, this.header)}
            </Col>
        );
    }
});

var FieldModal = React.createClass({
    getInitialState() {return {title: "", hide: "0"}},
    render() {
        return (
          <div className="fade fieldModel">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Title>{this.state.title}</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                  <ButtonGroup>
                    <Button>Left</Button>
                    <Button>Middle</Button>
                    <Button>Right</Button>
                  </ButtonGroup>
              </Modal.Body>

              <Modal.Footer>
                <Button data-dismiss="modal">Close</Button>
                <Button bsStyle="primary">Save</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </div>
        );




        return (
                    <div className="btn-group" data-toggle="buttons">
                        <label className={"btn " + this.props.hide ? "active btn-danger" : "btn-default"} >
                            <input type="radio" name="show" value="0"/>Hide
                        </label>
                        <label className={"btn " + this.props.hide ? "btn-default" : "btn-success active"}>
                            <input type="radio" name="show" value="1"/>Show
                        </label>
                    </div>
        )
    }
})

/*
headers = [{ data = [1, 2, ...], "_id": 0, "redfin": "_id", sequence": 0, "fieldname": "field0",
        "text": "_id","show": true} ...]
*/
var App = React.createClass({
    createSortable(ref, dataName) {
        var sortNode = $(ReactDOM.findDOMNode(ref))
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: 'div',
            handle: ".move",
            update: _.bind(this.handleSortableUpdate, null, sortNode, dataName)
        });
    },
    handleSortableUpdate(sortNode, dataName) {
        var ids = sortNode.sortable("toArray", {attribute: "data-id"}),
            newItems = _.clone(this.state[dataName], true),
            newState ={}

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
                <FieldModal />
            </Grid>
        )
    }
})

_.each("Grid,Row,Col,Modal".split(","),
    function(m) {window[m] = ReactBootstrap[m]})

ReactDOM.render(
  <App />,
  document.getElementById('content')
);
