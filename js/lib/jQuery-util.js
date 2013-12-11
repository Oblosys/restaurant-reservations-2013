/**
 * 
 */

if (typeof jQuery != 'undefined') {
  // Extend jQuery objects with a method to scroll a minimum amount to make the object visible.
  // Adapted from http://stackoverflow.com/questions/4217962/scroll-to-an-element-using-jquery
  // to work for arbitrary elements rather than document.
  // NOTE scrolling div needs: position: relative;
  // TODO: figure out a way to do this without
  jQuery.fn.scrollMinimal = function(target, smooth) {
    //console.log(target);
    var tTop = $(target).position().top;
    var tHeight = target.outerHeight(true);
    var sTop = this.scrollTop();
    var sHeight = this.height();
    //console.log('minscroll s:'+sTop+'x'+sHeight+' t:'+tTop+'x'+tHeight);
    
    if (tTop < 0) {
      if (smooth) {
        $(this).animate({'scrollTop': sTop + tTop},'fast','linear');
      } else {
        $(this).scrollTop(sTop + tTop);
      }
    } else if (tTop + tHeight > sHeight) {
      //util.log('need to scroll: '+(tTop + tHeight-sHeight));
      if (smooth) {
        $(this).animate({'scrollTop': sTop + tTop + tHeight-sHeight},'fast','linear');
      } else {
        $(this).scrollTop(sTop +    tTop + tHeight-sHeight);
      }
    }
  };
 }
