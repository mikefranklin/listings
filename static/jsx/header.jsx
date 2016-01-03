class Header extends React.Component {
    constructor(props) {
        super(props)
        app.on.headersUpdated.add(this.updateHeaders, this)
        app.on.rankUpdated.add(this.updateRank, this)
    }
    updateRank(newRank) {
        this.setState({canRank: newRank})
    }
    updateHeaders(s) {
        this.setState({ headers: s.get("vheaders"),
                        hidden: s.get("hheaders"),
                        canMove: s.get("canMove"),
                        canRank: s.get("canRank"),
                        showUk: s.get("showUk")})
    }
    render() {
        if (!this.state) return false
        var text = (h) => h.get(this.state.showUk && h.get("ukText") ? "ukText" : "text"),
            items = this.state.headers.map(header => (
                        <HeaderItem
                            text={text(header)}
                            canMove={this.state.canMove}
                            key={header.get("_id")}
                            header={header}/>))
         return (<Row className="header">{items}</Row>);
    }
}

class HeaderItem extends React.Component {
    render() {
        var header = this.props.header,
            move = (<div className="btn-xsmall move" bsSize="xsmall">
                        <i className="fa fa-bars"></i>
                    </div>)
//onClick={_.bind(this.openFieldEditor, this)}
//onClick={_.bind(this.props.hide, null, header.get("_id"))}
// <FieldEditor
//     uniques={this.props.uniques}
//     showModal={this.state.showModal}
//     header={this.state.header}
//     setState={_.bind(this.setState, this)}
//     close={_.bind(this.closeFieldEditor, this)}/>
        return (
            <Col md={1} data-id={header.get("_id")} className="item">
                {this.props.canMove ? move : null}
                <div className="edit">
                    {this.props.text}
                </div>
                <div className="togglevis" >
                    <i className="fa fa-bolt"/>
                </div>
            </Col>
        )
    }
}



//
// class Header extends React.Component {
//     componentDidUpdate() {
//         var sortNode = $(ReactDOM.findDOMNode(this))
//         sortNode = sortNode.sortable({
//             cursor: "move",
//             items: ".item",
//             handle: ".move",
//             update:_.bind(app.signaller.headersSorted.dispatch, null, sortNode)
//         })
//     }
//     componentWillReceiveProps(nextProps) {
//         this.setState(nextProps)
//     }
//     render() {
//         var items = this.props.headers.map(header =>
//                 (<HeaderItem
//                     showUK={this.props.showUK}
//                     save={this.props.save}
//                     hide={this.props.hide}
//                     canMove={this.props.canMove}
//                     key={header.get("_id")}
//                     uniques={this.props.uniques.get(header.get("_id"))}
//                     header={header}/>))
//         return (<Row className="header">{items}</Row>);
//     }
// }
//
// class HeaderItem extends React.Component {
//     constructor(props) {
//         super(props)
//         this.state = props
//     }
//     componentWillReceiveProps(nextProps) {
//         this.setState(nextProps)
//     }
//     openFieldEditor() {
//         this.setState({showModal: true})
//     }
//     closeFieldEditor(header, isNewNotes) {
//         var omit = Immutable.Set(["showModal", "updateRanking", "showType"])
//
//         this.setState({showModal: false, showType: isNewNotes ? "notes" : null})
//         if (header) {
//             if (isNewNotes) header = header.set("notes", true);
//             this.props.save(header.filter((v, key) => !omit.has(key)), this.state.updateRanking)
//         }
//     }
//     render() {
//         var header = this.state.header,
//             move = (<div className="btn-xsmall move" bsSize="xsmall">
//                         <i className="fa fa-bars"></i>
//                     </div>)
//         return (
//             <Col md={1} data-id={header.get("_id")} className="item">
//                 {this.props.canMove ? move : null}
//                 <div className="edit" onClick={_.bind(this.openFieldEditor, this)}>
//                     {this.props.showUK && header.get("ukText") ? header.get("ukText") : header.get("text")}
//                 </div>
//                 <div className="togglevis" onClick={_.bind(this.props.hide, null, header.get("_id"))}>
//                     <i className="fa fa-bolt"/>
//                 </div>
//                 <FieldEditor
//                     uniques={this.props.uniques}
//                     showModal={this.state.showModal}
//                     header={this.state.header}
//                     setState={_.bind(this.setState, this)}
//                     close={_.bind(this.closeFieldEditor, this)}/>
//             </Col>
//         )
//     }
// }
