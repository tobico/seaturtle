STView.subClass('STProgressBar', {
    initWithTitleSteps: function(title, steps) {
        this.init();
        this.title = title;
        this.steps = steps;
        this.progress = 0;
        this.percent = null;
    },
    
    title:  ST.$property,
    steps:  ST.$property,
    
    render: function()
    {   
        var percent = Math.round(this.progress * 100 / this.steps) + '%';
        if (percent != this.percent) {
            this.percent = percent;
            this.element.empty();
            this.element.append(ST.pTag(this.title));
            this.element.append(ST.pTag(
                ST.spanTag(percent).css('width', percent)
            ).addClass('progressBar'));
        }
    },
    
    reset: function()
    {
        this.progress = 0;
        if (this.loaded) this.render();
    },
    
    step: function()
    {
        this.progress += 1;
        if (this.loaded) this.render();
    },
end
:0});