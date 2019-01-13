// import '../../../recorder'

const $content = document.getElementById('content')
let count = 0

document.addEventListener('click', () => {
  $content.innerHTML = String(count++)
})

$content.addEventListener('click', () => {
  // redundant listener with noop
})

document.addEventListener('keydown', () => {
  $content.innerHTML = String(count++)
})
