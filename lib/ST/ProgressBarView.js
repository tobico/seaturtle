import { makeClass } from '../util/make-class'
import { View } from './View'

export const ProgressBarView = makeClass(View, (def) => {
  def.initializer('withTitleSteps', function(title, steps) {
    this.init();
    this._title = title;
    this._steps = steps;
    this._progress = 0;
    return this._percent = null;
  });
    
  def.property('title');
  def.property('steps');
  
  def.method('render', function() {
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

  def.method('reset', function() {
    this._progress = 0;
    if (this._loaded) { return this.render(); }
  });
  
  def.method('step', function() {
    this._progress += 1;
    if (this._loaded) { return this.render(); }
  });
});
