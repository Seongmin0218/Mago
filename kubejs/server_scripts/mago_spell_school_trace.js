// kubejs/server_scripts/mago_spell_school_trace.js
//
// Iron's Spells 계열 주문의 학파가
// 어디에서 결정/변경되는지 추적하기 위한 진단 스크립트.
//
// 명령어:
//   /mago_trace_school
//
// 로그 검색:
//   MAGO_SCHOOL_TRACE
//
// 비교하는 값:
//
// RAW_DEFAULT
//   spell.getDefaultConfig().schoolResource
//   애드온 주문 클래스가 기본으로 선언한 학파
//
// MANAGER_DEFAULT
//   SpellConfigManager.getSpellDefaultConfigValue(...)
//   Iron's ConfigManager가 보유하는 기본 학파
//
// RUNTIME
//   spell.getSchoolType()
//   실제 게임에서 최종 적용되는 학파
//
// 특히 Lightning 및 Technomancy 관련 주문을 전부 출력한다.


var $MagoTraceSpellRegistry = Java.loadClass(
  'io.redspace.ironsspellbooks.api.registry.SpellRegistry'
)

var $MagoTraceSpellConfigManager = Java.loadClass(
  'io.redspace.ironsspellbooks.api.config.SpellConfigManager'
)

var $MagoTraceSpellConfigParameter = Java.loadClass(
  'io.redspace.ironsspellbooks.api.config.SpellConfigParameter'
)

var $MagoTraceComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)


// ============================================================
// 기본 함수
// ============================================================

function magoTraceLog(message) {
  console.info('[MAGO_SCHOOL_TRACE] ' + message)
}


function magoTraceRegistryToArray(registry) {
  var result = []
  var iterator = registry.iterator()

  while (iterator.hasNext()) {
    result.push(iterator.next())
  }

  return result
}


function magoTraceSpellId(spell) {
  try {
    return String(spell.getSpellId())
  } catch (error1) {
    try {
      var key = $MagoTraceSpellRegistry.REGISTRY.getKey(spell)

      if (key != null) {
        return String(key)
      }
    } catch (error2) {
      // 무시
    }
  }

  return 'unknown'
}


function magoTraceSchoolId(school) {
  try {
    if (school == null) {
      return 'null'
    }

    return String(school.getId())
  } catch (error) {
    return 'error'
  }
}


// ============================================================
// RAW DEFAULT
//
// 애드온 주문 클래스가 getDefaultConfig()에서
// 직접 선언한 schoolResource
// ============================================================

function magoTraceRawDefaultSchool(spell) {
  try {
    var config = spell.getDefaultConfig()

    if (config == null) {
      return 'null'
    }

    if (config.schoolResource == null) {
      return 'null'
    }

    return String(config.schoolResource)
  } catch (error) {
    return 'ERROR:' + String(error)
  }
}


// ============================================================
// CONFIG MANAGER DEFAULT
//
// SpellConfigManager 내부에서 해당 주문에 대해
// 보존하고 있는 기본 학파
// ============================================================

function magoTraceManagerDefaultSchool(spell) {
  try {
    var school =
      $MagoTraceSpellConfigManager.getSpellDefaultConfigValue(
        spell,
        $MagoTraceSpellConfigParameter.SCHOOL
      )

    return magoTraceSchoolId(school)

  } catch (error) {
    return 'ERROR:' + String(error)
  }
}


// ============================================================
// 최종 RUNTIME
//
// 현재 게임이 실제 사용 중인 학파
// ============================================================

function magoTraceRuntimeSchool(spell) {
  try {
    return magoTraceSchoolId(
      spell.getSchoolType()
    )
  } catch (error) {
    return 'ERROR:' + String(error)
  }
}


// ============================================================
// 실제 Java 주문 클래스
// ============================================================

