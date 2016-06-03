import 'styles.css!'

import d3 from 'd3'

import slider from './slider'

const MARGINS = { top: 30, right: 340, bottom: 100, left: 30 }
const SLIDER_WIDTH = 250

const BLOOD_SUGAR_SEL_EXTENT = [ 6, 14 ]             // units: HbA1c %
const BODY_WEIGHT_SEL_EXTENT = [ 75, 120 ]           // units: kg

const HYPOGLYCAEMIA_SLIDER_POINTS = [ 6, 12, 24, 60, 120, 180, 240, 300, 480, 600, 720, 840 ]          // units: months
const DRUG_CIRCLE_RADIUS = 20
const INCIDENT_CIRCLE_RADIUS = DRUG_CIRCLE_RADIUS / 8

const NO_AXIS_RADIUS = 200

// state

let width, height

let blood_sugar_extent, body_weight_extent

let active = {
  blood_sugar: false,
  body_weight: false,
  hypoglycaemia: false
}

let state = {
  blood_sugar: 8.27,
  body_weight: 90,
  hypoglycaemia: 6
}

let g, axis_x, axis_y, rule_x, rule_y
let scatter_x, scatter_y
let color

let data

function drug_f(d) { return d['Drug'] }
function blood_sugar_f(d) { return +d['Blood sugar'] + state.blood_sugar }
function body_weight_f(d) { return +d['Body weight'] + state.body_weight }
function hypoglycaemia_f(d) { return +d['Hypoglycaemia'] / 6 * state.hypoglycaemia }

let percent = d3.format('0.2%')
let blood_sugar_format = (d) => percent(d/100)
let round4 = d3.format('0.4r')
let body_weight_format = (d) => round4(d) + ' kg'
let suture = (data, labels, delim) => d3.zip(data, labels).filter((d) => d[0]).reduce((a,b) => a.concat(b)).join(' ')
let hypoglycaemia_format = (d) => suture([Math.floor(d/12), d%12], [' years', ' months'])

