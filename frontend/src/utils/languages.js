/**
 * languages.js — Central language configuration for CodeCollab
 * Maps internal language keys to display names, Monaco editor IDs,
 * categories, and default code templates.
 */

export const LANGUAGE_CONFIG = {
  // ── Popular ────────────────────────────────────────────────────────────────
  javascript:  { display: 'JavaScript',   monaco: 'javascript',  category: 'Popular' },
  python:      { display: 'Python 3',     monaco: 'python',      category: 'Popular' },
  java:        { display: 'Java',         monaco: 'java',        category: 'Popular' },
  cpp:         { display: 'C++',          monaco: 'cpp',         category: 'Popular' },
  c:           { display: 'C',            monaco: 'c',           category: 'Popular' },
  typescript:  { display: 'TypeScript',   monaco: 'typescript',  category: 'Popular' },
  csharp:      { display: 'C#',           monaco: 'csharp',      category: 'Popular' },
  go:          { display: 'Go',           monaco: 'go',          category: 'Popular' },
  rust:        { display: 'Rust',         monaco: 'rust',        category: 'Popular' },
  kotlin:      { display: 'Kotlin',       monaco: 'kotlin',      category: 'Popular' },
  swift:       { display: 'Swift',        monaco: 'swift',       category: 'Popular' },
  ruby:        { display: 'Ruby',         monaco: 'ruby',        category: 'Popular' },
  php:         { display: 'PHP',          monaco: 'php',         category: 'Popular' },
  dart:        { display: 'Dart',         monaco: 'dart',        category: 'Popular' },

  // ── Scripting ──────────────────────────────────────────────────────────────
  bash:        { display: 'Bash',         monaco: 'shell',       category: 'Scripting' },
  perl:        { display: 'Perl',         monaco: 'perl',        category: 'Scripting' },
  lua:         { display: 'Lua',          monaco: 'lua',         category: 'Scripting' },
  r:           { display: 'R',            monaco: 'r',           category: 'Scripting' },
  coffeescript:{ display: 'CoffeeScript', monaco: 'coffeescript', category: 'Scripting' },
  tcl:         { display: 'Tcl',          monaco: 'tcl',         category: 'Scripting' },
  octave:      { display: 'Octave',       monaco: 'plaintext',   category: 'Scripting' },

  // ── Functional ─────────────────────────────────────────────────────────────
  haskell:     { display: 'Haskell',      monaco: 'plaintext',   category: 'Functional' },
  scala:       { display: 'Scala',        monaco: 'scala',       category: 'Functional' },
  elixir:      { display: 'Elixir',       monaco: 'plaintext',   category: 'Functional' },
  erlang:      { display: 'Erlang',       monaco: 'plaintext',   category: 'Functional' },
  clojure:     { display: 'Clojure',      monaco: 'clojure',     category: 'Functional' },
  fsharp:      { display: 'F#',           monaco: 'fsharp',      category: 'Functional' },
  ocaml:       { display: 'OCaml',        monaco: 'plaintext',   category: 'Functional' },
  racket:      { display: 'Racket',       monaco: 'plaintext',   category: 'Functional' },
  scheme:      { display: 'Scheme',       monaco: 'scheme',      category: 'Functional' },
  lisp:        { display: 'Lisp',         monaco: 'plaintext',   category: 'Functional' },
  sml:         { display: 'SML',          monaco: 'plaintext',   category: 'Functional' },

  // ── Systems ────────────────────────────────────────────────────────────────
  nasm:        { display: 'Assembly (NASM)', monaco: 'plaintext', category: 'Systems' },
  objectivec:  { display: 'Objective-C',  monaco: 'objective-c', category: 'Systems' },
  d:           { display: 'D',            monaco: 'd',           category: 'Systems' },
  nim:         { display: 'Nim',          monaco: 'plaintext',   category: 'Systems' },
  zig:         { display: 'Zig',          monaco: 'plaintext',   category: 'Systems' },
  ada:         { display: 'Ada',          monaco: 'plaintext',   category: 'Systems' },
  fortran:     { display: 'Fortran',      monaco: 'plaintext',   category: 'Systems' },
  pascal:      { display: 'Pascal',       monaco: 'pascal',      category: 'Systems' },
  cobol:       { display: 'COBOL',        monaco: 'plaintext',   category: 'Systems' },

  // ── JVM & .NET ─────────────────────────────────────────────────────────────
  groovy:      { display: 'Groovy',       monaco: 'plaintext',   category: 'JVM & .NET' },
  vb:          { display: 'VB.NET',       monaco: 'vb',          category: 'JVM & .NET' },

  // ── Logic & Academic ───────────────────────────────────────────────────────
  prolog:      { display: 'Prolog',       monaco: 'plaintext',   category: 'Academic' },
  julia:       { display: 'Julia',        monaco: 'julia',       category: 'Academic' },
  crystal:     { display: 'Crystal',      monaco: 'plaintext',   category: 'Academic' },
  smalltalk:   { display: 'Smalltalk',    monaco: 'plaintext',   category: 'Academic' },
  factor:      { display: 'Factor',       monaco: 'plaintext',   category: 'Academic' },
  icon:        { display: 'Icon',         monaco: 'plaintext',   category: 'Academic' },
  pike:        { display: 'Pike',         monaco: 'plaintext',   category: 'Academic' },
  lolcode:     { display: 'LOLCODE',      monaco: 'plaintext',   category: 'Academic' },
  brainfuck:   { display: 'Brainfuck',    monaco: 'plaintext',   category: 'Academic' },
  spidermonkey:{ display: 'SpiderMonkey', monaco: 'javascript',  category: 'Academic' },

  // ── Database ───────────────────────────────────────────────────────────────
  sql:         { display: 'SQL',          monaco: 'sql',         category: 'Database' },
  mongodb:     { display: 'MongoDB',      monaco: 'javascript',  category: 'Database' },
}

