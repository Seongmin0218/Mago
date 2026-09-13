// kubejs/server_scripts/mago_spell_dump.js
//
// Mago Iron's Spells 런타임 덤프 v3
//
// 명령어:
//   /mago_dump_spells
//
// 로그 검색:
//   MAGO_SPELL_DUMP
//
// 목적:
// 1. SpellRegistry 전체 주문의 정확한 namespace:id 확인
// 2. 실제 표시 이름 및 translation/component ID 확인
// 3. 주문 클래스 확인
// 4. 원본 학파 / Manager 기본 학파 / 실제 Runtime 학파 비교
// 5. enabled / allow_crafting 상태 비교
// 6. 학파 이전 및 삭제 작업 전 기준 데이터 생성
// 7. 학파별 / namespace별 통계 생성


var $MagoSchoolRegistry = Java.loadClass(
  'io.redspace.ironsspellbooks.api.registry.SchoolRegistry'
)

var $MagoSpellRegistry = Java.loadClass(
  'io.redspace.ironsspellbooks.api.registry.SpellRegistry'
)

var $MagoSpellConfigManager = Java.loadClass(
  'io.redspace.ironsspellbooks.api.config.SpellConfigManager'
)

var $MagoSpellConfigParameter = Java.loadClass(
  'io.redspace.ironsspellbooks.api.config.SpellConfigParameter'
)

var $MagoComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)


// ============================================================
// 기본 함수
// ============================================================

function magoLog(message) {
  console.info(
    '[MAGO_SPELL_DUMP] ' + message
  )
}


function magoRegistryToArray(registry) {
  var result = []
  var iterator = registry.iterator()

  while (iterator.hasNext()) {
    result.push(iterator.next())
  }

  return result
}


// 로그 파싱이 깨지지 않게 문자열 정리
function magoSafeText(value) {
  if (value == null) {
    return 'null'
  }

  return String(value)
    .replace(/\|/g, '/')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
}


// ============================================================
// Spell 정보
// ============================================================

function magoSpellId(spell) {
  try {
    return String(
      spell.getSpellId()
    )
  } catch (error1) {
    try {
      var key =
        $MagoSpellRegistry.REGISTRY.getKey(
          spell
        )

      if (key != null) {
        return String(key)
      }
    } catch (error2) {
      // 무시
    }
  }

  return 'unknown'
}


