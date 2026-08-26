// kubejs/server_scripts/mago_spell_dump.js
//
// Mago Iron's Spells 런타임 덤프 v2
//
// 명령어:
//   /mago_dump_spells
//
// 핵심 변경:
// 1. SpellRegistry 전체를 먼저 순회
// 2. 실제 spell.getSchoolType() 기준으로 그룹화
// 3. 고유 주문 수와 JEI 레벨 엔트리 수를 별도 계산
// 4. 희귀도를 "주문 최소 희귀도"가 아니라 각 주문 레벨별로 계산
// 5. 애드온 namespace별 주문 종류/레벨 엔트리 수 출력
// 6. 주문이 하나도 없는 SchoolRegistry도 마지막에 별도 출력


var $MagoSchoolRegistry = Java.loadClass(
  'io.redspace.ironsspellbooks.api.registry.SchoolRegistry'
)

var $MagoSpellRegistry = Java.loadClass(
  'io.redspace.ironsspellbooks.api.registry.SpellRegistry'
)

var $MagoComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)


// ============================================================
// 기본 함수
// ============================================================

function magoLog(message) {
  console.info('[MAGO_SPELL_DUMP] ' + message)
}


function magoRegistryToArray(registry) {
  var result = []
  var iterator = registry.iterator()

  while (iterator.hasNext()) {
    result.push(iterator.next())
  }

  return result
}


function magoSpellId(spell) {
  try {
    return String(spell.getSpellId())
  } catch (error1) {
    try {
      var key = $MagoSpellRegistry.REGISTRY.getKey(spell)

      if (key != null) {
        return String(key)
      }
    } catch (error2) {
      // 무시
    }
  }

  return 'unknown'
}


function magoSchoolIdFromSpell(spell) {
  try {
    var school = spell.getSchoolType()

    if (school == null) {
      return 'unknown'
    }

    return String(school.getId())
  } catch (error) {
    return 'unknown'
  }
}


function magoSchoolNameFromSpell(spell) {
  try {
    var school = spell.getSchoolType()

    if (school == null) {
      return 'unknown'
    }

    var name = school.getDisplayName()

    if (name == null) {
      return 'unknown'
    }

    return String(name.getString())
  } catch (error) {
    return 'unknown'
  }
}


function magoSchoolId(school) {
  try {
    return String(school.getId())
  } catch (error) {
    return 'unknown'
  }
}


function magoSchoolName(school) {
  try {
    return String(school.getDisplayName().getString())
  } catch (error) {
    return 'unknown'
  }
}


function magoMinLevel(spell) {
  try {
    return Number(spell.getMinLevel())
  } catch (error) {
    return 1
  }
}


function magoMaxLevel(spell) {
  try {
    return Number(spell.getMaxLevel())
  } catch (error) {
    return 1
  }
}


function magoEnabled(spell) {
  try {
    return Boolean(spell.isEnabled())
  } catch (error) {
    return true
  }
}


function magoCastType(spell) {
  try {
    return String(spell.getCastType())
  } catch (error) {
    return 'unknown'
  }
}


function magoRarity(spell, level) {
  try {
    var rarity = spell.getRarity(level)

    if (rarity == null) {
      return 'unknown'
    }

    try {
      return String(rarity.getSerializedName())
    } catch (ignored) {
      return String(rarity).toLowerCase()
    }

  } catch (error) {
    return 'unknown'
  }
}


function magoNamespace(id) {
  var text = String(id)
  var index = text.indexOf(':')

  if (index < 0) {
    return 'unknown'
  }

  return text.substring(0, index)
}


function magoNewRarityCount() {
  return {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    unknown: 0
  }
}


function magoAddRarity(counts, rarity) {
  if (counts[rarity] == null) {
    counts.unknown++
  } else {
    counts[rarity]++
  }
}


// ============================================================
// 실행
// ============================================================

