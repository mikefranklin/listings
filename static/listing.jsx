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
        this.props.createSortable(this, "headers")
    },
    render() {
        var items = _.map(this.props.headers, (header) => {
                            return (
                                <HeaderItem key={header._id} data={header}/>
                            )
                        })
        return (<div className="row header">{items}</div>);
    }
})

var HeaderItem = React.createClass({
    getInitialState() {
        return {data: {}}
    },
    render() { //data-position={data.position}
        var data = this.props.data
        return (
            <div data-position={data.sequence} data-id={data._id} className="col-md-2">{data.text}</div>
        )
    }
})

var House = React.createClass({
    getInitialState() {
        return {items: {}, headers: {}};
    },
    render() {
        var items = _.map(this.props.headers, (header, index) => {
            var value = this.props.items[index]
            return (<HouseItem key={header._id} name={header.fieldname} value={value} />)
        })
        return (<div className="row house">{items}</div>);
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
    formatter(value) {
        return (this["formatter_" + (typeof value)] || this.formatter_undef)(value)
    },
    getInitialState() {
        return {name: "", value: ""};
    },
    render() {
        return (
            <div className={this.props.name + " col-md-2"} >
                {this.formatter(this.props.value)}
            </div>
        );
    }
});

/*
headers = [{ "_id": 0, "redfin": "_id", sequence": 0, "fieldname": "field0","text": "_id","show": true} ...]

*/
var App = React.createClass({
    createSortable(ref, dataName) {
        var sortNode = $(ReactDOM.findDOMNode(ref))
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: 'div',
            update: _.bind(this.handleSortableUpdate, null, sortNode, dataName)
        });
    },
    handleSortableUpdate(sortNode, dataName) {
        var ids = sortNode.sortable("toArray", {attribute: "data-id"}),
            newItems = _.clone(this.state[dataName], true),
            newState ={}

        ids.forEach((id, index) => {
            _.find(newItems, (item) => {return item.id == id}).position = index;
        });

        newState[dataName] = _.sortBy(newItems, "position") // resequence data. or add data to header in python//fields
        sortNode.sortable("cancel");
        this.setState(newState);
    },
    loadData() {
        retryAjax({}, {api: "/getalldata", type: "get"})
            .done(function(data){
                this.setState({listings: data.listings, headers: data.headers})
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },
    getInitialState() {
        return {listings: [], headers: []}
    },
    componentDidMount() {
        this.loadData()
    },
    render() {
        var idIndex = _.findIndex(this.state.headers, function(h) {return h.redfin = "_id"}),
            houses = this.state.listings.map(function(listing) {
                    return (
                        <House key={listing[idIndex]} items={listing} headers={this.state.headers} />
                    )
                }.bind(this));
        return (
            <div className="container-fluid">
                <Header headers={this.state.headers} createSortable={this.createSortable}/>
                {houses}
            </div>
        )
    }
})

ReactDOM.render(
  <App />,
  document.getElementById('content')
);
