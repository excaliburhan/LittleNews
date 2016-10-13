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
  clear() {
    localStorage.clear()
  },
  remove(key) {
    localStorage.removeItem(key)
  },
  delete(key, prop) {
    const obj = this.get(key)
    if (obj instanceof Array) { // array
      const idx = obj.indexOf(prop)
      if (idx > -1) {
        obj.splice(idx, 1)
        this.set(key, obj)
      }
    } else if (obj instanceof Object) { // obj
      obj[prop] && delete obj[prop]
      this.set(key, obj)
    } else {
      this.remove(key)
    }
  },
}