// Flat list of all language keys
export const LANGUAGES = Object.keys(LANGUAGE_CONFIG)

// Get display name for a language key
export const getLangDisplay = (key) => LANGUAGE_CONFIG[key]?.display || key.charAt(0).toUpperCase() + key.slice(1)

// Get Monaco language ID for a language key
export const getMonacoLang = (key) => LANGUAGE_CONFIG[key]?.monaco || 'plaintext'

// Get all unique categories in display order
export const CATEGORIES = ['Popular', 'Scripting', 'Functional', 'Systems', 'JVM & .NET', 'Academic', 'Database']

// Get languages grouped by category
export const getLanguagesByCategory = () => {
  const grouped = {}
  for (const cat of CATEGORIES) {
    grouped[cat] = Object.entries(LANGUAGE_CONFIG)
      .filter(([, cfg]) => cfg.category === cat)
      .map(([key]) => key)
  }
  return grouped
}

// Default code templates
export const DEFAULT_CODE = {
  javascript:  '// Welcome to CodeCollab!\nconsole.log("Hello, World!");\n',
  python:      '# Welcome to CodeCollab!\nprint("Hello, World!")\n',
  java:        'public class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  cpp:         '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  c:           '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  typescript:  '// Welcome to CodeCollab!\nconsole.log("Hello, World!");\n',
  csharp:      'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
  go:          'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
  rust:        'fn main() {\n    println!("Hello, World!");\n}\n',
  kotlin:      'fun main() {\n    println("Hello, World!")\n}\n',
  swift:       'print("Hello, World!")\n',
  ruby:        '# Welcome to CodeCollab!\nputs "Hello, World!"\n',
  php:         '<?php\n// Welcome to CodeCollab!\necho "Hello, World!\\n";\n?>\n',
  dart:        'void main() {\n  print("Hello, World!");\n}\n',
  bash:        '#!/bin/bash\n# Welcome to CodeCollab!\necho "Hello, World!"\n',
  perl:        '#!/usr/bin/perl\n# Welcome to CodeCollab!\nprint "Hello, World!\\n";\n',
  lua:         '-- Welcome to CodeCollab!\nprint("Hello, World!")\n',
  r:           '# Welcome to CodeCollab!\ncat("Hello, World!\\n")\n',
  coffeescript:'# Welcome to CodeCollab!\nconsole.log "Hello, World!"\n',
  tcl:         '# Welcome to CodeCollab!\nputs "Hello, World!"\n',
  octave:      '% Welcome to CodeCollab!\ndisp("Hello, World!")\n',
  haskell:     '-- Welcome to CodeCollab!\nmain :: IO ()\nmain = putStrLn "Hello, World!"\n',
  scala:       'object Main extends App {\n  println("Hello, World!")\n}\n',
  elixir:      '# Welcome to CodeCollab!\nIO.puts("Hello, World!")\n',
  erlang:      '-module(main).\n-export([start/0]).\n\nstart() ->\n    io:format("Hello, World!~n").\n',
  clojure:     '; Welcome to CodeCollab!\n(println "Hello, World!")\n',
  fsharp:      '// Welcome to CodeCollab!\nprintfn "Hello, World!"\n',
  ocaml:       '(* Welcome to CodeCollab! *)\nprint_endline "Hello, World!"\n',
  racket:      '#lang racket\n; Welcome to CodeCollab!\n(displayln "Hello, World!")\n',
  scheme:      '; Welcome to CodeCollab!\n(display "Hello, World!")\n(newline)\n',
  lisp:        '; Welcome to CodeCollab!\n(format t "Hello, World!~%")\n',
  sml:         '(* Welcome to CodeCollab! *)\nprint "Hello, World!\\n";\n',
  nasm:        'section .data\n    msg db "Hello, World!", 10\n    len equ $ - msg\n\nsection .text\n    global _start\n\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, len\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall\n',
  objectivec:  '#import <Foundation/Foundation.h>\n\nint main(int argc, const char * argv[]) {\n    @autoreleasepool {\n        NSLog(@"Hello, World!");\n    }\n    return 0;\n}\n',
  d:           'import std.stdio;\n\nvoid main() {\n    writeln("Hello, World!");\n}\n',
  nim:         '# Welcome to CodeCollab!\necho "Hello, World!"\n',
  zig:         'const std = @import("std");\n\npub fn main() void {\n    std.debug.print("Hello, World!\\n", .{});\n}\n',
  ada:         'with Ada.Text_IO;\n\nprocedure Main is\nbegin\n   Ada.Text_IO.Put_Line("Hello, World!");\nend Main;\n',
  fortran:     'program hello\n    implicit none\n    print *, "Hello, World!"\nend program hello\n',
  pascal:      'program Hello;\nbegin\n    writeln(\'Hello, World!\');\nend.\n',
  cobol:       '       IDENTIFICATION DIVISION.\n       PROGRAM-ID. HELLO.\n       PROCEDURE DIVISION.\n           DISPLAY "Hello, World!".\n           STOP RUN.\n',
  groovy:      '// Welcome to CodeCollab!\nprintln "Hello, World!"\n',
  vb:          'Module Program\n    Sub Main()\n        Console.WriteLine("Hello, World!")\n    End Sub\nEnd Module\n',
  prolog:      ':- initialization(main).\nmain :- write(\'Hello, World!\'), nl, halt.\n',
  julia:       '# Welcome to CodeCollab!\nprintln("Hello, World!")\n',
  crystal:     '# Welcome to CodeCollab!\nputs "Hello, World!"\n',
  smalltalk:   'Transcript show: \'Hello, World!\'; cr.\n',
  factor:      'USING: io ;\n"Hello, World!" print\n',
  icon:        'procedure main()\n    write("Hello, World!")\nend\n',
  pike:        'int main() {\n    write("Hello, World!\\n");\n    return 0;\n}\n',
  lolcode:     'HAI 1.2\n  VISIBLE "Hello, World!"\nKTHXBYE\n',
  brainfuck:   '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.\n',
  spidermonkey:'// Welcome to CodeCollab!\nprint("Hello, World!");\n',
  sql:         '-- Welcome to CodeCollab!\nSELECT \'Hello, World!\' AS greeting;\n',
  mongodb:     '// Welcome to CodeCollab!\ndb.hello.insertOne({ message: "Hello, World!" });\ndb.hello.find().forEach(printjson);\n',
}
