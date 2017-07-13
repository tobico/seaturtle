/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/View

ST.class('ProgressBarView', 'View', function() {
  this.initializer('withTitleSteps', function(title, steps) {
    this.init();
    this._title = title;
    this._steps = steps;
    this._progress = 0;
    return this._percent = null;
  });
    
  this.property('title');
  this.property('steps');
  
  this.method('render', function() {
    const percent = Math.round((this._progress * 100) / this._steps) + '%';
    if (percent !== this._percent) {
      this._percent = percent;
      const html = [];
      html.push('<p>');
      html.push(this.title());
      html.push('</p><p class="progressBar"><span style="width: ');
      html.push(percent);
      html.push(';">');
      html.push(percent);
      html.push('</span></p>');
      return this.element().html(html.join(''));
    }
  });

  this.method('reset', function() {
    this._progress = 0;
    if (this._loaded) { return this.render(); }
  });
  
  return this.method('step', function() {
    this._progress += 1;
    if (this._loaded) { return this.render(); }
  });
});