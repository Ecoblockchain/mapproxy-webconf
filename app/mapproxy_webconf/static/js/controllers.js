function BaseListCtrl($scope, MessageService, TranslationService, service, _section) {
    $scope.refreshList = function() {
        $scope.list = service.list();
    };
    $scope.isSelected = function(item) {
        var class_;
        if(angular.equals($scope.selected, item)) {
            class_ = 'selected';
        }
        return class_;
    };
    $scope.editItem = function(event, item) {
        helper.safePreventDefaults(event);
        $scope.selected = item;
        service.current(item);
    };
    $scope.removeItem = function(event, item) {
        helper.safePreventDefaults(event);
        $scope.selected = undefined;
        service.remove(item);
    };
    $scope.copyItem = function(event, item) {
        helper.safePreventDefaults(event);
        $scope.selected = undefined;
        var copiedData = angular.copy(item.data);
        delete copiedData.name;
        var newItem = $.extend({}, {'data': service.model}, {'data': copiedData});
        service.current(newItem);
        MessageService.message(_section, 'copy_success', item.data.name + ' ' +TranslationService.translate('successfuly copied'));
    };
    $scope.newItem = function() {
        $scope.selected = undefined;
        service.current({'data': service.model});
    };

    if(!angular.isDefined($scope.$root[_section+'_messageService'])) {
        $scope.$root[_section+'_messageService'] = MessageService;
    }
    $scope.$root.$watch(_section + '_messageService.messages.' + _section + '.load_success', function() {
        //we must wrap this in a function, so we can overwrite refreshList in child
        $scope.refreshList()
    });
    $scope.$root.$watch(_section + '_messageService.messages.' + _section + '.add_success', function() {
        $scope.selected = service.last();
        $scope.refreshList();
    });
    $scope.$root.$watch(_section + '_messageService.messages.' + _section + '.update_success', function() {
        $scope.selected = service.last();
        $scope.refreshList();
    });
    $scope.$root.$watch(_section + '_messageService.messages.' + _section + '.delete_success', function() {
        $scope.refreshList();
        service.current({'data': service.model});
    });
    $scope.$root.$watch(_section + '_messageService.messages.' + _section + '.delete_has_dependencies', function(messageObject) {
        if(angular.isDefined(messageObject)) {
            var dialogContent = '<ul>';
            angular.forEach(messageObject.message, function(_dependencies, name) {
                if(_dependencies.length > 0) {
                    dialogContent += '<li>' + name[0].toUpperCase() + name.slice(1) +'<ul>';
                    if(name == 'layers') {
                        angular.forEach(_dependencies, function(dependency) {
                            dialogContent += '<li>' + dependency.title + ' (' + dependency.name + ')</li>';
                        });
                    } else {
                        angular.forEach(_dependencies, function(dependency) {
                            dialogContent += '<li>' + dependency.name + '</li>';
                        });
                    }
                    dialogContent += '</ul>';
                }
            });
            dialogContent += '</ul>';
            var title = TranslationService.translate("Can not delete because of dependencies");
            var dialogElement = $('<div style="display:none;" id="dialog_' + $scope.$id +'" title="' + title + '"></div>');
            dialogElement.append($(dialogContent))
            $(dialogElement).dialog({
                resizeable: false,
                width: (title.length * 12),
                height: 'auto',
                modal: true,
                buttons: [{
                    'text': TranslationService.translate('OK'),
                    'class': 'btn btn-sm btn-default',
                    'click': function() {
                        $(this).dialog("close");
                    }
                }]
            })
            MessageService.removeMessage(messageObject['section'], messageObject['action']);
        }
    });
};

function SourceListCtrl($injector, $scope, TranslationService, MapproxySources) {
    //http://jsfiddle.net/mhevery/u6s88/12/
    $injector.invoke(BaseListCtrl, this, {$scope: $scope, service: MapproxySources, _section: 'sources'});

    $scope.getInfos = function(source) {
        var data = {'Name' : source.data.name};
        if(angular.isDefined(source.data.req.url)) {
            data['URL'] = source.data.req.url;
        }
        if(angular.isDefined(source.data.req.layers)) {
            data['Layers'] = source.data.req.layers.join(', ');
        }
        if(angular.isDefined(source.data.req.transparent)) {
            data['Transparency'] = (source.data.req.transparent ? 'Yes' : 'No');
        }
        return helper.generateInfoDialogContent(data, TranslationService);
    };
};

function CacheListCtrl($injector, $scope, TranslationService, MapproxySources, MapproxyGrids, MapproxyCaches) {

    $injector.invoke(BaseListCtrl, this, {$scope: $scope, service: MapproxyCaches, _section: 'caches'});

    $scope.getInfos = function(cache) {
        var namedSources = []
        angular.forEach(cache.data.sources, function(id) {
            var sourceName = MapproxySources.nameById(id) || MapproxyCaches.nameById(id);
            namedSources.push(sourceName ? sourceName : id);
        });
        var namedGrids = [];
        angular.forEach(cache.data.grids, function(id) {
            var gridName = MapproxyGrids.nameById(id);
            namedGrids.push(gridName ? gridName : id);
        });

        var data = {'Name' : cache.data.name};
        if(angular.isDefined(cache.data.sources)) {
            data['Sources'] = namedSources.join(', ');
        }
        if(angular.isDefined(cache.data.grids)) {
            data['Grids'] = namedGrids.join(', ');
        }
        if(angular.isDefined(cache.data.format)) {
            data['Format'] = cache.data.format;
        }
        return helper.generateInfoDialogContent(data, TranslationService);
    };
};

function GridListCtrl($injector, $scope, TranslationService, MapproxyGrids) {

    $injector.invoke(BaseListCtrl, this, {$scope: $scope, service: MapproxyGrids, _section: 'grids'});

    $scope.refreshList = function() {
        $scope.list = [];
        $scope.defaultGrids = [];
        angular.forEach(MapproxyGrids.list(), function(grid) {
            if(grid.default) {
                $scope.defaultGrids.push(grid);
            } else {
                $scope.list.push(grid);
            }
        });
    };

    $scope.getInfos = function(grid) {
        var coverage = (grid.data.coverage && grid.data.coverage.bbox) ? grid.data.coverage.bbox : false;
        if(coverage) {
            coverage += grid.data.coverage.srs ? '(' + grid.data.coverage.srs + ')' : '';
        }

        var data = {'Name' : grid.data.name};
        if(angular.isDefined(grid.data.srs)) {
            data['SRS'] = grid.data.srs;
        }
        if(coverage) {
            data['Coverage'] = coverage;
        }
        if(angular.isDefined(grid.data.origin)) {
            data['Origin'] = grid.data.origin;
        }

        return helper.generateInfoDialogContent(data, TranslationService);
    };
};

