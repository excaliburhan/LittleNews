/**
 *
 * @author xiaoping (edwardhjp@gmail.com)
 * @type js
 * @app the main script
 */

const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const shell = electron.shell
const $ = require('jquery')
const cheerio = require('cheerio')
const menu = require('./js/menu.js')
const store = require('./js/store.js')
const add = require('./js/add.js')
const manage = require('./js/manage.js')
let ajaxing = false
let pageNum = 1
let isModified = false

function loadDetail(id, page) {
  const subObj = store.get('subObj')
  const theSub = subObj[id]
  let url
  if (!page || !theSub.page) {
    url = theSub.url
  } else {
    const query = theSub.page.replace(/\{.+\}/, page)
    url = theSub.url + query
  }
  if (ajaxing || (!theSub.page && page)) {
    console.log(ajaxing)
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
  })
    .done((data) => {
      $('.detailLoading').removeClass('show')
      const now = new Date().toLocaleString()
      const timeTpl = `<i class="iconfont">&#xe604;</i><span>Last Sync Time: ${now}</span>`
      const container = $('.detailContainer')
      $('.detailLastTime').html(timeTpl)
      if (theSub.type === 'Crawler') {
        const $c = cheerio.load(data)
        try {
          const items = $c(theSub.newsItem)
          const titles = items.find(theSub.newsTitle)
          const imgs = items.find(theSub.newsImg)
          const contents = items.find(theSub.newsContent)
          const authors = items.find(theSub.newsAuthor)
          let hrefs = []
          let tpl = ''
          if (theSub.newsHref.indexOf('{') === -1) {
            hrefs = items.find(theSub.newsHref)
          } else {
            const hrefArr = theSub.newsHref.match(/\{(.+)\}/g)
            hrefArr.forEach((item) => {
              const param = item.substring(1, item.length - 1)
              hrefs = items.find(param)
            })
          }
          for (let i = 0; i < items.length; i++) {
            const title = $c(titles[i]).text().replace(/<\/?[^>]*>/g, '').trim()
            const img = $c(imgs[i]).attr('src')
            const content = $c(contents[i]).text().replace(/<\/?[^>]*>/g, '').trim()
            const author = $c(authors[i]).text().replace(/<\/?[^>]*>/g, '').trim()
            const authorDesc = author ? `By ${author}` : ''
            let href
            if (theSub.newsHref.indexOf('{') === -1) {
              href = $c(hrefs[i]).attr('href')
            } else {
              href = theSub.newsHref.replace(/\{.+\}/, $c(hrefs[i]).attr('href'))
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
          }
          if (!page) {
            pageNum = 1
            $('.detailContainer').html(tpl)
          } else {
            container.append(tpl)
          }
        } catch (ex) {
          // console.log(ex)
        }
      } else if (theSub.type === 'RSS') {
        const channel = $(data).find('channel')
        const items = channel.find('item')
        let tpl = ''
        for (let i = 0; i < items.length; i++) {
          const title = $(items[i]).find('title').text()
          const href = $(items[i]).find('link').text()
          const content =
            $(items[i]).find('description').text().replace(/<\/?[^>]*>/g, '').substr(0, 200)
          const authorDesc = ''
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

function loadList() {
  const subIds = store.get('subIds')
  const subObj = store.get('subObj')
  let tpl = ''
  let firstId = null
  if (subIds.length > 0) {
    subIds.forEach((id, idx) => {
      if (subObj[id]) {
        const theSub = subObj[id]
        const type = theSub.type
        const name = theSub.name
        const digest = theSub.digest
        const icon = theSub.icon
        tpl +=
          `<div class="listItem ${idx === 0 ? 'selected' : ''}" data-id="${id}">` +
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
    firstId && loadDetail(firstId)
  }
  isModified = false
}

function init() {
  menu.initMenu()
  // load
  loadList()

  // native event
  $('html').on('drop dragover', (e) => { // prevent drag event
    e.preventDefault()
    return
  })
  $('html').on('click', 'a', (e) => {
    const tag = e.currentTarget
    e.preventDefault()
    shell.openExternal($(tag).attr('href'))
  })

  // page home
  $('body').on('click', (e) => {
    const tag = $(e.target)
    if (tag.closest('.addBtn').length) {
      $('#add').addClass('show')
    } else if (tag.closest('.manageBtn').length) {
      $('#manage').addClass('show')
      manage.loadList()
    } else if (tag.closest('.backBtn').length) {
      $('#add').removeClass('show')
      $('#manage').removeClass('show')
      isModified && loadList()
    } else if (tag.closest('.listItem').length) {
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

  // page add
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
    if (add.validate(arr) || params.type === 'RSS') { // rss dont need most params
      if (ajaxing) return
      $.ajax({
        url: params.url,
        beforeSend: () => {
          ajaxing = true
          $('.addLoading').addClass('show')
        },
      })
        .done((data) => {
          $('.addLoading').removeClass('show')
          ajaxing = false
          if (add.doTest(data, params)) {
            ipcRenderer.send('msg', 'Test passed')
          } else {
            ipcRenderer.send('msg', 'You haven\'t pass the test, please check your settings')
          }
        })
        .fail(() => {
          $('.addLoading').removeClass('show')
          ajaxing = false
          ipcRenderer.send('msg', 'Failed to load page')
        })
    } else {
      ajaxing = false
      ipcRenderer.send('msg', 'You haven\'t fill all required params')
    }
  })
  $('.submitAddBtn').on('click', () => {
    const params = {
      type: $('.addType:checked').val(),
      name: $('.addName').val(),
      digest: $('.addDigest').val(),
      url: $('.addUrl').val(),
      page: $('.addPage').val(),
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
    if (add.validate(arr) || params.type === 'RSS') {
      if (ajaxing) return
      $.ajax({
        url: params.url,
        beforeSend: () => {
          ajaxing = true
          $('.addLoading').addClass('show')
        },
      })
        .done((data) => {
          $('.addLoading').removeClass('show')
          add.doSubmit(params, data)
          ajaxing = false
          isModified = true
          ipcRenderer.send('msg', 'Success')
        })
        .fail(() => {
          $('.addLoading').removeClass('show')
          ajaxing = false
          ipcRenderer.send('msg', 'Failed to load page')
        })
    } else {
      ipcRenderer.send('msg', 'You haven\'t fill all required params')
    }
  })
}

init()
