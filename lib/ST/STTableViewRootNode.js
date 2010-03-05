STTableViewNode.subClass('STTableViewRootNode', {
    init: function()
    {
        this.initWithElement(ST.tbodyTag());
        this.tableView = false;
        this.cells = {};
    },
    
    renderRow: function()
    {
        //This space deliberately left blank
    },

    arrangeChildren: function()
    {
        var node = this;
        
        for (var i = 0; i < this.children.length; i++) {
            node.element[0].appendChild(this.children[i].element[0]);
        }
    },
    
end
:0});