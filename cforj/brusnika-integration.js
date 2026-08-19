/**
 * cforj Embed — Brusnika LMS Integration Script
 *
 * Подключите этот скрипт на стороне Brusnika LMS для интеграции с cforj player.
 *
 * Usage:
 *   <div id="cforj-container" data-course-id="COURSE_ID"></div>
 *   <script src="https://<CFORJ_DOMAIN>/brusnika-integration.js"></script>
 *
 * Или программно:
 *   CforjEmbed.init({
 *     container: '#cforj-container',
 *     courseId: 'abc123',
 *     serverUrl: 'https://<CFORJ_DOMAIN>',
 *     onProgress: (data) => { ... },
 *     onComplete: (data) => { ... },
 *     autoResize: true,
 *   })
 */

(function (global) {
  'use strict'

  var DEFAULTS = {
    serverUrl: '',  // auto-detect from script src
    autoResize: true,
    height: 600,
  }

  function CforjEmbed() {}

  /**
   * Initialize embed player
   */
  CforjEmbed.init = function (options) {
    var opts = Object.assign({}, DEFAULTS, options)

    // Auto-detect server URL from script tag
    if (!opts.serverUrl) {
      var scripts = document.querySelectorAll('script[src*="brusnika-integration"]')
      if (scripts.length) {
        var src = scripts[scripts.length - 1].src
        opts.serverUrl = src.substring(0, src.lastIndexOf('/'))
      }
    }

    // Find container
    var container
    if (typeof opts.container === 'string') {
      container = document.querySelector(opts.container)
    } else if (opts.container instanceof HTMLElement) {
      container = opts.container
    }

    if (!container) {
      console.error('[cforj] Container not found:', opts.container)
      return null
    }

    var courseId = opts.courseId || container.getAttribute('data-course-id')
    if (!courseId) {
      console.error('[cforj] No courseId provided')
      return null
    }

    // Create iframe
    var iframe = document.createElement('iframe')
    iframe.src = opts.serverUrl + '/play/' + courseId
    iframe.style.width = '100%'
    iframe.style.height = opts.height + 'px'
    iframe.style.border = 'none'
    iframe.style.borderRadius = '8px'
    iframe.setAttribute('allow', 'fullscreen')
    iframe.setAttribute('loading', 'lazy')

    container.innerHTML = ''
    container.appendChild(iframe)

    // Listen for messages from player
    function handleMessage(event) {
      var data = event.data
      if (!data || !data.type || !data.type.startsWith('cforj:')) return

      switch (data.type) {
        case 'cforj:ready':
          if (opts.onReady) opts.onReady(data)
          break

        case 'cforj:progress':
          if (opts.onProgress) opts.onProgress(data)
          break

        case 'cforj:complete':
          if (opts.onComplete) opts.onComplete(data)
          break

        case 'cforj:resize':
          if (opts.autoResize && data.height) {
            iframe.style.height = Math.max(data.height + 20, 200) + 'px'
          }
          break
      }
    }

    window.addEventListener('message', handleMessage)

    // Public API
    return {
      iframe: iframe,
      destroy: function () {
        window.removeEventListener('message', handleMessage)
        container.innerHTML = ''
      },
      goToScreen: function (screenId) {
        iframe.contentWindow.postMessage({ type: 'cforj:goToScreen', screenId: screenId }, '*')
      },
      getProgress: function () {
        iframe.contentWindow.postMessage({ type: 'cforj:getProgress' }, '*')
      },
    }
  }

  // Auto-init from data attributes
  document.addEventListener('DOMContentLoaded', function () {
    var containers = document.querySelectorAll('[data-cforj-course]')
    containers.forEach(function (el) {
      CforjEmbed.init({
        container: el,
        courseId: el.getAttribute('data-cforj-course'),
        autoResize: el.getAttribute('data-cforj-autoresize') !== 'false',
      })
    })
  })

  global.CforjEmbed = CforjEmbed
})(typeof window !== 'undefined' ? window : this)