function magoTraceClassName(spell) {
  try {
    return String(
      spell.getClass().getName()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// Namespace
// ============================================================

function magoTraceNamespace(spellId) {
  var text = String(spellId)
  var colon = text.indexOf(':')

  if (colon < 0) {
    return 'unknown'
  }

  return text.substring(0, colon)
}


// ============================================================
// 우리가 특별히 추적할 Technomancy 후보
// ============================================================

function magoTraceIsImportantTechSpell(spellId) {

  var important = {
    'traveloptics:mechanized_predator': true,
    'traveloptics:death_laser': true,
    'traveloptics:em_pulse': true,
    'traveloptics:rapid_laser': true
  }

  return important[String(spellId)] === true
}


// ============================================================
// 출력 대상 여부
//
// 1. Runtime Lightning
// 2. 어느 단계든 Technomancy
// 3. 중요 기계 주문
// ============================================================

function magoTraceShouldPrint(
  spellId,
  rawDefault,
  managerDefault,
  runtimeSchool
) {

  if (
    runtimeSchool === 'irons_spellbooks:lightning'
  ) {
    return true
  }

  if (
    String(rawDefault).indexOf('technomancy') >= 0
  ) {
    return true
  }

  if (
    String(managerDefault).indexOf('technomancy') >= 0
  ) {
    return true
  }

  if (
    String(runtimeSchool).indexOf('technomancy') >= 0
  ) {
    return true
  }

  if (
    magoTraceIsImportantTechSpell(spellId)
  ) {
    return true
  }

  return false
}


// ============================================================
// 진단 판정
// ============================================================

function magoTraceDiagnosis(
  rawDefault,
  managerDefault,
  runtimeSchool
) {

  // 세 값이 완전히 동일
  if (
    rawDefault === managerDefault &&
    managerDefault === runtimeSchool
  ) {

    if (
      runtimeSchool === 'irons_spellbooks:lightning'
    ) {
      return 'RAW_DEFAULT_ALREADY_LIGHTNING'
    }

    if (
      String(runtimeSchool).indexOf('technomancy') >= 0
    ) {
      return 'TECHNOMANCY_FROM_SOURCE'
    }

    return 'UNCHANGED'
  }


  // 원본과 Manager 기본값은 같은데
  // 최종 Runtime만 달라짐
  if (
    rawDefault === managerDefault &&
    managerDefault !== runtimeSchool
  ) {
    return 'RUNTIME_OVERRIDE_AFTER_DEFAULT'
  }


  // 원본과 Manager 기본값부터 다름
  if (
    rawDefault !== managerDefault
  ) {
    return 'MANAGER_DEFAULT_CHANGED'
  }


  return 'UNKNOWN'
}


// ============================================================
// 메인 실행
// ============================================================

function magoRunSchoolTrace(ctx) {

  try {

    var spellList =
      magoTraceRegistryToArray(
        $MagoTraceSpellRegistry.REGISTRY
      )


    spellList.sort(function(a, b) {

      var aId = magoTraceSpellId(a)
      var bId = magoTraceSpellId(b)

      if (aId < bId) return -1
      if (aId > bId) return 1

      return 0
    })


    var printedCount = 0

    var rawLightningCount = 0
    var runtimeOverrideCount = 0
    var managerChangedCount = 0

    var technomancyRuntimeCount = 0

    var i


    magoTraceLog(
      '============================================================'
    )

    magoTraceLog('BEGIN')

    magoTraceLog(
      '============================================================'
    )


    for (
      i = 0;
      i < spellList.length;
      i++
    ) {

      var spell =
        spellList[i]

      var spellId =
        magoTraceSpellId(spell)

      var namespace =
        magoTraceNamespace(spellId)

      var className =
        magoTraceClassName(spell)

      var rawDefault =
        magoTraceRawDefaultSchool(spell)

      var managerDefault =
        magoTraceManagerDefaultSchool(spell)

      var runtimeSchool =
        magoTraceRuntimeSchool(spell)

      var diagnosis =
        magoTraceDiagnosis(
          rawDefault,
          managerDefault,
          runtimeSchool
        )


      if (
        runtimeSchool.indexOf('technomancy') >= 0
      ) {
        technomancyRuntimeCount++
      }


      if (
        diagnosis ===
        'RAW_DEFAULT_ALREADY_LIGHTNING'
      ) {
        rawLightningCount++
      }

      if (
        diagnosis ===
        'RUNTIME_OVERRIDE_AFTER_DEFAULT'
      ) {
        runtimeOverrideCount++
      }

      if (
        diagnosis ===
        'MANAGER_DEFAULT_CHANGED'
      ) {
        managerChangedCount++
      }


      if (
        !magoTraceShouldPrint(
          spellId,
          rawDefault,
          managerDefault,
          runtimeSchool
        )
      ) {
        continue
      }


      printedCount++


      var important =
        magoTraceIsImportantTechSpell(
          spellId
        )


      magoTraceLog(
        'SPELL' +
        '|important=' + important +
        '|id=' + spellId +
        '|namespace=' + namespace +
        '|class=' + className +
        '|raw_default=' + rawDefault +
        '|manager_default=' + managerDefault +
        '|runtime=' + runtimeSchool +
        '|diagnosis=' + diagnosis
      )
    }


    // ========================================================
    // 핵심 주문만 다시 별도 출력
    // ========================================================

    magoTraceLog(
      '------------------------------------------------------------'
    )

    magoTraceLog(
      'IMPORTANT_TECH_SPELLS'
    )


    for (
      i = 0;
      i < spellList.length;
      i++
    ) {

      var importantSpell =
        spellList[i]

      var importantSpellId =
        magoTraceSpellId(importantSpell)


      if (
        !magoTraceIsImportantTechSpell(
          importantSpellId
        )
      ) {
        continue
      }


      var importantRaw =
        magoTraceRawDefaultSchool(
          importantSpell
        )

      var importantManager =
        magoTraceManagerDefaultSchool(
          importantSpell
        )

      var importantRuntime =
        magoTraceRuntimeSchool(
          importantSpell
        )


      magoTraceLog(
        'TECH_TARGET' +
        '|id=' + importantSpellId +
        '|class=' +
          magoTraceClassName(
            importantSpell
          ) +
        '|raw_default=' +
          importantRaw +
        '|manager_default=' +
          importantManager +
        '|runtime=' +
          importantRuntime +
        '|diagnosis=' +
          magoTraceDiagnosis(
            importantRaw,
            importantManager,
            importantRuntime
          )
      )
    }


    // ========================================================
    // 전체 요약
    // ========================================================

    magoTraceLog(
      '------------------------------------------------------------'
    )

    magoTraceLog(
      'SUMMARY' +
      '|total_spells=' + spellList.length +
      '|printed=' + printedCount +
      '|raw_default_lightning=' +
        rawLightningCount +
      '|runtime_override=' +
        runtimeOverrideCount +
      '|manager_default_changed=' +
        managerChangedCount +
      '|runtime_technomancy=' +
        technomancyRuntimeCount
    )


    magoTraceLog(
      '============================================================'
    )

    magoTraceLog('END')

    magoTraceLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {
        return $MagoTraceComponent.literal(
          '[Mago] 학파 원인 추적 완료. ' +
          '로그에서 MAGO_SCHOOL_TRACE 검색.'
        )
      },
      false
    )


    return 1

  } catch (error) {

    console.error(
      '[MAGO_SCHOOL_TRACE] ERROR: ' +
      String(error)
    )

    try {
      if (
        error != null &&
        error.stack != null
      ) {
        console.error(
          '[MAGO_SCHOOL_TRACE] STACK: ' +
          String(error.stack)
        )
      }
    } catch (ignored) {
      // 무시
    }


    ctx.source.sendFailure(
      $MagoTraceComponent.literal(
        '[Mago] 학파 추적 실패. server.log 확인.'
      )
    )


    return 0
  }
}


// ============================================================
// 명령어 등록
// ============================================================

ServerEvents.commandRegistry(
  function(event) {

    event.register(
      event.commands
        .literal('mago_trace_school')

        .requires(function(source) {
          return source.hasPermission(2)
        })

        .executes(function(ctx) {
          return magoRunSchoolTrace(ctx)
        })
    )
  }
)