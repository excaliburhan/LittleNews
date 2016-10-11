/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @app the main script
 */

const $ = require('jquery')

function init() {
  // prevent drag event
  $('html').on('drop dragover', (e) => {
    e.preventDefault()
    return
  })

  $('.addBtn').on('click', () => {
    $('#add').addClass('show')
  })
  $('.manageBtn').on('click', () => {
    $('#manage').addClass('show')
  })
}

init()
