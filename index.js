import 'styles.css!'

import d3 from 'd3'

import slider from './slider'

const MARGINS = { top: 30, right: 250, bottom: 50, left: 100 }
const BLOOD_SUGAR_SEL_EXTENT = [ 6, 14 ]             // units: HbA1c %
const BODY_WEIGHT_SEL_EXTENT = [ 75, 120 ]           // units: kg

// state

let width, height

let blood_sugar_extent, body_weight_extent

let active = {
  blood_sugar: false,
  body_weight: false,
  hypoglycaemia: false
}

let state = {
  blood_sugar: 8.17,
  body_weight: 90
}

let g, axis_x, axis_y
let scatter_x, scatter_y, bar_y
let color

let data

function drug_f(d) { return d['Drug'] }
function blood_sugar_f(d) { return +d['Blood sugar'] + state.blood_sugar }
function body_weight_f(d) { return +d['Body weight'] + state.body_weight }
function hypoglycaemia_f(d) { return +d['Hypoglycaemia'] }

let blood_sugar_format = (d) => d3.round(d, 2) + '%'
let body_weight_format = (d) => d3.round(d, 1) + 'kg'

function install() {

  let blood_sugar_slider = slider()
    .width(250)
    .domain(BLOOD_SUGAR_SEL_EXTENT)
    .format(blood_sugar_format)
    .value(state.blood_sugar)
    .on('change', (val) => {
      state.blood_sugar = val
      update(0)
    })
  let body_weight_slider = slider()
    .width(250)
    .domain(BODY_WEIGHT_SEL_EXTENT)
    .format(body_weight_format)
    .value(state.body_weight)
    .on('change', (val) => {
      state.body_weight = val
      update(0)
    })

  d3.select('.blood_sugar .slider')
    .call(blood_sugar_slider)
  d3.select('.body_weight .slider')
    .call(body_weight_slider)

  g = d3.select('#viz').append('g')
      .attr('transform', 'translate(' + [ MARGINS.left, MARGINS.top ] + ')')

  scatter_x = d3.scale.linear()
  scatter_y = d3.scale.linear()
  bar_y = d3.scale.linear()
    .range([0,20])
    .domain(data, hypoglycaemia_f)

  axis_x = d3.svg.axis()
    .orient('bottom')
  axis_y = d3.svg.axis()
    .orient('left')

  g.append('g')
    .attr('class', 'axis x')
    .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'end')
      .attr('dy', '-.6em')
      .text('Body weight (kg)')

  g.append('g')
    .attr('class', 'axis y')
    .append('text')
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('dy', '1.3em')
      .attr('text-anchor', 'end')
      .text('Blood sugar (%)')

  color = d3.scale.category10()

  let drug = g.selectAll('.drug')
      .data(data)
    .enter().append('g')
      .attr('class', 'drug')
  let rule = drug.append('g')
    .attr('class', 'rule')
  rule.append('path')
  rule.append('text')
    .attr('class', 'x')
    .attr('dx', 5)
    .attr('dy', '1em')
  rule.append('text')
    .attr('class', 'y')
    .attr('dx', 5)
    .attr('dy', '1em')

  drug.append('circle')
    .attr('fill', (d) => color(drug_f(d)))
    .attr('r', 5)
  drug.append('text')
    .attr('class', 'label')
    .attr('dx', 8)
    .attr('dy', '.3em')
    .text(drug_f)
}

function type(vals) {
  data = vals
  data.forEach( (d) => {
    d['Blood sugar'] = +d['Blood sugar']
    d['Body weight'] = +d['Body weight']
    d['Hypoglycaemia'] = +d['Hypoglycaemia']
  })

  blood_sugar_extent = vector_add(d3.extent(data, (d) => d['Blood sugar']), BLOOD_SUGAR_SEL_EXTENT)
  body_weight_extent = vector_add(d3.extent(data, (d) => d['Body weight']), BODY_WEIGHT_SEL_EXTENT)

  function vector_add(a, b) {
    return d3.zip(a, b).map( (d) => d[0] + d[1])
  }
}

function calibrate() {
  width = window.innerWidth - MARGINS.left - MARGINS.right
  height = window.innerHeight - MARGINS.top - MARGINS.bottom
}

function update(dur=500) {
  d3.select('#viz')
    .attr('width', width + MARGINS.left + MARGINS.right)
    .attr('height', height + MARGINS.top + MARGINS.bottom)

  d3.keys(active).map(update_selector_state)

  scatter_x.range([0, active.body_weight ? width : 0])
    .domain(body_weight_extent)
  axis_x.scale(scatter_x)

  scatter_y.range([height, active.blood_sugar ? 0 : height])
    .domain(blood_sugar_extent)
  axis_y.scale(scatter_y)

  let trans = g.transition()
    .duration(dur)

  trans.select('.axis.x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(axis_x)
    .style('opacity', active.body_weight ? 1 : 0)
    .select('.label')
      .attr('transform', 'translate(' + scatter_x.range()[1] + ',0)')

  trans.select('.axis.y')
    .call(axis_y)
    .style('opacity', active.blood_sugar ? 1 : 0)
    .select('.label')
      .attr('transform', 'translate(0,' + scatter_y.range()[1] + ')rotate(-90)')

  let drug = g.selectAll('.drug')
    .data(data)

  drug.exit().remove()

  let num_active = d3.values(active).reduce( (count,cur) => cur ? count+1 : count)
  let overlaps = active.body_weight && !active.blood_sugar
  trans = drug.transition()
      .duration(dur)
  trans.attr('transform', (d,i) => {
      return 'translate(' + [tx(d), ty(d)] + ')rotate(' + (overlaps ? -90 : 0) + ')'
    })
  trans.select('.label')
    .attr('opacity', num_active ? 1 : 0)
  trans.select('.rule path')
    .attr('d', (d) => 'M' + -tx(d) + ' 0L0 0L0 ' + (height - ty(d)))
  trans.select('.rule .x')
    .attr('transform', (d) => 'translate(' + -tx(d) + ')')
    .text( (d) => blood_sugar_format(blood_sugar_f(d)) )
  trans.select('.rule .y')
    .attr('transform', (d) => 'translate(0, ' + (height - ty(d)) + ')rotate(-90)')
    .text((d) => body_weight_format(body_weight_f(d)))

  function tx(d) { return active.body_weight ? scatter_x(body_weight_f(d)) : 0 }
  function ty(d) { return active.blood_sugar ? scatter_y(blood_sugar_f(d)) : height }
}

// bootstrap
d3.csv('./data.csv', (err, data) => {
  if(err) throw err
  type(data)
  calibrate()
  install()
  update(0)
})

function update_selector_state(name) {
  d3.select('.selector.' + name)
    .classed('disabled', !active[name])
    .select('input')
      .attr('value', state[name])
}

d3.selectAll('.selector label').on('click', function() {
  let elem = d3.select(this.parentNode)
  d3.keys(active).forEach( (key) => {
    if(elem.classed(key)) { active[key] = !active[key] }
  })
  update()
})

d3.selectAll('.selector input').on('change', function() {
  let elem = d3.select(this.parentNode)
  d3.keys(active).forEach( (key) => {
    if(elem.classed(key)) { state[key] = +this.value }
  })
  update()
})

window.onresize = () => {
  calibrate()
  update()
}
