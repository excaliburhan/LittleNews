/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @app the main script
 */

const $ = require('jquery')

function init() {
  $('html').on('drop dragover', (e) => {
    e.preventDefault()
    return
  })
}

init()