function magoSpellDisplayName(spell) {
  try {
    var name =
      spell.getDisplayName(null)

    if (name == null) {
      return 'unknown'
    }

    return magoSafeText(
      name.getString()
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoSpellComponentId(spell) {
  try {
    return magoSafeText(
      spell.getComponentId()
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoSpellClassName(spell) {
  try {
    return magoSafeText(
      spell.getClass().getName()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// School 정보
// ============================================================

function magoSchoolId(school) {
  try {
    if (school == null) {
      return 'null'
    }

    return String(
      school.getId()
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoSchoolName(school) {
  try {
    if (school == null) {
      return 'null'
    }

    var name =
      school.getDisplayName()

    if (name == null) {
      return 'unknown'
    }

    return magoSafeText(
      name.getString()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ------------------------------------------------------------
// RAW DEFAULT SCHOOL
//
// 주문 클래스의 getDefaultConfig()가 직접 선언한 원본 학파.
// Mago 수정 전 "출신 학파" 판정에 사용.
// ------------------------------------------------------------

function magoRawDefaultSchool(spell) {
  try {
    var config =
      spell.getDefaultConfig()

    if (config == null) {
      return 'null'
    }

    if (config.schoolResource == null) {
      return 'null'
    }

    return String(
      config.schoolResource
    )
  } catch (error) {
    return 'ERROR:' +
      magoSafeText(error)
  }
}


// ------------------------------------------------------------
// MANAGER DEFAULT SCHOOL
//
// SpellConfigManager가 현재 보유한 기본 학파.
//
// 이후 MagoCompat의 ModifyDefaultConfigValuesEvent 등을 통해
// 기본값이 변경되면 RAW_DEFAULT와 달라질 수 있음.
// ------------------------------------------------------------

function magoManagerDefaultSchool(spell) {
  try {
    var school =
      $MagoSpellConfigManager
        .getSpellDefaultConfigValue(
          spell,
          $MagoSpellConfigParameter.SCHOOL
        )

    return magoSchoolId(school)
  } catch (error) {
    return 'ERROR:' +
      magoSafeText(error)
  }
}


// ------------------------------------------------------------
// RUNTIME SCHOOL
//
// 실제 게임에서 spell.getSchoolType()이 반환하는 최종 학파.
//
// JSON spell config 등의 active override까지 반영된
// 최종 결과.
// ------------------------------------------------------------

function magoRuntimeSchool(spell) {
  try {
    return magoSchoolId(
      spell.getSchoolType()
    )
  } catch (error) {
    return 'ERROR:' +
      magoSafeText(error)
  }
}


function magoRuntimeSchoolName(spell) {
  try {
    return magoSchoolName(
      spell.getSchoolType()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// Enabled 정보
// ============================================================

function magoRawDefaultEnabled(spell) {
  try {
    var config =
      spell.getDefaultConfig()

    if (config == null) {
      return 'unknown'
    }

    return Boolean(
      config.enabled
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoManagerDefaultEnabled(spell) {
  try {
    return Boolean(
      $MagoSpellConfigManager
        .getSpellDefaultConfigValue(
          spell,
          $MagoSpellConfigParameter.ENABLED
        )
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoEnabled(spell) {
  try {
    return Boolean(
      spell.isEnabled()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// Allow Crafting 정보
// ============================================================

function magoRawDefaultAllowCrafting(spell) {
  try {
    var config =
      spell.getDefaultConfig()

    if (config == null) {
      return 'unknown'
    }

    return Boolean(
      config.allowCrafting
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoManagerDefaultAllowCrafting(spell) {
  try {
    return Boolean(
      $MagoSpellConfigManager
        .getSpellDefaultConfigValue(
          spell,
          $MagoSpellConfigParameter.ALLOW_CRAFTING
        )
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoAllowCrafting(spell) {
  try {
    return Boolean(
      spell.allowCrafting()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// 기타 주문 정보
// ============================================================

function magoMinLevel(spell) {
  try {
    return Number(
      spell.getMinLevel()
    )
  } catch (error) {
    return 1
  }
}


function magoMaxLevel(spell) {
  try {
    return Number(
      spell.getMaxLevel()
    )
  } catch (error) {
    return 1
  }
}


function magoCastType(spell) {
  try {
    return String(
      spell.getCastType()
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoRarity(spell, level) {
  try {
    var rarity =
      spell.getRarity(level)

    if (rarity == null) {
      return 'unknown'
    }

    try {
      return String(
        rarity.getSerializedName()
      )
    } catch (ignored) {
      return String(
        rarity
      ).toLowerCase()
    }

  } catch (error) {
    return 'unknown'
  }
}


function magoNamespace(id) {
  var text =
    String(id)

  var index =
    text.indexOf(':')

  if (index < 0) {
    return 'unknown'
  }

  return text.substring(
    0,
    index
  )
}


// ============================================================
// 희귀도 통계
// ============================================================

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


function magoAddRarity(
  counts,
  rarity
) {
  if (
    counts[rarity] == null
  ) {
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
      magoRegistryToArray(
        $MagoSpellRegistry.REGISTRY
      )

    var registrySchoolList =
      magoRegistryToArray(
        $MagoSchoolRegistry.REGISTRY
      )


    // ========================================================
    // Runtime 학파 기준 그룹화
    // ========================================================

    var schoolGroups = {}
    var schoolOrder = []

    var i

    for (
      i = 0;
      i < spellList.length;
      i++
    ) {

      var spell =
        spellList[i]

      var schoolId =
        magoRuntimeSchool(spell)

      var schoolName =
        magoRuntimeSchoolName(spell)


      if (
        schoolGroups[schoolId] == null
      ) {

        schoolGroups[schoolId] = {
          id: schoolId,
          name: schoolName,
          spells: []
        }

        schoolOrder.push(
          schoolId
        )
      }


      schoolGroups[schoolId]
        .spells
        .push(spell)
    }


    schoolOrder.sort()


    // ========================================================
    // 전체 통계
    // ========================================================

    var totalUniqueSpells = 0
    var totalEnabledUniqueSpells = 0

    var totalLevelEntries = 0
    var totalEnabledLevelEntries = 0

    var totalDisabledSpells = 0
    var totalCraftingDisabledSpells = 0

    var totalRawToManagerSchoolChanges = 0
    var totalManagerToRuntimeSchoolChanges = 0
    var totalRawToRuntimeSchoolChanges = 0

    var totalRarityCounts =
      magoNewRarityCount()


    magoLog(
      '============================================================'
    )

    magoLog(
      'BEGIN|version=3'
    )

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
        schoolGroups[
          currentSchoolId
        ]

      var currentSpellList =
        group.spells


      currentSpellList.sort(
        function(a, b) {

          var aId =
            magoSpellId(a)

          var bId =
            magoSpellId(b)

          if (aId < bId) {
            return -1
          }

          if (aId > bId) {
            return 1
          }

          return 0
        }
      )


      var uniqueCount =
        currentSpellList.length

      var enabledUniqueCount = 0

      var levelEntryCount = 0
      var enabledLevelEntryCount = 0

      var rarityCounts =
        magoNewRarityCount()

      var namespaceStats = {}


      // ------------------------------------------------------
      // 주문별 분석
      // ------------------------------------------------------

      var spellIndex

      for (
        spellIndex = 0;
        spellIndex <
          currentSpellList.length;
        spellIndex++
      ) {

        var currentSpell =
          currentSpellList[
            spellIndex
          ]


        // ----------------------------------------------------
        // 기본 식별 정보
        // ----------------------------------------------------

        var spellId =
          magoSpellId(
            currentSpell
          )

        var namespace =
          magoNamespace(
            spellId
          )

        var displayName =
          magoSpellDisplayName(
            currentSpell
          )

        var componentId =
          magoSpellComponentId(
            currentSpell
          )

        var className =
          magoSpellClassName(
            currentSpell
          )


        // ----------------------------------------------------
        // School 3단계 비교
        // ----------------------------------------------------

        var rawDefaultSchool =
          magoRawDefaultSchool(
            currentSpell
          )

        var managerDefaultSchool =
          magoManagerDefaultSchool(
            currentSpell
          )

        var runtimeSchool =
          magoRuntimeSchool(
            currentSpell
          )


        var rawToManagerChanged =
          rawDefaultSchool !==
          managerDefaultSchool

        var managerToRuntimeChanged =
          managerDefaultSchool !==
          runtimeSchool

        var rawToRuntimeChanged =
          rawDefaultSchool !==
          runtimeSchool


        if (
          rawToManagerChanged
        ) {
          totalRawToManagerSchoolChanges++
        }

        if (
          managerToRuntimeChanged
        ) {
          totalManagerToRuntimeSchoolChanges++
        }

        if (
          rawToRuntimeChanged
        ) {
          totalRawToRuntimeSchoolChanges++
        }


        // ----------------------------------------------------
        // Enabled 3단계 비교
        // ----------------------------------------------------

        var rawDefaultEnabled =
          magoRawDefaultEnabled(
            currentSpell
          )

        var managerDefaultEnabled =
          magoManagerDefaultEnabled(
            currentSpell
          )

        var enabled =
          magoEnabled(
            currentSpell
          )


        if (
          enabled === false
        ) {
          totalDisabledSpells++
        }


        // ----------------------------------------------------
        // Crafting 3단계 비교
        // ----------------------------------------------------

        var rawDefaultCrafting =
          magoRawDefaultAllowCrafting(
            currentSpell
          )

        var managerDefaultCrafting =
          magoManagerDefaultAllowCrafting(
            currentSpell
          )

        var allowCrafting =
          magoAllowCrafting(
            currentSpell
          )


        if (
          allowCrafting === false
        ) {
          totalCraftingDisabledSpells++
        }


        // ----------------------------------------------------
        // 레벨 정보
        // ----------------------------------------------------

        var minLevel =
          magoMinLevel(
            currentSpell
          )

        var maxLevel =
          magoMaxLevel(
            currentSpell
          )

        var levels =
          maxLevel -
          minLevel +
          1


        levelEntryCount +=
          levels

        totalLevelEntries +=
          levels


        if (
          enabled === true
        ) {
          enabledUniqueCount++

          enabledLevelEntryCount +=
            levels

          totalEnabledUniqueSpells++

          totalEnabledLevelEntries +=
            levels
        }


        // ----------------------------------------------------
        // Namespace 통계
        // ----------------------------------------------------

        if (
          namespaceStats[
            namespace
          ] == null
        ) {

          namespaceStats[
            namespace
          ] = {
            unique: 0,
            levels: 0,
            enabledUnique: 0,
            enabledLevels: 0
          }
        }


        namespaceStats[
          namespace
        ].unique++

        namespaceStats[
          namespace
        ].levels +=
          levels


        if (
          enabled === true
        ) {

          namespaceStats[
            namespace
          ].enabledUnique++

          namespaceStats[
            namespace
          ].enabledLevels +=
            levels
        }


        // ====================================================
        // 주문 핵심 출력
        // ====================================================

        magoLog(
          'SPELL' +

          '|name=' +
          displayName +

          '|id=' +
          spellId +

          '|namespace=' +
          namespace +

          '|component_id=' +
          componentId +

          '|class=' +
          className +

          '|raw_default_school=' +
          rawDefaultSchool +

          '|manager_default_school=' +
          managerDefaultSchool +

          '|runtime_school=' +
          runtimeSchool +

          '|raw_to_manager_school_changed=' +
          rawToManagerChanged +

          '|manager_to_runtime_school_changed=' +
          managerToRuntimeChanged +

          '|school_changed=' +
          rawToRuntimeChanged +

          '|raw_default_enabled=' +
          rawDefaultEnabled +

          '|manager_default_enabled=' +
          managerDefaultEnabled +

          '|enabled=' +
          enabled +

          '|raw_default_allow_crafting=' +
          rawDefaultCrafting +

          '|manager_default_allow_crafting=' +
          managerDefaultCrafting +

          '|allow_crafting=' +
          allowCrafting +

          '|cast_type=' +
          magoCastType(
            currentSpell
          ) +

          '|min_level=' +
          minLevel +

          '|max_level=' +
          maxLevel +

          '|jei_entries=' +
          levels
        )


        // ----------------------------------------------------
        // 레벨별 엔트리
        // ----------------------------------------------------

        var level

        for (
          level = minLevel;
          level <= maxLevel;
          level++
        ) {

          var rarity =
            magoRarity(
              currentSpell,
              level
            )


          if (
            enabled === true
          ) {

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

            '|id=' +
            spellId +

            '|runtime_school=' +
            runtimeSchool +

            '|level=' +
            level +

            '|rarity=' +
            rarity +

            '|enabled=' +
            enabled +

            '|allow_crafting=' +
            allowCrafting
          )
        }
      }


      totalUniqueSpells +=
        uniqueCount


      // ======================================================
      // 학파 요약
      // ======================================================

      magoLog(
        '------------------------------------------------------------'
      )

      magoLog(
        'SCHOOL_SUMMARY' +

        '|id=' +
        currentSchoolId +

        '|name=' +
        group.name +

        '|unique_spells=' +
        uniqueCount +

        '|enabled_unique_spells=' +
        enabledUniqueCount +

        '|jei_entries=' +
        levelEntryCount +

        '|enabled_jei_entries=' +
        enabledLevelEntryCount +

        '|common=' +
        rarityCounts.common +

        '|uncommon=' +
        rarityCounts.uncommon +

        '|rare=' +
        rarityCounts.rare +

        '|epic=' +
        rarityCounts.epic +

        '|legendary=' +
        rarityCounts.legendary +

        '|unknown=' +
        rarityCounts.unknown
      )


      // ======================================================
      // 해당 학파의 Namespace별 기여도
      // ======================================================

      var namespaceList =
        Object.keys(
          namespaceStats
        )

      namespaceList.sort()


      var namespaceIndex

      for (
        namespaceIndex = 0;
        namespaceIndex <
          namespaceList.length;
        namespaceIndex++
      ) {

        var currentNamespace =
          namespaceList[
            namespaceIndex
          ]

        var stat =
          namespaceStats[
            currentNamespace
          ]


        magoLog(
          'SCHOOL_NAMESPACE' +

          '|school=' +
          currentSchoolId +

          '|namespace=' +
          currentNamespace +

          '|unique_spells=' +
          stat.unique +

          '|jei_entries=' +
          stat.levels +

          '|enabled_unique_spells=' +
          stat.enabledUnique +

          '|enabled_jei_entries=' +
          stat.enabledLevels
        )
      }
    }


    // ========================================================
    // 주문이 없는 등록 학파
    // ========================================================

    magoLog(
      '------------------------------------------------------------'
    )

    magoLog(
      'EMPTY_REGISTERED_SCHOOLS'
    )


    var registryIndex

    for (
      registryIndex = 0;
      registryIndex <
        registrySchoolList.length;
      registryIndex++
    ) {

      var registrySchool =
        registrySchoolList[
          registryIndex
        ]

      var registrySchoolId =
        magoSchoolId(
          registrySchool
        )


      if (
        schoolGroups[
          registrySchoolId
        ] == null
      ) {

        magoLog(
          'EMPTY_SCHOOL' +

          '|id=' +
          registrySchoolId +

          '|name=' +
          magoSchoolName(
            registrySchool
          )
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

      '|common=' +
      totalRarityCounts.common +

      '|uncommon=' +
      totalRarityCounts.uncommon +

      '|rare=' +
      totalRarityCounts.rare +

      '|epic=' +
      totalRarityCounts.epic +

      '|legendary=' +
      totalRarityCounts.legendary +

      '|unknown=' +
      totalRarityCounts.unknown
    )


    magoLog(
      'POLICY_SUMMARY' +

      '|raw_to_manager_school_changes=' +
      totalRawToManagerSchoolChanges +

      '|manager_to_runtime_school_changes=' +
      totalManagerToRuntimeSchoolChanges +

      '|raw_to_runtime_school_changes=' +
      totalRawToRuntimeSchoolChanges +

      '|disabled_spells=' +
      totalDisabledSpells +

      '|crafting_disabled_spells=' +
      totalCraftingDisabledSpells
    )


    magoLog(
      'TOTAL_SUMMARY' +

      '|schools_with_spells=' +
      schoolOrder.length +

      '|registered_schools=' +
      registrySchoolList.length +

      '|unique_spells=' +
      totalUniqueSpells +

      '|enabled_unique_spells=' +
      totalEnabledUniqueSpells +

      '|jei_entries=' +
      totalLevelEntries +

      '|enabled_jei_entries=' +
      totalEnabledLevelEntries
    )


    magoLog(
      '============================================================'
    )

    magoLog(
      'END|version=3'
    )

    magoLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {

        return $MagoComponent.literal(
          '[Mago] 마법 덤프 v3 완료. ' +
          '고유 주문 ' +
          totalUniqueSpells +
          '종 / 활성 주문 ' +
          totalEnabledUniqueSpells +
          '종 / 학파 변경 감지 ' +
          totalRawToRuntimeSchoolChanges +
          '종. 로그에서 MAGO_SPELL_DUMP 검색.'
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

    try {
      if (
        error != null &&
        error.stack != null
      ) {
        console.error(
          '[MAGO_SPELL_DUMP] STACK: ' +
          String(error.stack)
        )
      }
    } catch (ignored) {
      // 무시
    }


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

ServerEvents.commandRegistry(
  function(event) {

    event.register(
      event.commands
        .literal(
          'mago_dump_spells'
        )

        .requires(
          function(source) {
            return source.hasPermission(
              2
            )
          }
        )

        .executes(
          function(ctx) {
            return magoRunDump(
              ctx
            )
          }
        )
    )
  }
)