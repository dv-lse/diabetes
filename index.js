import 'styles.css!'

import d3 from 'd3'

const MARGINS = { top: 30, right: 250, bottom: 50, left: 100 }

// state

let width, height

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

function install(vals) {
  data = vals
  g = d3.select('#viz').append('g')
      .attr('transform', 'translate(' + [MARGINS.left, MARGINS.top] + ')')

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

  g.append('g')
    .attr('class', 'axis y')

  color = d3.scale.category10()

  let drug = g.selectAll('.drug')
      .data(data)
    .enter().append('g')
      .attr('class', 'drug')
  drug.append('circle')
    .attr('fill', (d) => color(drug_f(d)))
    .attr('r', 5)
  drug.append('text')
    .attr('dx', 8)
    .attr('dy', '.3em')
    .text(drug_f)
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

  scatter_x.range([0, width])
    .domain(d3.extent(data, body_weight_f))
  axis_x.scale(scatter_x)

  scatter_y.range([height, 0])
    .domain(d3.extent(data, blood_sugar_f))
  axis_y.scale(scatter_y)

  g.select('.axis.x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(axis_x)
  g.select('.axis.y')
    .call(axis_y)

  let drug = g.selectAll('.drug')
    .data(data)

  drug.exit().remove()

  console.log('updating ' + JSON.stringify(state))
  let num_active = d3.values(active).reduce( (count,cur) => cur ? count+1 : count)
  drug.transition()
      .duration(dur)
    .attr('transform', (d,i) => {
      let tx = active.body_weight ? scatter_x(body_weight_f(d)) : 0
      let ty = active.blood_sugar ? scatter_y(blood_sugar_f(d)) : height
      return 'translate(' + [tx, ty] + ')'
    })
    .select('text')
      .attr('opacity', num_active ? 1 : 0)
}

// bootstrap
d3.csv('./data.csv', (err, data) => {
  if(err) throw err
  calibrate()
  install(data)
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
