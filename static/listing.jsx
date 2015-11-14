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
    loadHeaders() {
        retryAjax({}, {api: "/getheaders", type: "get"})
            .done(function(data) {
                this.setState({headerItems: data})
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },
    handleSortableUpdate() {
        var newItems = _.clone(this.state.headerItems, true),
            node = $(ReactDOM.findDOMNode(this)),
            ids = node.sortable("toArray", {attribute: "data-id"});

        ids.forEach((id, index) => {
            _.find(newItems, (item) => {return item.id == id}).position = index;
        });

        node.sortable("cancel");
        this.setState({headerItems: newItems});
    },
    getInitialState() {
        return {headerItems: {}}
    },
    componentDidMount() {
        this.loadHeaders()
        $(ReactDOM.findDOMNode(this)).sortable({
            cursor: "move",
            items: 'div',
            update: this.handleSortableUpdate
            // placeholder: "" - classNames
            // handle .sorthandle
        });
    },
    render() {
        var items = _.chain(this.state.headerItems) //  {fld: {position:, key: fld, ...}, ...}
                        .sortBy((data) => {return data.position}) // returns array
                        .map((data) => {
                            return (<HeaderItem key={data.key} data={data}/>)
                        }).value()
        return (<div className="row header">{items}</div>);
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

var Listings = React.createClass({
    loadListings() {
        retryAjax({}, {api: "/getlistings", type: "get"})
            .done(function(data){
                this.setState({listings: data})
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },
    getInitialState() {
        return {listings: [{}]};
    },
    componentDidMount() {
        this.loadListings()
    },
    render() {
        var houses = this.state.listings.map(function(listing) {
                    return (<House key={listing._id} items={listing} />)
                });
        return (<div id="houses">{houses}</div>);
    }
});

var House = React.createClass({
    getInitialState: function() {
        return {items: {}};
    },
    render: function() {
        var houseItems =  _.map(this.props.items, function(value, key) {
                return (<HouseItem key={key} name={key} value={value} />)
            })
        return (<div className="row">{houseItems}</div>);
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
    render: function() {
        return (
            <div className="container-fluid">
                <Header key="0" header={[]} />
                <Listings key="1" listing={[{}]} />
            </div>
        )
    }
})

ReactDOM.render(
  <App />,
  document.getElementById('content')
);
