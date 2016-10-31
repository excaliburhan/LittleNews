/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @app the main script
 */

const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const shell = electron.shell
const fs = require('fs')
const $ = require('jquery')
const cheerio = require('cheerio')
const feedFinder = require('feed-finder')
const menu = require('./js/menu.js')
const store = require('./js/store.js')
const util = require('./js/util.js')
const add = require('./js/add.js')
const manage = require('./js/manage.js')
let ajaxing = false // ajax status
let pageNum = 1 // current page
let isModified = false // if modified from add/manage should loadSubs
let dragDom = null // the drag dom
let dropDom = null // the drop dom
let editId = null // the id of news settings

function loadDetail(id, page) {
  const subObj = store.get('subObj')
  const theSub = subObj[id]
  let url
  if (!id) return // no id just quit
  if (!page || !theSub.page) {
    url = theSub.url
  } else {
    const query = theSub.page.replace(/\{.+\}/, page)
    url = theSub.url + query
  }
  if (ajaxing || (!theSub.page && page)) {
    return
  } else if (!page) {
    $('.detailContainer').html('')
  }
  $.ajax({
    url,
    beforeSend: () => {
      ajaxing = true
      $('.detailLoading').addClass('show')
    },
    timeout: 10000,
  })
    .done((data) => {
      $('.detailLoading').removeClass('show')
      const now = new Date().toLocaleString()
      const timeTpl = `<i class="iconfont">&#xe604;</i><span>Last Sync Time: ${now}</span>`
      const container = $('.detailContainer')
      $('.detailLastTime').html(timeTpl)
      if (theSub.type === 'Crawler') {
        const $c = cheerio.load(data)
        const items = $c(theSub.newsItem)
        let tpl = ''
        for (let i = 0; i < items.length; i++) {
          try {
            const item = items.eq(i)
            util.dealSelector(item, theSub.newsTitle)
            const title =
              util.dealSelector(item, theSub.newsTitle).text().replace(/<\/?[^>]*>/g, '').trim()
            const img =
              util.dealSelector(item, theSub.newsImg).attr('src')
            const content =
              util.dealSelector(item, theSub.newsContent).text().replace(/<\/?[^>]*>/g, '').trim()
            const author =
              util.dealSelector(item, theSub.newsAuthor).text().replace(/<\/?[^>]*>/g, '').trim()
            const authorDesc = author ? `By ${author}` : ''
            let href
            if (theSub.newsHref.indexOf('{') === -1) {
              href = util.dealSelector(item, theSub.newsHref).attr('href')
            } else {
              href = util.dealHref(item, theSub.newsHref)
            }
            tpl +=
              `<div class="detailItem data-id="${i}">` +
                `<a href="${href}">` +
                  '<div class="detailItemIcon">' +
                    `<img  src="${img || 'img/newsImg.png'}" alt="" />` +
                  '</div>' +
                  '<div class="detailItemInfo">' +
                    `<h2>${title}</h2>` +
                    `<p>${content || 'There is no description'}</p>` +
                    `<p class='detailAuthor'>${authorDesc}</p>` +
                  '</div>' +
                '</a>' +
              '</div>'
          } catch (err) {
            console.log(err)
          }
          if (!page) {
            pageNum = 1
            $('.detailContainer').html(tpl)
          } else {
            container.append(tpl)
          }
        }
      } else if (theSub.type === 'FEED') {
        const rssObj = {}
        let channel
        if ($(data).find('channel').length) { // RSS 2.0
          rssObj.items = 'item'
          rssObj.title = 'title'
          rssObj.link = 'link'
          rssObj.description = 'description'
          rssObj.pubDate = 'pubDate'
          channel = $(data).find('channel')
        } else if ($(data).find('feed').length) { // atom
          rssObj.items = 'entry'
          rssObj.title = 'title'
          rssObj.link = 'link'
          rssObj.description = 'summary'
          rssObj.pubDate = 'published'
          channel = $(data).find('feed')
        }
        const items = channel.find(rssObj.items)
        let tpl = ''
        for (let i = 0; i < items.length; i++) {
          const title = $(items[i]).find(rssObj.title).text()
          const href = $(items[i]).find(rssObj.link).text() ||
            $(items[i]).find(rssObj.link).attr('href')
          const content =
            $(items[i]).find(rssObj.description).text().replace(/<\/?[^>]*>/g, '').substr(0, 200)
          const author = $(items[i]).find(rssObj.pubDate).text() || ''
          let authorDesc = ''
          if (author) {
            authorDesc = `By ${new Date(author).toLocaleString()}` || ''
          }
          tpl +=
            `<div class="detailItem data-id="${i}">` +
              `<a href="${href}">` +
                '<div class="detailItemIcon">' +
                  '<img src="img/newsImg.png" alt="" />' +
                '</div>' +
                '<div class="detailItemInfo">' +
                  `<h2>${title}</h2>` +
                  `<p>${content || 'There is no description'}</p>` +
                  `<p class='detailAuthor'>${authorDesc}</p>` +
                '</div>' +
              '</a>' +
            '</div>'
        }
        if (!page) {
          $('.detailContainer').html(tpl)
        } else {
          container.append(tpl)
        }
      } else if (theSub.type === 'API') {
        const items = data[theSub.newsItem]
        let tpl = ''
        for (let i = 0; i < items.length; i++) {
          const title = items[i][theSub.newsTitle]
          const img = items[i][theSub.newsImg]
          const content = items[i][theSub.newsContent]
          const author = items[i][theSub.newsAuthor]
          const authorDesc = author ? `By ${author}` : ''
          let href = theSub.newsHref
          const hrefArr = href.match(/\{(.+)\}/g)
          hrefArr.forEach((item) => {
            const param = item.substring(1, item.length - 1)
            href = href.replace(/\{.+\}/, items[i][param])
          })
          tpl +=
            `<div class="detailItem data-id="${i}">` +
              `<a href="${href}">` +
                '<div class="detailItemIcon">' +
                  `<img src="${img || 'img/newsImg.png'}" alt="" />` +
                '</div>' +
                '<div class="detailItemInfo">' +
                  `<h2>${title}</h2>` +
                  `<p>${content || 'There is no description'}</p>` +
                  `<p class='detailAuthor'>${authorDesc}</p>` +
                '</div>' +
              '</a>' +
            '</div>'
        }
        if (!page) {
          $('.detailContainer').html(tpl)
        } else {
          container.append(tpl)
        }
      }
      ajaxing = false
      return false
    })
    .fail(() => {
      $('.detailLoading').removeClass('show')
      // ipcRenderer.send('msg', 'Failed to load page')
      ajaxing = false
    })
}