function magoRunDump(ctx) {
  try {

    var spellList =
      magoRegistryToArray($MagoSpellRegistry.REGISTRY)

    var registrySchoolList =
      magoRegistryToArray($MagoSchoolRegistry.REGISTRY)


    // ========================================================
    // 실제 주문 기준으로 학파 생성
    // ========================================================

    var schoolGroups = {}
    var schoolOrder = []

    var i

    for (i = 0; i < spellList.length; i++) {

      var spell = spellList[i]

      var schoolId =
        magoSchoolIdFromSpell(spell)

      var schoolName =
        magoSchoolNameFromSpell(spell)


      if (schoolGroups[schoolId] == null) {

        schoolGroups[schoolId] = {
          id: schoolId,
          name: schoolName,
          spells: []
        }

        schoolOrder.push(schoolId)
      }


      schoolGroups[schoolId].spells.push(spell)
    }


    schoolOrder.sort()


    // ========================================================
    // 전체 통계
    // ========================================================

    var totalUniqueSpells = 0
    var totalEnabledUniqueSpells = 0

    var totalLevelEntries = 0
    var totalEnabledLevelEntries = 0

    var totalRarityCounts =
      magoNewRarityCount()


    magoLog(
      '============================================================'
    )

    magoLog('BEGIN')

    magoLog(
      '============================================================'
    )


    // ========================================================
    // 학파별 분석
    // ========================================================

    var schoolIndex

    for (
      schoolIndex = 0;
      schoolIndex < schoolOrder.length;
      schoolIndex++
    ) {

      var currentSchoolId =
        schoolOrder[schoolIndex]

      var group =
        schoolGroups[currentSchoolId]

      var currentSpellList =
        group.spells


      currentSpellList.sort(function(a, b) {

        var aId = magoSpellId(a)
        var bId = magoSpellId(b)

        if (aId < bId) return -1
        if (aId > bId) return 1

        return 0
      })


      var uniqueCount =
        currentSpellList.length

      var enabledUniqueCount = 0

      var levelEntryCount = 0
      var enabledLevelEntryCount = 0

      var rarityCounts =
        magoNewRarityCount()

      var namespaceStats = {}


      // ------------------------------------------------------
      // 주문별 계산
      // ------------------------------------------------------

      var spellIndex

      for (
        spellIndex = 0;
        spellIndex < currentSpellList.length;
        spellIndex++
      ) {

        var currentSpell =
          currentSpellList[spellIndex]

        var spellId =
          magoSpellId(currentSpell)

        var namespace =
          magoNamespace(spellId)

        var enabled =
          magoEnabled(currentSpell)

        var minLevel =
          magoMinLevel(currentSpell)

        var maxLevel =
          magoMaxLevel(currentSpell)

        var levels =
          maxLevel - minLevel + 1


        levelEntryCount += levels

        totalLevelEntries += levels


        if (enabled) {
          enabledUniqueCount++
          enabledLevelEntryCount += levels

          totalEnabledUniqueSpells++
          totalEnabledLevelEntries += levels
        }


        // namespace 생성
        if (namespaceStats[namespace] == null) {

          namespaceStats[namespace] = {
            unique: 0,
            levels: 0,
            enabledUnique: 0,
            enabledLevels: 0
          }
        }


        namespaceStats[namespace].unique++
        namespaceStats[namespace].levels += levels


        if (enabled) {

          namespaceStats[namespace].enabledUnique++

          namespaceStats[namespace].enabledLevels +=
            levels
        }


        // ----------------------------------------------------
        // 주문 요약
        // ----------------------------------------------------

        magoLog(
          'SPELL' +
          '|school=' + currentSchoolId +
          '|namespace=' + namespace +
          '|id=' + spellId +
          '|enabled=' + enabled +
          '|cast_type=' + magoCastType(currentSpell) +
          '|min_level=' + minLevel +
          '|max_level=' + maxLevel +
          '|jei_entries=' + levels
        )


        // ----------------------------------------------------
        // 레벨별 실제 주문 엔트리
        // ----------------------------------------------------

        var level

        for (
          level = minLevel;
          level <= maxLevel;
          level++
        ) {

          var rarity =
            magoRarity(currentSpell, level)


          if (enabled) {

            magoAddRarity(
              rarityCounts,
              rarity
            )

            magoAddRarity(
              totalRarityCounts,
              rarity
            )
          }


          magoLog(
            'SPELL_LEVEL' +
            '|school=' + currentSchoolId +
            '|id=' + spellId +
            '|level=' + level +
            '|rarity=' + rarity +
            '|enabled=' + enabled
          )
        }
      }


      totalUniqueSpells += uniqueCount


      // ======================================================
      // 학파 요약
      // ======================================================

      magoLog(
        '------------------------------------------------------------'
      )

      magoLog(
        'SCHOOL_SUMMARY' +
        '|id=' + currentSchoolId +
        '|name=' + group.name +
        '|unique_spells=' + uniqueCount +
        '|enabled_unique_spells=' + enabledUniqueCount +
        '|jei_entries=' + levelEntryCount +
        '|enabled_jei_entries=' + enabledLevelEntryCount +
        '|common=' + rarityCounts.common +
        '|uncommon=' + rarityCounts.uncommon +
        '|rare=' + rarityCounts.rare +
        '|epic=' + rarityCounts.epic +
        '|legendary=' + rarityCounts.legendary +
        '|unknown=' + rarityCounts.unknown
      )


      // ======================================================
      // 해당 학파의 애드온별 기여도
      // ======================================================

      var namespaceList =
        Object.keys(namespaceStats)

      namespaceList.sort()

      var namespaceIndex

      for (
        namespaceIndex = 0;
        namespaceIndex < namespaceList.length;
        namespaceIndex++
      ) {

        var currentNamespace =
          namespaceList[namespaceIndex]

        var stat =
          namespaceStats[currentNamespace]


        magoLog(
          'SCHOOL_NAMESPACE' +
          '|school=' + currentSchoolId +
          '|namespace=' + currentNamespace +
          '|unique_spells=' + stat.unique +
          '|jei_entries=' + stat.levels +
          '|enabled_unique_spells=' + stat.enabledUnique +
          '|enabled_jei_entries=' + stat.enabledLevels
        )
      }
    }


    // ========================================================
    // 주문이 없는 Registry 학파
    // ========================================================

    magoLog(
      '------------------------------------------------------------'
    )

    magoLog('EMPTY_REGISTERED_SCHOOLS')


    var registryIndex

    for (
      registryIndex = 0;
      registryIndex < registrySchoolList.length;
      registryIndex++
    ) {

      var registrySchool =
        registrySchoolList[registryIndex]

      var registrySchoolId =
        magoSchoolId(registrySchool)


      if (schoolGroups[registrySchoolId] == null) {

        magoLog(
          'EMPTY_SCHOOL' +
          '|id=' + registrySchoolId +
          '|name=' + magoSchoolName(registrySchool)
        )
      }
    }


    // ========================================================
    // 최종 요약
    // ========================================================

    magoLog(
      '------------------------------------------------------------'
    )

    magoLog(
      'TOTAL_RARITY' +
      '|common=' + totalRarityCounts.common +
      '|uncommon=' + totalRarityCounts.uncommon +
      '|rare=' + totalRarityCounts.rare +
      '|epic=' + totalRarityCounts.epic +
      '|legendary=' + totalRarityCounts.legendary +
      '|unknown=' + totalRarityCounts.unknown
    )


    magoLog(
      'TOTAL_SUMMARY' +
      '|schools_with_spells=' + schoolOrder.length +
      '|registered_schools=' + registrySchoolList.length +
      '|unique_spells=' + totalUniqueSpells +
      '|enabled_unique_spells=' + totalEnabledUniqueSpells +
      '|jei_entries=' + totalLevelEntries +
      '|enabled_jei_entries=' + totalEnabledLevelEntries
    )


    magoLog(
      '============================================================'
    )

    magoLog('END')

    magoLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {

        return $MagoComponent.literal(
          '[Mago] 마법 덤프 완료. ' +
          '고유 주문 ' + totalUniqueSpells +
          '종 / JEI 레벨 엔트리 ' +
          totalEnabledLevelEntries +
          '개. 로그에서 MAGO_SPELL_DUMP 검색.'
        )
      },
      false
    )


    return 1


  } catch (error) {

    console.error(
      '[MAGO_SPELL_DUMP] ERROR: ' +
      String(error)
    )


    ctx.source.sendFailure(
      $MagoComponent.literal(
        '[Mago] 덤프 실패. server.log 확인.'
      )
    )


    return 0
  }
}


// ============================================================
// 명령어
// ============================================================

ServerEvents.commandRegistry(function(event) {

  event.register(
    event.commands
      .literal('mago_dump_spells')

      .requires(function(source) {
        return source.hasPermission(2)
      })

      .executes(function(ctx) {
        return magoRunDump(ctx)
      })
  )

})