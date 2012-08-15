// Filename: views/items/show.js
define([
  'underscore',
  'backbone',
  'views/editor/editor'
],
function(_, Backbone, EditorView) {

  // key codes for keyup event
  var keyCodes = {
    27: 'esc',
    13: 'enter'
  };

  var itemView = Backbone.View.extend({

    initialize: function(options) {
      // Extend this object with all the custom options passed
      _.extend(this, options.custom);

      // Listen to changes in title and description
      this.model.bind('change:title', this.onTitleChange, this);
      this.model.bind('change:desc', this.onDescriptionChange, this);

      this.model.set('listIndex', options.listIndex);

      this.editor = null;
      this.editorInitialized = false;

      var $el = $(options.el)
        , $title = $el.find('.title')
        , $description = $el.find('.desc');

      this.$title = $title;
      this.$titleSpan = $title.children('.view');
      this.$titleInput = $title.children('input.edit');

      this.$description = $description;
      this.$descriptionSpan = $description.children('.view');
      this.$descriptionInput = $description.children('.edit');

      this.globalDispatcher.on('sortUpdated', this.onSortUpdated, this);

    },

    events: {
      "click .title > .view": "onTitleClick",
      "click .edit": "onEditClick",
      "click .desc > .view": "onDescriptionClick",
      "click": "onItemClick",
      "blur .edit": "onEditBlur",
      "keyup .edit": "onEditKeyup"
    },

    onTitleClick: function(e) {
      e.stopPropagation();
      if (!this.model.has('title')) {
        // Sync the model if it doesn't seem to have a title
        this.model.fetch();
      }
      this.$title.addClass('editing');
      this.$titleInput.select();
    },

    onDescriptionClick: function(e) {
      e.stopPropagation();
      if (!this.model.has('description')) {
        // Sync the model if it doesn't seem to have a description
        this.model.fetch();
      }
      this.$description.addClass('editing');
      this.$descriptionInput.select();
    },

    onEditClick: function(e) {
      // This prevents clicks going through the edit input area
      e.stopPropagation();
      return false;
    },

    onItemClick: function(e) {

      // Prevent editor toggle if title or description edit is active
      if (this.$title.hasClass('editing')) {
        this.closeEdit(true, this.$titleInput);
        e.stopPropagation();
        return false;
      }
      if (this.$description.hasClass('editing')) {
        this.closeEdit(true, this.$descriptionInput);
        e.stopPropagation();
        return false;
      }

      // Check if we need a new editor view created
      if (this.editorInitialized === false) {
        this.editorInitialized = true;
        this.editor = new EditorView({
          model: this.model,
          custom: {
            globalDispatcher: this.globalDispatcher,
            dispatcher: this.dispatcher,
            parent: this
          }
        });
      } else {
        this.editor.toggle();
      }

      return false;
    },

    scrollTop: function() {
      if(!this.offset) {
        this.offset = this.$el.offset().top -
          this.$el.cssInt('margin-top') -
          $('body').cssInt('padding-top');
      }
      $('html:not(:animated),body:not(:animated)').animate({
        scrollTop: this.offset
      }, 200);
    },

    onEditBlur: function(e) {
      e.stopPropagation();
      var target = e.currentTarget
        , $target = $(target);
      this.closeEdit(true, e.currentTarget);
      return false;
    },

    onEditKeyup: function(e) {

      var target = e.currentTarget
        , $target = $(target)
        , saveResult = false;

      switch(keyCodes[e.which]) {
      case undefined:
        // The key wasn't found in keyCodes. Abort...
        return;
      case 'enter':
        saveResult = true;
        break;
      case 'esc':
        // Just break since saveResult is already false
        break;
      }
      this.closeEdit(saveResult, target);

    },

    onTitleChange: function(model, newTitle, options) {
      this.$titleSpan.text(newTitle);
      this.$titleInput.val(newTitle);
    },

    onDescriptionChange: function(model, newDescription, options) {
      this.$descriptionSpan.text(newDescription);
      this.$descriptionInput.val(newDescription);
    },

    onSortUpdated: function(order) {

      var _id = this.model.get('_id');
      var currentIndex = this.model.get('listIndex');
      var newIndex = order.indexOf(_id);
      if (newIndex !== currentIndex) {
        var callback = _.bind(this.saveIndex, {'index': newIndex});
        if (!this.model.has('title')) {
          this.model.fetch({
            success: callback
          });
        } else {
          callback(this.model);
        }
      }

    },

    saveIndex: function(model, response) {
      model.save({'listIndex': this.index});
    },

    closeEdit: function(save, target) {
      // target variable will always be an input element
      var $target = $(target)
        , attr = $target.data('attr');
      if (save) {
        //this.model.set(attr, $target.val());
        var val = $target.val();
        if (val !== '') {
          attributes = {};
          attributes[attr] = val;
          this.model.save(attributes);
        }
      } else {
        // Reset the input value if it wasn't saved
        $target.val(this.model.get(attr));
      }
      // Remove the editing class from the parent element to hide the input
      $target.parent().removeClass('editing');
    },

    clearSelection: function() {
      if (document.selection && document.selection.empty) {
          document.selection.empty();
      } else if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
      }
    }

  });
  return itemView;
});