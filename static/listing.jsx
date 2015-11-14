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
        this.props.createSortable(this)
    },
    render() {
        var items = _.chain(this.props.headers) //  [{position:, key: fld, ...}, ...]
                        .map((data) => {
                            return (<HeaderItem key={data.key} data={data}/>)
                        }).value()
        return (<div ref="header" className="row header">{items}</div>);
    }
})

var HeaderItem = React.createClass({
    getInitialState() {
        return {data: {}}
    },
    render() { //data-position={data.position}
        var data = this.props.data;
        return (<div data-position={data.position} data-id={data.id} className="col-md-2">{data.key}</div>)
    }
})

var House = React.createClass({
    getInitialState() {
        return {items: {}, headers: {}}; // { fld: {id, position, key, ... etc}, ... }
    },
    render() {
        var items = _.map(this.props.headers, (item) => {
            var value = this.props.items[item.key] || ""
            return (<HouseItem key={item.key} name={item.key} value={value} />)
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
        return f ? this["formatter_" + f[1]](obj) : this.formatter.undef()
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

var App = React.createClass({
    createSortable(ref) {
        var sortNode = $(ReactDOM.findDOMNode(ref))
        sortNode = sortNode.sortable({ // handle, placeholder(classname)
            cursor: "move",
            items: 'div',
            update: _.bind(this.handleSortableUpdate, null, sortNode)
        });
    },
    handleSortableUpdate(sortNode) {
        var newItems = _.clone(this.state.headers, true),
            ids = sortNode.sortable("toArray", {attribute: "data-id"});

        ids.forEach((id, index) => {
            _.find(newItems, (item) => {return item.id == id}).position = index;
        });

        sortNode.sortable("cancel");
        this.setState({headers: _.sortBy(newItems, "position")});
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
        var houses = this.state.listings.map(function(listing) {
                    return (
                        <House key={listing._id} items={listing} headers={this.state.headers} />
                    )
                }.bind(this));
        return (
            <div className="container-fluid">
                <Header headers={this.state.headers} createSortable = {this.createSortable}/>
                {houses}
            </div>
        )
    }
})

ReactDOM.render(
  <App />,
  document.getElementById('content')
);
