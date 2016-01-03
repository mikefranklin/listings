
class FieldEditor extends React.Component {
    constructor(props) {
        super(props)
        this.state = props
    }
    componentWillReceiveProps(nextProps) {
        this.setState(nextProps)
    }
    updateFieldValue(name, event) {
        var buckets = {},
            value = event.target.value;
        if (/^bucket/.test(name)) this.props.setState({header: this.state.header.set(name, value), updateRanking: true})
        else this.props.setState({header: this.state.header.set(name, value)})
        if (name != "bucketSize") return
        if (value == "*") this.props.uniques.keySeq().map(v => buckets[v] = [0, ""])
        else if (value != "") this.props.uniques.keySeq()
                                    .map(v => Math.floor(v / value)).toSet() // make unique
                                    .map(v => v * value).sort()
                                    .forEach(v => buckets[v] = [0, ""])
        this.props.setState({header: this.state.header.set("buckets", Immutable.fromJS(buckets))})
    }
    updateBuckets(bucket, event) {
        var buckets = this.state.header.get("buckets").set(String(bucket), Immutable.List([event.target.value, ""])),
            min = !buckets.size ? 0 : buckets.minBy(wc => +wc.get(0)).get(0),
            max = !buckets.size ? 0 : buckets.maxBy(wc => +wc.get(0)).get(0),
            mult = !max ? 0 : (app.colors.length - 2) / (max - min);
        buckets = buckets.map(wc => {
            var color = wc.get(0) == min ? app.colors[0] :
                wc.get(0) && wc.get(0) == max ? app.colors[app.colors.length - 1]
                    : app.colors[Math.floor((wc.get(0) - min + 1) * mult)]
            return wc.set(1, color)
        })
        this.setState({header: this.state.header.set("buckets", buckets)})
    }
    showType(type) {
        this.setState({showType: type})
    }
    close() {
        console.log("FE/Close", this.state.header.toJS());
        this.props.close(this.state.header, this.state.showTypes == "notes")
    }
    render() {
        var header = this.state.header,
            id = header.get("_id"),
            props = {update: _.bind(this.updateFieldValue, this), header: header},
            text = Immutable.List("Math,Distance to,Toggle icons,Notes".split(",")),
            fields= text.map(t => t.substr(0,1).toLowerCase()
                                    + t.substr(1).replace(/ (.)/g, ($0, $1) => $1.toUpperCase())),
            type = fields.find(n => header.get(n)),
            isType = t => type == t || this.state.showType == t;
        return (
            <Modal show={this.state.showModal} onHide={_.bind(this.props.close, this, null)}>
                <Modal.Header closeButton>
                    <Modal.Title>{header.get("text")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Grid fluid={true}>
                        <Field title="Text" {...props}/>
                        <Field title="UK multiplier" name="ukMultiplier" {...props}/>
                        <Field title="UK Text" name="ukText" {...props}/>
                        <Field title="Bucket Size" {...props} text="* = use distinct values"/>
                        <Field title="Bucket Multiplier" {...props}/>
                        <Buckets
                            buckets={this.state.header.get("buckets")}
                            updateBuckets={_.bind(this.updateBuckets, this)}/>
                        <FieldType
                            showType={_.bind(this.showType, this)}
                            header={header}
                            text={text}
                            fields={fields}
                            type={type}/>
                        {!isType("math") ? ""
                            : <Field title="&raquo; Math" name="math" {...props}/>}
                        {!isType("distanceTo") ? ""
                            : <Field title="&raquo; Distance To" name="distanceTo" {...props}/>}
                        {!isType("toggleIcons") ? ""
                            : <Field title="&raquo; Toggle icons" name="toggleIcons" {...props} text="FA icons, without 'fa-'"/>}
                    </Grid>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={_.bind(this.close, this)}>
                        Save & Close
                    </Button>
                    <Button onClick={_.bind(this.props.close, this, null)}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

class Buckets extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.buckets !== nextProps.buckets
    }
    render() {
        if (!this.props) return false
        var buckets = [];
        Immutable.Map(this.props.buckets) // handles for undefined buckets
            .map((wc, bucket) => [bucket, wc.get(0), wc.get(1)])
            .sortBy(e => +e[0])
            .forEach(bwc => {
                var [bucket, weight, color] = bwc
                buckets.push(<Col
                            key={"b" + bucket}
                            md={2}
                            style={{backgroundColor: color, height: 26, paddingTop: 3}}>
                            {bucket}
                            </Col>)
                buckets.push(<Col
                            key={"v" + bucket}
                            md={2}>
                            <input
                                type="text"
                                defaultValue={weight}
                                onChange={_.bind(this.props.updateBuckets, null, bucket)}/>
                        </Col>)})
        return (
            <Row>
                <Col md={3} className="title">Bucket values</Col>
                <Col md={9} className="values">
                    <Grid fluid={true}>
                        {buckets}
                    </Grid>
                </Col>
            </Row>
        )
    }
}

class FieldType extends React.Component { //check, fa-circle-o
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.type != nextProps.type
    }
    render() {
        var h = this.props.header,
            type = this.props.type,
            text = this.props.text,
            fields = this.props.fields,
            offOn = ["fa fa-circle-o", "fa fa-check"],
            btns = text.map((t, i) => (  <Button
                                            key={i}
                                            bsSize="xsmall"
                                            style={{marginRight: 5}}
                                            onClick={_.bind(this.props.showType, null, fields.get(i))}>
                                            {t}
                                        </Button>))
        return (
            <Row>
                <Col md={3} className="title">Type</Col>
                <Col md={9} className="values" style={{marginTop: 5}}>
                    {type ? text.get(fields.findIndex(f => f == type)) : btns}
                </Col>
            </Row>
        )
    }
}

class Field extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        var fn = this.props.name || (this.props.title.substr(0, 1).toLowerCase()
                        + this.props.title.substr(1).replace(/\s+/g, ""))
        return this.props.title != nextProps.title ||
                this.props.header.get(fn) !== nextProps.header.get(fn)
    }
    render() {
        if (!this.props) return false;
        var fieldname = this.props.name || (this.props.title.substr(0, 1).toLowerCase()
                        + this.props.title.substr(1).replace(/\s+/g, "")),
            desc = (this.props.text ? <div>{this.props.text}</div> : null)
        return (
            <Row>
                <Col md={3} className="title">{this.props.title}</Col>
                <Col md={9} className="values">
                    <input type="text" defaultValue={this.props.header.get(fieldname)}
                            onChange={_.bind(this.props.update, null, fieldname)}/>
                    {desc}
                </Col>
            </Row>
        )
    }
}
