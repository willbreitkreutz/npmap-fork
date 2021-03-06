/* globals $, Builder, NPMap */
/* jshint camelcase: false */

Builder.ui = Builder.ui || {};
Builder.ui.modal = Builder.ui.modal || {};
Builder.ui.modal.addLayer = (function () {
  var $attribution = $('#layerAttribution');
  var $description = $('#layerDescription');
  var $modal = $('#modal-addLayer');
  var $name = $('#layerName');
  var $type = $('#layerType');
  var hasNameError = false;
  var types = {
    arcgisserver: {
      _tiled: false,
      _url: null,
      fields: {
        $clickable: $('#arcgisserver-clickable'),
        $layers: $('#arcgisserver-layers'),
        $opacity: $('#arcgisserver-opacity'),
        $url: $('#arcgisserver-url').bind('change paste keyup', function () {
          var value = $(this).val();
          var lower = value.toLowerCase();

          if (lower.indexOf('mapserver') === (value.length - 9) || lower.indexOf('mapserver/') === (value.length - 10)) {
            $.ajax({
              dataType: 'json',
              success: function (response) {
                if (value !== types.arcgisserver._url) {
                  types.arcgisserver.fields.$layers.find('option').remove();
                  $.each(response.layers, function (i, layer) {
                    types.arcgisserver.fields.$layers.append($('<option>', {
                      value: layer.id
                    }).text(layer.id + ': ' + layer.name));
                  });
                  types.arcgisserver.fields.$layers.prop('disabled', false);
                  types.arcgisserver.fields.$layers.selectpicker('refresh');
                  types.arcgisserver._tiled = response.singleFusedMapCache || false;
                  types.arcgisserver._url = value;
                }
              },
              url: value + '?f=json&callback=?'
            });
          } else {
            types.arcgisserver.fields.$layers.find('option').remove();
            types.arcgisserver.fields.$layers.prop('disabled', true);
            types.arcgisserver.fields.$layers.selectpicker('refresh');
            types.arcgisserver._url = null;
          }
        })
      },
      reset: function () {
        types.arcgisserver.fields.$clickable.prop('checked', 'checked');
        types.arcgisserver.fields.$layers.find('option').remove();
        types.arcgisserver.fields.$layers.prop('disabled', true);
        types.arcgisserver.fields.$layers.selectpicker('refresh');
        types.arcgisserver.fields.$opacity.slider('setValue', 100);
        types.arcgisserver.fields.$url.val('');
        types.arcgisserver._tiled = false;
        types.arcgisserver._url = null;
      }
    },
    cartodb: {
      fields: {
        $clickable: $('#cartodb-clickable'),
        $detectRetina: $('#cartodb-retina'),
        $opacity: $('#cartodb-opacity'),
        $sql: $('#cartodb-sql'),
        $table: $('#cartodb-table'),
        $user: $('#cartodb-user')
      },
      reset: function () {
        types.cartodb.fields.$clickable.prop('checked', 'checked');
        types.cartodb.fields.$detectRetina.prop('checked', false);
        types.cartodb.fields.$opacity.slider('setValue', 100);
        types.cartodb.fields.$sql.val('');
        types.cartodb.fields.$table.val('');
        types.cartodb.fields.$user.val('');
      }
    },
    csv: {
      fields: {
        $clickable: $('#csv-clickable'),
        $cluster: $('#csv-cluster'),
        $url: $('#csv-url')
      },
      reset: function () {
        types.csv.fields.$clickable.prop('checked', 'checked');
        types.csv.fields.$cluster.prop(false);
        types.csv.fields.$url.val('');
      }
    },
    geojson: {
      fields: {
        $clickable: $('#geojson-clickable'),
        $cluster: $('#geojson-cluster'),
        $url: $('#geojson-url')
      },
      reset: function () {
        types.geojson.fields.$clickable.prop('checked', 'checked');
        types.geojson.fields.$cluster.prop(false);
        types.geojson.fields.$url.val('');
      }
    },
    kml: {
      fields: {
        $clickable: $('#kml-clickable'),
        $cluster: $('#kml-cluster'),
        $url: $('#kml-url')
      },
      reset: function () {
        types.kml.fields.$clickable.prop('checked', 'checked');
        types.kml.fields.$cluster.prop(false);
        types.kml.fields.$url.val('');
      }
    },
    mapbox: {
      fields: {
        $clickable: $('#mapbox-clickable'),
        $id: $('#mapbox-id'),
        $opacity: $('#mapbox-opacity')
      },
      reset: function () {
        types.mapbox.fields.$clickable.prop('checked', 'checked');
        types.mapbox.fields.$id.val('');
        types.mapbox.fields.$opacity.slider('setValue', 100);
      }
    },
    spot: {
      fields: {
        $clickable: $('#spot-clickable'),
        $cluster: $('#spot-cluster'),
        $id: $('#spot-id'),
        $zoomToBounds: $('#spot-zoomToBounds')
      },
      reset: function () {
        types.spot.fields.$clickable.prop('checked', 'checked');
        types.spot.fields.$cluster.prop(false);
        types.spot.fields.$id.val('');
        types.spot.fields.$zoomToBounds.prop(false);
      }
    },
    tiled: {
      fields: {
        $opacity: $('#tiled-opacity'),
        $url: $('#tiled-url')
      },
      reset: function () {
        types.tiled.fields.$opacity.slider('setValue', 100);
        types.tiled.fields.$url.val('');
      }
    }
    /*,
    wms: {
      fields: {
        $format: $('#wms-format'),
        $layers: $('#wms-layers'),
        $opacity: $('#wms-opacity'),
        $transparent: $('#wms-transparent'),
        $url: $('#wms-url')
      },
      reset: function() {
        types.wms.fields.$format.find('option').remove();
        types.wms.fields.$format.prop('disabled', true);
        types.wms.fields.$layers.find('option').remove();
        types.wms.fields.$layers.prop('disabled', true);
        types.wms.fields.$layers.selectpicker('refresh');
        types.wms.fields.$opacity.slider('setValue', 100);
        types.wms.fields.$transparent.prop(false);
        types.wms.fields.$url.val('');
      }
    }
    */
  };
  var activeButton, parks, poiTypes, popup, styles, tooltip;

  function onChangeName () {
    var $this = $(this);
    var $parent = $this.parent();
    var value = $this.val();

    hasNameError = false;

    if (value.indexOf(':') !== -1) {
      hasNameError = true;
    } else {
      if (NPMap.overlays && NPMap.overlays.length) {
        for (var i = 0; i < NPMap.overlays.length; i++) {
          if (i !== Builder.ui.modal.addLayer._editingIndex) {
            var overlay = NPMap.overlays[i];

            if (value === overlay.name) {
              hasNameError = true;
              break;
            }
          }
        }
      }
    }

    if (hasNameError) {
      $parent.addClass('has-error');
    } else {
      $parent.removeClass('has-error');
    }
  }
  function onChangeType () {
    var value = $(this).val();

    $.each($('#modal-addLayer form div'), function (i, div) {
      var $div = $(div);

      if ($div.attr('id')) {
        if ($div.attr('id') === value) {
          $div.show();
        } else {
          $div.hide();
        }
      }
    });
  }
  function resetFields () {
    $attribution.val(null);
    $description.val(null);
    $name.val(null);
    $.each(types, function (type) {
      types[type].reset();
    });
  }
  function save () {
    var attribution = $attribution.val() || null;
    var description = $description.val() || null;
    var errors = [];
    var fields = [$attribution, $description, $name];
    var name = $name.val() || null;
    var config;

    if (typeof NPMap.overlays === 'undefined') {
      NPMap.overlays = [];
    }

    if (!name || hasNameError) {
      errors.push($name);
    }

    if ($('#arcgisserver').is(':visible')) {
      (function () {
        var clickable = types.arcgisserver.fields.$clickable.prop('checked');
        var layers = types.arcgisserver.fields.$layers.val();
        var url = types.arcgisserver.fields.$url.val();

        $.each(types.arcgisserver.fields, function (field) {
          fields.push(field);
        });

        if (!layers) {
          errors.push(types.arcgisserver.fields.$layers);
        } else {
          layers = layers.join(',');
        }

        if (!url) {
          errors.push(types.arcgisserver.fields.$url);
        }

        config = {
          layers: layers,
          opacity: parseInt(types.arcgisserver.fields.$opacity.val(), 10) / 100,
          tiled: types.arcgisserver._tiled,
          type: 'arcgisserver',
          url: url
        };

        if (clickable === false) {
          config.clickable = false;
        }
      })();
    } else if ($('#cartodb').is(':visible')) {
      (function () {
        var clickable = types.cartodb.fields.$clickable.prop('checked');
        var detectRetina = types.cartodb.fields.$detectRetina.prop('checked');
        var sql = types.cartodb.fields.$sql.val();
        var table = types.cartodb.fields.$table.val();
        var user = types.cartodb.fields.$user.val();

        $.each(types.cartodb.fields, function (field) {
          fields.push(field);
        });

        if (table) {
          table = table.toLowerCase();
        } else {
          errors.push(types.cartodb.fields.$table.val());
        }

        if (user) {
          user = user.toLowerCase();
        } else {
          errors.push(types.cartodb.fields.$user.val());
        }

        config = {
          opacity: parseInt(types.cartodb.fields.$opacity.val(), 10) / 100,
          table: table,
          type: 'cartodb',
          user: user
        };

        if (clickable === false) {
          config.clickable = false;
        }

        if (detectRetina === true) {
          config.detectRetina = true;
        }

        if (sql && sql.length) {
          config.sql = sql;
        }
      })();
    } else if ($('#csv').is(':visible')) {
      (function () {
        var clickable = types.csv.fields.$clickable.prop('checked');
        var cluster = types.csv.fields.$cluster.prop('checked');
        var url = types.csv.fields.$url.val();

        $.each(types.csv.fields, function (field) {
          fields.push(field);
        });

        if (!url) {
          errors.push(types.csv.fields.$url);
        }

        config = {
          type: 'csv',
          url: url
        };

        if (clickable === false) {
          config.clickable = false;
        }

        if (cluster) {
          config.cluster = true;
        }
      })();
    } else if ($('#geojson').is(':visible')) {
      (function () {
        var clickable = types.geojson.fields.$clickable.prop('checked');
        var cluster = types.geojson.fields.$cluster.prop('checked');
        var url = types.geojson.fields.$url.val();

        $.each(types.geojson.fields, function (field) {
          fields.push(field);
        });

        if (!url) {
          errors.push(types.geojson.fields.$url);
        }

        config = {
          type: 'geojson',
          url: url
        };

        if (clickable === false) {
          config.clickable = false;
        }

        if (cluster) {
          config.cluster = true;
        }
      })();
    } else if ($('#kml').is(':visible')) {
      (function () {
        var clickable = types.kml.fields.$clickable.prop('checked');
        var cluster = types.kml.fields.$cluster.prop('checked');
        var url = types.kml.fields.$url.val();

        $.each(types.kml.fields, function (field) {
          fields.push(field);
        });

        if (!url) {
          errors.push(types.kml.fields.$url);
        }

        config = {
          type: 'kml',
          url: url
        };

        if (clickable === false) {
          config.clickable = false;
        }

        if (cluster) {
          config.cluster = true;
        }
      })();
    } else if ($('#mapbox').is(':visible')) {
      (function () {
        var clickable = types.mapbox.fields.$clickable.prop('checked');
        var id = types.mapbox.fields.$id.val();

        $.each(types.mapbox.fields, function (field) {
          fields.push(field);
        });

        if (!id) {
          errors.push(types.mapbox.fields.$id.val());
        }

        config = {
          id: id,
          opacity: parseInt(types.mapbox.fields.$opacity.val(), 10) / 100,
          type: 'mapbox'
        };

        if (clickable === false) {
          config.clickable = false;
        }
      })();
    } else if ($('#spot').is(':visible')) {
      (function () {
        var clickable = types.spot.fields.$clickable.prop('checked');
        var cluster = types.spot.fields.$cluster.prop('checked');
        var id = types.spot.fields.$id.val();
        var zoomToBounds = types.spot.fields.$zoomToBounds.prop('checked');

        $.each(types.spot.fields, function (field) {
          fields.push(field);
        });

        if (!id) {
          errors.push(types.kml.fields.$id);
        }

        config = {
          id: id,
          type: 'spot'
        };

        if (clickable === false) {
          config.clickable = false;
        }

        if (cluster) {
          config.cluster = true;
        }

        if (zoomToBounds) {
          config.zoomToBounds = true;
        }
      })();
    } else if ($('#tiled').is(':visible')) {
      (function () {
        var url = types.tiled.fields.$url.val();

        $.each(types.tiled.fields, function (field) {
          fields.push(field);
        });

        if (!url) {
          errors.push(types.tiled.fields.$url.val());
        }

        config = {
          opacity: parseInt(types.tiled.fields.$opacity.val(), 10) / 100,
          type: 'tiled',
          url: url
        };
      })();
    } else if ($('#wms').is(':visible')) {
      /*
        http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/obs?request=GetCapabilities&service=WMS

        attribution: 'NOAA',
        crs: null, (not implemented)
        format: 'image/png',
        layers: 'RAS_RIDGE_NEXRAD',
        opacity: 0.5,
        styles: '', (not implemented)
        transparent: true,
        type: 'wms',
        url: 'http://nowcoast.noaa.gov/wms/com.esri.wms.Esrimap/obs',
        version: '1.1.1' (autopopulate, no input)
      */
    }

    if (!errors.length) {
      var $layers = $('#layers');
      var type = config.type;

      $('#addLayer-add, #addLayer-cancel').each(function (i, button) {
        $(button).prop('disabled', true);
      });

      if (attribution) {
        config.attribution = attribution;
      }

      if (description) {
        config.description = description;
      }

      config.name = name;

      if (popup) {
        config.popup = popup;
      }

      if (styles) {
        config.styles = styles;
      } else if (type === 'csv' || type === 'geojson' || type === 'kml' || type === 'spot') {
        config.styles = $.extend(true, {}, Builder._defaultStyles);
      } else if (type === 'cartodb') {
        config.styles = $.extend(true, {}, Builder._defaultStylesCollapsed);
      }

      if (tooltip) {
        config.tooltip = tooltip;
      }

      // TODO: Loop through all properties and "sanitize" them.
      // TODO: Better loading indicator?
      validate($.extend({}, config), function (validated, error) {
        if (error) {
          if (!error.message) {
            error.message = 'An unhandled error occured.';
          }

          $('#addLayer-add, #addLayer-cancel').each(function (i, button) {
            $(button).prop('disabled', false);
          });
          window.alert('The overlay could not be added to the map. The full error message is:\n\n' + error.message);
        } else {
          if (Builder.ui.modal.addLayer._editingIndex === -1) {
            if (config.styles) {
              var geometryTypes = validated._geometryTypes;

              if (config.type === 'cartodb') {
                var geometryType = geometryTypes[0];

                switch (geometryType) {
                  case 'line':
                    delete config.styles.fill;
                    delete config.styles['fill-opacity'];
                    delete config.styles['marker-color'];
                    delete config.styles['marker-size'];
                    break;
                  case 'point':
                    delete config.styles.fill;
                    delete config.styles['fill-opacity'];
                    delete config.styles.stroke;
                    delete config.styles['stroke-opacity'];
                    delete config.styles['stroke-width'];
                    break;
                  case 'polygon':
                    delete config.styles['marker-color'];
                    delete config.styles['marker-size'];
                    break;
                }
              } else {
                if (geometryTypes.indexOf('line') === -1) {
                  delete config.styles.line;
                }

                if (geometryTypes.indexOf('point') === -1) {
                  delete config.styles.point;
                }

                if (geometryTypes.indexOf('polygon') === -1) {
                  delete config.styles.polygon;
                }
              }
            }

            Builder.addOverlay(config);
          } else {
            var $li = $($layers.children()[Builder.ui.modal.addLayer._editingIndex]);
            var $interactivity = $($li.find('.interactivity')[0]);

            NPMap.overlays[Builder.ui.modal.addLayer._editingIndex] = config;
            $($li.find('.name')[0]).text(config.name);

            if (config.description) {
              $($li.find('.description')[0]).text(config.description);
            }

            if (typeof config.clickable === 'undefined' || config.clickable === true) {
              $interactivity.show();
            } else {
              $interactivity.hide();
              delete config.popup;
              delete config.tooltip;
            }
          }

          Builder.updateMap();
          $modal.modal('hide');
        }
      });
    } else {
      $.each(errors, function (i, $el) {
        $el.parent().addClass('has-error');
      });
    }
  }
  function setHeight () {
    $('#modal-addLayer .modal-body').css({
      height: $(document).height() - 180
    });
  }
  function validate (config, callback) {
    var done = false;
    var error = null;
    var interval;

    window.layerValidate = (function () {
      var contentWindow = document.getElementById('iframe-map').contentWindow;

      if (config.type === 'arcgisserver') {
        if (config.tiled) {
          return contentWindow.L.npmap.layer.arcgisserver.tiled(config);
        } else {
          return contentWindow.L.npmap.layer.arcgisserver.dynamic(config);
        }
      }

      return contentWindow.L.npmap.layer[config.type](config);
    })();

    if (window.layerValidate.readyFired) {
      done = true;
    } else {
      window.layerValidate.on('ready', function () {
        done = true;
      });
    }

    if (window.layerValidate.errorFired) {
      error = {
        message: 'Unspecified error.'
      };
      done = true;
    } else {
      window.layerValidate.on('error', function (e) {
        error = e;
        done = true;
      });
    }

    interval = setInterval(function () {
      if (done === true) {
        clearInterval(interval);
        callback(window.layerValidate, error);
        delete window.layerValidate;
      }
    }, 100);
  }

  if (typeof Builder._pendingLayerEditIndex !== 'undefined') {
    var overlay = NPMap.overlays[Builder._pendingLayerEditIndex];
    var type = overlay.type;

    delete Builder._pendingLayerEditIndex;

    $type.val(type);
    $.each(types, function (prop) {
      var $el = $('#' + type);

      if (prop === type) {
        $el.show();
      } else {
        $el.hide();
      }
    });
  }

  Builder.buildTooltips();
  setHeight();
  $name.bind('change click input keyup paste propertychange', onChangeName);
  $type.bind('change', onChangeType);
  $modal
    .modal({
      backdrop: 'static',
      keyboard: false
    })
    .on('hide.bs.modal', function () {
      hasNameError = false;
      popup = styles = tooltip = null;
      resetFields();
      $type.val('arcgisserver').trigger('change');
      $.each($('#modal-addLayer .form-group'), function (index, formGroup) {
        var $formGroup = $(formGroup);

        if ($formGroup.hasClass('has-error')) {
          $formGroup.removeClass('has-error');
        }
      });
      Builder.ui.modal.addLayer._editingIndex = -1;
      $('#layerType').removeAttr('disabled');
      $('#modal-addLayer-description-update').hide();
      $('#modal-addLayer-description-create').show();
      $('#modal-addLayer-title').html('Add an Existing Overlay&nbsp;<img data-container="#modal-addLayer" data-original-title="You can add ArcGIS Online/ArcGIS Server, CartoDB, CSV, GeoJSON, KML, MapBox, SPOT, or Tiled overlays to your map." data-placement="bottom" rel="tooltip" src="img/help@2x.png" style="height:18px;" title="">');
      Builder.buildTooltips();
      $('#addLayer-add, #addLayer-cancel').each(function (i, button) {
        $(button).prop('disabled', false);
      });
    })
    .on('shown.bs.modal', function () {
      $type.focus();
    });
  $('#modal-addLayer .modal-footer .btn-primary').click(save);
  $('#button-preset-places')
    .click(function () {
      activeButton = $(this);
      activeButton.popover('show');
    })
    .popover({
      container: 'body',
      content: '' +
        '<p>Add an overlay linked to a Places query. As the data improves in Places, your map will automatically pull in the changes.</p>' +
        '<form id="places-form" role="form">' +
          '<div class="form-group">' +
            '<label for="places-dataset">Dataset</label>' +
            '<select id="places-dataset" class="form-control" required>' +
              '<option value="buildings">Buildings</option>' +
              '<option value="parking_lots">Parking Lots</option>' +
              '<option value="points_of_interest">Points of Interest</option>' +
              '<option value="roads">Roads</option>' +
              '<option value="trails">Trails</option>' +
            '</select>' +
          '</div>' +
          // TODO: display should be specified in the CSS, but it isn't taking.
          '<div class="form-group poi-type" style="display:none;">' +
            '<label for="places-poi-type">Type</label>' +
            '<select id="places-poi-type" class="form-control" required>' +
              '<option>All</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label for="places-park">Park</label>' +
            '<select id="places-park" class="form-control" required style="width:244px;">' +
            '</select>' +
          '</div>' +
          '<div class="checkbox poi-vector" style="display:none;">' +
            '<label>' +
              '<input id="places-poi-vector" type="checkbox">' +
              'Bring in as a vector overlay?' +
            '</label>' +
          '</div>' +
          '<div style="text-align:center;">' +
            '<button class="btn btn-default" style="margin-right:5px;">Cancel</button>' +
            '<button class="btn btn-primary">Select</button>' +
          '</div>' +
        '</form>' +
      '',
      html: true,
      placement: 'bottom',
      trigger: 'manual'
    })
    .on('hide.bs.popover', function () {
      $modal.css('z-index', 1050);
      $('#modal-addLayer .modal-body').scrollTop(0);
      activeButton = null;
    })
    .on('show.bs.popover', function () {
      $modal.css('z-index', 1);
    })
    .on('shown.bs.popover', function () {
      var $divType = $('.poi-type');
      var $divVector = $('.poi-vector');
      var $selectPark = $('#places-park');
      var $selectPoiType = $('#places-poi-type');

      $('#places-dataset').change(function () {
        if ($(this).val() === 'points_of_interest') {
          $divType.show();
          $divVector.show();
        } else {
          $divType.hide();
          $divVector.hide();
        }
      });

      function buildPark () {
        $.each(parks, function (i, park) {
          $selectPark.append('<option value="' + park.unit_code + '">' + park.full_name + '</option>');
        });
      }
      function buildPoiType () {
        $.each(poiTypes, function (i, type) {
          $selectPoiType.append('<option>' + type.type + '</option>');
        });
      }

      if (parks) {
        buildPark();
      } else {
        $.ajax({
          success: function (response) {
            parks = response.rows;
            buildPark();
          },
          url: 'https://nps.cartodb.com/api/v2/sql?q=SELECT full_name,unit_code FROM parks ORDER BY full_name'
        });
      }

      if (poiTypes) {
        buildPoiType();
      } else {
        $.ajax({
          success: function (response) {
            poiTypes = response.rows;
            buildPoiType();
          },
          url: 'https://nps.cartodb.com/api/v2/sql?q=SELECT DISTINCT type FROM points_of_interest WHERE type IS NOT NULL ORDER BY type'
        });
      }

      $('#places-form .btn').click(function () {
        activeButton.popover('hide');
        return false;
      });
      $('#places-form .btn-primary').click(function () {
        var dataset = $('#places-dataset').val();
        var unitCode = $('#places-park').val();
        var vector = false;
        var query;
        var type;

        if ($('.poi-type').is(':visible')) {
          var val = $('#places-poi-type').val();

          if (val !== 'All') {
            type = val;
          }

          vector = $('#places-poi-vector').prop('checked');
        }

        hasNameError = false;
        resetFields();
        $name.val(unitCode.toUpperCase() + ' ' + (type ? (type + 's') : $('#places-dataset option:selected').text()));

        if (vector) {
          $type
            .val('geojson')
            .trigger('change');
        } else {
          $type
            .val('cartodb')
            .trigger('change');
        }

        $.each($('#modal-addLayer .form-group'), function (index, formGroup) {
          var $formGroup = $(formGroup);

          if ($formGroup.hasClass('has-error')) {
            $formGroup.removeClass('has-error');
          }
        });

        query = 'SELECT * FROM ' + dataset + ' WHERE unit_code=\'' + unitCode + '\'' + (type ? ' AND type=\'' + type + '\'' : '');

        if (vector) {
          $('#geojson-url').val('https://nps.cartodb.com/api/v2/sql?q=' + query + '&format=geojson');
        } else {
          $('#cartodb-sql').val(query);
          $('#cartodb-table').val(dataset);
          $('#cartodb-user').val('nps');
        }
      });
    });
  $('input[type=radio][name=addAnOverlay]').change(function () {
    if (this.value === 'hosted') {
      $('#places').hide();
      $('#hosted').show();
    } else if (this.value === 'places') {
      $('#hosted').hide();
      $('#places').show();
    }
  });
  $(types.arcgisserver.fields.$layers).selectpicker({
    size: 5
  });
  $(types.arcgisserver.fields.$opacity)
    .add($(types.cartodb.fields.$opacity))
    .add($(types.mapbox.fields.$opacity))
    .add($(types.tiled.fields.$opacity))
    .slider({
      max: 100,
      min: 0,
      value: 100
    });
  $(window).resize(setHeight);
  setTimeout(function () {
    $type.focus();
  }, 100);

  return {
    _editingIndex: -1,
    _clearAllArcGisServerLayers: function () {
      types.arcgisserver.fields.$layers.val([]);
    },
    _load: function (layer) {
      var type = layer.type;

      popup = layer.popup || null;
      styles = layer.styles || null;
      tooltip = layer.tooltip || null;
      $type.val(type).trigger('change');

      for (var prop in layer) {
        var value = layer[prop];

        if (prop === 'attribution' || prop === 'description' || prop === 'name') {
          $('#layer' + (prop.charAt(0).toUpperCase() + prop.slice(1))).val(value);
        } else {
          if (prop === 'clickable' || prop === 'cluster' || prop === 'detectRetina' || prop === 'zoomToBounds') {
            $('#' + type + '-' + prop).prop('checked', value);
          } else if (prop === 'opacity') {
            $('#' + type + '-opacity').slider('setValue', value * 100);
          } else if (prop !== 'type') {
            $('#' + type + '-' + prop).val(value);
          }
        }
      }

      $('#layerType').attr('disabled', 'disabled');
      $('#modal-addLayer-description-create').hide();
      $('#modal-addLayer-description-update').show();
      $('#modal-addLayer-title').text('Update Overlay');
      $('#modal-addLayer .modal-footer .btn-primary').text('Save Overlay');

      if (type === 'arcgisserver') {
        var interval;

        types.arcgisserver.fields.$url.trigger('change');
        interval = setInterval(function () {
          if ($('#arcgisserver-layers option').length) {
            clearInterval(interval);
            types.arcgisserver.fields.$layers.selectpicker('val', layer.layers.split(','));
          }
        }, 100);
      }
    },
    _selectAllArcGisServerLayers: function () {
      $('#arcgisserver-layers option').prop('selected', 'selected');
    }
  };
})();
