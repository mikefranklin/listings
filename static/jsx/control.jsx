class Control extends React.Component {
    // signal(name) {
    //     app.signaller[name].dispatch(..._.toArray(arguments).slice(1))
    // }
    constructor(props) {
        super(props)
        this.state = {  canRank: false,
                        showUk: false,
                        canMove: false,
                        currentActivesOnly: true,
                        hidden: Immutable.List()}
        app.on.headersUpdated.add(this.updateHeaders, this)
    }
    updateHeaders(visible, hidden) {
        this.setState({hidden: hidden})
    }
    render() {
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
