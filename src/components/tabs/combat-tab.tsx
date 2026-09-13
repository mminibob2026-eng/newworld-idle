'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { createClient } from '@/lib/supabase'
import { ENEMIES, enemyName } from '@/lib/game-data'
import { gameAPI } from '@/lib/game-api'

interface CombatTabProps {
  character: any
  onRefresh: () => Promise<void>
}

export function CombatTab({ character, onRefresh }: CombatTabProps) {
  const { t, locale } = useTranslation()
  const [combatHistory, setCombatHistory] = useState<any[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastResult, setLastResult] = useState<any>(null)

  const supabase = createClient() as any

  useEffect(() => {
    loadHistory()
  }, [character.id])

  async function loadHistory() {
    const { data } = await supabase
      .from('character_combat')
      .select('*')
      .eq('character_id', character.id)
      .order('fought_at', { ascending: false })
      .limit(10)
    setCombatHistory(data || [])
  }

  function showMsg(type: 'error' | 'success', msg: string) {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  async function fightEnemy(enemyId: string) {
    setLoading(enemyId)
    setError('')
    setLastResult(null)
    const res = await gameAPI.startCombat(enemyId)
    if (res.ok) {
      setLastResult(res.data)
      if (res.data.playerWins) {
        showMsg('success', locale === 'zh'
          ? `胜利！造成 ${res.data.playerDamage} 伤害，受到 ${res.data.enemyDamage} 伤害`
          : `Victory! Dealt ${res.data.playerDamage}, took ${res.data.enemyDamage}`)
      } else {
        showMsg('error', locale === 'zh'
          ? `失败...造成 ${res.data.playerDamage} 伤害，受到 ${res.data.enemyDamage} 伤害`
          : `Defeat... Dealt ${res.data.playerDamage}, took ${res.data.enemyDamage}`)
      }
      await loadHistory()
      await onRefresh()
    } else {
      showMsg('error', res.error || 'Failed')
    }
    setLoading(null)
  }

  const playerPower = (character.strength || 1) * 2 + (character.dexterity || 1) + (character.endurance || 1)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.combat.title}</h2>

      {/* Player Stats */}
      <div className="panel">
        <h3 className="font-bold mb-2">{locale === 'zh' ? '你的战斗力' : 'Your Power'}</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-white/5">
            <div className="text-xs opacity-60">{t.combat.stats.str}</div>
            <div className="font-bold">{character.strength || 1}</div>
          </div>
          <div className="p-2 rounded bg-white/5">
            <div className="text-xs opacity-60">{t.combat.stats.dex}</div>
            <div className="font-bold">{character.dexterity || 1}</div>
          </div>
          <div className="p-2 rounded bg-white/5">
            <div className="text-xs opacity-60">{t.combat.stats.end}</div>
            <div className="font-bold">{character.endurance || 1}</div>
          </div>
        </div>
        <div className="text-center mt-2 text-sm opacity-60">
          {locale === 'zh' ? `综合战力: ${playerPower}` : `Total Power: ${playerPower}`}
        </div>
      </div>

      {error && <div className="text-red-400 text-sm text-center">{error}</div>}
      {success && <div className="text-green-400 text-sm text-center">{success}</div>}

      {/* Last Result */}
      {lastResult && (
        <div className={`panel border ${lastResult.playerWins ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <div className={`font-bold mb-2 ${lastResult.playerWins ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult.playerWins
              ? (locale === 'zh' ? '战斗胜利！' : 'Victory!')
              : (locale === 'zh' ? '战斗失败...' : 'Defeat...')}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="opacity-60">{locale === 'zh' ? '你造成的伤害' : 'Your Damage'}</div>
              <div className="font-bold text-lg">{lastResult.playerDamage}</div>
            </div>
            <div>
              <div className="opacity-60">{locale === 'zh' ? '受到的伤害' : 'Damage Taken'}</div>
              <div className="font-bold text-lg">{lastResult.enemyDamage}</div>
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <div>+{lastResult.xpReward} XP</div>
            <div>+{lastResult.goldReward}g</div>
          </div>
        </div>
      )}

      {/* Enemies */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.combat.enemies}</h3>
        <div className="space-y-2">
          {ENEMIES.map(enemy => {
            const canFight = character.energy >= 15 && !loading
            const enemyPower = enemy.attack + enemy.defense
            const difficulty = enemyPower > playerPower * 1.5 ? 'hard' : enemyPower > playerPower * 0.8 ? 'medium' : 'easy'

            return (
              <div key={enemy.id} className="flex items-center justify-between p-3 rounded bg-white/5">
                <div className="flex-1">
                  <div className="font-bold">{enemyName(enemy.id, locale)}</div>
                  <div className="text-xs opacity-60">
                    Lv{enemy.level} • HP:{enemy.hp} • ATK:{enemy.attack} • DEF:{enemy.defense}
                  </div>
                  <div className="text-xs opacity-60">
                    +{enemy.xpReward} XP • +{enemy.goldReward}g
                  </div>
                  <div className={`text-xs mt-1 ${
                    difficulty === 'easy' ? 'text-green-400'
                    : difficulty === 'medium' ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                    {difficulty === 'easy' ? (locale === 'zh' ? '简单' : 'Easy')
                    : difficulty === 'medium' ? (locale === 'zh' ? '中等' : 'Medium')
                    : (locale === 'zh' ? '困难' : 'Hard')}
                  </div>
                </div>
                <button
                  className="btn-sm ml-2"
                  disabled={!canFight}
                  onClick={() => fightEnemy(enemy.id)}
                >
                  {loading === enemy.id ? '...' : `${t.combat.fight} (15E)`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Combat Log */}
      <div className="panel">
        <h3 className="font-bold mb-2">{t.combat.combatLog}</h3>
        {combatHistory.length === 0 ? (
          <p className="text-sm opacity-60">{t.combat.noCombats}</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {combatHistory.map(c => (
              <div key={c.id} className={`p-2 rounded text-sm ${
                c.result === 'victory' ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex justify-between">
                  <span className="font-bold">{enemyName(c.enemy_id, locale)}</span>
                  <span className={`text-xs ${
                    c.result === 'victory' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {c.result === 'victory' ? 'WIN' : 'LOSE'}
                  </span>
                </div>
                <div className="text-xs opacity-60">
                  {locale === 'zh' ? `你: ${c.player_damage}  敌: ${c.enemy_damage}` : `You: ${c.player_damage}  Enemy: ${c.enemy_damage}`}
                  • +{c.xp_earned} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
