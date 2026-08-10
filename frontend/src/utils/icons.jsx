import { SiJavascript, SiPython, SiCplusplus, SiTypescript } from 'react-icons/si'
import { FaJava } from 'react-icons/fa'
import { FiFileText } from 'react-icons/fi'

export const LANG_COLORS = {
  javascript: 'text-yellow-400',
  python: 'text-blue-400',
  java: 'text-orange-400',
  cpp: 'text-purple-400',
  typescript: 'text-blue-300',
  go: 'text-cyan-400',
  rust: 'text-orange-500',
}

export const LANG_THEME = {
  javascript: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  python: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  java: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  cpp: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  typescript: { bg: 'bg-blue-400/10', text: 'text-blue-300' },
  go: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  rust: { bg: 'bg-orange-600/10', text: 'text-orange-500' },
}

export const getLangIcon = (lang, className = "") => {
  if (lang === 'python') return <SiPython className={`text-[#3776AB] ${className}`} />
  if (lang === 'cpp') return <SiCplusplus className={`text-[#00599C] ${className}`} />
  if (lang === 'javascript') return <SiJavascript className={`text-[#F7DF1E] bg-black rounded-sm ${className}`} />
  if (lang === 'typescript') return <SiTypescript className={`text-[#3178C6] bg-white rounded-sm ${className}`} />
  if (lang === 'java') return <FaJava className={`text-[#E76F00] ${className}`} />
  return <FiFileText className={`text-slate-300 ${className}`} />
}
