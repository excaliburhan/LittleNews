/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @add do add stuff
 */

const cheerio = require('cheerio')
const store = require('./store.js')

module.exports = {
  validate(arr) {
    return arr.every(item => item !== '')
  },
  doTest(data, params) {
    if (params.type === 'Crawler') {
      const $c = cheerio.load(data)
      try {
        const item = $c(params.newsItem).length
        const title = $c(params.newsItem).find(params.newsTitle).length
        const href = $c(params.newsItem).find(params.newsHref).length
        if (item > 0 && title && href) {
          return true
        }
      } catch (ex) {
        // console.log(ex)
        return false
      }
    } else if (params.type === 'API') {
      const arr = data[params.newsItem]
      const reg = /\{(\w+)\}/g
      const firstMatch = params.newsHref.match(reg)[0]
      const matchParam = firstMatch.substring(1, firstMatch.length - 1)
      if (arr && arr.length > 0 && arr[0][params.newsTitle] && arr[0][matchParam]) {
        return true
      }
    }
    return false
  },
  doSubmit(params) {
    const id = Math.random().toString(36).substr(2, 10)
    const allIds = store.get('allIds') || []
    const subIds = store.get('subIds') || []
    let subObj = store.get('subObj') || {}
    const newObj = {}
    allIds.push(id)
    subIds.push(id)
    newObj[id] = params
    subObj = Object.assign({}, subObj, newObj)
    store.set('allIds', allIds)
    store.set('subIds', subIds)
    store.set('subObj', subObj)
  },
}
