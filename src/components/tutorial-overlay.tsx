'use client'

import { useState, useEffect } from 'react'
import { playClick } from '@/lib/sound'

const TUTORIAL_STEPS = [
  {
    title: 'WELCOME TO NEW WORLD',
    text: 'Your idle journey begins here. Start professions and explorations to gather resources, complete contracts for gold, and discover rare artifacts.',
    highlight: null,
  },
  {
    title: 'START ACTIVITIES',
    text: 'Go to PROFESSIONS to start gathering or crafting. Go to EXPLORE to send your character on expeditions. Both run simultaneously!',
    highlight: 'professions',
  },
  {
    title: 'CLAIM REWARDS',
    text: 'When activities complete, return to claim them. You get items, XP, and maybe rare discoveries. Offline progress is calculated automatically.',
    highlight: 'home',
  },
  {
    title: 'COMPLETE CONTRACTS',
    text: 'Visit CONTRACTS to deliver items for gold and Knowledge Points. You can complete up to 12 per day.',
    highlight: 'contracts',
  },
  {
    title: 'GROW STRONGER',
    text: 'When you level up, you gain Attribute Points. Spend them on STR, DEX, INT, END, LCK, or CHA to boost your abilities.',
    highlight: 'home',
  },
]

export function TutorialOverlay({ onComplete, userId, characterId }: { onComplete: () => void; userId?: string; characterId?: string }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!characterId) return
    // Check if tutorial is done for this specific character
    const completedChars = JSON.parse(localStorage.getItem('nw-tutorial-chars') || '[]')
    if (!completedChars.includes(characterId)) {
      setVisible(true)
    }
  }, [characterId])

  if (!visible) return null

  const current = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1

  const next = () => {
    playClick()
    if (isLast) {
      finish()
    } else {
      setStep(step + 1)
    }
  }

  const skip = () => {
    playClick()
    finish()
  }

  const finish = () => {
    if (characterId) {
      const completedChars = JSON.parse(localStorage.getItem('nw-tutorial-chars') || '[]')
      if (!completedChars.includes(characterId)) {
        completedChars.push(characterId)
        localStorage.setItem('nw-tutorial-chars', JSON.stringify(completedChars))
      }
    }
    setVisible(false)
    onComplete()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-tertiary)', border: '1px solid var(--accent)',
        padding: '24px', maxWidth: '360px', width: '90%',
        boxShadow: '0 0 40px var(--accent-glow)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#0ff', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            TUTORIAL {step + 1}/{TUTORIAL_STEPS.length}
          </span>
          <button style={{ fontSize: '10px', padding: '4px 8px', color: '#888' }} onClick={skip}>
            SKIP
          </button>
        </div>

        <div style={{ color: '#0ff', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
          {current.title}
        </div>
        <div style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.6', marginBottom: '20px' }}>
          {current.text}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ flex: 1 }} onClick={next}>
            {isLast ? 'LET\'S GO!' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  )
}
