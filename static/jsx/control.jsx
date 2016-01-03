class Control extends React.Component {
    // signal(name) {
    //     app.signaller[name].dispatch(..._.toArray(arguments).slice(1))
    // }
    constructor(props) {
        super(props)
        app.on.headersUpdated.add(this.updateHeaders, this)
        app.on.rankUpdated.add(this.updateRank, this)
    }
    updateRank(newRank) {
        this.setState({canRank: newRank})
    }
    updateHeaders(s) {
        this.setState({ hidden: s.get("hheaders"),
                        canRank: s.get("canRank"),
                        canMove: s.get("canMove"),
                        showUk: s.get("showUk"),
                        currentActivesOnly: s.get("currentActivesOnly")})
    }
    render() {
        if (!this.state) return false
        var offOn = ["fa fa-circle-o", "fa fa-check"],
            hidden = this.state.hidden.map(header => (
                        <MenuItem
                            key={header.get("_id")}>
                            {header.get("text")}
                        </MenuItem>)
            );
/*
onSelect={_.bind(this.props.showHeader, null, header.get("_id"))}>
onClick={this.props.toggleRank}>
onClick={this.props.toggleUK}>
onClick={this.props.toggleMove}>
onClick={this.props.toggleCurrentActives}>
onClick={this.props.addNewField}>

*/
            return (
                <Navbar fixedTop>
                    <Navbar.Header>
                        <Navbar.Brand>Listings</Navbar.Brand>
                    </Navbar.Header>
                    <Nav>
                        <NavItem
                            onClick={app.on.canRankClicked.dispatch}
                            eventKey={1}>
                            <i className={offOn[+this.state.canRank]}></i> Rank
                        </NavItem>
                        <NavItem
                            eventKey={2}>
                            <i className={offOn[+this.state.showUK]}></i> UK units
                        </NavItem>
                        <NavItem
                            eventKey={3}>
                            <i className={offOn[+!!this.state.canMove]}></i> Change Order
                        </NavItem>
                        <NavItem
                            eventKey={4}>
                            <i className={offOn[+this.state.currentActivesOnly]}></i>Actives only
                        </NavItem>
                        {!hidden.size ? null: (
                            <NavDropdown eventKey={5} title="Unhide" id="basic-nav-dropdown">
                                {hidden}
                            </NavDropdown>)
                        }
                    </Nav>
                    <Nav pullRight>
                        <NavItem
                            eventKey={5}>
                            Add new field
                        </NavItem>
                    </Nav>
                </Navbar>
            )
    }
}
