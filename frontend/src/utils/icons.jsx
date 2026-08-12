import { 
  SiJavascript, SiPython, SiCplusplus, SiTypescript, SiRuby, SiPhp, SiSwift,
  SiKotlin, SiGo, SiRust, SiDart, SiElixir, SiClojure, SiLua, SiHaskell,
  SiScala, SiPerl, SiR, SiJulia, SiCoffeescript, SiAssemblyscript, SiGnubash,
  SiOcaml, SiFortran, SiErlang, SiNim, SiZig, SiCrystal, SiD
} from 'react-icons/si'
import { FaJava, FaDatabase } from 'react-icons/fa'
import { FiFileText, FiTerminal, FiCode, FiCpu, FiBox } from 'react-icons/fi'
import { TbBrandCSharp, TbSql } from 'react-icons/tb'

// Color classes for language badges on cards
export const LANG_COLORS = {
  javascript: 'text-yellow-400',
  python: 'text-blue-400',
  java: 'text-orange-400',
  cpp: 'text-purple-400',
  c: 'text-blue-500',
  typescript: 'text-blue-300',
  csharp: 'text-green-400',
  go: 'text-cyan-400',
  rust: 'text-orange-500',
  kotlin: 'text-purple-500',
  swift: 'text-orange-400',
  ruby: 'text-red-400',
  php: 'text-indigo-400',
  dart: 'text-cyan-300',
  bash: 'text-green-300',
  perl: 'text-blue-300',
  lua: 'text-blue-500',
  r: 'text-blue-400',
  haskell: 'text-purple-300',
  scala: 'text-red-500',
  elixir: 'text-purple-400',
  clojure: 'text-green-400',
  julia: 'text-purple-500',
}

// Theme colors for language tags on room cards
export const LANG_THEME = {
  javascript: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  python: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  java: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  cpp: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  c: { bg: 'bg-blue-600/10', text: 'text-blue-500' },
  typescript: { bg: 'bg-blue-400/10', text: 'text-blue-300' },
  csharp: { bg: 'bg-green-500/10', text: 'text-green-400' },
  go: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  rust: { bg: 'bg-orange-600/10', text: 'text-orange-500' },
  kotlin: { bg: 'bg-purple-600/10', text: 'text-purple-500' },
  swift: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  ruby: { bg: 'bg-red-500/10', text: 'text-red-400' },
  php: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  dart: { bg: 'bg-cyan-400/10', text: 'text-cyan-300' },
  bash: { bg: 'bg-green-400/10', text: 'text-green-300' },
  perl: { bg: 'bg-blue-400/10', text: 'text-blue-300' },
  lua: { bg: 'bg-blue-600/10', text: 'text-blue-500' },
  r: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  haskell: { bg: 'bg-purple-400/10', text: 'text-purple-300' },
  scala: { bg: 'bg-red-600/10', text: 'text-red-500' },
  elixir: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  erlang: { bg: 'bg-red-500/10', text: 'text-red-400' },
  clojure: { bg: 'bg-green-500/10', text: 'text-green-400' },
  fsharp: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  julia: { bg: 'bg-purple-600/10', text: 'text-purple-500' },
  crystal: { bg: 'bg-slate-400/10', text: 'text-slate-300' },
  nim: { bg: 'bg-yellow-600/10', text: 'text-yellow-500' },
  zig: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  sql: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  mongodb: { bg: 'bg-green-600/10', text: 'text-green-500' },
}

