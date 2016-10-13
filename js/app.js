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
const store = require('./js/store.js')
const add = require('./js/add.js')

function loadDetail(id) {
  const subObj = store.get('subObj')
  const theSub = subObj[id]
  $.ajax({
    url: theSub.url,
    beforeSend: () => {
      $('.detailLoading').addClass('show')
    },
  })
    .done((data) => {
      $('.detailLoading').removeClass('show')
      const now = new Date().toLocaleString()
      const timeTpl = `<i class="iconfont">&#xe604;</i><span>Last Sync Time: ${now}</span>`
      $('.detailLastTime').html(timeTpl)
      $('.detailContainer').html('')
      if (theSub.type === 'Crawler') {
        const $c = cheerio.load(data)
        try {
          const items = $c(theSub.newsItem)
          const titles = items.find(theSub.newsTitle)
          const hrefs = items.find(theSub.newsHref)
          const imgs = items.find(theSub.newsImg)
          const contents = items.find(theSub.newsContent)
          const authors = items.find(theSub.newsAuthor)
          let tpl = ''
          for (let i = 0; i < items.length; i++) {
            const title = $c(titles[i]).text()
            const href = $c(hrefs[i]).attr('href')
            const img = $c(imgs[i]).attr('src')
            const content = $c(contents[i]).text()
            const author = $c(authors[i]).text() ? `By ${$c(authors[i]).text()}` : ''
            const authorDesc = author ? `By ${author}` : ''
            tpl +=
              `<div class="detailItem data-id="${i}">` +
                `<a href="${href}">` +
                  '<div class="detailItemIcon">' +
                    `<img  src="${img || 'img/newsImg.png'}" alt="" />` +
                  '</div>' +
                  '<div class="detailItemInfo">' +
                    `<h2>${title}</h2>` +
                    `<p>${content || 'There is no content'}</p>` +
                    `<p class='detailAuthor'>${authorDesc}</p>` +
                  '</div>' +
                '</a>' +
              '</div>'
          }
          $('.detailContainer').html(tpl)
        } catch (ex) {
          // console.log(ex)
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
          const hrefArr = href.match(/\{(\w+)\}/g)
          hrefArr.forEach((item) => {
            const param = item.substring(1, item.length - 1)
            href = href.replace(/\{\w+\}/, items[i][param])
          })
          tpl +=
            `<div class="detailItem data-id="${i}">` +
              `<a href="${href}">` +
                '<div class="detailItemIcon">' +
                  `<img src="${img || 'img/newsImg.png'}" alt="" />` +
                '</div>' +
                '<div class="detailItemInfo">' +
                  `<h2>${title}</h2>` +
                  `<p>${content || 'There is no content'}</p>` +
                  `<p class='detailAuthor'>${authorDesc}</p>` +
                '</div>' +
              '</a>' +
            '</div>'
        }
        $('.detailContainer').html(tpl)
      }
      return false
    })
    .fail(() => {
      $('.detailLoading').removeClass('show')
      ipcRenderer.send('msg', 'Failed to load page')
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
}

function init() {
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
  $('.addBtn').on('click', () => {
    $('#add').addClass('show')
  })
  $('.manageBtn').on('click', () => {
    $('#manage').addClass('show')
  })
  $('.backBtn').on('click', () => {
    $('#add').removeClass('show')
    $('#manage').removeClass('show')
    loadList()
  })
  $('.listItem').on('click', (e) => {
    const tag = e.currentTarget
    const id = $(tag).attr('data-id')
    $('.listItem.selected').removeClass('selected')
    $(tag).addClass('selected')
    loadDetail(id)
  })
  $('.detailLastTime').on('click', () => {
    const id = $('.listItem.selected').attr('data-id')
    loadDetail(id)
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
    if (add.validate(arr)) {
      $.ajax({
        url: params.url,
        beforeSend: () => {
          $('.addLoading').addClass('show')
        },
      })
        .done((data) => {
          $('.addLoading').removeClass('show')
          if (add.doTest(data, params)) {
            ipcRenderer.send('msg', 'Test passed')
          } else {
            ipcRenderer.send('msg', 'You haven\'t pass the test, please check your settings')
          }
        })
        .fail(() => {
          $('.addLoading').removeClass('show')
          ipcRenderer.send('msg', 'Failed to load page')
        })
    } else {
      ipcRenderer.send('msg', 'You haven\'t fill all required params')
    }
  })
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
    const arr = [
      params.type,
      params.name,
      params.digest,
      params.url,
      params.newsItem,
      params.newsTitle,
      params.newsHref,
    ]
    if (add.validate(arr)) {
      $.ajax({
        url: params.url,
        beforeSend: () => {
          $('.addLoading').addClass('show')
        },
      })
        .done(() => {
          $('.addLoading').removeClass('show')
          add.doSubmit(params)
          ipcRenderer.send('msg', 'Success')
        })
        .fail(() => {
          $('.addLoading').removeClass('show')
          ipcRenderer.send('msg', 'Failed to load page')
        })
    } else {
      ipcRenderer.send('msg', 'You haven\'t fill all required params')
    }
  })
}

init()
