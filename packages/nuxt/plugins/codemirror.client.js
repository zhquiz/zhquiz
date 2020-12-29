import CodeMirror from 'codemirror'
import Vue from 'vue'
import VueCodemirror from 'vue-codemirror'

import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/mode/htmlmixed/htmlmixed.js'
import 'codemirror/addon/comment/comment.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/mode/overlay.js'
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/brace-fold.js'
import 'codemirror/addon/fold/indent-fold.js'
import 'codemirror/addon/fold/comment-fold.js'
import 'codemirror/addon/fold/markdown-fold.js'

import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/fold/foldgutter.css'

CodeMirror.defineMode('mustache', (config, parserConfig) => {
  const mustacheOverlay = {
    token(stream) {
      let ch
      if (stream.match('{{')) {
        while ((ch = stream.next()) != null) {
          if (ch === '}' && stream.next() === '}') {
            stream.eat('}')
            return 'mustache'
          }
        }
      }
      while (stream.next() != null && !stream.match('{{', false)) {}
      return null
    },
  }
  return CodeMirror.overlayMode(
    CodeMirror.getMode(config, parserConfig.backdrop || 'markdown'),
    mustacheOverlay
  )
})

Vue.use(VueCodemirror, {
  options: {
    theme: 'default',
    lineNumbers: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    lineWrapping: true,
    tabSize: 2,
    extraKeys: {
      'Cmd-/': 'toggleComment',
      'Ctrl-/': 'toggleComment',
      Tab: (cm) => {
        const spaces = Array(cm.getOption('indentUnit') + 1).join(' ')
        cm.getDoc().replaceSelection(spaces)
      },
    },
    foldGutter: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    mode: 'mustache',
  },
})