function install() {

  let blood_sugar_slider = slider()
    .scale(d3.scale.linear()
      .domain([0,SLIDER_WIDTH])
      .range(BLOOD_SUGAR_SEL_EXTENT))
    .value(state.blood_sugar)
    .format(blood_sugar_format)
    .on('start', () => { update(500, false) })
    .on('change', (val) => {
      state.blood_sugar = val
      update(0, false)
    })
    .on('done', () => { update(500, true) })
  let body_weight_slider = slider()
    .scale(d3.scale.linear()
      .domain([0,SLIDER_WIDTH])
      .range(BODY_WEIGHT_SEL_EXTENT))
    .format(body_weight_format)
    .value(state.body_weight)
    .on('start', () => { update(500, false) })
    .on('change', (val) => {
      state.body_weight = val
      update(0, false)
    })
    .on('done', () => { update(500, true) })
  let hypoglycaemia_slider = slider()
    .scale(d3.scale.quantize()
      .domain([0,SLIDER_WIDTH])
      .range(HYPOGLYCAEMIA_SLIDER_POINTS))
    .format(hypoglycaemia_format)
    .value(state.hypoglycaemia)
    .on('start', () => { update(500, true) })
    .on('change', (val) => {
      state.hypoglycaemia = val
      update(0, true)
    })
    .on('done', () => { update(500, true) })

  d3.select('.blood_sugar .slider')
    .call(blood_sugar_slider)
  d3.select('.body_weight .slider')
    .call(body_weight_slider)
  d3.select('.hypoglycaemia .slider')
    .call(hypoglycaemia_slider)

  g = d3.select('#viz').append('g')
      .attr('transform', 'translate(' + [ MARGINS.left, MARGINS.top ] + ')')

  scatter_x = d3.scale.linear()
  scatter_y = d3.scale.linear()

  axis_x = d3.svg.axis()
    .orient('bottom')
    .ticks(5)
  axis_y = d3.svg.axis()
    .orient('right')
    .ticks(5)

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
      .attr('dy', '-.6em')
      .attr('text-anchor', 'end')
      .text('Blood sugar (%)')

  let rule = g.append('g')
    .attr('id', 'rule')
    .attr('opacity', 0)
  rule_x = rule.append('g')
    .attr('class', 'x')
  rule_x.append('line')
    .attr('x1', 0)
    .attr('x2', width)
  rule_x.append('text')
    .attr('dx', -25)
    .attr('dy', '1.3em')
    .attr('text-anchor', 'end')
  rule_y = rule.append('g')
    .attr('class', 'y')
  rule_y.append('line')
    .attr('y1', 0)
    .attr('y2', height)
  rule_y.append('text')
    .attr('dx', 25)
    .attr('dy', '1.3em')
    .attr('text-anchor', 'begin')

  color = d3.scale.category10()

  let drug = g.selectAll('.drug')
      .data(data)
    .enter().append('g')
      .attr('class', 'drug')

  drug.append('circle')
    .attr('fill', (d) => color(drug_f(d)))
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
    .attr('r', DRUG_CIRCLE_RADIUS)

  let risk = drug.append('g')
    .attr('class', 'risk')
    .attr('opacity', 0)
  risk.append('circle')
    .attr('class', 'background')
    .attr('stroke', 'none')
    .attr('fill', 'white')
    .attr('r', DRUG_CIRCLE_RADIUS - 5)
  risk.append('text')
    .attr('class', 'label_risk')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.3em')

  drug.append('text')
    .attr('class', 'label')
    .attr('x', DRUG_CIRCLE_RADIUS + 2)
    .attr('y', DRUG_CIRCLE_RADIUS + 2)
    .text(drug_f)

  drug.on('mouseover', function(d,i) {

    // TODO.  need a reasonable solution when in single-axis mode
    if(! (active.blood_sugar && active.body_weight)) return

    let rule = d3.select('#rule')
    let x = tx(d,i,active)
    let y = ty(d,i,active)

    rule.select('.x')
      .attr('transform', 'translate(0,' + y + ')')
      .select('text')
        .attr('transform', 'translate(' + x + ')')
        .text(blood_sugar_format(blood_sugar_f(d)))
    rule.select('.y')
      .attr('transform', 'translate(' + x + ',0)')
      .select('text')
        .attr('transform', 'translate(0,' + y + ')rotate(-90)')
        .text(body_weight_format(body_weight_f(d)))

    rule.transition()
      .duration(750)
      .attr('opacity', 1)

    update(150, true, i)
  })
  drug.on('mouseout', function(d) {
    d3.select('#rule')
      .transition()
      .delay(500)
      .attr('opacity', '0')

    update(500, true)
  })
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

let trans = null
function update(dur=500, local_scale=true, focus_i=-1) {
  d3.select('#viz')
    .attr('width', width + MARGINS.left + MARGINS.right)
    .attr('height', height + MARGINS.top + MARGINS.bottom)

  rule_x.select('line')
    .attr('x2', width)
  rule_y.select('line')
    .attr('y2', height)

  d3.keys(active).map(update_selector_state)

  scatter_x.range([0, active.body_weight ? width : 0])
    .domain(local_scale ? d3.extent(data, body_weight_f) : body_weight_extent)
  axis_x.scale(scatter_x)

  scatter_y.range([height, active.blood_sugar ? 0 : height])
    .domain((local_scale ? d3.extent(data, blood_sugar_f) : blood_sugar_extent).slice().reverse())
  axis_y.scale(scatter_y)

  trans = g.transition().duration(dur)

  trans.attr('transform', 'translate(' + [ MARGINS.left + (active.body_weight ? 0 : width / 2),
                                           MARGINS.top + (active.blood_sugar ? 0 : -height / 2)] + ')')


  trans.select('.axis.x')
    .attr('transform', 'translate(0,' + (active.blood_sugar ? scatter_y(state.blood_sugar) : height) + ')')
    .call(axis_x)
    .style('opacity', active.body_weight ? 1 : 0)
    .select('.label')
      .attr('transform', 'translate(' + scatter_x.range()[1] + ',0)')

  trans.select('.axis.y')
    .attr('transform', (d) => { return 'translate(' + (active.body_weight ? scatter_x(state.body_weight) : 0) + ',0)' })
    .call(axis_y)
    .style('opacity', active.blood_sugar ? 1 : 0)
    .select('.label')
      .attr('transform', 'translate(0,' + scatter_y.range()[1] + ')rotate(-90)')

  let overlaps = active.body_weight && !active.blood_sugar

  let drug = g.selectAll('.drug')
    .data(data)

  drug.exit().remove()

  trans = drug.transition()
      .duration(dur)

  trans.attr('opacity', (d,i) => focus_i < 0 || focus_i === i ? 1 : .3)
  trans.attr('transform', (d,i) => {
      return 'translate(' + [tx(d, i, active), ty(d, i, active)] + ')rotate(' + (overlaps ? -90 : 0) + ')'
    })
  trans.select('.label')
    .attr('opacity', local_scale ? 1 : 0)
  trans.select('.label_risk')
    .text( (d) => {
      let incidents = Math.round(hypoglycaemia_f(d))
      return incidents ? '~' + incidents : '<1'
    })
  trans.select('.risk')
    .attr('opacity', active.hypoglycaemia ? 1 : 0)

  let incident = drug.select('.risk')
    .selectAll('.incident')
    .data( (d,i) => {
      if(!active.hypoglycaemia) { return [] }
      let x = tx(d, i, active)
      let y = ty(d, i, active)
      let incidents = hypoglycaemia_f(d)
      return incidents_in_circle(incidents, INCIDENT_CIRCLE_RADIUS, DRUG_CIRCLE_RADIUS - 5 - INCIDENT_CIRCLE_RADIUS - 2)
    })
  incident.exit().remove()
  incident.enter().append('circle')
    .attr('class', 'incident')
    .attr('r', INCIDENT_CIRCLE_RADIUS)
    .attr('fill', 'rgb(214, 39, 40)')
  incident.attr('cx', (d) => d.x)
    .attr('cy', (d) => d.y)
    .attr('opacity', (d) => d.value)
}

  function tx(d,i,active) {
    if(!active.blood_sugar && !active.body_weight) return NO_AXIS_RADIUS * Math.sin(2 * Math.PI * i / data.length)
    return active.body_weight ? scatter_x(body_weight_f(d)) : 0
  }
  function ty(d,i,active) {
    if(!active.blood_sugar && !active.body_weight) return NO_AXIS_RADIUS * Math.cos(2 * Math.PI * i / data.length) + height
    return active.blood_sugar ? scatter_y(blood_sugar_f(d)) : height
  }

// bootstrap
d3.csv('./data.csv', (err, data) => {
  if(err) throw err
  type(data)
  calibrate()
  install()
  update(0, false)
})

function update_selector_state(name) {
  d3.select('.selector.' + name)
    .classed('disabled', !active[name])
}

d3.selectAll('.selector label').on('click', function() {
  let elem = d3.select(this.parentNode)
  d3.keys(active).forEach( (key) => {
    if(elem.classed(key)) { active[key] = !active[key] }
  })
  update(500, true)
})

window.onresize = () => {
  calibrate()
  update(0, true)
}

// utility

function rand_in_circle(cr) {
  let r = Math.random() * cr
  let a = Math.random() * 2 * Math.PI
  return { x: r * Math.sin(a), y: r * Math.cos(a) }
}

function incidents_in_circle(n, r, cr) {
  // TODO.  NOT the best solution...
  let tilt = 200

  let result = []
  while(result.length < n) {
    let p = rand_in_circle(cr)
    let collide = result.some( (d) => Math.sqrt(Math.pow(p.x - d.x,2) + Math.pow(p.y - d.y,2)) < r *2)
    p.value = Math.min(1.0, n - result.length)
    if(!collide || tilt < 0) { result.push(p) }
    else { tilt-- }
  }
  return result
}
