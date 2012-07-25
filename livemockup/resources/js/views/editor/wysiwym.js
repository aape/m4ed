define([
  'jquery',
  'underscore',
  'backbone',
  'views/editor/templates'
],
function($, _, Backbone, templates) {
/*---------------------------------------------------------------------------*
 * m4ed Wysiwym editor - optimized for Markdown
 * 
 * 
 * Forked from: 
 * http://pushingkarma.com/projects/jquery-wysiwym/
 * Not so Simple Wysiwym Editor Backbone view thingy
 * Version: 2.0 (2011-01-26)
 * Version: 2.1 (2011-07-23)
 * Version: 3.0 (2011-07-25)
 *---------------------------------------------------------------------------*/

  var wysiwym = Backbone.View.extend({

    initialize: function(options) {
      _.extend(this, options.custom);
      this.dispatcher.on('editorButtonClick', this.onEditorButtonClick, this);

      // True to insert blank line when exiting auto-indent ;)
      this.linebreakAfterBlank = true;

      this.indentRegex = /^\*\s|(\d+)\.\s|\>\s|\s{3}\s+/;

      this.blankline = '';
    },

    render: function() {
      var $el = this.$el;
      this.textarea = new WysiwymTextarea(this.el);
    },

    events: {
      'keydown': 'onKeydown'
    },

    onKeydown: function(e) {
      console.log('Key is down! ' + e.which);
      // Only continue if keyCode === 13
      if (e.which !== 13)
          return true;
      // ReturnKey pressed, lets indent!
      var textarea = this.textarea
        , linenum = textarea.refreshedSelection().start.line
        , line = this.textarea.lines[linenum]
        , postcursor = line.slice(textarea.selection.start.position, line.length);
      // Make sure nothing is selected & there is no text after the cursor
      if ((textarea.selection.length() !== 0) || (postcursor))
          return true;
      // So far so good; check for a matching indent regex
      //var autoindents = this.autoindents;
      //for (var i in autoindents) {
      //  var regex = autoindents[i];
        var matches = line.match(this.indentRegex);
        console.log(line);
        console.log(this.textarea.lines);
        console.log(linenum);
        console.log(matches);
        if (matches) {
          var prefix = matches[0];
          var suffix = line.slice(prefix.length, line.length);
          // NOTE: If a selection is made in the regex, it's assumed that the
          // matching text is a number should be auto-incremented (ie: #. lists).
          if (matches.length === 2) {
            var num = parseInt(matches[1], 10);
            prefix = prefix.replace(matches[1], num + 1);
          }
          if (suffix) {
            // Regular auto-indent; Repeat the prefix
            textarea.selection.addPrefix('\n'+ prefix);
            textarea.update();
            return false;
          } else {
            // Return on blank indented line (clear prefix)
            textarea.lines[linenum] = this.blankline;
            textarea.selection.start.position = 0;
            textarea.selection.end.position = textarea.selection.start.position;
            if (this.linebreakAfterBlank) {
              textarea.selection.addPrefix('\n');
            }
            textarea.update();
            return false;
          }
        //}
      }
      return true;
    },

    onEditorButtonClick: function(callback) {
      //console.log(callback);
      //console.log(e);
      this[callback.action](callback.data);
    },

    // Wrap the selected text with a prefix and suffix string.
    span: function(data) {
      var prefix = data.prefix    // (required) Text wrap prefix
        , suffix = data.suffix    // (required) Text wrap suffix
        , text = data.text        // (required) Default wrap text (if nothing selected)
        , textarea = this.textarea
        , selection = textarea.refreshedSelection();
      if (selection.isWrapped(prefix, suffix)) {
        selection.unwrap(prefix, suffix);
      } else if (selection.length() === 0) {
        selection.append(text);
        selection.wrap(prefix, suffix);
      } else {
        selection.wrap(prefix, suffix);
      }
      textarea.update();
    },

    // Prefix each line in the selection with the specified text.
    list: function(data) {
      var prefix = data.prefix    // (required) Line prefix text
        , wrap = data.wrap        // (optional) If true, wrap list with blank lines
        , regex = data.regex      // (optional) Set to regex matching prefix to increment num
        , textarea = this.textarea
        , selection = textarea.refreshedSelection();

      if (selection.linesHavePrefix(regex ? regex : prefix)) {
        selection.removeLinePrefixes(regex ? regex : prefix);
        if (wrap) {
          selection.unwrapBlankLines();
        }
      } else {
        selection.setLinePrefixes(prefix, regex);
        if (wrap) {
          selection.wrapBlankLines();
        }
      }
      textarea.update();
    },

    // Prefix each line in the selection according based off the first selected line.
    block: function(data) {
      var markup = data.markup    // (required) Markup Language
        , prefix = data.prefix    // (required) Line prefix text
        , wrap = data.wrap        // (optional) If true, wrap list with blank lines
        , textarea = this.textarea
        , selection = textarea.refreshedSelection()
        , firstline = selection.getLines()[0];

      if (firstline.startswith(prefix)) {
        selection.removeLinePrefixes(prefix);
        if (wrap) {
          selection.unwrapBlankLines();
        }
      } else {
        selection.addLinePrefixes(prefix);
        if (wrap) {
          selection.wrapBlankLines();
        }
      }
      textarea.update();
    }
  });


  /*----------------------------------------------------------------------------------------------
   * Wysiwym Selection
   * Manipulate the textarea selection
   *--------------------------------------------------------------------------------------------- */
  String.prototype.strip = function() { return this.replace(/^\s+|\s+$/g, ''); };
  String.prototype.lstrip = function() { return this.replace(/^\s+/, ''); };
  String.prototype.rstrip = function() { return this.replace(/\s+$/, ''); };
  String.prototype.startswith = function(str) { return this.slice(0, str.length) === str; };
  String.prototype.endswith = function(str) { return this.slice(str.length, this.length) === str; };


  function Selection() {
    this.init();
  }

  Selection.prototype = {

    init: function() {
      //this.textarea = textarea;
      this.lines = [];                 // Reference to textarea.lines
      this.start = { line:0, position:0 };        // Current cursor start positon
      this.end = { line:0, position:0 };          // Current cursor end position
    },

    refresh: function(text, selectionInfo) {
      this.lines = [];
      var selectionStart = selectionInfo[0]
        , selectionEnd = selectionInfo[1]
        , lines = this.lines;

      var endline = 0;
      while (endline >= 0) {
        endline = text.indexOf('\n');
        var line = text.slice(0, endline >= 0 ? endline : text.length);
        if ((selectionStart <= line.length) && (selectionEnd >= 0)) {
          if (selectionStart >= 0) {
            this.start.line = lines.length;
            this.start.position = selectionStart;
          }
          if (selectionEnd <= line.length) {
            this.end.line = lines.length;
            this.end.position = selectionEnd;
          }
        }
        lines[lines.length] = line;
        text = endline >= 0 ? text.slice(endline + 1, text.length) : '';
        selectionStart -= endline + 1;
        selectionEnd -= endline + 1;
      }
      // Tweak the selection end position if its on the edge
      if ((this.end.position === 0) && (this.end.line !== this.start.line)) {
        this.end.line -= 1;
        this.end.position = lines[this.end.line].length;
      }

      //console.log(lines);
      this.lines = lines;
      return lines;
    },

    // Return a string representation of this object.
    toString: function() {
      var str = 'SELECTION: '+ this.length() +' chars\n';
      str += 'START LINE: '+ this.start.line +'; POSITION: '+ this.start.position +'\n';
      str += 'END LINE: '+ this.end.line +'; POSITION: '+ this.end.position +'\n';
      return str;
    },

    // Add a line prefix, reguardless if it's already set or not.
    addLinePrefixes: function(prefix) {
      for (var i=this.start.line; i <= this.end.line; i++) {
          this.lines[i] = prefix + this.lines[i];
      }
      this.start.position += prefix.length;
      this.end.position += prefix.length;
    },

    // Add the specified prefix to the selection
    addPrefix: function(prefix) {
      var numlines = this.lines.length;
      console.log(this.lines)
      console.log(this.start.line);
      var line = this.lines[this.start.line];
      var newline = [
          line.slice(0, this.start.position),
          prefix,
          line.slice(this.start.position, line.length)
        ].join('');
      this.lines[this.start.line] = newline;
      this.start.position += prefix.length;

      if (this.start.line === this.end.line) {
        this.end.position += prefix.length;
      }
      // Check we need to update the scroll height;  This is very slightly
      // off because height !== scrollHeight. A fix would be nice.
      // TODO: FIX THIS TO WORK WITHOUT HAVING TO CALL TEXTAREA
      // if (prefix.indexOf('\n') !== -1) {
      //   var scrollHeight = this.textarea.el.scrollHeight;
      //   var lineheight = parseInt(scrollHeight / numlines, 10);
      //   this.textarea.scroll += lineheight;
      // }
  },

    // Add the specified suffix to the selection
    addSuffix: function(suffix) {
      var line = this.lines[this.end.line];
      var newline = [
          line.slice(0, this.end.position),
          suffix,
          line.slice(this.end.position, line.length)
        ].join('');
      this.lines[this.end.line] = newline;
    },

    // Append the specified text to the selection
    append: function(text) {
      //console.log(this.lines);
      var line = this.lines[this.end.line];
      var newline = [
          line.slice(0, this.end.position),
          text,
          line.slice(this.end.position, line.length)
        ].join('');
      this.lines[this.end.line] = newline;
      this.end.position += text.length;
    },

    // Return an array of lines in the selection
    getLines: function() {
      var selectedlines = [];
      for (var i = this.start.line, j = this.end.line; i <= j; i++)
        selectedlines[selectedlines.length] = this.lines[i];
      return selectedlines;
    },

    // Return true if selected text contains has the specified prefix
    hasPrefix: function(prefix) {
      //console.log(this.lines);
      var line = this.lines[this.start.line];
      var start = this.start.position - prefix.length;
      if ((start < 0) || (line.slice(start, this.start.position) !== prefix))
        return false;
      return true;
    },

    // Return true if selected text contains has the specified suffix
    hasSuffix: function(suffix) {
      var line = this.lines[this.end.line];
      var end = this.end.position + suffix.length;
      if ((end > line.length) || (line.slice(this.end.position, end) !== suffix))
        return false;
      return true;
    },

    // Insert the line before the selection to the specified text. If force is
    // set to false and the line is already set, it will be left alone.
    insertPreviousLine: function(newline, force) {
      force = force !== undefined ? force : true;
      var prevnum = this.start.line - 1;
      if ((force) || ((prevnum >= 0) && (this.lines[prevnum] !== newline))) {
        this.lines.splice(this.start.line, 0, newline);
        this.start.line += 1;
        this.end.line += 1;
      }
    },

    // Insert the line after the selection to the specified text. If force is
    // set to false and the line is already set, it will be left alone.
    insertNextLine: function(newline, force) {
      force = force !== undefined ? force : true;
      var nextnum = this.end.line + 1;
      if ((force) || ((nextnum < this.lines.length) && (this.lines[nextnum] !== newline)))
          this.lines.splice(nextnum, 0, newline);
    },

    // Return true if selected text is wrapped with prefix & suffix
    isWrapped: function(prefix, suffix) {
      return ((this.hasPrefix(prefix)) && (this.hasSuffix(suffix)));
    },

    // Return the selection length
    length: function() {
      return this.val().length;
    },

    // Return true if all lines have the specified prefix. Optionally
    // specify prefix as a regular expression.
    linesHavePrefix: function(prefix) {
      for (var i=this.start.line; i <= this.end.line; i++) {
        var line = this.lines[i];
        if ((typeof(prefix) === 'string') && (!line.startswith(prefix))) {
          return false;
        } else if ((typeof(prefix) !== 'string') && (!line.match(prefix))) {
          return false;
        }
      }
      return true;
    },

    // Prepend the specified text to the selection
    prepend: function(text) {
      var line = this.lines[this.start.line];
      var newline = [
          line.slice(0, this.start.position),
          text,
          line.slice(this.start.position, line.length)
        ].join('');
      this.lines[this.start.line] = newline;
      // Update Class Variables
      if (this.start.line === this.end.line)
        this.end.position += text.length;
    },

    // Remove the prefix from each line in the selection. If the line
    // does not contain the specified prefix, it will be left alone.
    // Optionally specify prefix as a regular expression.
    removeLinePrefixes: function(prefix) {
      for (var i=this.start.line; i <= this.end.line; i++) {
        var line = this.lines[i];
        var match = prefix;
        // Check prefix is a regex
        if (typeof(prefix) !== 'string')
          match = line.match(prefix)[0];
        // Do the replace
        if (line.startswith(match)) {
          this.lines[i] = line.slice(match.length, line.length);
          if (i === this.start.line)
            this.start.position -= match.length;
          if (i === this.end.line)
            this.end.position -= match.length;
        }
      }
    },

    // Remove the previous line. If regex is specified, it will
    // only be removed if there is a match.
    removeNextLine: function(regex) {
      var nextnum = this.end.line + 1;
      var removeit = false;
      if ((nextnum < this.lines.length) && (regex) && (this.lines[nextnum].match(regex)))
        removeit = true;
      if ((nextnum < this.lines.length) && (!regex))
        removeit = true;
      if (removeit)
        this.lines.splice(nextnum, 1);
    },

    // Remove the specified prefix from the selection
    removePrefix: function(prefix) {
      if (this.hasPrefix(prefix)) {
        var line = this.lines[this.start.line];
        var start = this.start.position - prefix.length;
        var newline = [
            line.slice(0, start),
            line.slice(this.start.position, line.length)
          ].join('');
        this.lines[this.start.line] = newline;
        this.start.position -= prefix.length;
        if (this.start.line === this.end.line)
          this.end.position -= prefix.length;
      }
    },

    // Remove the previous line. If regex is specified, it will
    // only be removed if there is a match.
    removePreviousLine: function(regex) {
      var prevnum = this.start.line - 1;
      var removeit = false;
      if ((prevnum >= 0) && (regex) && (this.lines[prevnum].match(regex)))
        removeit = true;
      if ((prevnum >= 0) && (!regex))
        removeit = true;
      if (removeit) {
        this.lines.splice(prevnum, 1);
        this.start.line -= 1;
        this.end.line -= 1;
      }
    },

    // Remove the specified suffix from the selection
    removeSuffix: function(suffix) {
      if (this.hasSuffix(suffix)) {
        var line = this.lines[this.end.line];
        var end = this.end.position + suffix.length;
        var newline = [
            line.slice(0, this.end.position),
            line.slice(end, line.length)
          ].join('');
        this.lines[this.end.line] = newline;
      }
    },

    // Set the prefix of each selected line. If the prefix is already and
    // set, the line willl be left alone.
    setLinePrefixes: function(prefix, increment) {
      increment = increment ? increment : false;
      for (var i=this.start.line; i <= this.end.line; i++) {
        if (!this.lines[i].startswith(prefix)) {
          // Check if prefix is incrementing
          if (increment) {
            var num = parseInt(prefix.match(/\d+/)[0], 10);
            prefix = prefix.replace(num, num+1);
          }
          // Add the prefix to the line
          var numspaces = this.lines[i].match(/^\s*/)[0].length;
          this.lines[i] = this.lines[i].lstrip();
          this.lines[i] = prefix + this.lines[i];
          if (i === this.start.line)
            this.start.position += prefix.length - numspaces;
          if (i === this.end.line)
            this.end.position += prefix.length - numspaces;
        }
      }
    },

    // Unwrap the selection prefix & suffix
    unwrap: function(prefix, suffix) {
      this.removePrefix(prefix);
      this.removeSuffix(suffix);
    },

    // Remove blank lines from before and after the selection.  If the
    // previous or next line is not blank, it will be left alone.
    unwrapBlankLines: function() {
      this.removePreviousLine(/^\s*$/);
      this.removeNextLine(/^\s*$/);
    },

    // Return the selection value
    val: function() {
      var value = '';
      for (var i=0; i < this.lines.length; i++) {
        var line = this.lines[i];
        if ((i === this.start.line) && (i === this.end.line)) {
          return line.slice(this.start.position, this.end.position);
        } else if (i === this.start.line) {
          value += line.slice(this.start.position, line.length) +'\n';
        } else if ((i > this.start.line) && (i < this.end.line)) {
          value += line +'\n';
        } else if (i === this.end.line) {
          value += line.slice(0, this.end.position);
        }
      }
      return value;
    },

    // Wrap the selection with the specified prefix & suffix
    wrap: function(prefix, suffix) {
      this.addPrefix(prefix);
      this.addSuffix(suffix);
    },

    // Wrap the selected lines with blank lines.  If there is already
    // a blank line in place, another one will not be added.
    wrapBlankLines: function() {
      if (this.start.line > 0)
        this.insertPreviousLine(this.blankline, false);
      if (this.end.line < this.textarea.lines.length - 1)
        this.insertNextLine(this.blankline, false);
    }
  };

  /*----------------------------------------------------------------------------------------------
   * Wysiwym Textarea
   * This can used used for some or all of your textarea modifications. It will keep track of
   * the the current text and selection positions. The general idea is to keep track of the
   * textarea in terms of Line objects.  A line object contains a lineType and supporting text.
   *--------------------------------------------------------------------------------------------- */
  function WysiwymTextarea(el) {
    this.init(el);
  }

  WysiwymTextarea.prototype = {

    init: function(el) {
      this.el = el;                                 // Javascript textarea element
      this.$el = $(el);                             // jQuery textarea object
      this.lines = [];                              // Current textarea lines
      this.selection = new Selection();             // Selection properties & manipulation
      this.scroll = this.el.scrollTop;              // Current cursor scroll position
    },

    refreshedSelection: function() {
      this.lines = this.selection.refresh(
          this.getText(), this.getSelectionStartEnd()
        );
      return this.selection;
    },

    getText: function() {
      return this.el.value.replace(/\r\n/g, '\n');
    },

    // Return a string representation of this object.
    toString: function() {
      var str = 'TEXTAREA: #'+ this.$el.attr('id') +'\n';
      str += this.selection.toString();
      str += 'SCROLL: '+ this.scroll +'px\n';
      str += '---\n';
      for (var i=0; i<this.lines.length; i++)
        str += 'LINE '+ i +': '+ this.lines[i] +'\n';
      return str;
    },

    // Return the current text value of this textarea object
    getProperties: function() {
      var newtext = []            // New textarea value
        , textLength = 0
        , selectionStart = 0      // Absolute cursor start position
        , selectionEnd = 0;       // Absolute cursor end position
      //console.log('There are ' + this.lines.length + ' lines');
      for (var i = 0, j = this.lines.length; i < j; i++) {
        if (i === this.selection.start.line)
          selectionStart = textLength + this.selection.start.position;
        if (i === this.selection.end.line)
          selectionEnd = textLength + this.selection.end.position;
        newtext.push(this.lines[i]);
        textLength += this.lines[i].length;
        if (i !== this.lines.length - 1) {
          newtext.push('\n');
          textLength += 1;
        }
      }
      return [newtext.join(''), selectionStart, selectionEnd];
    },

    // Return the absolute start and end selection postions
    // StackOverflow #1: http://goo.gl/2vSnF
    // StackOverflow #2: http://goo.gl/KHm0d
    getSelectionStartEnd: function() {

      var startpos, endpos;
      if (typeof(this.el.selectionStart) === 'number') {
        startpos = this.el.selectionStart;
        endpos = this.el.selectionEnd;
      } else {
        this.el.focus();
        var text = this.getText();
        var textlen = text.length;
        var range = document.selection.createRange();
        var textrange = this.el.createTextRange();
        textrange.moveToBookmark(range.getBookmark());
        var endrange = this.el.createTextRange();
        endrange.collapse(false);
        if (textrange.compareEndPoints('StartToEnd', endrange) > -1) {
          startpos = textlen;
          endpos = textlen;
        } else {
          startpos = -textrange.moveStart('character', -textlen);
          //startpos += text.slice(0, startpos).split('\n').length - 1;
          if (textrange.compareEndPoints('EndToEnd', endrange) > -1) {
            endpos = textlen;
          } else {
            endpos = -textrange.moveEnd('character', -textlen);
            //endpos += text.slice(0, endpos).split('\n').length - 1;
          }
        }
      }
      return [startpos, endpos];
    },

    // Update the textarea with the current lines and cursor settings
    update: function() {
      var properties = this.getProperties();
      //console.log(properties);
      var newtext = properties[0];
      var selectionStart = properties[1];
      var selectionEnd = properties[2];
      this.$el.val(newtext);
      if (this.el.setSelectionRange) {
          this.el.setSelectionRange(selectionStart, selectionEnd);
      } else if (this.el.createTextRange) {
          var range = this.el.createTextRange();
          range.collapse(true);
          range.moveStart('character', selectionStart);
          range.moveEnd('character', selectionEnd - selectionStart);
          range.select();
      }
      this.el.scrollTop = this.scroll;
      this.$el.focus();
    }
  };
  return wysiwym;




//     this.editor = {
//       editorclass: this.options.editorclass,
//       containerclass: this.options.buttonclass,
//       groups: []
//     }

//     this.blankline = '';

//     this.initializeButtons();
//     this.initializeAutoIndent();
//     this.initializeShortcutHandler();
//     this.initializeHelp();
//     this.initializeHelpToggle();

//     //this$

//     console.log(this.editor);
//     var hotomolo = this.templates.editor.render(this.editor);
//     console.log(this.$el.parent().parent().html(hotomolo));
//     //console.log(hotomolo);
//   },

//   // getOptions: function (options) {
//   //   options = $.extend({}, $.fn[this.type].defaults, options);
//   //   return options;
//   // },

//   // Add the button container and all buttons
//   initializeButtons: function() {
//     var self = this
//       , markup = this.markup
//       , textarea = this.textarea
//     //   , $buttonContainer = this.options.$buttonContainer ||
//     //                        $("<div></div>").insertBefore(this.$el);

//     // $buttonContainer.addClass(this.options.buttonclass);

//     // var $buttonGroup = $('<div class="btn-group"></div>');

//     // var button = this.templates.button;
//     // var a = this.templates.editor.render({

//     // });

//     //console.log(a);
//     var groups = this.editor.groups;

//     markup.buttons.forEach(function(buttonGroup) {
//       //var $newGroup = $buttonGroup.clone();
//       //$newGroup.appendTo($buttonContainer);
//       var group = {
//         buttons: []
//       };
//       buttonGroup.forEach(function(button) {
//         b = button.init(self.textarea);
//         group.buttons.push(b);
//         //button.$el.on('click', $.proxy(self[button.callback], button));
//         //$newGroup.append(button.$el);
//       });
//       groups.push(group);
//       //console.log(group);
//     });
//   },

//   // Initialize the AutoIndent trigger
//   initializeAutoIndent: function() {
//     if (!this.markup.autoindents) {
//       return;
//     }
//     this.$el.on('keydown', $.proxy(this.autoIndent, this));
    
//   },

//   // Initialize the shortcut handler
//   initializeShortcutHandler: function() {
//     // Needs fixing
//     //this.$el.bind('keydown', $.proxy(this.handleShortcut, this));
//   },

//   // Initialize the help syntax popover
//   initializeHelp: function() {
//     if (!this.options.helpEnabled) {
//       return;
//     }

//     // Add the help table and items
//     var $helpBody = $('<tbody></tbody>')
//       , $helpTable = $(['<table class="table table-condensed table-striped">',
//                         '</table>'].join('')).append($helpBody);
//     for (var i in this.markup.help) {
//       var item = this.markup.help[i];
//       $helpBody.append([
//         '<tr>',
//           '<th>', item.label, '</th>',
//           '<td>', item.syntax, '</td>',
//         '</tr>'
//       ].join(''));
//     }

//     this.options.$help = $helpTable;
//   },

//   // Initialize the Help Button
//   initializeHelpToggle: function() {
//     if (!this.options.helpEnabled) {
//       return;
//     }

//     var $helpButton = this.options.$helpButton;
//     if ($helpButton === undefined) {
//       $helpButton = $("<a href='#' class='btn help-button pull-right'></a>");
//       var $text = $("<span>"+ this.options.helpTextShow + "</span>");
//       if (this.options.hideHelpButtonText) { $text.hide(); }
//       var $i = $('<i class="icon-'+ this.options.helpIcon +'"></i>');
//       $helpButton.prepend($i);

//       this.options.$helpButton = $helpButton;
//     }

//     $helpButton.addClass(this.options.helptoggleclass);

//     $helpButton.popover({
//       title: 'Markdown help',
//       content: this.options.$help,
//       trigger: 'manual',
//       delay: {
//         show: 200,
//         hide: 200
//       }
//     });

//     $helpButton.on('click', function(e) {
//       e.preventDefault();
//       $(this).toggleClass('active');
//       $(this).popover('toggle');
//     });

//     this.options.$buttonContainer.prepend($helpButton);

//   },



//   /*----------------------------------------------------------------------------------------------
//    * Wysiwym handleShortcut
//    * Handles keyboard shortcuts
//    *--------------------------------------------------------------------------------------------- */
//   handleShortcut: function(e) {
//     //this.preventDefault();
//     e.stopPropagation();
//     var key = e.which;
//     if (key === 0) {
//         return false;
//     }
//     //console.log(e);
//     // Check to see if we have a shortcut key and, if so click the according button.
//     if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {

//       var buttons = markup.buttons;
//       //var keyCodeStr = String.fromCharCode(keyCode).toLowerCase();
//       keyStr = String.fromCharCode(key);

//       buttons.forEach(function(button) {
//         if (keyStr === button.key) {
//           // If the shortcut key matches, prevent the default action
//           // and click the button's jQuery element
//           e.preventDefault();
//           button.$el.click();
//         }
//       });
//     }
//   }
// };


// var markdown = {
//   buttons: [
//     [
//     new Button('Heading 1', {
//       icon: 'h1',
//       hidetext: true,
//       key: 'h'
//     }, 'span', {
//       prefix: '# ',
//       suffix: '',
//       text: 'Heading 1'
//     }),
//     new Button('Heading 2', {
//       icon: 'h2',
//       hidetext: true
//     }, 'span', {
//       prefix: '## ',
//       suffix: '',
//       text: 'Heading 2'
//     }),
//     new Button('Heading 3', {
//       icon: 'h3',
//       hidetext: true
//     }, 'span', {
//       prefix: '### ',
//       suffix: '',
//       text: 'Heading 3'
//     })

//     ],
//     [

//     new Button('Bold', {
//       icon: 'bold',
//       hidetext: true,
//       key: 'b'
//     }, 'span', {
//       prefix: '**',
//       suffix: '**',
//       text: 'strong text'
//     }),
//     new Button('Italic', {
//       icon: 'italic',
//       hidetext: true,
//       key: 'i'
//     }, 'span', {
//       prefix: '_',
//       suffix: '_',
//       text: 'italic text'
//     }),
//     new Button('Link', {
//       icon: 'link',
//       hidetext: true,
//       key: 'l'
//     }, 'span', {
//       prefix: '[',
//       suffix: '](http://example.com)',
//       text: 'link text'
//     })

//     ],
//     [

//     new Button('Bullet List', {
//       icon: 'list',
//       hidetext: true,
//       key: 'u'
//     }, 'list', {
//       prefix: '* ',
//       wrap: true
//     }),
//     new Button('Number List', {
//       icon: 'numbered-list',
//       hidetext: true,
//       key: 'o'
//     }, 'list', {
//       prefix: '0. ',
//       wrap: true,
//       regex: /^\s*\d+\.\s/
//     })

//     ],
//     [

//     new Button('Quote', {
//       icon: 'quote',
//       hidetext: true,
//       key: 'q'
//     }, 'list', {
//       prefix: '> ',
//       wrap: true
//     }),
//     new Button('Code', {
//       icon: 'code',
//       hidetext: true,
//       key: 'k'
//     }, 'block', {
//       prefix: '    ',
//       wrap: true
//     })

//     ]

//   ],

//   // Configure auto-indenting


//   // Syntax items to display in the help box
//   help: [
//     { label: 'Header', syntax: '## Header ##' },
//     { label: 'Bold',   syntax: '**bold**' },
//     { label: 'Italic', syntax: '_italics_' },
//     { label: 'Link',   syntax: '[pk!](http://google.com)' },
//     { label: 'Bullet List', syntax: '* list item' },
//     { label: 'Number List', syntax: '1. list item' },
//     { label: 'Blockquote', syntax: '&gt; quoted text' },
//     { label: 'Large Code Block', syntax: '(Begin lines with 4 spaces)' },
//     { label: 'Inline Code Block', syntax: '&lt;code&gt;inline code&lt;/code&gt;' }
//   ]
// };




// /*----------------------------------------------------------------------
//  * Additional Javascript Prototypes
//  *-------------------------------------------------------------------- */

//return Wysiwym;

});
