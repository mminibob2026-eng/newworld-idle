'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'

interface IntroStoryProps {
  characterName: string
  originName: string
  onComplete: () => void
}

const STORY_LINES_ZH = [
  '...',
  '黑暗中，你缓缓睁开眼睛。',
  '一切记忆都变得模糊——',
  '你曾经学过的知识，掌握的技能，认识的人...',
  '全部归零。',
  '',
  '你不知道自己为什么会出现在这里。',
  '这里是一个全新的世界。',
  '空气中弥漫着陌生的气息。',
  '',
  '你唯一知道的是——',
  '你叫 {name}。',
  '你出身于 {origin}。',
  '',
  '这个世界会如何对待你？',
  '你会成为什么样的人？',
  '',
  '一切，都由你来决定。',
  '',
  '新的一天，开始了。',
]

const STORY_LINES_EN = [
  '...',
  'In the darkness, you slowly open your eyes.',
  'All memories become hazy—',
  'The knowledge you once had, the skills you mastered, the people you knew...',
  'All reset to zero.',
  '',
  'You don\'t know why you\'re here.',
  'This is a brand new world.',
  'The air is filled with unfamiliar scents.',
  '',
  'The only thing you know is—',
  'Your name is {name}.',
  'You were born into {origin}.',
  '',
  'How will this world treat you?',
  'What kind of person will you become?',
  '',
  'Everything is up to you to decide.',
  '',
  'A new day has begun.',
]

export function IntroStory({ characterName, originName, onComplete }: IntroStoryProps) {
  const { locale } = useTranslation()
  const [currentLine, setCurrentLine] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showSkip, setShowSkip] = useState(true)

  const lines = locale === 'zh' ? STORY_LINES_ZH : STORY_LINES_EN
  const fullText = lines[currentLine]
    .replace('{name}', characterName)
    .replace('{origin}', originName)

  useEffect(() => {
    if (!fullText) {
      setDisplayedText('')
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    setDisplayedText('')
    let i = 0
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(fullText.slice(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 40)

    return () => clearInterval(interval)
  }, [currentLine, fullText])

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(fullText)
      setIsTyping(false)
      return
    }

    if (currentLine < lines.length - 1) {
      setCurrentLine(currentLine + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div
      className="intro-story-overlay"
      onClick={handleNext}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: '#000',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        cursor: 'pointer',
      }}
    >
      {/* Story text */}
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <p style={{
          color: '#ccc',
          fontSize: '14px',
          lineHeight: '2',
          letterSpacing: '1px',
          whiteSpace: 'pre-line',
        }}>
          {displayedText}
          {isTyping && <span className="intro-cursor">|</span>}
        </p>
      </div>

      {/* Continue indicator */}
      {!isTyping && currentLine < lines.length - 1 && (
        <div style={{
          color: '#555',
          fontSize: '11px',
          marginTop: '40px',
          animation: 'pulse 2s ease infinite',
        }}>
          {locale === 'zh' ? '点击继续...' : 'Click to continue...'}
        </div>
      )}

      {/* End indicator */}
      {!isTyping && currentLine === lines.length - 1 && (
        <div style={{
          color: '#0ff',
          fontSize: '11px',
          marginTop: '40px',
          animation: 'pulse 2s ease infinite',
        }}>
          {locale === 'zh' ? '点击开始你的新生活...' : 'Click to begin your new life...'}
        </div>
      )}

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleSkip()
          }}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'none',
            border: '1px solid #333',
            color: '#555',
            padding: '8px 16px',
            fontSize: '11px',
            cursor: 'pointer',
            zIndex: 10001,
          }}
        >
          {locale === 'zh' ? '跳过' : 'Skip'}
        </button>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .intro-cursor {
          animation: blink 0.8s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
