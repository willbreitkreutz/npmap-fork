var Builder, NPMap, mapId;

function ready() {
  Builder = (function() {
    var $buttonAddAnotherLayer = $('#button-addAnotherLayer'),
      $buttonEditBaseMapsAgain = $('#button-editBaseMapsAgain'),
      $iframe = $('#iframe-map'),
      $layers = $('#layers'),
      $modalAddLayer,
      $modalConfirm = $('#modal-confirm'),
      $modalEditBaseMaps,
      $modalExport,
      $stepSection = $('section .step'),
      $ul = $('#layers'),
      abcs = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
      descriptionSet = false,
      descriptionZ = null,
      settingsSet = false,
      settingsZ = null,
      stepLis = $('#steps li'),
      titleSet = false,
      titleZ = null;

    function getLayerIndexFromButton(el) {
      return $.inArray($(el).parent().parent().parent().prev().text(), abcs);
    }
    function getLeafletMap() {
      return document.getElementById('iframe-map').contentWindow.NPMap.config.L;
    }
    function goToStep(from, to) {
      $($stepSection[from]).hide();
      $($stepSection[to]).show();
      $(stepLis[from]).removeClass('active');
      $(stepLis[to]).addClass('active');
    }
    function loadModule(module, callback) {
      module = module.replace('Builder.', '').replace(/\./g,'/');

      $.ajax({
        dataType: 'html',
        success: function (html) {
          $('body').append(html);
          $.getScript(module + '.js', function() {
            if (callback) {
              callback();
            }
          });
        },
        url: module + '.html'
      });
    }
    function updateInitialCenterAndZoom() {
      $('#set-center-and-zoom .lat').html(NPMap.center.lat.toFixed(2));
      $('#set-center-and-zoom .lng').html(NPMap.center.lng.toFixed(2));
      $('#set-center-and-zoom .zoom').html(NPMap.zoom);
    }

    $(document).ready(function() {
      if (mapId) {
        descriptionSet = true;
        settingsSet = true;
        titleSet = true;
      } else {
        setTimeout(function() {
          $('#metadata .title a').editable('toggle');
        }, 200);
      }
    });

    return {
      ui: {
        app: {
          init: function() {
            $($('section .step .btn-primary')[0]).on('click', function() {
              goToStep(0, 1);
            });
            $($('section .step .btn-primary')[1]).on('click', function() {
              goToStep(1, 2);
            });
            $.each(stepLis, function(i, li) {
              $(li.childNodes[0]).on('click', function() {
                var currentIndex = -1;

                for (var j = 0; j < stepLis.length; j++) {
                  if ($(stepLis[j]).hasClass('active')) {
                    currentIndex = j;
                    break;
                  }
                }

                if (currentIndex !== i) {
                  goToStep(currentIndex, i);
                }
              });
            });
          }
        },
        metadata: {
          init: function() {
            $('#metadata .description a').text(NPMap.description).editable({
              animation: false,
              container: '#metadata div.info',
              emptytext: 'Add a description to give your map context.',
              validate: function(value) {
                if ($.trim(value) === '') {
                  return 'Please enter a description for your map.';
                }
              }
            })
              .on('hidden', function() {
                var next = $(this).next();

                if (!descriptionSet) {
                  $($('#button-settings span')[2]).popover('show');
                  next.css({
                    'z-index': descriptionZ
                  });
                  $(next.find('button')[1]).css({
                    display: 'block'
                  });
                  descriptionSet = true;

                  if (!settingsSet) {
                    next = $('#metadata .buttons .popover');
                    settingsZ = next.css('z-index');
                    next.css({
                      'z-index': 1031
                    });
                  }
                }
              })
              .on('shown', function() {
                var next = $(this).parent().next();

                if (!descriptionSet) {
                  descriptionZ = next.css('z-index');
                  next.css({
                    'z-index': 1031
                  });
                  $(next.find('button')[1]).css({
                    display: 'none'
                  });
                }

                next.find('textarea').css({
                  'resize': 'none'
                });
              });
            $('#metadata .title a').text(NPMap.name).editable({
              animation: false,
              emptytext: 'Untitled Map',
              validate: function(value) {
                if ($.trim(value) === '') {
                  return 'Please enter a title for your map.';
                }
              }
            })
              .on('hidden', function() {
                var description = $('#metadata .description a').text(),
                    next = $(this).next();

                if (!description || description === 'Add a description to give your map context.') {
                  $('#metadata .description a').editable('toggle');
                }

                if (!titleSet) {
                  next.css({
                    'z-index': titleZ
                  });
                  $(next.find('button')[1]).css({
                    display: 'block'
                  });
                  titleSet = true;
                }
              })
              .on('shown', function() {
                var next = $(this).next();

                if (!titleSet) {
                  titleZ = next.css('z-index');
                  next.css({
                    'z-index': 1031
                  });
                  $(next.find('button')[1]).css({
                    display: 'none'
                  });
                }

                next.find('.editable-clear-x').remove();
                next.find('input').css({
                  'padding-right': '10px'
                });
              });
          },
          load: function() {
            if (NPMap.description) {
              $('#metadata .description a').text(NPMap.description);
            }

            if (NPMap.name) {
              $('#metadata .title a').text(NPMap.name);
            }
          }
        },
        steps: {
          addAndCustomizeData: {
            handlers: {
              clickLayerChangeStyle: function(el) {
                $(el).popover({
                  animation: false,
                  container: 'body',
                  html: 'This is only a test.',
                  placement: 'right'
                });
              },
              clickLayerEdit: function(el) {
                var index = getLayerIndexFromButton(el);

                function callback() {
                  Builder.ui.modal.addLayer._load(NPMap.overlays[index]);
                  Builder.ui.modal.addLayer._editingIndex = index;
                }

                if ($modalAddLayer) {
                  $modalAddLayer.modal('show');
                  callback();
                } else {
                  loadModule('Builder.ui.modal.addLayer', function() {
                    $modalAddLayer = $('#modal-addLayer');
                    callback();
                  });
                }
              },
              clickLayerRemove: function(el) {
                Builder.showConfirm('Yes, remove the layer', 'Once the layer is removed, you cannot get it back.', 'Are you sure?', function() {
                  Builder.ui.steps.addAndCustomizeData.removeLi(el);
                  Builder.removeOverlay(getLayerIndexFromButton(el));
                });
              }
            },
            init: function() {
              $('.dd').nestable({
                handleClass: 'letter',
                listNodeName: 'ul'
              })
                .on('change', function() {
                  var children = $ul.children(),
                    overlays = [];

                  if (children.length > 1) {
                    $.each(children, function(i, li) {
                      var $letter = $($(li).children('.letter')[0]),
                        from = $.inArray($letter.text(), abcs);

                      if (from !== i) {
                        overlays.splice(i, 0, NPMap.overlays[from]);
                      }

                      $letter.text(abcs[i]);
                    });

                    if (overlays.length) {
                      NPMap.overlays = overlays;
                      Builder.updateMap();
                    }

                    Builder.ui.steps.addAndCustomizeData.refreshUl();
                  }
                });
              $('#button-addAnotherLayer, #button-addLayer').on('click', function() {
                if ($modalAddLayer) {
                  $modalAddLayer.modal('show');
                } else {
                  loadModule('Builder.ui.modal.addLayer', function() {
                    $modalAddLayer = $('#modal-addLayer');
                  });
                }
              });
              $('#button-editBaseMaps, #button-editBaseMapsAgain').on('click', function() {
                if ($modalEditBaseMaps) {
                  $modalEditBaseMaps.modal('show');
                } else {
                  loadModule('Builder.ui.modal.editBaseMaps', function() {
                    $modalEditBaseMaps = $('#modal-editBaseMaps');
                  });
                }
              });
            },
            load: function() {
              if ($.isArray(NPMap.overlays)) {
                $.each(NPMap.overlays, function(i, overlay) {
                  Builder.ui.steps.addAndCustomizeData.overlayToLi(overlay);
                });
              }
            },
            overlayToLi: function(overlay) {
              var index;

              if (!$layers.is(':visible')) {
                $layers.prev().hide();
                $('#customize .content').css({
                  padding: 0
                });
                $layers.show();
              }

              index = $layers.children().length;
              $layers.append($([
                '<li class="dd-item">',
                  '<div class="letter">' + abcs[index] + '</div>',
                  '<div class="details">',
                    '<span class="name">' + overlay.name + '</span>',
                    '<span class="description">' + (overlay.description || '') + '</span>',
                    '<span>',
                      '<div style="float:left;">',
                        '<button onclick="Builder.ui.steps.addAndCustomizeData.handlers.clickLayerEdit(this);">',
                          '<img src="img/edit-layer.png">',
                        '</button>',
                      '</div>',
                      '<div style="float:right;">',
                        '<button onclick="Builder.ui.steps.addAndCustomizeData.handlers.clickLayerChangeStyle(this);" style="margin-right:10px;">',
                          '<img src="img/edit-style.png">',
                        '</button>',
                        '<button onclick="Builder.ui.steps.addAndCustomizeData.handlers.clickLayerRemove(this);">',
                          '<img src="img/remove-layer.png">',
                        '</button>',
                      '</div>',
                    '</span>',
                  '</div>',
                '</li>'
              ].join('')));
              Builder.ui.steps.addAndCustomizeData.refreshUl();
            },
            refreshUl: function() {
              var previous = $ul.parent().prev();

              if ($ul.children().length === 0) {
                $buttonAddAnotherLayer.hide();
                $buttonEditBaseMapsAgain.hide();
                previous.show();
              } else {
                $buttonAddAnotherLayer.show();
                $buttonEditBaseMapsAgain.show();
                previous.hide();
              }
            },
            removeLi: function(el) {
              $($(el).parents('li')[0]).remove();
              
              Builder.ui.steps.addAndCustomizeData.refreshUl();
            }
          },
          additionalToolsAndSettings: {
            init: function() {
              $.each($('#additional-tools-and-settings form'), function(i, form) {
                $.each($(form).find('input'), function(j, input) {
                  $(input).on('change', function() {
                    var checked = $(this).prop('checked'),
                      value = this.value;

                    if (value === 'overviewControl') {
                      if (checked) {
                        NPMap[value] = {
                          layer: (function() {
                            for (var i = 0; i < NPMap.baseLayers.length; i++) {
                              var baseLayer = NPMap.baseLayers[0];

                              if (typeof baseLayer.visible === 'undefined' || baseLayer.visible === true) {
                                return baseLayer;
                              }
                            }
                          })()
                        };
                      } else {
                        NPMap[value] = false;
                      }
                    } else {
                      NPMap[value] = checked;
                    }

                    Builder.updateMap();
                  });
                });
              });
            },
            load: function() {
              // TODO: Update behavior and controls checkboxes.
              $.each($('#additional-tools-and-settings form'), function(i, form) {
                $.each($(form).find('input'), function(j, input) {
                  var $input = $(input),
                    property = NPMap[$input.attr('value')];

                  if (typeof property !== 'undefined') {
                    $input.attr('checked', property);
                  }
                });
              });
            }
          },
          setCenterAndZoom: {
            init: function() {
              $($('#set-center-and-zoom .btn-block')[0]).on('click', function() {
                var map = getLeafletMap(),
                  center = map.getCenter();

                NPMap.center = {
                  lat: center.lat,
                  lng: center.lng
                };
                NPMap.zoom = map.getZoom();

                updateInitialCenterAndZoom();
                Builder.updateMap();
              });
              $($('#set-center-and-zoom .btn-block')[1]).on('click', function() {
                var $this = $(this);

                if ($this.hasClass('active')) {
                  delete NPMap.maxBounds;
                  $this.removeClass('active').text('Restrict Bounds');
                } else {
                  var bounds = getLeafletMap().getBounds(),
                    northEast = bounds.getNorthEast(),
                    southWest = bounds.getSouthWest();

                  NPMap.maxBounds = [
                    [southWest.lat, southWest.lng],
                    [northEast.lat, northEast.lng]
                  ];

                  $(this).addClass('active').text('Remove Bounds Restriction');
                }

                Builder.updateMap();
              });
              $('#set-zoom').slider({
                //center: 4,
                max: 19,
                min: 0,
                value: [typeof NPMap.minZoom === 'number' ? NPMap.minZoom : 0, typeof NPMap.maxZoom === 'number' ? NPMap.maxZoom : 19]
              })
                .on('slideStop', function(e) {
                  NPMap.maxZoom = e.value[1];
                  NPMap.minZoom = e.value[0];
                  Builder.updateMap();
                });
            },
            load: function() {
              updateInitialCenterAndZoom();

              if (typeof NPMap.maxBounds === 'object') {
                $($('#set-center-and-zoom .btn-block')[1]).addClass('active').text('Remove Bounds Restriction');
              }
            }
          }
        },
        toolbar: {
          handlers: {
            clickSettings: function(el) {
              $(el).parents('.popover').css({
                'z-index': settingsZ
              });
              $('#mask').remove();
              $($('#button-settings span')[2]).popover('hide');
              settingsSet = true;
            }
          },
          init: function() {
            $('#button-export').on('click', function() {
              if ($modalExport) {
                $modalExport.modal('show');
              } else {
                loadModule('Builder.ui.modal.export', function() {
                  $modalExport = $('#modal-export');
                });
              }
            });
            $('#button-feedback').on('click', function() {
              window.open('https://github.com/nationalparkservice/npmap-builder/issues', '_blank');
            });
            $('#button-help').on('click', function() {
              window.open('https://github.com/nationalparkservice/npmap-builder/wiki', '_blank');
            });
            $('#button-save').on('click', function() {
              var $this = $(this),
                base = (function () {
                  var host = window.location.host;

                  if (host.indexOf('insidemaps') === -1 && host.indexOf('localhost') === -1) {
                    return 'http://insidemaps.nps.gov/';
                  }

                  return '/';
                })(),
                data = {
                  json: JSON.stringify($.extend({
                    description: $('.description a').text(),
                    isPublic: true,
                    isShared: true,
                    name: $('.title a').text()
                  }, NPMap), null)
                };

              $this.attr('disabled', true);

              if (mapId) {
                data.mapId = mapId;
              }

              $.ajax({
                data: data,
                error: function () {
                  $this.attr('disabled', false);
                  console.log('Cannot reach status service. You must be on the National Park Service network to save a map.');
                },
                dataType: 'json',
                success: function (response) {
                  $this.attr('disabled', false);

                  if (response) {
                    if (response.success) {
                      mapId = response.mapId;
                      // TODO: Show non-modal confirmation.
                    } else {
                      console.log(response.error);
                    }
                  } else {
                    console.log('Cannot reach status service. You must be on the National Park Service network to save a map.');
                  }
                },
                url: base + 'builder/save' + (base === '/' ? '' : '&callback=?')
              });
            });
            $('#button-settings').on('click', function() {
              var $this = $(this),
                $span = $($this.children('span')[2]);

              if ($this.hasClass('active')) {
                $span.popover('hide');
                $this.removeClass('active');
              } else {
                $span.popover('show');
                $this.addClass('active');
              }
            });
            $($('#button-settings span')[2]).popover({
              animation: false,
              container: '#metadata .buttons',
              content: '<div class="checkbox"><label><input type="checkbox" value="public" checked="checked" disabled>Is this map public?</label></div><div class="checkbox"><label><input type="checkbox" value="shared" checked="checked" disabled>Share this map with others?</label></div><div style="text-align:center;"><button type="button" class="btn btn-primary" onclick="Builder.ui.toolbar.handlers.clickSettings(this);">Start Building!</button></div>',
              html: true,
              placement: 'bottom',
              trigger: 'manual'
            })
              .on('shown.bs.popover', function() {
                if (settingsSet) {
                  $('#metadata .buttons .popover .btn-primary').hide();
                }
              });
          }
        }
      },
      addOverlay: function(overlay) {
        NPMap.overlays.push(overlay);
        Builder.ui.steps.addAndCustomizeData.overlayToLi(overlay);
      },
      buildTooltips: function() {
        $('[rel=tooltip]').tooltip({
          animation: false
        });
      },
      removeOverlay: function(index) {
        NPMap.overlays.splice(index, 1);
        this.updateMap();
      },
      showConfirm: function(button, content, title, callback) {
        $($modalConfirm.find('.btn-primary')[0]).html(button).on('click', function() {
          $modalConfirm.modal('hide');
          callback();
        });
        $($modalConfirm.find('.modal-body')[0]).html(content);
        $($modalConfirm.find('h4')[0]).html(title);
        $modalConfirm.modal('show');
      },
      updateMap: function(callback) {
        $iframe.attr('src', 'iframe.html?c=' + encodeURIComponent(JSON.stringify(NPMap)));
        var interval = setInterval(function() {
          var npmap = document.getElementById('iframe-map').contentWindow.NPMap;

          if (npmap && npmap.config && npmap.config.center) {
            clearInterval(interval);

            if (callback) {
              callback(npmap.config);
            }
          }
        }, 100);
      }
    };
  })();

  Builder.ui.app.init();
  Builder.ui.metadata.init();
  Builder.ui.steps.addAndCustomizeData.init();
  Builder.ui.steps.additionalToolsAndSettings.init();
  Builder.ui.steps.setCenterAndZoom.init();
  Builder.ui.toolbar.init();

  if (mapId) {
    Builder.ui.metadata.load();
    Builder.ui.steps.addAndCustomizeData.load();
    Builder.ui.steps.additionalToolsAndSettings.load();
    Builder.ui.steps.setCenterAndZoom.load();
  }

  Builder.buildTooltips();
  Builder.updateMap();
}

mapId = (function() {
  var search = document.location.search.replace('&?', ''),
    id = null;

  if (search.indexOf('?') === 0) {
    search = search.slice(1, search.length);
  }

  search = search.split('&');

  for (var i = 0; i < search.length; i++) {
    var param = search[i].split('=');

    if (param[0] === 'id') {
      id = param[1];
      break;
    }
  }

  return id;
})();

if (mapId) {
  $.ajax({
    dataType: 'jsonp',
    jsonpCallback: 'callback',
    success: function(response) {
      NPMap = response;
      ready();
    },
    url: 'http://www.nps.gov/maps/builder/configs/' + mapId + '.jsonp'
  });
} else {
  var mask = document.createElement('div');
  mask.className = 'modal-backdrop in';
  mask.id = 'mask';
  document.body.appendChild(mask);

  NPMap = {
    baseLayers: ['nps-lightStreets'],
    center: {
      lat: 39,
      lng: -96
    },
    div: 'map',
    homeControl: true,
    smallzoomControl: true,
    zoom: 4
  };
  ready();
}
