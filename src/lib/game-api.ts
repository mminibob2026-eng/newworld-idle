const API = '/api/game'

async function callGame(action: string, params: Record<string, any> = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  return res.json()
}

export const gameAPI = {
  // Energy
  spendEnergy: (amount: number) => callGame('spend_energy', { amount }),
  recoverEnergy: () => callGame('recover_energy'),
  dailyReset: () => callGame('daily_reset'),
  recoverOffline: () => callGame('recover_offline'),

  // Education
  enrollEducation: (stageId: string) => callGame('enroll_education', { stageId }),
  progressEducation: (amount?: number) => callGame('progress_education', { amount }),

  // Work
  startWork: (jobId: string) => callGame('start_work', { jobId }),
  finishWork: () => callGame('finish_work'),

  // Training
  startTraining: (skillId: string) => callGame('start_training', { skillId }),
  finishTraining: () => callGame('finish_training'),

  // Skills
  addSkillXP: (skillId: string, amount: number) => callGame('add_skill_xp', { skillId, amount }),

  // Adventures
  startAdventure: (adventureId: string) => callGame('start_adventure', { adventureId }),
  resolveAdventure: (recordId: string, choiceIndex: number) => callGame('resolve_adventure', { recordId, choiceIndex }),

  // Family: Partner
  findPartner: () => callGame('find_partner'),
  advanceRelationship: (partnerId: string, stage: string) => callGame('advance_relationship', { partnerId, stage }),

  // Family: Parents
  createParents: () => callGame('create_parents'),
  visitParent: (parentId: string) => callGame('visit_parent', { parentId }),
  parentHelp: (parentId: string) => callGame('parent_help', { parentId }),
  parentInherit: (parentId: string) => callGame('parent_inherit', { parentId }),

  // Family: Pet
  adoptPet: (breedId: string, petName: string) => callGame('adopt_pet', { breedId, petName }),
  feedPet: (petId: string) => callGame('feed_pet', { petId }),
  trainPet: (petId: string) => callGame('train_pet', { petId }),

  // Combat
  startCombat: (enemyId: string) => callGame('start_combat', { enemyId }),

  // Talents
  revealTalent: (talentId: string) => callGame('reveal_talent', { talentId }),
}