export const getLangIcon = (lang, className = "") => {
  switch (lang) {
    case 'javascript':   return <SiJavascript className={`text-[#F7DF1E] bg-black rounded-sm ${className}`} />
    case 'python':       return <SiPython className={`text-[#3776AB] ${className}`} />
    case 'java':         return <FaJava className={`text-[#E76F00] ${className}`} />
    case 'cpp':          return <SiCplusplus className={`text-[#00599C] ${className}`} />
    case 'c':            return <FiCode className={`text-[#A8B9CC] ${className}`} />
    case 'typescript':   return <SiTypescript className={`text-[#3178C6] bg-white rounded-sm ${className}`} />
    case 'csharp':       return <TbBrandCSharp className={`text-[#68217A] ${className}`} />
    case 'go':           return <SiGo className={`text-[#00ADD8] ${className}`} />
    case 'rust':         return <SiRust className={`text-[#CE422B] ${className}`} />
    case 'kotlin':       return <SiKotlin className={`text-[#7F52FF] ${className}`} />
    case 'swift':        return <SiSwift className={`text-[#FA7343] ${className}`} />
    case 'ruby':         return <SiRuby className={`text-[#CC342D] ${className}`} />
    case 'php':          return <SiPhp className={`text-[#777BB4] ${className}`} />
    case 'dart':         return <SiDart className={`text-[#0175C2] ${className}`} />
    case 'bash':         return <SiGnubash className={`text-[#4EAA25] ${className}`} />
    case 'perl':         return <SiPerl className={`text-[#39457E] ${className}`} />
    case 'lua':          return <SiLua className={`text-[#2C2D72] ${className}`} />
    case 'r':            return <SiR className={`text-[#276DC3] ${className}`} />
    case 'coffeescript': return <SiCoffeescript className={`text-[#2F2625] ${className}`} />
    case 'haskell':      return <SiHaskell className={`text-[#5D4F85] ${className}`} />
    case 'scala':        return <SiScala className={`text-[#DC322F] ${className}`} />
    case 'elixir':       return <SiElixir className={`text-[#6E4A7E] ${className}`} />
    case 'erlang':       return <SiErlang className={`text-[#A90533] ${className}`} />
    case 'clojure':      return <SiClojure className={`text-[#5881D8] ${className}`} />
    case 'fsharp':       return <FiCode className={`text-[#378BBA] ${className}`} />
    case 'ocaml':        return <SiOcaml className={`text-[#EC6813] ${className}`} />
    case 'julia':        return <SiJulia className={`text-[#9558B2] ${className}`} />
    case 'd':            return <SiD className={`text-[#B03931] ${className}`} />
    case 'nim':          return <SiNim className={`text-[#FFE953] ${className}`} />
    case 'zig':          return <SiZig className={`text-[#F7A41D] ${className}`} />
    case 'crystal':      return <SiCrystal className={`text-[#000100] ${className}`} />
    case 'fortran':      return <SiFortran className={`text-[#734F96] ${className}`} />
    case 'groovy':       return <FiCode className={`text-[#4298B8] ${className}`} />
    case 'nasm':         return <SiAssemblyscript className={`text-[#007AAC] ${className}`} />
    case 'sql':          return <TbSql className={`text-[#E38C00] ${className}`} />
    case 'mongodb':      return <FaDatabase className={`text-[#47A248] ${className}`} />
    case 'vb':           return <FiCode className={`text-[#945DB7] ${className}`} />
    case 'pascal':       return <FiCode className={`text-[#E3F171] ${className}`} />
    case 'cobol':        return <FiCpu className={`text-[#005CA5] ${className}`} />
    case 'ada':          return <FiBox className={`text-[#02F88C] ${className}`} />
    case 'prolog':       return <FiTerminal className={`text-[#74283C] ${className}`} />
    case 'scheme':       return <FiCode className={`text-[#1E4AEC] ${className}`} />
    case 'racket':       return <FiCode className={`text-[#9F1D20] ${className}`} />
    case 'lisp':         return <FiCode className={`text-[#3FB68B] ${className}`} />
    case 'objectivec':   return <FiCode className={`text-[#438EFF] ${className}`} />
    case 'smalltalk':    return <FiCode className={`text-[#596706] ${className}`} />
    case 'tcl':          return <FiTerminal className={`text-[#E4CC98] ${className}`} />
    case 'octave':       return <FiTerminal className={`text-[#0790C0] ${className}`} />
    case 'brainfuck':    return <FiCpu className={`text-[#2F2530] ${className}`} />
    case 'lolcode':      return <FiTerminal className={`text-[#FF69B4] ${className}`} />
    case 'spidermonkey': return <SiJavascript className={`text-[#FF6611] ${className}`} />
    case 'sml':          return <FiCode className={`text-[#DC566D] ${className}`} />
    case 'factor':       return <FiCode className={`text-[#636746] ${className}`} />
    case 'icon':         return <FiCode className={`text-[#1A5276] ${className}`} />
    case 'pike':         return <FiCode className={`text-[#005390] ${className}`} />
    default:             return <FiFileText className={`text-slate-300 ${className}`} />
  }
}
