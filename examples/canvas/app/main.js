// Please `npm run example:canvas` and install parcel before test.
import { screenshot } from '../../../index'

const draw = () => {
  const canvas = document.getElementById('canvas')
  const context = canvas.getContext('2d')

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = 70

  context.beginPath()
  context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false)
  context.fillStyle = 'green'
  context.fill()
  context.lineWidth = 5
  context.strokeStyle = '#003300'
  context.stroke()
}

setTimeout(() => {
  draw()
  screenshot()
}, 1000)