function loadSubs() {
  const subIds = store.get('subIds')
  const subObj = store.get('subObj')
  let tpl = ''
  let firstId = null
  if (subIds && subIds.length > 0) {
    try {
      subIds.forEach((id, idx) => {
        if (subObj[id]) {
          const theSub = subObj[id]
          const type = theSub.type
          const name = theSub.name
          const digest = theSub.digest
          const icon = theSub.icon
          tpl +=
            `<div class="listItem ${idx === 0 ? 'selected' : ''}" data-id="${id}"` +
            'draggable="true">' +
              '<div class="listItemIcon">' +
                `<img src="${icon || 'img/icon.png'}" alt="" />` +
              '</div>' +
              '<div class="listItemInfo">' +
                `<h2>${name}[${type}]</h2>` +
                `<p>${digest}</p>` +
              '</div>' +
            '</div>'
          idx === 0 && (firstId = id)
        }
      })
      $('.listContainer').html(tpl)
      loadDetail(firstId)
    } catch (ex) { // if config json has error, clear localStorage
      ipcRenderer.send('msg', 'There is an error in config file')
      store.clear()
    }
  } else { // no subs
    $('.listContainer').html('')
    $('.detailLastTime').html('<i class="iconfont">&#xe604;</i><span>Last Sync Time: Never</span>')
    $('.detailContainer').html('')
  }

  isModified = false
}

