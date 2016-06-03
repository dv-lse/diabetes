//
// Slider widget
//

import 'slider.css!'

function slider() {
  let value
  let scale = d3.scale.linear()
    .range([0,100])
    .domain([0,100])
    .clamp(true)
  let format = (v) => '' + v

  let dispatch = d3.dispatch('start', 'change', 'done')

  function widget(elem) {
    let width = scale.domain()[1] - scale.domain()[0]
    value = value || (domain[0] + domain[1]) / 2
    elem.each(function() {
      let e = d3.select(this)
        .style('width', width + 'px')
      let readout = e.append('div')
        .attr('class', 'slider-readout')
        .html(format(value))
      let tray = e.append('div')
        .attr('class', 'slider-tray')
      let handle = e.append('div')
        .attr('class', 'slider-handle')
      handle.append('div')
        .attr('class', 'slider-handle-icon')
      e.call(d3.behavior.drag()
        .on('dragstart', () => {
          dispatch.start()
          d3.event.sourceEvent.preventDefault()
        })
        .on('drag', () => {
          dispatch.change(scale(d3.mouse(tray.node())[0]))
        })
        .on('dragend', () => {
          dispatch.done()
        }))
      dispatch.on('change.slider', (d) => {
        value = d
        update()
      })
      update()

      function update() {
        let offset = 0
        if(scale.invert) { offset = scale.invert(value) }
        else if(scale.invertExtent) {
          offset = scale.invertExtent(value).reduce( (a,b) => a + b ) / 2
        }

        handle.style('left', offset + "px")
        readout.html(format(value))
      }
    })
  }

  widget.scale = function() {
    if(!arguments.length) return scale
    scale = arguments[0].copy()
    if(scale.clamp) { scale.clamp(true) }
    return widget
  }

  widget.value = function() {
    if(!arguments.length) return value
    value = arguments[0]
    return widget
  }

  widget.format = function() {
    if(!arguments.length) return format
    format = arguments[0]
    return widget
  }

  d3.rebind(widget, dispatch, 'on')

  return widget
}

export default slider
