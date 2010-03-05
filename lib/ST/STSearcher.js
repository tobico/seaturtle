STObject.subClass('STSearcher', {
    
    init: function()
    {
        this._super();
        
        this.delegate = null;
        this.async = false;
    },
    
    delegate: ST.$property(),
    
    hilight: function(string, term) {
        if (term && term.push) {
            return string.replace(new RegExp(ST.A(term).map(ST.reEscape).join('|'), 'gi'), '<span class="match">$&</span>');
        } else if (term !== undefined) {
            return string.replace(new RegExp(ST.reEscape(term), 'gi'), '<span class="match">$&</span>');
        } else {
            return '<span class="match">' + string + '</span>';
        }
    },
    
end
:0});