// Mago Combat Specialization Manager
// Minecraft 1.21.1 / NeoForge / KubeJS 2101 / Puffish Skills 0.18.0
//
// Design:
// - Puffish category unlock state is the ONLY source of truth.
// - Exactly one combat specialization may be active, or none.
// - Category lock/unlock must preserve XP, points, and unlocked skills.
// - Existing access tags are derived state only.
// - Archer intentionally has no mago_archer_active tag.
// - Status is strictly read-only.
// - Watcher repairs TAGS ONLY. It never automatically locks/unlocks categories.
//
// Rhino compatibility:
// - Avoid const / let.
// - Avoid arrow functions.
// - Avoid the identifier "categories" for local variables.
// - Avoid functional Array callbacks in the critical path.

(function () {
  var SkillsAPI = Java.loadClass('net.puffish.skillsmod.api.SkillsAPI')
  var ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
  var Component = Java.loadClass('net.minecraft.network.chat.Component')

  var NAMESPACE = 'mago_skill'

  var SPECIALIZATION_IDS = [
    'warrior_attack',
    'mage',
    'gunner',
    'archer'
  ]

  var SPECIALIZATION_NAMES = {
    warrior_attack: '공격계 전사',
    mage: '마법사',
    gunner: '거너',
    archer: '궁수'
  }

  // Archer deliberately has no active tag.
  var TAG_IDS = [
    'warrior_attack',
    'mage',
    'gunner'
  ]

  var ACTIVE_TAGS = {
    warrior_attack: 'mago_warrior_attack_active',
    mage: 'mago_mage_active',
    gunner: 'mago_gunner_active'
  }

  // Runtime-only warning suppression.
  // Nothing here is persisted to player/world data.
  var warningSeen = {}

  function getPlayerName(player) {
    return String(player.getGameProfile().getName())
  }

  function getErrorText(error) {
    if (error == null) {
      return '알 수 없는 오류'
    }

    if (error.message != null) {
      return String(error.message)
    }

    return String(error)
  }

  // ---------------------------------------------------------------------------
  // Puffish category access
  // ---------------------------------------------------------------------------

  function loadCategoryEntries() {
    var entries = []
    var missingIds = []
    var i
    var specializationId
    var key
    var optionalCategory

    for (i = 0; i < SPECIALIZATION_IDS.length; i++) {
      specializationId = SPECIALIZATION_IDS[i]
      key = ResourceLocation.parse(
        NAMESPACE + ':' + specializationId
      )

      optionalCategory = SkillsAPI.getCategory(key)

      if (optionalCategory == null || !optionalCategory.isPresent()) {
        missingIds.push(
          NAMESPACE + ':' + specializationId
        )
      } else {
        entries.push({
          id: specializationId,
          api: optionalCategory.get()
        })
      }
    }

    if (missingIds.length > 0) {
      throw new Error(
        'Puffish Category 누락: ' + missingIds.join(', ')
      )
    }

    return entries
  }

  function readUnlockState(player, entries) {
    var state = {}
    var i
    var entry

    for (i = 0; i < entries.length; i++) {
      entry = entries[i]
      state[entry.id] = Boolean(
        entry.api.isUnlocked(player)
      )
    }

    return state
  }

  function getActiveIds(state) {
    var result = []
    var i
    var specializationId

    for (i = 0; i < SPECIALIZATION_IDS.length; i++) {
      specializationId = SPECIALIZATION_IDS[i]

      if (state[specializationId] === true) {
        result.push(specializationId)
      }
    }

    return result
  }

  // ---------------------------------------------------------------------------
  // Active tags
  // ---------------------------------------------------------------------------

  function readActiveTags(player) {
    var result = {}
    var playerTags = player.getTags()
    var i
    var specializationId
    var tagName

    for (i = 0; i < TAG_IDS.length; i++) {
      specializationId = TAG_IDS[i]
      tagName = ACTIVE_TAGS[specializationId]

      result[specializationId] =
        playerTags.contains(tagName)
    }

    return result
  }

  function getExpectedTags(selectedId) {
    return {
      warrior_attack:
        selectedId === 'warrior_attack',

      mage:
        selectedId === 'mage',

      gunner:
        selectedId === 'gunner'
    }
  }

  function writeActiveTags(player, desired) {
    var playerTags = player.getTags()
    var i
    var specializationId
    var tagName

    // First remove tags that should no longer exist.
    // This avoids briefly exposing two specialization access tags.
    for (i = 0; i < TAG_IDS.length; i++) {
      specializationId = TAG_IDS[i]
      tagName = ACTIVE_TAGS[specializationId]

      if (
        desired[specializationId] !== true &&
        playerTags.contains(tagName)
      ) {
        player.removeTag(tagName)
      }
    }

    // Then add the desired tag.
    for (i = 0; i < TAG_IDS.length; i++) {
      specializationId = TAG_IDS[i]
      tagName = ACTIVE_TAGS[specializationId]

      if (
        desired[specializationId] === true &&
        !player.getTags().contains(tagName)
      ) {
        player.addTag(tagName)
      }
    }
  }

  function assertActiveTags(player, desired) {
    var actual = readActiveTags(player)
    var i
    var specializationId

    for (i = 0; i < TAG_IDS.length; i++) {
      specializationId = TAG_IDS[i]

      if (
        actual[specializationId] !==
        desired[specializationId]
      ) {
        throw new Error(
          '활성 태그 동기화 실패: ' +
          ACTIVE_TAGS[specializationId]
        )
      }
    }
  }

  // ---------------------------------------------------------------------------
  // State verification
  // ---------------------------------------------------------------------------

  function assertSingleSelection(state, selectedId) {
    var i
    var specializationId
    var expected

    for (i = 0; i < SPECIALIZATION_IDS.length; i++) {
      specializationId = SPECIALIZATION_IDS[i]
      expected = specializationId === selectedId

      if (state[specializationId] !== expected) {
        throw new Error(
          'Category 전환 검증 실패: ' +
          specializationId
        )
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Rollback
  // ---------------------------------------------------------------------------

  function restoreSnapshot(
    player,
    entries,
    oldUnlockState,
    oldTagState
  ) {
    var errors = []
    var i
    var entry
    var restoredState
    var specializationId

    // First lock things that were originally locked.
    for (i = 0; i < entries.length; i++) {
      entry = entries[i]

      try {
        if (
          oldUnlockState[entry.id] !== true &&
          entry.api.isUnlocked(player)
        ) {
          entry.api.lock(player)
        }
      } catch (error) {
        errors.push(
          entry.id +
          ' 잠금 복구: ' +
          getErrorText(error)
        )
      }
    }

    // Then restore originally unlocked entries.
    for (i = 0; i < entries.length; i++) {
      entry = entries[i]

      try {
        if (
          oldUnlockState[entry.id] === true &&
          !entry.api.isUnlocked(player)
        ) {
          entry.api.unlock(player)
        }
      } catch (error) {
        errors.push(
          entry.id +
          ' 해금 복구: ' +
          getErrorText(error)
        )
      }
    }

    try {
      writeActiveTags(player, oldTagState)
      assertActiveTags(player, oldTagState)
    } catch (error) {
      errors.push(
        '태그 복구: ' +
        getErrorText(error)
      )
    }

    try {
      restoredState =
        readUnlockState(player, entries)

      for (
        i = 0;
        i < SPECIALIZATION_IDS.length;
        i++
      ) {
        specializationId =
          SPECIALIZATION_IDS[i]

        if (
          restoredState[specializationId] !==
          oldUnlockState[specializationId]
        ) {
          errors.push(
            specializationId +
            ' Category 상태 불일치'
          )
        }
      }
    } catch (error) {
      errors.push(
        '상태 재검증: ' +
        getErrorText(error)
      )
    }

    return errors
  }

  // ---------------------------------------------------------------------------
  // Selection transition
  // ---------------------------------------------------------------------------

  function changeSelection(
    player,
    selectedId,
    entries
  ) {
    var oldUnlockState =
      readUnlockState(player, entries)

    var oldTagState =
      readActiveTags(player)

    var stage = '기존 상태 확인'
    var i
    var entry
    var desiredTags
    var rollbackErrors

    try {
      stage = '기존 전문화 잠금'

      for (i = 0; i < entries.length; i++) {
        entry = entries[i]

        if (
          entry.id !== selectedId &&
          entry.api.isUnlocked(player)
        ) {
          entry.api.lock(player)
        }
      }

      stage = '선택 전문화 해금'

      if (selectedId != null) {
        for (i = 0; i < entries.length; i++) {
          entry = entries[i]

          if (
            entry.id === selectedId &&
            !entry.api.isUnlocked(player)
          ) {
            entry.api.unlock(player)
          }
        }
      }

      stage = 'Category 상태 검증'

      assertSingleSelection(
        readUnlockState(player, entries),
        selectedId
      )

      stage = '활성 태그 동기화'

      desiredTags =
        getExpectedTags(selectedId)

      writeActiveTags(
        player,
        desiredTags
      )

      assertActiveTags(
        player,
        desiredTags
      )

      stage = '최종 상태 검증'

      assertSingleSelection(
        readUnlockState(player, entries),
        selectedId
      )

      return {
        ok: true
      }
    } catch (error) {
      console.error(
        '[MagoCombat] ' +
        getPlayerName(player) +
        ' 전환 실패 (' +
        stage +
        '): ' +
        getErrorText(error)
      )

      rollbackErrors =
        restoreSnapshot(
          player,
          entries,
          oldUnlockState,
          oldTagState
        )

      if (rollbackErrors.length > 0) {
        console.error(
          '[MagoCombat] 복구 미완료: ' +
          rollbackErrors.join('; ')
        )

        return {
          ok: false,
          reason:
            stage +
            ': ' +
            getErrorText(error),

          rollback:
            '일부 복구 실패. 로그 확인: ' +
            rollbackErrors.join('; ')
        }
      }

      return {
        ok: false,
        reason:
          stage +
          ': ' +
          getErrorText(error),

        rollback:
          '이전 Category 및 태그 상태 복구 완료'
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Command helpers
  // ---------------------------------------------------------------------------

  function respond(
    ctx,
    message,
    isError
  ) {
    var component =
      Component.literal(
        '[Mago] ' + message
      )

    if (isError) {
      ctx.source.sendFailure(component)
    } else {
      ctx.source.sendSystemMessage(component)
    }
  }

  function resolvePlayer(
    ctx,
    explicitTarget
  ) {
    if (explicitTarget != null) {
      return explicitTarget
    }

    return ctx.source.player
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  function executeStatus(
    ctx,
    explicitTarget
  ) {
    var player =
      resolvePlayer(
        ctx,
        explicitTarget
      )

    var entries
    var unlockState
    var activeIds
    var currentText
    var i
    var specializationId
    var expectedTags
    var actualTags
    var mismatches

    if (player == null) {
      respond(
        ctx,
        '대상 플레이어를 지정하세요. 콘솔에서는 이름이 필요합니다.',
        true
      )

      return 0
    }

    try {
      entries =
        loadCategoryEntries()

      unlockState =
        readUnlockState(
          player,
          entries
        )

      activeIds =
        getActiveIds(unlockState)

      if (activeIds.length === 0) {
        currentText = '없음'
      } else {
        currentText = ''

        for (
          i = 0;
          i < activeIds.length;
          i++
        ) {
          if (i > 0) {
            currentText += ', '
          }

          currentText +=
            SPECIALIZATION_NAMES[
              activeIds[i]
            ]
        }
      }

      respond(
        ctx,
        getPlayerName(player) +
        '의 전투 전문화: ' +
        currentText,
        false
      )

      for (
        i = 0;
        i < SPECIALIZATION_IDS.length;
        i++
      ) {
        specializationId =
          SPECIALIZATION_IDS[i]

        respond(
          ctx,
          SPECIALIZATION_NAMES[
            specializationId
          ] +
          ': ' +
          (
            unlockState[specializationId]
              ? '활성'
              : '잠김'
          ),
          false
        )
      }

      if (activeIds.length > 1) {
        respond(
          ctx,
          '경고: 전문화가 중복 활성화됐습니다. 명시적으로 하나를 선택하세요.',
          true
        )
      }

      expectedTags =
        getExpectedTags(
          activeIds.length === 1
            ? activeIds[0]
            : null
        )

      actualTags =
        readActiveTags(player)

      mismatches = []

      for (
        i = 0;
        i < TAG_IDS.length;
        i++
      ) {
        specializationId =
          TAG_IDS[i]

        if (
          expectedTags[specializationId] !==
          actualTags[specializationId]
        ) {
          mismatches.push(
            ACTIVE_TAGS[
              specializationId
            ]
          )
        }
      }

      if (mismatches.length > 0) {
        respond(
          ctx,
          '활성 태그 불일치: ' +
          mismatches.join(', '),
          true
        )
      }

      return 1
    } catch (error) {
      respond(
        ctx,
        '상태 조회 실패: ' +
        getErrorText(error),
        true
      )

      return 0
    }
  }

  // ---------------------------------------------------------------------------
  // Selection command
  // ---------------------------------------------------------------------------

  function executeSelection(
    ctx,
    explicitTarget,
    selectedId
  ) {
    var player =
      resolvePlayer(
        ctx,
        explicitTarget
      )

    var entries
    var result
    var message

    if (player == null) {
      respond(
        ctx,
        '대상 플레이어를 지정하세요. 콘솔에서는 이름이 필요합니다.',
        true
      )

      return 0
    }

    if (
      selectedId != null &&
      SPECIALIZATION_IDS.indexOf(
        selectedId
      ) < 0
    ) {
      respond(
        ctx,
        '알 수 없는 전투 전문화: ' +
        selectedId,
        true
      )

      return 0
    }

    try {
      // No player/category mutation happens
      // until every required Puffish category exists.
      entries =
        loadCategoryEntries()

      result =
        changeSelection(
          player,
          selectedId,
          entries
        )

      if (!result.ok) {
        respond(
          ctx,
          '전문화 전환 실패 (' +
          result.reason +
          '). ' +
          result.rollback,
          true
        )

        return 0
      }

      if (selectedId == null) {
        message =
          '모든 전투 전문화 비활성화'
      } else {
        message =
          SPECIALIZATION_NAMES[
            selectedId
          ] +
          ' 활성화'
      }

      respond(
        ctx,
        getPlayerName(player) +
        ': ' +
        message +
        ' (성장 데이터 유지)',
        false
      )

      if (explicitTarget != null) {
        player.tell(
          Component.literal(
            '[Mago] ' +
            message +
            ' (성장 데이터 유지)'
          )
        )
      }

      return 1
    } catch (error) {
      respond(
        ctx,
        '전문화 변경 준비 실패: ' +
        getErrorText(error),
        true
      )

      return 0
    }
  }

  // ---------------------------------------------------------------------------
  // Passive tag reconciliation
  // ---------------------------------------------------------------------------

  function refreshTagsSafely(player) {
    var name
    var entries
    var unlockState
    var activeIds
    var selectedId

    if (player == null) {
      return
    }

    name =
      getPlayerName(player)

    try {
      entries =
        loadCategoryEntries()

      unlockState =
        readUnlockState(
          player,
          entries
        )

      activeIds =
        getActiveIds(unlockState)

      // External command/config produced an ambiguous state.
      // Do not choose a specialization automatically.
      if (activeIds.length > 1) {
        writeActiveTags(
          player,
          getExpectedTags(null)
        )

        if (!warningSeen[name]) {
          console.warn(
            '[MagoCombat] ' +
            name +
            ': 여러 전투 Category가 동시에 활성화되어 ' +
            '태그만 비활성화했습니다 (' +
            activeIds.join(', ') +
            '). /mago_combat <전문화> 로 복구하세요.'
          )

          warningSeen[name] = true
        }

        return
      }

      delete warningSeen[name]

      if (activeIds.length === 1) {
        selectedId = activeIds[0]
      } else {
        selectedId = null
      }

      writeActiveTags(
        player,
        getExpectedTags(selectedId)
      )
    } catch (error) {
      // Never mutate Puffish category states
      // if API/datapack access temporarily fails.
      try {
        writeActiveTags(
          player,
          getExpectedTags(null)
        )
      } catch (ignored) {
        // Intentionally ignored.
      }

      if (!warningSeen[name]) {
        console.warn(
          '[MagoCombat] ' +
          name +
          ': 상태 동기화 보류: ' +
          getErrorText(error)
        )

        warningSeen[name] = true
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  ServerEvents.commandRegistry(function (event) {
    var Commands = event.commands
    var Arguments = event.arguments

    var root =
      Commands.literal('mago_combat')
        .requires(function (source) {
          return source.hasPermission(2)
        })
        .executes(function (ctx) {
          return executeStatus(
            ctx,
            null
          )
        })

    root.then(
      Commands.literal('status')
        .executes(function (ctx) {
          return executeStatus(
            ctx,
            null
          )
        })
        .then(
          Commands.argument(
            'target',
            Arguments.PLAYER.create(event)
          )
            .executes(function (ctx) {
              return executeStatus(
                ctx,
                Arguments.PLAYER.getResult(
                  ctx,
                  'target'
                )
              )
            })
        )
    )

    root.then(
      Commands.literal('warrior_attack')
        .executes(function (ctx) {
          return executeSelection(
            ctx,
            null,
            'warrior_attack'
          )
        })
        .then(
          Commands.argument(
            'target',
            Arguments.PLAYER.create(event)
          )
            .executes(function (ctx) {
              return executeSelection(
                ctx,
                Arguments.PLAYER.getResult(
                  ctx,
                  'target'
                ),
                'warrior_attack'
              )
            })
        )
    )

    root.then(
      Commands.literal('mage')
        .executes(function (ctx) {
          return executeSelection(
            ctx,
            null,
            'mage'
          )
        })
        .then(
          Commands.argument(
            'target',
            Arguments.PLAYER.create(event)
          )
            .executes(function (ctx) {
              return executeSelection(
                ctx,
                Arguments.PLAYER.getResult(
                  ctx,
                  'target'
                ),
                'mage'
              )
            })
        )
    )

    root.then(
      Commands.literal('gunner')
        .executes(function (ctx) {
          return executeSelection(
            ctx,
            null,
            'gunner'
          )
        })
        .then(
          Commands.argument(
            'target',
            Arguments.PLAYER.create(event)
          )
            .executes(function (ctx) {
              return executeSelection(
                ctx,
                Arguments.PLAYER.getResult(
                  ctx,
                  'target'
                ),
                'gunner'
              )
            })
        )
    )

    root.then(
      Commands.literal('archer')
        .executes(function (ctx) {
          return executeSelection(
            ctx,
            null,
            'archer'
          )
        })
        .then(
          Commands.argument(
            'target',
            Arguments.PLAYER.create(event)
          )
            .executes(function (ctx) {
              return executeSelection(
                ctx,
                Arguments.PLAYER.getResult(
                  ctx,
                  'target'
                ),
                'archer'
              )
            })
        )
    )

    root.then(
      Commands.literal('none')
        .executes(function (ctx) {
          return executeSelection(
            ctx,
            null,
            null
          )
        })
        .then(
          Commands.argument(
            'target',
            Arguments.PLAYER.create(event)
          )
            .executes(function (ctx) {
              return executeSelection(
                ctx,
                Arguments.PLAYER.getResult(
                  ctx,
                  'target'
                ),
                null
              )
            })
        )
    )

    event.register(root)
  })

  // ---------------------------------------------------------------------------
  // Periodic reconciliation
  // ---------------------------------------------------------------------------

  PlayerEvents.tick(function (event) {
    var player = event.player

    if (player == null) {
      return
    }

    // Once per second.
    if (player.tickCount % 20 !== 0) {
      return
    }

    refreshTagsSafely(player)
  })
})()