(function($, w, d, u) {
  'use strict';
  modx.extended({
    frameset: 'frameset',
    minWidth: 840,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    tabsTimer: 0,
    popupTimer: 0,
    init: function() {
      if (!localStorage.getItem('MODX_widthSideBar')) {
        localStorage.setItem('MODX_widthSideBar', this.config.tree_width)
      }
      //this.tree.init();
      this.mainMenu.init();
      if (w.location.hash) {
        if (w.location.hash === '#?a=2') {
          w.history.replaceState(null, d.title, modx.MODX_MANAGER_URL)
        } else if (modx.main.getQueryVariable('a', w.location.hash.substring(2)) || modx.main.getQueryVariable('filemanager', w.location.hash.substring(2))) {
          var url = modx.main.getQueryVariable('filemanager', w.location.hash.substring(2)) ? modx.MODX_MANAGER_URL + modx.main.getQueryVariable('filemanager', w.location.hash.substring(2)) + w.location.hash.replace('#?', '?') : w.location.href.replace('#?', '?');
          if (modx.config.global_tabs) {
            modx.tabs({url: url, title: 'blank'})
          } else {
            w.main.frameElement.src = url
          }
        }
      }
      this.resizer.init();
      this.search.init();
      if (this.config.session_timeout > 0) {
        w.setInterval(this.keepMeAlive, 1000 * 60 * this.config.session_timeout);
      }
      if (modx.config.mail_check_timeperiod > 0 && modx.permission.messages) {
        setTimeout('modx.updateMail(true)', 1000)
      }
      d.addEventListener('click', modx.hideDropDown, false);
      d.addEventListener('click', modx.tabsInit, false);
    },
    mainMenu: {
      id: 'mainMenu',
      init: function() {
        //console.log('modx.mainMenu.init()');
        var $mm = $('#mainMenu'), mm = d.getElementById('mainMenu'), timer;
        $mm.on('click', 'a', function(e) {
          if ($(this).hasClass('dropdown-toggle')) {
            if ($mm.hasClass('show') && ($(this).hasClass('selected') || (!modx.isMobile && $(this).parent().hasClass('hover')))) {
              $(this).removeClass('selected');
              $mm.removeClass('show')
            } else {
              $('.nav > li > a:not(:hover)').removeClass('selected');
              $(this).addClass('selected');
              $mm.addClass('show')
            }
            e.target.dataset.toggle = '#mainMenu'
          }
          if ($(this).closest('ul').hasClass('dropdown-menu')) {
            $('.nav > .active').removeClass('active');
            $('.nav li.selected').removeClass('selected');
            $(this).closest('.nav > li').addClass('active');
            this.parentNode.classList.add('selected');
            if (this.offsetParent.id) {
              d.getElementById(this.offsetParent.id.substr(7)).classList.add('selected')
            }
          }
        }).on('mouseenter', '.nav > li', function() {
          var els = mm.querySelectorAll('.nav > li.hover:not(:hover)');
          for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('hover');
          }
          this.classList.add('hover')
        }).on('mouseenter', '.nav > li li', function(e) {
          var self = this, ul;
          var els = mm.querySelectorAll('.nav > li li.hover:not(:hover)');
          for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('hover');
          }
          this.classList.add('hover');
          clearTimeout(timer);
          if (this.offsetParent.offsetParent.querySelector('.sub-menu')) {
            ul = this.offsetParent.offsetParent.querySelector('.sub-menu')
          } else {
            ul = d.createElement('ul');
            ul.className = 'sub-menu dropdown-menu';
            ul.style.left = this.offsetWidth + 'px';
            this.parentNode.parentNode.appendChild(ul)
          }
          timer = setTimeout(function() {
            if (d.querySelector('.nav .sub-menu.show')) {
              d.querySelector('.nav .sub-menu.show').classList.remove('show')
            }
            if (self.classList.contains('toggle-dropdown')) {
              if (ul.id === 'parent_' + self.id) {
                ul.classList.add('show');
              } else {
                ul.classList.remove('show');
                timer = setTimeout(function() {
                  var href = self.firstElementChild.href && self.firstElementChild.target === 'main' ? self.firstElementChild.href.split('?')[1] + '&elements=' + self.id : '';
                  modx.post(modx.MODX_MANAGER_URL + 'media/style/' + modx.config.theme + '/ajax.php', href, function(data) {
                    if (data) {
                      ul.id = 'parent_' + self.id;
                      ul.innerHTML = data;
                      var id = w.location.hash.substr(2).replace(/=/g, '_').replace(/&/g, '__');
                      var el = d.getElementById(id);
                      if (el) {
                        el.parentNode.classList.add('selected');
                        d.getElementById(el.parentNode.parentNode.id.substr(7)).classList.add('selected')
                      }
                      for (var i = 0; i < ul.children.length; i++) {
                        ul.children[i].onmouseenter = function(e) {
                          clearTimeout(timer);
                          this.offsetParent.querySelector('li.hover').classList.remove('hover');
                          this.classList.add('hover');
                          self.classList.add('hover');
                          e.preventDefault();
                          e.stopPropagation()
                        }
                      }
                      ul.classList.add('show');
                      setTimeout(function() {
                        modx.mainMenu.search(href, ul)
                      }, 200)
                    }
                  })
                }, 85)
              }
            } else {
              if (ul.classList.contains('open')) {
                ul.classList.remove('open');
                setTimeout(function() {
                  ul.parentNode.removeChild(ul)
                }, 100)
              }
            }
          }, 85);
          e.preventDefault()
        })
      },
      search: function(href, ul) {
        var items,
            input = ul.querySelector('input[name=filter]'),
            index = -1,
            el = null;
        if (input) {
          input.focus();
          input.onkeyup = function(e) {
            if (e.keyCode === 13 && ul.querySelector('.item.hover')) {
              d.body.click();
              //w.main.location.href = ul.querySelector('.item.hover').firstChild.href;
              el = ul.querySelector('.item.hover').firstChild;
              modx.tabs({url: el.href, title: el.innerHTML});
            } else if (e.keyCode === 38 || e.keyCode === 40) {
              input.selectionStart = input.value.length;
              items = ul.querySelectorAll('.item');
              if (items.length) {
                if (e.keyCode === 40) {
                  index++;
                } else {
                  index--;
                }
                if (index < 0) {
                  index = -1;
                  el = ul.querySelector('.hover');
                  if (el) el.classList.remove('hover');
                } else if (index > items.length - 1) {
                  index = items.length - 1
                }
                if (index >= 0 && index < items.length) {
                  el = ul.querySelector('.hover');
                  if (el) el.classList.remove('hover');
                  items[index].classList.add('hover');
                }
              }
            } else {
              modx.post(modx.MODX_MANAGER_URL + 'media/style/' + modx.config.theme + '/ajax.php', href + '&filter=' + input.value, function(data) {
                index = -1;
                $('.item', ul).remove();
                $(ul).append(data).on('mouseenter', '.item', function(e) {
                  $(this).addClass('hover').closest('ul').find('li:not(:hover)').removeClass('hover');
                  e.stopPropagation()
                })
              }, 'html')
            }
          }
        }
      }
    },
    search: {
      id: 'searchform',
      idResult: 'searchresult',
      idInput: 'searchid',
      classResult: 'ajaxSearchResults',
      classMask: 'mask',
      timer: 0,
      init: function() {
        this.result = d.getElementById(this.idResult);
        var t = this,
            el = d.getElementById(this.idInput),
            r = d.createElement('i');
        r.className = 'fa fa-refresh fa-spin fa-fw';
        el.parentNode.appendChild(r);
        if (modx.config.global_tabs) {
          el.parentNode.onsubmit = function(e) {
            e.preventDefault();
            this.target = 'mainsearch';
            modx.tabs({url: this.action, title: 'Search', name: 'mainsearch'});
            this.submit();
          }
        }
        el.onkeyup = function(e) {
          e.preventDefault();
          clearTimeout(t.timer);
          if (el.value.length !== '' && el.value.length > 2) {
            t.timer = setTimeout(function() {
              var xhr = modx.XHR();
              xhr.open('GET', modx.MODX_MANAGER_URL + '?a=71&ajax=1&submitok=Search&searchid=' + el.value, true);
              xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
              xhr.onload = function() {
                if (this.status === 200) {
                  r.style.display = 'none';
                  var div = d.createElement('div');
                  div.innerHTML = this.responseText;
                  var o = div.getElementsByClassName(t.classResult)[0];
                  if (o) {
                    if (o.innerHTML !== '') {
                      t.result.innerHTML = o.outerHTML;
                      t.open();
                      t.result.onclick = function(e) {
                        if (e.target.tagName === 'I') {
                          modx.openWindow({
                            title: e.target.parentNode.innerText,
                            id: e.target.parentNode.id,
                            url: e.target.parentNode.href
                          });
                          return false
                        }
                        var p = (e.target.tagName === 'A' && e.target) || e.target.parentNode;
                        if (p.tagName === 'A') {
                          var el = t.result.querySelector('.selected');
                          if (el) el.className = '';
                          p.className = 'selected';
                          if (modx.isMobile) t.close()
                        }
                      }
                    } else {
                      t.empty()
                    }
                  } else {
                    t.empty()
                  }
                }
              };
              xhr.onloadstart = function() {
                r.style.display = 'block'
              };
              xhr.onerror = function() {
                console.warn(this.status)
              };
              xhr.send()
            }, 300)
          } else {
            t.empty()
          }
        };
        if (modx.isMobile) {
          el.onblur = function() {
            t.close()
          }
        }
        el.onfocus = function() {
          t.open()
        };
        el.onclick = function() {
          t.open()
        };
        el.onmouseenter = function() {
          t.open()
        };
        this.result.onmouseover = function() {
          t.open()
        };
        this.result.onmouseout = function() {
          t.close()
        };
        d.getElementById(this.id).getElementsByClassName(this.classMask)[0].onmouseenter = function() {
          t.open()
        };
        d.getElementById(this.id).getElementsByClassName(this.classMask)[0].onmouseout = function() {
          t.close()
        }
      },
      open: function() {
        if (this.result.getElementsByClassName(this.classResult)[0]) {
          this.result.classList.add('open')
        }
      },
      close: function() {
        this.result.classList.remove('open')
      },
      empty: function() {
        this.result.classList.remove('open');
        this.result.innerHTML = ''
      }
    },
    main: {
      id: 'main',
      idFrame: 'mainframe',
      as: null,
      onload: function(e) {
        w.main = e.target.contentWindow;
        modx.main.tabRow.init();
        modx.main.stopWork();
        modx.main.scrollWork();
        modx.tree.restoreTree();
        w.main.document.addEventListener('contextmenu', modx.main.oncontextmenu, false);
        w.main.document.addEventListener('click', modx.hideDropDown, false);
        w.main.document.addEventListener('click', modx.tabsInit, false);
        w.history.replaceState(null, d.title, (w.main.location.search === '?a=2' ? modx.MODX_MANAGER_URL : '#' + w.main.location.search));
      },
      oncontextmenu: function(e) {
        if (e.ctrlKey) return;
        var el = e.target;
        if (/modxtv|modxplaceholder|modxattributevalue|modxchunk|modxsnippet|modxsnippetnocache/i.test(el.className)) {
          var id = Date.now(),
              name = el.innerText.replace(/[\[|\]|{|}|\*||\#|\+|?|\!|&|=|`]/g, ''),
              type = el.className.replace(/cm-modx/, ''),
              n = !!name.replace(/^\d+$/, '');
          if (name && n) {
            e.preventDefault();
            modx.post(modx.MODX_MANAGER_URL + 'media/style/' + modx.config.theme + '/ajax.php', {
              a: 'modxTagHelper',
              name: name,
              type: type
            }, function(r) {
              if (r) {
                r = JSON.parse(r);
                if (r.item.url) {
                  if (modx.config.global_tabs) {
                    r.item.onclick = 'if(event.shiftKey){modx.openWindow({url:\'' + r.item.url + '\'})}else{modx.popup({url:\'' + r.item.url + '\',width:\'95%\',height:\'95%\',margin:0,hide:0,hover:0,overlay:1,overlayclose:1,position:\'center elements\',wrap:\'evo-tab-page-' + modx.urlToUid(w.location.hash) + '\'})}';
                  } else {
                    r.item.onclick = 'if(event.shiftKey){modx.openWindow({url:\'' + r.item.url + '\'})}else{modx.popup({url:\'' + r.item.url + '\',width:\'95%\',height:\'95%\',margin:0,hide:0,hover:0,overlay:1,overlayclose:1,position:\'center elements\',wrap:\'main\'})}';
                  }
                }
                r = JSON.stringify(r);
                el.id = 'node' + id;
                el.dataset.contextmenu = r;
                modx.tree.showPopup(e, id, name)
              }
            })
          }
          e.preventDefault()
        }
      },
      tabRow: {
        init: function() {
          var row = w.main.document.querySelector('.tab-pane > .tab-row');
          if (row) this.build(row);
        },
        build: function(row) {
          var rowContainer = d.createElement('div'),
              sel = row.querySelector('.selected');
          rowContainer.className = 'tab-row-container';
          row.parentNode.insertBefore(rowContainer, row);
          rowContainer.appendChild(row);
          var p = d.createElement('i');
          p.className = 'fa fa-angle-left prev disable';
          p.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            var sel = row.querySelector('.selected');
            if (sel.previousSibling) {
              sel.previousSibling.click();
              modx.main.tabRow.scroll(row)
            }
          };
          rowContainer.appendChild(p);
          var n = d.createElement('i');
          n.className = 'fa fa-angle-right next disable';
          n.onclick = function(e) {
            e.stopPropagation();
            e.preventDefault();
            var sel = row.querySelector('.selected');
            if (sel.nextSibling) {
              sel.nextSibling.click();
              modx.main.tabRow.scroll(row)
            }
          };
          rowContainer.appendChild(n);
          setTimeout(function() {
            sel = row.querySelector('.selected');
            modx.main.tabRow.scroll(row, sel);
            w.main.onresize = function() {
              modx.main.tabRow.scroll(row);
            };
            if (sel) {
              if (sel.previousSibling) p.classList.remove('disable');
              if (sel.nextSibling) n.classList.remove('disable');
            }
          }, 100);
          row.onclick = function(e) {
            var sel = e.target.tagName === 'H2' ? e.target : (e.target.tagName === 'SPAN' ? e.target.parentNode : null);
            if (sel) {
              if (sel.previousSibling) {
                this.parentNode.querySelector('i.prev').classList.remove('disable');
              } else {
                this.parentNode.querySelector('i.prev').classList.add('disable');
              }
              if (sel.nextSibling) {
                this.parentNode.querySelector('i.next').classList.remove('disable');
              } else {
                this.parentNode.querySelector('i.next').classList.add('disable');
              }
              modx.main.tabRow.scroll(this, sel)
            }
          }
        },
        scroll: function(row, sel) {
          sel = sel || row.querySelector('.selected') || row.firstChild
          var c = 0,
              elms = row.childNodes,
              p = row.offsetParent.querySelector('.prev'),
              n = row.offsetParent.querySelector('.next');
          for (var i = 0; i < elms.length; i++) {
            c += elms[i].offsetWidth;
          }
          if (row.scrollLeft > sel.offsetLeft) {
            $(row).animate({
              scrollLeft: sel.offsetLeft - (sel.previousSibling ? 30 : 1)
            }, 100)
          }
          if (sel.offsetLeft + sel.offsetWidth > row.offsetWidth + row.scrollLeft) {
            $(row).animate({
              scrollLeft: (sel.offsetLeft - row.offsetWidth + sel.offsetWidth) + (sel.nextSibling ? 30 : 0)
            }, 100)
          }
          if (c > row.offsetWidth) {
            this.drag(row)
          }
        },
        drag: function(row) {
          row.onmousedown = function(e) {
            if (e.button === 0) {
              e.preventDefault();
              var x = e.clientX,
                  f = row.scrollLeft;
              row.ownerDocument.body.focus();
              row.onmousemove = row.ownerDocument.onmousemove = function(e) {
                if (Math.abs(e.clientX - x) > 5) {
                  e.stopPropagation();
                  row.scrollLeft = f - (e.clientX - x);
                  row.ownerDocument.body.classList.add('drag')
                }
              };
              row.onmouseup = row.ownerDocument.onmouseup = function(e) {
                e.stopPropagation();
                row.onmousemove = null;
                row.ownerDocument.onmousemove = null;
                row.ownerDocument.body.classList.remove('drag')
              }
            }
          }
        }
      },
      work: function() {
        d.getElementById('mainloader').classList.add('show')
      },
      stopWork: function() {
        d.getElementById('mainloader').classList.remove('show')
      },
      scrollWork: function() {
        var a = w.main.frameElement.contentWindow,
            b = localStorage.getItem('page_y'),
            c = localStorage.getItem('page_url');
        if (b === u) {
          localStorage.setItem('page_y', 0)
        }
        if (c === null) {
          c = a.location.search.substring(1)
        }
        if ((modx.main.getQueryVariable('a', c) === modx.main.getQueryVariable('a', a.location.search.substring(1))) && (modx.main.getQueryVariable('id', c) === modx.main.getQueryVariable('id', a.location.search.substring(1)))) {
          a.scrollTo(0, b)
        }
        a.onscroll = function() {
          if (a.pageYOffset > 0) {
            localStorage.setItem('page_y', a.pageYOffset);
            localStorage.setItem('page_url', a.location.search.substring(1))
          }
        }
      },
      getQueryVariable: function(v, q) {
        var vars = q.split('&');
        for (var i = 0; i < vars.length; i++) {
          var p = vars[i].split('=');
          if (decodeURIComponent(p[0]) === v) {
            return decodeURIComponent(p[1])
          }
        }
      }
    },
    resizer: {
      dragElement: null,
      oldZIndex: 99,
      newZIndex: 999,
      left: modx.config.tree_width,
      id: 'resizer',
      switcher: 'hideMenu',
      background: 'rgba(0, 0, 0, 0.1)',
      mask: null,
      init: function() {
        modx.resizer.mask = d.createElement('div');
        modx.resizer.mask.id = 'mask_resizer';
        modx.resizer.mask.style.zIndex = modx.resizer.oldZIndex;
        d.getElementById(modx.resizer.id).onmousedown = modx.resizer.onMouseDown;
        d.getElementById(modx.resizer.id).onmouseup = modx.resizer.mask.onmouseup = modx.resizer.onMouseUp;
        if (modx.isMobile) {
          var x, y, tree = d.getElementById('tree'), h = tree.offsetWidth;
          d.getElementById('frameset').appendChild(modx.resizer.mask);
          w.addEventListener('touchstart', function(e) {
            if (!(/tab|tab\-row|tab\-row\-container/.test(e.target.className || e.target.offsetParent.className))) {
              x = e.changedTouches[0].clientX;
              y = e.changedTouches[0].clientY;
              this.swipe = true;
              this.sidebar = !d.body.classList.contains('sidebar-closed');
            } else {
              this.swipe = false;
            }
          }, false);
          w.addEventListener('touchmove', function(e) {
            var touch = e.changedTouches[0];
            tree.style.transition = 'none';
            tree.style.WebkitTransition = 'none';
            modx.resizer.mask.style.transition = 'none';
            modx.resizer.mask.style.WebkitTransition = 'none';
            modx.resizer.mask.style.visibility = 'visible';
            var ax = touch.clientX - x;
            var ay = touch.clientY - y;
            if ((Math.abs(ax) > Math.abs(ay)) && this.swipe) {
              if (ax < 0 && this.sidebar) {
                if (Math.abs(ax) > h) ax = -h;
                tree.style.transform = 'translate3d(' + ax + 'px, 0, 0)';
                tree.style.WebkitTransform = 'translate3d(' + ax + 'px, 0, 0)';
                modx.resizer.mask.style.opacity = (0.5 - (0.5 / -h) * ax).toFixed(2);
                if (Math.abs(ax) > h / 3) {
                  this.swipe = 'left'
                } else {
                  this.swipe = 'right'
                }
              } else if (ax > 0 && !this.sidebar) {
                if (Math.abs(ax) > h) ax = h;
                tree.style.transform = 'translate3d(' + -(h - ax) + 'px, 0, 0)';
                tree.style.WebkitTransform = 'translate3d(' + -(h - ax) + 'px, 0, 0)';
                modx.resizer.mask.style.opacity = ((0.5 / h) * ax).toFixed(2);
                if (Math.abs(ax) > h / 3) {
                  this.swipe = 'right'
                } else {
                  this.swipe = 'left'
                }
              }
            }
          }, false);
          w.addEventListener('touchend', function(e) {
            if (this.swipe === 'left') {
              d.body.classList.add('sidebar-closed');
              modx.resizer.setWidth(0)
            }
            if (this.swipe === 'right') {
              d.body.classList.remove('sidebar-closed');
              modx.resizer.setWidth(h)
            }
            tree.style.cssText = '';
            modx.resizer.mask.style.cssText = '';
          }, false)
        }
      },
      onMouseDown: function(e) {
        e = e || w.event;
        modx.resizer.dragElement = e.target !== null ? e.target : e.srcElement;
        if ((e.buttons === 1 || e.button === 0) && modx.resizer.dragElement.id === modx.resizer.id) {
          modx.resizer.oldZIndex = modx.resizer.dragElement.style.zIndex;
          modx.resizer.dragElement.style.zIndex = modx.resizer.newZIndex;
          modx.resizer.dragElement.style.background = modx.resizer.background;
          localStorage.setItem('MODX_widthSideBar', (modx.resizer.dragElement.offsetLeft > 0 ? modx.resizer.dragElement.offsetLeft : 0));
          d.body.appendChild(modx.resizer.mask);
          d.onmousemove = modx.resizer.onMouseMove;
          d.body.focus();
          d.body.classList.add('resizer_move');
          d.onselectstart = function() {
            return false
          };
          modx.resizer.dragElement.ondragstart = function() {
            return false
          };
          return false
        }
      },
      onMouseMove: function(e) {
        e = e || w.event;
        if (e.clientX > 0) {
          modx.resizer.left = e.clientX
        } else {
          modx.resizer.left = 0
        }
        modx.resizer.dragElement.style.left = modx.pxToRem(modx.resizer.left) + 'rem';
        d.getElementById('tree').style.width = modx.pxToRem(modx.resizer.left) + 'rem';
        d.getElementById('main').style.left = modx.pxToRem(modx.resizer.left) + 'rem';
        if (e.clientX < -2 || e.clientY < -2) {
          modx.resizer.onMouseUp(e)
        }
      },
      onMouseUp: function(e) {
        if (modx.resizer.dragElement !== null && e.button === 0 && modx.resizer.dragElement.id === modx.resizer.id) {
          if (e.clientX > 0) {
            d.body.classList.remove('sidebar-closed');
            modx.resizer.left = e.clientX
          } else {
            d.body.classList.add('sidebar-closed');
            modx.resizer.left = 0
          }
          d.cookie = 'MODX_widthSideBar=' + modx.pxToRem(modx.resizer.left);
          modx.resizer.dragElement.style.zIndex = modx.resizer.oldZIndex;
          modx.resizer.dragElement.style.background = '';
          modx.resizer.dragElement.ondragstart = null;
          modx.resizer.dragElement = null;
          d.body.classList.remove('resizer_move');
          d.body.removeChild(modx.resizer.mask);
          d.onmousemove = null;
          d.onselectstart = null
        }
      },
      toggle: function() {
        if (modx.isMobile || w.innerWidth <= modx.minWidth) {
          if (d.body.classList.contains('sidebar-closed')) {
            d.body.classList.remove('sidebar-closed');
            localStorage.setItem('MODX_widthSideBar', 0);
            d.cookie = 'MODX_widthSideBar=' + modx.pxToRem(parseInt(d.getElementById('tree').offsetWidth))
          } else {
            localStorage.setItem('MODX_widthSideBar', parseInt(d.getElementById('tree').offsetWidth));
            d.body.classList.add('sidebar-closed');
            d.cookie = 'MODX_widthSideBar=0'
          }
        } else {
          var p = d.getElementById('tree').offsetWidth !== 0 ? 0 : (parseInt(localStorage.getItem('MODX_widthSideBar')) ? parseInt(localStorage.getItem('MODX_widthSideBar')) : modx.config.tree_width);
          modx.resizer.setWidth(p)
        }
      },
      setWidth: function(a) {
        if (a > 0) {
          localStorage.setItem('MODX_widthSideBar', 0);
          d.body.classList.remove('sidebar-closed')
        } else {
          localStorage.setItem('MODX_widthSideBar', parseInt(d.getElementById('tree').offsetWidth));
          d.body.classList.add('sidebar-closed')
        }
        d.cookie = 'MODX_widthSideBar=' + modx.pxToRem(a);
        d.getElementById('tree').style.width = modx.pxToRem(a) + 'rem';
        d.getElementById('resizer').style.left = modx.pxToRem(a) + 'rem';
        d.getElementById('main').style.left = modx.pxToRem(a) + 'rem'
      },
      setDefaultWidth: function() {
        modx.resizer.setWidth(modx.remToPx(modx.config.tree_width))
      }
    },
    tree: {
      ctx: null,
      rpcNode: null,
      itemToChange: null,
      selectedObjectName: null,
      selectedObject: 0,
      selectedObjectDeleted: 0,
      selectedObjectUrl: '',
      drag: false,
      init: function() {
        this.restoreTree()
      },
      draggable: function() {
        if (modx.permission.dragndropdocintree) {
          var els = d.querySelectorAll('#treeRoot a:not(.empty)');
          for (var i = 0; i < els.length; i++) {
            els[i].onmousedown = this.onmousedown;
            els[i].ondragstart = this.ondragstart;
            els[i].ondragenter = this.ondragenter;
            els[i].ondragover = this.ondragover;
            els[i].ondragleave = this.ondragleave;
            els[i].ondrop = this.ondrop;
          }
        }
      },
      onmousedown: function(e) {
        if (e.ctrlKey) {
          this.parentNode.removeAttribute('draggable');
          return;
        } else {
          var roles = this.dataset.roles + (this.parentNode.parentNode.id !== 'treeRoot' ? this.parentNode.parentNode.previousSibling.dataset.roles : '');
          var draggable = (roles && modx.user.role !== 1 ? (roles.split(',').map(Number).indexOf(modx.user.role) > -1) : true);
          if (draggable) {
            this.parentNode.draggable = true;
            modx.tree.itemToChange = this.parentNode.id;
            this.parentNode.ondragstart = modx.tree.ondragstart
          } else {
            this.parentNode.draggable = false;
            this.parentNode.ondragstart = function() {
              return false
            }
          }
        }
      },
      ondragstart: function(e) {
        e.dataTransfer.effectAllowed = 'all';
        e.dataTransfer.dropEffect = 'all';
        e.dataTransfer.setData('text', this.id.substr(4));
      },
      ondragenter: function(e) {
        if (d.getElementById(modx.tree.itemToChange) === (this.parentNode.closest('#' + modx.tree.itemToChange) || this.parentNode)) {
          this.parentNode.className = '';
          e.dataTransfer.effectAllowed = 'none';
          e.dataTransfer.dropEffect = 'none';
          modx.tree.drag = false;
        } else {
          this.parentNode.className = 'dragenter';
          e.dataTransfer.effectAllowed = 'copy';
          e.dataTransfer.dropEffect = 'copy';
          modx.tree.drag = true;
        }
        e.preventDefault();
      },
      ondragover: function(e) {
        if (modx.tree.drag) {
          var a = e.clientY;
          var b = parseInt(this.getBoundingClientRect().top);
          var c = (a - b);
          if (c > this.offsetHeight / 1.51) {
            //this.parentNode.className = 'dragafter';
            this.parentNode.classList.add('dragafter');
            this.parentNode.classList.remove('dragbefore');
            this.parentNode.classList.remove('dragenter');
            e.dataTransfer.effectAllowed = 'link';
            e.dataTransfer.dropEffect = 'link';
          } else if (c < this.offsetHeight / 3) {
            //this.parentNode.className = 'dragbefore';
            this.parentNode.classList.add('dragbefore');
            this.parentNode.classList.remove('dragafter');
            this.parentNode.classList.remove('dragenter');
            e.dataTransfer.effectAllowed = 'link';
            e.dataTransfer.dropEffect = 'link';
          } else {
            //this.parentNode.className = 'dragenter';
            this.parentNode.classList.add('dragenter');
            this.parentNode.classList.remove('dragafter');
            this.parentNode.classList.remove('dragbefore');
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.dropEffect = 'copy';
          }
        } else {
          e.dataTransfer.effectAllowed = 'none';
          e.dataTransfer.dropEffect = 'none';
          modx.tree.drag = false;
        }
        e.preventDefault()
      },
      ondragleave: function(e) {
        this.parentNode.className = '';
        this.parentNode.removeAttribute('draggable');
        e.preventDefault()
      },
      ondrop: function(e) {
        var el = d.getElementById(modx.tree.itemToChange),
            els = null,
            id = modx.tree.itemToChange.substr(4),
            parent = 0,
            menuindex = [],
            level = 0,
            indent = el.firstChild.querySelector('.indent'),
            i = 0;
        indent.innerHTML = '';
        el.removeAttribute('draggable');
        if (this.parentNode.classList.contains('dragenter')) {
          parent = parseInt(this.parentNode.id.substr(4));
          level = parseInt(this.dataset.level) + 1;
          for (i = 0; i < level; i++) {
            indent.innerHTML += '<i></i>';
          }
          if (this.nextSibling) {
            if (this.nextSibling.innerHTML) {
              this.nextSibling.appendChild(el)
            } else {
              el.parentNode.removeChild(el)
            }
            els = this.parentNode.lastChild.children;
            for (i = 0; i < els.length; i++) {
              menuindex[i] = els[i].id.substr(4);
            }
          } else {
            el.parentNode.removeChild(el);
            d.querySelector('#node' + parent + ' .icon').innerHTML = (parseInt(this.dataset.private) ? modx.style.tree_folder_secure : modx.style.tree_folder)
          }
          modx.tree.ondragupdate(this, id, parent, menuindex)
        }
        if (this.parentNode.classList.contains('dragafter')) {
          parent = /node/.test(this.parentNode.parentNode.parentNode.id) ? parseInt(this.parentNode.parentNode.parentNode.id.substr(4)) : 0;
          level = parseInt(this.dataset.level);
          for (i = 0; i < level; i++) {
            indent.innerHTML += '<i></i>';
          }
          this.parentNode.parentNode.insertBefore(el, this.parentNode.nextSibling);
          els = this.parentNode.parentNode.children;
          for (i = 0; i < els.length; i++) {
            menuindex[i] = els[i].id.substr(4);
          }
          modx.tree.ondragupdate(this, id, parent, menuindex)
        }
        if (this.parentNode.classList.contains('dragbefore')) {
          parent = /node/.test(this.parentNode.parentNode.parentNode.id) ? parseInt(this.parentNode.parentNode.parentNode.id.substr(4)) : 0;
          level = parseInt(this.dataset.level);
          for (i = 0; i < level; i++) {
            indent.innerHTML += '<i></i>';
          }
          this.parentNode.parentNode.insertBefore(el, this.parentNode);
          els = this.parentNode.parentNode.children;
          for (i = 0; i < els.length; i++) {
            menuindex[i] = els[i].id.substr(4);
          }
          modx.tree.ondragupdate(this, id, parent, menuindex)
        }
        this.parentNode.removeAttribute('class');
        this.parentNode.removeAttribute('draggable');
        e.preventDefault();
      },
      ondragupdate: function(a, id, parent, menuindex) {
        var roles = a.dataset.roles + (a.parentNode.parentNode.id !== 'treeRoot' ? a.parentNode.parentNode.previousSibling.dataset.roles : '');
        if (!(roles && modx.user.role !== 1 ? (roles.split(',').map(Number).indexOf(modx.user.role) > -1) : true)) {
          alert(modx.lang.error_no_privileges);
          modx.tree.restoreTree();
          return;
        }
        modx.post(modx.MODX_MANAGER_URL + 'media/style/' + modx.config.theme + '/ajax.php', {
          a: 'movedocument',
          id: id,
          parent: parent,
          menuindex: menuindex
        }, function(r) {
          if (r.errors) alert(r.errors);
          modx.tree.restoreTree();
        }, 'json');
        var b = w.main.frameElement.contentWindow.location.search.substr(1);
        if (parseInt(modx.main.getQueryVariable('a', b)) === 27 && parseInt(modx.main.getQueryVariable('id', b)) === parseInt(id)) {
          var index = menuindex.indexOf(id),
              elMenuIndex = w.main.document.querySelector('#documentPane input[name=menuindex]'),
              elParent = w.main.document.querySelector('#documentPane input[name=parent]'),
              elParentName = w.main.document.querySelector('#documentPane #parentName');
          if (elMenuIndex && index >= 0) elMenuIndex.value = index;
          if (elParent && elParentName) {
            elParent.value = parent;
            elParentName.innerHTML = parent + ' (' + d.querySelector('#node' + parent + ' > a').dataset.titleEsc + ')'
          }
        }
      },
      toggleTheme: function(e) {
        var myCodeMirrors = w.main.myCodeMirrors, key;
        if (d.body.classList.contains('dark')) {
          d.body.classList.remove('dark');
          w.main.document.body.classList.remove('dark');
          d.cookie = 'MODX_themeColor=';
          if (myCodeMirrors) {
            for (key in myCodeMirrors) {
              if (myCodeMirrors.hasOwnProperty(key)) {
                w.main.document.getElementsByName(key)[0].nextElementSibling.classList.remove('cm-s-' + myCodeMirrors[key].options.darktheme);
                w.main.document.getElementsByName(key)[0].nextElementSibling.classList.add('cm-s-' + myCodeMirrors[key].options.defaulttheme)
              }
            }
          }
        } else {
          d.body.classList.add('dark');
          w.main.document.body.classList.add('dark');
          d.cookie = 'MODX_themeColor=dark';
          if (myCodeMirrors) {
            for (key in myCodeMirrors) {
              if (myCodeMirrors.hasOwnProperty(key)) {
                w.main.document.getElementsByName(key)[0].nextElementSibling.classList.add('cm-s-' + myCodeMirrors[key].options.darktheme);
                w.main.document.getElementsByName(key)[0].nextElementSibling.classList.remove('cm-s-' + myCodeMirrors[key].options.defaulttheme)
              }
            }
          }
        }
      },
      toggleNode: function(e, id) {
        e = e || w.event;
        if (e.ctrlKey) return;
        e.stopPropagation();
        var el = d.getElementById('node' + id).firstChild;
        this.rpcNode = el.nextSibling;
        var toggle = el.querySelector('.toggle'),
            icon = el.querySelector('.icon');
        if (this.rpcNode.innerHTML === '') {
          if (toggle) toggle.innerHTML = el.dataset.iconCollapsed;
          icon.innerHTML = el.dataset.iconFolderOpen;
          var rpcNodeText = this.rpcNode.innerHTML,
              loadText = modx.lang.loading_doc_tree;
          modx.openedArray[id] = 1;
          if (rpcNodeText === '' || rpcNodeText.indexOf(loadText) > 0) {
            var folderState = this.getFolderState();
            d.getElementById('treeloader').classList.add('visible');
            modx.get(modx.MODX_MANAGER_URL + '?a=1&f=nodes&indent=' + el.dataset.indent + '&parent=' + id + '&expandAll=' + el.dataset.expandall + folderState, function(r) {
              modx.tree.rpcLoadData(r);
              modx.tree.draggable()
            })
          }
          this.saveFolderState()
        } else {
          if (toggle) toggle.innerHTML = el.dataset.iconExpanded;
          icon.innerHTML = el.dataset.iconFolderClose;
          delete modx.openedArray[id];
          this.rpcNode.style.overflow = 'hidden';
          $(this.rpcNode.firstChild).animate({
            marginTop: -this.rpcNode.offsetHeight + 'px'
          }, 100, function() {
            this.parentNode.innerHTML = '';
          });
          this.saveFolderState()
        }
        e.preventDefault()
      },
      rpcLoadData: function(a) {
        if (this.rpcNode !== null) {
          var el;
          this.rpcNode.innerHTML = typeof a === 'object' ? a.responseText : a;
          this.rpcNode.loaded = true;
          if (this.rpcNode.firstChild.tagName === 'DIV') {
            if (this.rpcNode.id === 'treeRoot') {
              el = d.getElementById('binFull');
              if (el) {
                this.showBin(true);
              } else {
                this.showBin(false)
              }
            } else {
              this.rpcNode.style.overflow = 'hidden';
              this.rpcNode.firstElementChild.style.marginTop = -this.rpcNode.offsetHeight + 'px'
              $(this.rpcNode.firstChild).animate({
                marginTop: 0
              }, 100);
            }
            d.getElementById('treeloader').classList.remove('visible');
          } else {
            el = d.getElementById('loginfrm');
            if (el) {
              this.rpcNode.parentNode.removeChild(this.rpcNode);
              w.location.href = modx.MODX_MANAGER_URL
            }
          }
        }
      },
      treeAction: function(e, id, title) {
        if (e.ctrlKey) return;
        var el = d.getElementById('node' + id).firstChild,
            treepageclick = el.dataset.treepageclick,
            showchildren = parseInt(el.dataset.showchildren),
            openfolder = parseInt(el.dataset.openfolder);
        title = title || (el.dataset && el.dataset.titleEsc);
        if (tree.ca === 'move') {
          try {
            this.setSelectedByContext(id);
            w.main.setMoveValue(id, title)
          } catch (oException) {
            alert(modx.lang.unable_set_parent)
          }
        }
        if (tree.ca === 'open' || tree.ca === '') {
          if (id === 0) {
            href = '?a=2'
          } else {
            var href = '';
            if (!isNaN(treepageclick) && isFinite(treepageclick)) {
              href = '?a=' + treepageclick + '&r=1&id=' + id + (openfolder === 0 ? this.getFolderState() : '')
            } else {
              href = treepageclick;
            }
            if (openfolder === 2) {
              if (showchildren !== 1) {
                href = '';
              }
              this.toggleNode(e, id)
            }
          }
          if (href) {
            if (e.shiftKey) {
              w.getSelection().removeAllRanges();
              modx.openWindow(href);
              this.restoreTree()
            } else {
              modx.tabs({url: modx.MODX_MANAGER_URL + href, title: title + '<small>(' + id + ')</small>'});
              if (modx.isMobile) modx.resizer.toggle()
            }
          }
          this.itemToChange = id;
          this.setSelected(id)
        }
        if (tree.ca === 'parent') {
          try {
            this.setSelectedByContext(id);
            w.main.setParent(id, title)
          } catch (oException) {
            alert(modx.lang.unable_set_parent)
          }
        }
        if (tree.ca === 'link') {
          try {
            this.setSelectedByContext(id);
            w.main.setLink(id)
          } catch (oException) {
            alert(modx.lang.unable_set_link)
          }
        }
        e.preventDefault();
      },
      showPopup: function(e, id, title) {
        if (e.ctrlKey) return;
        e.preventDefault();
        var tree = d.getElementById('tree'),
            el = d.getElementById('node' + id) || e.target;
        if (el.firstChild && el.firstChild.dataset && el.firstChild.dataset.contextmenu) {
          el = el.firstChild;
        }
        if (el) {
          if (el.dataset.contextmenu) {
            e.target.dataset.toggle = '#contextmenu';
            modx.hideDropDown(e);
            this.ctx = d.createElement('div');
            this.ctx.id = 'contextmenu';
            this.ctx.className = 'dropdown-menu';
            d.getElementById(modx.frameset).appendChild(this.ctx);
            this.setSelectedByContext(id);
            var dataJson = JSON.parse(el.dataset.contextmenu);
            for (var key in dataJson) {
              if (dataJson.hasOwnProperty(key)) {
                var item = d.createElement('div');
                for (var k in dataJson[key]) {
                  if (dataJson[key].hasOwnProperty(k)) {
                    if (k.substring(0, 2) === 'on') {
                      var onEvent = dataJson[key][k];
                      item[k] = function(onEvent) {
                        return function() {
                          eval(onEvent)
                        }
                      }(onEvent)
                    } else {
                      item[k] = dataJson[key][k]
                    }
                  }
                }
                if (key.indexOf('header') === 0) item.className += ' menuHeader';
                if (key.indexOf('item') === 0) item.className += ' menuLink';
                if (key.indexOf('seperator') === 0 || key.indexOf('separator') === 0) item.className += ' seperator separator';
                this.ctx.appendChild(item)
              }
            }
            var x = e.clientX > 0 ? e.clientX : e.pageX;
            var y = e.clientY > 0 ? e.clientY : e.pageY;
            e.view.position = e.view.frameElement ? e.view.frameElement.getBoundingClientRect() : e.target.offsetParent.getBoundingClientRect();
            if (e.view.frameElement) {
              x += e.view.position.left;
              y += e.view.frameElement.offsetParent.offsetTop
            } else {
              if (e.target.parentNode.parentNode.classList.contains('node')) {
                x += 50;
              }
            }
            if (x > e.view.position.width) {
              x = e.view.position.width - this.ctx.offsetWidth;
            }
            if (y + this.ctx.offsetHeight / 2 > e.view.position.height) {
              y = e.view.position.height - this.ctx.offsetHeight - 5
            } else if (y - this.ctx.offsetHeight / 2 < e.view.position.top) {
              y = e.view.position.top + 5
            } else {
              y = y - (this.ctx.offsetHeight / 2)
            }
            this.itemToChange = id;
            this.selectedObjectName = title;
            this.dopopup(this.ctx, x + 10, y)
          } else {
            el = el.firstChild;
            var ctx = d.getElementById('mx_contextmenu');
            e.target.dataset.toggle = '#mx_contextmenu';
            modx.hideDropDown(e);
            this.setSelectedByContext(id);
            var i4 = d.getElementById('item4'),
                i5 = d.getElementById('item5'),
                i8 = d.getElementById('item8'),
                i9 = d.getElementById('item9'),
                i10 = d.getElementById('item10'),
                i11 = d.getElementById('item11');
            if (modx.permission.publish_document === 1) {
              i9.style.display = 'block';
              i10.style.display = 'block';
              if (parseInt(el.dataset.published) === 1) {
                i9.style.display = 'none';
              } else {
                i10.style.display = 'none'
              }
            } else {
              i5.style.display = 'none'
            }
            if (modx.permission.delete_document === 1) {
              i4.style.display = 'block';
              i8.style.display = 'block';
              if (parseInt(el.dataset.deleted) === 1) {
                i4.style.display = 'none';
                i9.style.display = 'none';
                i10.style.display = 'none'
              } else {
                i8.style.display = 'none'
              }
            }
            if (parseInt(el.dataset.isfolder) === 1) {
              i11.style.display = 'block';
            } else {
              i11.style.display = 'none';
            }
            var bodyHeight = tree.offsetHeight + tree.offsetTop;
            var x = e.clientX > 0 ? e.clientX : e.pageX;
            var y = e.clientY > 0 ? e.clientY : e.pageY;
            if (y + ctx.offsetHeight / 2 > bodyHeight) {
              y = bodyHeight - ctx.offsetHeight - 5
            } else if (y - ctx.offsetHeight / 2 < tree.offsetTop) {
              y = tree.offsetTop + 5
            } else {
              y = y - ctx.offsetHeight / 2
            }
            if (e.target.parentNode.parentNode.classList.contains('node')) x += 50;
            this.itemToChange = id;
            this.selectedObjectName = title;
            this.dopopup(ctx, x + 10, y)
          }
          e.stopPropagation()
        }
      },
      dopopup: function(el, a, b) {
        if (this.selectedObjectName.length > 30) {
          this.selectedObjectName = this.selectedObjectName.substr(0, 30) + '...'
        }
        var f = d.getElementById('nameHolder');
        f.innerHTML = this.selectedObjectName;
        el.style.left = a + (modx.config.textdir ? '-190' : '') + 'px';
        el.style.top = b + 'px';
        setTimeout(function() {
          el.classList.add('show')
        }, 150)
      },
      menuHandler: function(a) {
        switch (a) {
          case 1:
            this.setActiveFromContextMenu(this.itemToChange);
            modx.tabs({url: modx.MODX_MANAGER_URL + '?a=3&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            break;
          case 2:
            this.setActiveFromContextMenu(this.itemToChange);
            modx.tabs({url: modx.MODX_MANAGER_URL + '?a=27&r=1&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            break;
          case 3:
            modx.tabs({url: modx.MODX_MANAGER_URL + '?a=4&pid=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            break;
          case 4:
            if (this.selectedObjectDeleted) {
              alert('\'' + this.selectedObjectName + '\' ' + modx.lang.already_deleted)
            } else if (confirm('\'' + this.selectedObjectName + '\'\n\n' + modx.lang.confirm_delete_resource) === true) {
              modx.tabs({url: modx.MODX_MANAGER_URL + '?a=6&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            }
            break;
          case 5:
            this.setActiveFromContextMenu(this.itemToChange);
            modx.tabs({url: modx.MODX_MANAGER_URL + '?a=51&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            break;
          case 6:
            modx.tabs({url: modx.MODX_MANAGER_URL + '?a=72&pid=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            break;
          case 7:
            if (confirm(modx.lang.confirm_resource_duplicate) === true) {
              modx.tabs({url: modx.MODX_MANAGER_URL + '?a=94&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            }
            break;
          case 8:
            if (d.getElementById('node' + this.itemToChange).firstChild.dataset.deleted) {
              if (confirm('\'' + this.selectedObjectName + '\' ' + modx.lang.confirm_undelete) === true) {
                modx.tabs({url: modx.MODX_MANAGER_URL + '?a=63&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
              }
            } else {
              alert('\'' + this.selectedObjectName + '\'' + modx.lang.not_deleted)
            }
            break;
          case 9:
            if (confirm('\'' + this.selectedObjectName + '\' ' + modx.lang.confirm_publish) === true) {
              modx.tabs({url: modx.MODX_MANAGER_URL + '?a=61&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            }
            break;
          case 10:
            if (this.itemToChange !== modx.config.site_start) {
              if (confirm('\'' + this.selectedObjectName + '\' ' + modx.lang.confirm_unpublish) === true) {
                modx.tabs({url: modx.MODX_MANAGER_URL + '?a=62&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
              }
            } else {
              alert('Document is linked to site_start variable and cannot be unpublished!')
            }
            break;
          case 11:
            modx.tabs({url: modx.MODX_MANAGER_URL + '?a=56&id=' + this.itemToChange, title: this.selectedObjectName + '<small>(' + this.itemToChange + ')</small>'});
            break;
          case 12:
            w.open(d.getElementById('node' + this.itemToChange).firstChild.dataset.href, 'previeWin');
            break;
          default:
            alert('Unknown operation command.')
        }
      },
      setSelected: function(a) {
        var el = d.querySelector('#treeRoot .current');
        if (el) el.classList.remove('current');
        if (a) {
          if (typeof a === 'number') {
            var el = d.querySelector('#node' + a + '>.node');
            if (el) el.classList.add('current')
          } else {
            a.classList.add('current')
          }
        }
      },
      setActiveFromContextMenu: function(a) {
        var el = d.querySelector('#node' + a + '>.node');
        if (el) this.setSelected(el)
      },
      setSelectedByContext: function(a) {
        var el = d.querySelector('#treeRoot .selected');
        if (el) el.classList.remove('selected');
        el = d.querySelector('#node' + a + '>.node');
        if (el) el.classList.add('selected');
      },
      setItemToChange: function() {
        var a = w.main.document && w.main.document.location.search.substring(1);
        if (a && (parseInt(modx.main.getQueryVariable('a', a)) === 3 || parseInt(modx.main.getQueryVariable('a', a)) === 27 || parseInt(modx.main.getQueryVariable('a', a)) === 51 || parseInt(modx.main.getQueryVariable('a', a)) === 56)) {
          this.itemToChange = parseInt(modx.main.getQueryVariable('id', a))
        } else {
          this.itemToChange = null
        }
        this.setSelected(this.itemToChange)
      },
      restoreTree: function() {
        //console.log('modx.tree.restoreTree()');
        d.getElementById('treeloader').classList.add('visible');
        this.setItemToChange();
        this.rpcNode = d.getElementById('treeRoot');
        modx.get(modx.MODX_MANAGER_URL + '?a=1&f=nodes&indent=1&parent=0&expandAll=2&id=' + this.itemToChange, function(r) {
          modx.tree.rpcLoadData(r);
          modx.tree.draggable()
        })
      },
      expandTree: function() {
        this.rpcNode = d.getElementById('treeRoot');
        d.getElementById('treeloader').classList.add('visible');
        modx.get(modx.MODX_MANAGER_URL + '?a=1&f=nodes&indent=1&parent=0&expandAll=1&id=' + this.itemToChange, function(r) {
          modx.tree.rpcLoadData(r);
          modx.tree.saveFolderState();
          modx.tree.draggable()
        })
      },
      collapseTree: function() {
        this.rpcNode = d.getElementById('treeRoot');
        d.getElementById('treeloader').classList.add('visible');
        modx.get(modx.MODX_MANAGER_URL + '?a=1&f=nodes&indent=1&parent=0&expandAll=0&id=' + this.itemToChange, function(r) {
          modx.openedArray = [];
          modx.tree.saveFolderState();
          modx.tree.rpcLoadData(r);
          modx.tree.draggable()
        })
      },
      updateTree: function() {
        this.rpcNode = d.getElementById('treeRoot');
        d.getElementById('treeloader').classList.add('visible');
        var a = d.sortFrm;
        var b = '?a=1&f=nodes&indent=1&parent=0&expandAll=2&dt=' + a.dt.value + '&tree_sortby=' + a.sortby.value + '&tree_sortdir=' + a.sortdir.value + '&tree_nodename=' + a.nodename.value + '&id=' + this.itemToChange + '&showonlyfolders=' + a.showonlyfolders.value;
        modx.get(modx.MODX_MANAGER_URL + b, function(r) {
          modx.tree.rpcLoadData(r);
          modx.tree.draggable()
        })
      },
      getFolderState: function() {
        var a;
        if (modx.openedArray !== [0]) {
          a = '&opened=';
          for (var key in modx.openedArray) {
            if (modx.openedArray[key]) {
              a += key + '|'
            }
          }
        } else {
          a = '&opened='
        }
        return a
      },
      saveFolderState: function() {
        modx.get(modx.MODX_MANAGER_URL + '?a=1&f=nodes&savestateonly=1' + this.getFolderState())
      },
      showSorter: function(e) {
        e = e || w.event;
        var el = d.getElementById('floater');
        e.target.dataset.toggle = '#floater';
        el.classList.toggle('show');
        el.onclick = function(e) {
          e.stopPropagation()
        }
      },
      emptyTrash: function() {
        if (confirm(modx.lang.confirm_empty_trash) === true) {
          modx.tabs({url: modx.MODX_MANAGER_URL + '?a=64', title: modx.lang.confirm_empty_trash});
        }
      },
      showBin: function(a) {
        var el = d.getElementById('treeMenu_emptytrash');
        if (el) {
          if (a) {
            el.title = modx.lang.empty_recycle_bin;
            el.classList.remove('disabled');
            el.innerHTML = modx.style.empty_recycle_bin;
            el.onclick = function() {
              modx.tree.emptyTrash()
            }
          } else {
            el.title = modx.lang.empty_recycle_bin_empty;
            el.classList.add('disabled');
            el.innerHTML = modx.style.empty_recycle_bin_empty;
            el.onclick = null
          }
        }
      },
      unlockElement: function(a, b, c) {
        var m = modx.lockedElementsTranslation.msg.replace('[+id+]', b).replace('[+element_type+]', modx.lockedElementsTranslation['type' + a]);
        if (confirm(m) === true) {
          modx.get(modx.MODX_MANAGER_URL + '?a=67&type=' + a + '&id=' + b, function(r) {
            if (parseInt(r) === 1) {
              c.parentNode.removeChild(c);
            } else {
              alert(r)
            }
          })
        }
      },
      resizeTree: function() {
      },
      reloadElementsInTree: function() {
        modx.get(modx.MODX_MANAGER_URL + '?a=1&f=tree', function(r) {
          savePositions();
          var div = d.createElement('div');
          div.innerHTML = r;
          var tabs = div.getElementsByClassName('tab-page');
          var el, p;
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id !== 'tabDoc') {
              el = tabs[i].getElementsByClassName('panel-group')[0];
              el.style.display = 'none';
              el.classList.add('clone');
              p = d.getElementById(tabs[i].id);
              r = p.getElementsByClassName('panel-group')[0];
              p.insertBefore(el, r)
            }
          }
          setRememberCollapsedCategories();
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id !== 'tabDoc') {
              el = d.getElementById(tabs[i].id).getElementsByClassName('panel-group')[1];
              el.parentNode.removeChild(el);
              el = d.getElementById(tabs[i].id).getElementsByClassName('panel-group')[0];
              el.classList.remove('clone');
              el.style.display = 'block'
            }
          }
          loadPositions();
          for (var i = 0; i < tabIds.length; i++) {
            initQuicksearch(tabIds[i] + '_search', tabIds[i]);
          }
          var at = d.querySelectorAll('#tree .accordion-toggle');
          for (var i = 0; i < at.length; i++) {
            at[i].onclick = function(e) {
              e.preventDefault();
              var thisItemCollapsed = $(this).hasClass('collapsed');
              if (e.shiftKey) {
                var toggleItems = $(this).closest('.panel-group').find('> .panel .accordion-toggle');
                var collapseItems = $(this).closest('.panel-group').find('> .panel > .panel-collapse');
                if (thisItemCollapsed) {
                  toggleItems.removeClass('collapsed');
                  collapseItems.collapse('show')
                } else {
                  toggleItems.addClass('collapsed');
                  collapseItems.collapse('hide')
                }
                toggleItems.each(function() {
                  var state = $(this).hasClass('collapsed') ? 1 : 0;
                  setLastCollapsedCategory($(this).data('cattype'), $(this).data('catid'), state)
                });
                writeElementsInTreeParamsToStorage()
              } else {
                $(this).toggleClass('collapsed');
                $($(this).attr('href')).collapse('toggle');
                var state = thisItemCollapsed ? 0 : 1;
                setLastCollapsedCategory($(this).data('cattype'), $(this).data('catid'), state);
                writeElementsInTreeParamsToStorage()
              }
            }
          }
        })
      }
    },
    removeLocks: function() {
      if (confirm(modx.lang.confirm_remove_locks) === true) {
        //w.main.location.href = modx.MODX_MANAGER_URL + '?a=67'
        modx.get(modx.MODX_MANAGER_URL + '?a=67', function() {
          modx.tree.restoreTree()
        })
      }
    },
    keepMeAlive: function() {
      modx.get('includes/session_keepalive.php?tok=' + d.getElementById('sessTokenInput').value + '&o=' + Math.random(), function(r) {
        r = JSON.parse(r);
        if (r.status !== 'ok') w.location.href = modx.MODX_MANAGER_URL + '?a=8'
      })
    },
    updateMail: function(a) {
      try {
        if (a) {
          this.post(modx.MODX_MANAGER_URL, {
            updateMsgCount: true
          }, function(r) {
            var c = r.split(','),
                el = d.getElementById('msgCounter');
            if (c[0] > 0) {
              if (el) {
                el.innerHTML = c[0];
                el.style.display = 'block'
              }
            } else {
              if (el) el.style.display = 'none'
            }
            if (c[1] > 0) {
              el = d.getElementById('newMail');
              if (el) {
                el.innerHTML = '<a href="javascript:;" onclick="modx.tabs({url:modx.MODX_MANAGER_URL + \'?a=10\',title:modx.lang.inbox,type:\'tabs\'});">' + modx.style.email + modx.lang.inbox + ' (' + c[0] + ' / ' + c[1] + ')</a>';
                el.style.display = 'block'
              }
            }
            if (modx.config.mail_check_timeperiod > 0) setTimeout('modx.updateMail(true)', 1000 * modx.config.mail_check_timeperiod)
          })
        }
      } catch (oException) {
        setTimeout('modx.updateMail(true)', 1000 * modx.config.mail_check_timeperiod)
      }
    },
    openWindow: function(a) {
      if (typeof a !== 'object') {
        a = {
          'url': a
        }
      }
      if (!a.width) a.width = parseInt(w.innerWidth * 0.9) + 'px';
      if (!a.height) a.height = parseInt(w.innerHeight * 0.8) + 'px';
      if (!a.left) a.left = parseInt(w.innerWidth * 0.05) + 'px';
      if (!a.top) a.top = parseInt(w.innerHeight * 0.1) + 'px';
      if (!a.title) a.title = Math.floor((Math.random() * 999999) + 1);
      if (a.url) {
        if (this.plugins.EVOmodal === 1) {
          top.EVO.modal.show(a)
        } else {
          w.open(a.url, a.title, 'width=' + a.width + ',height=' + a.height + ',top=' + a.top + ',left=' + a.left + ',toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no')
        }
      }
    },
    tabsInit: function(e) {
      if (modx.config.global_tabs && e.target && ((e.target.tagName === 'A' && e.target.target === 'main') || (e.target.parentNode.tagName === 'A' && e.target.parentNode.target === 'main'))) {
        var a = e.target.tagName === 'A' && e.target || e.target.parentNode.tagName === 'A' && e.target.parentNode;
        if (e.shiftKey) {
          modx.openWindow({url: a.href})
        } else {
          modx.tabs({url: a.href, title: a.innerHTML})
        }
        e.preventDefault();
      }
    },
    tabs: function(a) {
      if (typeof a === 'object' && a.url && /(index.php|http)/.test(a.url)) {
        if (modx.config.global_tabs) {
          var o = {
            url: a.url,
            name: '',
            wrap: d.getElementById('main'),
            tabs: d.querySelectorAll('.evo-tab-page'),
            navbar: d.querySelector('.evo-tab-row .tab-row'),
            tab: d.getElementById('evo-tab-home'),
            show: function(f) {
              o.navbar.querySelector('.selected').classList.remove('selected');
              for (var i = 0; i < o.tabs.length; i++) {
                o.tabs[i].classList.remove('show')
              }
              if (f) {
                o.tab = d.getElementById('evo-tab-' + o.uid);
                o.tab.classList.add('selected');
                o.el = d.getElementById('evo-tab-page-' + o.uid);
                o.el.classList.add('show');
                w.main = o.el.firstElementChild.contentWindow;
                w.history.replaceState(null, d.title, w.main.location.search === '?a=2' ? modx.MODX_MANAGER_URL : '#' + w.main.location.search);
                if (modx.main.getQueryVariable('tab', o.url) || modx.main.getQueryVariable('tab', o.url) === '0') {
                  w.main.document.querySelectorAll('.tab-row-container .tab-row .tab')[modx.main.getQueryVariable('tab', o.url)].click()
                }
                modx.main.tabRow.scroll(o.navbar, o.tab);
                modx.tree.setItemToChange()
              } else {
                modx.main.tabRow.scroll(o.navbar)
              }
            },
            close: function(e) {
              o.event = e || o.event || w.event;
              var documentDirty = d.getElementById(o.tab.dataset.target).firstElementChild.contentWindow.documentDirty;
              var checkDirt = !!d.getElementById(o.tab.dataset.target).firstElementChild.contentWindow.checkDirt;
              if ((documentDirty && checkDirt && confirm(d.getElementById(o.tab.dataset.target).firstElementChild.contentWindow.checkDirt(o.event))) || !documentDirty) {
                if (o.tab.classList.contains('selected')) {
                  for (var i = 0; i < o.tabs.length; i++) {
                    o.tabs[i].classList.remove('show')
                  }
                  o.tab.previousElementSibling.classList.add('selected');
                  o.el = d.getElementById(o.tab.previousElementSibling.dataset.target);
                  o.el.classList.add('show');
                } else {
                  o.el = d.getElementById(o.navbar.querySelector('.selected').dataset.target);
                }
                w.main = o.el.firstElementChild.contentWindow;
                w.history.replaceState(null, d.title, w.main.location.search === '?a=2' ? modx.MODX_MANAGER_URL : '#' + w.main.location.search);
                o.wrap.removeChild(d.getElementById(o.tab.dataset.target));
                o.navbar.removeChild(o.tab);
                delete d.getElementById(o.tab.dataset.target);
                delete o.tab;
                o.tab = o.navbar.querySelector('.selected');
                modx.tree.setItemToChange()
              }
            },
            select: function(e) {
              o.tabs = d.querySelectorAll('.evo-tab-page.show');
              o.event = e;
              o.tab = this;
              if (e.target.className === 'tab-close') {
                d.getElementById(this.dataset.target).close()
              } else {
                for (var i = 0; i < o.tabs.length; i++) {
                  o.tabs[i].classList.remove('show')
                }
                o.navbar.querySelector('.selected').classList.remove('selected');
                o.tab.classList.add('selected');
                o.el = d.getElementById(this.dataset.target);
                o.el.classList.add('show');
                w.main = o.el.firstElementChild.contentWindow;
                w.history.replaceState(null, d.title, w.main.location.search === '?a=2' ? modx.MODX_MANAGER_URL : '#' + w.main.location.search);
                modx.main.tabRow.scroll(o.navbar, o.tab);
                modx.tree.setItemToChange()
              }
            },
            events: {
              click: function() {
                if (typeof w.main.documentDirty && w.main.documentDirty && !o.tab.classList.contains('changed')) {
                  o.tab.classList.add('changed');
                  w.main.removeEventListener('click', o.events.click)
                }
              },
              keyup: function() {
                if (typeof w.main.documentDirty && w.main.documentDirty && !o.tab.classList.contains('changed')) {
                  o.tab.classList.add('changed');
                  w.main.removeEventListener('keyup', o.events.click)
                }
              }
            }
          };
          for (var k in a) {
            if (a.hasOwnProperty(k) && typeof o[k] !== 'undefined') {
              o[k] = a[k]
            }
          }
          o.uid = modx.main.getQueryVariable('a', o.url.split('?')[1]) === '2' ? 'home' : modx.urlToUid(o.url);
          o.tab.onclick = o.select;
          o.el = d.getElementById('evo-tab-page-' + o.uid);
          if (o.el) {
            o.show(1)
          } else {
            o.el = d.createElement('div');
            o.el.id = 'evo-tab-page-' + o.uid;
            o.el.close = o.close;
            o.el.className = 'evo-tab-page show';
            o.tab = d.createElement('h2');
            o.tab.id = 'evo-tab-' + o.uid;
            o.tab.className = 'tab selected';
            o.tab.dataset.target = 'evo-tab-page-' + o.uid;
            o.tab.innerHTML = a.title ? '<span class="tab-title" title="' + a.title.replace(/<\/?[^>]+>/g, '') + '">' + a.title + '</span><span class="tab-close">×</span>' : '';
            o.tab.onclick = o.select;
            o.navbar.appendChild(o.tab);
            o.wrap.appendChild(o.el);
            o.el.id = 'evo-tab-page-' + o.uid;
            d.getElementById('mainloader').className = 'show';
            o.frame = d.createElement('iframe');
            o.frame.name = o.name;
            o.frame.width = '100%';
            o.frame.height = '100%';
            o.frame.frameBorder = '0';
            o.frame.src = o.url;
            o.frame.onload = function(e) {
              w.main = e.target.contentWindow;
              a.url = w.main.location.href;
              o.uid = modx.urlToUid(a.url);
              o.event = e;
              if (!!w.main.__alertQuit) {
                modx.popup({
                  type: 'warning',
                  title: 'MODX :: Alert',
                  position: 'top center alertQuit',
                  content: w.main.document.body.querySelector('p').innerHTML
                });
                w.main.document.body.innerHTML = '';
                w.main.alert = function() { };
                //w.history.pushState(null, d.title, w.main.location.search === '?a=2' ? modx.MODX_MANAGER_URL : '#' + w.main.location.search);
                //w.main.alert = alert( w.main.document.body.querySelector('p').innerHTML);
                //o.el.close();
              } else {
                if (modx.main.getQueryVariable('a', a.url.split('?')[1]) === '2' || d.querySelectorAll('#evo-tab-page-' + o.uid).length > 1) {
                  o.el.close()
                } else {
                  if (w.main.document.body.querySelectorAll('h1')[0]) {
                    a.title = w.main.document.body.querySelectorAll('h1')[0].innerHTML;
                  } else if (w.main.document.title) {
                    a.title = w.main.document.title;
                  }
                  o.tab = d.getElementById(e.target.parentNode.id.replace('page-', ''));
                  o.tab.id = 'evo-tab-' + o.uid;
                  o.tab.classList.remove('changed');
                  o.tab.dataset.target = 'evo-tab-page-' + o.uid;
                  o.tab.querySelector('.tab-title').innerHTML = a.title;
                  o.tab.querySelector('.tab-title').title = a.title.replace(/<\/?[^>]+>|^\s+|\s+$/g, '');
                  e.target.parentNode.id = 'evo-tab-page-' + o.uid;
                  modx.tree.setItemToChange();
                  modx.main.onload(e)
                }
              }
              w.main.addEventListener('click', o.events.click, false);
              w.main.addEventListener('keyup', o.events.click, false);
            };
            o.el.appendChild(o.frame);
            o.show(0)
          }
        } else {
          w.main.frameElement.src = a.url;
        }
      }
    },
    popup: function(a) {
      if (typeof a === 'object' && (a.url || a.content || a.text)) {
        var o = {
          addclass: '',
          animation: 'fade', // fade
          content: a.content || a.text || '',
          clickclose: 0,
          closeall: 0,
          data: '', // for ajax send data
          dataType: 'document', // for ajax
          delay: 5000,
          event: null,
          height: 'auto', // auto | 100 | 100rem | 100px | 100%
          hide: 1, // close after delay
          hover: 1, // close after hover
          icon: '',
          iframe: 'iframe', // iframe | ajax
          margin: '.5rem',
          maxheight: '',
          method: 'GET', // POST | GET
          overlay: 0, // add overlay
          overlayclose: 0, // click overlay to close
          position: 'center', // center | left top | left bottom | right top | right bottom
          selector: '', // dataType: document, selector: 'body'
          showclose: 1, // show close button
          target: 'main', // ! not used
          uid: '',
          type: 'default', // default | info | danger | success | dark | warning
          title: '',
          url: '',
          width: '20rem',
          wrap: 'main', // parentNode
          zIndex: 10500,
          show: function() {
            if (~o.position.indexOf('center')) {
              if (o.event) {
                o.el.style.left = o.event.clientX + o.mt + 'px';
                o.el.style.bottom = o.wrap.offsetHeight - o.el.offsetHeight - o.event.clientY + o.mt + 'px'
              } else {
                o.el.style.left = /(%)/.test(o.width) ? ((100 - parseInt(o.width)) / 2) - (o.mt / (o.wrap.offsetWidth / 100)) + '%' : ((o.wrap.offsetWidth - o.el.offsetWidth) / 2) - o.mt + 'px';
                o.el.style.bottom = /(%)/.test(o.width) ? ((100 - parseInt(o.height)) / 2) - (o.mt / (o.wrap.offsetHeight / 100)) + '%' : ((w.innerHeight - o.el.offsetHeight - o.wrap.offsetTop) / 2) - o.mt + 'px';
              }
            }
            if (~o.position.indexOf('left')) {
              o.el.style.left = 0;
            }
            if (~o.position.indexOf('right')) {
              o.el.style.right = 0;
            }
            if (~o.position.indexOf('top')) {
              o.el.style.top = 0;
              o.el.style.bottom = '';
            }
            if (~o.position.indexOf('bottom')) {
              o.el.style.bottom = 0;
            }
            o.calc();
            o.el.className += ' in';
            if (o.showclose) {
              o.el.querySelector('.close').onclick = o.close
            }
            if (o.hide) {
              o.el.timer = setTimeout(function() {
                clearTimeout(o.el.timer);
                o.close()
              }, o.delay)
            }
            if (o.hover) {
              o.el.onmouseenter = function() {
                clearTimeout(o.el.timer)
              };
              o.el.onmouseleave = o.close
            }
            if (o.overlayclose && o.o) {
              o.o.onclick = o.close
            }
            if (o.clickclose) {
              o.el.onclick = o.close;
            }
          },
          close: function(e) {
            o.event = e || o.event || w.event;
            if (o.url && o.iframe === 'iframe') {
              var els = d.querySelectorAll('.' + o.className + '.in');
              if (els) {
                var documentDirty = o.el.lastElementChild.firstElementChild.contentWindow.documentDirty;
                if ((documentDirty && confirm(o.el.lastElementChild.firstElementChild.contentWindow.checkDirt(o.event))) || !documentDirty) {
                  o.el.classList.remove('in');
                  if (!o.animation) {
                    o.el.classList.remove('show');
                  }
                  o.calc(1);
                  if (o.o && els.length === 1) {
                    o.o.parentNode.removeChild(o.o)
                  }
                  o.el.timer = setTimeout(function(e) {
                    clearTimeout(o.el.timer);
                    if (o.el.parentNode) {
                      o.el.parentNode.removeChild(o.el)
                    }
                  }, 200);
                }
              }
              clearInterval(modx.popupTimer);
            } else {
              o.el.classList.remove('in');
              if (!o.animation) {
                o.el.classList.remove('show');
              }
              o.calc(1);
              if (o.o && o.o.parentNode) {
                o.o.parentNode.removeChild(o.o)
              }
              o.el.timer = setTimeout(function(e) {
                clearTimeout(o.el.timer);
                if (o.el.parentNode) {
                  o.el.parentNode.removeChild(o.el)
                }
              }, 200);
            }
          },
          calc: function(f) {
            var els = d.querySelectorAll('.' + o.className + '.in[data-position="' + o.el.dataset.position + '"]');
            if (els && els.length) {
              o.els = [];
              for (var i = 0; i < els.length; i++) {
                o.els.push(els[i]);
              }
              o.els.sort(function(a, b) {
                return a.index - b.index;
              });
              o.t = 0;
              if (~o.el.dataset.position.indexOf('center')) {
                o.t = !f ? ((o.wrap.offsetHeight + o.el.offsetHeight) / 2) : ((o.wrap.offsetHeight - o.els[o.els.length - 1].offsetHeight) / 2) - o.mt;
              } else {
                o.t = !f ? o.el.offsetHeight + o.mt : 0;
              }
              i = o.els.length;
              while (i--) {
                d.getElementById(o.els[i].id).index = (i - o.els.length);
                if (~o.el.dataset.position.indexOf('top')) {
                  d.getElementById(o.els[i].id).style.top = o.t + 'px';
                } else {
                  d.getElementById(o.els[i].id).style.bottom = o.t + 'px';
                }
                o.t += o.els[i].offsetHeight + o.mt;
                if (o.closeall && o.el !== els[i]) {
                  o.els[i].close()
                }
              }
            }
          },
          checkDirt: function() {
//            if (!o.el.classList.contains('changed') && typeof o.el.lastElementChild.firstElementChild.contentWindow.documentDirty && o.el.lastElementChild.firstElementChild.contentWindow.document.getElementById('Button1')) {
//              modx.popupTimer = setInterval(function() {
//                console.log('timer: ' + modx.popupTimer);
//                if (o.el.lastElementChild.firstElementChild.contentWindow && o.el.lastElementChild.firstElementChild.contentWindow.documentDirty) {
//                  clearInterval(modx.popupTimer);
//                  o.el.classList.add('changed');
//                  o.tab = d.getElementById(o.wrap.id.replace('-page', ''));
//                  if (o.tab) {
//                    o.tab.classList.add('changed');
//                    o.wrap.firstElementChild.contentWindow.documentDirty = true
//                  }
//                }
//              }, 1000);
//            }
//            modx.tree.setItemToChange()
          }
        };
        for (var k in a) {
          if (a.hasOwnProperty(k) && typeof o[k] !== 'undefined') {
            o[k] = a[k]
          }
        }
        o.timer = 0;
        o.position = o.position.split(' ');
        if (modx.popupLastIndex) {
          o.zIndex = modx.popupLastIndex++
        } else {
          modx.popupLastIndex = o.zIndex;
        }
        o.uid = a.url ? modx.urlToUid(a.url) : modx.toHash(a);
        o.className = 'evo-popup';
        o.wrap = typeof o.wrap === 'string' ? d.getElementById(o.wrap) : o.wrap
        if (o.overlay && !o.wrap.querySelector('.evo-popup-overlay')) {
          o.o = d.createElement('div');
          o.o.className = 'evo-popup-overlay';
          o.o.style.zIndex = o.zIndex - 1;
          o.wrap.appendChild(o.o);
        } else {
          o.o = o.wrap.querySelector('.evo-popup-overlay')
        }
        o.el = o.wrap.ownerDocument.getElementById('evo-popup-' + o.uid);
        if (o.el) {
          clearTimeout(o.el.timer);
          o.el.index = 0;
          o.el.classList.remove('in');
          o.el.classList.add('show');
          o.el.style.zIndex = o.zIndex;
          o.el.dataset.position = o.position.join(':');
          o.mt = parseFloat(getComputedStyle(o.el).marginTop);
          o.el.close = o.close;
          o.show()
        } else {
          o.el = d.createElement('div');
          o.el.id = 'evo-popup-' + o.uid;
          o.el.close = o.close;
          o.el.index = 0;
          o.el.style.position = 'absolute';
          o.el.style.width = !/[^[0-9]/.test(o.width) ? o.width + 'px' : o.width;
          o.el.style.height = !/[^[0-9]/.test(o.height) ? o.height + 'px' : o.height;
          o.el.style.zIndex = o.zIndex;
          o.el.style.margin = o.margin;
          o.el.className = o.className + ' show alert alert-' + o.type + ' ' + o.addclass + (o.animation ? ' animation ' + o.animation : '');
          o.el.dataset.position = o.position.join(':');
          if (o.showclose) {
            o.el.innerHTML += '<span class="evo-popup-close close">&times;</span>';
          }
          if (o.title) {
            o.el.innerHTML += '<p><i class="fa ' + (o.icon ? o.icon : 'fa-' + o.type) + '"></i> <strong>' + o.title + '</strong></p><hr>';
          }
          o.el.innerHTML += '<div style="height: 100%;"></div>';
          o.wrap.appendChild(o.el);
          o.mt = parseFloat(getComputedStyle(o.el).marginTop);
          if (o.maxheight) {
            o.maxheight = /(%)/.test(o.maxheight) ? (o.wrap.offsetHeight - o.el.offsetHeight - o.mt) / 100 * parseInt(o.maxheight) : o.maxheight;
            o.el.lastChild.style.overflowY = 'auto';
            o.el.lastChild.style.maxHeight = o.maxheight + 'px';
          }
          if (/(index.php|http)/.test(o.url)) {
            if (o.iframe === 'iframe') {
              o.uid = modx.urlToUid(a.url);
              o.el.className += ' ' + o.addclass + ' ' + o.className + '-iframe';
              o.el.id = 'evo-popup-' + o.uid;
              d.getElementById('mainloader').className = 'show';
              o.frame = d.createElement('iframe');
              o.frame.width = '100%';
              o.frame.height = '100%';
              o.frame.frameBorder = '0';
              o.frame.src = o.url;
              o.frame.onload = function(e) {
                a.url = e.target.contentWindow.location.href;
                o.uid = modx.urlToUid(a.url);
                o.event = e;
                if (!!e.target.contentWindow.__alertQuit) {
                  modx.popup({
                    type: 'warning',
                    title: 'MODX :: Alert',
                    position: 'top center alertQuit',
                    content: e.target.contentWindow.document.body.querySelector('p').innerHTML
                  });
                  e.target.contentWindow.document.body.innerHTML = '';
                  e.target.contentWindow.alert = function() { };
                } else {
                  if (modx.main.getQueryVariable('a', a.url.split('?')[1]) === '2' || o.wrap.querySelectorAll('#evo-popup-' + o.uid).length > 1) {
                    o.el.close()
                  } else {
                    if (e.target.contentDocument.querySelectorAll('h1')[0]) {
                      a.title = e.target.contentDocument.querySelectorAll('h1')[0].innerHTML;
                    }
                    //w.main = e.target.contentWindow;
                    e.target.offsetParent.offsetParent.id = 'evo-popup-' + o.uid;
                    e.target.offsetParent.offsetParent.classList.remove('changed');
                    o.checkDirt();
                    //modx.main.onload(e);
                  }
                }
              };
              o.el.lastChild.appendChild(o.frame);
              o.show()
            } else {
              var xhr = new XMLHttpRequest();
              xhr.open(o.method, o.url, true);
              xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;');
              xhr.setRequestHeader('X-REQUESTED-WITH', 'XMLHttpRequest');
              if (o.dataType) {
                xhr.responseType = o.dataType
              }
              xhr.onload = function() {
                if (this.readyState === 4) {
                  o.el.className += ' ' + o.className + '-ajax';
                  if (o.dataType === 'document') {
                    if (o.selector) {
                      var r = this.response.documentElement.querySelector(o.selector);
                      if (r) {
                        o.el.lastChild.innerHTML += r.innerHTML
                      }
                    } else {
                      o.el.lastChild.innerHTML += this.response.body.innerHTML
                    }
                  } else {
                    o.el.lastChild.innerHTML += this.response;
                  }
                  o.show()
                }
              };
              xhr.send(o.data)
            }
          } else {
            o.el.lastChild.innerHTML += o.content;
            o.show()
          }
        }
      }
    },
    getWindowDimension: function() {
      var a = 0,
          b = 0,
          c = d.documentElement,
          e = d.body;
      if (typeof(w.innerWidth) === 'number') {
        a = w.innerWidth;
        b = w.innerHeight
      } else if (c && (c.clientWidth || c.clientHeight)) {
        a = c.clientWidth;
        b = c.clientHeight
      } else if (e && (e.clientWidth || e.clientHeight)) {
        a = e.clientWidth;
        b = e.clientHeight
      }
      return {
        'width': a,
        'height': b
      }
    },
    hideDropDown: function(e) {
      e = e || w.event || w.main.event;
      if (tree.ca === 'open' || tree.ca === '') {
        modx.tree.setSelectedByContext();
      }
      if (modx.tree.ctx !== null) {
        d.getElementById(modx.frameset).removeChild(modx.tree.ctx);
        modx.tree.ctx = null
      }
      if (!(/dropdown\-item/.test(e.target.className))
      //&& !(e && ("click" === e.type && /form|label|input|textarea|select/i.test(e.target.tagName)))
      ) {
        var els = d.querySelectorAll('.dropdown'),
            n = null,
            t = e.target || e.target.parentNode;
        if (t.dataset.toggle) {
          n = d.querySelector(t.dataset.toggle);
        } else if (t.classList.contains('dropdown-toggle')) n = t.offsetParent;
        for (var i = 0; i < els.length; i++) {
          if (n !== els[i]) {
            els[i].classList.remove('show')
          }
        }
        els = w.main.document.querySelectorAll('.dropdown');
        for (var i = 0; i < els.length; i++) {
          if (n !== els[i]) {
            els[i].classList.remove('show')
          }
        }
      }
    },
    XHR: function() {
      return ('XMLHttpRequest' in w) ? new XMLHttpRequest : new ActiveXObject('Microsoft.XMLHTTP');
    },
    get: function(a, b, c) {
      var x = this.XHR();
      x.open('GET', a, true);
      x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      if (c) x.responseType = c;
      x.onload = function() {
        if (this.status === 200 && typeof b === 'function') {
          return b(this.response)
        }
      };
      x.send()
    },
    post: function(a, b, c, t) {
      var x = this.XHR(),
          f = '';
      if (typeof b === 'function') {
        t = c;
        c = b;
      } else if (typeof b === 'object') {
        var e = [],
            i = 0,
            k;
        for (k in b) {
          if (b.hasOwnProperty(k)) e[i++] = k + '=' + b[k];
        }
        f = e.join('&')
      } else if (typeof b === 'string') {
        f = b;
      }
      x.open('POST', a, true);
      x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      x.setRequestHeader('X-REQUESTED-WITH', 'XMLHttpRequest');
      if (t) x.responseType = t;
      x.onload = function() {
        if (this.readyState === 4 && c !== u) {
          return c(this.response)
        }
      };
      x.send(f)
    },
    pxToRem: function(a) {
      return a / parseInt(w.getComputedStyle(d.documentElement).fontSize)
    },
    remToPx: function(a) {
      return a * parseInt(w.getComputedStyle(d.documentElement).fontSize)
    },
    toHash: function(a) {
      a = String(JSON.stringify(a));
      var b = 0, c, i;
      if (a.length === 0) return b;
      for (i = 0; i < a.length; i++) {
        c = a.charCodeAt(i);
        b = ((b << 5) - b) + c;
        b = b & b
      }
      return Math.abs(b).toString()
    },
    urlToUid: function(a) {
      var a = a.split('?'), b = '';
      if (a && a[1]) {
        if (modx.main.getQueryVariable('a', a[1])) {
          b += '&a=' + modx.main.getQueryVariable('a', a[1])
        }
        if (modx.main.getQueryVariable('id', a[1])) {
          b += '&id=' + modx.main.getQueryVariable('id', a[1])
        }
        if (modx.main.getQueryVariable('type', a[1])) {
          b += '&type=' + modx.main.getQueryVariable('type', a[1])
        }
        b = modx.toHash(b);
      }
      return b
    }
  });
  w.mainMenu = {};
  w.mainMenu.stopWork = function() {
    modx.main.stopWork()
  };
  w.mainMenu.work = function() {
    modx.main.work()
  };
  w.mainMenu.reloadtree = function() {
    //console.log('mainMenu.reloadtree()');
    if (modx.config.global_tabs) {
      setTimeout('modx.tree.restoreTree()', 50)
    }
  };
  w.mainMenu.startrefresh = function(a) {
    //console.log('mainMenu.startrefresh(' + a + ')');
    if (a === 1) {
      //modx.tree.restoreTree()
    }
    if (a === 2) {
      modx.tree.restoreTree()
    }
    if (a === 9) {
      modx.tree.restoreTree()
    }
    if (a === 10) {
      w.location.href = modx.MODX_MANAGER_URL
    }
  };
  w.mainMenu.startmsgcount = function(a, b, c) {
    modx.updateMail(c)
  };
  w.mainMenu.hideTreeFrame = function() {
    modx.resizer.setWidth(0)
  };
  w.mainMenu.defaultTreeFrame = function() {
    modx.resizer.setDefaultWidth()
  };
  w.tree = {};
  w.tree.ca = 'open';
  w.tree.document = document;
  w.tree.saveFolderState = function() {
  };
  w.tree.updateTree = function() {
    //console.log('tree.updateTree()');
    modx.tree.updateTree()
  };
  w.tree.restoreTree = function() {
    //console.log('tree.restoreTree()');
    modx.tree.restoreTree()
  };
  w.tree.reloadElementsInTree = function() {
    //console.log('tree.reloadElementsInTree()');
    modx.tree.reloadElementsInTree()
  };
  w.tree.resizeTree = function() {
    //console.log('tree.resizeTree() off')
  };
  w.onbeforeunload = function() {
    var a = w.main.frameElement.contentWindow;
    if (parseInt(modx.main.getQueryVariable('a', a.location.search.substring(1))) === 27) {
      modx.get(modx.MODX_MANAGER_URL + '?a=67&type=7&id=' + modx.main.getQueryVariable('id', a.location.search.substring(1)));
    }
  };
  d.addEventListener('DOMContentLoaded', function() {
    modx.init()
  })
})
(typeof jQuery !== 'undefined' ? jQuery : '', window, document, undefined);

function reloadElementsInTree()
{
  modx.tree.reloadElementsInTree()
}

(function() {
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(a) {
      var b = this,
          c, d;
      ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function(fn) {
        if (typeof document.body[fn] === 'function') {
          c = fn;
          return true
        }
        return false
      });
      if (b && b[c](a)) return b;
      while (b) {
        d = b.parentElement;
        if (d && d[c](a)) return d;
        b = d
      }
      return null;
    }
  }
})();