function LayerListCtrl($injector, $scope, MapproxyLayers) {

    $injector.invoke(BaseListCtrl, this, {$scope: $scope, service: MapproxyLayers, _section: 'layers'});

    $scope.updateLayerTree = function() {
        $scope.selected = undefined;
        MapproxyLayers.updateStructure($scope.list);
    };
    $scope.listChanged = function() {
        $scope._listChanged = (!angular.equals($scope.list, MapproxyLayers.tree()));
        return $scope._listChanged;
    };
};

function MapProxyConfigCtrl($scope, $http, MessageService, TranslationService, CREATE_CONFIG_URL) {
    $scope.writeMapProxyConfig = function(event) {
        var dialogOptions = {
            resizeable: false,
            width: 400,
            height: 200,
            modal: true,
            buttons: [{
                'text': TranslationService.translate('OK'),
                'class': 'btn btn-sm btn-default',
                'click': function() {
                    $(this).dialog("close");
                }
            }]
        }

        var title = TranslationService.translate("Create MapProxy Config");
        var dialogElement = $('<div style="display:none;" id="dialog_' + $scope.$id +'" title="' + title + '"></div>');

        $http.post(CREATE_CONFIG_URL)
            .success(function(message) {
                var dialogContent = "<div>" + message.success + "</div>";
                dialogElement.append($(dialogContent));
                $(dialogElement).dialog(dialogOptions);
            }).error(function (message) {
                var dialogContent = "<div>" + message.error + "</div>";
                dialogElement.append($(dialogContent));
                $(dialogElement).dialog(dialogOptions);
            });
    };

    $scope._messageService = MessageService;
}

function TreeCtrl($scope, SRS, MessageService, WMSSources, ProjectDefaults) {

    var refreshTree = function() {
        $scope.wms_list = WMSSources.list();
        $scope.wms_urls = WMSSources.allURLs();
    };

    $scope.prepareItemData = function(layer) {
        if(layer.name != null) {
            return [layer]
        }
        var _layers = [];
        angular.forEach(layer.layers, function(_layer) {
            _layers = _layers.concat($scope.prepareItemData(_layer));
        })
        return _layers;
    };
    $scope.addCapabilities = function() {
        WMSSources.add({data: {url: $scope.capabilities.url}});
    };
    $scope.refreshCapabilities = function(event, wms) {
        event.stopPropagation();
        WMSSources.refresh(wms);
    };
    $scope.removeCapabilities = function(wms) {
        WMSSources.remove(wms);
    };
    $scope.showMap = function(event, wms) {
        event.stopPropagation();
        var srs = ($.inArray(SRS.toUpperCase(), wms.data.layer.srs) != -1 || $.inArray(SRS.toLowerCase(), wms.data.layer.srs) != -1) ?
            SRS : wms.data.layer.srs[0];
        var extent = wms.data.layer.llbbox;
        $scope.olmapBinds = {
            visible: true,
            proj: srs,
            extent: extent,
            singleWMSRequest: true,
            showScaleRes: true,
            title: wms.data.title,
            layers: {'wms': wms.data.layer.layers},
            url: wms.data.url,
            dpi: $scope.defaults.data.dpi
        }
    }

    $scope._messageService = MessageService;
    $scope.$watch('_messageService.messages.wms_capabilities.load_success', refreshTree);
    $scope.$watch('_messageService.messages.wms_capabilities.delete_success', refreshTree);
    $scope.$watch('_messageService.messages.wms_capabilities.add_success', refreshTree);
    $scope.$watch('_messageService.messages.wms_capabilities.update_success', refreshTree);
    $scope.$watch('_messageService.messages.defaults.load_success', function() {
        var defaults = ProjectDefaults.list();
        if(defaults.length > 0) {
            $scope.defaults = defaults[0];
        }
    });

    $scope.$on('olmap.ready', function(scope, map) {
        $scope.map = map;
    });

    $scope.capabilities = {};
};

