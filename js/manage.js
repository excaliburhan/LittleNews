/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @manage
 */

const $ = require('jquery')
const store = require('./store.js')

module.exports = {
  loadList() {
    const allIds = store.get('allIds')
    const subIds = store.get('subIds')
    const subObj = store.get('subObj')

    if (!allIds || !subIds || !subObj) {
      return
    }
    let tpl = ''
    allIds.forEach((id) => {
      const isOff = !subIds.includes(id)
      if (subObj[id]) {
        const theSub = subObj[id]
        const type = theSub.type
        const name = theSub.name
        const digest = theSub.digest
        const icon = theSub.icon
        tpl +=
          `<li class="manageItem" data-id="${id}" draggable="true">` +
            '<div class="manageItemIcon">' +
              `<img src="${icon || 'img/icon.png'}" alt="" />` +
            '</div>' +
            '<div class="manageItemInfo">' +
              `<h2>${name}[${type}]</h2>` +
              `<p>${digest}</p>` +
            '</div>' +
            `<div class="manageItemBtns" data-id="${id}">` +
              `<div class="manageItemSwitch ${isOff ? 'off' : ''}">` +
                '<i class="iconfont">&#xe606;</i>' +
                `<span>${isOff ? 'Open' : 'Close'}</span>` +
              '</div>' +
              '<div class="manageItemDel">' +
                '<i class="iconfont">&#xe603;</i>' +
                '<span>Delete</span>' +
              '</div>' +
            '</div>' +
          '</li>'
      }
      $('.manageForm').html(tpl)
    })
  },
  toggleNews(id, type) {
    const allIds = store.get('allIds')
    let subIds = store.get('subIds')
    if (type === 'on') {
      const idx = allIds.indexOf(id)
      subIds.splice(idx, 0, id)
    } else {
      subIds = subIds.filter(item => item !== id)
    }
    store.set('subIds', subIds)
  },
  deleteNews(id) {
    store.delete('allIds', id)
    store.delete('subIds', id)
    store.delete('subObj', id)
  },
}
