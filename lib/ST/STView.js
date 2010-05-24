STObject.subClass('STView', {
    ViewWithContent: function(content)
    {
        var view = STView.create().load();
        view.getElement().append(content);
        return view;
    },
    
    init: function()
    {
        this.initWithElement(ST.customTag('view'));
    },
    
    initWithElement: function(element)
    {
        STObject.prototype.init.call(this);
        
        this.children = ST.A();
        this.header = null;
        this.footer = null;
        this.element = element;
        this.delegate = null;
        this.loaded = false;
        this.rendered = false;
    },
    
    delegate:   ST.$property(),
    element:    ST.$property(null, 'readonly'),
    header:     ST.$property('retain'),
    footer:     ST.$property('retain'),

    destroy: function()
    {
        this.releaseMembers('header', 'footer');
        if (this.element) this.element.remove();
        this.empty()
            ._super();
    },
    
    /**
     * @returns {STView} Current header for this view
     *
     * Creates a new custom view if no header is currently defined.
     */
    getOrCreateHeader: function()
    {
        if (!this.header) {
            var v = STView.createWithElement(ST.customTag('header')).load();
            this.setHeader(v);
            v.release;
        }
        return this.header;
    },
    
    /**
     * @returns {STView} Current footer for this view
     *
     * Creates a new custom view if no footer is currently defined.
     */
    getOrCreateFooter: function()
    {
        if (!this.footer) {
            var v = STView.createWithElement(ST.customTag('footer')).load();
            this.setFooter(v);
            v.release;
        }
        return this.footer;
    },
    
    /**
     * Sets a view as the header for this view. Headers always remain above
     * any content and all child views for a view.
     *
     * @param view {STView} Header view
     */
    setHeader: function(view)
    {
        if (view == this.header) return;
        if (this.header) this.header.release();
        
        this.header = view;
        if (view) {
            view.retain();
            if (this.loaded) {
                this.element.prepend(view.getElement());
            }
        }
    },
    
    setAndReleaseHeader: function(view)
    {
        this.setHeader(view);
        view.release();
    },
    
    /**
     * Sets a view as the footer for this view. Footers always remain below
     * any content and all child views for a view.
     *
     * @param view {STView} Footer view
     */
    setFooter: function(view)
    {
        if (view == this.footer) return;
        if (this.footer) this.footer.release();
        
        this.footer = view;
        if (view) {
            view.retain();
            if (this.loaded) {
                this.element.append(view.getElement());
            }
        }
    },
    
    setAndReleaseFooter: function(view)
    {
        this.setFooter(view);
        view.release();
    },
    
    addChild: function(view)
    {
        view.parent = this;
        this.children.push(view.retain());
        if (this.loaded) {
            if (this.footer) {
                this.footer.element.before(view.getElement());
            } else {
                this.element.append(view.getElement());
            }
        }
    },
    
    addAndReleaseChild: function(view)
    {
        this.addChild(view);
        view.release();
    },
    
    removeChild: function(view)
    {
        if (this.children.has(view)) {
            this.children.remove(view);
            if (this.loaded) {
                this.element[0].removeChild(view.element[0]);
            }
            view.release();
        }
    },
    
    empty: function()
    {
        this.children.each(ST.P('release')).empty();
    },
    
    render: function(element)
    {
        if (this.rendered) {
            ST.error('View rendered twice during load: ' + this);
        }
        //log('View rendered: ' + this);
        this.rendered = true;
    },
    
    load: function()
    {
        if (this.loaded) return;
        
        if (this.delegate && this.delegate.viewWillLoad) {
            this.delegate.viewWillLoad(this);
        }
        
        if (this.header) {
            this.element.append(this.header.getElement());
            if (!this.header.loaded) {
                this.header.load();
            }
        }
        
        this.render(this.element);
        this.loadChildren();
        
        if (this.footer) {
            this.element.append(this.footer.getElement());
            if (!this.footer.loaded) {
                this.footer.load();
            }
        }
        
        this.loaded = true;
        
        if (this.delegate && this.delegate.viewDidLoad) {
            this.delegate.viewDidLoad(this);
        }
        //log('View loaded: ' + this);
    },
    
    loadChildren: function()
    {
        var self = this;
        
        this.children.each(function(child) {
            self.element.append(child.getElement());
            if (!this.loaded) {
                this.load();
            }
        });
    },
    
    unload: function()
    {
        if (!this.loaded) return;
        
        if (this.delegate && this.delegate.viewWillUnload) {
            this.delegate.viewWillUnload(this);
        }
        
        this.element.empty();
        
        this.rendered = false;
        
        this.unloadChildren();
        
        this.loaded = false;
        
        if (this.delegate && this.delegate.viewDidUnload) {
            this.delegate.viewDidUnload(this);
        }
        //log('View unloaded: ' + this);
    },
    
    unloadChildren: function()
    {
        this.children.each(ST.P('unload'));
    },
    
    reload: function()
    {
        if (this.loaded) {
            this.unload();
        }
        this.load();
    },
    
    eachChild: ST.$forward('children', 'each'),
    
    findChild: function(callback)
    {   
        if (this.children.length) {
            for (var i = 0; i < this.children.length; i++) {
                if (callback.call(this.children[i])) return this.children[i];
                var view = this.children[i].findChild(callback);
                if (view) return view;
            }
        }
        
        return null;
    },
    
    scrollTo: function() {
        $.scrollTo(this.element);
    },
    
    showDialog: function(events)
    {
        Dialog.showView(this, events);
    },
    
    stealElement: function()
    {
        var element = this.element;
        this.element = null;
        return element;
    },
    
end:0});