function MapproxySourceFormCtrl($scope, $http, PAGE_LEAVE_MSG, SRS, NON_TRANSPARENT_FORMATS, BACKGROUND_SERVICE_TITLE, BACKGROUND_SERVICE_URL, BACKGROUND_SERVICE_LAYER, BBOXES, TranslationService, MessageService, MapproxySources, ProjectDefaults, WMSSources, MapproxyCaches) {

    var setSource = function() {
        $scope.source = MapproxySources.current();

        $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.source);

        $scope.form.$setPristine();

        //if equal, we have a clean new source
        if(angular.equals($scope.source.data, MapproxySources.model)) {
            $scope.formTitle = 'new';
            if(angular.isDefined($scope.defaults.data.srs)) {
                $scope.source.data.supported_srs = angular.copy($scope.defaults.data.srs);
            }
        //the only case, we have a not clean source without name is after copy one
        } else if(angular.isUndefined($scope.source.data.name)) {
            $scope.formTitle = 'new';
            $scope.form.$dirty = true;
        } else {
            $scope.formTitle = 'edit';
        }

        if(!helper.isEmpty($scope.source.data.coverage.polygon) && helper.isEmpty($scope.source.data.coverage.bbox)) {
            $scope.custom.bboxSelected = false;
        } else {
            $scope.custom.bboxSelected = true;
        }

        if($scope.source._manual) {
            $scope.editareaBinds.visible = true;
        } else {
            $scope.editareaBinds.visible = false;
        }
    };

    $scope.warningLogic = {
        checkImageSettings: function() {
            if(angular.isUndefined($scope.source.data.req)) {
                return false;
            }
            var non_transparent_formats = NON_TRANSPARENT_FORMATS;
            return $scope.source.data.req.transparent == true &&
            $(non_transparent_formats).not($scope.source.data.supported_formats).length != non_transparent_formats.length
        }

    };

    $scope.prepareForEditarea = function(source) {
        return $.extend(true, {'data': {'name': ""}}, source);
    };
    $scope.loadSRS = function() {
        var result = WMSSources.srs($scope.source.data.req.url);
        if(result) {
            angular.forEach(result, function(srs) {
                if($.inArray(srs, $scope.source.data.supported_srs) === -1) {
                    if(angular.isUndefined($scope.source.data.supported_srs)) {
                        $scope.source.data.supported_srs = [srs];
                    } else {
                        $scope.source.data.supported_srs.push(srs);
                    }
                    $scope.form.$setDirty();
                }
            });
        }
    };
    $scope.openDialog = function(callback, new_data) {
        if(angular.isUndefined($scope.source.data.req) ||
           angular.isUndefined($scope.source.data.req.url) ||
           angular.isUndefined($scope.source.data.req.layers) ||
           $scope.source.data.req.layers.length == 0) {
            callback(true);
        } else  {
            var buttons = [
                {
                    'text': TranslationService.translate('Change URL'),
                    'class': 'btn btn-sm btn-default',
                    'click': function() {
                        $(this).dialog("close");
                        $scope.source.data.req.layers = undefined;
                        helper.safeApply($scope)
                        callback(true);
                    }
                },
                {
                    'text': TranslationService.translate('Keep URL'),
                    'class': 'btn btn-sm btn-default',
                    'click': function() {
                        $(this).dialog("close");
                        callback(false);
                    }
                }
            ]
            $('#confirm_url_change_dialog').dialog({
                resizeable: false,
                width: 400,
                height: 'auto',
                modal: true,
                buttons: buttons
            });
        }
    };
    $scope.checkURL = function(callback, new_data) {
        //if add grouped layers, all layer have the same url, so only the first one must be checked
        new_data = new_data[0]
        var addLayer = false;
        var urlReplaceAsk = false;
        if(angular.isUndefined($scope.source.data.req.url)) {
            $scope.source.data.req.url = new_data.sourceURL;
            addLayer = true;
        } else {
            if(angular.equals($scope.source.data.req.url, new_data.sourceURL)) {
                addLayer = true;
            } else {
                urlReplaceAsk = true;
            }
        }
        if(urlReplaceAsk) {
            var buttons = [
                {
                    'text': TranslationService.translate('Change url and insert layer'),
                    'class': 'btn btn-sm btn-default',
                    'click': function() {
                        $(this).dialog("close");
                        $scope.source.data.req.url = new_data.sourceURL;
                        $scope.source.data.req.layers = undefined;
                        helper.safeApply($scope)
                        callback(true);
                    }
                },
                {
                    'text': TranslationService.translate('Keep url and reject layer'),
                    'class': 'btn btn-sm btn-default',
                    'click': function() {
                        $(this).dialog("close");
                        callback(false);
                    }
                }
            ]
            $('#confirm_layer_change_dialog').dialog({
                resizeable: false,
                width: 400,
                height: 'auto',
                modal: true,
                buttons: buttons
            });
        }
        if(addLayer) {
            callback(true);
        }
    };
    $scope.addSource = function(event) {
        helper.safePreventDefaults(event);

        $scope.source = helper.clearData($scope.source)

        var errorMsg = false;
        if((!$scope.form.$valid)) {
            errorMsg = TranslationService.translate("Unable to save. Pleace fill all colored fields.");
        } else {
            //found is the section of element with $scope.source.data.name if found
            var found = helper.nameExistInService(
                $scope.source.data.name,
                $scope.source._id,
                MapproxySources,
                [MapproxySources, MapproxyCaches]);
            if(found) {
                errorMsg = TranslationService.translate('Name already exists in ' + found)
            }
        }
        if(errorMsg) {
            MessageService.message('sources', 'form_error', errorMsg);
        } else {
            $scope.source._manual = $scope.editareaBinds.visible;
            MapproxySources.add($scope.source);
            $scope.formTitle = 'edit';
            $scope.form.$setPristine();
            $scope.editareaBinds.dirty = false;
        }
    };
    $scope.validBBox = function() {
        if(angular.isUndefined($scope.source.data.coverage)) {
            return false;
        }
        var bbox = $scope.source.data.coverage.bbox
        if(helper.isEmpty(bbox)) {
            return false;
        }
        var nonValues = false;
        for(var i = 0; i < 4; i++) {
            if(bbox[i] == undefined || bbox[i] == null) {
                nonValues = true;
                break
            }
        }
        return !nonValues && bbox.length == 4;
    };
    $scope.hasCoverage = function() {
        if($scope.custom.bboxSelected) {
            return $scope.validBBox();
        } else {
            return angular.isDefined($scope.source.data.coverage.polygon) && !helper.isEmpty($scope.source.data.coverage.polygon);
        }
    }
    $scope.addCoverage = function(event) {
        helper.safePreventDefaults(event);
        var bbox = WMSSources.coverage($scope.source.data.req.url);
        if(bbox) {
            if(angular.isUndefined($scope.source.data.coverage)) {
                $scope.source.data.coverage = {
                    'bbox': bbox,
                    'srs': SRS
                };
            } else {
                $scope.source.data.coverage.bbox = bbox;
                $scope.source.data.coverage.bbox_srs = SRS;
            }
            $scope.form.$setDirty();
        } else {
            MessageService.message('source', 'load_coverage_error', TranslationService.translate('Load coverage not supported for custom URL'))
        }
    };
    $scope.haveCoverage = function() {
        if(angular.isUndefined($scope.source.data)) {
            return false;
        }
        if(angular.isUndefined($scope.source.data.coverage)) {
            return false;
        }
        if(helper.isEmpty($scope.source.data.coverage.bbox) && helper.isEmpty($scope.source.data.coverage.polygon)) {
            return false;
        }
        return true;
    };
    $scope.showMap = function(event) {
        helper.safePreventDefaults(event);
        var srs = $scope.custom.bboxSelected ? $scope.source.data.coverage.bbox_srs : $scope.source.data.coverage.polygon_srs;
        srs = srs || SRS;

        $scope.olmapBinds = {
            visible: true,
            proj: srs,
            title: $scope.haveCoverage() ? TranslationService.translate('Edit coverage') : TranslationService.translate('Create coverage'),
            layers: {
                'background': [{
                    title: BACKGROUND_SERVICE_TITLE,
                    url: BACKGROUND_SERVICE_URL,
                    name: BACKGROUND_SERVICE_LAYER,
                    baseLayer: true
                }]
            }
        };
    };
    $scope.resetForm = function(event) {
        helper.safePreventDefaults(event);
        $scope.form.$setPristine();
        setSource();
    };
    $scope.addLayerManual = function(event) {
        helper.safePreventDefaults(event);
        var new_layer = $scope.custom.layer_manual;
        if(angular.isDefined(new_layer)) {
            if(!angular.isArray($scope.source.data.req.layers)) {
                $scope.source.data.req.layers = [new_layer];
            } else {
                $scope.source.data.req.layers.push(new_layer);
            }
            $scope.form.$setDirty();
            $scope.custom.layer_manual = undefined;
        }
    };
    $scope.addSRSManual = function(event) {
        helper.safePreventDefaults(event);
        if($.inArray($scope.custom.srs_manual, $scope.source.data.supported_srs) === -1) {
            if(angular.isUndefined($scope.source.data.supported_srs)) {
                $scope.source.data.supported_srs = [$scope.custom.srs_manual];
            } else {
                $scope.source.data.supported_srs.push($scope.custom.srs_manual);
            }
            $scope.form.$setDirty();
            $scope.custom.srs_manual = undefined;
        }
    };
    $scope.removeSRS = function(event, srs) {
        helper.safePreventDefaults(event);
        var supportedSRSID = $.inArray(srs, $scope.source.data.supported_srs);
        if(supportedSRSID !== -1) {
            $scope.source.data.supported_srs.splice(supportedSRSID, 1);
        }
    };
    $scope.clearSRS = function(event) {
        helper.safePreventDefaults(event);
        $scope.source.data.supported_srs = [];
    };
    $scope.layerTitle = function(layer) {
        return WMSSources.layerTitle($scope.source.data.req.url, layer);
    };
    $scope.provideEditorData = function() {
        var editorData = {
            'layer': {
                'name': 'Coverage',
                'isDrawLayer': true,
                'geometries': function() {
                    var geometry = undefined;
                    if($scope.custom.bboxSelected && $scope.validBBox()) {
                        geometry = {
                            'type': 'bbox',
                            'coordinates': $scope.source.data.coverage.bbox
                        };
                    } else if(!helper.isEmpty($scope.source.data.coverage.polygon)) {
                        geometry = $scope.source.data.coverage.polygon
                    }
                    return angular.isDefined(geometry) ? [geometry] : [];
                }
            },
            'setResultGeometry': $scope.setResultGeometry
        }
        return editorData;
    };
    $scope.setResultGeometry = function(geometry) {
        helper.safeApply($scope, function() {
            var change = false;
            if(geometry) {
                if(geometry.type == 'rect') {
                    $scope.source.data.coverage.bbox = geometry.bbox;
                    $scope.source.data.coverage.polygon = angular.fromJson(geometry.geojson);
                    $scope.source.data.coverage.bbox_srs = $scope.olmapBinds.proj.projCode;
                    $scope.source.data.coverage.polygon_srs = $scope.olmapBinds.proj.projCode;
                    change = true;
                } else if(geometry.type == 'Polygon') {
                    $scope.source.data.coverage.bbox = []
                    $scope.source.data.coverage.polygon = angular.fromJson(geometry.geojson);
                    $scope.source.data.coverage.bbox_srs = $scope.olmapBinds.proj.projCode;
                    $scope.source.data.coverage.polygon_srs = $scope.olmapBinds.proj.projCode;
                    $scope.custom.bboxSelected = false;
                    change = true;
                }
            } else {
                change = angular.isDefined($scope.source.data.coverage.bbox) && $scope.source.data.coverage.bbox != [];
                $scope.source.data.coverage.bbox = [];
                change = change || angular.isDefined($scope.source.data.coverage.polygon) && $scope.source.data.coverage.polygon != [];
                $scope.source.data.coverage.polygon = [];
                $scope.custom.bboxSelected = true;
            }
            if(change) {
                $scope.form.$setDirty();
            }
        });
    };
    $scope.saveFromEditarea = function() {
        $scope.source = $scope.editareaBinds.editareaValue;
        $scope.addSource();
    };
    //must defined here if this controller should own all subelements of custom/source
    $scope.custom = {
        'bboxSelected': true
    };
    $scope.defaults = {'data': ProjectDefaults.model};

    $scope.source = {'data': MapproxySources.model};
    $scope.formTitle = 'new';

    $scope.editareaBinds = {
        editareaValue: $scope.prepareForEditarea($scope.source),
        visible: false,
        dirty: false,
        save: $scope.saveFromEditarea
    };

    MapproxySources.current($scope.source);

    $scope.$on('sources.current', setSource);

    $scope._messageService = MessageService;
    $scope.$watch('_messageService.messages.defaults.load_success', function() {
        var defaults = ProjectDefaults.list();
        if(defaults.length > 0) {
            $scope.defaults = defaults[0];
        }
    });

    $scope.$watch('_messageService.messages.sources.add_success + _messageService.messages.sources.update_success', function() {
        helper.safeApply($scope, function() {
            $scope.form.$setPristine();
        });
    });

    $scope.$watch('source', function() {
            $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.source);
        }, true
    );

    $(window).on('beforeunload', function() {
        if($scope.form.$dirty || $scope.editareaBinds.dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function MapproxyCacheFormCtrl($scope, PAGE_LEAVE_MSG, TranslationService, MessageService, MapproxySources, MapproxyGrids, MapproxyCaches) {

    var refreshGrids = function() {
        $scope.available_grids = MapproxyGrids.list();
    };

    var setCache = function() {
        $scope.cache = MapproxyCaches.current();
        $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.cache);

        $scope.form.$setPristine();

        if(angular.equals($scope.cache.data, MapproxyCaches.model)) {
            $scope.formTitle = 'new';
        } else if(angular.isUndefined($scope.cache.data.name)) {
            $scope.formTitle = 'new';
            $scope.form.$dirty = true;
        }else {
            $scope.formTitle = 'edit';
        }

        if($scope.cache._manual) {
            $scope.editareaBinds.visible = true;
        } else {
            $scope.editareaBinds.visible = false;
        }
    };

    $scope.replaceIdsWithNames = function(cache) {
        cache = angular.copy(cache);
        var named = [];
        angular.forEach(cache.data.sources, function(id) {
            var sourceName = MapproxySources.nameById(id) || MapproxyCaches.nameById(id);
            named.push(sourceName ? sourceName : id);
        });
        cache.data.sources = named;
        named = [];
        angular.forEach(cache.data.grids, function(id) {
            var gridName = MapproxyGrids.nameById(id);
            named.push(gridName ? gridName : id);
        });
        cache.data.grids = named;
        return cache;
    };
    $scope.replaceNamesWithIds = function(cache) {
        cache = angular.copy(cache);
        var ids = [];
        angular.forEach(cache.data.sources, function(name) {
            var sourceId = MapproxySources.idByName(name);
            ids.push(sourceId ? sourceId : name);
        });
        cache.data.sources = ids;
        ids = [];
        angular.forEach(cache.data.grids, function(name) {
            var gridId = MapproxyGrids.idByName(name) || MapproxyCaches.idByName(name);
            ids.push(gridId ? gridId : name);
        });
        cache.data.grids = ids;
        return cache;
    };
    $scope.prepareForEditarea = function(cache) {
        return $scope.replaceIdsWithNames($.extend(true, {'data': {'name': ''}}, cache));
    };
    $scope.checkSource = function(callback, new_item) {
        if(angular.isDefined($scope.cache._id)) {
            callback($scope.cache._id != new_item._id && $scope.cache.data.name != new_item.data.name)
        } else {
            callback($scope.cache.data.name !== new_item.data.name)
        }
    };
    $scope.addCache = function(event) {
        helper.safePreventDefaults(event);

        $scope.cache = helper.clearData($scope.cache);

        var errorMsg = false;
        if((!$scope.form.$valid)) {
            errorMsg = TranslationService.translate("Unable to save. Pleace fill all colored fields.");
        } else {
            //found is the section of element with $scope.cache.data.name if found
            var found = helper.nameExistInService(
                $scope.cache.data.name,
                $scope.cache._id,
                MapproxyCaches,
                [MapproxySources, MapproxyCaches]);
            if(found) {
                errorMsg = TranslationService.translate('Name already exists in ' + found)
            }
        }
        if(errorMsg) {
            MessageService.message('caches', 'form_error', errorMsg);
        } else {
            $scope.cache._manual = $scope.editareaBinds.visible;
            MapproxyCaches.add($scope.cache);
            $scope.formTitle = 'edit';
            $scope.form.$setPristine();
            $scope.editareaBinds.dirty = false;
        }
    };
    $scope.resetForm = function(event) {
        helper.safePreventDefaults(event);
        $scope.form.$setPristine();
        setCache();
    };
    $scope.showName = function(_id) {
        var name = MapproxySources.nameById(_id) || MapproxyCaches.nameById(_id) || MapproxyGrids.nameById(_id);
        return name ? name : _id;
    };
    $scope.saveFromEditarea = function() {
        $scope.cache = $scope.editareaBinds.editareaValue;
        $scope.addCache();
    };

    $scope.cache = {'data': MapproxyCaches.model}
    $scope.formTitle = 'new';

    $scope.editareaBinds = {
        editareaValue: $scope.prepareForEditarea($scope.cache),
        visible: false,
        dirty: false,
        save: $scope.saveFromEditarea
    };

    MapproxyCaches.current($scope.cache);

    $scope.$on('caches.current', setCache);

    $scope._messageService = MessageService;

    $scope.$watch('_messageService.messages.grids.load_success', refreshGrids);

    $scope.$watch('_messageService.messages.caches.add_success + _messageService.messages.caches.update_success', function() {
        helper.safeApply($scope, function() {
            $scope.form.$setPristine();
        });
    });

    $scope.$watch('cache', function() {
        $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.cache);
    }, true)

    $(window).on('beforeunload', function() {
        if($scope.form.$dirty || $scope.editareaBinds.dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function MapproxyGridFormCtrl($scope, PAGE_LEAVE_MSG, SRS, BACKGROUND_SERVICE_TITLE, BACKGROUND_SERVICE_URL, BACKGROUND_SERVICE_LAYER, BBOXES, $http, TranslationService, MessageService, DataShareService, ProjectDefaults, MapproxyGrids) {
    var setGrid = function() {
        $scope.grid = MapproxyGrids.current();
        DataShareService.data('clearCalculatedTiles', true);

        $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.grid);

        if(angular.isUndefined($scope.grid.data.bbox)) {
            $scope.grid.data.bbox = [null, null, null, null];
        }

        $scope.form.$setPristine();

        if(angular.equals($scope.grid.data, MapproxyGrids.model)) {
            $scope.formTitle = 'new';
        } else if(angular.isUndefined($scope.grid.data.name)) {
            $scope.formTitle = 'new';
            $scope.form.$dirty = true;
        } else {
            $scope.formTitle = 'edit';
        }

        if($scope.grid.default) {
            $scope.formTitle = 'default';
            $scope.editareaBinds.visible = false;
        } else {
            if($scope.grid._manual) {
                $scope.editareaBinds.visible = true;
            } else {
                $scope.editareaBinds.visible = false;
            }
        }

        helper.safeApply($scope);
    };

    $scope.prepareForEditarea = function(data) {
        return $.extend(true, {'data': {'name': ""}}, data);
    };
    $scope.addGrid = function(event, fromEditarea) {
        helper.safePreventDefaults(event);

        $scope.grid = helper.clearData($scope.grid);

        var errorMsg = false;
        if((!$scope.form.$valid)) {
            errorMsg = TranslationService.translate("Unable to save. Pleace fill all colored fields.");
        } else if(helper.nameExistInService(
            $scope.grid.data.name,
            $scope.grid._id,
            MapproxyGrids,
            [MapproxyGrids]
        )) {
            errorMsg = TranslationService.translate("Name already exists");
        }
        if(errorMsg) {
            MessageService.message('grids', 'form_error', errorMsg);
        } else {
            $scope.grid._manual = $scope.editareaBinds.visible;
            MapproxyGrids.add($scope.grid);
            $scope.formTitle = 'edit';
            $scope.form.$setPristine();
            $scope.editareaBinds.dirty = false;
        }
    };
    $scope.lockGrid = function(event) {
        helper.safePreventDefaults(event);

        $scope.grid._locked = true;
        $scope.addGrid();
    };
    $scope.unlockGrid = function(event) {
        helper.safePreventDefaults(event);
        $scope.grid._locked = false;
        $scope.addGrid();
    };
    $scope.calculateTiles = function() {
        var data = {
            'srs': $scope.grid.data.srs,
            'bbox': $scope.grid.data.bbox,
            'bbox_srs': $scope.grid.data.bbox_srs,
            'name': $scope.grid.data.name,
            'dpi': $scope.defaults.data.dpi,
            'res': helper.isEmpty($scope.grid.data.res) ? undefined : $scope.grid.data.res,
            'scales': helper.isEmpty($scope.grid.data.scales) ? undefined : $scope.grid.data.scales
        };

        $http.post($scope.calculateTilesURL, data).success(function(response) {
            DataShareService.data('calculatedTiles', response.result);
        });
    }
    $scope.resetForm = function(event) {
        helper.safePreventDefaults(event);
        $scope.form.$setPristine();
        setGrid();
    };
    $scope.allowMap = function(event) {
        helper.safePreventDefaults(event);
        if(angular.isUndefined($scope.grid.data.srs) ||
           angular.isUndefined($scope.grid.data.bbox) ||
           !$scope.validBBox() ||
           angular.isUndefined($scope.grid.data.bbox_srs)) {
            return false;
        }
        return true;
    };
    $scope.showMap = function(event) {
        helper.safePreventDefaults(event);
        var data = $scope.provideGridData();

        $http.post($scope.checkGridParameterURL, data).
            success(function(response) {
                $scope.custom.grid_scales = response.scales;
                if($scope.grid.data.bbox_srs != $scope.custom.mapSRS) {
                    $http.post($scope.transformBBoxURL, {
                        'source': $scope.grid.data.bbox_srs,
                        'dest': $scope.custom.mapSRS,
                        'bbox': $scope.grid.data.bbox
                    }).
                        success(function(response) {
                            $scope.olmapBinds.extent = response.bbox,
                            $scope.olmapBinds.proj = $scope.custom.mapSRS,
                            $scope.olmapBinds.title = 'Grid: "' + $scope.grid.data.name +'"',
                            $scope.olmapBinds.visible = true;
                        }).
                        error(function(response) {
                            //XXXkai: error handling
                            angular.noop();
                        });
                } else {
                    $scope.olmapBinds.extent = $scope.grid.data.bbox;
                    $scope.olmapBinds.proj = $scope.custom.mapSRS;
                    $scope.olmapBinds.title = 'Grid: "' + $scope.grid.data.name +'"';
                    $scope.olmapBinds.visible = true;
                }
            }).
            error(function(response) {
                MessageService.message('olMap', 'showMap_error', response.error)
            });
    };
    $scope.provideGridData = function() {
        var gridData = {
            'srs': $scope.grid.data.srs,
            'bbox_srs': $scope.grid.data.bbox_srs,
            'origin': $scope.grid.data.origin,
            'map_srs': $scope.custom.mapSRS,
            'res': $scope.grid.data.res,
            'scales': $scope.grid.data.scales
        };
        if(!helper.isEmpty($scope.grid.data.bbox)) {
            gridData.grid_bbox = $scope.grid.data.bbox;
        }
        if(angular.isDefined(gridData.scales)) {
            gridData.units = $scope.grid.data.units;
            gridData.dpi = $scope.defaults.data.dpi;
        }
        return gridData;
    };
    $scope.validBBox = function() {
        var bbox = $scope.grid.data.bbox
        var empty = helper.isEmpty(bbox);
        var nonValues = false;
        for(var i = 0; i < 4; i++) {
            if(bbox[i] == undefined || bbox[i] == null) {
                nonValues = true;
                break
            }
        }
        return !empty && !nonValues && bbox.length == 4;
    };
    $scope.fillBBox = function(event) {
        helper.safePreventDefaults(event);
        if(helper.isEmpty($scope.grid.data.bbox)) {
            $scope.grid.data.bbox = angular.copy(BBOXES[$scope.grid.data.bbox_srs]);
        } else {
            var haveDefaultBBox = false;
            angular.forEach(BBOXES, function(bbox) {
                if(!haveDefaultBBox && angular.equals(bbox, $scope.grid.data.bbox)) {
                    haveDefaultBBox = true;
                }
            });
            if(haveDefaultBBox) {
                $scope.grid.data.bbox = angular.copy(BBOXES[$scope.grid.data.bbox_srs]);
            }
        }
    };
    $scope.saveFromEditarea = function(leaveEditarea) {
        $scope.grid = $scope.editareaBinds.editareaValue;
        if(leaveEditarea && $scope.grid.data.res && $scope.grid.data.scales) {
            delete $scope.grid.data.scales;
        }
        $scope.addGrid(undefined, true);
    };

    $scope.custom = {
        'mapSRS': SRS
    };
    $scope.grid = angular.copy({'data': MapproxyGrids.model});

    $scope.formTitle = 'new';

    $scope.editareaBinds = {
        editareaValue: $scope.prepareForEditarea($scope.grid),
        visible: false,
        dirty: false,
        save: $scope.saveFromEditarea
    };

    $scope.olmapBinds = {
        visible: false,
        proj: $scope.custom.mapSRS,
        layers: {
            'background': [{
                title: BACKGROUND_SERVICE_TITLE,
                url: BACKGROUND_SERVICE_URL,
                name: BACKGROUND_SERVICE_LAYER,
                baseLayer: true
            }]
        }
    };

    MapproxyGrids.current($scope.grid);

    $scope.$on('grids.current', setGrid);

    $scope.$on('dss.refreshCalculatedTiles', function() {
        $scope.calculateTiles();
    });

    $scope.$watch('editareaBinds.visible', function(isVisible, wasVisible) {
        if(isVisible) {
            $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.grid);
        }
    });

    $scope._messageService = MessageService;

    $scope.$watch('_messageService.messages.defaults.load_success', function() {
        var defaults = ProjectDefaults.list();
        if(defaults.length > 0) {
            $scope.defaults = defaults[0];
        }
    });

    $scope.$watch('_messageService.messages.grids.add_success + _messageService.messages.grids.update_success', function() {
        helper.safeApply($scope, function() {
            $scope.form.$setPristine();
        });
    });

    $(window).on('beforeunload', function() {
        if($scope.form.$dirty || $scope.editareaBinds.dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function MapproxyLayerFormCtrl($scope, $http, PAGE_LEAVE_MSG, TranslationService, MessageService, ProjectDefaults, MapproxySources, MapproxyCaches, MapproxyLayers) {

    var setLayer = function() {
        $scope.layer = MapproxyLayers.current();

        $scope.form.$setPristine();

        if(angular.equals($scope.layer.data, MapproxyLayers.model)) {
            $scope.formTitle = 'new';
        } else if(angular.isUndefined($scope.layer.data.name)) {
            $scope.formTitle = 'new';
            $scope.form.$dirty = true;
        } else {
            $scope.formTitle = 'edit';
        }

        $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.layer);

        if($scope.layer._manual) {
            $scope.editareaBinds.visible = true;
        } else {
            $scope.editareaBinds.visible = false;
        }
    };

    $scope.replaceIdsWithNames = function(layer) {
        layer = angular.copy(layer);
        var names = [];
        angular.forEach(layer.data.sources, function(id) {
            var sourceName = MapproxySources.nameById(id) || MapproxyCaches.nameById(id);
            names.push(sourceName ? sourceName : id);
        });
        layer.data.sources = names;
        return layer;
    };
    $scope.prepareForEditarea = function(layer) {
        layer = $.extend(true, {'data': {'name': ""}}, layer)
        return $scope.replaceIdsWithNames(layer);
    };
    $scope.replaceNamesWithIds = function(layer) {
        layer = angular.copy(layer);
        var ids = [];
        angular.forEach(layer.data.sources, function(name) {
            var sourceId = MapproxySources.idByName(name) || MapproxyCaches.idByName(name);
            ids.push(sourceId ? sourceId : name);
        });
        layer.data.sources = ids;
        return layer;
    };
    $scope.addLayer = function(event) {
        helper.safePreventDefaults(event);

        $scope.layer = helper.clearData($scope.layer)
        var errorMsg = false;
        if((!$scope.form.$valid)) {
            errorMsg = TranslationService.translate("Unable to save. Pleace fill all colored fields.");
        } else if(helper.nameExistInService(
            $scope.layer.data.name,
            $scope.layer._id,
            MapproxyLayers,
            [MapproxyLayers]
        )) {
            errorMsg = TranslationService.translate("Name already exists");
        }
        if(errorMsg) {
            MessageService.message('layers', 'form_error', errorMsg);
        } else {
            $scope.layer._manual = $scope.editareaBinds.visible;
            MapproxyLayers.add($scope.layer);
            $scope.formTitle = 'edit';
            $scope.form.$setPristine();
            $scope.editareaBinds.dirty = false;
        }
    };
    $scope.resetForm = function(event) {
        helper.safePreventDefaults(event);
        $scope.form.$setPristine();
        setLayer();
    };
    $scope.layerTitle = function(name) {
        var layer = MapproxyLayers.byName(name);
        if(angular.isDefined(layer)) {
            return layer.title;
        }
    };
    $scope.showName = function(_id) {
        var name = MapproxySources.nameById(_id) || MapproxyCaches.nameById(_id);
        return name ? name : _id;
    };
    $scope.saveFromEditarea = function() {
        $scope.layer = $scope.editareaBinds.editareaValue;
        $scope.addLayer();
    };

    $scope.custom = {};

    $scope.defaults = {'data': ProjectDefaults.model};
    $scope.layer = angular.copy({'data': MapproxyLayers.model});
    MapproxyLayers.current($scope.layer);
    $scope.formTitle = 'new';

    $scope.editareaBinds = {
        editareaValue: $scope.prepareForEditarea($scope.layer),
        visible: false,
        dirty: false,
        save: $scope.saveFromEditarea
    };

    $scope.$on('layers.current', setLayer);

    $scope._messageService = MessageService;
    $scope.$watch('_messageService.messages.defaults.load_success', function() {
        var defaults = ProjectDefaults.list();
        if(defaults.length > 0) {
            $scope.defaults = defaults[0];
        }
    });
    $scope.$watch('_messageService.messages.layers.add_success + _messageService.messages.layers.update_success', function() {
        helper.safeApply($scope, function() {
            $scope.form.$setPristine();
        });
    });
    $scope.$watch('layer', function() {
        $scope.editareaBinds.editareaValue = $scope.prepareForEditarea($scope.layer);
    }, true);
    $(window).on('beforeunload', function() {
        if($scope.form.$dirty || $scope.editareaBinds.dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function MapproxyGlobalsChooserCtrl($scope, DataShareService, TranslationService) {
    $scope.translate = function(text) {
        return TranslationService.translate(text);
    };
    $scope.getClasses = function(global) {
        var classes = "";
        if(global == $scope.selected) {
            classes += 'selected';
        }
        if(angular.isDefined($scope.globals.data[global].active) && $scope.globals.data[global].active) {
            classes += ' active';
        }
        return classes;
    };
    $scope.show = function(global) {
        $scope.selected = global;
        DataShareService.data('global', global + '.html');
    };
    $scope.$on('dss.globals', function() {
        $scope.globals = DataShareService.data('globals');
    });
    $scope.$on('dss._editarea_visible', function() {
        $scope._editarea_visible = DataShareService.data('_editarea_visible');
    });

    $scope.selected = 'cache';
    $scope._editarea_visible = false;
};

function MapproxyGlobalsFormCtrl($scope, PAGE_LEAVE_MSG, TranslationService, MessageService, MapproxyGlobals, DataShareService) {
    var setGlobals = function() {
        var globals = MapproxyGlobals.list();
        if(globals.length > 0) {
            $scope.globals = angular.copy(globals[0]);
        } else {
            $scope.globals = angular.copy({'data': MapproxyGlobals.model});
        }
        DataShareService.data('globals', $scope.globals);
        $scope.editareaBinds.editareaValue = $scope.globals;
        if($scope.globals._manual) {
            $scope.editareaBinds.visible = true;
        }
    };
    var setTemplate = function() {
        $scope.template = DataShareService.data('global');
    };
    $scope.save = function(event) {
        helper.safePreventDefaults(event);
        $scope.globals._manual = $scope.editareaBinds.visible;
        MapproxyGlobals.add($scope.globals);
        $scope.form.$setPristine();
        $scope.editareaBinds.dirty = false;
    };
    $scope.reset = function(event) {
        helper.safePreventDefaults(event);
        $scope.form.$setPristine();
        setGlobals();
    };
    $scope.saveFromEditarea = function() {
        $scope.globals = $scope.editareaBinds.editareaValue;
        $scope.save();
    };

    $scope.globals = angular.copy({'data': MapproxyGlobals.model});

    DataShareService.data('globals', $scope.globals);

    $scope.editareaBinds = {
        editareaValue: $scope.globals,
        visible: false,
        dirty: false,
        save: $scope.saveFromEditarea
    };

    $scope.template = "cache.html";

    $scope._messageService = MessageService;

    $scope.$watch('_messageService.messages.globals.load_success', setGlobals);
    $scope.$watch('_messageService.messages.globals.add_success', setGlobals);
    $scope.$watch('_messageService.messages.globals.update_success', setGlobals);
    $scope.$on('dss.global', setTemplate);

    $scope.$watch('editareaBinds.visible', function(isVisible, wasVisible) {
        DataShareService.data('_editarea_visible', isVisible)
    });

    $scope.$watch('globals', function() {
        $scope.editareaBinds.editareaValue = $scope.globals;
    }, true);

    $(window).on('beforeunload', function() {
        if($scope.form.$dirty || $scope.editareaBinds.dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function MapproxyServicesChooserCtrl($scope, TranslationService, DataShareService) {
    $scope.translate = function(text) {
        return TranslationService.translate(text);
    };
    $scope.setSelected = function(service) {
        if(service == $scope.selected) {
            return 'selected';
        }
    };

    $scope.show = function(service) {
        $scope.selected = service
        DataShareService.data('service', service + '.html')
    };
    $scope.$on('dss.services', function() {
        $scope.services = DataShareService.data('services');
    });
    $scope.$on('dss._editarea_visible', function() {
        $scope._editarea_visible = DataShareService.data('_editarea_visible');
    });

    $scope.selected = 'wms';
    $scope._editarea_visible = false;
};

function MapproxyServicesCtrl($scope, PAGE_LEAVE_MSG, TranslationService, MapproxyServices, DataShareService, MessageService, ProjectDefaults) {
    var setServices = function() {
        var services = MapproxyServices.list();
        if(services.length > 0) {
            $scope.services = angular.copy(services[0]);
        }
        DataShareService.data('services', $scope.services);
        $scope.editareaBinds.editareaValue = $scope.services;
        if($scope.services._manual) {
            $scope.editareaBinds.visible = true;
        }
    };

    var setTemplate = function() {
        $scope.template = DataShareService.data('service');
    };

    $scope.save = function(event) {
        helper.safePreventDefaults(event);
        $scope.services._manual = $scope.editareaBinds.visible;
        MapproxyServices.add($scope.services);
        $scope.form.$setPristine();
        $scope.editareaBinds.dirty = false;
    };
    $scope.reset = function(event) {
        helper.safePreventDefaults(event);
        $scope.form.$setPristine();
        setServices();
    };
    $scope.saveFromEditarea = function() {
        $scope.services = $scope.editareaBinds.editareaValue;
        $scope.save();
    };

    $scope.services = angular.copy({'data': MapproxyServices.model});

    DataShareService.data('services', $scope.services);

    $scope.editareaBinds = {
        editareaValue: $scope.services,
        visible: false,
        dirty: false,
        save: $scope.saveFromEditarea
    }

    $scope.template = 'wms.html'

    $scope._messageService = MessageService

    $scope.$watch('_messageService.messages.services.load_success', setServices);
    $scope.$watch('_messageService.messages.services.add_success', function() {
        $scope.form.$setPristine();
        setServices();
    });
    $scope.$watch('_messageService.messages.services.update_success', function() {
        $scope.form.$setPristine();
        setServices();
    });
    $scope.$watch('_messageService.messages.defaults.load_success', function() {
        var defaults = ProjectDefaults.list();
        if(defaults.length > 0) {
            $scope.defaults = defaults[0];
        }
    });
    $scope.$watch('editareaBinds.visible', function(isVisible, wasVisible) {
        DataShareService.data('_editarea_visible', isVisible)
    });
    $scope.$on('dss.service', setTemplate);

    $(window).on('beforeunload', function() {
        if($scope.form.$dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function ProjectDefaultsCtrl($scope, PAGE_LEAVE_MSG, ProjectDefaults, MessageService) {
    var setDefaults = function() {
        var defaults = ProjectDefaults.list();
        if(defaults.length > 0) {
            $scope.defaults = $.extend($scope.defaults, defaults[0]);
        }
    };
    $scope.save = function(event) {
        helper.safePreventDefaults(event);
        $scope.defaults = helper.clearData($scope.defaults);
        ProjectDefaults.add($scope.defaults);
        $scope.form.$setPristine();
    };
    $scope.addSRS = function(event) {
        helper.safePreventDefaults(event);
        if($.inArray($scope.custom.newSRS, $scope.defaults.data.srs) === -1) {
            $scope.defaults.data.srs.push($scope.custom.newSRS);
            $scope.custom.newSRS = undefined;
            $scope.form.$setDirty();
        }
    };
    $scope.removeSRS = function(event, srs) {
        var srsID = $.inArray(srs, $scope.defaults.data.srs);
        if(srsID !== -1) {
            $scope.defaults.data.srs.splice(srsID, 1);
            $scope.form.$setDirty();
        }
    }

    $scope._messageService = MessageService;

    $scope.defaults = {'data': {'srs': []}};
    $scope.custom = {};
    $scope.custom.newSRS;

    $scope.$watch('_messageService.messages.defaults.load_success', setDefaults);
    $scope.$watch('_messageService.messages.defaults.add_success', setDefaults);
    $scope.$watch('_messageService.messages.defaults.update_success', setDefaults);

    $(window).on('beforeunload', function() {
        if($scope.form.$dirty) {
            return PAGE_LEAVE_MSG;
        }
    });
};

function DisplayCalculatedTilesCtrl($scope, DataShareService) {
    $scope.refresh = function() {
        DataShareService.data('refreshCalculatedTiles', true);
    };
    $scope.calculatedTiles = [];
    $scope.resSelected = false;
    $scope.$on('dss.calculatedTiles', function() {
        $scope.calculatedTiles = DataShareService.data('calculatedTiles');
    });
    $scope.$on('dss.clearCalculatedTiles', function() {
        $scope.calculatedTiles = undefined;
    });
};

function ProjectCtrl($scope, $http, $window, MessageService) {
    $scope.project = {};

    $scope.createProject = function() {
        $http.post($scope.createURL, {'name': $scope.project.name})
            .success(function(response) {
                helper.safeApply($scope, function() {
                    $window.location.href = response.url;
                });
            })
            .error(function(error) {
                MessageService.message('project', 'create_error', error.error);
            });
    };
    $scope.deleteProject = function(event, name) {
        helper.safePreventDefaults(event);
        $http.post($scope.deleteURL, {'name': name})
            .success(function(response) {
                helper.safeApply($scope, function() {
                   $window.location.href = $window.location.href;
               });
            })
            .error(function(error) {
                MessageService.message('project', 'delete_error', error.error);
            });
    };
}
