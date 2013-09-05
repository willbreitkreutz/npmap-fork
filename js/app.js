var NPMap = NPMap || {};

NPMap.builder = (function() {
  var $buttonAddAnotherLayer,
      $modalAddLayer,
      $modalConfirm,
      $modalViewConfig,
      abcs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      stepLis;

  /**
   *
   */
  function goToStep(from, to) {
    var $stepSection = $('section .step');

    $($stepSection[from]).hide();
    $($stepSection[to]).show();
    $(stepLis[from]).removeClass('active');
    $(stepLis[to]).addClass('active');
  }
  /**
   *
   */
  function loadModule(module, callback) {
    module = module.replace('NPMap.builder.', '').replace(/\./g,'/');

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

  $(document).ready(function() {
    $('#button-addAnotherLayer, #button-addLayer').on('click', function() {
      if ($modalAddLayer) {
        $modalAddLayer.modal('show');
      } else {
        loadModule('NPMap.builder.ui.modal.addLayer', function() {
          $modalAddLayer = $('#modal-addLayer');
        });
      }
    });
    $('#button-viewConfig').on('click', function() {
      if ($modalViewConfig) {
        $modalViewConfig.modal('show');
      } else {
        loadModule('NPMap.builder.ui.modal.viewConfig', function() {
          $modalViewConfig = $('#modal-viewConfig');
        });
      }
    });

    // Setup base UI
    $buttonAddAnotherLayer = $('#button-addAnotherLayer');
    $modalConfirm = $('#modal-confirm');
    stepLis = $('#steps li');

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
    $($('section .step .btn-primary')[0]).on('click', function() {
      goToStep(0, 1);
    });
    $($('section .step .btn-primary')[1]).on('click', function() {
      goToStep(1, 2);
    });
    $('#metadata .description a').editable();
    $('#metadata .title a').editable();
    $('[rel=tooltip]').tooltip();
  });

  return {
    _handlers: {
      /**
       *
       */
      layerRemoveOnClick: function(el) {
        NPMap.builder.showConfirm('Yes, remove the layer', 'Once the layer is removed, you cannot get it back.', 'Are you sure?', function() {
          NPMap.builder.removeLayerLi(el);
          NPMap.builder.removeLayer($(el).parent().prev()[0].innerHTML);
        });
        return false;
      },
      /**
       *
       */
      layerTypeOnChange: function(value) {
        $.each($('#manual div'), function(i, div) {
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
    },
    /**
     *
     */
    _refreshLayersUl: function() {
      var $ul = $('#layers');

      if ($ul.children().length === 0) {
        $buttonAddAnotherLayer.hide();
        $ul.prev().css('padding', '15px 18px').show();
      } else {
        $buttonAddAnotherLayer.show();
        $ul.prev().css('padding', '0').hide();
      }
    },
    /**
     *
     */
    removeLayer: function(name) {
      NPMap.config.layers = $.grep(NPMap.config.layers, function(layer) {
        return layer.name !== name;
      });
      this.updateMap();
    },
    /**
     *
     */
    removeLayerLi: function(el) {
      $(el).parent().parent().parent().remove();
      this._refreshLayersUl();
    },
    /**
     *
     */
    showConfirm: function(button, content, title, callback) {
      



      $($modalConfirm.find('.btn-primary')[0]).html(button).on('click', function() {
        $modalConfirm.modal('hide');
        callback();
      });
      $($modalConfirm.find('.modal-body')[0]).html(content);
      $($modalConfirm.find('h3')[0]).html(title);
      $modalConfirm.modal('show');
    },
    /**
     *
     */
    updateMap: function() {
      $('iframe').attr('src', 'iframe.html?c=' + encodeURIComponent(JSON.stringify(NPMap.config)));
    }
  };
})();
NPMap.config = {
  "api": "leaflet",
  "div": "map"
};

NPMap.builder.updateMap();