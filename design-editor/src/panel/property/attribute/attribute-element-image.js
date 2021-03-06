'use babel';

import mustache from 'mustache';
import $ from 'jquery';
import path from 'path';

import {appManager as AppManager} from '../../../app-manager';
import {DressElement} from '../../../utils/dress-element';

const TEMPLATE_FILE = 'panel/property/attribute/templates/attribute-image.html';

let filterDefaults = {
    'brightness': 100,
    'contrast': 100,
    'saturate': 100,
    'sepia': 0,
    'grayscale': 0,
    'hue-rotate': 0,
    'opacity': 1
};

let filterPresets = {
    aden: {
        'hue-rotate': -20,
        'contrast': 90,
        'saturate': 85,
        'brightness': 120
    },
    brooklyn: {
        'contrast': 90,
        'brightness': 110
    },
    earlybird: {
        'contrast': 90,
        'sepia': 20
    },
    gingham: {
        'brightness': 105,
        'hue-rotate': -10
    },
    hudson: {
        'brightness': 120,
        'contrast': 90,
        'saturate': 110
    },
    inkwell: {
        'sepia': 30,
        'contrast': 110,
        'brightness': 110,
        'grayscale': 100
    },
    lofi: {
        'saturate': 110,
        'contrast': 150
    },
    mayfair: {
        'contrast': 110,
        'saturate': 110
    }
};

let imageFilter = {};

class AttributeImage extends DressElement {

    /**
     * Create callback
      */
    onCreated() {
        var self = this;

        $.get(path.join(AppManager.getAppPath().src, TEMPLATE_FILE), (template) => {
            self.$el.append(mustache.render(template, self._data));
            self.$el.find('[type=range]').on('change', this._onSliderValueChange.bind(this));
            self.$el.find('.closet-image-filter-btn').on('click', this._onPresetButtonClick.bind(this));
            self.$el.find('#srcImageFile').on('change', this._onSrcImageChange.bind(this));
            self.$el.find('#srcImageClear').on('click', this._onSrcImageClear.bind(this));
        });
    }

    setData(element) {
        this._targetImage = element;
        this._selectedElementId = element.attr('data-id');
        this._updatePanel();
    }

    _readImageFilter() {
        let filter = this._targetImage[0].style.filter;

        imageFilter = Object.assign({}, filterDefaults, { opacity: this._targetImage[0].style.opacity || 1 });

        if (filter) {
            filter.split(' ').forEach(component => {
                imageFilter[component.match(/[a-z-]+/)[0]] = parseInt(component.match(/\d+/)[0], 10);
            });
        }
    }

    _setImageFilter() {
        let filterString = '';

        Object.keys(imageFilter).forEach(filter => {
            if (filter === 'opacity') {
                return;
            }

            if (parseInt(imageFilter[filter], 10) !== filterDefaults[filter]) {
                filterString += filter +
                    '(' + imageFilter[filter] + this.$el.find('[name=' + filter + ']').attr('dataunit') + ') ';
            }
        });

        this._targetImage[0].style.webkitFilter = filterString;
        this._targetImage[0].style.opacity = imageFilter.opacity === filterDefaults.opacity ? '' : imageFilter.opacity;

        AppManager.getActiveDesignEditor()
            .getModel().updateStyle(this._targetImage[0].getAttribute('data-id'), 'webkitFilter', filterString);
    }

    _onPresetButtonClick(event) {
        let button = event.target;
        let preset = button.name;

        imageFilter = Object.assign({}, filterDefaults, filterPresets[preset]);

        this._setImageFilter();
        this._updatePanel();
    }

    _updatePanel() {
        var self = this;

        self._readImageFilter();
        self._setImageSourcePath();

        Object.keys(imageFilter).forEach(filter => {
            let $slider = self.$el.find('[name="' + filter + '"]'),
                newValue = imageFilter[filter];

            setTimeout(() => {
                $slider.val(newValue);
            }, 0);
        });
    }

    _onSliderValueChange(e) {
        imageFilter[e.target.name] = parseInt(e.target.value, 10);
        this._setImageFilter();
    }

    _updateImageSourcePath(sourcePath) {
        if(!sourcePath) {
            this.$el.find('#srcImageChoose').show();
            this.$el.find('#srcImageShow').hide();
            this.$el.find('#srcImageFile').val('');
        } else {
            this.$el.find('#srcImageChoose').hide();
            this.$el.find('#srcImageShow').show();
            this.$el.find('#srcImageValue').val(sourcePath)
        }
    }

    _setImageSourcePath() {
        let sourcePath = this._targetImage.attr('src')
        this._updateImageSourcePath(sourcePath)
    }

    _onSrcImageChange(event) {
        var self = this;
        [].slice.call(event.target.files).forEach(file => {
            const reader = new FileReader();
            reader.addEventListener('loadend', event => {
                if (event.target.readyState === FileReader.DONE) {
                    const dir = window.top.globalData.fileUrl.replace(/[^\/]+$/gi, '');
                    const writepath = (dir + '/images/' + file.name).replace(/\/+/gi, '/');
                    const readpath = ('images/' + file.name).replace(/\/+/gi, '/');

                    window.top.writeFile(
                        writepath,
                        event.target.result, {
                            encoding: 'binary'
                        },
                        () => {
                            AppManager.getActiveDesignEditor()
                                .getModel().updateAttribute(self._selectedElementId, 'src', readpath);
                            self._updateImageSourcePath(readpath);
                        }
                    );
                }
            });
            reader.readAsBinaryString(file);
        });
    }

    _onSrcImageClear(event) {
        AppManager.getActiveDesignEditor().getModel()
            .updateAttribute(this._selectedElementId, 'src', "");
        this._updateImageSourcePath();
    }
}

const AttributeImageElement = document.registerElement('closet-image-element', AttributeImage);

export {AttributeImageElement, AttributeImage};
