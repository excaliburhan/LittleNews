/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @util
*/

module.exports = {
  dealSelector(item, selector) {
    if (selector.indexOf(':') === -1) {
      return item.find(selector)
    } else if (selector.indexOf(' ')) {
      const arr = selector.split(' ')
      arr.forEach((v) => {
        if (v.indexOf(':') === -1) {
          item = item.find(v)
        } else {
          const type = v.split(':')
          const typeWord = type[1].substring(0, type[1].indexOf('('))
          const typeInner = type[1].substring(type[1].indexOf('(') + 1, type[1].indexOf(')'))
          item = item.find(type[0])[typeWord](typeInner)
        }
      })
      return item
    }
    return item
  },
  dealHref(item, pattern) {
    const hrefArr = pattern.match(/\{(.+)\}/g)
    hrefArr.forEach((v) => {
      const param = v.substring(1, v.length - 1)
      item = this.dealSelector(item, param)
    })
    return pattern.replace(/\{.+\}/, item.attr('href'))
  },
}
