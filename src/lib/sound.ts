let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

export function playClick() {
  playTone(800, 0.05, 'square', 0.05)
}

export function playReward() {
  playTone(523, 0.1, 'square', 0.08)
  setTimeout(() => playTone(659, 0.1, 'square', 0.08), 100)
  setTimeout(() => playTone(784, 0.15, 'square', 0.08), 200)
}

export function playError() {
  playTone(300, 0.15, 'sawtooth', 0.06)
  setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.06), 100)
}

export function playRare() {
  playTone(880, 0.08, 'sine', 0.06)
  setTimeout(() => playTone(1100, 0.08, 'sine', 0.06), 80)
  setTimeout(() => playTone(1320, 0.08, 'sine', 0.06), 160)
  setTimeout(() => playTone(1760, 0.12, 'sine', 0.06), 240)
}

export function playLevelUp() {
  const notes = [392, 440, 523, 659, 784]
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.12, 'square', 0.07), i * 80)
  })
}
