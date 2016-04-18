!function ($) {

    "use strict";

    /* editableCombobox PUBLIC CLASS DEFINITION
     * ================================ */

    var editableCombobox = function (element, options) {
        this.options = $.extend({}, $.fn.editableCombobox.defaults, options);
        this.$element = $(element);
        this.placeholder = this.$element.data("placeholder");
        this.$select = this.$element.find('select');
        this.$container = this.setup();
        this.$input = this.$container.find('input[type=text]');
        this.$hidden = this.$container.find('input[type=hidden]');
        this.$button = this.$container.find('.dropdown-toggle');
        this.transferAttributes();
        this.listen();
        this.currentIndex = -1;
    };

    editableCombobox.prototype = {
        constructor: editableCombobox,
        selectedItem: null,
        setup: function () {
            var editableCombobox = $('<div class="editableCombobox input-group clearfix"></div>');
            editableCombobox.append(this.options.input);
            editableCombobox.append(this.options.button);
            editableCombobox.append(this.options.menu);
            var menu = editableCombobox.find("ul");
            var index = 0;
            this.$select.find("option").each(function () {
                if ($(this).val() != '') {
                    menu.append("<li data-value='" + $(this).val() + "' data-index='" + (index++) + "'><a href=\"javascript:void(0)\">" + $(this).text() + "</a></li>");
                }
            });
            editableCombobox.append(this.options.hidden);
            this.$element.prepend(editableCombobox);
            this.$select.hide();
            this.$menu = menu.find('li');
            return editableCombobox;
        },

        disable: function () {
            this.$element.prop('disabled', true);
            this.$button.attr('disabled', true);
            this.disabled = true;
        },

        enable: function () {
            this.$element.prop('disabled', false);
            this.$button.attr('disabled', false);
            this.disabled = false;
        },

        transferAttributes: function () {
            this.$input.attr('placeholder', this.placeholder);
            this.$hidden.val(this.$select.val());
        },

        select: function (e) {
            e.stopPropagation();
            e.preventDefault();
            $("body").click();
            this.selectedItem = {
                'index': $(e.target).parent().data("index"),
                'text': $(e.target).text(),
                'value': $(e.target).parent().data("value")
            };
            this.$input.val(this.selectedItem.text);
            this.$hidden.val(this.selectedItem.value);
            this.currentIndex = this.selectedItem.index;
            if (typeof this.options.selectChange == 'function') {
                this.options.selectChange.call(this.selectedItem);
            }
        },

        listen: function () {
            this.$input
                .on('blur', $.proxy(this.blur, this))
                .on('keydown', $.proxy(this.keydown, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup', $.proxy(this.keyup, this));
            this.$menu
                .on('click', $.proxy(this.select, this));
        },

        keyup: function (e) {
            console.log("keyup, e.keyCode:" + e.keyCode);
            switch (e.keyCode) {
                case 8: // backspace
                    this._triggerChange(e);
                    break;
            }
        },

        keypress: function (e) {
            console.log("keypress:" + String.fromCharCode(e.which));
            if (/[\d|-|/|\s]/.test(String.fromCharCode(e.which))) {
                e.preventDefault();
                var pos = this.$input.getCursorPosition();
                var str = this.$input.val().insertAt(pos, String.fromCharCode(e.which));
                this.$input.val(str);
                this._triggerChange(e);
                $(this.$input.get(0)).selectRange(pos + 1);
            }
        },

        move: function (e) {
            switch (e.keyCode) {
                case 13: // enter
                    e.preventDefault();
                    this._triggerChange(e);
                    break;
                case 27: // escape
                    e.preventDefault();
                    break;

                case 38: // up arrow
                    e.preventDefault();
                    this.prev();
                    break;

                case 9: // tab
                    e.preventDefault();
                    this.blur(e);
                    break;

                case 40: // down arrow
                    e.preventDefault();
                    this.next();
                    break;
            }

            e.stopPropagation();
        },

        prev: function () {
            var index = parseInt(this.currentIndex);
            this.currentIndex = index - 1;
            if (this.currentIndex <= 0) {
                this.currentIndex = 0;
            }
            this.$menu.parent().find("a:eq(" + this.currentIndex + ")").click();
        },

        next: function () {
            var index = parseInt(this.currentIndex);
            this.currentIndex = index + 1;
            if (this.currentIndex >= this.$menu.length - 1) {
                this.currentIndex = this.$menu.length - 1;
            }
            this.$menu.parent().find("a:eq(" + this.currentIndex + ")").click();
        },

        keydown: function (e) {
            this.move(e);
        },

        lookup: function (text) {
            this.$menu.removeClass("active");
            for (var i = 0; i < this.$menu.length; i++) {
                var $item = $(this.$menu[i]);
                var a = $item.find("a").text().replace(/\s/ig, '');
                var b = text.replace(/\s/ig, '');
                if (a === b) {
                    $item.find("a").parent().addClass("active");
                    this.currentIndex = $item.data("index");
                    this.$hidden.val($item.data("value"));
                    this.$select.find("option[value='" + $item.data("value") + "']").attr("selected", "selected");
                    return {
                        'index': $item.data("index"),
                        'text': text,
                        'value': $item.data("value")
                    };
                }
            }

            this.currentIndex = -1;
            this.$hidden.val('');
            this.$select.find("option:eq(0)").attr("selected", "selected");
            return {
                'index': -1,
                'text': text,
                'value': ''
            };
        },

        _triggerChange: function (e) {
            if (typeof this.options.textChange == 'function') {
                console.log('_triggerChange:' + this.$input.val());
                this.selectedItem = this.lookup(this.$input.val());
                this.options.textChange.call(this.selectedItem);
            }
        },

        blur: function (e) {
            if (typeof this.options.lostFocus == 'function') {
                this.options.lostFocus.call(this.selectedItem);
            }
        }
    };

    /* editableCombobox PLUGIN DEFINITION
     * =========================== */
    $.fn.editableCombobox = function (option) {
        return this.each(function () {
            var $this = $(this)
              , data = $this.data('editableCombobox')
              , options = typeof option == 'object' && option;
            if (!data) { $this.data('editableCombobox', (data = new editableCombobox(this, options))); }
            if (typeof option == 'string') { data[option](); }
        });
    };

    $.fn.editableCombobox.defaults = {
        input: '<input type="text" autocomplete="off" placeholder="">',
        button: '<button class="dropdown-toggle" data-toggle="dropdown" tabindex="-1"><span class="caret"></span></button>',
        menu: '<ul class="dropdown-menu" role="menu"></ul>',
        item: '<li><a href="#"></a></li>',
        hidden: '<input type="hidden"/>',
        selectChange: null,
        textChange: null,
        lostFocus: null
    };

    $.fn.editableCombobox.Constructor = editableCombobox;

}(window.jQuery);
