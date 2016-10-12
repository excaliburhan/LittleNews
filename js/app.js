/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @app the main script
 */

const ipcRenderer = require('electron').ipcRenderer
const $ = require('jquery')
const cheerio = require('cheerio')
const validate = require('./js/validate.js')
const store = require('./js/store.js')

function doTest(data, params) {
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
}

function init() {
  // prevent drag event
  $('html').on('drop dragover', (e) => {
    e.preventDefault()
    return
  })

  // jump btns
  $('.addBtn').on('click', () => {
    $('#add').addClass('show')
  })
  $('.manageBtn').on('click', () => {
    $('#manage').addClass('show')
  })
  $('.backBtn').on('click', () => {
    $('#add').removeClass('show')
    $('#manage').removeClass('show')
  })

  // test btn
  $('.submitTestBtn').on('click', () => {
    const params = {
      type: $('.addType:checked').val(),
      name: $('.addName').val(),
      digest: $('.addDigest').val(),
      url: $('.addUrl').val(),
      icon: $('.addIcon').val(),
      newsItem: $('.addNewsItem').val(),
      newsTitle: $('.addNewsTitle').val(),
      newsHref: $('.addNewsHref').val(),
      newsImg: $('.addNewsImg').val(),
      newsContent: $('.addNewsContent').val(),
    }
    const arr = [
      params.type,
      params.name,
      params.digest,
      params.url,
      params.newsItem,
      params.newsTitle,
      params.newsHref,
    ]
    if (validate.requires(arr)) {
      $.get(params.url, (data) => {
        if (doTest(data, params)) {
          ipcRenderer.send('msg', 'Test passed')
        } else {
          ipcRenderer.send('msg', 'You haven\'t pass the test, please check your settings')
        }
      }).fail(() => {
        ipcRenderer.send('msg', 'Failed to load page')
      })
    } else {
      ipcRenderer.send('msg', 'You haven\'t fill all required params')
    }
  })

  // submit btn
  $('.submitAddBtn').on('click', () => {
    const params = {
      type: $('.addType:checked').val(),
      name: $('.addName').val(),
      digest: $('.addDigest').val(),
      url: $('.addUrl').val(),
      icon: $('.addIcon').val(),
      newsItem: $('.addNewsItem').val(),
      newsTitle: $('.addNewsTitle').val(),
      newsHref: $('.addNewsHref').val(),
      newsImg: $('.addNewsImg').val(),
      newsContent: $('.addNewsContent').val(),
    }
    $.get(params.url, () => {
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
      ipcRenderer.send('msg', 'Success')
    }).fail(() => {
      ipcRenderer.send('msg', 'Failed to load page')
    })
  })
}

init()
