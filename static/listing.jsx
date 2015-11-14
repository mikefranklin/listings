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

var Listings = React.createClass({
    loadListings: function() {
        retryAjax({}, {api: "/getlistings", type: "get"})
            .done(function(data){
                this.setState({listings: data})
            }.bind(this))
            .fail(function() {
                console.log(arguments)
            }.bind(this))
    },

    getInitialState: function() {
        return {listings: [{}]};
    },
    componentDidMount: function() {
        this.loadListings()
    },

    render: function() {
        var houses = this.state.listings.map(function(listing) {
                    return (<House key={listing._id} items={listing} />)
                });
        return (<ul className="listings">{houses}</ul>);
    }
});


var House = React.createClass({
    getInitialState: function() {
        return {items: {}};
    },
    render: function() {
        var houseItems =  _.map(this.props.items, function(value, key) {
                if (key != "_id") {
                    return (<Item key={key} name={key} value={value} />)
                }
            })
        return (<li className="house">{houseItems}</li>);
    }
});

var Item = React.createClass({
  getInitialState: function() {
    return {name: "", value: ""};
  },
  render: function() {
      var name = this.props.name,
          value = this.props.value

      if (typeof value == "object" && value["$date"]) value = value["$date"]

    return (
      <div className={name} >
        {value}
      </div>
    );
  }
});

let data = [
    {_id: 1, price: "200000", state: "MD"},
    {_id: 2, price: "175000", state: "MD"}
]

ReactDOM.render(
  <Listings listings={data} />,
  document.getElementById('content')
);