function init() {
  // ipcRenderer
  ipcRenderer.on('dialogReply', (e, arg) => {
    // console.log(e)
    const type = arg[0]
    const filename = arg[1]
    if (type === 'import') {
      fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          console.log(err)
        }
        const obj = JSON.parse(data)
        store.set('allIds', obj.allIds)
        store.set('subIds', obj.subIds)
        delete obj.allIds
        delete obj.subIds
        store.set('subObj', obj)
        $('#add').removeClass('show')
        $('#manage').removeClass('show')
        loadSubs() // reloadSubs
      })
    } else if (type === 'export') {
      const subObj = store.get('subObj')
      const allIds = store.get('allIds')
      const subIds = store.get('subIds')
      const data = Object.assign({}, subObj, {
        allIds,
        subIds,
      })
      const writeData = JSON.stringify(data)
      fs.writeFile(filename, writeData, (err) => {
        if (err) {
          // console.log(err)
        }
        ipcRenderer.send('msg', 'Export success')
      })
    }
  })

  // init menu
  menu.initMenu()

  // load
  loadSubs()

  // native event
  $('html').bind('dragstart', (e) => {
    if ($(e.target).hasClass('listItem') || $(e.target).hasClass('manageItem')) {
      dragDom = $(e.target)
    } else if ($(e.target).closest('.listItem').length) {
      dragDom = $(e.target).closest('.listItem')
    } else if ($(e.target).closest('.manageItem').length) {
      dragDom = $(e.target).closest('.manageItem')
    } else {
      e.preventDefault()
      return
    }
  })
  $('html').bind('dragover', (e) => {
    e.preventDefault()
    return
  })
  $('html').bind('drop', (e) => {
    e.preventDefault()
    let selector
    if (dragDom.hasClass('listItem')) {
      selector = '.listItem'
    } else if (dragDom.hasClass('manageItem')) {
      selector = '.manageItem'
    }
    if ($(e.target).hasClass('listItem') || $(e.target).hasClass('manageItem')) {
      dropDom = $(e.target)
    } else if ($(e.target).closest('.listItem').length) {
      dropDom = $(e.target).closest('.listItem')
    } else if ($(e.target).closest('.manageItem').length) {
      dropDom = $(e.target).closest('.manageItem')
    }
    const allIds = store.get('allIds')
    const subIds = store.get('subIds')
    const startIndex = dragDom.index()
    const endIndex = dropDom.index()
    if (startIndex > endIndex) { // 3 -> 1
      $(selector).eq(startIndex).insertBefore($(selector).eq(endIndex))
    } else if (startIndex < endIndex) { // 1 - > 3
      $(selector).eq(startIndex).insertAfter($(selector).eq(endIndex))
    }
    if (startIndex !== endIndex) {
      if (selector === '.listItem') {
        const allStartIndex = allIds.indexOf(subIds[startIndex])
        const allEndIndex = allIds.indexOf(subIds[endIndex])
        store.move('subIds', startIndex, endIndex)
        store.move('allIds', allStartIndex, allEndIndex)
      } else if (selector === '.manageItem') {
        store.move('allIds', startIndex, endIndex)
        const newSubIds = store.get('allIds').filter(v => subIds.includes(v))
        store.set('subIds', newSubIds)
        isModified = true // change order should trigger loadSubs
      }
    }
  })
  $('html').on('click', 'a', (e) => {
    const tag = e.currentTarget
    const href = $(tag).attr('href')
    const id = $('.listItem.selected').attr('data-id')
    const openMethod = store.get('subObj')[id].open
    e.preventDefault()
    if (openMethod === 'APP') {
      $('#webpage').attr('src', href)
    } else {
      shell.openExternal($(tag).attr('href'))
    }
  })
  $('#webpage').bind('did-start-loading', (e) => {
    const tag = $(e.target)
    if (tag.attr('src') !== 'about:blank') {
      $('.detailLoading').addClass('show')
      $('#webpage').addClass('show')
    }
  })
  $('#webpage').bind('dom-ready', (e) => {
    const tag = $(e.target)
    if (tag.attr('src') !== 'about:blank') {
      $('.detailLoading').addClass('show')
      $('#webpage').addClass('show')
    }
  })

  // page event
  $('body').on('click', (e) => {
    const tag = $(e.target)
    if (tag.closest('.addBtn').length) {
      if (!editId) {
        add.clearSettings()
      }
      $('#webpage').removeClass('show').attr('src', 'about:blank')
      $('.detailLoading').removeClass('show')
      $('#add').addClass('show')
    } else if (tag.closest('.manageBtn').length) {
      $('#webpage').removeClass('show').attr('src', 'about:blank')
      $('#manage').addClass('show')
      manage.loadList()
    } else if (tag.closest('.backBtn').length) {
      editId = null
      $('#add').removeClass('show')
      $('#manage').removeClass('show')
      isModified && loadSubs()
    } else if (tag.closest('.clearBtn').length) {
      store.clear()
      editId = null
      $('#add').removeClass('show')
      $('#manage').removeClass('show')
      loadSubs()
    } else if (tag.closest('.listItem').length) {
      $('#webpage').removeClass('show').attr('src', 'about:blank')
      const theTag = tag.closest('.listItem')
      const id = $(theTag).attr('data-id')
      $('.listItem.selected').removeClass('selected')
      $(theTag).addClass('selected')
      loadDetail(id)
    } else if (tag.closest('.detailLastTime').length) {
      const id = $('.listItem.selected').attr('data-id')
      loadDetail(id)
    } else if (tag.closest('.manageItemSwitch').length) {
      const theTag = tag.closest('.manageItemSwitch')
      const id = $(theTag).parent().attr('data-id')
      if ($(theTag).hasClass('off')) {
        manage.toggleNews(id, 'on')
        $(theTag).html('<i class="iconfont">&#xe606;</i><span>Close</span>').removeClass('off')
      } else {
        manage.toggleNews(id, 'off')
        $(theTag).html('<i class="iconfont">&#xe606;</i><span>Open</span>').addClass('off')
      }
      isModified = true
    } else if (tag.closest('.manageItemDel').length) {
      const theTag = tag.closest('.manageItemDel')
      const id = $(theTag).parent().attr('data-id')
      $(theTag).closest('.manageItem').remove()
      manage.deleteNews(id)
      isModified = true
    } else if (tag.closest('.manageItem').length) {
      const theTag = tag.closest('.manageItem')
      const id = $(theTag).attr('data-id')
      editId = id
      $('#manage').removeClass('show')
      $('#add').addClass('show')
      add.loadSettings(id)
    }
  })
  $('body').on('keydown', (e) => {
    const code = e.keyCode
    if (code === 27) { // esc
      editId = null
      $('#add').removeClass('show')
      $('#manage').removeClass('show')
      $('#webpage').removeClass('show').attr('src', 'about:blank')
      $('.detailLoading').removeClass('show')
    } else if (code === 13 && $('#add').hasClass('show')) { // enter
      $('.submitAddBtn').click()
    }
  })
  $('.detailContainer').on('scroll', (e) => {
    if (ajaxing) {
      e.preventDefault()
      return
    }
    const tag = e.target
    const scrollH = tag.scrollHeight
    const clientH = tag.clientHeight
    const scrollTop = tag.scrollTop
    if (scrollH - clientH - scrollTop <= 0) {
      const id = $('.listItem.selected').attr('data-id')
      pageNum++
      loadDetail(id, pageNum)
    }
  })

  // add/manage event
  $('.submitTestBtn').on('click', () => {
    function theTest(params) {
      $.ajax({
        url: params.url,
        beforeSend: () => {
          ajaxing = true
          $('.addLoading').addClass('show')
        },
        timeout: 10000,
      })
        .done((data) => {
          $('.addLoading').removeClass('show')
          ajaxing = false
          if (add.doTest(data, params)) {
            params.type !== 'FEED' && ipcRenderer.send('msg', 'Test passed')
          } else {
            ipcRenderer.send('msg', 'You haven\'t pass the test, please check your settings')
          }
        })
        .fail(() => {
          $('.addLoading').removeClass('show')
          ajaxing = false
          ipcRenderer.send('msg', 'Failed to load page')
        })
    }
    const params = {
      type: $('.addType:checked').val(),
      name: $('.addName').val(),
      digest: $('.addDigest').val(),
      url: $('.addUrl').val(),
      icon: $('.addIcon').val(),
      open: $('.addOpen:checked').val(),
      newsItem: $('.addNewsItem').val(),
      newsTitle: $('.addNewsTitle').val(),
      newsHref: $('.addNewsHref').val(),
      newsImg: $('.addNewsImg').val(),
      newsContent: $('.addNewsContent').val(),
      newsAuthor: $('.addNewsAuthor').val(),
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
    if (add.validate(arr) || params.type === 'FEED') { // rss dont need most params
      if (ajaxing) return
      if (params.type === 'FEED') {
        $('.addLoading').addClass('show')
        feedFinder(params.url, (err, feedUrls) => {
          if (err) {
            $('.addLoading').removeClass('show')
            ajaxing = false
            ipcRenderer.send('msg', 'Feed finder has an error')
            return
          }
          if (feedUrls.length > 0) {
            params.url = feedUrls[0]
            ipcRenderer.send('msg', `Find feedUrl: ${params.url}`)
            theTest(params)
          } else {
            $('.addLoading').removeClass('show')
            ajaxing = false
            ipcRenderer.send('msg', 'Error occurs, please check your settings')
          }
        })
      } else {
        theTest(params)
      }
    } else {
      ajaxing = false
      ipcRenderer.send('msg', 'Error occurs, please check your settings')
    }
  })
  $('.submitAddBtn').on('click', () => {
    function theSubmit(params) {
      $.ajax({
        url: params.url,
        beforeSend: () => {
          ajaxing = true
          $('.addLoading').addClass('show')
        },
        timeout: 10000,
      })
        .done((data) => {
          $('.addLoading').removeClass('show')
          add.doSubmit(params, data, editId)
          add.clearSettings()
          editId = null
          ajaxing = false
          isModified = true
          loadSubs()
          $('#add').removeClass('show')
          ipcRenderer.send('msg', 'Success')
        })
        .fail(() => {
          $('.addLoading').removeClass('show')
          ajaxing = false
          ipcRenderer.send('msg', 'Failed to load page')
        })
    }
    const params = {
      type: $('.addType:checked').val(),
      name: $('.addName').val(),
      digest: $('.addDigest').val(),
      url: $('.addUrl').val(),
      page: $('.addPage').val(),
      icon: $('.addIcon').val(),
      open: $('.addOpen:checked').val(),
      newsItem: $('.addNewsItem').val(),
      newsTitle: $('.addNewsTitle').val(),
      newsHref: $('.addNewsHref').val(),
      newsImg: $('.addNewsImg').val(),
      newsContent: $('.addNewsContent').val(),
      newsAuthor: $('.addNewsAuthor').val(),
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
    if (add.validate(arr) || params.type === 'FEED') {
      if (ajaxing) return
      if (params.type === 'FEED') {
        $('.addLoading').addClass('show')
        feedFinder(params.url, (err, feedUrls) => {
          if (err) {
            $('.addLoading').removeClass('show')
            ajaxing = false
            ipcRenderer.send('msg', 'Feed finder has an error')
            return
          }
          if (feedUrls.length > 0) {
            params.url = feedUrls[0]
            theSubmit(params)
          } else {
            $('.addLoading').removeClass('show')
            ajaxing = false
            ipcRenderer.send('msg', 'Error occurs, please check your settings')
          }
        })
      } else {
        theSubmit(params)
      }
    } else {
      ipcRenderer.send('msg', 'Error occurs, please check your settings')
    }
  })
}

init()
