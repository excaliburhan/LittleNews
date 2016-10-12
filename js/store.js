/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @store localStorage
 */

module.exports = {
  get(key) {
    return JSON.parse(localStorage.getItem(key))
  },
  set(key, val) {
    val = JSON.stringify(val)
    localStorage.setItem(key, val)
  },
}
