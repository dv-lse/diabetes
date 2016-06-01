//
// Slider widget
//

import 'slider.css!'

function slider() {
  let value

  let width = 100
  let domain = [0,100]
  let format = (v) => '' + v

  let dispatch = d3.dispatch('start', 'change', 'done')
  let slider_x = d3.scale.linear()
    .clamp(true)

  function widget(elem) {
    value = value || (domain[0] + domain[1]) / 2
    slider_x.range([0,width])
      .domain(domain)
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
//          dispatch.change(slider_x.invert(d3.mouse(tray.node())[0]))
          d3.event.sourceEvent.preventDefault()
        })
        .on('drag', () => {
          dispatch.change(slider_x.invert(d3.mouse(tray.node())[0]))
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
        handle.style('left', slider_x(value) + "px")
        readout.html(format(value))
      }
    })
  }

  widget.width = function() {
    if(!arguments.length) return width
    width = arguments[0]
    return widget
  }

  widget.domain = function() {
    if(!arguments.length) return domain
    domain = arguments[0]
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
